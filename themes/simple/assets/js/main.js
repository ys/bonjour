document.addEventListener("DOMContentLoaded", function () {
  new LazyLoad({
    elements_selector: ".lazyload"
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
    barsSize: { top: 44, bottom: 44, left: 44, right: 44 }
  });
  params = new URLSearchParams(window.location.search)
  if (params.has("zoom")) {
    photoswipeSimplify.open(0,0);
 }

  if (params.has("session_id")) {
    fetch("/api/success?session_id=" + params.get("session_id"), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).then( res => res.json() )
    .then( res => {
      document.querySelector(".thanks").innerText = "🎉 Merci pour cet achat, " + res.shipping.name
      document.querySelector("#thanksdiv").classList.toggle("hidden");
    })

  }

  form = document.querySelector('#stripe-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmission);
  }
})

function handleFormSubmission(event) {
    event.preventDefault();
    form = new FormData(event.target);

    data = {
      price_id: form.get('price_id'),
      slug: window.location.pathname
    };

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then( res => res.json() )
      .then( response => {
        stripe = Stripe(response.publishableKey);
        stripe.redirectToCheckout({sessionId: response.sessionId});
      }).then( res => {
        if (res.error()) {
       console.error(res.error());
        }
      });

}


