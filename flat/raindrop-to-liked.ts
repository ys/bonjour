/**
 * Turn Raindrop.io favourites (bookmarks tagged ❤️) into the liked list.
 *
 * Writes data/liked.yml (raw Raindrop items) and one page per item in
 * content/bookmarks/<slug>-<id>.md (front matter, then the note or highlights),
 * deleting pages whose item is no longer liked. data/liked.yml is only
 * re-downloaded when it is missing or RAINDROP_FORCE is set.
 *
 * Requires RAINDROP_TOKEN (read from the environment or .env).
 *
 *   deno run --allow-net=api.raindrop.io --allow-read=.env,data,content/bookmarks \
 *     --allow-write=data/liked.yml,content/bookmarks --allow-env flat/raindrop-to-liked.ts
 */

import "jsr:@std/dotenv@0.225/load";
import { parse, stringify } from "jsr:@std/yaml@1";

const API = "https://api.raindrop.io/rest/v1";
const LIKED_FILE = "data/liked.yml";
const BOOKMARKS_DIR = "content/bookmarks";

type Raindrop = {
  _id: number;
  link: string;
  title: string;
  excerpt: string;
  note: string;
  type: string;
  cover: string;
  domain: string;
  created: string;
  collection?: { $id: number };
  highlights?: { text: string }[];
  collection_name?: string | null;
  [key: string]: unknown;
};

async function get<T>(path: string, query: Record<string, string> = {}): Promise<T> {
  const url = `${API}${path}?${new URLSearchParams(query)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${Deno.env.get("RAINDROP_TOKEN")}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return await res.json();
}

async function downloadLiked(): Promise<Raindrop[]> {
  const { items: collections } = await get<{ items: { _id: number; title: string }[] }>("/collections/all");
  const titles = new Map(collections.map((c) => [c._id, c.title]));

  const liked: Raindrop[] = [];
  for (let page = 0;; page++) {
    const { items } = await get<{ items: Raindrop[] }>("/raindrops/0", { search: "❤️", page: String(page) });
    if (items.length === 0) break;
    liked.push(...items);
  }

  for (const l of liked) {
    l.collection_name = titles.get(l.collection?.$id ?? -1) ?? null;
    l.parsed = {};
    console.log(`📄 [${l.collection_name ?? ""}] ${l.title}`);
  }
  await Deno.writeTextFile(LIKED_FILE, stringify(liked));
  return liked;
}

async function readLiked(): Promise<Raindrop[]> {
  const exists = await Deno.stat(LIKED_FILE).then(() => true, () => false);
  if (!exists || Deno.env.get("RAINDROP_FORCE") !== undefined) return await downloadLiked();
  return parse(await Deno.readTextFile(LIKED_FILE)) as Raindrop[];
}

function parameterize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\-_]+/gi, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function frontMatter(l: Raindrop) {
  const highlights = l.highlights ?? [];
  return {
    uuid: l._id,
    bookmarkOf: l.link,
    category: l.type,
    collection: l.collection_name ?? null,
    headImage: l.cover,
    title: l.title,
    domain: l.domain,
    description: l.excerpt || null,
    tags: [],
    date: l.created,
    highlights: highlights.length ? highlights.map((h) => h.text).join("\n") : null,
  };
}

/** The note, or the highlights as quotes when there are any. */
function body(l: Raindrop): string {
  const highlights = l.highlights ?? [];
  if (highlights.length) return "\n\n" + highlights.map((h) => `> ${h.text}`).join("\n\n");
  return `${l.note ?? ""}\n`;
}

const liked = await readLiked();
const written = new Set<string>();

for (const l of liked) {
  console.log(`📄 ${l.title}`);
  const name = `${parameterize(l.title).slice(0, 51)}-${l._id}.md`;
  await Deno.writeTextFile(`${BOOKMARKS_DIR}/${name}`, `---\n${stringify(frontMatter(l))}---\n\n${body(l)}\n`);
  written.add(name);
}

// Anything else is no longer liked, or an old filename for a renamed one
for await (const entry of Deno.readDir(BOOKMARKS_DIR)) {
  if (!entry.name.endsWith(".md") || entry.name === "_index.md" || written.has(entry.name)) continue;
  console.log(`🗑  ${entry.name}`);
  await Deno.remove(`${BOOKMARKS_DIR}/${entry.name}`);
}
