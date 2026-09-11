// ============================================================
// DEWIFY — Google Sheets order checkout
// Customer → Google Apps Script Web App → Google Sheet
// No database credentials or private secrets are used in the browser.
// ============================================================
const WHATSAPP_NUMBER = "919422843899";
const GOOGLE_APPS_SCRIPT_URL = window.DEWIFY_CONFIG?.GOOGLE_APPS_SCRIPT_URL || "";

const PRODUCTS = [
  { id: "dw-tee", name: "Oversized Utility Tee", category: "Wear", price: 899, badge: "NEW", kind: "tee" },
  { id: "dw-sling", name: "Minimal Crossbody Sling", category: "Utility", price: 749, badge: "DROP", kind: "sling" },
  { id: "dw-hoodie", name: "Classic Street Hoodie", category: "Wear", price: 1499, badge: "", kind: "hoodie" },
  { id: "dw-speaker", name: "Pocket Bluetooth Speaker", category: "Tech", price: 1299, badge: "HOT", kind: "speaker" },
  { id: "dw-organizer", name: "Everyday Tech Organizer", category: "Utility", price: 699, badge: "", kind: "organizer" },
  { id: "dw-lamp", name: "Metal Desk Lamp", category: "Utility", price: 1199, badge: "NEW", kind: "lamp" },
  { id: "dw-case", name: "Wireless Earbuds Case", category: "Tech", price: 499, badge: "", kind: "case" },
  { id: "dw-cap", name: "Everyday Cap", category: "Wear", price: 599, badge: "", kind: "cap" }
];

const CART_KEY = "dewify-cart-v2";
const ORDERS_KEY = "dewify-orders-v1";

let cart = loadCart();
let activeFilter = "All";
let lastOrder = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function loadCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(stored)) return [];
    return stored
      .filter(item => PRODUCTS.some(p => p.id === item.id) && Number(item.qty) > 0)
      .map(item => ({ id: item.id, qty: Math.min(99, Math.max(1, Number(item.qty))) }));
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateBagCount();
}

function loadOrders() {
  try {
    const stored = JSON.parse(localStorage.getItem(ORDERS_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function getProduct(id) {
  return PRODUCTS.find(product => product.id === id);
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function cartTotal() {
  return cart.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
}

function updateBagCount() {
  const count = $("#bagCount");
  if (count) count.textContent = cartCount();
}

function renderProducts() {
  const visible = activeFilter === "All"
    ? PRODUCTS
    : PRODUCTS.filter(product => product.category === activeFilter);

  $("#productGrid").innerHTML = visible.map((product, index) => `
    <article class="product-card reveal visible">
      <div class="product-visual" data-kind="${product.kind}">
        ${product.badge ? `<span class="product-tag">${product.badge}</span>` : ""}
        <div class="visual-object" aria-hidden="true"></div>
      </div>
      <div class="product-info">
        <div class="product-meta">
          <span>${product.category}</span>
          <span>DW / ${String(PRODUCTS.indexOf(product) + 1).padStart(2, "0")}</span>
        </div>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-bottom">
          <span class="price">${money(product.price)}</span>
          <button class="add-button" type="button" data-add="${product.id}">Add to bag</button>
        </div>
      </div>
    </article>
  `).join("");
}

function addToCart(id) {
  const existing = cart.find(item => item.id === id);
  if (existing) existing.qty = Math.min(existing.qty + 1, 99);
  else cart.push({ id, qty: 1 });
  saveCart();
  renderCart();
  showToast("Added to bag");
}

function changeQty(id, delta) {
  const item = cart.find(entry => entry.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(entry => entry.id !== id);
  saveCart();
  renderCart();
  renderCheckoutSummary();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  renderCart();
  renderCheckoutSummary();
}

function clearBag() {
  cart = [];
  saveCart();
  renderCart();
  renderCheckoutSummary();
  showToast("Bag cleared");
}

function renderCart() {
  const content = $("#cartContent");
  const footer = $("#cartFooter");

  if (!cart.length) {
    content.innerHTML = `
      <div class="empty-cart">
        <div>
          <strong>Your bag is quiet.</strong>
          <p>Start with something you will actually use.</p>
        </div>
      </div>`;
    footer.innerHTML = "";
    return;
  }

  content.innerHTML = cart.map(item => {
    const product = getProduct(item.id);
    return `
      <div class="cart-line">
        <div class="mini-visual" data-kind="${product.kind}">
          <div class="visual-object" aria-hidden="true"></div>
        </div>
        <div class="cart-line-main">
          <p class="cart-name">${product.name}</p>
          <span class="cart-price">${money(product.price)}</span>
          <div class="qty" aria-label="Quantity controls">
            <button type="button" data-minus="${product.id}" aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button type="button" data-plus="${product.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="remove" type="button" data-remove="${product.id}">Remove</button>
      </div>`;
  }).join("");

  footer.innerHTML = `
    <div class="cart-total-row"><span>Total</span><strong>${money(cartTotal())}</strong></div>
    <div class="cart-actions">
      <button class="clear-button" id="clearBag" type="button">Clear bag</button>
      <button class="button button-light" id="checkoutButton" type="button">Checkout <span>↗</span></button>
    </div>`;
}

function openBag() {
  $("#cartDrawer").classList.add("is-open");
  $("#cartDrawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
}

function closeBag() {
  $("#cartDrawer").classList.remove("is-open");
  $("#cartDrawer").setAttribute("aria-hidden", "true");
  document.body.classList.remove("locked");
}

function openCheckout() {
  if (!cart.length) {
    showToast("Your bag is empty");
    return;
  }
  closeBag();
  renderCheckoutSummary();
  $("#checkoutModal").classList.add("is-open");
  $("#checkoutModal").setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
  setTimeout(() => $("#customerName").focus(), 150);
}

function closeCheckout() {
  $("#checkoutModal").classList.remove("is-open");
  $("#checkoutModal").setAttribute("aria-hidden", "true");
  document.body.classList.remove("locked");
}

function renderCheckoutSummary() {
  $("#checkoutItems").innerHTML = cart.map(item => {
    const product = getProduct(item.id);
    return `<div class="summary-item"><span>${product.name} × ${item.qty}</span><strong>${money(product.price * item.qty)}</strong></div>`;
  }).join("");
  $("#checkoutTotal").textContent = money(cartTotal());
}

function createOrderId() {
  const existing = new Set(loadOrders().map(order => order.id));
  let id = "";
  do {
    id = `DEWIFY-${Math.floor(100000 + Math.random() * 900000)}`;
  } while (existing.has(id));
  return id;
}

function validPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function buildOrder({ name, phone, email, address, city, state, pincode }) {
  const id = createOrderId();
  const createdAt = new Date().toISOString();
  const items = cart.map(item => {
    const product = getProduct(item.id);
    return { id: product.id, name: product.name, price: product.price, qty: item.qty, subtotal: product.price * item.qty };
  });
  return {
    id, createdAt,
    customer: { name, phone, email, address, city, state, pincode },
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0),
    paymentStatus: "PENDING / DEMO",
    orderStatus: "NEW"
  };
}

function buildWhatsAppMessage(order) {
  const itemLines = order.items
    .map(item => `• ${item.name} × ${item.qty} — ${money(item.subtotal)}`)
    .join("\n");

  return [
    "DEWIFY — NEW ORDER",
    "",
    `Order ID: ${order.id}`,
    `Date: ${new Date(order.createdAt).toLocaleString("en-IN")}`,
    "",
    `Customer: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
    "",
    "DELIVERY ADDRESS:",
    order.customer.address,
    `${order.customer.city}, ${order.customer.state} ${order.customer.pincode}`,
    `Email: ${order.customer.email}`,
    "",
    "ITEMS:",
    itemLines,
    "",
    `TOTAL: ${money(order.total)}`,
    "PAYMENT: DEMO — NOT PAID",
    "STATUS: NEW DEMO ORDER",
    "",
    "Please confirm this order manually."
  ].join("\n");
}

async function submitOrder(event) {
  event.preventDefault();
  const error = $("#formError");
  error.textContent = "";

  const name = $("#customerName").value.trim();
  const phone = $("#customerPhone").value.trim();
  const email = $("#customerEmail").value.trim();
  const address = $("#customerAddress").value.trim();
  const city = $("#customerCity").value.trim();
  const state = $("#customerState").value.trim();
  const pincode = $("#customerPincode").value.trim();
  const paymentMethod = $("#paymentMethod")?.value || "COD";

  if (!name) { error.textContent = "Please enter your full name."; $("#customerName").focus(); return; }
  if (!validPhone(phone)) { error.textContent = "Please enter a valid phone number."; $("#customerPhone").focus(); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.textContent = "Please enter a valid email address."; $("#customerEmail").focus(); return; }
  if (!address) { error.textContent = "Please enter the full delivery address."; $("#customerAddress").focus(); return; }
  if (!city) { error.textContent = "Please enter your city."; $("#customerCity").focus(); return; }
  if (!state) { error.textContent = "Please enter your state."; $("#customerState").focus(); return; }
  if (!/^\d{6}$/.test(pincode)) { error.textContent = "Please enter a valid 6-digit pincode."; $("#customerPincode").focus(); return; }
  if (!cart.length) { error.textContent = "Your bag is empty."; return; }
  if (!GOOGLE_APPS_SCRIPT_URL || !GOOGLE_APPS_SCRIPT_URL.startsWith("https://script.google.com/macros/s/")) {
    error.textContent = "Order service is not configured yet. Please try again later.";
    return;
  }

  const form = $("#checkoutForm");
  const submitButton = form.querySelector('button[type="submit"]');

  // One submission can be in flight at a time. This blocks double taps/clicks.
  if (form.dataset.submitting === "true") return;
  form.dataset.submitting = "true";

  const originalText = submitButton?.textContent || "Place order";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    submitButton.textContent = "Placing order…";
  }

  // The Apps Script endpoint generates the final Order ID server-side.
  // clientRequestId lets the backend reject an accidental retry of the same checkout.
  const clientRequestId = (crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const items = cart.map(item => {
    const product = getProduct(item.id);
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      qty: item.qty,
      subtotal: product.price * item.qty
    };
  });

  const payload = {
    clientRequestId,
    customer: { name, phone, email, address, city, state, pincode },
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0),
    paymentMethod
  };

  try {
    /*
      IMPORTANT:
      Content-Type is text/plain instead of application/json so the request is a
      CORS "simple request" and does not trigger an OPTIONS preflight, which
      Google Apps Script web apps do not handle like a normal API server.
    */
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      cache: "no-store"
    });

    console.info("DEWIFY checkout response:", {
      status: response.status,
      ok: response.ok,
      url: response.url
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rawResponse = await response.text();
    console.info("DEWIFY checkout backend response:", rawResponse);

    let result;
    try {
      result = JSON.parse(rawResponse);
    } catch {
      throw new Error(`Backend returned non-JSON response: ${rawResponse.slice(0, 180)}`);
    }

    if (!result || result.ok !== true || !result.orderId) {
      throw new Error(result?.error || "Invalid backend response");
    }

    lastOrder = {
      id: result.orderId,
      createdAt: result.createdAt || new Date().toISOString(),
      customer: payload.customer,
      items: payload.items,
      total: payload.total,
      paymentMethod: payload.paymentMethod,
      paymentStatus: "PENDING",
      orderStatus: result.orderStatus || "NEW"
    };

    closeCheckout();
    openOrderSuccess(lastOrder);

    const message = buildWhatsAppMessage(lastOrder);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    const wa = document.querySelector("#openWhatsAppAfterOrder");
    if (wa) wa.onclick = () => window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    cart = [];
    saveCart();
    renderCart();
    form.reset();
  } catch (e) {
    console.error("DEWIFY order submission failed:", e);
    error.textContent = `Order failed: ${e?.message || "Unknown error"}`;
  } finally {
    form.dataset.submitting = "false";
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
      submitButton.textContent = originalText;
    }
  }
}
function openOrderSuccess(order) {
  $("#successOrderId").textContent = order.id;
  $("#successCustomer").textContent = order.customer.name;
  $("#successTotal").textContent = money(order.total);
  $("#successStatus").textContent = order.orderStatus;
  $("#orderSuccess").classList.add("is-open");
  $("#orderSuccess").setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
}

function closeOrderSuccess() {
  $("#orderSuccess").classList.remove("is-open");
  $("#orderSuccess").setAttribute("aria-hidden", "true");
  document.body.classList.remove("locked");
}

function copyOrderMessage() {
  if (!lastOrder) return;
  const message = buildWhatsAppMessage(lastOrder);
  navigator.clipboard?.writeText(message).then(
    () => showToast("Order message copied"),
    () => showToast("Copy unavailable — WhatsApp is ready")
  );
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function initReveal() {
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(item => item.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  items.forEach(item => observer.observe(item));
}

document.addEventListener("click", event => {
  const add = event.target.closest("[data-add]");
  if (add) addToCart(add.dataset.add);

  const plus = event.target.closest("[data-plus]");
  if (plus) changeQty(plus.dataset.plus, 1);

  const minus = event.target.closest("[data-minus]");
  if (minus) changeQty(minus.dataset.minus, -1);

  const remove = event.target.closest("[data-remove]");
  if (remove) removeFromCart(remove.dataset.remove);

  const filter = event.target.closest("[data-filter]");
  if (filter) {
    activeFilter = filter.dataset.filter;
    $$(".filter").forEach(button => button.classList.toggle("active", button === filter));
    renderProducts();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderCart();
  updateBagCount();
  initReveal();

  $("#openBag")?.addEventListener("click", openBag);
  $("#closeBag")?.addEventListener("click", closeBag);
  $("#drawerBackdrop")?.addEventListener("click", closeBag);

  $("#cartFooter")?.addEventListener("click", event => {
    if (event.target.closest("#clearBag")) clearBag();
    if (event.target.closest("#checkoutButton")) openCheckout();
  });

  $("#closeCheckout")?.addEventListener("click", closeCheckout);
  $("#modalBackdrop")?.addEventListener("click", closeCheckout);
  $("#checkoutForm")?.addEventListener("submit", submitOrder);

  $("#closeOrderSuccess")?.addEventListener("click", closeOrderSuccess);
  $("#successBackdrop")?.addEventListener("click", closeOrderSuccess);
  $("#copyOrderMessage")?.addEventListener("click", copyOrderMessage);

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    closeBag();
    closeCheckout();
    closeOrderSuccess();
  });
});
