/* DEWIFY — lightweight cinematic starfield
   Tiny, visible dot stars with restrained brightness and smooth cursor repulsion.
   Resize-safe: stars preserve their relative positions so mobile browsers never teleport them.
*/
(function(){
  "use strict";
  const canvas=document.getElementById("starfield");
  if(!canvas)return;
  const ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)return;

  const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const fine=window.matchMedia?.("(pointer: fine)")?.matches;
  const stars=[];
  const mouse={x:-9999,y:-9999,active:false};
  let dpr=1,w=0,h=0,raf=0,settleTimer=0,resizeTimer=0,initialized=false;

  function addStar(x,y,r,a,gold){stars.push({x,y,ox:x,oy:y,tx:x,ty:y,cx:x,cy:y,r,a,gold});}

  function build(){
    stars.length=0;
    const count=Math.max(145,Math.min(205,Math.floor((w*h)/7300)));
    for(let i=0;i<count;i++){
      const r=0.72+Math.random()*0.58;
      const a=0.56+Math.random()*0.30;
      addStar(Math.random()*w,Math.random()*h,r,a,Math.random()<.72);
    }
  }

  function repositionForResize(oldW,oldH){
    if(!initialized||!oldW||!oldH){build();return;}
    const sx=w/oldW,sy=h/oldH;
    for(const s of stars){
      s.ox*=sx;s.oy*=sy;s.tx=s.ox;s.ty=s.oy;s.cx=s.ox;s.cy=s.oy;
    }
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    for(const s of stars){
      s.cx+=(s.tx-s.cx)*0.18;
      s.cy+=(s.ty-s.cy)*0.18;
      ctx.globalAlpha=s.a;
      ctx.fillStyle=s.gold?"#f6d887":"#fbf2d3";
      ctx.beginPath();ctx.arc(s.cx,s.cy,s.r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  function updateTargets(){
    const radius=145;
    const maxDisplacement=18;
    for(const s of stars){
      const dx=s.ox-mouse.x,dy=s.oy-mouse.y;
      const dist=Math.hypot(dx,dy);
      if(dist<radius&&dist>0.001){
        const force=1-dist/radius;
        const eased=force*force*(3-2*force);
        s.tx=s.ox+(dx/dist)*eased*maxDisplacement;
        s.ty=s.oy+(dy/dist)*eased*maxDisplacement;
      }else{s.tx=s.ox;s.ty=s.oy;}
    }
  }

  function loop(){raf=0;draw();if(mouse.active)raf=requestAnimationFrame(loop);}
  function wake(){if(!raf)raf=requestAnimationFrame(loop);}

  function applySize(){
    const oldW=w,oldH=h;
    dpr=Math.min(window.devicePixelRatio||1,1.25);
    w=window.innerWidth;h=window.innerHeight;
    canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    repositionForResize(oldW,oldH);
    initialized=true;
    draw();
  }

  function size(){clearTimeout(resizeTimer);resizeTimer=setTimeout(applySize,120);}

  if(fine&&!reduce){
    window.addEventListener("pointermove",e=>{
      mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=true;updateTargets();
      clearTimeout(settleTimer);
      settleTimer=setTimeout(()=>{mouse.active=false;updateTargets();wake();},170);
      wake();
    },{passive:true});
    window.addEventListener("pointerleave",()=>{mouse.active=false;updateTargets();wake();},{passive:true});
  }

  window.addEventListener("resize",size,{passive:true});
  applySize();
})();
