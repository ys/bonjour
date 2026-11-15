document.addEventListener("DOMContentLoaded", function () {
  new LazyLoad({
    elements_selector: "[loading=lazy]",
  });
  photoswipeSimplify.init({
    history: false,
    bgOpacity: 1,
    zoomEl: false,
    shareEl: false,
    counterEl: false,
    fullscreenEl: false,
    closeEl: false,
    captionEl: false,
    arrowEl: false,
    maxSpreadZoom: 1,
    getDoubleTapZoom: function (isMouseClick, item) {
      return 1;
    },
    barsSize: { top: 60, bottom: 120 },
  });
  params = new URLSearchParams(window.location.search);
  if (params.has("zoom")) {
    photoswipeSimplify.open(0, 0);
  }

  if (params.has("session_id")) {
    fetch("/api/success?session_id=" + encodeURIComponent(params.get("session_id")), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((res) => {
        if (!res.paid) return;
        document.querySelector(".thanks").innerText =
          "🎉 Merci pour cet achat" + (res.name ? ", " + res.name : "");
        document.querySelector("#thanksdiv").classList.toggle("hidden");
      });
  }

  form = document.querySelector("#stripe-form");
  if (form) {
    form.addEventListener("submit", handleFormSubmission);
    var buy = document.getElementById("checkout-button");
    if (buy) {
      ["pointerenter", "focus", "touchstart"].forEach(function (ev) {
        buy.addEventListener(ev, loadStripe, { once: true, passive: true });
      });
    }
  }

  // Check stock on single product page
  var stockForm = form || document.querySelector("#stripe-form-nope");
  if (stockForm) {
    var itemInput =
      stockForm.querySelector('input[name="product_id"]') ||
      stockForm.querySelector('input[name="price_id"]');
    if (itemInput && itemInput.value) {
      checkStock(itemInput.value);
    }
  }

  // Check stock on shop list page (single batch call)
  var articles = document.querySelectorAll("article[data-item-id]");
  if (articles.length > 0) {
    var articlesByPriceId = {};
    articles.forEach(function (article) {
      var priceId = article.getAttribute("data-item-id");
      if (!articlesByPriceId[priceId]) articlesByPriceId[priceId] = [];
      articlesByPriceId[priceId].push(article);
    });
    var priceIds = Object.keys(articlesByPriceId);
    fetch("/api/stock?ids=" + priceIds.map(encodeURIComponent).join(","))
      .then(function (res) { return res.json(); })
      .then(function (results) {
        priceIds.forEach(function (priceId) {
          var data = results[priceId];
          if (!data) return;
          articlesByPriceId[priceId].forEach(function (article) {
            // Update stock count
            var stockEl = article.querySelector(".shop-stock");
            if (stockEl) {
              updateStockLabel(stockEl, data.remaining, data.stock_total);
            }

            if (data.soldout) {
              var picture = article.querySelector("picture");
              if (picture) {
                var banner = document.createElement("span");
                banner.className = "absolute top-2 left-2 bg-black/80 text-white text-xs font-bold px-2 py-1 z-10 font-sans uppercase tracking-wide";
                banner.textContent = "Sold out";
                picture.prepend(banner);
              }
              var pricetag = article.querySelector(".shop-pricetag");
              if (pricetag) {
                var currentPrice = pricetag.textContent.trim();
                pricetag.innerHTML = "<del>" + currentPrice + "</del> SOLD OUT";
              }
            }
          });
        });
      })
      .catch(function () {});
  }
});

function updateStockLabel(el, remaining, stockTotal) {
  var total = stockTotal || parseInt(el.getAttribute("data-stock-total"), 10);
  if (!total) return;
  el.textContent = " \u2022 " + remaining + "/" + total + " left";
  el.classList.remove("hidden", "text-gray-500", "dark:text-gray-400", "text-red-600", "dark:text-red-400", "font-bold");
  if (remaining <= 5) {
    el.classList.add("text-red-600", "dark:text-red-400", "font-bold");
  } else {
    el.classList.add("text-gray-500", "dark:text-gray-400");
  }
}

// Swap the buy block for the sold-out note (stock checked live, or checkout refused)
function markSoldOut() {
  var buy = document.getElementById("buy-block");
  var tpl = document.getElementById("soldout-template");
  var label = document.getElementById("price-label");
  if (tpl && buy) {
    var parts = tpl.content.cloneNode(true);
    var tag = parts.getElementById("soldout-tag");
    if (tag && label) label.after(tag);
    buy.before(parts);
    tpl.remove();
  }
  if (buy) buy.classList.add("hidden");
  if (label) label.classList.add("line-through", "text-gray-500", "dark:text-gray-400");
  var form = document.getElementById("stripe-form");
  if (form) form.removeEventListener("submit", handleFormSubmission);
}

function checkStock(itemId) {
  fetch("/api/stock?id=" + encodeURIComponent(itemId))
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      // Update the stock meter above the buy button
      var meter = document.getElementById("stock-meter");
      var total = data.stock_total || (meter && parseInt(meter.getAttribute("data-stock-total"), 10));
      if (meter && total) {
        var left = Math.max(Math.min(data.remaining, total), 0);
        document.getElementById("stock-label").textContent = left + "/" + total + " left";
        var bar = document.getElementById("stock-bar");
        bar.setAttribute("aria-label", left + " of " + total + " copies left");
        bar.firstElementChild.style.width = (left / total) * 100 + "%";
        meter.classList.toggle("hidden", !!data.soldout);
      }

      if (data.soldout) markSoldOut();
    })
    .catch(function () {});
}

// Stripe.js is heavy (~1 MB), so it is fetched on intent (hover/focus of the
// buy button) or at checkout, not on every product page view.
var stripeLoading = null;
function loadStripe() {
  if (window.Stripe) return Promise.resolve();
  if (!stripeLoading) {
    stripeLoading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://js.stripe.com/v3";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return stripeLoading;
}

function handleFormSubmission(event) {
  event.preventDefault();

  var htmlForm = document.getElementById("stripe-form");
  if (htmlForm.checkValidity() == false) {
    var list = htmlForm.querySelectorAll(":invalid");
    for (var item of list) {
      item.focus();
    }
    return null;
  }

  var submit = document.getElementById("checkout-button");
  submit.querySelector("svg").classList.remove("hidden");
  submit.querySelectorAll("span").forEach(function (span) {
    span.classList.add("hidden");
  });

  form = new FormData(event.target);

  data = {
    product_id: form.get("product_id"),
    price_id: form.get("price_id"),
    shipping: form.get("shipping"),
    slug: window.location.pathname,
  };

  fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          throw err;
        });
      }
      return res.json();
    })
    .then(function (response) {
      return loadStripe().then(function () {
        return response;
      });
    })
    .then(function (response) {
      stripe = Stripe(response.publishableKey);
      stripe.redirectToCheckout({ sessionId: response.sessionId });
    })
    .catch(function (err) {
      submit.querySelector("svg").classList.add("hidden");
      submit.querySelectorAll("span").forEach(function (span) {
        span.classList.remove("hidden");
      });
      if (err.error === "sold_out") {
        markSoldOut();
      } else {
        document.getElementById("error-message").innerText =
          "Something went wrong. Please try again.";
      }
    });
}
