// ============================================================
// DEWIFY — Google Sheets order checkout
// Customer → Google Apps Script Web App → Google Sheet
// No database credentials or private secrets are used in the browser.
// ============================================================
const WHATSAPP_NUMBER = "919422843899";
const GOOGLE_APPS_SCRIPT_URL = window.DEWIFY_CONFIG?.GOOGLE_APPS_SCRIPT_URL || "";

// Titles are DEWIFY-native. Prices are provisional INR storefront prices;
// destination-specific CJ shipping must be verified before live pricing.
const PRODUCTS = [
  {id:"dw-storage-vault",name:"FoldAway Storage Vault",category:"Utility",price:799,badge:"SMART PICK",kind:"organizer",sourceUrl:"https://cjdropshipping.com/product/foldable-clothes-storage-bag-large-capacity-organizer-with-handle-and-double-zipper-for-bedding-moving-travel-under-bed-storage-p-2505160457141629100.html",sku:"CJYD237778201AZ"},
  {id:"dw-witchlight",name:"Witchlight Gothic Hat Lamp",category:"Utility",price:1499,badge:"LIMITED",kind:"lamp",sourceUrl:"https://cjdropshipping.com/product/witch-hat-lamps-creative-home-gothic-night-light-gift-witch-hat-light-ornament-halloween-home-ornament-decoration-p-2607040852081633100.html",sku:"CJYD296761901AZ"},
  {id:"dw-heatcore-jacket",name:"HeatCore USB Heated Jacket",category:"Wear",price:2499,badge:"WINTER",kind:"hoodie",sourceUrl:"https://cjdropshipping.com/product/winter-heated-jacket-usb-electric-cotton-coat-zip-up-heater-thermal-clothing-heating-vest-for-men-p-1578267399776907264.html",sku:"CJYR158132801AZ"},
  {id:"dw-moonglow-pendant",name:"MoonGlow Luminous Pendant",category:"Wear",price:699,badge:"GLOW",kind:"case",sourceUrl:"https://cjdropshipping.com/product/fashion-moon-natural-glowing-stone-healing-necklace-women-gift-charm-luminous-pendant-necklace-jewelry-p-F0403505-748E-4F3C-A9BB-70E390109230.html",sku:"CJZBLXLX00017-purple"},
  {id:"dw-fruity-paws",name:"Fruity Paws Cozy Hoodie",category:"Utility",price:799,badge:"PET PICK",kind:"tee",sourceUrl:"https://cjdropshipping.com/product/cute-fruit-dog-clothes-for-small-dogs-hoodies-winter-warm-fleece-pet-clothing-puppy-cat-costume-coat-for-french-chihuahua-outfit-p-1403920038016192512.html",sku:"CJGD117239401AZ"},
  {id:"dw-bunnyglow",name:"BunnyGlow Touch Night Light",category:"Utility",price:1299,badge:"SOFT GLOW",kind:"lamp",sourceUrl:"https://cjdropshipping.com/product/cute-led-night-light-touch-sensor-cartoon-kids-nightlights-big-face-rabbit-silicone-night-light-christmas-gift-bedside-lamp-home-decor-p-1770035341261541376.html",sku:"CJYD199189901AZ"},
  {id:"dw-orbitmoon-lamp",name:"OrbitMoon Crystal Night Lamp",category:"Utility",price:899,badge:"AMBIENT",kind:"lamp",sourceUrl:"https://cjdropshipping.com/product/luminous-starry-sky-and-planets-moon-moon-crystal-ball-small-night-lamp-projection-ambience-light-creative-gift-new-strange-gift-p-1555129918592397312.html",sku:"CJJT153840401AZ"},
  {id:"dw-temptrack-bottle",name:"TempTrack Insulated Bottle",category:"Utility",price:1099,badge:"DAILY USE",kind:"speaker",sourceUrl:"https://cjdropshipping.com/product/smart-digital-thermal-bottle-portable-coffee-mug-stainless-steel-water-bottle-in-car-insulated-cup-keep-cold-vacuum-flasks-450ml-p-1737828106674647040.html",sku:"CJJT192676801AZ"},
  {id:"dw-cloudwarm-socks",name:"CloudWarm Over-Knee Socks",category:"Wear",price:899,badge:"COZY",kind:"cap",sourceUrl:"https://cjdropshipping.com/product/over-knee-high-fuzzy-long-socks-winter-warm-cold-leg-knee-joint-cold-proof-stockings-home-floor-sleeping-socks-p-1668434970181902336.html",sku:"CJYD177740901AZ"},
  {id:"dw-ravenhide-watch",name:"RavenHide Retro Leather Watch",category:"Wear",price:1299,badge:"CLASSIC",kind:"case",sourceUrl:"https://cjdropshipping.com/product/accessories-foreign-trade-watches-retro-cowhide-watches-punk-watches-mens-wrist-watches-p-1391988614027677696.html",sku:"CJYD112291701AZ"},
  {id:"dw-pup-match-vest",name:"PupMatch Sports Vest",category:"Utility",price:699,badge:"PET PICK",kind:"tee",sourceUrl:"https://cjdropshipping.com/product/hot-world-cup-ball-spring-and-summer-dog-vest-pet-supplies-p-CF1F5B6A-0BB3-4740-A3FA-803C6D6C2.html",sku:"CJJJCWGD00413-Red-XL"}
];

const CART_KEY="dewify-cart-v2";
let cart=loadCart();
let activeFilter="All";
let lastOrder=null;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function money(value){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value);}
function loadCart(){try{const stored=JSON.parse(localStorage.getItem(CART_KEY));if(!Array.isArray(stored))return[];return stored.filter(i=>PRODUCTS.some(p=>p.id===i.id)&&Number(i.qty)>0).map(i=>({id:i.id,qty:Math.min(99,Math.max(1,Number(i.qty)))}));}catch{return[];}}
function saveCart(){localStorage.setItem(CART_KEY,JSON.stringify(cart));updateBagCount();}
function getProduct(id){return PRODUCTS.find(p=>p.id===id);}
function cartCount(){return cart.reduce((s,i)=>s+i.qty,0);}
function cartTotal(){return cart.reduce((s,i)=>{const p=getProduct(i.id);return s+(p?p.price*i.qty:0);},0);}
function updateBagCount(){const count=$("#bagCount");if(count)count.textContent=cartCount();}

function renderProducts(){
  const visible=activeFilter==="All"?PRODUCTS:PRODUCTS.filter(p=>p.category===activeFilter);
  $("#productGrid").innerHTML=visible.map(p=>`<article class="product-card reveal visible"><div class="product-visual" data-kind="${p.kind}">${p.badge?`<span class="product-tag">${p.badge}</span>`:""}<div class="visual-object" aria-hidden="true"></div></div><div class="product-info"><div class="product-meta"><span>${p.category}</span><span>DW / ${String(PRODUCTS.indexOf(p)+1).padStart(2,"0")}</span></div><h3 class="product-name">${p.name}</h3><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add-button" type="button" data-add="${p.id}">Add to bag</button></div></div></article>`).join("");
}
function addToCart(id){const existing=cart.find(i=>i.id===id);if(existing)existing.qty=Math.min(existing.qty+1,99);else cart.push({id,qty:1});saveCart();renderCart();showToast("Added to bag");}
function changeQty(id,delta){const item=cart.find(i=>i.id===id);if(!item)return;item.qty+=delta;if(item.qty<=0)cart=cart.filter(i=>i.id!==id);saveCart();renderCart();renderCheckoutSummary();}
function removeFromCart(id){cart=cart.filter(i=>i.id!==id);saveCart();renderCart();renderCheckoutSummary();}
function clearBag(){cart=[];saveCart();renderCart();renderCheckoutSummary();showToast("Bag cleared");}

function renderCart(){
  const content=$("#cartContent"),footer=$("#cartFooter");
  if(!cart.length){content.innerHTML=`<div class="empty-cart"><div><strong>Your bag is quiet.</strong><p>Start with something you will actually use.</p></div></div>`;footer.innerHTML="";return;}
  content.innerHTML=cart.map(item=>{const p=getProduct(item.id);return `<div class="cart-line"><div class="mini-visual" data-kind="${p.kind}"><div class="visual-object" aria-hidden="true"></div></div><div class="cart-line-main"><p class="cart-name">${p.name}</p><span class="cart-price">${money(p.price)}</span><div class="qty" aria-label="Quantity controls"><button type="button" data-minus="${p.id}" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button type="button" data-plus="${p.id}" aria-label="Increase quantity">+</button></div></div><button class="remove" type="button" data-remove="${p.id}">Remove</button></div>`;}).join("");
  footer.innerHTML=`<div class="cart-total-row"><span>Total</span><strong>${money(cartTotal())}</strong></div><div class="cart-actions"><button class="clear-button" id="clearBag" type="button">Clear bag</button><button class="button button-light" id="checkoutButton" type="button">Checkout <span>↗</span></button></div>`;
}
function openBag(){$("#cartDrawer").classList.add("is-open");$("#cartDrawer").setAttribute("aria-hidden","false");document.body.classList.add("locked");}
function closeBag(){$("#cartDrawer").classList.remove("is-open");$("#cartDrawer").setAttribute("aria-hidden","true");document.body.classList.remove("locked");}
function openCheckout(){if(!cart.length){showToast("Your bag is empty");return;}closeBag();renderCheckoutSummary();$("#checkoutModal").classList.add("is-open");$("#checkoutModal").setAttribute("aria-hidden","false");document.body.classList.add("locked");setTimeout(()=>$("#customerName")?.focus(),150);}
function closeCheckout(){$("#checkoutModal").classList.remove("is-open");$("#checkoutModal").setAttribute("aria-hidden","true");document.body.classList.remove("locked");}
function renderCheckoutSummary(){$("#checkoutItems").innerHTML=cart.map(i=>{const p=getProduct(i.id);return `<div class="summary-item"><span>${p.name} × ${i.qty}</span><strong>${money(p.price*i.qty)}</strong></div>`;}).join("");$("#checkoutTotal").textContent=money(cartTotal());}
function clientRequestId(){try{if(crypto.randomUUID)return crypto.randomUUID();}catch(_){}return `${Date.now()}-${Math.random().toString(36).slice(2)}`;}
function validPhone(phone){const digits=phone.replace(/\D/g,"");return digits.length>=10&&digits.length<=15;}

function buildWhatsAppMessage(order){const lines=order.items.map(i=>`• ${i.name} × ${i.qty} — ${money(i.subtotal)}`).join("\n");return ["DEWIFY — NEW ORDER","",`Order ID: ${order.id}`,`Date: ${new Date(order.createdAt).toLocaleString("en-IN")}`,"",`Customer: ${order.customer.name}`,`Phone: ${order.customer.phone}`,"","DELIVERY ADDRESS:",order.customer.address,`${order.customer.city}, ${order.customer.state} ${order.customer.pincode}`,`Email: ${order.customer.email}`,"","ITEMS:",lines,"",`TOTAL: ${money(order.total)}`,"PAYMENT: ONLINE — PENDING","STATUS: NEW","","Payment is not collected in this version."].join("\n");}

async function submitOrder(event){
  event.preventDefault();
  const error=$("#formError");error.textContent="";
  const name=$("#customerName").value.trim(),phone=$("#customerPhone").value.trim(),email=$("#customerEmail").value.trim(),address=$("#customerAddress").value.trim(),city=$("#customerCity").value.trim(),state=$("#customerState").value.trim(),pincode=$("#customerPincode").value.trim();
  if(!name){error.textContent="Please enter your full name.";$("#customerName").focus();return;}
  if(!validPhone(phone)){error.textContent="Please enter a valid phone number.";$("#customerPhone").focus();return;}
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){error.textContent="Please enter a valid email address.";$("#customerEmail").focus();return;}
  if(!address){error.textContent="Please enter the full delivery address.";$("#customerAddress").focus();return;}
  if(!city){error.textContent="Please enter your city.";$("#customerCity").focus();return;}
  if(!state){error.textContent="Please enter your state.";$("#customerState").focus();return;}
  if(!/^\d{6}$/.test(pincode)){error.textContent="Please enter a valid 6-digit pincode.";$("#customerPincode").focus();return;}
  if(!cart.length){error.textContent="Your bag is empty.";return;}
  if(!GOOGLE_APPS_SCRIPT_URL||!GOOGLE_APPS_SCRIPT_URL.startsWith("https://script.google.com/macros/s/")){error.textContent="Order service is not configured yet. Please try again later.";return;}

  const form=$("#checkoutForm"),button=form.querySelector('button[type="submit"]');
  if(form.dataset.submitting==="true")return;form.dataset.submitting="true";
  const originalText=button?.textContent||"Submit order request";
  if(button){button.disabled=true;button.setAttribute("aria-busy","true");button.textContent="Submitting…";}

  const items=cart.map(i=>{const p=getProduct(i.id);return{id:p.id,name:p.name,price:p.price,qty:i.qty,subtotal:p.price*i.qty,sourceUrl:p.sourceUrl,sku:p.sku};});
  const payload={clientRequestId:clientRequestId(),customer:{name,phone,email,address,city,state,pincode},items,total:items.reduce((s,i)=>s+i.subtotal,0),paymentMethod:"UPI"};

  try{
    const response=await fetch(GOOGLE_APPS_SCRIPT_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload),redirect:"follow",cache:"no-store"});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const raw=await response.text();let result;
    try{result=JSON.parse(raw);}catch{throw new Error(`Backend returned non-JSON response: ${raw.slice(0,180)}`);}
    if(!result||result.ok!==true||!result.orderId)throw new Error(result?.error||"Invalid backend response");

    lastOrder={id:result.orderId,createdAt:result.createdAt||new Date().toISOString(),customer:payload.customer,items:payload.items,total:payload.total,paymentMethod:"UPI",paymentStatus:result.paymentStatus||"PENDING",orderStatus:result.orderStatus||"NEW"};
    closeCheckout();openOrderSuccess(lastOrder);
    const message=buildWhatsAppMessage(lastOrder),whatsappUrl=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,wa=$("#openWhatsAppAfterOrder");
    if(wa)wa.onclick=()=>window.open(whatsappUrl,"_blank","noopener,noreferrer");
    cart=[];saveCart();renderCart();form.reset();
  }catch(e){console.error("DEWIFY order submission failed:",e);error.textContent=`Order failed: ${e?.message||"Unknown error"}`;}
  finally{form.dataset.submitting="false";if(button){button.disabled=false;button.removeAttribute("aria-busy");button.textContent=originalText;}}
}

function openOrderSuccess(order){$("#successOrderId").textContent=order.id;$("#successCustomer").textContent=order.customer.name;$("#successTotal").textContent=money(order.total);$("#successStatus").textContent=order.orderStatus;$("#orderSuccess").classList.add("is-open");$("#orderSuccess").setAttribute("aria-hidden","false");document.body.classList.add("locked");}
function closeOrderSuccess(){$("#orderSuccess").classList.remove("is-open");$("#orderSuccess").setAttribute("aria-hidden","true");document.body.classList.remove("locked");}
function copyOrderMessage(){if(!lastOrder)return;const message=buildWhatsAppMessage(lastOrder);navigator.clipboard?.writeText(message).then(()=>showToast("Order message copied"),()=>showToast("Copy unavailable — WhatsApp is ready"));}
function showToast(message){const toast=$("#toast");if(!toast)return;toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2200);}
function initReveal(){const items=$$(".reveal");if(!("IntersectionObserver"in window)){items.forEach(i=>i.classList.add("visible"));return;}const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target);}}),{threshold:.08});items.forEach(i=>observer.observe(i));}

document.addEventListener("click",event=>{
  const add=event.target.closest("[data-add]"),plus=event.target.closest("[data-plus]"),minus=event.target.closest("[data-minus]"),remove=event.target.closest("[data-remove]"),filter=event.target.closest("[data-filter]");
  if(add)addToCart(add.dataset.add);
  if(plus)changeQty(plus.dataset.plus,1);
  if(minus)changeQty(minus.dataset.minus,-1);
  if(remove)removeFromCart(remove.dataset.remove);
  if(filter){activeFilter=filter.dataset.filter;$$ (".filter").forEach(b=>b.classList.toggle("active",b===filter));renderProducts();}
});

document.addEventListener("DOMContentLoaded",()=>{
  renderProducts();renderCart();updateBagCount();initReveal();
  $("#openBag")?.addEventListener("click",openBag);$("#closeBag")?.addEventListener("click",closeBag);$("#drawerBackdrop")?.addEventListener("click",closeBag);
  $("#cartFooter")?.addEventListener("click",e=>{if(e.target.closest("#clearBag"))clearBag();if(e.target.closest("#checkoutButton"))openCheckout();});
  $("#closeCheckout")?.addEventListener("click",closeCheckout);$("#modalBackdrop")?.addEventListener("click",closeCheckout);$("#checkoutForm")?.addEventListener("submit",submitOrder);
  $("#closeOrderSuccess")?.addEventListener("click",closeOrderSuccess);$("#successBackdrop")?.addEventListener("click",closeOrderSuccess);$("#copyOrderMessage")?.addEventListener("click",copyOrderMessage);
  document.addEventListener("keydown",event=>{if(event.key!=="Escape")return;closeBag();closeCheckout();closeOrderSuccess();});
});
