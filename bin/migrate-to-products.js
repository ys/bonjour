#!/usr/bin/env node
/**
 * One-off: point shop pages at their Stripe product and move stock to it.
 *
 * For every content/shop/ page with a price_id and no product_id:
 *   - adds product_id: "prod_..." under price_id in the front matter
 *   - copies stock / stock_total from the price metadata to the product
 *     metadata, when the product has none yet
 *
 * Dry run by default, prints what it would do. Needs a key that can write
 * products (secret key, or restricted key with products write).
 *
 *   STRIPE_SECRET_KEY=sk_live_... node bin/migrate-to-products.js
 *   STRIPE_SECRET_KEY=sk_live_... node bin/migrate-to-products.js --write
 */

const fs = require("fs");
const path = require("path");

const write = process.argv.includes("--write");
const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is missing");
  process.exit(1);
}
const stripe = require("stripe")(key);
const SHOP = path.join(__dirname, "../content/shop");

function pages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) return pages(f);
    return e.name.endsWith(".md") ? [f] : [];
  });
}

async function main() {
  for (const file of pages(SHOP)) {
    const text = fs.readFileSync(file, "utf8");
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm || /^product_id:/m.test(fm[1])) continue;
    const line = fm[1].match(/^price_id:\s*"?(price_[A-Za-z0-9]+)"?\s*$/m);
    if (!line) continue;

    const rel = path.relative(process.cwd(), file);
    let price;
    try {
      price = await stripe.prices.retrieve(line[1], { expand: ["product"] });
    } catch (err) {
      console.log(`${rel}: ${err.message}, skipped`);
      continue;
    }
    const product = price.product;
    console.log(`${rel}: ${line[1]} -> ${product.id} (${product.name})`);

    const pm = price.metadata || {};
    const meta = {};
    if ("stock" in pm && !("stock" in (product.metadata || {}))) meta.stock = pm.stock;
    if ("stock_total" in pm && !("stock_total" in (product.metadata || {}))) meta.stock_total = pm.stock_total;
    if (Object.keys(meta).length) {
      console.log(`  stock to product: ${JSON.stringify(meta)}`);
      if (write) await stripe.products.update(product.id, { metadata: meta });
    }

    if (write) {
      const updated = text.replace(line[0], `${line[0]}\nproduct_id: "${product.id}"`);
      fs.writeFileSync(file, updated);
    }
  }
  if (!write) console.log("\nDry run. Add --write to apply.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
