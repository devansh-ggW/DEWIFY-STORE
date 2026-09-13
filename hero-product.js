/* DEWIFY — Featured product interaction */
(function () {
  "use strict";

  function openFeaturedProduct() {
    const target = [...document.querySelectorAll('.product-card')].find((item) => {
      const name = item.querySelector('.product-name')?.textContent?.trim();
      return name === 'BunnyGlow Touch Night Light';
    });

    if (target) {
      target.click();
      return;
    }

    window.location.hash = '#product/dw-bunnyglow';
  }

  function init() {
    const feature = document.getElementById('heroProductFeature');
    if (!feature || feature.dataset.bound === 'true') return;
    feature.dataset.bound = 'true';
    feature.addEventListener('click', openFeaturedProduct);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
