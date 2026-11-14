# This is yannickschutz.com

This is automatically synced with vercel

License
=======
The following directories and their contents are Copyright Yannick Schutz.
You may not reuse anything therein without my permission:

*   content/

All other directories and files are MIT Licensed.


## Shop

The shop uses [Stripe Checkout](https://checkout.stripe.com)

### Functions

It is a set of 2 serverless functions running on Vercel, a data file and a template.

- [`api/checkout.js`](api/checkout.js) : Responsible for creating a session on stripe checkout.
  It uses data/shop.json file to map the SKU invented code to the Stripe `price_id`.
  Right now a lot is hardcoded in the function.
- [`api/success.js`](api/success.js) : Used to retrieve customer information on the callback after a sale.
  Goal is to show a banner thanking the user.

### Template

The [template](theme/simple/layouts/shop/single.html) has a form handled by JS in [`main.js`](theme/simple/assets/js/main.js) where we first post to the checkout serverless function. Then with the `session_id`, we redirect to stripe for the payment. We are not handling any money data down here.

The frontmatter of a shop item requires `price_id` which is the price code of a stripe product

### Prices and stock come from Stripe

Prices are set in Stripe only. Before each build, [`bin/sync-prices.js`](bin/sync-prices.js)
reads every `price_id` in `content/shop/`, fetches it from Stripe and writes `data/prices.json`
(not committed). The [`shop/offer.html`](themes/simple/layouts/partials/shop/offer.html) partial
uses it for the price tag, sold out state, structured data, Open Graph and the feed. Without a
live key (local dev, previews) it falls back to `price`, `pricetag` and `soldout` in the front matter.

To change a price: in Stripe, add a new price on the product, set it as default, archive the old
one, copy the `stock` / `stock_total` metadata over, then redeploy. The front matter can keep the
old `price_id`, the build follows the product's default price.

In page text, write `{{</* price */>}}` instead of the amount.

Run it locally with `STRIPE_SECRET_KEY=rk_live_... yarn sync-prices`. A restricted key with read
access to prices and products is enough.

### Configuration

The Configuration keys needed by the functions are:
- `STRIPE_SECRET_KEY`: Key used to interact with the API from the function
- `STRIPE_PUBLISHABLE_KEY`: Key used by the frontend client to Stripe
- `STRIPE_SHIPPING_RATE`: Shipping rate code to use at checkout

The keys can be found at https://dashboard.stripe.com/apikeys

### Flow

The flow for a payment is:
- [`shop/single.html`](theme/simple/layouts/shop/single.html) page form gets a session_id from `api/checkout.js`
- user gets redirected to stripe
- After payment, user is redirected back to the right slug
- page gets the payment information via `api/success.js` and thanks the user.
