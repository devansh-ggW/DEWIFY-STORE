/**
 * DEWIFY — Google Sheets Order API
 *
 * Deploy as Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 */

const SPREADSHEET_ID = "1uSjmnq_7uP0y4PlJtmRchtHB7ouzFbIrfp0YuQG5oic";
const SHEET_NAME = "DEWIFY Orders";

const HEADERS = [
  "Order ID", "Date/Time", "Customer Name", "Phone", "Email",
  "Address", "City", "State", "PIN Code", "Product(s)", "Quantity",
  "Total Amount", "Payment Method", "Order Status"
];

function doGet() {
  try {
    const sheet = getOrdersSheet_();
    return json_({
      ok: true,
      service: "DEWIFY Orders API",
      status: "online",
      spreadsheet: SPREADSHEET_ID,
      sheet: sheet.getName(),
      rows: sheet.getLastRow(),
      columns: sheet.getLastColumn()
    });
  } catch (err) {
    return json_({
      ok: false,
      service: "DEWIFY Orders API",
      error: err && err.message ? err.message : String(err)
    });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    if (!e || !e.postData || typeof e.postData.contents !== "string") {
      throw new Error("Missing request body.");
    }

    let input;
    try {
      input = JSON.parse(e.postData.contents);
    } catch (_) {
      throw new Error("Invalid JSON request body.");
    }

    const order = validateAndNormalize_(input);
    const sheet = getOrdersSheet_();

    const existing = findClientRequestId_(order.clientRequestId);
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
    const productText = order.items.map(function(item) {
      return item.name + " × " + item.qty;
    }).join(" | ");
    const quantity = order.items.reduce(function(sum, item) {
      return sum + item.qty;
    }, 0);

    sheet.appendRow([
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
    ]);

    SpreadsheetApp.flush();

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
      error: err && err.message ? err.message : String(err)
    });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function validateAndNormalize_(input) {
  if (!input || typeof input !== "object") throw new Error("Invalid payload.");

  const clientRequestId = clean_(input.clientRequestId, 100);
  if (!clientRequestId) throw new Error("Missing request ID.");

  const c = input.customer || {};
  const customer = {
    name: clean_(c.name, 120),
    phone: clean_(c.phone, 30),
    email: clean_(c.email, 200).toLowerCase(),
    address: clean_(c.address, 500),
    city: clean_(c.city, 100),
    state: clean_(c.state, 100),
    pincode: clean_(c.pincode, 6)
  };

  if (!customer.name) throw new Error("Customer name is required.");
  if (!/^\+?[0-9\s()\-]{10,20}$/.test(customer.phone)) throw new Error("Invalid phone number.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new Error("Invalid email.");
  if (!customer.address) throw new Error("Address is required.");
  if (!customer.city) throw new Error("City is required.");
  if (!customer.state) throw new Error("State is required.");
  if (!/^\d{6}$/.test(customer.pincode)) throw new Error("Invalid PIN code.");

  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 30) {
    throw new Error("Invalid items.");
  }

  const items = input.items.map(function(item) {
    const name = clean_(item.name, 200);
    const id = clean_(item.id, 100);
    const qty = Number(item.qty);
    const price = Number(item.price);
    const subtotal = Number(item.subtotal);

    if (!name || !id) throw new Error("Invalid product.");
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new Error("Invalid quantity.");
    if (!Number.isFinite(price) || price < 0 || price > 100000000) throw new Error("Invalid product price.");
    if (!Number.isFinite(subtotal) || subtotal < 0) throw new Error("Invalid product subtotal.");

    return { id: id, name: name, qty: qty, price: price, subtotal: subtotal };
  });

  const calculatedTotal = items.reduce(function(sum, item) {
    return sum + item.price * item.qty;
  }, 0);

  if (!Number.isFinite(calculatedTotal) || calculatedTotal < 0) throw new Error("Invalid total.");

  const paymentMethod = clean_(input.paymentMethod, 30).toUpperCase();
  if (paymentMethod !== "COD" && paymentMethod !== "UPI") throw new Error("Invalid payment method.");

  return {
    clientRequestId: clientRequestId,
    customer: customer,
    items: items,
    total: Math.round(calculatedTotal),
    paymentMethod: paymentMethod
  };
}

function getOrdersSheet_() {
  if (!SPREADSHEET_ID) throw new Error("SPREADSHEET_ID has not been configured.");

  let ss;
  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    throw new Error("Could not open spreadsheet. Check SPREADSHEET_ID and Apps Script authorization.");
  }

  if (!ss) throw new Error("Spreadsheet could not be opened.");

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  } else {
    if (sheet.getLastColumn() < HEADERS.length) {
      throw new Error("The DEWIFY Orders sheet has fewer than 14 columns. Keep the existing headers or create a fresh DEWIFY Orders sheet.");
    }

    const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
    const matches = HEADERS.every(function(header, index) {
      return currentHeaders[index] === header;
    });

    if (!matches) {
      throw new Error("The first row of the DEWIFY Orders sheet does not match the required 14 headers.");
    }
  }

  return sheet;
}

function createUniqueOrderId_(sheet) {
  const lastRow = sheet.getLastRow();
  const values = lastRow >= 2
    ? sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues().flat()
    : [];
  const used = new Set(values.filter(Boolean));
  let id;
  do {
    id = "DEWIFY-" + Math.floor(100000 + Math.random() * 900000);
  } while (used.has(id));
  return id;
}

function findClientRequestId_(requestId) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty("DEWIFY_IDEMPOTENCY");
  if (!raw) return null;

  try {
    const map = JSON.parse(raw);
    const hit = map[requestId];
    if (!hit) return null;

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
  } catch (_) {
    map = {};
  }

  const now = Date.now();
  Object.keys(map).forEach(function(key) {
    if (!map[key] || now - new Date(map[key].createdAt).getTime() > 24 * 60 * 60 * 1000) delete map[key];
  });

  map[requestId] = value;
  const keys = Object.keys(map);
  if (keys.length > 500) {
    keys.sort(function(a, b) {
      return new Date(map[a].createdAt) - new Date(map[b].createdAt);
    }).slice(0, keys.length - 500).forEach(function(key) {
      delete map[key];
    });
  }

  props.setProperty("DEWIFY_IDEMPOTENCY", JSON.stringify(map));
}

function clean_(value, maxLength) {
  if (value === null || value === undefined) return "";
  let text = String(value).trim();
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text.slice(0, maxLength);
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
