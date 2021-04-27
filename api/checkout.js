const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const inventory = require('../data/shop.json')["prints"];

module.exports =  async(req, res) => {
  const { sku } = req.body;
  const item = inventory.find((p) => p.sku === sku);

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: item.price_id,
        quantity: 1
      }
    ],
    mode: 'payment',
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    shipping_rates: [process.env.STRIPE_SHIPPING_RATE],
    shipping_address_collection: {
      allowed_countries: [
        "AU", "BE", "CA", "ES", "HR", "DK", "FI", "FR", "DE", "IE",
        "JP", "MX", "NO", "SE", "GB", "US",
      ]
    },
    payment_method_types: ['card'],
    success_url: `${process.env.URL}/shop/${item.slug}`,
    cancel_url: `${process.env.URL}/shop/${item.slug}`,
  });


  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  console.log(session);
  res.end(JSON.stringify({
    sessionId: session.id,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  }))
};
