'use strict';
/* Tema, animações e janelas. Tudo respeita prefers-reduced-motion. */
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const EASE='cubic-bezier(.22,1,.36,1)';
/* Transições puladas (navegação rápida) não devem gerar erros. */
const quiet=vt=>{for(const k of ['ready','finished','updateCallbackDone'])vt[k]?.catch(()=>{});return vt;};

const Theme={
 key:'elixir-theme',
 get(){try{return localStorage.getItem(this.key)||'system';}catch{return 'system';}},
 isDark(){const m=this.get();return m==='dark'||m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;},
 apply(mode=this.get()){const root=document.documentElement;if(mode==='system')delete root.dataset.theme;else root.dataset.theme=mode;$('meta[name=theme-color]')?.setAttribute('content',this.isDark()?'#0c0c0c':'#ffffff');},
 toggle(){const next=this.isDark()?'light':'dark';try{localStorage.setItem(this.key,next);}catch{}
  const swap=()=>{this.apply(next);$$('[data-action=theme]').forEach(b=>b.innerHTML=this.button());};
  if(document.startViewTransition&&!reducedMotion.matches){document.documentElement.classList.add('vt-theme');quiet(document.startViewTransition(swap)).finished.catch(()=>{}).finally(()=>document.documentElement.classList.remove('vt-theme'));}else swap();},
 button(){return `${icon(this.isDark()?'sun':'moon')}<span>${this.isDark()?'Modo claro':'Modo escuro'}</span>`;}
};
Theme.apply();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{Theme.apply();$$('[data-action=theme]').forEach(b=>b.innerHTML=Theme.button());});

const Motion={
 animate(el,frames,opts={}){if(!el||reducedMotion.matches)return null;return el.animate(frames,{duration:320,easing:EASE,...opts});},
 /* Espera o fim da animação, com limite de tempo (abas em segundo plano pausam animações). */
 done(a,ms=400){return a?Promise.race([a.finished.catch(()=>{}),new Promise(r=>setTimeout(r,ms))]):Promise.resolve();},
 /* Troca o conteúdo; entre rotas usa View Transitions quando o navegador suporta. */
 paint(html,{transition=false,after}={}){
  /* Só a pintura mais recente vale: callbacks de transições puladas chegam fora de ordem. */
  const token=this.token=(this.token||0)+1;
  const apply=()=>{if(token!==this.token||this.applied===token)return;this.applied=token;const app=$('#app'),mounted=$('.app',app),t=document.createElement('template');t.innerHTML=html;const next=$('.app',t.content);
   if(mounted&&next&&mounted.dataset.layout===next.dataset.layout){for(const sel of ['#main','.side-nav','.tabbar','#rail','.side-foot','.mobile-head']){const a=$(sel,mounted),b=$(sel,next);if(a&&b&&a.innerHTML!==b.innerHTML)a.innerHTML=b.innerHTML;}const tray=$('.compare-tray',mounted),nt=$('.compare-tray',next);if(tray?.outerHTML!==nt?.outerHTML){tray?.remove();if(nt)mounted.append(nt);}}
   else app.replaceChildren(t.content);
   this.settle(!transition);this.reveal();after?.();};
  if(transition&&document.startViewTransition&&!reducedMotion.matches){quiet(document.startViewTransition(apply));setTimeout(apply,250);}
  else{apply();if(transition)this.animate($('#main'),[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}]);}
 },
 /* Em atualizações da mesma tela, nada pisca: imagens já vistas e cartões aparecem direto. */
 loaded:new Set(),
 settle(sameView){for(const img of $$('#app img'))if(this.loaded.has(img.src))img.classList.add('is-loaded');if(sameView&&this.painted)$$('#app [data-reveal]').forEach(el=>el.classList.add('in'));this.painted=true;},
 /* Revela cartões quando entram na tela, com leve escalonamento. */
 observer:null,
 reveal(){if(reducedMotion.matches||!('IntersectionObserver' in window)){$$('[data-reveal]').forEach(el=>el.classList.add('in'));return;}
  this.observer??=new IntersectionObserver(entries=>{let i=0;for(const e of entries)if(e.isIntersecting){e.target.style.setProperty('--d',(i++%6)*45+'ms');e.target.classList.add('in');this.observer.unobserve(e.target);}},{rootMargin:'0px 0px -6% 0px'});
  $$('[data-reveal]:not(.in)').forEach(el=>this.observer.observe(el));},
 /* Coração que aparece no duplo toque. */
 burst(target,x,y){if(reducedMotion.matches)return;const r=target.getBoundingClientRect(),h=document.createElement('span');h.className='burst';h.innerHTML=icon('heart');h.style.left=(x??r.left+r.width/2)-r.left+'px';h.style.top=(y??r.top+r.height/2)-r.top+'px';target.append(h);h.addEventListener('animationend',()=>h.remove());},
 pop(el){this.animate(el,[{transform:'scale(.82)'},{transform:'scale(1.16)'},{transform:'none'}],{duration:360});}
};
/* Imagens aparecem suavemente quando terminam de carregar. */
document.addEventListener('load',e=>{if(e.target.tagName==='IMG'){e.target.classList.add('is-loaded');Motion.loaded.add(e.target.src);}},true);

const Modal={
 lastFocus:null,closing:null,
 open(title,html,{cls=''}={}){this.lastFocus=document.activeElement;const d=$('#modal');d.className=cls;$('#modal-content').innerHTML=`<header class="modal-head"><span class="grabber" aria-hidden="true"></span><h2>${title}</h2><button class="icon-btn" data-action="close" aria-label="Fechar">${icon('close')}</button></header><div class="modal-body">${html}</div>`;if(!d.open){this.closing?.cancel();this.closing=null;d.showModal();Motion.animate(d,matchMedia('(max-width:759px)').matches?[{transform:'translateY(100%)'},{transform:'none'}]:[{opacity:0,transform:'translateY(14px) scale(.98)'},{opacity:1,transform:'none'}],{duration:340});}Motion.reveal();},
 close(){const d=$('#modal');if(!d.open||this.closing)return;const a=Motion.animate(d,matchMedia('(max-width:759px)').matches?[{transform:'none'},{transform:'translateY(100%)'}]:[{opacity:1},{opacity:0,transform:'translateY(8px) scale(.99)'}],{duration:200,easing:'ease-in'});if(!a){d.close();return;}this.closing=a;Motion.done(a,260).then(()=>{if(this.closing===a){d.close();this.closing=null;}});},
 dismiss(){this.closing?.cancel();this.closing=null;$('#modal').open&&$('#modal').close();},
 init(){const d=$('#modal');d.addEventListener('close',()=>{if(this.lastFocus?.isConnected)this.lastFocus.focus({preventScroll:true});});d.addEventListener('click',e=>{if(e.target===d)this.close();});d.addEventListener('cancel',e=>{e.preventDefault();this.close();});
  /* Arrastar para baixo fecha a folha no celular. */
  let start=null;d.addEventListener('pointerdown',e=>{if(!e.target.closest('.modal-head')||!matchMedia('(max-width:759px)').matches)return;start=e.clientY;d.setPointerCapture(e.pointerId);});
  d.addEventListener('pointermove',e=>{if(start===null)return;const dy=Math.max(0,e.clientY-start);d.style.transform=`translateY(${dy}px)`;});
  d.addEventListener('pointerup',e=>{if(start===null)return;const dy=e.clientY-start;start=null;d.style.transform='';if(dy>90)this.close();});}
};
const openModal=(t,h,o)=>Modal.open(t,h,o),closeModal=()=>Modal.close();
