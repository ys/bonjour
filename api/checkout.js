const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { resolveItem, stockOf } = require("./_price");
const shipping = require("../data/shipping.json");

// The page names a shipping set from data/shipping.json; the server picks its rates
// (test rates with a test key) and the buyer chooses one on the Stripe Checkout page.
const TEST_KEY = /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || "");

function ratesFor(name) {
  const set = shipping.sets[name || shipping.default];
  if (!set) return null;
  const rates = (TEST_KEY && set.testing) || set.live || [];
  return rates.slice(0, 5).map((rate) => ({ shipping_rate: rate.value }));
}

module.exports = async (req, res) => {
  const { product_id, price_id, slug, shipping: shippingSet } = req.body || {};
  const shippingOptions = ratesFor(shippingSet);
  const itemId = product_id || price_id;
  const url = `https://${process.env.BASE_URL || process.env.VERCEL_URL}`;

  if (
    !itemId ||
    !shippingOptions ||
    shippingOptions.length === 0 ||
    typeof slug !== "string" ||
    !slug.startsWith("/")
  ) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "bad_request" }));
    return;
  }

  // Stock: metadata.stock on the product (or on the price for older items).
  // No stock metadata means one left. Set stock = "0" to mark as sold out.
  let item;
  try {
    item = await resolveItem(stripe, itemId);
  } catch (err) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "unknown_item" }));
    return;
  }
  const { price, product } = item;

  if (stockOf(item).soldout) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ error: "sold_out", message: "This item is sold out." }),
    );
    return;
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    mode: "payment",
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    shipping_options: shippingOptions,
    shipping_address_collection: {
      allowed_countries: [
        "AC",
        "AD",
        "AE",
        "AF",
        "AG",
        "AI",
        "AL",
        "AM",
        "AO",
        "AQ",
        "AR",
        "AT",
        "AU",
        "AW",
        "AX",
        "AZ",
        "BA",
        "BB",
        "BD",
        "BE",
        "BF",
        "BG",
        "BH",
        "BI",
        "BJ",
        "BL",
        "BM",
        "BN",
        "BO",
        "BQ",
        "BR",
        "BS",
        "BT",
        "BV",
        "BW",
        "BY",
        "BZ",
        "CA",
        "CD",
        "CF",
        "CG",
        "CH",
        "CI",
        "CK",
        "CL",
        "CM",
        "CN",
        "CO",
        "CR",
        "CV",
        "CW",
        "CY",
        "CZ",
        "DE",
        "DJ",
        "DK",
        "DM",
        "DO",
        "DZ",
        "EC",
        "EE",
        "EG",
        "EH",
        "ER",
        "ES",
        "ET",
        "FI",
        "FJ",
        "FK",
        "FO",
        "FR",
        "GA",
        "GB",
        "GD",
        "GE",
        "GF",
        "GG",
        "GH",
        "GI",
        "GL",
        "GM",
        "GN",
        "GP",
        "GQ",
        "GR",
        "GS",
        "GT",
        "GU",
        "GW",
        "GY",
        "HK",
        "HN",
        "HR",
        "HT",
        "HU",
        "ID",
        "IE",
        "IL",
        "IM",
        "IN",
        "IO",
        "IQ",
        "IS",
        "IT",
        "JE",
        "JM",
        "JO",
        "JP",
        "KE",
        "KG",
        "KH",
        "KI",
        "KM",
        "KN",
        "KR",
        "KW",
        "KY",
        "KZ",
        "LA",
        "LB",
        "LC",
        "LI",
        "LK",
        "LR",
        "LS",
        "LT",
        "LU",
        "LV",
        "LY",
        "MA",
        "MC",
        "MD",
        "ME",
        "MF",
        "MG",
        "MK",
        "ML",
        "MM",
        "MN",
        "MO",
        "MQ",
        "MR",
        "MS",
        "MT",
        "MU",
        "MV",
        "MW",
        "MX",
        "MY",
        "MZ",
        "NA",
        "NC",
        "NE",
        "NG",
        "NI",
        "NL",
        "NO",
        "NP",
        "NR",
        "NU",
        "NZ",
        "OM",
        "PA",
        "PE",
        "PF",
        "PG",
        "PH",
        "PK",
        "PL",
        "PM",
        "PN",
        "PR",
        "PS",
        "PT",
        "PY",
        "QA",
        "RE",
        "RO",
        "RS",
        "RU",
        "RW",
        "SA",
        "SB",
        "SC",
        "SE",
        "SG",
        "SH",
        "SI",
        "SJ",
        "SK",
        "SL",
        "SM",
        "SN",
        "SO",
        "SR",
        "SS",
        "ST",
        "SV",
        "SX",
        "SZ",
        "TA",
        "TC",
        "TD",
        "TF",
        "TG",
        "TH",
        "TJ",
        "TK",
        "TL",
        "TM",
        "TN",
        "TO",
        "TR",
        "TT",
        "TV",
        "TW",
        "TZ",
        "UA",
        "UG",
        "US",
        "UY",
        "UZ",
        "VA",
        "VC",
        "VE",
        "VG",
        "VN",
        "VU",
        "WF",
        "WS",
        "XK",
        "YE",
        "YT",
        "ZA",
        "ZM",
        "ZW",
        "ZZ",
      ],
    },
    payment_method_types: ["card"],
    payment_intent_data: {
      metadata: { price_id: price.id, product_id: product && product.id },
    },
    cancel_url: `${url}${slug}`,
    success_url: `${url}${slug}?session_id={CHECKOUT_SESSION_ID}`,
  });

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      sessionId: session.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    }),
  );
};
