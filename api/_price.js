// Current price for a price id: if it was archived and its product has
// another default price, use that one. Keeps checkout working between
// archiving a price in Stripe and the next deploy.
module.exports = async function currentPrice(stripe, priceId) {
  const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
  const product = price.product || {};
  const defaultId =
    typeof product.default_price === "string"
      ? product.default_price
      : product.default_price && product.default_price.id;
  if (!price.active && defaultId && defaultId !== price.id) {
    return stripe.prices.retrieve(defaultId);
  }
  return price;
};
