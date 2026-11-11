'use strict';
/* Stories: o trilho de avatares do Início e o visualizador em tela cheia (timer, pausa, teclas, gestos). */
const Stories={
 duration:5000,
 /* Quem tem stories: quem você segue (não vistos primeiro), depois sugestões. Itens = até 3 publicações com foto. */
 groups(){if(typeof People==='undefined'||typeof Posts==='undefined'||typeof Post==='undefined')return [];
  const fol=state.following,seen=id=>state.seenStories.includes(id);
  const all=People.all().map(u=>({u,items:Posts.by(u.id).map(r=>Post.data(r)).filter(d=>d&&d.image).slice(0,3)})).filter(g=>g.items.length);
  const rank=new Map(People.suggestions(99).map((u,i)=>[u.id,i]));
  const a=all.filter(g=>fol.includes(g.u.id)).sort((x,y)=>seen(x.u.id)-seen(y.u.id)||fol.indexOf(x.u.id)-fol.indexOf(y.u.id));
  const b=all.filter(g=>!fol.includes(g.u.id)).sort((x,y)=>seen(x.u.id)-seen(y.u.id)||(rank.get(x.u.id)??99)-(rank.get(y.u.id)??99));
  return [...a,...b].slice(0,12);},
 seen(id){return state.seenStories.includes(id);},
 first(u){return String(u.name||u.handle||'').split(/\s+/)[0];},
 bubble(g,i){const s=this.seen(g.u.id);
  return `<button type="button" class="story-bubble pressable" data-action="story" data-id="${esc(g.u.id)}" data-story-id="${esc(g.u.id)}" aria-label="Stories de ${esc(g.u.name)}${s?', já vistos':''}" style="--i:${i}">${UI.avatar(g.u,'ring'+(s?' seen':''))}<span>${esc(this.first(g.u))}</span></button>`;},
 rail(){const gs=this.groups();if(!gs.length)return '';
  return `<div class="story-rail">${UI.rail(gs.map((g,i)=>this.bubble(g,i)),{name:'stories',label:'Stories'}).replace('class="rail rail-x','class="rail rail-x stagger')}</div>`;},

 /* ---------- visualizador ---------- */
 queue:[],skip:false,pi:0,ii:0,raf:0,started:0,elapsed:0,paused:false,held:false,hover:false,open_:false,opener:null,openHash:'',bound:false,pressT:0,
 host(){return document.getElementById('stories');},
 isOpen(){return this.open_;},
 open(id){const gs=this.groups();if(!gs.length)return;
  if(typeof Sheet!=='undefined'&&Sheet.isOpen())Sheet.close({force:true});
  this.queue=gs;this.pi=Math.max(0,gs.findIndex(g=>g.u.id===id));this.ii=0;
  const h=this.host();if(!h)return;this.bind(h);
  this.opener=document.activeElement&&document.activeElement!==document.body?document.activeElement:null;
  this.open_=true;this.paused=false;this.held=false;this.hover=false;h.hidden=false;
  h.innerHTML=`<div class="story-view glass-dark" role="dialog" aria-modal="true" tabindex="-1"><figure class="story-stage cover"></figure></div>`;
  try{if(!(history.state&&history.state.sheet))history.pushState({...(history.state||{}),sheet:1},'');}catch(e){}
  this.openHash=location.hash;
  this.show();
  const v=h.querySelector('.story-view'),st=h.querySelector('.story-stage');
  if(!Motion.reduced()){v.animate([{opacity:0},{opacity:1}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});
   st.animate([{opacity:0,transform:'scale(.96)',filter:'blur(12px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)'});}
  const c=h.querySelector('[data-story="close"]');try{(c||v).focus({preventScroll:true});}catch(e){}},
 close({fromPop=false,nav=false}={}){if(!this.open_)return;this.open_=false;this.stop();
  const h=this.host();if(!h)return;
  if(!fromPop&&!nav&&history.state&&history.state.sheet&&location.hash===this.openHash){try{history.back();}catch(e){}}
  const fin=()=>{h.hidden=true;h.innerHTML='';this.patchRail();const back=this.opener&&this.opener.isConnected?this.opener:document.getElementById('main');this.opener=null;try{!nav&&back&&back.focus({preventScroll:true});}catch(e){}};
  const v=h.querySelector('.story-view'),st=h.querySelector('.story-stage');
  if(Motion.reduced()||!v||nav){fin();return;}
  v.animate([{opacity:1},{opacity:0}],{duration:240,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
  const a=st&&st.animate([{opacity:1,transform:'none',filter:'blur(0px)'},{opacity:0,transform:'scale(.96)',filter:'blur(12px)'}],{duration:240,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
  let done=false;const end=()=>{if(!done){done=true;fin();}};if(a)a.onfinish=end;setTimeout(end,320);},
 /* Anéis "vistos" atualizados no lugar, sem redesenhar o Início. */
 patchRail(){for(const b of document.querySelectorAll('.story-bubble[data-story-id]')){const id=b.dataset.storyId,s=this.seen(id),av=b.querySelector('.avatar');if(av)av.classList.toggle('seen',s);
  const u=typeof People!=='undefined'?People.get(id):null;if(u)b.setAttribute('aria-label',`Stories de ${u.name}${s?', já vistos':''}`);}},
 show(){const g=this.queue[this.pi];if(!g)return this.close();const d=g.items[this.ii];if(!d)return this.close();
  if(!this.seen(g.u.id))Store.update(s=>{s.seenStories=[...new Set([...s.seenStories,g.u.id])];},{silent:true});
  const h=this.host(),v=h&&h.querySelector('.story-view'),st=h&&h.querySelector('.story-stage');if(!st)return;
  const fa=document.activeElement,keep=fa&&st.contains(fa)?fa.dataset.story||'':null;
  v.setAttribute('aria-label',`Stories de ${g.u.name}`);
  const n=g.items.length,bars=g.items.map((_,i)=>`<i><b style="--p:${i<this.ii?1:0}"></b></i>`).join('');
  const tag=d.perfume?`<a class="story-tag pressable" href="#perfume/${esc(d.perfume.id)}" data-story="go" data-page="perfume" data-id="${esc(d.perfume.id)}"><span class="story-tag-img">${UI.photo(d.perfume)}</span><span><b>${esc(d.perfume.name)}</b><small>${esc(d.perfume.brand)}</small></span></a>`:'';
  const first=this.pi===0&&this.ii===0,last=this.pi===this.queue.length-1&&this.ii===n-1;
  st.innerHTML=`<img class="story-img" src="${esc(d.image)}" alt="Foto de ${esc(g.u.name)}${d.perfume?' usando '+esc(d.perfume.name):''}" decoding="async">
<div class="scrim story-scrim"></div><div class="scrim"></div>
<div class="story-zones" aria-hidden="true"><span data-zone="prev"></span><span data-zone="next"></span></div>
<header class="story-top"><div class="story-bars" role="progressbar" aria-label="Story ${this.ii+1} de ${n}" aria-valuemin="1" aria-valuemax="${n}" aria-valuenow="${this.ii+1}">${bars}</div>
<div class="story-head"><a class="story-who" href="#person/${esc(g.u.id)}" data-story="go" data-page="person" data-id="${esc(g.u.id)}">${UI.avatar(g.u,'sm')}<span><b>${esc(g.u.name)}</b><span class="muted">${esc([d.occasion,UI.when(d.at)].filter(Boolean).join(' · '))}</span></span></a>
<span class="story-ctrl">${UI.iconBtn(this.paused?'play':'pause',{bare:true,label:this.paused?'Continuar':'Pausar',attrs:'data-story="pause"'})}${UI.iconBtn('close',{bare:true,label:'Fechar',attrs:'data-story="close"'})}</span></div></header>
${UI.iconBtn('chevron-left',{cls:'icon-btn--on-image story-nav story-nav--prev',label:'Anterior',attrs:`data-story="prev"${first?' disabled':''}`})}${UI.iconBtn('chevron-right',{cls:'icon-btn--on-image story-nav story-nav--next',label:last?'Fechar stories':'Próximo',attrs:'data-story="next"'})}
<figcaption class="story-foot">${d.text?`<p>${esc(d.text)}</p>`:''}<div class="story-acts">${tag}<button type="button" class="story-like pressable${d.liked?' on':''}" data-action="like" data-id="${esc(d.id)}" data-like="${esc(d.id)}" aria-pressed="${d.liked}">${icon(d.liked?'heart-fill':'heart')}<span class="sr-only">Curtir</span><span class="sr-only" data-likes="${esc(d.id)}">${UI.count(d.likes)}</span></button></div></figcaption>`;
  const img=st.querySelector('.story-img');if(img)img.addEventListener('error',()=>{img.style.visibility='hidden';},{once:true});
  if(keep!==null){const t=(keep&&st.querySelector(`[data-story="${keep}"]:not([disabled])`))||v;try{t.focus({preventScroll:true});}catch(e){}}
  this.elapsed=0;this.tick();},
 bar(){return this.host()&&this.host().querySelector(`.story-bars i:nth-child(${this.ii+1}) b`);},
 halted(){return this.paused||this.held||this.hover||document.visibilityState==='hidden';},
 tick(){cancelAnimationFrame(this.raf);if(!this.open_)return;this.started=performance.now()-this.elapsed;const bar=this.bar();
  const step=t=>{if(!this.open_)return;if(this.halted()){this.elapsed=t-this.started;this.raf=0;return;}this.elapsed=t-this.started;const k=Math.min(1,this.elapsed/this.duration);if(bar)bar.style.setProperty('--p',k.toFixed(4));
   if(k>=1)this.next();else this.raf=requestAnimationFrame(step);};this.raf=requestAnimationFrame(step);},
 stop(){cancelAnimationFrame(this.raf);this.raf=0;},
 resume(){if(this.open_&&!this.halted()&&!this.raf){this.tick();}},
 hold(v){this.held=v;if(v)this.stop();else this.resume();},
 pause(v=!this.paused){this.paused=v;const b=this.host()&&this.host().querySelector('[data-story="pause"]');if(b){b.setAttribute('aria-label',v?'Continuar':'Pausar');b.innerHTML=icon(v?'play':'pause');}if(v)this.stop();else this.resume();},
 next(){const g=this.queue[this.pi];if(!g)return this.close();if(this.ii<g.items.length-1)this.ii++;else{this.pi++;this.ii=0;}if(this.pi>=this.queue.length)return this.close();this.show();},
 prev(){if(this.ii>0)this.ii--;else if(this.pi>0){this.pi--;this.ii=0;}else{this.elapsed=0;this.tick();return;}this.show();},
 jump(d){const pi=this.pi+d;if(pi<0){this.ii=0;this.show();return;}if(pi>=this.queue.length)return this.close();this.pi=pi;this.ii=0;this.show();},
 focusables(){const h=this.host();return h?[...h.querySelectorAll('a[href],button:not([disabled])')].filter(x=>x.offsetParent!==null):[];},
 go(el){const page=el.dataset.page,id=el.dataset.id;this.close({nav:true});if(page==='perfume'){const pl=el.querySelector('.plate');if(pl)Motion.hero(pl);}Router.go(page,id);},
 bind(h){if(this.bound)return;this.bound=true;
  h.addEventListener('click',e=>{if(!this.open_)return;const b=e.target.closest('[data-story]');
   if(b){e.preventDefault();e.stopPropagation();const a=b.dataset.story;if(a==='close')this.close();else if(a==='pause')this.pause();else if(a==='next')this.next();else if(a==='prev')this.prev();else if(a==='go')this.go(b);return;}
   const z=e.target.closest('[data-zone]');if(z){if(this.skip){this.skip=false;return;}z.dataset.zone==='prev'?this.prev():this.next();}});
  h.addEventListener('keydown',e=>{if(!this.open_)return;
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.close();return;}
   if(e.key==='ArrowRight'&&!e.target.closest('input')){e.preventDefault();this.next();}
   else if(e.key==='ArrowLeft'){e.preventDefault();this.prev();}
   else if(e.key===' '&&!e.target.closest('a,button')){e.preventDefault();this.pause();}
   else if(e.key==='Tab'){const f=this.focusables();if(!f.length)return;const i=f.indexOf(document.activeElement);
    if(e.shiftKey&&(i<=0)){e.preventDefault();f[f.length-1].focus();}else if(!e.shiftKey&&(i===f.length-1||i<0)){e.preventDefault();f[0].focus();}}});
  /* Segurar pausa; soltar continua (e não conta como toque). */
  h.addEventListener('pointerdown',e=>{if(!this.open_||e.button>0||e.target.closest('a,button'))return;clearTimeout(this.pressT);this.pressT=setTimeout(()=>{this.hold(true);this.skip=true;},220);});
  const up=()=>{clearTimeout(this.pressT);if(this.held){this.hold(false);setTimeout(()=>{this.skip=false;},0);}};
  h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);
  /* Pausa enquanto o ponteiro ou o foco estão nos controles. */
  h.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse')return;const on=!!e.target.closest('.story-top,.story-foot,.story-nav');if(on!==this.hover){this.hover=on;on?this.stop():this.resume();}});
  h.addEventListener('pointerleave',()=>{if(this.hover){this.hover=false;this.resume();}});
  h.addEventListener('focusin',e=>{if(e.target.closest('.story-foot a,.story-foot button')){this.hover=true;this.stop();}});
  h.addEventListener('focusout',e=>{if(e.target.closest('.story-foot a,.story-foot button')){this.hover=false;this.resume();}});
  /* Gestos: arrastar para baixo 80px fecha; para os lados troca de pessoa. A página não rola por trás. */
  let x0=null,y0=null;
  h.addEventListener('touchstart',e=>{const t=e.touches[0];x0=t.clientX;y0=t.clientY;},{passive:true});
  h.addEventListener('touchend',e=>{if(x0===null)return;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;x0=y0=null;
   const swipe=()=>{this.skip=true;setTimeout(()=>{this.skip=false;},400);};
   if(dy>80&&Math.abs(dy)>Math.abs(dx)){swipe();this.close();}else if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.4){swipe();this.jump(dx<0?1:-1);}});
  h.addEventListener('touchmove',e=>{if(e.cancelable)e.preventDefault();},{passive:false});
  h.addEventListener('wheel',e=>{if(this.open_)e.preventDefault();},{passive:false});
  document.addEventListener('keydown',e=>{if(this.open_&&e.key==='Escape'&&!h.contains(e.target)){e.preventDefault();this.close();}else if(this.open_&&!h.contains(document.activeElement)&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.key==='ArrowRight'?this.next():this.prev();}},true);
  document.addEventListener('visibilitychange',()=>{if(!this.open_)return;if(document.visibilityState==='hidden')this.stop();else this.resume();});
  addEventListener('popstate',()=>{if(this.open_&&!(history.state&&history.state.sheet))this.close({fromPop:true});});
  addEventListener('hashchange',()=>{if(this.open_)this.close({nav:true});});}
};
