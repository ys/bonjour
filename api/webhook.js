const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { resolveItem, stockOwner } = require("./_price");

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
    const { price_id: priceId, product_id: productId, stock_counted } = paymentIntent.metadata;

    // Stripe can deliver the same event more than once: count each sale once.
    if ((priceId || productId) && stock_counted !== "true") {
      const item = await resolveItem(stripe, productId || priceId);
      const owner = stockOwner(item);
      if (owner) {
        const current = parseInt(item[owner].metadata.stock, 10);
        const metadata = { stock: String(Math.max(current - 1, 0)) };
        if (owner === "product") await stripe.products.update(item.product.id, { metadata });
        else await stripe.prices.update(item.price.id, { metadata });
      }
      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: { stock_counted: "true" },
      });
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
