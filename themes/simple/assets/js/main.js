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

  form = document.querySelector('#stripe-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmission);
  }
})

function handleFormSubmission(event) {
    event.preventDefault();
    form = new FormData(event.target);

    data = { sku: form.get('sku') };

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


