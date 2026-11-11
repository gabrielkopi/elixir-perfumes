'use strict';
/* Movimento, folhas (sheets) e tema. Blur só em transições de página, trocas de segmento, fundo de folhas e pop-in no desktop. */
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');

const Motion={
 vt:null,token:0,heroPending:false,
 html(){return document.documentElement;},
 /* Reduzir movimento: ajuste do app ('on') ou do sistema. */
 reduced(){const s=typeof state!=='undefined'&&state.settings?state.settings.reduceMotion:'system';return s==='on'||reducedMotion.matches;},
 syncMotion(){this.html().dataset.motion=this.reduced()?'reduce':'full';},
 wait(el,ms){return new Promise(res=>{let done=false;const on=e=>{if(e.target===el)fin();};const fin=()=>{if(done)return;done=true;if(el)el.removeEventListener('animationend',on);res();};if(el)el.addEventListener('animationend',on);setTimeout(fin,ms);});},
 /* Transição de página com blur: View Transitions, ou .page-out → apply → .page-in. Sem corrida de setTimeout. */
 page(apply,{dir='none'}={}){
  const h=this.html();h.dataset.nav=dir;
  if(this.reduced()){apply();return Promise.resolve();}
  if(document.startViewTransition){
   try{this.vt&&this.vt.skipTransition();}catch(e){}
   let ran=false;const run=()=>{if(ran)return;ran=true;apply();};
   let vt;try{vt=document.startViewTransition(run);}catch(e){run();return Promise.resolve();}
   this.vt=vt;
   vt.updateCallbackDone.catch(()=>run());
   vt.ready.catch(()=>{});
   return vt.finished.catch(()=>{}).then(()=>{if(this.vt===vt){this.vt=null;this.clearHero();}});
  }
  const t=++this.token,main=document.getElementById('main');
  if(!main){apply();return Promise.resolve();}
  main.classList.remove('page-in');main.classList.add('page-out');
  return this.wait(main,220).then(()=>{if(t!==this.token)return;apply();const m=document.getElementById('main');if(!m)return;m.classList.remove('page-out');m.classList.add('page-in');
   return this.wait(m,460).then(()=>{if(t===this.token){m.classList.remove('page-in');this.clearHero();}});});
 },
 /* Desenha o #app: com o mesmo esqueleto de shell, só as regiões que mudaram; senão troca tudo. */
 paintToken:0,
 paint(html,{transition=false,dir='none',after,key=''}={}){
  const tk=++this.paintToken;
  const apply=()=>{if(tk!==this.paintToken)return;
   this.html().dataset.paint=transition?'route':'quiet';
   const app=document.getElementById('app');if(!app)return;
   if(app.dataset.shell===key&&app.firstElementChild){
    const tpl=document.createElement('template');tpl.innerHTML=html;
    const kids=root=>[...root.children],pick=(root,sel)=>kids(root).find(e=>e.matches(sel))||null;
    for(const sel of ['.topbar','.tabbar','.tray']){const a=pick(app,sel),b=pick(tpl.content,sel);
     if(a&&b&&sel==='.tabbar'){if(a.outerHTML!==b.outerHTML){for(const at of ['style','data-lens','class'])a.setAttribute(at,b.getAttribute(at)||'');if(a.innerHTML!==b.innerHTML)a.innerHTML=b.innerHTML;}}
     else if(a&&b){if(a.outerHTML!==b.outerHTML)a.replaceWith(b);}else if(a&&!b)a.remove();else if(!a&&b)app.insertBefore(b,pick(app,'#route-live')||pick(app,'.fade-b'));}
    const m=pick(app,'#main'),nm=pick(tpl.content,'#main');if(m&&nm){m.className=nm.className;m.innerHTML=nm.innerHTML;}
   }else{app.innerHTML=html;app.dataset.shell=key;}
   if(after)after();};
  if(transition&&!this.reduced())return this.page(apply,{dir});
  if(transition)this.html().dataset.nav=dir;
  apply();return Promise.resolve();
 },
 /* Troca de conteúdo no lugar (segmentos, abas): blur curto, sem pulo de altura. */
 swaps:new WeakMap(),
 swap(container,html,{dir=0}={}){
  const el=typeof container==='string'?document.querySelector(container):container;if(!el)return Promise.resolve();
  const t=(this.swaps.get(el)||0)+1;this.swaps.set(el,t);
  const done=()=>{this.after(el,{quiet:false});};
  if(this.reduced()){el.innerHTML=html;done();return Promise.resolve();}
  el.style.minHeight=el.offsetHeight+'px';el.classList.remove('swap-in');el.classList.add('swap-out');
  return this.wait(el,180).then(()=>{if(this.swaps.get(el)!==t)return;el.innerHTML=html;el.classList.remove('swap-out');el.classList.add('swap-in');
   if(dir)el.style.setProperty('--swap-x',(dir>0?16:-16)+'px');done();
   return this.wait(el,380).then(()=>{if(this.swaps.get(el)!==t)return;el.classList.remove('swap-in');el.style.minHeight='';el.style.removeProperty('--swap-x');});});
 },
 /* Ganchos pós-pintura num container (o core chama em #main e no corpo da folha). */
 after(root,{quiet=true}={}){if(!root)return;for(const f of ['settle','reveal','count','draw','fit'])try{this[f](root,{quiet});}catch(e){console.warn(e);}},
 /* Imagens: sem shimmer infinito; erro vira a plate tipográfica (nunca ícone quebrado). */
 settle(root=document){
  for(const img of root.querySelectorAll('img')){if(img.dataset.settled)continue;img.dataset.settled='1';
   if(img.complete){if(img.naturalWidth===0&&img.getAttribute('src'))this.broken(img);continue;}
   img.classList.add('loading');
   img.addEventListener('load',()=>img.classList.remove('loading'),{once:true});
   img.addEventListener('error',()=>this.broken(img),{once:true});}
 },
 broken(img){img.classList.remove('loading');const plate=img.closest('.plate');
  if(plate){const b=img.dataset.brand||'',n=img.dataset.name||img.alt||'';const f=document.createElement('div');f.className='fallback';f.innerHTML=`<b>${esc(b)}</b><span>${esc(n)}</span>`;img.replaceWith(f);return;}
  const av=img.closest('.avatar');if(av){const i=av.dataset.initials||'';img.remove();av.textContent=i;return;}
  img.style.visibility='hidden';},
 /* Revelação abaixo da dobra: opacidade e transform, sem blur. */
 io:null,
 reveal(root=document,{quiet=true}={}){
  const els=[...root.querySelectorAll('[data-reveal]:not(.in)')];if(!els.length)return;
  const byParent=new Map();for(const el of els){const p=el.parentElement;const n=byParent.get(p)||0;el.style.setProperty('--i',Math.min(n,8));byParent.set(p,n+1);}
  if(this.reduced()||!('IntersectionObserver' in window)){els.forEach(el=>el.classList.add('in'));return;}
  const quietPaint=this.html().dataset.paint==='quiet';
  this.io=this.io||new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){e.target.classList.add('in');this.io.unobserve(e.target);}},{rootMargin:'0px 0px -6% 0px'});
  for(const el of els){if(quietPaint){const r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0){el.classList.add('in');continue;}}this.io.observe(el);}
 },
 /* Números sobem de 0 ao valor uma vez (700ms ease-out-cubic); em pintura silenciosa, vão direto. */
 count(root=document){
  for(const el of root.querySelectorAll('[data-count]:not([data-counted])')){el.dataset.counted='1';
   const to=Number(el.dataset.count);const node=[...el.childNodes].find(n=>n.nodeType===3)||el.firstChild;if(!Number.isFinite(to)||!node)continue;
   const fmt=v=>String(Math.round(v));
   if(this.reduced()||this.html().dataset.paint==='quiet'){node.textContent=fmt(to);continue;}
   const t0=performance.now(),d=700;node.textContent='0';
   const step=t=>{const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);node.textContent=fmt(to*e);if(k<1&&el.isConnected)requestAnimationFrame(step);else node.textContent=fmt(to);};requestAnimationFrame(step);}
 },
 /* Linhas de gráfico desenham ao entrar na tela. */
 drawIO:null,
 draw(root=document){
  const charts=[...root.querySelectorAll('svg.chart:not([data-drawn])')];if(!charts.length)return;
  for(const svg of charts){svg.dataset.drawn='1';for(const p of svg.querySelectorAll('[data-draw]')){try{p.style.setProperty('--len',Math.ceil(p.getTotalLength()+1));}catch(e){}}}
  if(this.reduced()||!('IntersectionObserver' in window)||this.html().dataset.paint==='quiet'){charts.forEach(c=>c.classList.add('in'));return;}
  this.drawIO=this.drawIO||new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){e.target.classList.add('in');this.drawIO.unobserve(e.target);}},{threshold:.2});
  requestAnimationFrame(()=>charts.forEach(c=>this.drawIO.observe(c)));
 },
 pop(el){if(!el)return;try{navigator.vibrate&&navigator.vibrate(8);}catch(e){}if(this.reduced())return;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');el.addEventListener('animationend',()=>el.classList.remove('pop'),{once:true});},
 burst(target,x,y){if(!target||this.reduced())return;const r=target.getBoundingClientRect(),h=document.createElement('span');h.className='burst';h.setAttribute('aria-hidden','true');h.innerHTML=icon('heart-fill');
  if(getComputedStyle(target).position==='static')target.style.position='relative';
  h.style.left=((x??r.left+r.width/2)-r.left)+'px';h.style.top=((y??r.top+r.height/2)-r.top)+'px';target.append(h);h.addEventListener('animationend',()=>h.remove());setTimeout(()=>h.remove(),1200);},
 /* Barra superior: html.scrolled quando o sentinela sai de cena (ou sempre, sem sentinela). */
 sentIO:null,
 sentinel(){const h=this.html();if(this.sentIO){this.sentIO.disconnect();}
  const s=document.querySelector('#main [data-sentinel]');if(!s||!('IntersectionObserver' in window)){h.classList.add('scrolled');return;}
  const top=parseFloat(getComputedStyle(h).getPropertyValue('--topbar-h'))||52;
  this.sentIO=new IntersectionObserver(es=>{for(const e of es)h.classList.toggle('scrolled',!e.isIntersecting&&e.boundingClientRect.top<top+1);},{rootMargin:`-${Math.round(top)}px 0px 0px 0px`});
  this.sentIO.observe(s);},
 /* Herói compartilhado: o nome vai na .plate tocada (nunca na img, nunca estático no CSS). */
 hero(plateEl){this.clearHero();if(!plateEl||this.reduced()||!document.startViewTransition)return;plateEl.style.viewTransitionName='hero';this.heroPending=true;},
 consumeHero(){const v=this.heroPending;this.heroPending=false;return v;},
 clearHero(){for(const el of document.querySelectorAll('[style*="view-transition-name"]'))if(el.style.viewTransitionName==='hero')el.style.viewTransitionName='';},
 /* Texto que ocupa a largura (wordmarks, nomes de marca): entre --t-display e --t-mega. */
 fitRO:null,fitBounds:null,
 fit(root=document){const els=[...root.querySelectorAll('[data-fit]')];if(!els.length)return;
  const run=()=>{if(!this.fitBounds){const probe=document.createElement('span');probe.style.cssText='position:absolute;visibility:hidden;font-size:var(--t-display)';document.body.append(probe);const lo=parseFloat(getComputedStyle(probe).fontSize);probe.style.fontSize='var(--t-mega)';const hi=parseFloat(getComputedStyle(probe).fontSize);probe.remove();this.fitBounds=[lo||40,hi||260];}
   const [lo,hi]=this.fitBounds;
   for(const el of els){if(!el.isConnected)continue;el.style.fontSize='100px';const w=el.scrollWidth,cw=el.clientWidth;if(!w||!cw)continue;el.style.fontSize=Math.max(lo,Math.min(hi,100*cw/w*.98))+'px';}};
  const ready=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();ready.then(run);
  if(!this.fitRO&&'ResizeObserver' in window){this.fitRO=new ResizeObserver(()=>{this.fitBounds=null;requestAnimationFrame(()=>{const all=[...document.querySelectorAll('[data-fit]')];if(all.length)this.fit(document);});});this.fitRO.observe(document.documentElement);}
  run();}
};
reducedMotion.addEventListener('change',()=>Motion.syncMotion());

/* Folha única (#sheet): abre por baixo no celular e em pop-in no desktop; Esc, voltar e arrastar fecham. */
const Sheet={
 opts:{},opener:null,closing:false,backPending:false,confirming:null,saved:[],
 el(){return document.getElementById('sheet');},
 isOpen(){const d=this.el();return !!(d&&d.open)&&!this.closing;},
 markup({title='',body='',cls='',head=null,close=true}){
  const h=head!==null?head:(title?UI.sheetHead(title,{close}):`<div class="sheet-head sheet-head--bare">${close?UI.iconBtn('close',{action:'close',label:'Fechar'}):''}</div>`);
  return `<div class="sheet-inner">${h}<div class="sheet-body ${esc(cls)}">${body}</div></div>`;},
 label(d,o){const h2=d.querySelector('.sheet-head h2');d.removeAttribute('aria-labelledby');d.removeAttribute('aria-label');
  if(h2&&!o.head){h2.id='sheet-title';d.setAttribute('aria-labelledby','sheet-title');}else d.setAttribute('aria-label',o.title||'Janela');},
 focusIn(d,sel){let t=sel?d.querySelector(sel):null;if(!t){const all=[...d.querySelectorAll('.sheet-body a[href],.sheet-body button:not([disabled]),.sheet-body input:not([disabled]),.sheet-body select,.sheet-body textarea,.sheet-body [tabindex]:not([tabindex="-1"])')];t=all[0]||d.querySelector('[data-action=close]');}
  try{t&&t.focus({preventScroll:false});}catch(e){}},
 open({title='',body='',size='auto',cls='',onClose=null,confirmClose=null,focus='',head=null,close=true}={}){
  const d=this.el();if(!d)return;
  const o={title,body,size,cls,onClose,confirmClose,focus,head,close};
  if(d.open&&!this.closing){/* já aberta: troca o conteúdo no lugar, sem novo histórico */
   this.opts=o;d.classList.toggle('sheet--full',size==='full');
   const inner=d.querySelector('.sheet-inner');const tmp=document.createElement('div');tmp.innerHTML=this.markup(o);
   if(inner)inner.replaceWith(tmp.firstElementChild);else d.innerHTML=this.markup(o);
   this.label(d,o);const ni=d.querySelector('.sheet-inner');
   if(!Motion.reduced()&&ni){ni.classList.add('swap-in');ni.addEventListener('animationend',()=>ni.classList.remove('swap-in'),{once:true});}
   d.scrollTop=0;this.afterPaint();this.focusIn(d,focus);return;}
  if(this.closing){this.finish(true);}
  this.opener=document.activeElement&&document.activeElement!==document.body?document.activeElement:null;
  this.opts=o;this.saved=[];d.className='sheet'+(size==='full'?' sheet--full':'');d.innerHTML=this.markup(o);this.label(d,o);
  try{d.showModal();}catch(e){d.setAttribute('open','');}
  document.documentElement.classList.add('sheet-open');
  if(!(history.state&&history.state.sheet)){try{history.pushState({...(history.state||{}),sheet:1},'');}catch(e){}}
  d.scrollTop=0;this.afterPaint();this.focusIn(d,focus);},
 afterPaint(){const b=this.el()&&this.el().querySelector('.sheet-body');if(b)Motion.after(b,{quiet:false});},
 update(bodyHtml){const b=this.el()&&this.el().querySelector('.sheet-body');if(!b)return;b.innerHTML=bodyHtml;this.afterPaint();},
 /* Guarda e restaura o conteúdo atual (seletor de perfume dentro de outra folha, confirmações). */
 save(){const d=this.el();return d&&d.open?{html:d.querySelector('.sheet-inner')?.outerHTML||'',opts:this.opts,full:d.classList.contains('sheet--full')}:null;},
 restore(snap){const d=this.el();if(!snap||!d||!d.open)return;const inner=d.querySelector('.sheet-inner'),tmp=document.createElement('div');tmp.innerHTML=snap.html;
  if(inner&&tmp.firstElementChild)inner.replaceWith(tmp.firstElementChild);this.opts=snap.opts;d.classList.toggle('sheet--full',snap.full);this.label(d,snap.opts||{});this.afterPaint();this.focusIn(d,'');},
 async close({force=false,fromPop=false,keepHistory=false}={}){
  const d=this.el();if(!d||!d.open||this.closing)return true;
  if(this.confirming){const c=this.confirming;this.confirming=null;c(false);if(fromPop){try{history.pushState({...(history.state||{}),sheet:1},'');}catch(e){}}return false;}
  if(!force&&typeof this.opts.confirmClose==='function'){
   let ok=true;try{ok=await this.opts.confirmClose();}catch(e){ok=true;}
   if(!ok){if(fromPop){try{history.pushState({...(history.state||{}),sheet:1},'');}catch(e){}}return false;}}
  if(!fromPop&&!keepHistory&&history.state&&history.state.sheet){this.backPending=true;history.back();}
  if(force||Motion.reduced()){this.finish();return true;}
  this.closing=true;d.classList.add('closing');document.documentElement.classList.remove('sheet-open');
  await Motion.wait(d,300);this.finish();return true;},
 finish(silent=false){const d=this.el();this.closing=false;if(!d)return;d.classList.remove('closing','dragging');d.style.transform='';
  try{d.open&&d.close();}catch(e){d.removeAttribute('open');}
  document.documentElement.classList.remove('sheet-open');
  const o=this.opts;this.opts={};d.innerHTML='';
  if(!silent&&typeof o.onClose==='function')try{o.onClose();}catch(e){console.warn(e);}
  const back=this.opener&&this.opener.isConnected?this.opener:document.getElementById('main');this.opener=null;
  try{back&&back.focus({preventScroll:true});}catch(e){}},
 /* Confirmação dentro da folha (substitui o conteúdo; cancelar restaura). */
 confirm({title,text='',ok='Confirmar',danger=false}={}){
  return new Promise(resolve=>{
   const body=`<p class="sh-confirm-text">${esc(text)}</p><div class="sh-confirm-actions">${UI.btn(ok,{variant:danger?'danger':'primary',size:'block',attrs:'data-confirm="1"'})}${UI.btn('Cancelar',{variant:'secondary',size:'block',attrs:'data-confirm="0"'})}</div>`;
   const d=this.el(),wasOpen=this.isOpen(),snap=wasOpen?this.save():null;
   const finish=v=>{this.confirming=null;d.removeEventListener('click',onClick,true);
    if(wasOpen){if(!v)this.restore(snap);else setTimeout(()=>{if(this.isOpen()&&d.querySelector('.sh-confirm'))this.restore(snap);},0);}
    else if(this.isOpen())this.close({force:false});
    resolve(v);};
   const onClick=e=>{const b=e.target.closest('[data-confirm]');if(!b)return;e.preventDefault();e.stopPropagation();finish(b.dataset.confirm==='1');};
   if(wasOpen){const inner=d.querySelector('.sheet-inner'),tmp=document.createElement('div');tmp.innerHTML=this.markup({title,body,cls:'sh-confirm',close:true});inner.replaceWith(tmp.firstElementChild);d.classList.remove('sheet--full');this.label(d,{title});}
   else this.open({title,body,cls:'sh-confirm'});
   this.confirming=v=>finish(v);
   d.addEventListener('click',onClick,true);
   this.focusIn(d,'[data-confirm="0"]');});},
 init(){const d=this.el();if(!d)return;
  d.addEventListener('cancel',e=>{e.preventDefault();if(e.isComposing)return;const st=document.getElementById('stories');if(st&&!st.hidden)return;this.close();});
  d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.close();});
  /* Arrastar para fechar (toque): pega só após 8px na vertical; 90px ou flick > .5px/ms fecham. */
  let y0=null,t0=0,dy=0,dragging=false,pid=null;
  d.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||!matchMedia('(pointer:coarse)').matches)return;const r=d.getBoundingClientRect();
   if(!(e.target.closest('.sheet-head')||e.clientY-r.top<24))return;y0=e.clientY;t0=performance.now();dy=0;dragging=false;pid=e.pointerId;});
  d.addEventListener('pointermove',e=>{if(y0===null||e.pointerId!==pid)return;dy=e.clientY-y0;
   if(!dragging){if(Math.abs(dy)<8)return;if(dy<0){y0=null;return;}dragging=true;d.classList.add('dragging');try{d.setPointerCapture(pid);}catch(x){}}
   d.style.transform=`translateY(${Math.max(0,dy)}px)`;});
  const end=e=>{if(y0===null)return;const v=dy/Math.max(1,performance.now()-t0);y0=null;if(!dragging)return;dragging=false;d.classList.remove('dragging');
   if(dy>90||v>.5){this.close().then(ok=>{if(!ok)this.springBack(d);});}else this.springBack(d);};
  d.addEventListener('pointerup',end);d.addEventListener('pointercancel',end);},
 springBack(d){d.style.transition='transform var(--d-4) var(--ease-spring)';d.style.transform='';setTimeout(()=>{d.style.transition='';},500);}
};
const Modal=Sheet;
const openModal=(title,html,opts={})=>Sheet.open({title,body:html,...opts});
const closeModal=()=>Sheet.close();

/* Tema: só em Ajustes. Troca com um círculo que se abre (VT só na raiz). */
const Theme={
 get(){return typeof state!=='undefined'&&state.settings?state.settings.theme:'system';},
 isDark(v=this.get()){return v==='dark'||v==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;},
 apply(v=this.get()){const h=document.documentElement;if(v==='system')delete h.dataset.theme;else h.dataset.theme=v;
  const m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',this.isDark(v)?'#0A0A0A':'#FAFAF8');},
 set(v,{x=null,y=null}={}){if(!['system','light','dark'].includes(v))return;
  const wasDark=this.isDark(),swap=()=>{Store.update(s=>{s.settings.theme=v;},{silent:true});this.apply(v);};
  if(Motion.reduced()||!document.startViewTransition||wasDark===this.isDark(v)){swap();return Promise.resolve();}
  const h=document.documentElement;Motion.clearHero();
  try{Motion.vt&&Motion.vt.skipTransition();}catch(e){}
  h.dataset.vt='theme';
  const cx=x??innerWidth/2,cy=y??innerHeight/2,r=Math.hypot(Math.max(cx,innerWidth-cx),Math.max(cy,innerHeight-cy));
  let vt;try{vt=document.startViewTransition(swap);}catch(e){swap();delete h.dataset.vt;return Promise.resolve();}
  vt.updateCallbackDone.catch(()=>swap());
  vt.ready.then(()=>{h.animate({clipPath:[`circle(0px at ${cx}px ${cy}px)`,`circle(${r}px at ${cx}px ${cy}px)`]},{duration:560,easing:'cubic-bezier(.65,0,.35,1)',pseudoElement:'::view-transition-new(root)'});}).catch(()=>{});
  return vt.finished.catch(()=>{}).then(()=>{delete h.dataset.vt;});}
};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>Theme.apply());
