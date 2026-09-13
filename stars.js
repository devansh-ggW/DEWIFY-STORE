/* DEWIFY — lightweight cinematic starfield
   Dense, bright, varied, and cursor-reactive while staying canvas-only.
   Repulsion follows the same smooth attraction-style lerp, with direction
   flipped so stars glide away from the pointer and settle naturally.
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

  function addStar(x,y,r,a){
    stars.push({
      x,y,ox:x,oy:y,
      r,a,
      tx:x,ty:y,
      cx:x,cy:y,
      gold:Math.random()<0.72,
      sparkle:r>=1.75 && Math.random()<0.45
    });
  }

  function build(){
    stars.length=0;
    // Dense enough to feel like a real night sky without a particle library.
    const count=Math.max(180,Math.min(280,Math.floor((w*h)/5200)));
    for(let i=0;i<count;i++){
      const p=Math.random();
      const r=p<0.68?0.75+Math.random()*0.9:p<0.93?1.25+Math.random()*1.0:2.0+Math.random()*1.45;
      const a=p<0.62?0.58+Math.random()*0.25:p<0.92?0.74+Math.random()*0.2:0.92+Math.random()*0.08;
      addStar(Math.random()*w,Math.random()*h,r,a);
    }

    // Dominant 8-point star at the top-center: the visual anchor of the site.
    const heroY=Math.max(58,Math.min(104,h*0.095));
    const hero={x:w*.5,y:heroY,ox:w*.5,oy:heroY,tx:w*.5,ty:heroY,cx:w*.5,cy:heroY,r:10.5,a:1,gold:true,hero:true,sparkle:true};
    stars.push(hero);
  }

  function drawHeroStar(s){
    const glow=ctx.createRadialGradient(s.x,s.y,2,s.x,s.y,100);
    glow.addColorStop(0,"rgba(255,223,117,.24)");
    glow.addColorStop(.35,"rgba(255,205,70,.09)");
    glow.addColorStop(1,"rgba(255,205,70,0)");
    ctx.fillStyle=glow;
    ctx.fillRect(s.x-100,s.y-100,200,200);

    ctx.fillStyle="#fff1a8";
    ctx.globalAlpha=1;
    ctx.beginPath();
    const points=8,outer=13.5,inner=4.5,rotation=-Math.PI/2;
    for(let i=0;i<points*2;i++){
      const rr=i%2===0?outer:inner;
      const a=rotation+i*Math.PI/points;
      const x=s.x+Math.cos(a)*rr,y=s.y+Math.sin(a)*rr;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }
    ctx.closePath();ctx.fill();

    ctx.globalAlpha=.9;
    ctx.strokeStyle="#fff9d8";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(s.x-22,s.y);ctx.lineTo(s.x+22,s.y);ctx.moveTo(s.x,s.y-22);ctx.lineTo(s.x,s.y+22);ctx.stroke();
    ctx.globalAlpha=1;
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    for(const s of stars){
      if(!s.hero){
        // Attraction-style smoothing, but target is computed away from cursor.
        s.cx += (s.tx-s.cx)*0.12;
        s.cy += (s.ty-s.cy)*0.12;
      }

      if(s.hero){drawHeroStar(s);continue;}

      ctx.globalAlpha=s.a;
      ctx.fillStyle=s.gold?"#f9dc78":"#fff0b7";
      if(s.sparkle){
        ctx.beginPath();
        ctx.moveTo(s.cx,s.cy-s.r*2.0);ctx.lineTo(s.cx+s.r*.38,s.cy-s.r*.38);
        ctx.lineTo(s.cx+s.r*2.0,s.cy);ctx.lineTo(s.cx+s.r*.38,s.cy+s.r*.38);
        ctx.lineTo(s.cx,s.cy+s.r*2.0);ctx.lineTo(s.cx-s.r*.38,s.cy+s.r*.38);
        ctx.lineTo(s.cx-s.r*2.0,s.cy);ctx.lineTo(s.cx-s.r*.38,s.cy-s.r*.38);
        ctx.closePath();ctx.fill();
      }else{
        ctx.beginPath();ctx.arc(s.cx,s.cy,s.r,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.globalAlpha=1;
  }

  function updateTargets(){
    const radius=150;
    const maxDisplacement=24;
    for(const s of stars){
      if(s.hero){s.tx=s.ox;s.ty=s.oy;continue;}
      const dx=s.ox-mouse.x,dy=s.oy-mouse.y;
      const dist=Math.hypot(dx,dy);
      if(dist<radius && dist>0.001){
        const force=(1-dist/radius)*maxDisplacement;
        s.tx=s.ox+(dx/dist)*force;
        s.ty=s.oy+(dy/dist)*force;
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
    dpr=Math.min(window.devicePixelRatio||1,1.35);
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
      settleTimer=setTimeout(()=>{
        mouse.active=false;
        updateTargets();
        wake();
      },170);
      wake();
    },{passive:true});
    window.addEventListener("pointerleave",()=>{mouse.active=false;updateTargets();wake();},{passive:true});
  }

  window.addEventListener("resize",size,{passive:true});
  size();
})();
