'use strict';
/* Ponto de entrada: carrega o estado, liga roteador e desenha. */
const App={
 painted:false,
 /* Tela provisória: qualquer rota cuja view ainda não existe (ou falhou) continua navegável. */
 placeholder(page,id=''){const t=Router.title(page,id)||BRAND.name,full=Router.layoutOf(page,id)==='full';
  const close=full?`<div class="soon-close">${UI.iconBtn('close',{href:'#home',label:'Fechar'})}</div>`:'';
  return `<section class="v-${esc(page)}" data-view="${esc(page)}">${close}${UI.pageHead({eyebrow:BRAND.name,title:t})}${UI.empty({icon:'sparkle',title:'Esta tela está chegando',text:'Estamos preparando esta parte. Enquanto isso, o resto do app continua com você.',cta:page==='home'?null:{label:'Ir para o início',href:'#home'}})}</section>`;},
 view(){const def=Router.def(route.page);try{const html=def.view?def.view(route.id):'';if(typeof html!=='string'||!html)throw new Error('vazio');return html;}
  catch(e){if(!def.placeholder)console.warn('Tela indisponível ('+route.page+'):',e&&e.message);return this.placeholder(route.page,route.id);}},
 gate(){return !state.onboarded&&route.page==='home'&&Router.has('welcome')&&!Router.def('welcome').placeholder;},
 render({transition=false,dir='none'}={}){
  if(this.gate()){Router.go('welcome','1',{replace:true});return;}
  const layout=Router.layoutOf(),body=this.view(),html=Shell.render(body),h=document.documentElement,routeChange=transition;
  const y=scrollY;
  Motion.paint(html,{transition,dir,key:layout,after:()=>{
   h.dataset.layout=layout;h.classList.toggle('has-tray',!!document.querySelector('#app>.tray'));
   if(routeChange){h.classList.remove('scrolled');window.scrollTo(0,Router.pendingScroll||0);}else if(Math.abs(scrollY-y)>1)window.scrollTo(0,y);
   this.hooks(routeChange);
   Router.setTitle();
   if(routeChange){const m=document.getElementById('main');try{m&&m.focus({preventScroll:true});}catch(e){}Shell.announce((Router.title()||BRAND.name)+', página');}
  }});
  this.painted=true;},
 hooks(){const m=document.getElementById('main');Motion.after(m);Motion.sentinel();
  if(m)for(const r of m.querySelectorAll('.rail-x[data-rail]'))Actions.railState(r);
  if(Sheet.isOpen()){const b=document.querySelector('#sheet .sheet-body');if(b)Motion.after(b);}
  const a=Router.def(route.page).after;if(typeof a==='function')try{a(route.id);}catch(e){console.warn(e);}},
 boot(){
  Store.load();
  if(!state.location||state.location.mode==='none')Store.update(s=>{s.location={mode:'city',name:'São Paulo',lat:-23.55,lon:-46.63,consentAt:0};},{silent:true});
  /* iOS só aplica :active com um ouvinte de toque; e o perfume começa a ser calculado no toque, antes do clique. */
  document.addEventListener('touchstart',()=>{},{passive:true});
  document.addEventListener('pointerdown',e=>{const a=e.target.closest&&e.target.closest('[data-action=perfume][data-id],a[href^="#perfume/"]');if(!a)return;
   const id=a.dataset.id||decodeURIComponent(a.getAttribute('href').slice(9));try{const d=Router.def('perfume');if(d&&d.view)d.view(id);}catch(err){}},{passive:true});
  Theme.apply();Motion.syncMotion();Sheet.init();Actions.init();
  Actions.key('Escape',()=>{});
  Router.start();
  Store.on(()=>{Motion.syncMotion();this.render();});
  addEventListener('pagehide',()=>Store.flush());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')Store.flush();});
  this.render({transition:false});
  if(Router.pendingScroll)window.scrollTo(0,Router.pendingScroll);
  const notes=[...new Set(Store.notices)];Store.notices=[];notes.forEach((t,i)=>setTimeout(()=>toast(t),300+i*4600));
 }
};
App.boot();
