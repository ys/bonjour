document.addEventListener("DOMContentLoaded", function () {
  new IOlazy();
  mediumZoom(document.querySelectorAll('[data-action="zoom"]'), {margin: 20});
})
