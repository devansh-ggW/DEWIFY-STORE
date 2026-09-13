/* DEWIFY — refined micro-motion controller. Dependency-free and defensive. */
(function(){
  "use strict";

  const reduceMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const finePointer = !!window.matchMedia?.("(pointer: fine)")?.matches;
  const raf = window.requestAnimationFrame || (fn => window.setTimeout(fn,16));

  function qs(s,root=document){return root.querySelector(s)}
  function qsa(s,root=document){return [...root.querySelectorAll(s)]}

  function burst(x,y,count=10,scale=1){
    if(reduceMotion)return;
    const wrap=document.createElement("span");wrap.className="dew-burst";wrap.style.left=`${x}px`;wrap.style.top=`${y}px`;
    const core=document.createElement("i");core.className="dew-burst-core";wrap.appendChild(core);
    const ring=document.createElement("i");ring.className="dew-burst-ring";wrap.appendChild(ring);
    for(let i=0;i<count;i++){
      const p=document.createElement("i");p.className="dew-burst-p";
      const a=(Math.PI*2*i/count)+(Math.random()-.5)*.25;
      const d=(28+Math.random()*34)*scale;
      p.style.setProperty("--dx",`${Math.cos(a)*d}px`);p.style.setProperty("--dy",`${Math.sin(a)*d}px`);
      p.style.animationDelay=`${Math.random()*45}ms`;wrap.appendChild(p);
    }
    document.body.appendChild(wrap);window.setTimeout(()=>wrap.remove(),760);
  }

  function tapBurst(x,y){
    if(reduceMotion)return;
    const wrap=document.createElement("span");wrap.className="dew-tap-burst";wrap.style.left=`${x}px`;wrap.style.top=`${y}px`;
    for(let i=0;i<7;i++){
      const p=document.createElement("i");const a=(Math.PI*2*i/7);const d=13+Math.random()*10;
      p.style.setProperty("--dx",`${Math.cos(a)*d}px`);p.style.setProperty("--dy",`${Math.sin(a)*d}px`);wrap.appendChild(p);
    }
    document.body.appendChild(wrap);window.setTimeout(()=>wrap.remove(),620);
  }

  function getCardImage(card){return card?.querySelector(".product-card-image, .product-visual img")||null;}

  function flyToBag(card){
    if(reduceMotion||!card)return;
    const source=getCardImage(card),bag=qs(".bag-button");
    if(!source||!bag)return;
    const a=source.getBoundingClientRect(),b=bag.getBoundingClientRect();
    if(a.width<4||a.height<4)return;
    const node=source.cloneNode(true);node.classList.add("dew-flight");
    node.style.width=`${Math.min(a.width,180)}px`;node.style.height=`${Math.min(a.height,180)}px`;
    node.style.left=`${a.left}px`;node.style.top=`${a.top}px`;
    const sx=a.left+a.width/2,sy=a.top+a.height/2,tx=b.left+b.width/2,ty=b.top+b.height/2;
    const dx=tx-sx,dy=ty-sy;
    node.style.setProperty("--fx1",`${dx*.18}px`);node.style.setProperty("--fy1",`${dy*.18-18}px`);
    node.style.setProperty("--fx2",`${dx*.58}px`);node.style.setProperty("--fy2",`${dy*.58-36}px`);
    node.style.setProperty("--fx3",`${dx*.84}px`);node.style.setProperty("--fy3",`${dy*.84-14}px`);
    node.style.setProperty("--fx",`${dx}px`);node.style.setProperty("--fy",`${dy}px`);
    node.style.setProperty("--fr1",`${dx>0?4:-4}deg`);node.style.setProperty("--fr2",`${dx>0?7:-7}deg`);node.style.setProperty("--fr3",`${dx>0?-4:4}deg`);node.style.setProperty("--fr",`${dx>0?1:-1}deg`);
    const glint=document.createElement("span");glint.className="dew-flight-glint";node.appendChild(glint);
    document.body.appendChild(node);void node.offsetWidth;node.classList.add("dew-flight-go");
    window.setTimeout(()=>burst(tx,ty,12,1.05),700);window.setTimeout(()=>node.remove(),1030);
  }

  function animateFilter(grid){
    if(!grid||reduceMotion)return;
    grid.classList.remove("dew-filtering");void grid.offsetWidth;grid.classList.add("dew-filtering");
    window.setTimeout(()=>{
      qsa(".product-card",grid).forEach((card,i)=>{card.classList.remove("dew-filter-in");card.style.setProperty("--filter-delay",`${Math.min(i*42,260)}ms`);void card.offsetWidth;card.classList.add("dew-filter-in");});
      grid.classList.remove("dew-filtering");
    },90);
  }

  function setupCardParallax(){
    if(!finePointer||reduceMotion)return;
    let active=null,lastX=0,lastY=0,ticking=false;
    document.addEventListener("pointerover",e=>{const c=e.target.closest?.(".product-card");if(c)active=c},{passive:true});
    document.addEventListener("pointerout",e=>{if(!active)return;if(!active.contains(e.relatedTarget)){active.style.setProperty("--image-shift-x","0px");active.style.setProperty("--image-shift-y","0px");active=null;}},{passive:true});
    document.addEventListener("pointermove",e=>{
      if(!active||ticking)return;lastX=e.clientX;lastY=e.clientY;ticking=true;
      raf(()=>{ticking=false;if(!active)return;const r=active.getBoundingClientRect();const px=(lastX-r.left)/r.width-.5,py=(lastY-r.top)/r.height-.5;active.style.setProperty("--image-shift-x",`${(-px*7).toFixed(2)}px`);active.style.setProperty("--image-shift-y",`${(-py*7).toFixed(2)}px`);});
    },{passive:true});
  }

  function setupScrollReveal(){
    const targets=qsa("main section, .section-heading, .filters, footer");
    if(reduceMotion||!("IntersectionObserver" in window))return;
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("dew-scroll-visible");io.unobserve(e.target)}}),{threshold:.12,rootMargin:"0px 0px -8%"});
    targets.forEach((el,i)=>{el.classList.add("dew-scroll-reveal");el.style.transitionDelay=`${Math.min(i*22,140)}ms`;io.observe(el);});
  }

  function setupHeader(){
    let compact=false,ticking=false;
    const update=()=>{ticking=false;const next=window.scrollY>50;if(next!==compact){compact=next;document.body.classList.toggle("dew-header-compact",compact)}};
    window.addEventListener("scroll",()=>{if(!ticking){ticking=true;raf(update)}},{passive:true});update();
  }

  function setupScrollProgress(){
    if(reduceMotion)return;
    const rail=document.createElement("div");rail.className="dew-scroll-progress";rail.setAttribute("aria-hidden","true");document.body.appendChild(rail);
    let ticking=false;
    const update=()=>{
      ticking=false;
      const max=document.documentElement.scrollHeight-window.innerHeight;
      const progress=max>0?(window.scrollY/max)*100:0;
      rail.style.setProperty("--dew-progress",`${Math.max(0,Math.min(100,progress))}%`);
    };
    window.addEventListener("scroll",()=>{if(!ticking){ticking=true;raf(update)}},{passive:true});
    window.addEventListener("resize",update,{passive:true});update();
  }

  function setup(){
    const grid=qs("#productGrid");
    setupCardParallax();setupScrollReveal();setupHeader();setupScrollProgress();
    document.addEventListener("click",e=>{
      const add=e.target.closest?.("[data-add],[data-detail-add]");
      if(add){const card=add.closest?.(".product-card");if(card)flyToBag(card);return;}
      const important=e.target.closest?.(".filter,.button,.icon-button,.clear-button,.bag-button,.remove,[data-plus],[data-minus]");
      if(important&&!reduceMotion)tapBurst(e.clientX,e.clientY);
    },true);

    if(grid&&!reduceMotion){
      const observer=new MutationObserver(()=>animateFilter(grid));observer.observe(grid,{childList:true});
      let initialized=false;
      const initialObserver=new MutationObserver(()=>{if(!initialized){initialized=true;animateFilter(grid);}});initialObserver.observe(grid,{childList:true});
      window.setTimeout(()=>initialObserver.disconnect(),1500);
    }

    document.addEventListener("pointerdown",e=>{const card=e.target.closest?.(".product-card");if(card&&!reduceMotion)card.style.setProperty("--press-scale",".995");},{passive:true});
    document.addEventListener("pointerup",e=>{const card=e.target.closest?.(".product-card");if(card)card.style.removeProperty("--press-scale")},{passive:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();
