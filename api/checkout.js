const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports =  async(req, res) => {
  const { price_id, slug, shipping_rate } = req.body;
  url = `https://${process.env.VERCEL_URL}`
  if (process.env.BASE_URL){
    url = `https://${process.env.BASE_URL}`
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: price_id,
        quantity: 1
      }
    ],
    mode: 'payment',
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    shipping_rates: [shipping_rate || process.env.STRIPE_SHIPPING_RATE.split(",")[0]],
    shipping_address_collection: {
      allowed_countries: [
        "AC","AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AT","AU","AW","AX","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ","BR","BS","BT","BV","BW","BY","BZ","CA","CD","CF","CG","CH","CI","CK","CL","CM","CN","CO","CR","CV","CW","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","EH","ER","ES","ET","FI","FJ","FK","FO","FR","GA","GB","GD","GE","GF","GG","GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HN","HR","HT","HU","ID","IE","IL","IM","IN","IO","IQ","IS","IT","JE","JM","JO","JP","KE","KG","KH","KI","KM","KN","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MK","ML","MM","MN","MO","MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NG","NI","NL","NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS","PT","PY","QA","RE","RO","RS","RU","RW","SA","SB","SC","SE","SG","SH","SI","SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SZ","TA","TC","TD","TF","TG","TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ","UA","UG","US","UY","UZ","VA","VC","VE","VG","VN","VU","WF","WS","XK","YE","YT","ZA","ZM","ZW","ZZ"
      ]
    },
    payment_method_types: ['card'],
    cancel_url: `${url}${slug}`,
    success_url: `${url}${slug}?session_id={CHECKOUT_SESSION_ID}`,
  });


  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  console.log(session);
  res.end(JSON.stringify({
    sessionId: session.id,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  }))
};
