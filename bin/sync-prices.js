#!/usr/bin/env node
/**
 * Pull current prices and stock from Stripe into data/prices.json,
 * so Stripe is the only place where a price is set.
 *
 * Reads every price_id (and price_ids[].value) from content/shop/ front
 * matter, asks Stripe for it and writes what the templates need.
 *
 * If a price was archived and its product now has another default price,
 * the new default is used. So changing a price in Stripe is:
 *   add a new price on the product, make it the default, archive the old one.
 * The front matter can keep the old price_id.
 *
 * Runs before every build (see "prebuild" in package.json). With no live key,
 * or if Stripe can't be reached, it keeps the existing file and the
 * templates fall back to the front matter values.
 *
 *   STRIPE_SECRET_KEY=rk_live_... node bin/sync-prices.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SHOP = path.join(ROOT, "content/shop");
const OUT = path.join(ROOT, "data/prices.json");

const key = process.env.STRIPE_SECRET_KEY;

function log(msg) {
  console.log(`[sync-prices] ${msg}`);
}

// Front matter price ids. testing_price_id is test mode, a live key can't read it.
function collectPriceIds() {
  const ids = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith(".md")) {
        const text = fs.readFileSync(file, "utf8");
        const fm = text.match(/^---\n([\s\S]*?)\n---/);
        if (!fm) continue;
        for (const line of fm[1].split("\n")) {
          if (/^\s*testing_/.test(line)) continue;
          for (const id of line.match(/\bprice_[A-Za-z0-9]{14,}/g) || []) ids.add(id);
        }
      }
    }
  };
  walk(SHOP);
  return [...ids].sort();
}

// 18 -> "18€", 18.5 -> "18,50€"
function formatPrice(amount, currency) {
  const n = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(".", ",");
  const symbols = { EUR: "€", USD: "$", GBP: "£" };
  const c = currency.toUpperCase();
  return c in symbols ? `${n}${symbols[c]}` : `${n} ${c}`;
}

function stock(price) {
  const m = price.metadata || {};
  const out = {};
  if ("stock" in m) {
    out.stock = parseInt(m.stock, 10);
    out.soldout = out.stock <= 0;
  }
  if ("stock_total" in m) out.stock_total = parseInt(m.stock_total, 10);
  return out;
}

async function resolve(stripe, id) {
  let price = await stripe.prices.retrieve(id, { expand: ["product"] });
  const product = price.product;
  const defaultId =
    product && typeof product.default_price === "string"
      ? product.default_price
      : product && product.default_price && product.default_price.id;

  if (!price.active && defaultId && defaultId !== id) {
    const replaced = await stripe.prices.retrieve(defaultId);
    log(`${id} is archived, using ${defaultId} (default price of "${product.name}")`);
    if ("stock" in (price.metadata || {}) && !("stock" in (replaced.metadata || {}))) {
      log(`  warning: ${defaultId} has no stock metadata, copy it from ${id}`);
    }
    price = Object.assign(replaced, { product });
  }

  if (price.unit_amount == null) {
    log(`${id}: no fixed amount, skipped`);
    return null;
  }

  const amount = price.unit_amount / 100;
  return {
    source: id,
    id: price.id,
    amount,
    currency: price.currency.toUpperCase(),
    pricetag: formatPrice(amount, price.currency),
    active: price.active,
    product: product && product.name,
    ...stock(price),
  };
}

async function main() {
  if (!key) return log("no STRIPE_SECRET_KEY, keeping data/prices.json as is");
  if (/^(sk|rk)_test_/.test(key)) return log("test key, keeping data/prices.json as is");

  const stripe = require("stripe")(key);
  const ids = collectPriceIds();
  const prices = [];

  for (const id of ids) {
    try {
      const p = await resolve(stripe, id);
      if (p) prices.push(p);
    } catch (err) {
      log(`${id}: ${err.message}`);
    }
  }

  if (!prices.length) return log("nothing fetched, keeping data/prices.json as is");

  fs.writeFileSync(OUT, JSON.stringify({ prices }, null, 2) + "\n");
  log(`${prices.length}/${ids.length} prices written to data/prices.json`);
}

main().catch((err) => {
  // Never break the build over this: the front matter is the fallback.
  log(`failed: ${err.message}`);
});
