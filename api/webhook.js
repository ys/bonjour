const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const handler = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const rawBody = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    res.statusCode = 400;
    res.end(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Get the price_id from the payment intent metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent,
    );
    const priceId = paymentIntent.metadata.price_id;

    if (priceId) {
      const price = await stripe.prices.retrieve(priceId);

      if (price.metadata && "stock" in price.metadata) {
        const currentStock = parseInt(price.metadata.stock, 10);
        await stripe.prices.update(priceId, {
          metadata: { stock: String(Math.max(currentStock - 1, 0)) },
        });
      }
    }
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ received: true }));
};

// Disable Vercel body parsing so we get the raw body for signature verification
module.exports = handler;
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
