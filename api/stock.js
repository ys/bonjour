const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const { price_id } = req.query;

  const price = await stripe.prices.retrieve(price_id);
  const remaining =
    price.metadata && "stock" in price.metadata
      ? parseInt(price.metadata.stock, 10)
      : 1;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      remaining: Math.max(remaining, 0),
      soldout: remaining <= 0,
    }),
  );
};
