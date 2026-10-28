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

const MIN_COVER_SIZE = 10000; // 10KB – anything smaller is likely a placeholder

async function checkCoverSize(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("image")) return false;
    const contentLength = response.headers.get("content-length");
    if (contentLength) return parseInt(contentLength) > MIN_COVER_SIZE;
    // Redirected images (Open Library) come without a length: download to measure
    const body = await fetch(url).then((r) => r.arrayBuffer());
    return body.byteLength > MIN_COVER_SIZE;
  } catch {
    return false;
  }
}

// Covers that Hardcover lacks, keyed by exact title: found ones are saved here so the
// next run skips the search, and hand-added ones win over everything.
const COVERS_FILE = "./data/books/covers.yaml";
const COVERS: Record<string, string> = (() => {
  try {
    return yaml.load(Deno.readTextFileSync(COVERS_FILE)) ?? {};
  } catch {
    return {};
  }
})();
const OPEN_LIBRARY_HEADERS = { "User-Agent": "bonjour-books (hello@yannickschutz.com)" };

function normalizeTitle(title: string): string {
  return title
    .split(":")[0]
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function findOpenLibraryTitleCover(
  title: string,
  author: string,
): Promise<string> {
  // Last resort for books without a usable ISBN. Only an exact title match counts:
  // a looser one hands volume 1's cover to volumes 2 and 3.
  try {
    const query = new URLSearchParams({
      title: title.split(":")[0],
      author,
      limit: "10",
      fields: "title,cover_i",
    });
    const response = await fetch(`https://openlibrary.org/search.json?${query}`, {
      headers: OPEN_LIBRARY_HEADERS,
    });
    if (!response.ok) return "";
    const { docs = [] } = await response.json();
    for (const doc of docs) {
      if (!doc.cover_i || normalizeTitle(doc.title) !== normalizeTitle(title)) continue;
      const url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      if (await checkCoverSize(url)) return url;
    }
  } catch {
    // ignore
  }
  return "";
}

async function findOpenLibraryCover(isbn: string): Promise<string> {
  // Open Library returns a 302 redirect when a cover exists, 404 otherwise
  try {
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg?default=false`;
    const response = await fetch(url, { redirect: "manual" });
    if (response.status === 302) {
      const location = response.headers.get("location") || "";
      // Return the large variant
      const large = location.replace(/-S\./g, "-L.");
      if (await checkCoverSize(large)) {
        return large;
      }
    }
  } catch {
    // ignore
  }
  return "";
}

async function findGoogleBooksCover(isbn: string): Promise<string> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const response = await fetch(url);
    if (!response.ok) return "";
    const data = await response.json();
    const items = data.items ?? [];
    for (const item of items) {
      const thumbnail = item.volumeInfo?.imageLinks?.thumbnail;
      if (thumbnail) {
        // Google returns http URLs with zoom=1; upgrade to https and bigger zoom
        const large = thumbnail
          .replace("http://", "https://")
          .replace("zoom=1", "zoom=3");
        if (await checkCoverSize(large)) {
          return large;
        }
      }
    }
  } catch {
    // ignore
  }
  return "";
}

async function findAmazonSearchCover(isbn: string): Promise<string> {
  // Scrape Amazon search results page for higher-res cover images via srcset
  try {
    const searchUrl = `https://www.amazon.com/gp/search/ref=sr_adv_b/?search-alias=stripbooks&unfiltered=1&field-isbn=${isbn}&sort=relevanceexprank`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!response.ok) return "";
    const html = await response.text();

    // Extract srcset from s-image elements — pick the highest resolution URL
    const srcsetPattern = /class="s-image"[^>]*srcset="([^"]+)"/g;
    const match = srcsetPattern.exec(html);
    if (!match) return "";

    const srcset = match[1];
    const candidates = srcset
      .split(",")
      .map((s) => s.trim().split(/\s+/))
      .filter((parts) => parts.length === 2)
      .map(([url, descriptor]) => ({
        url,
        scale: parseFloat(descriptor) || 1,
      }))
      .sort((a, b) => b.scale - a.scale);

    for (const { url } of candidates) {
      if (await checkCoverSize(url)) {
        return url;
      }
    }
  } catch {
    // ignore
  }
  return "";
}

async function findCoverUrl(
  isbn: string,
  isbn13: string,
  title: string,
  author: string,
): Promise<string> {
  const id = isbn13 || isbn;

  // 1. Amazon direct image URLs
  const amazonEndpoints = id
    ? [
      `https://images-na.ssl-images-amazon.com/images/P/${id}.01.LZZZZZZZ.jpg`,
      `https://m.media-amazon.com/images/P/${id}.01._SCLZZZZZZZ_SX500_.jpg`,
    ]
    : [];
  for (const url of amazonEndpoints) {
    if (await checkCoverSize(url)) {
      console.log(`  ✅ Found cover via Amazon: ${url.substring(0, 60)}...`);
      return url;
    }
  }

  // 2. Amazon search scrape (higher-res srcset images)
  for (const candidate of [isbn13, isbn].filter(Boolean)) {
    const url = await findAmazonSearchCover(candidate);
    if (url) {
      console.log(
        `  ✅ Found cover via Amazon search: ${url.substring(0, 60)}...`,
      );
      return url;
    }
  }

  // 3. Open Library
  for (const candidate of [isbn13, isbn].filter(Boolean)) {
    const url = await findOpenLibraryCover(candidate);
    if (url) {
      console.log(
        `  ✅ Found cover via Open Library: ${url.substring(0, 60)}...`,
      );
      return url;
    }
  }

  // 4. Google Books
  for (const candidate of [isbn13, isbn].filter(Boolean)) {
    const url = await findGoogleBooksCover(candidate);
    if (url) {
      console.log(
        `  ✅ Found cover via Google Books: ${url.substring(0, 60)}...`,
      );
      return url;
    }
  }

  // 5. Open Library by title and author
  const url = await findOpenLibraryTitleCover(title, author);
  if (url) {
    console.log(`  ✅ Found cover via Open Library title: ${url.substring(0, 60)}...`);
  }
  return url;
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

  // Check if the existing cover is missing or too small, and try the fallbacks
  if (COVERS[title]) {
    coverUrl = COVERS[title];
  } else {
    if (!coverUrl) {
      console.log(`  🔍 No cover for "${title}", searching...`);
      coverUrl = await findCoverUrl(isbn, isbn13, title, author);
      if (coverUrl) COVERS[title] = coverUrl;
      else console.log(`  ❌ No cover found for "${title}"`);
    } else if (!(await checkCoverSize(coverUrl))) {
      console.log(
        `  🔍 Cover too small for "${title}", searching for a better one...`,
      );
      const betterUrl = await findCoverUrl(isbn, isbn13, title, author);
      if (betterUrl) {
        coverUrl = COVERS[title] = betterUrl;
      } else {
        console.log(
          `  ⚠️ Keeping small cover for "${title}" (no better one found)`,
        );
      }
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

  // One at a time: in parallel, the cover searches get us blocked by Open Library
  console.log("Processing books and searching for missing covers...");
  const books: Book[] = [];
  for (const ub of userBooks) {
    const book = await mapUserBook(ub);
    if (book) books.push(book);
  }
  await Deno.writeTextFile(
    COVERS_FILE,
    "# Covers Hardcover lacks, by exact title. Found ones are added by the sync; add any by hand.\n" +
      yaml.dump(Object.fromEntries(Object.entries(COVERS).sort()), { lineWidth: -1 }),
  );

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
