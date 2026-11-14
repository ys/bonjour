// Shared by the API functions and bin/sync-prices.js.
//
// A shop item is a Stripe product (prod_...) or, for older pages, a price
// (price_...). For a product, the price is its default price. For a price
// that was archived, the product's default price is used instead.
//
// Stock lives in the product metadata (stock, stock_total). Older items may
// still have it on the price; that is used when the product has none.

// Recent enough for product.default_price. Only used for these reads, so
// the rest of the account (checkout sessions) keeps its API version.
const READ = { apiVersion: "2022-11-15" };

function defaultPriceId(product) {
  if (!product || !product.default_price) return null;
  return typeof product.default_price === "string"
    ? product.default_price
    : product.default_price.id;
}

async function resolveItem(stripe, id) {
  if (id.startsWith("prod_")) {
    const product = await stripe.products.retrieve(id, { expand: ["default_price"] }, READ);
    if (!product.default_price) throw new Error(`${id} has no default price`);
    return { product, price: product.default_price };
  }

  let price = await stripe.prices.retrieve(id, { expand: ["product"] }, READ);
  const product = price.product;
  const defaultId = defaultPriceId(product);
  if (!price.active && defaultId && defaultId !== price.id) {
    price = await stripe.prices.retrieve(defaultId, {}, READ);
  }
  return { product, price };
}

// Where the stock is kept for this item: "product", "price" or null.
function stockOwner({ product, price }) {
  if (product && product.metadata && "stock" in product.metadata) return "product";
  if (price && price.metadata && "stock" in price.metadata) return "price";
  return null;
}

// { remaining, soldout, stock_total? }. No stock metadata means one left.
function stockOf(item) {
  const owner = stockOwner(item);
  const meta = owner ? item[owner].metadata : {};
  const remaining = owner ? parseInt(meta.stock, 10) : 1;
  const result = { remaining: Math.max(remaining, 0), soldout: remaining <= 0 };
  const totalMeta =
    (item.product && item.product.metadata && item.product.metadata.stock_total) ||
    (item.price && item.price.metadata && item.price.metadata.stock_total);
  if (totalMeta) result.stock_total = parseInt(totalMeta, 10);
  return result;
}

module.exports = { resolveItem, stockOwner, stockOf };
