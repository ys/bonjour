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
    fetch("/api/success?session_id=" + params.get("session_id"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((res) => {
        document.querySelector(".thanks").innerText =
          "🎉 Merci pour cet achat, " + res.shipping.name;
        document.querySelector("#thanksdiv").classList.toggle("hidden");
      });
  }

  form = document.querySelector("#stripe-form");
  if (form) {
    form.addEventListener("submit", handleFormSubmission);
  }

  // Check stock on single product page
  var stockForm = form || document.querySelector("#stripe-form-nope");
  if (stockForm) {
    var priceInput = stockForm.querySelector('input[name="price_id"]');
    if (priceInput && priceInput.value) {
      checkStock(priceInput.value);
    }
  }

  // Check stock on shop list page
  var articles = document.querySelectorAll("article[data-price-id]");
  articles.forEach(function (article) {
    var priceId = article.getAttribute("data-price-id");
    fetch("/api/stock?price_id=" + encodeURIComponent(priceId))
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
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
      })
      .catch(function () {});
  });
});

function checkStock(priceId) {
  fetch("/api/stock?price_id=" + encodeURIComponent(priceId))
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (data.soldout) {
        var label = document.getElementById("price-label");
        if (label) {
          var pricetag = label.getAttribute("data-pricetag") || "";
          // Strip markdown strikethrough (~~...~~) and "SOLD OUT" text to get clean price
          var cleanPrice = pricetag.replace(/~~/g, "").replace(/\s*SOLD\s*OUT\s*/i, "").trim();
          if (cleanPrice) {
            label.innerHTML = "<del>" + cleanPrice + "</del> Sold out";
          } else {
            label.innerText = "Sold out";
          }
        }
        var submit = document.getElementById("checkout-button");
        if (submit) {
          submit.disabled = true;
          submit.classList.add("bg-gray-300", "line-through", "cursor-not-allowed");
          submit.classList.remove("cursor-pointer", "hover:drop-shadow-xl");
          // Remove any theme color classes (bg-{color})
          submit.className.split(" ").forEach(function (cls) {
            if (cls.match(/^bg-/) && cls !== "bg-gray-300") {
              submit.classList.remove(cls);
            }
          });
          var span = submit.querySelector("span");
          if (span) {
            span.innerText = "Sold out";
          }
        }
        // Disable the form to prevent submission
        var form = document.getElementById("stripe-form");
        if (form) {
          form.removeEventListener("submit", handleFormSubmission);
        }
      }
    })
    .catch(function () {});
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
  submit.querySelector("svg").classList.toggle("hidden");
  submit.querySelector("span").classList.toggle("hidden");

  form = new FormData(event.target);

  data = {
    price_id: form.get("price_id"),
    shipping_rate: form.get("shipping_rate"),
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
      stripe = Stripe(response.publishableKey);
      stripe.redirectToCheckout({ sessionId: response.sessionId });
    })
    .catch(function (err) {
      submit.querySelector("svg").classList.add("hidden");
      submit.querySelector("span").classList.remove("hidden");
      if (err.error === "sold_out") {
        document.getElementById("error-message").innerText =
          "Sorry, this item is now sold out!";
        submit.disabled = true;
        submit.classList.add("bg-gray-300", "line-through", "cursor-not-allowed");
        submit.classList.remove("cursor-pointer", "hover:drop-shadow-xl");
        submit.className.split(" ").forEach(function (cls) {
          if (cls.match(/^bg-/) && cls !== "bg-gray-300") {
            submit.classList.remove(cls);
          }
        });
        submit.querySelector("span").innerText = "Sold out";
      } else {
        document.getElementById("error-message").innerText =
          "Something went wrong. Please try again.";
      }
    });
}
