/* DEWIFY — premium micro-interactions
   No dependency. Safe with the existing cart/product-detail code.
*/
(function () {
  "use strict";

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const finePointer = window.matchMedia?.("(pointer: fine)")?.matches;

  function pulseButton(button, event) {
    if (!button || reduceMotion) return;
    const rect = button.getBoundingClientRect();
    button.style.setProperty("--ripple-x", `${event.clientX - rect.left}px`);
    button.style.setProperty("--ripple-y", `${event.clientY - rect.top}px`);
    button.classList.remove("interaction-ripple");
    void button.offsetWidth;
    button.classList.add("interaction-ripple");
    window.setTimeout(() => button.classList.remove("interaction-ripple"), 600);
  }

  function cardTilt(card, event) {
    if (!finePointer || reduceMotion || !card) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - .5) * 3.2;
    const rotateX = (.5 - y) * 3.2;
    card.style.setProperty("--mx", `${x * 100}%`);
    card.style.setProperty("--my", `${y * 100}%`);
    card.style.transform = `translate3d(0,-5px,0) perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  function resetCard(card) {
    if (!card) return;
    card.style.transform = "";
    card.style.removeProperty("--mx");
    card.style.removeProperty("--my");
  }

  function markAdded(id) {
    const card = document.querySelector(`.product-card[data-product-id="${CSS.escape(id)}"]`);
    if (!card || reduceMotion) return;
    card.classList.remove("dew-added");
    void card.offsetWidth;
    card.classList.add("dew-added");
    window.setTimeout(() => card.classList.remove("dew-added"), 600);
  }

  function animateNewCards() {
    if (reduceMotion) return;
    document.querySelectorAll("#productGrid .product-card").forEach((card, index) => {
      if (card.dataset.dewMotionSeen === "true") return;
      card.dataset.dewMotionSeen = "true";
      card.style.animationDelay = `${Math.min(index * 35, 210)}ms`;
      card.classList.add("dew-enter");
      window.setTimeout(() => {
        card.classList.remove("dew-enter");
        card.style.animationDelay = "";
      }, 750);
    });
  }

  function init() {
    document.addEventListener("pointermove", (event) => {
      const card = event.target.closest?.(".product-card");
      if (card && finePointer) cardTilt(card, event);
    }, { passive: true });

    document.addEventListener("pointerleave", (event) => {
      const card = event.target.closest?.(".product-card");
      if (card) resetCard(card);
    }, true);

    document.addEventListener("pointerover", (event) => {
      const button = event.target.closest?.(".add-button, .button, .bag-button, .filter");
      if (!button || reduceMotion) return;
      button.style.setProperty("--dew-hover", "1");
    }, { passive: true });

    document.addEventListener("click", (event) => {
      const button = event.target.closest?.("button, .filter, .button");
      if (button) pulseButton(button, event);

      const add = event.target.closest?.("[data-add]");
      if (add) markAdded(add.dataset.add);

      const detailAdd = event.target.closest?.("[data-detail-add]");
      if (detailAdd) markAdded(detailAdd.dataset.detailAdd);
    }, true);

    const bag = document.getElementById("bagCount");
    if (bag) {
      let previous = bag.textContent;
      const observer = new MutationObserver(() => {
        if (bag.textContent !== previous) {
          previous = bag.textContent;
          if (!reduceMotion) {
            const parent = bag.closest(".bag-button");
            parent?.classList.remove("dew-count-pop");
            void parent?.offsetWidth;
            parent?.classList.add("dew-count-pop");
          }
        }
      });
      observer.observe(bag, { childList: true, characterData: true, subtree: true });
    }

    const grid = document.getElementById("productGrid");
    if (grid) {
      animateNewCards();
      new MutationObserver(animateNewCards).observe(grid, { childList: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
