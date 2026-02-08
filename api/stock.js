const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

function stockFromPrice(price) {
  const remaining =
    price.metadata && "stock" in price.metadata
      ? parseInt(price.metadata.stock, 10)
      : 1;
  const result = { remaining: Math.max(remaining, 0), soldout: remaining <= 0 };
  if (price.metadata && "stock_total" in price.metadata) {
    result.stock_total = parseInt(price.metadata.stock_total, 10);
  }
  return result;
}

module.exports = async (req, res) => {
  const { price_id, price_ids } = req.query;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");

  // Batch mode: ?price_ids=id1,id2,id3
  if (price_ids) {
    const ids = price_ids.split(",").filter(Boolean);
    const prices = await Promise.all(ids.map((id) => stripe.prices.retrieve(id)));
    const results = {};
    prices.forEach((price, i) => {
      results[ids[i]] = stockFromPrice(price);
    });
    res.end(JSON.stringify(results));
    return;
  }

  // Single mode: ?price_id=id (used by product page)
  const price = await stripe.prices.retrieve(price_id);
  res.end(JSON.stringify(stockFromPrice(price)));
};
