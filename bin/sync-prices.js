#!/usr/bin/env node
/**
 * Pull current prices and stock from Stripe into data/prices.json,
 * so Stripe is the only place where a price is set.
 *
 * Reads every product_id (and older price_id / price_ids[].value) from
 * content/shop/ front matter, asks Stripe for it and writes what the
 * templates need. A product gives its default price and the stock from its
 * metadata. So changing a price in Stripe is: add a new price on the
 * product and make it the default.
 *
 * Runs before every build (see "prebuild" in package.json). With no live key,
 * or if Stripe can't be reached, it keeps the existing file and the
 * templates fall back to the front matter values.
 *
 *   STRIPE_PRICES_KEY=rk_live_... node bin/sync-prices.js   (or STRIPE_SECRET_KEY)
 */

const fs = require("fs");
const path = require("path");

// Local .env if there is one. Never overrides variables already set (Vercel).
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const { resolveItem, stockOf, stockOwner } = require("../api/_price");

const ROOT = path.join(__dirname, "..");
const SHOP = path.join(ROOT, "content/shop");
const OUT = path.join(ROOT, "data/prices.json");

// STRIPE_PRICES_KEY lets local dev keep a test STRIPE_SECRET_KEY for checkout
// while reading live prices with a read-only live key.
const key = process.env.STRIPE_PRICES_KEY || process.env.STRIPE_SECRET_KEY;

function log(msg) {
  console.log(`[sync-prices] ${msg}`);
}

// Front matter product_id / price_id / price_ids values.
// testing_* ids are test mode, a live key can't read them.
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
          for (const id of line.match(/\b(prod|price)_[A-Za-z0-9]{10,}/g) || []) ids.add(id);
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

async function resolve(stripe, id) {
  const item = await resolveItem(stripe, id);
  const { price, product } = item;
  if (price.id !== id && id.startsWith("price_")) {
    log(`${id} is archived, using ${price.id} (default price of "${product.name}")`);
  }
  if (price.unit_amount == null) {
    log(`${id}: no fixed amount, skipped`);
    return null;
  }
  const amount = price.unit_amount / 100;
  const stock = stockOf(item);
  const out = {
    source: id,
    id: price.id,
    product_id: product && product.id,
    amount,
    currency: price.currency.toUpperCase(),
    pricetag: formatPrice(amount, price.currency),
    product: product && product.name,
  };
  if (stockOwner(item)) Object.assign(out, { stock: stock.remaining, soldout: stock.soldout });
  if (stock.stock_total) out.stock_total = stock.stock_total;
  return out;
}

async function main() {
  if (!key) return log("no STRIPE_PRICES_KEY or STRIPE_SECRET_KEY, keeping data/prices.json as is");
  if (/^(sk|rk)_test_/.test(key)) return log("test key, keeping data/prices.json as is (set STRIPE_PRICES_KEY to a live read-only key)");

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
