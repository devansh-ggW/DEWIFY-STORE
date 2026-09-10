/**
 * DEWIFY — Google Sheets Order API
 *
 * Deploy this script as a Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Spreadsheet:
 *   Sheet name: DEWIFY Orders
 *
 * The script accepts only the fields needed to create a store order.
 * No Google credentials are ever sent from the customer browser.
 */

const SHEET_NAME = "DEWIFY Orders";
const HEADERS = [
  "Order ID",
  "Date/Time",
  "Customer Name",
  "Phone",
  "Email",
  "Address",
  "City",
  "State",
  "PIN Code",
  "Product(s)",
  "Quantity",
  "Total Amount",
  "Payment Method",
  "Order Status"
];

// Optional: restrict where requests can come from at the application layer.
// Browser CORS is handled by using a simple text/plain POST from the storefront.
const MAX_NAME = 120;
const MAX_PHONE = 30;
const MAX_EMAIL = 200;
const MAX_ADDRESS = 500;
const MAX_CITY = 100;
const MAX_STATE = 100;
const MAX_PIN = 6;
const MAX_ITEMS = 30;

function doGet() {
  return json_({
    ok: true,
    service: "DEWIFY Orders API",
    status: "online"
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    if (!e || !e.postData || typeof e.postData.contents !== "string") {
      return json_({ ok: false, error: "Missing request body." });
    }

    let input;
    try {
      input = JSON.parse(e.postData.contents);
    } catch (_) {
      return json_({ ok: false, error: "Invalid JSON." });
    }

    const order = validateAndNormalize_(input);

    const sheet = getOrdersSheet_();

    // Idempotency: if the same checkout request reaches Apps Script twice,
    // return the original order instead of creating a duplicate row.
    const existing = findClientRequestId_(sheet, order.clientRequestId);
    if (existing) {
      return json_({
        ok: true,
        duplicate: true,
        orderId: existing.orderId,
        createdAt: existing.createdAt,
        orderStatus: "NEW"
      });
    }

    const orderId = createUniqueOrderId_(sheet);
    const now = new Date();

    const productText = order.items
      .map(item => `${item.name} × ${item.qty}`)
      .join(" | ");

    const quantity = order.items.reduce((sum, item) => sum + item.qty, 0);

    // Client request ID is intentionally kept in a developer column only if
    // you choose to add it. The required public sheet columns remain exactly
    // the columns above. Idempotency uses PropertiesService instead.
    const row = [
      orderId,
      now,
      order.customer.name,
      order.customer.phone,
      order.customer.email,
      order.customer.address,
      order.customer.city,
      order.customer.state,
      order.customer.pincode,
      productText,
      quantity,
      order.total,
      order.paymentMethod,
      "NEW"
    ];

    sheet.appendRow(row);

    // Store idempotency key after the row has been written.
    rememberClientRequest_(order.clientRequestId, {
      orderId: orderId,
      createdAt: now.toISOString()
    });

    return json_({
      ok: true,
      orderId: orderId,
      createdAt: now.toISOString(),
      orderStatus: "NEW"
    });

  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({
      ok: false,
      error: "Unable to create the order."
    });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function validateAndNormalize_(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid payload.");
  }

  const clientRequestId = clean_(input.clientRequestId, 100);
  if (!clientRequestId) throw new Error("Missing request ID.");

  const c = input.customer || {};
  const customer = {
    name: clean_(c.name, MAX_NAME),
    phone: clean_(c.phone, MAX_PHONE),
    email: clean_(c.email, MAX_EMAIL).toLowerCase(),
    address: clean_(c.address, MAX_ADDRESS),
    city: clean_(c.city, MAX_CITY),
    state: clean_(c.state, MAX_STATE),
    pincode: clean_(c.pincode, MAX_PIN)
  };

  if (!customer.name) throw new Error("Customer name is required.");
  if (!/^\+?[0-9\s()\-]{10,20}$/.test(customer.phone)) {
    throw new Error("Invalid phone number.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    throw new Error("Invalid email.");
  }
  if (!customer.address) throw new Error("Address is required.");
  if (!customer.city) throw new Error("City is required.");
  if (!customer.state) throw new Error("State is required.");
  if (!/^\d{6}$/.test(customer.pincode)) {
    throw new Error("Invalid PIN code.");
  }

  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > MAX_ITEMS) {
    throw new Error("Invalid items.");
  }

  const items = input.items.map(item => {
    const name = clean_(item.name, 200);
    const id = clean_(item.id, 100);
    const qty = Number(item.qty);
    const price = Number(item.price);
    const subtotal = Number(item.subtotal);

    if (!name || !id) throw new Error("Invalid product.");
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new Error("Invalid quantity.");
    }
    if (!Number.isFinite(price) || price < 0 || price > 100000000) {
      throw new Error("Invalid product price.");
    }
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      throw new Error("Invalid product subtotal.");
    }

    return { id, name, qty, price, subtotal };
  });

  // Recalculate the total on the backend instead of trusting the browser.
  const calculatedTotal = items.reduce((sum, item) => {
    return sum + (item.price * item.qty);
  }, 0);

  if (!Number.isFinite(calculatedTotal) || calculatedTotal < 0) {
    throw new Error("Invalid total.");
  }

  const paymentMethod = clean_(input.paymentMethod, 30).toUpperCase();
  if (paymentMethod !== "COD" && paymentMethod !== "UPI") {
    throw new Error("Invalid payment method.");
  }

  return {
    clientRequestId,
    customer,
    items,
    total: Math.round(calculatedTotal),
    paymentMethod
  };
}

function getOrdersSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Spreadsheet is not available.");

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  } else {
    const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    const matches = HEADERS.every((h, i) => current[i] === h);
    if (!matches) {
      throw new Error(
        `The first row of "${SHEET_NAME}" does not match the required headers.`
      );
    }
  }

  return sheet;
}

function createUniqueOrderId_(sheet) {
  const values = sheet.getRange(
    2,
    1,
    Math.max(sheet.getLastRow() - 1, 1),
    1
  ).getDisplayValues().flat();

  const used = new Set(values.filter(Boolean));

  let id;
  do {
    id = "DEWIFY-" + Math.floor(100000 + Math.random() * 900000);
  } while (used.has(id));

  return id;
}

/**
 * Idempotency storage:
 * User properties are not appropriate because every visitor has no Google
 * account session. Script properties are shared, so we keep a small bounded
 * JSON map. This is enough to protect short-lived duplicate clicks/retries.
 */
function findClientRequestId_(sheet, requestId) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty("DEWIFY_IDEMPOTENCY");
  if (!raw) return null;

  try {
    const map = JSON.parse(raw);
    const hit = map[requestId];
    if (!hit) return null;

    // Expire keys after 24 hours.
    if (Date.now() - new Date(hit.createdAt).getTime() > 24 * 60 * 60 * 1000) {
      delete map[requestId];
      props.setProperty("DEWIFY_IDEMPOTENCY", JSON.stringify(map));
      return null;
    }

    return hit;
  } catch (_) {
    return null;
  }
}

function rememberClientRequest_(requestId, value) {
  const props = PropertiesService.getScriptProperties();
  let map = {};

  try {
    map = JSON.parse(props.getProperty("DEWIFY_IDEMPOTENCY") || "{}");
  } catch (_) {}

  // Remove entries older than 24 hours and cap the map.
  const now = Date.now();
  Object.keys(map).forEach(key => {
    if (!map[key] || now - new Date(map[key].createdAt).getTime() > 24 * 60 * 60 * 1000) {
      delete map[key];
    }
  });

  map[requestId] = value;

  const keys = Object.keys(map);
  if (keys.length > 500) {
    keys
      .sort((a, b) => new Date(map[a].createdAt) - new Date(map[b].createdAt))
      .slice(0, keys.length - 500)
      .forEach(key => delete map[key]);
  }

  props.setProperty("DEWIFY_IDEMPOTENCY", JSON.stringify(map));
}

function clean_(value, maxLength) {
  if (value === null || value === undefined) return "";
  let text = String(value).trim();

  // Prevent spreadsheet formula injection if a malicious value begins with
  // a formula character. Prefixing with an apostrophe makes Sheets store it
  // as plain text.
  if (/^[=+\-@]/.test(text)) text = "'" + text;

  return text.slice(0, maxLength);
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
