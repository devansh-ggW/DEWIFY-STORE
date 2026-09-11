/**
 * DEWIFY — Google Sheets Order + Admin API
 *
 * Customer checkout:
 *   POST { clientRequestId, customer, items, paymentMethod }
 *
 * Admin:
 *   POST { action:"auth"|"listOrders"|"updateOrder"|"deleteOrder", token:"..." }
 *
 * Deploy as Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * IMPORTANT:
 * 1. Set ADMIN_TOKEN before deploying.
 * 2. Keep this token out of the public storefront.
 * 3. Redeploy the Web App after changing this script.
 */

const SPREADSHEET_ID = "1uSjmnq_7uP0y4PlJtmRchtHB7ouzFbIrfp0YuQG5oic";
const SHEET_NAME = "DEWIFY Orders";
const ADMIN_TOKEN = "SET_IN_APPS_SCRIPT";

const HEADERS = [
  "Order ID","Date/Time","Customer Name","Phone","Email","Address","City",
  "State","PIN Code","Product(s)","Quantity","Total Amount","Payment Method",
  "Order Status","Payment Status","Payment Reference","Notes","Updated At"
];

const MAX_NAME=120, MAX_PHONE=30, MAX_EMAIL=200, MAX_ADDRESS=500;
const MAX_CITY=100, MAX_STATE=100, MAX_PIN=6, MAX_ITEMS=30;
const ORDER_STATUSES=["NEW","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"];
const PAYMENT_STATUSES=["PENDING","PAID","FAILED","REFUNDED","COD_PENDING"];

/* ---------- HTTP ---------- */

function doGet() {
  return json_({ok:true,service:"DEWIFY Orders API",status:"online",version:"2.0"});
}

function doPost(e) {
  const lock=LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if(!e || !e.postData || typeof e.postData.contents!=="string") throw new Error("Missing request body.");

    let input;
    try { input=JSON.parse(e.postData.contents); }
    catch(_) { throw new Error("Invalid JSON request body."); }

    const action=clean_(input.action,40);

    // Existing storefront requests have no action, so they remain create-order calls.
    if(action==="auth") {
      requireAdmin_(input.token);
      return json_({ok:true,authenticated:true});
    }
    if(action==="listOrders") {
      requireAdmin_(input.token);
      return json_({ok:true,orders:listOrders_()});
    }
    if(action==="updateOrder") {
      requireAdmin_(input.token);
      return json_({ok:true,order:updateOrder_(input)});
    }
    if(action==="deleteOrder") {
      requireAdmin_(input.token);
      return json_({ok:true,deleted:deleteOrder_(input.orderId)});
    }

    return createOrder_(input);
  } catch(err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ok:false,error:err && err.message ? err.message : String(err)});
  } finally {
    try { lock.releaseLock(); } catch(_) {}
  }
}

/* ---------- Customer order ---------- */

function createOrder_(input) {
  const order=validateAndNormalize_(input);
  const sheet=getOrdersSheet_();

  const existing=findClientRequestId_(order.clientRequestId);
  if(existing) {
    return json_({
      ok:true,
      duplicate:true,
      orderId:existing.orderId,
      createdAt:existing.createdAt,
      orderStatus:existing.orderStatus
    });
  }

  const orderId=createUniqueOrderId_(sheet);
  const now=new Date();
  const productText=order.items.map(i=>i.name+" × "+i.qty).join(" | ");
  const quantity=order.items.reduce((s,i)=>s+i.qty,0);
  const paymentStatus=order.paymentMethod==="COD" ? "COD_PENDING" : "PENDING";

  const row=new Array(HEADERS.length).fill("");
  row[0]=orderId;
  row[1]=now;
  row[2]=order.customer.name;
  row[3]=order.customer.phone;
  row[4]=order.customer.email;
  row[5]=order.customer.address;
  row[6]=order.customer.city;
  row[7]=order.customer.state;
  row[8]=order.customer.pincode;
  row[9]=productText;
  row[10]=quantity;
  row[11]=order.total;
  row[12]=order.paymentMethod;
  row[13]="NEW";
  row[14]=paymentStatus;
  row[17]=now;

  sheet.appendRow(row);
  SpreadsheetApp.flush();

  rememberClientRequest_(order.clientRequestId,{
    orderId:orderId,
    createdAt:now.toISOString(),
    orderStatus:"NEW"
  });

  return json_({
    ok:true,
    orderId:orderId,
    createdAt:now.toISOString(),
    orderStatus:"NEW",
    paymentStatus:paymentStatus
  });
}

function validateAndNormalize_(input) {
  if(!input || typeof input!=="object") throw new Error("Invalid payload.");

  const clientRequestId=clean_(input.clientRequestId,100);
  if(!clientRequestId) throw new Error("Missing request ID.");

  const c=input.customer||{};
  const customer={
    name:clean_(c.name,MAX_NAME),
    phone:clean_(c.phone,MAX_PHONE),
    email:clean_(c.email,MAX_EMAIL).toLowerCase(),
    address:clean_(c.address,MAX_ADDRESS),
    city:clean_(c.city,MAX_CITY),
    state:clean_(c.state,MAX_STATE),
    pincode:clean_(c.pincode,MAX_PIN)
  };

  if(!customer.name) throw new Error("Customer name is required.");
  if(!/^\+?[0-9\s()\-]{10,20}$/.test(customer.phone)) throw new Error("Invalid phone number.");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new Error("Invalid email.");
  if(!customer.address) throw new Error("Address is required.");
  if(!customer.city) throw new Error("City is required.");
  if(!customer.state) throw new Error("State is required.");
  if(!/^\d{6}$/.test(customer.pincode)) throw new Error("Invalid PIN code.");

  if(!Array.isArray(input.items)||input.items.length<1||input.items.length>MAX_ITEMS) {
    throw new Error("Invalid items.");
  }

  const items=input.items.map(function(item){
    const name=clean_(item.name,200);
    const id=clean_(item.id,100);
    const qty=Number(item.qty);
    const price=Number(item.price);

    if(!name||!id) throw new Error("Invalid product.");
    if(!Number.isInteger(qty)||qty<1||qty>99) throw new Error("Invalid quantity.");
    if(!Number.isFinite(price)||price<0||price>100000000) throw new Error("Invalid product price.");

    return {id:id,name:name,qty:qty,price:price};
  });

  const total=items.reduce(function(sum,i){return sum+i.price*i.qty;},0);
  if(!Number.isFinite(total)||total<0) throw new Error("Invalid total.");

  const paymentMethod=clean_(input.paymentMethod,30).toUpperCase();
  if(paymentMethod!=="COD"&&paymentMethod!=="UPI") {
    throw new Error("Invalid payment method.");
  }

  return {
    clientRequestId:clientRequestId,
    customer:customer,
    items:items,
    total:Math.round(total),
    paymentMethod:paymentMethod
  };
}

/* ---------- Sheet ---------- */

function getOrdersSheet_() {
  if(!SPREADSHEET_ID) throw new Error("SPREADSHEET_ID is not configured.");

  let ss;
  try { ss=SpreadsheetApp.openById(SPREADSHEET_ID); }
  catch(_) {
    throw new Error("Could not open spreadsheet. Check SPREADSHEET_ID and Apps Script authorization.");
  }

  let sheet=ss.getSheetByName(SHEET_NAME);
  if(!sheet) sheet=ss.insertSheet(SHEET_NAME);

  if(sheet.getLastRow()===0) {
    sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,HEADERS.length).setFontWeight("bold");
  } else {
    ensureHeaders_(sheet);
  }

  return sheet;
}

function ensureHeaders_(sheet) {
  const width=Math.max(sheet.getLastColumn(),HEADERS.length);
  const current=sheet.getRange(1,1,1,width).getValues()[0];
  let changed=false;

  HEADERS.forEach(function(h,i){
    if(current[i]!==h) {
      // Preserve the original 14-column layout; append only genuinely missing columns.
      if(i<14) {
        throw new Error('The first 14 headers of "'+SHEET_NAME+'" do not match the required order.');
      }
      sheet.getRange(1,i+1).setValue(h);
      changed=true;
    }
  });

  if(changed) sheet.getRange(1,1,1,HEADERS.length).setFontWeight("bold");
}

function createUniqueOrderId_(sheet) {
  const lastRow=sheet.getLastRow();
  const values=lastRow>=2
    ? sheet.getRange(2,1,lastRow-1,1).getDisplayValues().flat()
    : [];

  const used=new Set(values.filter(Boolean));
  let id;

  do {
    id="DEWIFY-"+Math.floor(100000+Math.random()*900000);
  } while(used.has(id));

  return id;
}

/* ---------- Admin ---------- */

function requireAdmin_(token) {
  if(!ADMIN_TOKEN || ADMIN_TOKEN==="SET_IN_APPS_SCRIPT") {
    throw new Error("Admin token is not configured in DEWIFY-APPS-SCRIPT.gs.");
  }

  if(typeof token!=="string" || token.length<5 || token!==ADMIN_TOKEN) {
    throw new Error("Unauthorized.");
  }
}

function listOrders_() {
  const sheet=getOrdersSheet_();
  const lastRow=sheet.getLastRow();
  if(lastRow<2) return [];

  const rows=sheet.getRange(2,1,lastRow-1,HEADERS.length).getValues();

  return rows.filter(r=>String(r[0]).trim()).map(function(r){
    return {
      id:String(r[0]||""),
      createdAt:toIso_(r[1]),
      customer:{
        name:String(r[2]||""),
        phone:String(r[3]||""),
        email:String(r[4]||""),
        address:String(r[5]||""),
        city:String(r[6]||""),
        state:String(r[7]||""),
        pincode:String(r[8]||"")
      },
      products:String(r[9]||""),
      quantity:Number(r[10])||0,
      total:Number(r[11])||0,
      paymentMethod:String(r[12]||""),
      orderStatus:String(r[13]||"NEW"),
      paymentStatus:String(r[14]||"PENDING"),
      paymentReference:String(r[15]||""),
      notes:String(r[16]||""),
      updatedAt:toIso_(r[17])
    };
  });
}

function findRowByOrderId_(sheet,orderId) {
  const id=clean_(orderId,100);
  if(!id) throw new Error("Order ID is required.");

  const lastRow=sheet.getLastRow();
  if(lastRow<2) return -1;

  const ids=sheet.getRange(2,1,lastRow-1,1).getDisplayValues().flat();
  const i=ids.indexOf(id);

  return i===-1 ? -1 : i+2;
}

function updateOrder_(input) {
  const sheet=getOrdersSheet_();
  const row=findRowByOrderId_(sheet,input.orderId);

  if(row===-1) throw new Error("Order not found.");

  const orderStatus=clean_(input.orderStatus,30).toUpperCase();
  const paymentStatus=clean_(input.paymentStatus,30).toUpperCase();

  if(ORDER_STATUSES.indexOf(orderStatus)===-1) {
    throw new Error("Invalid order status.");
  }

  if(PAYMENT_STATUSES.indexOf(paymentStatus)===-1) {
    throw new Error("Invalid payment status.");
  }

  const now=new Date();

  sheet.getRange(row,14).setValue(orderStatus);
  sheet.getRange(row,15).setValue(paymentStatus);
  sheet.getRange(row,18).setValue(now);

  SpreadsheetApp.flush();

  return {
    id:String(sheet.getRange(row,1).getDisplayValue()),
    orderStatus:orderStatus,
    paymentStatus:paymentStatus,
    updatedAt:now.toISOString()
  };
}

function deleteOrder_(orderId) {
  const sheet=getOrdersSheet_();
  const row=findRowByOrderId_(sheet,orderId);

  if(row===-1) throw new Error("Order not found.");

  sheet.deleteRow(row);
  return true;
}

/* ---------- Idempotency ---------- */

function findClientRequestId_(requestId) {
  const props=PropertiesService.getScriptProperties();
  const raw=props.getProperty("DEWIFY_IDEMPOTENCY");

  if(!raw) return null;

  try {
    const map=JSON.parse(raw);
    const hit=map[requestId];

    if(!hit) return null;

    if(Date.now()-new Date(hit.createdAt).getTime()>24*60*60*1000) {
      delete map[requestId];
      props.setProperty("DEWIFY_IDEMPOTENCY",JSON.stringify(map));
      return null;
    }

    return hit;
  } catch(_) {
    return null;
  }
}

function rememberClientRequest_(requestId,value) {
  const props=PropertiesService.getScriptProperties();
  let map={};

  try {
    map=JSON.parse(props.getProperty("DEWIFY_IDEMPOTENCY")||"{}");
  } catch(_) {
    map={};
  }

  const now=Date.now();

  Object.keys(map).forEach(function(k){
    if(!map[k] || now-new Date(map[k].createdAt).getTime()>24*60*60*1000) {
      delete map[k];
    }
  });

  map[requestId]=value;

  const keys=Object.keys(map);

  if(keys.length>500) {
    keys.sort(function(a,b){
      return new Date(map[a].createdAt)-new Date(map[b].createdAt);
    }).slice(0,keys.length-500).forEach(function(key){
      delete map[key];
    });
  }

  props.setProperty("DEWIFY_IDEMPOTENCY",JSON.stringify(map));
}

/* ---------- Helpers ---------- */

function clean_(value,max) {
  if(value===null||value===undefined) return "";

  let text=String(value).trim();

  // Prevent spreadsheet formula injection.
  if(/^[=+\-@]/.test(text)) text="'"+text;

  return text.slice(0,max);
}

function toIso_(value) {
  if(!value) return "";

  const d=value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
