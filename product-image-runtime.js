/* DEWIFY — Fast product-image delivery layer */
(function () {
  "use strict";
  if (window.__DEWIFY_IMAGE_RUNTIME__) return;
  window.__DEWIFY_IMAGE_RUNTIME__ = true;

  const IMAGES = {
    "dw-storage-vault":["https://maqsood.me/cdn/shop/files/Product_Content_77.jpg?v=1785268495","https://i.ebayimg.com/images/g/VYkAAeSwPQ9o70Sj/s-l1600.jpg","https://i5.walmartimages.com/asr/a768a3be-cfa1-4543-be3b-d4bd41afa22b.ea5dadef1a02b6a0039473215a545f99.jpeg?odnBg=FFFFFF&odnHeight=768&odnWidth=768"],
    "dw-witchlight":["https://oss-cf.cjdropshipping.com/product/2026/07/04/08/08fcf3b3-a6bf-4e84-b942-996b9b5d9f5d.jpeg","https://media.adeo.com/mkp/0ba7d37825817478bfa35ebd0ee2e46a/media.jpeg?fit=bounds&format=jpg&height=650&quality=80&width=650","https://media.adeo.com/mkp/3fbc7aa47243aa1fe8eafb1c1ddc1c39/media.jpg"],
    "dw-heatcore-jacket":["https://cf.cjdropshipping.com/17000928/1725075714115506176.jpg","https://cf.cjdropshipping.com/17000928/1725075714283278336.jpg"],
    "dw-moonglow-pendant":["https://cf.cjdropshipping.com/16367616/1636808394162.jpg"],
    "dw-fruity-paws":["https://images.pet-friends.co.kr/storage/pet_friends/product/id/8/d/5/8/f/4/a/8d58f4aa400cf3ca2b8494f5d6a20b2c/10000/19ba6e25823b48338a8231aaaff13f24.jpg","https://i5.walmartimages.com/seo/Djunllk-Pet-Dog-T-Shirt-Small-Dogs-Clothes-Summer-Dog-Tshirt-Pet-Dog-Summer-New-Clothing-Cute-Thin-Five-Color-Fruit-Vestscasual-Unisex-Puppy-Shirts-D_6fc21b15-f0f8-4996-8747-1b8e911863b9.6384aeb62f5b7ea815648a2d8ee3a58a.jpeg"],
    "dw-bunnyglow":["https://cf.cjdropshipping.com/17154720/2405120725050328100.jpg"],
    "dw-orbitmoon-lamp":["https://cf.cjdropshipping.com/17116704/2403290157100327000.jpg","https://eleganceuniverse.com/cdn/shop/files/0896832a-46ae-4d02-8242-ad2b3e08a62f.jpg?v=1702764669"],
    "dw-temptrack-bottle":["https://cf.cjdropshipping.com/17032032/1738098783004266496.jpg"],
    "dw-cloudwarm-socks":["https://cf.cjdropshipping.com/17051904/2401140356490329800.jpg","https://cf.cjdropshipping.com/17051904/2401140356500320300.jpg","https://cf.cjdropshipping.com/17051904/2401140356500321000.jpg"],
    "dw-ravenhide-watch":["https://cf.cjdropshipping.com/1620710794428.jpg?x-oss-process=image%2Fresize%2Cm_fill%2Cm_pad%2Cw_1200%2Ch_1200"],
    "dw-pup-match-vest":["https://down-ph.img.susercontent.com/file/1a5e8dabc99b11192a5d558e76fa2998","https://furrinn.com/cdn/shop/files/IMG_4311.jpg?v=1749623987","https://ae01.alicdn.com/kf/S5c968d241dea4e50b0d8537c6a6f97bdJ/Dog-Vest-Summer-Breathable-Small-Dog-Mesh-Vest-Messi-Neymar.jpg"]
  };
  const TITLES={"dw-storage-vault":"FoldAway Storage Vault","dw-witchlight":"Witchlight Gothic Hat Lamp","dw-heatcore-jacket":"HeatCore USB Heated Jacket","dw-moonglow-pendant":"MoonGlow Luminous Pendant","dw-fruity-paws":"Fruity Paws Cozy Hoodie","dw-bunnyglow":"BunnyGlow Touch Night Light","dw-orbitmoon-lamp":"OrbitMoon Crystal Night Lamp","dw-temptrack-bottle":"TempTrack Insulated Bottle","dw-cloudwarm-socks":"CloudWarm Over-Knee Socks","dw-ravenhide-watch":"RavenHide Retro Leather Watch","dw-pup-match-vest":"PupMatch Sports Vest"};
  const fastSource=(url,w)=>`https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=78&output=webp&fit=cover`;
  const idFromTitle=t=>Object.keys(TITLES).find(id=>TITLES[id]===String(t||"").trim())||null;
  const sourcesFor=id=>IMAGES[id]||[];

  function fallback(parent,label,compact){
    if(!parent||parent.querySelector(":scope > .dewify-image-fallback"))return;
    parent.classList.add("dewify-image-failed");
    const box=document.createElement("div");box.className=compact?"dewify-image-fallback compact":"dewify-image-fallback";
    box.innerHTML=`<span>DEWIFY / PRODUCT</span><strong>${String(label||"Product").replace(/[&<>]/g,"")}</strong>`;parent.appendChild(box);
  }
  function bind(img,sources,label,opt={}){
    if(!img||img.dataset.dewifyImageBound==="true")return;
    const list=[...new Set((sources||[]).filter(Boolean))];
    if(!list.length){fallback(img.parentElement,label,opt.compact);img.remove();return;}
    img.dataset.dewifyImageBound="true";img.decoding="async";img.fetchPriority=opt.priority||"low";
    if(opt.lazy!==false)img.loading="lazy";
    let i=0;
    const next=()=>{if(i>=list.length){const p=img.parentElement;img.remove();fallback(p,label,opt.compact);return;}const src=list[i++];img.dataset.dewifyImageSource=src;img.onerror=next;img.removeAttribute("srcset");img.src=fastSource(src,opt.width||720);};
    next();
  }
  function cards(){document.querySelectorAll(".product-card").forEach(card=>{const id=card.dataset.productId||idFromTitle(card.querySelector(".product-name")?.textContent);if(!id)return;const v=card.querySelector(".product-visual");if(!v)return;let img=v.querySelector(".product-card-image");if(!img){if(v.querySelector(".dewify-image-fallback"))return;img=document.createElement("img");img.className="product-card-image";img.alt=`${TITLES[id]} product image`;img.referrerPolicy="no-referrer";const cue=v.querySelector(".image-cue");if(cue)v.insertBefore(img,cue);else v.appendChild(img);v.classList.add("has-product-image");}bind(img,sourcesFor(id),TITLES[id],{width:720,priority:"low"});});}
  function cart(){document.querySelectorAll("#cartContent .cart-line").forEach(line=>{const id=idFromTitle(line.querySelector(".cart-name")?.textContent),v=line.querySelector(".mini-visual");if(!id||!v||v.dataset.dewifyImageReady==="true")return;v.dataset.dewifyImageReady="true";v.innerHTML="";const img=document.createElement("img");img.className="cart-product-image";img.alt=`${TITLES[id]} product image`;img.referrerPolicy="no-referrer";v.appendChild(img);bind(img,sourcesFor(id),TITLES[id],{compact:true,width:320,priority:"low"});});}
  function detail(){const modal=document.getElementById("productDetailModal");if(!modal||modal.getAttribute("aria-hidden")==="true")return;const id=location.hash.match(/^#product\/([^/]+)$/)?.[1];if(!id)return;const main=modal.querySelector("#detailMainImage");if(main)bind(main,sourcesFor(id),TITLES[id],{width:1200,priority:"high",lazy:false});modal.querySelectorAll(".product-detail-thumb img").forEach((thumb,i)=>{const src=sourcesFor(id)[i];if(src){thumb.removeAttribute("srcset");thumb.decoding="async";thumb.loading="lazy";thumb.src=fastSource(src,420);thumb.closest("[data-detail-thumb]")?.setAttribute("data-detail-thumb",src);thumb.onerror=()=>thumb.style.visibility="hidden";}});}
  function styles(){if(document.getElementById("dewifyImageRuntimeStyles"))return;const s=document.createElement("style");s.id="dewifyImageRuntimeStyles";s.textContent=`.product-card-image,.cart-product-image{display:block;width:100%;height:100%;object-fit:cover}.product-card-image,.cart-product-image{background:#141414}.dewify-image-fallback{width:100%;height:100%;min-height:180px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:flex-end;gap:8px;padding:18px;background:radial-gradient(circle at 75% 20%,rgba(255,255,255,.12),transparent 35%),linear-gradient(135deg,#1c1c1c,#0c0c0c);color:#f3f1eb}.dewify-image-fallback span{font-size:8px;letter-spacing:.16em;color:#969696}.dewify-image-fallback strong{font:600 20px/1 "Space Grotesk",sans-serif;letter-spacing:-.04em}.dewify-image-fallback.compact{min-height:100%;padding:10px}.dewify-image-fallback.compact strong{font-size:11px}.mini-visual{overflow:hidden;background:#141414}.cart-product-image{transition:transform .35s ease}.cart-line:hover .cart-product-image{transform:scale(1.025)}.dewify-image-failed{overflow:hidden}`;document.head.appendChild(s);}
  function init(){styles();cards();cart();detail();const grid=document.getElementById("productGrid"),cc=document.getElementById("cartContent");const o=new MutationObserver(()=>{cards();cart();detail();});if(grid)o.observe(grid,{childList:true,subtree:true});if(cc)o.observe(cc,{childList:true,subtree:true});window.addEventListener("hashchange",()=>setTimeout(detail,0));}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
