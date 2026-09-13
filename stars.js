/* DEWIFY — lightweight cursor-reactive starfield
   48–72 tiny points on one canvas. No images, particles, or continuous animation loop.
   The canvas redraws only while the cursor is moving near stars, then settles quickly.
*/
(function(){
  "use strict";
  const canvas=document.getElementById("starfield");
  if(!canvas) return;
  const ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx) return;

  const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const stars=[];
  const mouse={x:-9999,y:-9999,active:false};
  let dpr=1,w=0,h=0,raf=0,settleTimer=0;

  function size(){
    dpr=Math.min(window.devicePixelRatio||1,1.5);
    w=window.innerWidth; h=window.innerHeight;
    canvas.width=Math.floor(w*dpr); canvas.height=Math.floor(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    build(); draw();
  }

  function build(){
    stars.length=0;
    const count=Math.max(42,Math.min(72,Math.floor((w*h)/26000)));
    for(let i=0;i<count;i++){
      stars.push({
        x:Math.random()*w,y:Math.random()*h,
        ox:0,oy:0,r:Math.random()*1.15+.3,
        a:Math.random()*.42+.18,
        seed:Math.random()*Math.PI*2
      });
    }
    for(const s of stars){s.ox=s.x;s.oy=s.y;}
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    const radius=reduce?0:105;
    for(const s of stars){
      if(!reduce && mouse.active){
        const dx=s.ox-mouse.x,dy=s.oy-mouse.y;
        const dist=Math.hypot(dx,dy);
        if(dist<radius && dist>0){
          const force=(1-dist/radius);
          s.x=s.ox+(dx/dist)*force*24;
          s.y=s.oy+(dy/dist)*force*24;
        }else{
          s.x+=(s.ox-s.x)*.12;
          s.y+=(s.oy-s.y)*.12;
        }
      }
      ctx.globalAlpha=s.a;
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle="#f3f1eb";ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  function loop(){
    raf=0;
    draw();
    if(mouse.active){ raf=requestAnimationFrame(loop); }
  }

  function wake(){
    if(raf) return;
    raf=requestAnimationFrame(loop);
  }

  window.addEventListener("pointermove",e=>{
    if(reduce) return;
    mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=true;
    clearTimeout(settleTimer);
    settleTimer=setTimeout(()=>{mouse.active=false;wake();},260);
    wake();
  },{passive:true});

  window.addEventListener("pointerleave",()=>{mouse.active=false;wake();},{passive:true});
  window.addEventListener("resize",size,{passive:true});
  size();
})();
