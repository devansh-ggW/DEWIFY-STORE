/* DEWIFY — lightweight utility motion. No reveal/fade-in. */
(function(){
  "use strict";
  const reduce=!!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  function init(){
    const progress=document.createElement("div");
    progress.id="dewProgress";
    progress.setAttribute("aria-hidden","true");
    progress.innerHTML="<i></i>";
    document.body.appendChild(progress);
    const bar=progress.firstElementChild;
    let ticking=false;
    function update(){
      ticking=false;
      const doc=document.documentElement;
      const max=Math.max(1,doc.scrollHeight-window.innerHeight);
      bar.style.width=`${Math.min(100,(window.scrollY/max)*100)}%`;
    }
    window.addEventListener("scroll",()=>{if(!ticking){ticking=true;(window.requestAnimationFrame||((fn)=>setTimeout(fn,16)))(update)}},{passive:true});
    window.addEventListener("resize",update,{passive:true});
    update();

    document.addEventListener("click",e=>{
      const link=e.target.closest?.('a[href^="#"]');
      if(!link)return;
      const id=link.getAttribute("href");
      if(!id||id==="#")return;
      const target=document.querySelector(id);
      if(target){
        e.preventDefault();
        target.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
        history.replaceState(null,"",id);
      }
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
