/**
 * Fetch books from Hardcover.app via GraphQL and write the same YAML layout
 * as goodreads.ts (current.yaml, year files) under data/books.
 *
 * Requires HARDCOVER_TOKEN (Bearer token from https://hardcover.app/account/api).
 * Saves the raw API response to data/books/hardcover.json.
 */

import * as yaml from "https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.mjs";
import "https://deno.land/x/lodash@4.17.19/dist/lodash.js";

const _ = (self as any)._;

const HARDCOVER_GRAPHQL = "https://api.hardcover.app/v1/graphql";

type Book = {
  title: string;
  author: string;
  subtitle: string;
  date: Date | string;
  read: Date | string | null;
  rating: number;
  pages: number;
  isbn: string;
  isbn13: string;
  cover_url: string;
  reading: boolean;
  url: string;
};

interface BooksByYear {
  [index: number]: Book[];
}

const BOOKS_QUERY = `
query HardcoverBooks {
  me {
    user_books {
      book_id
      rating
      date_added
      user_book_status {
        slug
      }
      user_book_reads {
        finished_at
      }
      edition {
        isbn_10
        isbn_13
        pages
        release_date
      }
      book {
        title
        subtitle
        slug
        contributions {
          author {
            name
          }
        }
        image {
          url
        }
      }
    }
  }
}
`;

function getToken(): string {
  const token = Deno.env.get("HARDCOVER_TOKEN");
  if (token) return token.trim();
  try {
    return Deno.readTextFileSync("./data/books/.hardcover-token").trim();
  } catch {
    throw new Error(
      "Set HARDCOVER_TOKEN (Bearer token from https://hardcover.app/account/api) or create data/books/.hardcover-token",
    );
  }
}

async function graphql<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(HARDCOVER_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      "User-Agent": "bonjour-books-hardcover/1",
    },
    body: JSON.stringify({ query: query.trim(), variables }),
  });
  if (!res.ok) {
    throw new Error(`Hardcover API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Hardcover GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}

async function findCoverUrl(isbn: string, isbn13: string): Promise<string> {
  // Try multiple Amazon endpoints for cover images
  const endpoints = [
    `https://images-na.ssl-images-amazon.com/images/P/${isbn13 || isbn}.01.LZZZZZZZ.jpg`,
    `https://m.media-amazon.com/images/P/${isbn13 || isbn}.01._SCLZZZZZZZ_SX500_.jpg`,
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentLength = parseInt(
        response.headers.get("content-length") || "0",
      );
      const contentType = response.headers.get("content-type") || "";

      // Real covers are usually > 10KB
      if (
        response.ok &&
        contentType.includes("image") &&
        contentLength > 10000
      ) {
        console.log(`  ✅ Found cover via Amazon: ${url.substring(0, 60)}...`);
        return url;
      }
    } catch {
      // Try next endpoint
    }
  }

  return "";
}

async function mapUserBook(ub: any): Promise<Book | null> {
  const statusSlug = ub.user_book_status?.slug ?? "";
  if (statusSlug === "want-to-read") return null;

  const book = ub.book ?? {};
  const edition = ub.edition ?? {};
  const authors =
    book.contributions?.map((c: any) => c.author?.name).filter(Boolean) ?? [];
  const author = authors[0] ?? "";
  const title = book.title ?? "";
  const subtitle = book.subtitle ?? "";
  const slug = book.slug ?? "";
  let coverUrl = book.image?.url ?? "";

  const readDates = (ub.user_book_reads ?? [])
    .map((r: any) => r.finished_at)
    .filter(Boolean);
  const readAt =
    readDates.length > 0 ? new Date(readDates[readDates.length - 1]) : null;
  const dateAdded = ub.date_added ? new Date(ub.date_added) : new Date();

  const rating = ub.rating != null ? Math.round(Number(ub.rating)) : 0;
  const pages = edition.pages ?? book.pages ?? 0;
  const isbn = edition.isbn_10 ?? "";
  const isbn13 = edition.isbn_13 ?? "";

  // If no cover URL from Hardcover, try to find one from Amazon
  if (!coverUrl && (isbn || isbn13)) {
    console.log(`  🔍 No cover for "${title}", searching...`);
    coverUrl = await findCoverUrl(isbn, isbn13);
    if (!coverUrl) {
      console.log(`  ❌ No cover found for "${title}"`);
    }
  }

  const url = slug ? `https://hardcover.app/books/${slug}` : "";

  return {
    title,
    author,
    subtitle: subtitle || "",
    date: readAt || dateAdded,
    read: readAt,
    rating,
    pages: Number(pages) || 0,
    isbn: String(isbn ?? ""),
    isbn13: String(isbn13 ?? ""),
    cover_url: coverUrl || "",
    reading: readAt == null,
    url,
  };
}

function formatDateForYaml(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

function prepareBooksForYaml(books: Book[]): any[] {
  return books.map((book) => ({
    ...book,
    date: formatDateForYaml(book.date),
    read: formatDateForYaml(book.read),
  }));
}

function yamlReplacer(_key: string, value: any): any {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
    return value;
  return value;
}

async function main() {
  const token = getToken();
  console.log("Fetching books from Hardcover…");

  const data = await graphql<{ me: Array<{ user_books: any[] }> }>(
    token,
    BOOKS_QUERY,
  );

  // Keep original response in data/books
  await Deno.writeTextFile(
    "./data/books/hardcover.json",
    JSON.stringify(data, null, 2),
  );
  console.log("Saved original response to data/books/hardcover.json");

  const userBooks = data?.me?.[0]?.user_books ?? [];

  // Map books sequentially to allow cover searching
  console.log("Processing books and searching for missing covers...");
  const bookPromises = userBooks.map((ub) => mapUserBook(ub));
  const booksWithNull = await Promise.all(bookPromises);
  const books: Book[] = booksWithNull.filter((b): b is Book => b != null);

  console.log(
    `Fetched ${userBooks.length} user_books, ${books.length} after excluding want-to-read`,
  );

  const booksWithReadDate = books.filter((b) => b.read != null);
  const currentlyReading = books.filter((b) => b.read == null);

  const byYear = (b: Book) => {
    const readDate = typeof b.read === "string" ? new Date(b.read) : b.read!;
    return readDate.getFullYear();
  };
  const booksbyyear = _.groupBy(booksWithReadDate, byYear) as BooksByYear;

  const yamlOpts = {
    quotingType: '"' as const,
    forceQuotes: false,
    replacer: yamlReplacer,
  };

  // current.yaml
  const currentForYaml = prepareBooksForYaml(currentlyReading);
  let currentYaml = yaml.dump(
    { current: true, books: currentForYaml },
    yamlOpts,
  );
  currentYaml = currentYaml.replace(/date: "(\d{4}-\d{2}-\d{2})"/g, "date: $1");
  currentYaml = currentYaml.replace(/read: "(\d{4}-\d{2}-\d{2})"/g, "read: $1");
  currentYaml = currentYaml.replace(/read: null/g, "read: null");
  await Deno.writeTextFile("./data/books/current.yaml", currentYaml);
  console.log(
    `Wrote current.yaml with ${currentlyReading.length} book(s) currently reading`,
  );

  // year files
  const years = Object.keys(booksbyyear)
    .map((y) => parseInt(y, 10))
    .sort((a, b) => b - a);
  for (const year of years) {
    const booksForYear = prepareBooksForYaml(booksbyyear[year] ?? []);
    let yamlOut = yaml.dump({ year, books: booksForYear }, yamlOpts);
    yamlOut = yamlOut.replace(/date: "(\d{4}-\d{2}-\d{2})"/g, "date: $1");
    yamlOut = yamlOut.replace(/read: "(\d{4}-\d{2}-\d{2})"/g, "read: $1");
    yamlOut = yamlOut.replace(/read: null/g, "read: null");
    await Deno.writeTextFile(`./data/books/${year}.yaml`, yamlOut);
    console.log(`Wrote ${booksbyyear[year].length} books for year ${year}`);
  }
  console.log(`Done. ${years.length} year(s).`);
}

main().catch((err) => {
  console.error(err);
  Deno.exit(1);
});
