document.addEventListener("DOMContentLoaded", function () {
  url = new URL(window.location.href);
  if (url.searchParams.get('dark')) {
    document.querySelector('html').classList.toggle('mode-dark');
  }
  new LazyLoad({
    elements_selector: ".lazyload"
  });
  mediumZoom(document.querySelectorAll('[data-action="zoom"]'), {margin: 20});
})
