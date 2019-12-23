var theme = localStorage.getItem('themeSwitch')
if(theme === 'dark') { // dark theme has been selected
  document.querySelector('html').classList.add('mode-dark');
}

document.addEventListener("DOMContentLoaded", function () {
  new LazyLoad({
    elements_selector: ".lazyload"
  });
  mediumZoom(document.querySelectorAll('[data-action="zoom"]'), {margin: 20});
  document.querySelector('.theme-switcher').addEventListener("click", function() {
    var theme = localStorage.getItem('themeSwitch')
    if(theme === 'dark') { // dark theme has been selected
      document.querySelector('html').classList.remove('mode-dark');
      localStorage.setItem('themeSwitch', 'light'); // save theme selection
    } else {
      document.querySelector('html').classList.add('mode-dark');
      localStorage.setItem('themeSwitch', 'dark'); // reset theme selection
    }
  });
})


