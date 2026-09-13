/* DEWIFY — lightweight cinematic starfield
   Bright, dense, varied, and cursor-reactive while staying canvas-only.
   Stars glide away from the pointer using attraction-style easing with the vector reversed.
   The hero/catalog spotlight is a separate CSS element so its position is exact and its motion is cheap.
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
  let dpr=1,w=0,h=0,raf=0,settleTimer=0;

  function addStar(x,y,r,a,gold,sparkle){
    stars.push({x,y,ox:x,oy:y,tx:x,ty:y,cx:x,cy:y,r,a,gold,sparkle});
  }

  function build(){
    stars.length=0;
    const count=Math.max(240,Math.min(360,Math.floor((w*h)/4200)));
    for(let i=0;i<count;i++){
      const p=Math.random();
      const r=p<.62?0.65+Math.random()*0.95:p<.9?1.15+Math.random()*1.15:1.9+Math.random()*1.45;
      const a=p<.56?0.62+Math.random()*0.25:p<.88?0.74+Math.random()*0.2:0.9+Math.random()*0.1;
      addStar(Math.random()*w,Math.random()*h,r,a,Math.random()<.78,p>.82);
    }
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    for(const s of stars){
      s.cx+=(s.tx-s.cx)*0.14;
      s.cy+=(s.ty-s.cy)*0.14;
      ctx.globalAlpha=s.a;
      ctx.fillStyle=s.gold?"#f8d978":"#fff1b0";
      if(s.sparkle){
        const rr=s.r;
        ctx.beginPath();
        ctx.moveTo(s.cx,s.cy-rr*2.4);ctx.lineTo(s.cx+rr*.45,s.cy-rr*.45);
        ctx.lineTo(s.cx+rr*2.4,s.cy);ctx.lineTo(s.cx+rr*.45,s.cy+rr*.45);
        ctx.lineTo(s.cx,s.cy+rr*2.4);ctx.lineTo(s.cx-rr*.45,s.cy+rr*.45);
        ctx.lineTo(s.cx-rr*2.4,s.cy);ctx.lineTo(s.cx-rr*.45,s.cy-rr*.45);
        ctx.closePath();ctx.fill();
      }else{
        ctx.beginPath();ctx.arc(s.cx,s.cy,s.r,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.globalAlpha=1;
  }

  function updateTargets(){
    const radius=170;
    const maxDisplacement=28;
    for(const s of stars){
      const dx=s.ox-mouse.x,dy=s.oy-mouse.y;
      const dist=Math.hypot(dx,dy);
      if(dist<radius && dist>0.001){
        const force=(1-dist/radius);
        const eased=force*force*(3-2*force);
        s.tx=s.ox+(dx/dist)*eased*maxDisplacement;
        s.ty=s.oy+(dy/dist)*eased*maxDisplacement;
      }else{
        s.tx=s.ox;s.ty=s.oy;
      }
    }
  }

  function loop(){
    raf=0;draw();
    if(mouse.active)raf=requestAnimationFrame(loop);
  }
  function wake(){if(!raf)raf=requestAnimationFrame(loop);}

  function size(){
    dpr=Math.min(window.devicePixelRatio||1,1.25);
    w=window.innerWidth;h=window.innerHeight;
    canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    build();draw();
  }

  if(fine&&!reduce){
    window.addEventListener("pointermove",e=>{
      mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=true;
      updateTargets();
      clearTimeout(settleTimer);
      settleTimer=setTimeout(()=>{mouse.active=false;updateTargets();wake();},170);
      wake();
    },{passive:true});
    window.addEventListener("pointerleave",()=>{mouse.active=false;updateTargets();wake();},{passive:true});
  }

  window.addEventListener("resize",size,{passive:true});
  size();
})();
