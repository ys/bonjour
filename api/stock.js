const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  const { price_id } = req.query;

  const price = await stripe.prices.retrieve(price_id);
  const totalStock =
    price.metadata && "stock" in price.metadata
      ? parseInt(price.metadata.stock, 10)
      : 1;

  if (totalStock <= 0) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ total: 0, sold: 0, remaining: 0, soldout: true }));
    return;
  }

  const result = await stripe.paymentIntents.search({
    query: `status:'succeeded' AND metadata['price_id']:'${price_id}'`,
  });
  let soldCount = result.data.length;
  let page = result;
  while (page.has_more) {
    page = await stripe.paymentIntents.search({
      query: `status:'succeeded' AND metadata['price_id']:'${price_id}'`,
      page: page.next_page,
    });
    soldCount += page.data.length;
  }

  const remaining = totalStock - soldCount;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      total: totalStock,
      sold: soldCount,
      remaining: Math.max(remaining, 0),
      soldout: remaining <= 0,
    }),
  );
};
