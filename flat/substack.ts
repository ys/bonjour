/**
 * Import public posts from Substack into content/posts/<slug>/index.md.
 *
 * Only posts older than MIN_AGE_DAYS are imported, and posts already on the
 * site (a bundle linking to substack.com/p/<slug>) are skipped. Images are
 * downloaded next to the post and converted to WebP (requires `magick`).
 *
 * Set MAGICK=convert where only ImageMagick 6 is installed (GitHub Actions).
 *
 *   deno run --allow-net --allow-read --allow-write --allow-run --allow-env flat/substack.ts [--dry-run]
 */

import { DOMParser, Element } from "jsr:@b-fuze/deno-dom@0.1.48";
import TurndownService from "https://esm.sh/turndown@7.2.0";

const PUBLICATION = "https://bonjouryannick.substack.com";
const MIN_AGE_DAYS = 7;
const POSTS_DIR = "content/posts";
const dryRun = Deno.args.includes("--dry-run");
const MAGICK = Deno.env.get("MAGICK") ?? "magick";

type ArchivePost = {
  slug: string;
  title: string;
  subtitle: string | null;
  post_date: string;
  audience: string;
  type: string;
  canonical_url: string;
};

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return await res.json();
}

async function fetchArchive(): Promise<ArchivePost[]> {
  const posts: ArchivePost[] = [];
  for (let offset = 0; ; offset += 50) {
    const page = await fetchJSON<ArchivePost[]>(
      `${PUBLICATION}/api/v1/archive?sort=new&limit=50&offset=${offset}`,
    );
    posts.push(...page);
    if (page.length < 50) return posts;
  }
}

async function importedSlugs(): Promise<Set<string>> {
  const slugs = new Set<string>();
  for await (const dir of Deno.readDir(POSTS_DIR)) {
    if (!dir.isDirectory) continue;
    try {
      const md = await Deno.readTextFile(`${POSTS_DIR}/${dir.name}/index.md`);
      for (const m of md.matchAll(/bonjouryannick\.substack\.com\/p\/([\w-]+)/g)) {
        slugs.add(m[1]);
      }
    } catch {
      // bundle without index.md
    }
  }
  return slugs;
}

// substackcdn.com/image/fetch/<transforms>/<encoded original> -> original
function originalImageURL(src: string): string {
  const m = src.match(/substackcdn\.com\/image\/fetch\/[^/]+\/(https?%3A.*)$/);
  return m ? decodeURIComponent(m[1]) : src;
}

function imageAttrs(el: Element): { src: string; alt: string } | null {
  const img = el.querySelector("img");
  if (!img) return null;
  try {
    const attrs = JSON.parse(img.getAttribute("data-attrs") ?? "{}");
    if (attrs.src) return { src: attrs.src, alt: attrs.alt ?? "" };
  } catch {
    // fall through to src
  }
  const src = img.getAttribute("src");
  return src ? { src: originalImageURL(src), alt: img.getAttribute("alt") ?? "" } : null;
}

async function downloadImage(url: string, dir: string, name: string): Promise<string> {
  const file = `${name}.webp`;
  if (dryRun) return file;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const tmp = await Deno.makeTempFile();
  await Deno.writeFile(tmp, new Uint8Array(await res.arrayBuffer()));
  // The site never serves more than 1600px (see responsive-img-data.html)
  const { success } = await new Deno.Command(MAGICK, {
    args: [tmp, "-auto-orient", "-strip", "-resize", "1600x1600>", "-quality", "85", `${dir}/${file}`],
  }).output();
  await Deno.remove(tmp);
  if (!success) throw new Error(`${MAGICK} failed for ${url}`);
  return file;
}

async function toMarkdown(html: string, dir: string): Promise<string> {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html")!;
  const body = doc.body;
  let n = 0;
  const nextName = () => String(++n).padStart(2, "0");

  for (const sel of [
    ".subscription-widget-wrap-editor",
    ".subscription-widget-wrap",
    ".button-wrapper",
    ".captioned-button-wrap",
    ".image-link-expand",
  ]) {
    for (const el of body.querySelectorAll(sel)) el.remove();
  }

  for (const el of body.querySelectorAll(".image-gallery-embed")) {
    const attrs = JSON.parse(el.getAttribute("data-attrs") ?? "{}");
    const images: { src: string }[] = attrs.gallery?.images ?? [];
    const files: string[] = [];
    for (const { src } of images) files.push(await downloadImage(src, dir, nextName()));
    // Placeholder swapped for a {{< row >}} shortcode after turndown
    const p = doc.createElement("p");
    p.textContent = `GALLERYROW ${files.join(" ")}`;
    el.replaceWith(p);
  }

  for (const el of body.querySelectorAll(".captioned-image-container")) {
    const image = imageAttrs(el as Element);
    if (!image) {
      el.remove();
      continue;
    }
    const p = doc.createElement("p");
    const img = doc.createElement("img");
    img.setAttribute("src", await downloadImage(image.src, dir, nextName()));
    img.setAttribute("alt", image.alt);
    p.appendChild(img);
    el.replaceWith(p);
    const caption = el.querySelector("figcaption")?.textContent.trim();
    if (caption) {
      const em = doc.createElement("p");
      em.innerHTML = `<em>${caption}</em>`;
      p.after(em);
    }
  }

  const turndown = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    emDelimiter: "_",
  });
  return turndown
    .turndown(body.innerHTML)
    .replace(/^GALLERYROW (.+)$/gm, (_, files: string) =>
      `{{< row ${files.split(" ").map((f) => `"${f}"`).join(" ")} >}}`)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function yamlString(s: string): string {
  return JSON.stringify(s);
}

const cutoff = Date.now() - MIN_AGE_DAYS * 24 * 60 * 60 * 1000;
const existing = await importedSlugs();
const candidates = (await fetchArchive()).filter((p) =>
  p.type === "newsletter" &&
  p.audience === "everyone" &&
  new Date(p.post_date).getTime() < cutoff &&
  !existing.has(p.slug)
);

if (candidates.length === 0) console.log("Nothing to import.");

for (const { slug } of candidates) {
  const dir = `${POSTS_DIR}/${slug}`;
  try {
    await Deno.stat(dir);
    console.log(`skip ${slug}: ${dir} already exists`);
    continue;
  } catch {
    // free slot
  }

  const post = await fetchJSON<
    ArchivePost & { body_html: string; cover_image: string | null }
  >(`${PUBLICATION}/api/v1/posts/${slug}`);
  console.log(`${dryRun ? "would import" : "import"} ${slug} (${post.post_date.slice(0, 10)})`);
  if (!dryRun) await Deno.mkdir(dir, { recursive: true });

  if (post.cover_image) await downloadImage(post.cover_image, dir, "card");
  const markdown = await toMarkdown(post.body_html, dir);
  const url = `${PUBLICATION}/p/${slug}`;

  const frontmatter = [
    "---",
    `date: ${post.post_date.slice(0, 10)}`,
    `title: ${yamlString(post.title)}`,
    ...(post.subtitle ? [`subtitle: ${yamlString(post.subtitle)}`] : []),
    `canonical: ${url}`,
    "---",
  ].join("\n");

  const content = `${frontmatter}\n\n**First published on [Substack](${url})**\n\n${markdown}\n`;
  if (!dryRun) await Deno.writeTextFile(`${dir}/index.md`, content);
}
