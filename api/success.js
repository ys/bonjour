const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports =  async(req, res) => {
  const { session_id } = req.query;

  const session = await stripe.checkout.sessions.retrieve(session_id);

  res.statusCode = 200
  console.log(session);
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(session))
};
