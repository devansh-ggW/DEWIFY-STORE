/* ============================================================
   DEWIFY — Product detail experience
   Product cards + detail modal + curated product imagery.
   Keeps the existing cart/checkout flow intact.
   ============================================================ */
(function () {
  "use strict";

  const IMAGE_MAP = {
    // Verified from CJ product listings already used by DEWIFY.
    "dw-heatcore-jacket": [
      "https://cf.cjdropshipping.com/17000928/1725075714115506176.jpg",
      "https://cf.cjdropshipping.com/17000928/1725075714283278336.jpg"
    ],
    "dw-moonglow-pendant": [
      "https://cf.cjdropshipping.com/16367616/1636808394162.jpg",
      "https://liorvane.com/cdn/shop/files/545876677731.jpg"
    ],
    "dw-bunnyglow": [
      "https://cf.cjdropshipping.com/17154720/2405120725050328100.jpg",
      "https://scrollfindsshop.com/cdn/shop/files/329649a64a2cbc47577e6a0d705f.webp"
    ],
    "dw-orbitmoon-lamp": [
      "https://cf.cjdropshipping.com/17116704/2403290157100327000.jpg",
      "https://eleganceuniverse.com/cdn/shop/files/0896832a-46ae-4d02-8242-ad2b3e08a62f.jpg?v=1702764669"
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
    ],

    // Same CJ SKUs found on active storefronts carrying the matching item.
    "dw-fruity-paws": [
      "https://lexilazer.com/cdn/shop/files/4540117023682.jpg?v=1753409164"
    ],
    "dw-pup-match-vest": [
      "https://lexilazer.com/cdn/shop/files/4540117023682.jpg?v=1753409164",
      "https://lexilazer.com/cdn/shop/files/2621323813703.jpg?v=1753409165"
    ],

    // Best product-match imagery found publicly for the exact listing type.
    // These are intentionally marked in the detail footer as marketplace imagery,
    // not claimed as official CJ CDN assets.
    "dw-storage-vault": [
      "https://maqsood.me/cdn/shop/files/Product_Content_77.jpg?v=1785268495"
    ],
    "dw-witchlight": [
      "https://images.unsplash.com/photo-1505635276824-80b1c5a2f2f8?auto=format&fit=crop&w=1200&q=88"
    ]
  };

  const DETAILS = {
    "dw-storage-vault": {
      eyebrow: "SPACE / ORDER",
      headline: "Turn clutter into clean space.",
      description: "A soft, foldable storage solution for clothes, bedding, seasonal items, moving and travel — without giving up valuable closet or under-bed space.",
      highlights: ["Large-capacity storage", "Double-zipper opening", "Reinforced carry handle", "Folds away when empty"],
      specs: ["Material: non-woven fabric", "Sizes: small to extra large", "Uses: bedroom, bedding, moving, travel"],
      imageLabel: "Product-match image"
    },
    "dw-witchlight": {
      eyebrow: "LIGHT / GOTHIC",
      headline: "Give your room a little witchy energy.",
      description: "A character-filled decorative lamp designed for shelves, bedside tables, Halloween setups and gothic-inspired rooms.",
      highlights: ["USB powered", "Three style variants", "Statement décor piece", "Great for themed spaces"],
      specs: ["Material: synthetic resin", "Variants: 18 cm / 30 cm", "Power: USB plug-in"],
      imageLabel: "Curated product-match image"
    },
    "dw-heatcore-jacket": {
      eyebrow: "COLD / CONTROL",
      headline: "Heat where winter actually hits.",
      description: "A USB-powered heated jacket with multiple temperature settings for cold commutes, travel and outdoor days.",
      highlights: ["3 temperature settings", "Carbon-fiber heating elements", "Removable hood", "Large size range S–6XL"],
      specs: ["Sizes: S–6XL", "Multiple colour/zone options", "Power bank not included", "Use with a compatible power bank as specified by the seller"],
      imageLabel: "Official CJ product imagery"
    },
    "dw-moonglow-pendant": {
      eyebrow: "GLOW / AFTER DARK",
      headline: "Carry a little moonlight.",
      description: "A luminous moon pendant designed to glow after exposure to light, giving a simple outfit a subtle celestial detail.",
      highlights: ["Luminous stone pendant", "Multiple colour options", "Celestial-inspired design", "Lightweight everyday piece"],
      specs: ["Pendant: approx. 3.2 cm", "Chain: approx. 45 + 5 cm", "Colours vary by option"],
      imageLabel: "Official CJ / matching marketplace imagery"
    },
    "dw-fruity-paws": {
      eyebrow: "PET / COZY",
      headline: "Tiny outfit. Massive personality.",
      description: "A playful fruit-inspired pet hoodie for small dogs and cats, made for chilly days, photos and everyday walks.",
      highlights: ["7 style options", "XS–2XL sizing", "Fruit-inspired designs", "Designed for small pets"],
      specs: ["Material: cloth", "Sizes: XS–2XL", "Styles vary by option"],
      imageLabel: "Matching CJ SKU marketplace imagery"
    },
    "dw-bunnyglow": {
      eyebrow: "SOFT / NIGHT",
      headline: "The kind of light you actually want at night.",
      description: "A touch-controlled silicone bunny lamp made for bedside tables, kids' rooms and gentle late-night lighting.",
      highlights: ["Touch control", "3 brightness levels", "30-minute timer", "USB rechargeable"],
      specs: ["Material: ABS + silicone", "Battery: 1200mAh", "Size: approx. 143 × 109 × 85 mm", "Runtime: approx. 6–8 hours"],
      imageLabel: "Official CJ / matching marketplace imagery"
    },
    "dw-orbitmoon-lamp": {
      eyebrow: "SPACE / AMBIENCE",
      headline: "Your own tiny universe.",
      description: "A compact crystal-ball lamp with planetary and nebula-inspired designs — built to turn a desk or shelf into an atmospheric little space scene.",
      highlights: ["3D planetary look", "Compact 6 cm format", "Multiple space designs", "Gift-friendly display piece"],
      specs: ["Approx. size: 6 cm", "Wooden lamp-holder option", "Nebula / Moon / Saturn / Solar System styles"],
      imageLabel: "Official CJ / matching marketplace imagery"
    },
    "dw-temptrack-bottle": {
      eyebrow: "DRINK / DAILY",
      headline: "Know the temperature. Keep moving.",
      description: "A 450 ml insulated bottle with a digital temperature display for desks, commutes, cars and everyday carry.",
      highlights: ["Digital temperature display", "316 stainless-steel liner", "Hot/cold insulation", "450 ml capacity"],
      specs: ["Capacity: 450 ml", "Liner: 316 stainless steel", "Claimed insulation: 6–12 hours", "Multiple colours/styles"],
      imageLabel: "Official CJ product imagery"
    },
    "dw-cloudwarm-socks": {
      eyebrow: "COZY / HOME",
      headline: "Cold feet are no longer invited.",
      description: "Long fuzzy socks for cold-weather lounging, sleeping and relaxing at home when regular socks just don't cut it.",
      highlights: ["Fuzzy warm feel", "Long-leg coverage", "Home and sleep friendly", "Cold-weather essential"],
      specs: ["Material: cotton", "Foot length: approx. 23–25.5 cm", "Leg length: approx. 55 cm", "One-size style listing"],
      imageLabel: "Official CJ product imagery"
    },
    "dw-ravenhide-watch": {
      eyebrow: "TIME / ATTITUDE",
      headline: "Retro character without trying too hard.",
      description: "A bold, antique-inspired electronic wristwatch with a large dial and cowhide-look strap for an old-school finish.",
      highlights: ["Retro aesthetic", "Electronic movement", "46 mm dial", "Bold everyday accessory"],
      specs: ["Dial: approx. 46 mm", "Thickness: approx. 15 mm", "Movement: electronic", "Waterproofing: not listed by seller"],
      imageLabel: "Official CJ product imagery"
    },
    "dw-pup-match-vest": {
      eyebrow: "PET / ACTIVE",
      headline: "Little sidekick. Sporty fit.",
      description: "A lightweight sports-style pet vest for walks, warmer weather and playful everyday outfits.",
      highlights: ["Sport-inspired look", "Red and black options", "Multiple sizes", "Lightweight pet layer"],
      specs: ["Sizes: S–XXL", "Colours: red / black", "Pet apparel"],
      imageLabel: "Matching CJ SKU marketplace imagery"
    }
  };

  const TITLES = {
    "dw-storage-vault": "FoldAway Storage Vault",
    "dw-witchlight": "Witchlight Gothic Hat Lamp",
    "dw-heatcore-jacket": "HeatCore USB Heated Jacket",
    "dw-moonglow-pendant": "MoonGlow Luminous Pendant",
    "dw-fruity-paws": "Fruity Paws Cozy Hoodie",
    "dw-bunnyglow": "BunnyGlow Touch Night Light",
    "dw-orbitmoon-lamp": "OrbitMoon Crystal Night Lamp",
    "dw-temptrack-bottle": "TempTrack Insulated Bottle",
    "dw-cloudwarm-socks": "CloudWarm Over-Knee Socks",
    "dw-ravenhide-watch": "RavenHide Retro Leather Watch",
    "dw-pup-match-vest": "PupMatch Sports Vest"
  };

  const IDS_BY_TITLE = Object.fromEntries(Object.entries(TITLES).map(([id, title]) => [title, id]));

  function getProducts() {
    return typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
  }

  function productById(id) {
    return getProducts().find(product => product.id === id) || { id, name: TITLES[id] || id, price: 0, category: "DEWIFY", sourceUrl: "#" };
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function imagesFor(id) {
    return (IMAGE_MAP[id] || []).filter(Boolean);
  }

  function installStyles() {
    if (document.getElementById("dewifyProductDetailStyles")) return;
    const style = document.createElement("style");
    style.id = "dewifyProductDetailStyles";
    style.textContent = `
      .product-card { cursor: pointer; }
      .product-visual.has-product-image { background: #141414; }
      .product-card-image {
        width: 100%; height: 100%; object-fit: cover; display: block;
        transition: transform .55s cubic-bezier(.2,.8,.2,1), filter .35s ease;
      }
      .product-card:hover .product-card-image { transform: scale(1.045); filter: contrast(1.03); }
      .image-cue {
        position: absolute; z-index: 3; right: 10px; bottom: 10px;
        padding: 7px 9px; border: 1px solid rgba(243,241,235,.22);
        background: rgba(8,8,8,.72); color: var(--text); backdrop-filter: blur(10px);
        font-size: 8px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
        opacity: 0; transform: translateY(5px); transition: all .25s var(--ease);
      }
      .product-card:hover .image-cue, .product-card:focus-visible .image-cue { opacity: 1; transform: translateY(0); }
      .product-card:focus-visible { outline: 2px solid var(--white); outline-offset: 3px; }
      .product-detail-modal { z-index: 95; }
      .product-detail-panel {
        position: relative; z-index: 1; width: min(1100px, calc(100% - 24px));
        max-height: calc(100vh - 24px); overflow: auto; margin: 12px auto;
        background: #0d0d0d; border: 1px solid var(--line-strong);
        transform: translateY(14px); opacity: 0; transition: all .32s var(--ease);
      }
      .product-detail-modal.is-open .product-detail-panel { transform: translateY(0); opacity: 1; }
      .product-detail-head { display:flex; justify-content:space-between; align-items:center; padding: 18px 20px; border-bottom: 1px solid var(--line); position:sticky; top:0; background: rgba(13,13,13,.92); backdrop-filter: blur(14px); z-index:5; }
      .product-detail-head .eyebrow { margin:0; }
      .product-detail-grid { display:grid; grid-template-columns:minmax(0,1.05fr) minmax(320px,.95fr); gap:0; }
      .product-detail-gallery { padding:20px; border-right:1px solid var(--line); }
      .product-detail-main-image { aspect-ratio: 1 / 1; overflow:hidden; border:1px solid var(--line); background:#161616; display:grid; place-items:center; }
      .product-detail-main-image img { width:100%; height:100%; object-fit:contain; display:block; background:#161616; }
      .product-detail-thumbs { display:flex; gap:8px; margin-top:10px; overflow:auto; }
      .product-detail-thumb { width:70px; height:70px; flex:0 0 70px; padding:0; border:1px solid var(--line); background:#111; cursor:pointer; overflow:hidden; }
      .product-detail-thumb.active { border-color:var(--line-strong); }
      .product-detail-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
      .product-image-fallback { width:100%; height:100%; min-height:300px; display:flex; flex-direction:column; justify-content:flex-end; padding:25px; background: radial-gradient(circle at 70% 20%, rgba(255,255,255,.1), transparent 35%), linear-gradient(135deg,#1b1b1b,#0d0d0d); }
      .product-image-fallback span { color:var(--muted); font-size:9px; letter-spacing:.16em; }
      .product-image-fallback strong { font:700 clamp(36px,5vw,64px)/.85 "Space Grotesk"; letter-spacing:-.07em; margin:12px 0; }
      .product-image-fallback small { color:var(--muted); max-width:280px; line-height:1.5; }
      .product-detail-copy { padding:28px; display:flex; flex-direction:column; }
      .product-detail-copy h1 { margin:0; font:600 clamp(30px,4vw,54px)/.95 "Space Grotesk"; letter-spacing:-.06em; }
      .product-detail-copy h2 { margin:26px 0 12px; font:500 clamp(22px,2.8vw,34px)/1 "Space Grotesk"; letter-spacing:-.04em; }
      .product-detail-description { margin:0; color:var(--muted); font-size:14px; line-height:1.65; max-width:580px; }
      .product-detail-highlights { display:grid; gap:0; margin:24px 0; border-block:1px solid var(--line); }
      .product-detail-highlights div { padding:12px 0; border-bottom:1px solid var(--line); font-size:12px; }
      .product-detail-highlights div:last-child { border-bottom:0; }
      .product-detail-highlights span { display:inline-grid; place-items:center; width:18px; height:18px; margin-right:8px; border:1px solid var(--line-strong); font-size:10px; }
      .product-detail-buy { display:flex; justify-content:space-between; align-items:flex-end; gap:18px; padding:18px 0; border-bottom:1px solid var(--line); }
      .product-detail-buy strong { display:block; font:600 27px "Space Grotesk"; letter-spacing:-.04em; }
      .product-detail-specs { padding:20px 0; }
      .product-detail-specs .eyebrow { margin-bottom:10px; }
      .product-detail-specs div { color:var(--muted); font-size:11px; line-height:1.8; }
      .product-detail-footer { margin-top:auto; padding-top:20px; display:flex; justify-content:space-between; gap:15px; align-items:end; border-top:1px solid var(--line); }
      .product-detail-footer span { color:var(--muted); font-size:9px; line-height:1.5; max-width:55%; }
      .product-detail-footer a { font-size:9px; text-transform:uppercase; letter-spacing:.1em; font-weight:700; }
      @media (max-width: 760px) {
        .product-detail-panel { width: min(100%, calc(100% - 12px)); max-height:calc(100vh - 12px); margin:6px auto; }
        .product-detail-grid { grid-template-columns:1fr; }
        .product-detail-gallery { border-right:0; border-bottom:1px solid var(--line); padding:12px; }
        .product-detail-copy { padding:20px 16px 24px; }
        .product-detail-buy { align-items:center; }
        .product-detail-buy .button { min-width:0; flex:1; }
        .product-detail-footer { align-items:flex-start; flex-direction:column; }
        .product-detail-footer span { max-width:none; }
      }
    `;
    document.head.appendChild(style);
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
        const id = addButton.dataset.detailAdd;
        if (typeof window.addToCart === "function") window.addToCart(id);
        else if (typeof addToCart === "function") addToCart(id);
        return;
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

  function moneyFor(product) {
    try {
      if (typeof window.money === "function") return window.money(product.price);
    } catch (_) {}
    return `₹${Number(product.price || 0).toLocaleString("en-IN")}`;
  }

  function openDetail(id, updateHash) {
    const product = productById(id);
    const detail = DETAILS[id] || {
      eyebrow: product.category || "DEWIFY",
      headline: "A better everyday find.",
      description: "A curated product from the current DEWIFY edit.",
      highlights: [], specs: [], imageLabel: "Product image"
    };
    const images = imagesFor(id);
    const modal = ensureModal();
    const body = document.getElementById("productDetailBody");
    const hasImages = images.length > 0;

    body.innerHTML = `
      <div class="product-detail-grid">
        <div class="product-detail-gallery">
          <div class="product-detail-main-image ${hasImages ? "has-image" : "no-image"}">
            ${hasImages
              ? `<img id="detailMainImage" src="${esc(images[0])}" alt="${esc(product.name)} product image" loading="eager" referrerpolicy="no-referrer">`
              : `<div class="product-image-fallback"><span>DEWIFY / PREVIEW</span><strong>${esc(product.name).replace(/\s+/g, "<br>")}</strong><small>${esc(detail.imageLabel)}</small></div>`}
          </div>
          ${images.length > 1 ? `<div class="product-detail-thumbs" aria-label="Product images">${images.map((src, index) => `<button class="product-detail-thumb ${index === 0 ? "active" : ""}" type="button" data-detail-thumb="${esc(src)}" aria-label="View product image ${index + 1}"><img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer"></button>`).join("")}</div>` : ""}
        </div>
        <div class="product-detail-copy">
          <p class="eyebrow">${esc(detail.eyebrow)}</p>
          <h1 id="productDetailTitle">${esc(product.name)}</h1>
          <h2>${esc(detail.headline)}</h2>
          <p class="product-detail-description">${esc(detail.description)}</p>
          ${detail.highlights.length ? `<div class="product-detail-highlights">${detail.highlights.map(item => `<div><span>✓</span>${esc(item)}</div>`).join("")}</div>` : ""}
          <div class="product-detail-buy">
            <div><span class="eyebrow">DEWIFY PRICE</span><strong>${esc(moneyFor(product))}</strong></div>
            <button class="button button-light" type="button" data-detail-add="${esc(id)}">Add to bag <span>↗</span></button>
          </div>
          ${detail.specs.length ? `<div class="product-detail-specs"><p class="eyebrow">DETAILS</p>${detail.specs.map(item => `<div>${esc(item)}</div>`).join("")}</div>` : ""}
          <div class="product-detail-footer">
            <span>${esc(detail.imageLabel)}</span>
            <a href="${esc(product.sourceUrl || "#")}" target="_blank" rel="noopener noreferrer">View source on CJ ↗</a>
          </div>
        </div>
      </div>`;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("locked");
    if (updateHash && location.hash !== `#product/${id}`) history.pushState({ product: id }, "", `#product/${id}`);
  }

  function closeDetail(fromUser) {
    const modal = document.getElementById("productDetailModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
    if (fromUser && location.hash.startsWith("#product/")) history.pushState({}, "", location.pathname + location.search);
  }

  function idFromCard(card) {
    const name = card.querySelector(".product-name")?.textContent?.trim();
    return IDS_BY_TITLE[name] || null;
  }

  function decorateCards() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    grid.querySelectorAll(".product-card").forEach(card => {
      if (card.dataset.dewifyEnhanced === "true") return;
      const id = idFromCard(card);
      if (!id) return;
      card.dataset.productId = id;
      card.dataset.dewifyEnhanced = "true";
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "link");
      card.setAttribute("aria-label", `View ${TITLES[id]} details`);

      const visual = card.querySelector(".product-visual");
      const images = imagesFor(id);
      if (visual && images.length) {
        visual.classList.add("has-product-image");
        const oldObject = visual.querySelector(".visual-object");
        if (oldObject) oldObject.remove();
        visual.insertAdjacentHTML("beforeend", `<img class="product-card-image" src="${esc(images[0])}" alt="${esc(TITLES[id])} product image" loading="lazy" referrerpolicy="no-referrer"><span class="image-cue">View details ↗</span>`);
      } else if (visual) {
        visual.insertAdjacentHTML("beforeend", `<span class="image-cue">View details ↗</span>`);
      }
    });
  }

  function bindGlobalClicks() {
    document.addEventListener("click", event => {
      const card = event.target.closest(".product-card[data-product-id]");
      if (!card || event.target.closest("button, a, input, textarea, select")) return;
      openDetail(card.dataset.productId, true);
    });

    document.addEventListener("keydown", event => {
      const card = event.target.closest?.(".product-card[data-product-id]");
      if (!card || (event.key !== "Enter" && event.key !== " ")) return;
      if (event.target.closest("button, a, input, textarea, select")) return;
      event.preventDefault();
      openDetail(card.dataset.productId, true);
    });

    window.addEventListener("popstate", openFromHash);
    window.addEventListener("hashchange", openFromHash);
  }

  function openFromHash() {
    const match = location.hash.match(/^#product\/([^/]+)$/);
    if (match) openDetail(decodeURIComponent(match[1]), false);
    else closeDetail(false);
  }

  function init() {
    installStyles();
    ensureModal();
    bindGlobalClicks();
    decorateCards();

    const grid = document.getElementById("productGrid");
    if (grid && "MutationObserver" in window) {
      const observer = new MutationObserver(() => decorateCards());
      observer.observe(grid, { childList: true });
    }

    openFromHash();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
