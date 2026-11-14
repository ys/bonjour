const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { resolveItem, stockOf } = require("./_price");

// ?id=prod_... or price_... (product page)
// ?ids=id1,id2 (shop list). price_id / price_ids still work.
module.exports = async (req, res) => {
  const { id, ids, price_id, price_ids } = req.query;
  res.setHeader("Content-Type", "application/json");

  const batch = ids || price_ids;
  if (batch) {
    const list = batch.split(",").filter(Boolean).slice(0, 50);
    const results = {};
    await Promise.all(
      list.map(async (one) => {
        try {
          results[one] = stockOf(await resolveItem(stripe, one));
        } catch (err) {
          // Unknown id: leave it out, the page keeps its built state.
        }
      }),
    );
    res.statusCode = 200;
    res.end(JSON.stringify(results));
    return;
  }

  const single = id || price_id;
  if (!single) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "bad_request" }));
    return;
  }
  try {
    res.statusCode = 200;
    res.end(JSON.stringify(stockOf(await resolveItem(stripe, single))));
  } catch (err) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: "not_found" }));
  }
};
