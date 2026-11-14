const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Called by the product page after checkout to say thanks.
// Only returns the first name: the session id sits in the URL and can be
// shared, so the rest of the session (email, address) stays server side.
module.exports = async (req, res) => {
  const { session_id } = req.query;
  res.setHeader("Content-Type", "application/json");

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const details = session.shipping_details || session.shipping || session.customer_details || {};
    const name = (details.name || "").trim().split(/\s+/)[0] || null;
    res.statusCode = 200;
    res.end(JSON.stringify({ paid: session.payment_status === "paid", name }));
  } catch (err) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not_found" }));
  }
};
