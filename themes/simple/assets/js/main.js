document.addEventListener("DOMContentLoaded", function () {
  var infScroll = new InfiniteScroll( '.posts', {
    path: '.page-link[aria-label="Next"]',
    append: 'article',
    debug: true,
    hideNav: '.pagination',

  })
  new LazyLoad({
    elements_selector: ".lazyload"
  });
  mediumZoom(document.querySelectorAll('[data-action="zoom"]'), {margin: 20});
})
