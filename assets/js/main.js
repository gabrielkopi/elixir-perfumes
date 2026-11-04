'use strict';
/* Ponto de entrada: decide o que desenhar e liga as peças. */
const App={
 render({transition=false}={}){
  if(Discovery.active){Motion.paint(Discovery.view(),{transition});document.title=BRAND.name+' · Descoberta';return;}
  if(!state.onboarded){Motion.paint(Discovery.welcome(),{transition});document.title=BRAND.name;return;}
  const r=Router.current();Motion.paint(Shell.render(r.view()),{transition,after:()=>{r.after?.();this.countUp();}});
  const title=typeof r.title==='function'?r.title():r.title;document.title=BRAND.name+(title?' · '+title:'');
 },
 /* Números de afinidade sobem de 0 até o valor. */
 countUp(){if(reducedMotion.matches)return;$$('[data-count]:not([data-counted])').forEach(el=>{el.dataset.counted='1';const to=Number(el.dataset.count),t0=performance.now(),d=700;const step=t=>{const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);el.textContent=Math.round(to*e);if(k<1)requestAnimationFrame(step);};requestAnimationFrame(step);});}
};
Store.on(()=>App.render());
Modal.init();
Router.start();
App.render();
