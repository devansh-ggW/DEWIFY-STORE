/**
 * DEWIFY — Google Sheets Order API
 *
 * Deploy as Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * IMPORTANT:
 * Put your Google Spreadsheet ID below.
 */

const SPREADSHEET_ID = "1uSjmnq_7uP0y4PlJtmRchtHB7ouzFbIrfp0YuQG5oic";
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

const MAX_NAME = 120;
const MAX_PHONE = 30;
const MAX_EMAIL = 200;
const MAX_ADDRESS = 500;
const MAX_CITY = 100;
const MAX_STATE = 100;
const MAX_PIN = 6;
const MAX_ITEMS = 30;


/* =========================================================
   GET — Health check
   ========================================================= */

function doGet() {
  return json_({
    ok: true,
    service: "DEWIFY Orders API",
    status: "online"
  });
}


/* =========================================================
   POST — Create order
   ========================================================= */

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    if (!e || !e.postData || typeof e.postData.contents !== "string") {
      throw new Error("Missing request body.");
    }

    console.log("Incoming request:");
    console.log(e.postData.contents);

    let input;

    try {
      input = JSON.parse(e.postData.contents);
    } catch (parseError) {
      throw new Error("Invalid JSON request body.");
    }

    const order = validateAndNormalize_(input);

    console.log("Validated order:");
    console.log(JSON.stringify(order));

    const sheet = getOrdersSheet_();

    /* -----------------------------------------------------
       Prevent duplicate checkout submissions
       ----------------------------------------------------- */

    const existing = findClientRequestId_(order.clientRequestId);

    if (existing) {
      console.log("Duplicate request detected.");

      return json_({
        ok: true,
        duplicate: true,
        orderId: existing.orderId,
        createdAt: existing.createdAt,
        orderStatus: "NEW"
      });
    }


    /* -----------------------------------------------------
       Generate order ID
       ----------------------------------------------------- */

    const orderId = createUniqueOrderId_(sheet);
    const now = new Date();


    /* -----------------------------------------------------
       Format products
       ----------------------------------------------------- */

    const productText = order.items
      .map(function(item) {
        return item.name + " × " + item.qty;
      })
      .join(" | ");

    const quantity = order.items.reduce(function(sum, item) {
      return sum + item.qty;
    }, 0);


    /* -----------------------------------------------------
       Build spreadsheet row
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       Write order
       ----------------------------------------------------- */

    console.log("Writing order to sheet...");
    console.log("Sheet: " + sheet.getName());

    sheet.appendRow(row);

    SpreadsheetApp.flush();

    console.log("Order successfully written: " + orderId);


    /* -----------------------------------------------------
       Save idempotency key
       ----------------------------------------------------- */

    rememberClientRequest_(order.clientRequestId, {
      orderId: orderId,
      createdAt: now.toISOString()
    });


    /* -----------------------------------------------------
       Success response
       ----------------------------------------------------- */

    return json_({
      ok: true,
      orderId: orderId,
      createdAt: now.toISOString(),
      orderStatus: "NEW"
    });

  } catch (err) {

    console.error("DEWIFY ORDER ERROR:");
    console.error(err && err.stack ? err.stack : err);

    return json_({
      ok: false,
      error: err && err.message
        ? err.message
        : String(err)
    });

  } finally {

    try {
      lock.releaseLock();
    } catch (_) {}

  }
}


/* =========================================================
   Validate + normalize order
   ========================================================= */

function validateAndNormalize_(input) {

  if (!input || typeof input !== "object") {
    throw new Error("Invalid payload.");
  }


  /* -------------------------------------------------------
     Request ID
     ------------------------------------------------------- */

  const clientRequestId = clean_(
    input.clientRequestId,
    100
  );

  if (!clientRequestId) {
    throw new Error("Missing request ID.");
  }


  /* -------------------------------------------------------
     Customer
     ------------------------------------------------------- */

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


  if (!customer.name) {
    throw new Error("Customer name is required.");
  }

  if (!/^\+?[0-9\s()\-]{10,20}$/.test(customer.phone)) {
    throw new Error("Invalid phone number.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    throw new Error("Invalid email.");
  }

  if (!customer.address) {
    throw new Error("Address is required.");
  }

  if (!customer.city) {
    throw new Error("City is required.");
  }

  if (!customer.state) {
    throw new Error("State is required.");
  }

  if (!/^\d{6}$/.test(customer.pincode)) {
    throw new Error("Invalid PIN code.");
  }


  /* -------------------------------------------------------
     Products
     ------------------------------------------------------- */

  if (
    !Array.isArray(input.items) ||
    input.items.length < 1 ||
    input.items.length > MAX_ITEMS
  ) {
    throw new Error("Invalid items.");
  }


  const items = input.items.map(function(item) {

    const name = clean_(item.name, 200);
    const id = clean_(item.id, 100);

    const qty = Number(item.qty);
    const price = Number(item.price);
    const subtotal = Number(item.subtotal);


    if (!name || !id) {
      throw new Error("Invalid product.");
    }

    if (
      !Number.isInteger(qty) ||
      qty < 1 ||
      qty > 99
    ) {
      throw new Error("Invalid quantity.");
    }

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      price > 100000000
    ) {
      throw new Error("Invalid product price.");
    }

    if (
      !Number.isFinite(subtotal) ||
      subtotal < 0
    ) {
      throw new Error("Invalid product subtotal.");
    }


    return {
      id: id,
      name: name,
      qty: qty,
      price: price,
      subtotal: subtotal
    };

  });


  /* -------------------------------------------------------
     Calculate total on server
     ------------------------------------------------------- */

  const calculatedTotal = items.reduce(
    function(sum, item) {
      return sum + (item.price * item.qty);
    },
    0
  );


  if (
    !Number.isFinite(calculatedTotal) ||
    calculatedTotal < 0
  ) {
    throw new Error("Invalid total.");
  }


  /* -------------------------------------------------------
     Payment method
     ------------------------------------------------------- */

  const paymentMethod = clean_(
    input.paymentMethod,
    30
  ).toUpperCase();


  if (
    paymentMethod !== "COD" &&
    paymentMethod !== "UPI"
  ) {
    throw new Error("Invalid payment method.");
  }


  return {
    clientRequestId: clientRequestId,
    customer: customer,
    items: items,
    total: Math.round(calculatedTotal),
    paymentMethod: paymentMethod
  };
}


/* =========================================================
   Get spreadsheet + worksheet
   ========================================================= */

function getOrdersSheet_() {

  if (
    !SPREADSHEET_ID ||
    SPREADSHEET_ID === "PASTE_YOUR_SPREADSHEET_ID_HERE"
  ) {
    throw new Error(
      "SPREADSHEET_ID has not been configured."
    );
  }


  let ss;

  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (err) {
    throw new Error(
      "Could not open spreadsheet. Check SPREADSHEET_ID and Apps Script authorization."
    );
  }


  if (!ss) {
    throw new Error("Spreadsheet could not be opened.");
  }


  let sheet = ss.getSheetByName(SHEET_NAME);


  /* -------------------------------------------------------
     Create worksheet if missing
     ------------------------------------------------------- */

  if (!sheet) {

    console.log(
      'Worksheet "' + SHEET_NAME + '" not found. Creating it.'
    );

    sheet = ss.insertSheet(SHEET_NAME);
  }


  /* -------------------------------------------------------
     Create headers if sheet is empty
     ------------------------------------------------------- */

  if (sheet.getLastRow() === 0) {

    sheet
      .getRange(1, 1, 1, HEADERS.length)
      .setValues([HEADERS]);

    sheet.setFrozenRows(1);

    sheet
      .getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold");

  } else {

    const currentHeaders = sheet
      .getRange(1, 1, 1, HEADERS.length)
      .getValues()[0];


    const matches = HEADERS.every(
      function(header, index) {
        return currentHeaders[index] === header;
      }
    );


    if (!matches) {

      throw new Error(
        'The first row of "' +
        SHEET_NAME +
        '" does not match the required headers.'
      );
    }
  }


  return sheet;
}


/* =========================================================
   Generate unique order ID
   ========================================================= */

function createUniqueOrderId_(sheet) {

  const lastRow = sheet.getLastRow();

  let values = [];

  if (lastRow >= 2) {

    values = sheet
      .getRange(2, 1, lastRow - 1, 1)
      .getDisplayValues()
      .flat();
  }


  const used = new Set(
    values.filter(Boolean)
  );


  let id;

  do {

    id =
      "DEWIFY-" +
      Math.floor(
        100000 +
        Math.random() * 900000
      );

  } while (used.has(id));


  return id;
}


/* =========================================================
   Idempotency
   ========================================================= */

function findClientRequestId_(requestId) {

  const props =
    PropertiesService.getScriptProperties();

  const raw =
    props.getProperty("DEWIFY_IDEMPOTENCY");


  if (!raw) {
    return null;
  }


  try {

    const map = JSON.parse(raw);

    const hit = map[requestId];


    if (!hit) {
      return null;
    }


    /* Expire after 24 hours */

    if (
      Date.now() -
      new Date(hit.createdAt).getTime() >
      24 * 60 * 60 * 1000
    ) {

      delete map[requestId];

      props.setProperty(
        "DEWIFY_IDEMPOTENCY",
        JSON.stringify(map)
      );

      return null;
    }


    return hit;

  } catch (_) {

    return null;
  }
}


function rememberClientRequest_(
  requestId,
  value
) {

  const props =
    PropertiesService.getScriptProperties();

  let map = {};


  try {

    map = JSON.parse(
      props.getProperty(
        "DEWIFY_IDEMPOTENCY"
      ) || "{}"
    );

  } catch (_) {

    map = {};
  }


  const now = Date.now();


  /* Remove entries older than 24 hours */

  Object.keys(map).forEach(
    function(key) {

      if (
        !map[key] ||
        now -
          new Date(
            map[key].createdAt
          ).getTime() >
          24 * 60 * 60 * 1000
      ) {

        delete map[key];
      }

    }
  );


  map[requestId] = value;


  /* Keep maximum 500 entries */

  const keys = Object.keys(map);


  if (keys.length > 500) {

    keys
      .sort(
        function(a, b) {

          return (
            new Date(map[a].createdAt) -
            new Date(map[b].createdAt)
          );

        }
      )
      .slice(
        0,
        keys.length - 500
      )
      .forEach(
        function(key) {
          delete map[key];
        }
      );
  }


  props.setProperty(
    "DEWIFY_IDEMPOTENCY",
    JSON.stringify(map)
  );
}


/* =========================================================
   Clean user input
   ========================================================= */

function clean_(value, maxLength) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }


  let text = String(value).trim();


  /*
   * Prevent spreadsheet formula injection.
   */

  if (/^[=+\-@]/.test(text)) {
    text = "'" + text;
  }


  return text.slice(0, maxLength);
}


/* =========================================================
   JSON response
   ========================================================= */

function json_(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}
