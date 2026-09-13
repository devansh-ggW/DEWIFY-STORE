/* ============================================================
   DEWIFY — Runtime product-image reliability layer
   - One image registry for cards, cart and product details.
   - Tries alternate sources when a host fails.
   - Never leaves a broken-image icon/alt text on screen.
   ============================================================ */
(function () {
  "use strict";

  if (window.__DEWIFY_IMAGE_RUNTIME__) return;
  window.__DEWIFY_IMAGE_RUNTIME__ = true;

  const IMAGES = {
    "dw-storage-vault": [
      "https://maqsood.me/cdn/shop/files/Product_Content_77.jpg?v=1785268495",
      "https://i.ebayimg.com/images/g/VYkAAeSwPQ9o70Sj/s-l1600.jpg",
      "https://i5.walmartimages.com/asr/a768a3be-cfa1-4543-be3b-d4bd41afa22b.ea5dadef1a02b6a0039473215a545f99.jpeg?odnBg=FFFFFF&odnHeight=768&odnWidth=768"
    ],
    "dw-witchlight": [
      "https://oss-cf.cjdropshipping.com/product/2026/07/04/08/08fcf3b3-a6bf-4e84-b942-996b9b5d9f5d.jpeg",
      "https://media.adeo.com/mkp/0ba7d37825817478bfa35ebd0ee2e46a/media.jpeg?fit=bounds&format=jpg&height=650&quality=80&width=650",
      "https://media.adeo.com/mkp/3fbc7aa47243aa1fe8eafb1c1ddc1c39/media.jpg"
    ],
    "dw-heatcore-jacket": [
      "https://cf.cjdropshipping.com/17000928/1725075714115506176.jpg",
      "https://cf.cjdropshipping.com/17000928/1725075714283278336.jpg"
    ],
    "dw-moonglow-pendant": [
      "https://cf.cjdropshipping.com/16367616/1636808394162.jpg"
    ],
    "dw-fruity-paws": [
      "https://images.pet-friends.co.kr/storage/pet_friends/product/id/8/d/5/8/f/4/a/8d58f4aa400cf3ca2b8494f5d6a20b2c/10000/19ba6e25823b48338a8231aaaff13f24.jpg",
      "https://i5.walmartimages.com/seo/Djunllk-Pet-Dog-T-Shirt-Small-Dogs-Clothes-Summer-Dog-Tshirt-Pet-Dog-Summer-New-Clothing-Cute-Thin-Five-Color-Fruit-Vestscasual-Unisex-Puppy-Shirts-D_6fc21b15-f0f8-4996-8747-1b8e911863b9.6384aeb62f5b7ea815648a2d8ee3a58a.jpeg"
    ],
    "dw-bunnyglow": [
      "https://cf.cjdropshipping.com/17154720/2405120725050328100.jpg"
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
    "dw-pup-match-vest": [
      "https://down-ph.img.susercontent.com/file/1a5e8dabc99b11192a5d558e76fa2998",
      "https://furrinn.com/cdn/shop/files/IMG_4311.jpg?v=1749623987",
      "https://ae01.alicdn.com/kf/S5c968d241dea4e50b0d8537c6a6f97bdJ/Dog-Vest-Summer-Breathable-Small-Dog-Mesh-Vest-Messi-Neymar.jpg"
    ]
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

  function idFromTitle(title) {
    const normalized = String(title || "").trim();
    return Object.keys(TITLES).find(id => TITLES[id] === normalized) || null;
  }

  function makeFallback(label, compact) {
    const box = document.createElement("div");
    box.className = compact ? "dewify-image-fallback compact" : "dewify-image-fallback";
    box.innerHTML = `<span>DEWIFY / PRODUCT</span><strong>${String(label || "Product").replace(/[&<>]/g, "")}</strong>`;
    return box;
  }

  function showFallback(parent, label, compact) {
    if (!parent || parent.querySelector(":scope > .dewify-image-fallback")) return;
    parent.classList.add("dewify-image-failed");
    parent.appendChild(makeFallback(label, compact));
  }

  function bindImage(img, sources, label, options = {}) {
    if (!img || img.dataset.dewifyImageBound === "true") return;
    const validSources = [...new Set((sources || []).filter(Boolean))];
    if (!validSources.length) {
      showFallback(img.parentElement, label, options.compact);
      img.remove();
      return;
    }

    img.dataset.dewifyImageBound = "true";
    let index = 0;
    const tryNext = () => {
      if (index >= validSources.length) {
        const parent = img.parentElement;
        img.remove();
        showFallback(parent, label, options.compact);
        return;
      }
      const source = validSources[index++];
      img.dataset.dewifyImageSource = source;
      img.onerror = tryNext;
      img.removeAttribute("srcset");
      img.src = source;
    };
    tryNext();
  }

  function sourcesFor(id) {
    return IMAGES[id] || [];
  }

  function decorateProductCards() {
    document.querySelectorAll(".product-card").forEach(card => {
      const id = card.dataset.productId || idFromTitle(card.querySelector(".product-name")?.textContent);
      if (!id) return;
      const visual = card.querySelector(".product-visual");
      if (!visual) return;
      const image = visual.querySelector(".product-card-image");
      if (image) {
        bindImage(image, sourcesFor(id), TITLES[id], { compact: false });
        return;
      }
      const fallback = visual.querySelector(".dewify-image-fallback");
      if (fallback) return;
      const replacement = document.createElement("img");
      replacement.className = "product-card-image";
      replacement.alt = `${TITLES[id]} product image`;
      replacement.loading = "lazy";
      replacement.referrerPolicy = "no-referrer";
      visual.classList.add("has-product-image");
      const cue = visual.querySelector(".image-cue");
      if (cue) visual.insertBefore(replacement, cue); else visual.appendChild(replacement);
      bindImage(replacement, sourcesFor(id), TITLES[id], { compact: false });
    });
  }

  function decorateCart() {
    document.querySelectorAll("#cartContent .cart-line").forEach(line => {
      const name = line.querySelector(".cart-name")?.textContent;
      const id = idFromTitle(name);
      const visual = line.querySelector(".mini-visual");
      if (!id || !visual || visual.dataset.dewifyImageReady === "true") return;

      visual.dataset.dewifyImageReady = "true";
      visual.innerHTML = "";
      const image = document.createElement("img");
      image.className = "cart-product-image";
      image.alt = `${TITLES[id]} product image`;
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      visual.appendChild(image);
      bindImage(image, sourcesFor(id), TITLES[id], { compact: true });
    });
  }

  function decorateDetail() {
    const modal = document.getElementById("productDetailModal");
    if (!modal || modal.getAttribute("aria-hidden") === "true") return;
    const id = location.hash.match(/^#product\/([^/]+)$/)?.[1];
    if (!id) return;
    const main = modal.querySelector("#detailMainImage");
    if (main) bindImage(main, sourcesFor(id), TITLES[id], { compact: false });

    modal.querySelectorAll(".product-detail-thumb img").forEach((thumb, index) => {
      const src = sourcesFor(id)[index];
      if (src) {
        thumb.removeAttribute("srcset");
        thumb.src = src;
        thumb.closest("[data-detail-thumb]")?.setAttribute("data-detail-thumb", src);
        thumb.onerror = () => { thumb.style.visibility = "hidden"; };
      }
    });
  }

  function installStyles() {
    if (document.getElementById("dewifyImageRuntimeStyles")) return;
    const style = document.createElement("style");
    style.id = "dewifyImageRuntimeStyles";
    style.textContent = `
      .product-card-image,
      .cart-product-image { display:block; width:100%; height:100%; object-fit:cover; }
      .product-card-image { background:#141414; }
      .cart-product-image { object-fit:cover; background:#141414; }
      .dewify-image-fallback {
        width:100%; height:100%; min-height:180px; box-sizing:border-box;
        display:flex; flex-direction:column; justify-content:flex-end; gap:8px;
        padding:18px; background:radial-gradient(circle at 75% 20%,rgba(255,255,255,.12),transparent 35%),linear-gradient(135deg,#1c1c1c,#0c0c0c);
        color:#f3f1eb;
      }
      .dewify-image-fallback span { font-size:8px; letter-spacing:.16em; color:#969696; }
      .dewify-image-fallback strong { font:600 20px/1 "Space Grotesk",sans-serif; letter-spacing:-.04em; }
      .dewify-image-fallback.compact { min-height:100%; padding:10px; }
      .dewify-image-fallback.compact strong { font-size:11px; }
      .mini-visual { overflow:hidden; background:#141414; }
      .cart-product-image { transition:transform .35s ease; }
      .cart-line:hover .cart-product-image { transform:scale(1.025); }
      .dewify-image-failed { overflow:hidden; }
    `;
    document.head.appendChild(style);
  }

  function init() {
    installStyles();
    decorateProductCards();
    decorateCart();
    decorateDetail();

    const productGrid = document.getElementById("productGrid");
    const cartContent = document.getElementById("cartContent");
    const observer = new MutationObserver(() => {
      decorateProductCards();
      decorateCart();
      decorateDetail();
    });
    if (productGrid) observer.observe(productGrid, { childList: true, subtree: true });
    if (cartContent) observer.observe(cartContent, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("hashchange", () => setTimeout(decorateDetail, 0));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
