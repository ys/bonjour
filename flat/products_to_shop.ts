/**
 * Generate shop pages from Stripe products (port of bin/products_to_shop).
 *
 * Reads data/stripe.json (produced by bin/stripe_to_data) and, for each
 * product, writes content/shop/<slug>/index.md and downloads the first
 * product image to content/shop/<slug>/cover.jpg.
 *
 * Run from the repo root:
 *   deno run --allow-read=data --allow-write=content/shop --allow-net=files.stripe.com flat/products_to_shop.ts
 */

type StripeProduct = { price_id: string; images: string[]; name: string };

// Like ActiveSupport's parameterize: "Bill's Café" -> "bill-s-cafe".
const slug = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");

const today = new Date().toLocaleDateString("sv-SE"); // local YYYY-MM-DD

function index(p: StripeProduct): string {
  return `---
title: "${p.name}"
grid: "cover"
subtitle: "50€"
price: "50.00"
pricetag: "50€"
emoji: 📷
currency: "EUR"
date: "${today}"
price_id: "${p.price_id}"
---
Limited edition of 5. Signed and numbered.

*50€*

- Print size of 20x30cm. Printed on [Hahnemühle Fine Art Bamboo](https://www.hahnemuehle.com/fr/digital-fineart/les-papiers-a-jet-dencre-fineart/natural-line/p/Product/show/202/1036.html) 290g/m²
- 90% bambou' fibers, 10% cotton
`;
}

const { products }: { products: StripeProduct[] } = JSON.parse(
  await Deno.readTextFile("data/stripe.json"),
);

for (const p of products) {
  const dir = `content/shop/${slug(p.name)}`;
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(`${dir}/index.md`, index(p));
  const res = await fetch(p.images[0]);
  if (!res.ok) throw new Error(`${res.status} for ${p.images[0]}`);
  await Deno.writeFile(`${dir}/cover.jpg`, await res.bytes());
  console.log(dir);
}
