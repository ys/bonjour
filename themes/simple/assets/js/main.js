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
})


