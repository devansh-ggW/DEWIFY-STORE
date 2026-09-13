/* DEWIFY — resilient product-detail image layer
   Keeps detail views synced with the same image sources used by the catalog.
   Retries through optimized fallbacks instead of leaving a blank image.
*/
(function(){
  "use strict";
  const SOURCES={
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
  const proxy=(u,w)=>`https://images.weserv.nl/?url=${encodeURIComponent(u)}&w=${w}&q=82&output=webp&fit=cover`;
  const currentId=()=>location.hash.match(/^#product\/([^/]+)$/)?.[1]||null;
  const list=id=>SOURCES[id]||[];
  function bindMain(){
    const id=currentId(),img=document.getElementById("detailMainImage");
    if(!id||!img||img.dataset.dewFixBound===id)return;
    const urls=list(id);if(!urls.length)return;
    img.dataset.dewFixBound=id;img.dataset.dewFixIndex="0";img.referrerPolicy="no-referrer";img.decoding="async";img.loading="eager";
    const load=()=>{const i=Number(img.dataset.dewFixIndex||0);if(i>=urls.length)return;img.dataset.dewFixIndex=String(i+1);img.onerror=load;img.src=proxy(urls[i],1200);};
    load();
  }
  function bindThumbs(){
    const id=currentId(),thumbs=document.querySelectorAll("[data-detail-thumb]");
    const urls=list(id);if(!id||!urls.length||!thumbs.length)return;
    thumbs.forEach((btn,i)=>{
      const src=urls[i];if(!src)return;
      btn.dataset.detailThumb=src;
      const img=btn.querySelector("img");if(!img)return;
      img.referrerPolicy="no-referrer";img.loading="lazy";img.decoding="async";img.dataset.dewFixThumb="1";
      img.onerror=()=>{img.style.visibility="hidden";};
      img.src=proxy(src,420);
    });
  }
  function apply(){bindMain();bindThumbs();}
  const observer=new MutationObserver(apply);
  function init(){observer.observe(document.body,{childList:true,subtree:true});apply();window.addEventListener("hashchange",()=>setTimeout(apply,20),{passive:true});}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
