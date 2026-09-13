/* DEWIFY — Featured product interaction */
(function () {
  "use strict";

  function openFeaturedProduct() {
    const card = document.querySelector('.product-card .product-name');
    if (!card) return;

    const target = [...document.querySelectorAll('.product-card')].find((item) => {
      const name = item.querySelector('.product-name')?.textContent?.trim();
      return name === 'FoldAway Storage Vault';
    });

    if (target) {
      target.click();
      return;
    }

    // Product detail routing also supports direct hash navigation.
    window.location.hash = '#product/dw-storage-vault';
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
