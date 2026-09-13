/* ============================================================
   DEWIFY — Product detail experience
   Keeps the existing cart/checkout flow intact.
   ============================================================ */
(function () {
  "use strict";

  const OFFICIAL_CJ_IMAGES = {
    "dw-heatcore-jacket": [
      "https://cf.cjdropshipping.com/17000928/1725075714115506176.jpg",
      "https://cf.cjdropshipping.com/17000928/1725075714283278336.jpg"
    ],
    "dw-moonglow-pendant": [
      "https://cf.cjdropshipping.com/16367616/1636808394162.jpg"
    ],
    "dw-bunnyglow": [
      "https://cf.cjdropshipping.com/17154720/2405120725050328100.jpg"
    ],
    "dw-orbitmoon-lamp": [
      "https://cf.cjdropshipping.com/17116704/2403290157100327000.jpg"
    ],
    "dw-temptrack-bottle": [
      "https://cf.cjdropshipping.com/17032032/1738098783004266496.jpg"
    ],
    "dw-cloudwarm-socks": [
      "https://cf.cjdropshipping.com/17051904/2401140356490329800.jpg",
      "https://cf.cjdropshipping.com/17051904/2401140356500320300.jpg",
      "https://cf.cjdropshipping.com/17051904/2401140356500321000.jpg"
    ],
    "dw-ravenhide-watch": [
      "https://cf.cjdropshipping.com/1620710794428.jpg?x-oss-process=image%2Fresize%2Cm_fill%2Cm_pad%2Cw_1200%2Ch_1200"
    ]
  };

  const PRODUCT_DETAILS = {
    "dw-storage-vault": {
      eyebrow: "SPACE / ORDER",
      headline: "Make room without making a mess.",
      description: "A foldable storage bag built for bulky clothes, bedding and travel loads when rigid boxes take up too much room.",
      highlights: ["Large-capacity soft storage", "Double-zipper access", "Carry handle for moving and travel"],
      specs: ["Material: non-woven", "Multiple sizes available", "Foldable when not in use"],
      imageNote: "Official CJ image requires authenticated catalog access."
    },
    "dw-witchlight": {
      eyebrow: "LIGHT / MOOD",
      headline: "Turn the room into a whole different world.",
      description: "A compact witch-hat lamp made for gothic corners, Halloween setups and anyone who wants their shelf lighting to have a personality.",
      highlights: ["USB powered", "Three style variants", "Statement décor piece"],
      specs: ["Material: synthetic resin", "Approx. 18 cm / 30 cm variants", "Style choices available"],
      imageNote: "Official CJ image requires authenticated catalog access."
    },
    "dw-heatcore-jacket": {
      eyebrow: "COLD / CONTROL",
      headline: "Warmth, exactly when you need it.",
      description: "A heated jacket with three temperature settings for cold-weather commutes, travel and outdoor days.",
      highlights: ["Three heating levels", "Carbon-fiber heating system", "Removable hood"],
      specs: ["Sizes: S–6XL", "Multiple color/zone options", "Power bank not included", "Claimed battery runtime depends on power bank and setting"],
      imageNote: "Official CJ product imagery."
    },
    "dw-moonglow-pendant": {
      eyebrow: "GLOW / AFTER DARK",
      headline: "A little moonlight, wherever you go.",
      description: "A luminous moon pendant that charges under light and glows after dark for a subtle celestial look.",
      highlights: ["Luminous pendant", "45 + 5 cm chain", "Multiple glow-color options"],
      specs: ["Pendant: approx. 3.2 cm", "Chain: approx. 45 + 5 cm", "Colors vary by option"],
      imageNote: "Official CJ product imagery."
    },
    "dw-fruity-paws": {
      eyebrow: "PET / COZY",
      headline: "Tiny fit. Big personality.",
      description: "A fruit-themed pet hoodie designed to add a warm, playful layer to small dogs and cats.",
      highlights: ["Fruit-inspired designs", "Soft warm-look styling", "Multiple sizes and styles"],
      specs: ["Sizes: XS–2XL", "Seven style options listed", "Material: cloth"],
      imageNote: "Official CJ image requires authenticated catalog access."
    },
    "dw-bunnyglow": {
      eyebrow: "SOFT / NIGHT",
      headline: "A night light with a softer side.",
      description: "A touch-controlled silicone bunny lamp for bedside tables, kids' rooms and calm late-night lighting.",
      highlights: ["Three brightness levels", "30-minute timer", "USB-C charging"],
      specs: ["Material: silicone", "Battery: 1200mAh", "Approx. 6–8 hour runtime"],
      imageNote: "Official CJ product imagery."
    },
    "dw-orbitmoon-lamp": {
      eyebrow: "SPACE / AMBIENCE",
      headline: "Keep a tiny universe on your desk.",
      description: "A 3D planetary crystal-ball lamp that turns a small surface into an ambient space-themed display.",
      highlights: ["3D planetary designs", "Compact 6 cm form", "Multiple space-inspired variants"],
      specs: ["Approx. size: 6 cm", "Plug-in lamp", "Nebula / Solar System / Saturn / Moon variants"],
      imageNote: "Official CJ product imagery."
    },
    "dw-temptrack-bottle": {
      eyebrow: "DRINK / DAILY",
      headline: "Know your drink. Keep it ready.",
      description: "A 450 ml insulated bottle with a digital temperature display for commutes, desks and everyday carry.",
      highlights: ["Digital temperature display", "316 stainless-steel liner", "Hot/cold insulation"],
      specs: ["Capacity: 450 ml", "Claimed insulation: 6–12 hours", "Color/strap options vary"],
      imageNote: "Official CJ product imagery."
    },
    "dw-cloudwarm-socks": {
      eyebrow: "COZY / HOME",
      headline: "Cold feet? Fixed.",
      description: "Soft long socks designed for cold-weather lounging, sleeping and keeping your legs warmer around the house.",
      highlights: ["Fuzzy warm feel", "Long-leg coverage", "One-size listing"],
      specs: ["Material: cotton", "Foot length: approx. 23–25.5 cm", "Leg length: approx. 55 cm"],
      imageNote: "Official CJ product imagery."
    },
    "dw-ravenhide-watch": {
      eyebrow: "TIME / ATTITUDE",
      headline: "Old-school character. Everyday wear.",
      description: "A retro-inspired electronic wristwatch with a bold oversized dial and classic styling.",
      highlights: ["Retro aesthetic", "Electronic movement", "Large 46 mm dial"],
      specs: ["Dial: approx. 46 mm", "Thickness: approx. 15 mm", "Waterproofing: not listed"],
      imageNote: "Official CJ product imagery."
    },
    "dw-pup-match-vest": {
      eyebrow: "PET / ACTIVE",
      headline: "Made for little sidekicks on the move.",
      description: "A lightweight sports-style pet vest for warmer days, walks and playful everyday outfits.",
      highlights: ["Sport-inspired styling", "Red and black options", "Multiple sizes"],
      specs: ["Sizes: S–XXL", "Color options vary", "Pet apparel"],
      imageNote: "Official CJ image requires authenticated catalog access."
    }
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function imagesFor(product) {
    const images = OFFICIAL_CJ_IMAGES[product.id] || [];
    return images.filter(Boolean);
  }

  function ensureModal() {
    let modal = document.getElementById("productDetailModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "productDetailModal";
    modal.className = "modal product-detail-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "productDetailTitle");
    modal.innerHTML = `
      <div class="modal-backdrop" data-detail-close></div>
      <div class="product-detail-panel">
        <div class="product-detail-head">
          <p class="eyebrow">DEWIFY / PRODUCT</p>
          <button class="icon-button" type="button" aria-label="Close product details" data-detail-close>×</button>
        </div>
        <div id="productDetailBody"></div>
      </div>`;
    document.body.appendChild(modal);

    modal.addEventListener("click", function (event) {
      if (event.target.closest("[data-detail-close]")) {
        closeDetail(true);
        return;
      }

      const addButton = event.target.closest("[data-detail-add]");
      if (addButton) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof window.addToCart === "function") window.addToCart(addButton.dataset.detailAdd);
      }

      const thumb = event.target.closest("[data-detail-thumb]");
      if (thumb) {
        const image = document.getElementById("detailMainImage");
        if (image) image.src = thumb.dataset.detailThumb;
        modal.querySelectorAll(".product-detail-thumb").forEach(btn => btn.classList.toggle("active", btn === thumb));
      }
    });

    return modal;
  }

  function openDetail(id, updateHash) {
    const product = PRODUCTS.find(item => item.id === id);
    if (!product) return;

    const modal = ensureModal();
    const body = document.getElementById("productDetailBody");
    const detail = PRODUCT_DETAILS[id] || {
      eyebrow: product.category,
      headline: "A better everyday find.",
      description: "A curated DEWIFY product selected from our current drop.",
      highlights: [],
      specs: [],
      imageNote: "Official CJ image access depends on catalog availability."
    };
    const images = imagesFor(product);
    const hasImages = images.length > 0;

    body.innerHTML = `
      <div class="product-detail-grid">
        <div class="product-detail-gallery">
          <div class="product-detail-main-image ${hasImages ? "has-image" : "no-image"}">
            ${hasImages
              ? `<img id="detailMainImage" src="${escapeHtml(images[0])}" alt="${escapeHtml(product.name)} official product image" loading="eager" referrerpolicy="no-referrer">`
              : `<div class="product-image-fallback"><span>DEWIFY</span><strong>IMAGE<br>PREVIEW</strong><small>${escapeHtml(detail.imageNote)}</small></div>`}
          </div>
          ${images.length > 1 ? `
            <div class="product-detail-thumbs" aria-label="Product images">
              ${images.map((src, index) => `<button class="product-detail-thumb ${index === 0 ? "active" : ""}" type="button" data-detail-thumb="${escapeHtml(src)}" aria-label="View product image ${index + 1}"><img src="${escapeHtml(src)}" alt="" loading="lazy" referrerpolicy="no-referrer"></button>`).join("")}
            </div>` : ""}
        </div>

        <div class="product-detail-copy">
          <p class="eyebrow">${escapeHtml(detail.eyebrow)}</p>
          <h1 id="productDetailTitle">${escapeHtml(product.name)}</h1>
          <h2>${escapeHtml(detail.headline)}</h2>
          <p class="product-detail-description">${escapeHtml(detail.description)}</p>

          ${detail.highlights.length ? `<div class="product-detail-highlights">${detail.highlights.map(item => `<div><span>✓</span>${escapeHtml(item)}</div>`).join("")}</div>` : ""}

          <div class="product-detail-buy">
            <div>
              <span class="eyebrow">DEWIFY PRICE</span>
              <strong>${escapeHtml(window.money ? window.money(product.price) : `₹${product.price}`)}</strong>
            </div>
            <button class="button button-light" type="button" data-detail-add="${escapeHtml(product.id)}">Add to bag <span>↗</span></button>
          </div>

          ${detail.specs.length ? `<div class="product-detail-specs"><p class="eyebrow">DETAILS</p>${detail.specs.map(item => `<div>${escapeHtml(item)}</div>`).join("")}</div>` : ""}

          <div class="product-detail-footer">
            <span>${escapeHtml(detail.imageNote)}</span>
            <a href="${escapeHtml(product.sourceUrl)}" target="_blank" rel="noopener noreferrer">View source on CJ ↗</a>
          </div>
        </div>
      </div>`;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("locked");

    if (updateHash && location.hash !== `#product/${id}`) {
      history.pushState({ product: id }, "", `#product/${id}`);
    }
  }

  function closeDetail(fromUser) {
    const modal = document.getElementById("productDetailModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");

    if (fromUser && location.hash.indexOf("#product/") === 0) {
      history.pushState({}, "", location.pathname + location.search);
    }
  }

  function openFromHash() {
    const match = location.hash.match(/^#product\/(.+)$/);
    if (match) {
      openDetail(decodeURIComponent(match[1]), false);
      return;
    }
    closeDetail(false);
  }

  function renderProductCardsWithImages() {
    if (typeof PRODUCTS === "undefined") return;
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    const visible = typeof activeFilter !== "undefined" && activeFilter !== "All"
      ? PRODUCTS.filter(product => product.category === activeFilter)
      : PRODUCTS;

    grid.innerHTML = visible.map(product => {
      const images = imagesFor(product);
      const imageMarkup = images.length
        ? `<img class="product-card-image" src="${escapeHtml(images[0])}" alt="${escapeHtml(product.name)} official product image" loading="lazy" referrerpolicy="no-referrer"><span class="image-cue">View details ↗</span>`
        : `<div class="visual-object" aria-hidden="true"></div><span class="image-cue">View details ↗</span>`;

      return `
        <article class="product-card reveal visible" data-product-id="${escapeHtml(product.id)}" tabindex="0" role="link" aria-label="View ${escapeHtml(product.name)} details">
          <div class="product-visual ${images.length ? "has-product-image" : ""}" data-kind="${escapeHtml(product.kind)}">
            ${product.badge ? `<span class="product-tag">${escapeHtml(product.badge)}</span>` : ""}
            ${imageMarkup}
          </div>
          <div class="product-info">
            <div class="product-meta"><span>${escapeHtml(product.category)}</span><span>DW / ${String(PRODUCTS.indexOf(product) + 1).padStart(2, "0")}</span></div>
            <h3 class="product-name">${escapeHtml(product.name)}</h3>
            <div class="product-bottom">
              <span class="price">${escapeHtml(typeof money === "function" ? money(product.price) : `₹${product.price}`)}</span>
              <button class="add-button" type="button" data-add="${escapeHtml(product.id)}">Add to bag</button>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  function install() {
    ensureModal();

    const existingRender = window.renderProducts;
    window.renderProducts = function () {
      if (typeof existingRender === "function") existingRender();
      renderProductCardsWithImages();
    };

    document.addEventListener("click", function (event) {
      const card = event.target.closest("[data-product-id]");
      if (!card || event.target.closest("button,a")) return;
      openDetail(card.dataset.productId, true);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-product-id]");
      if (!card || event.target.closest("button,a")) return;
      event.preventDefault();
      openDetail(card.dataset.productId, true);
    });

    window.addEventListener("popstate", openFromHash);
    window.addEventListener("hashchange", openFromHash);

    document.addEventListener("DOMContentLoaded", function () {
      renderProductCardsWithImages();
      openFromHash();
    });

    if (document.readyState !== "loading") {
      renderProductCardsWithImages();
      openFromHash();
    }
  }

  install();
})();
