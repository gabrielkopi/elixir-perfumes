'use strict';
/* Despachante de interações (§4.5): data-action, data-input, data-change, form[data-submit] e teclas globais. */
const Actions={
 handlers:{},inputs:{},changes:{},submits:{},keys:{},
 add(map){for(const [name,fn] of Object.entries(map||{})){if(this.handlers[name]){console.error('Ação duplicada: '+name);continue;}this.handlers[name]=fn;}},
 input(name,fn){this.inputs[name]=fn;},
 change(name,fn){this.changes[name]=fn;},
 submit(name,fn){this.submits[name]=fn;},
 key(combo,fn){this.keys[combo]=fn;},
 has(name){return !!this.handlers[name];},
 run(name,el,e){const fn=this.handlers[name];if(!fn){console.warn('Ação sem handler: '+name);return;}try{return fn(el,e);}catch(err){console.warn(err);}},
 typing(t){return !!(t&&t.closest&&t.closest('input,textarea,select,[contenteditable=""],[contenteditable=true]'));},
 layerOpen(){const st=document.getElementById('stories');return (typeof Sheet!=='undefined'&&Sheet.isOpen())||(st&&!st.hidden);},
 /* Contador de caracteres dos campos (UI.field/UI.textarea com max). */
 counter(t){const max=Number(t.dataset.max);const c=t.closest('.field')&&t.closest('.field').querySelector('.count');if(!c||!max)return;const n=t.value.length;c.textContent=n+'/'+max;c.classList.toggle('over',n>max);},
 /* Roving tabindex em tablists e radiogroups: ←/→, Home/End; dispara a mesma ação. */
 rove(e){const t=e.target;const group=t.closest('[role=tablist],[role=radiogroup]');if(!group||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return false;
  const items=[...group.querySelectorAll(':scope>[role=tab],:scope>[role=radio],:scope>*>[role=radio]')].filter(x=>!x.disabled);const i=items.indexOf(t);if(i<0)return false;
  let j=i;if(e.key==='ArrowLeft'||e.key==='ArrowUp')j=(i-1+items.length)%items.length;else if(e.key==='ArrowRight'||e.key==='ArrowDown')j=(i+1)%items.length;else if(e.key==='Home')j=0;else j=items.length-1;
  e.preventDefault();const n=items[j];items.forEach(x=>x.tabIndex=x===n?0:-1);n.focus();n.click();return true;},
 init(){
  document.addEventListener('click',e=>{
   const el=e.target.closest('[data-action]');
   if(el&&!el.disabled&&el.getAttribute('aria-disabled')!=='true'){if(el.tagName==='A')e.preventDefault();this.run(el.dataset.action,el,e);return;}
   /* Links internos dentro de uma folha: navegam substituindo a entrada da folha no histórico. */
   const a=e.target.closest('a[href^="#"]');
   if(a&&a.closest('#sheet')&&!a.target&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){const raw=a.getAttribute('href').slice(1),i=raw.indexOf('/');if(!raw||!Router.has(i<0?raw:raw.slice(0,i)))return;
    e.preventDefault();let id=i<0?'':raw.slice(i+1);try{id=decodeURIComponent(id);}catch(x){}Router.go(i<0?raw:raw.slice(0,i),id);}
  });
  document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.max)this.counter(t);const n=t.closest&&t.closest('[data-input]');if(n&&this.inputs[n.dataset.input])try{this.inputs[n.dataset.input](t,e);}catch(x){console.warn(x);}});
  document.addEventListener('change',e=>{const n=e.target.closest&&e.target.closest('[data-change]');if(n&&this.changes[n.dataset.change])try{this.changes[n.dataset.change](e.target,e);}catch(x){console.warn(x);}});
  document.addEventListener('submit',e=>{const f=e.target.closest('form[data-submit]');if(!f)return;e.preventDefault();const fn=this.submits[f.dataset.submit];if(fn)try{fn(f,e);}catch(x){console.warn(x);}});
  document.addEventListener('keydown',e=>{
   if(e.isComposing||e.keyCode===229)return;
   if(this.rove(e))return;
   if(e.key==='Escape'){const fn=this.keys.Escape;if(fn)try{fn(e);}catch(x){console.warn(x);}return;}
   const mod=e.ctrlKey||e.metaKey;
   if(mod&&!e.altKey&&e.key.toLowerCase()==='k'){if(this.layerOpen())return;const fn=this.keys['mod+k'];if(fn){e.preventDefault();try{fn(e);}catch(x){console.warn(x);}}return;}
   if(e.altKey||mod||this.typing(e.target)||this.layerOpen())return;
   const fn=this.keys[e.key];if(fn){e.preventDefault();try{fn(e);}catch(x){console.warn(x);}}
  });
  /* Setas dos trilhos: desabilitadas nas pontas. */
  document.addEventListener('scroll',e=>{const r=e.target;if(r&&r.classList&&r.classList.contains('rail-x')&&r.dataset.rail)this.railState(r);},true);
 },
 railState(r){const name=r.dataset.rail,max=r.scrollWidth-r.clientWidth-2;
  for(const b of document.querySelectorAll(`[data-action=rail-prev][data-id="${CSS.escape(name)}"]`))b.disabled=r.scrollLeft<=2;
  for(const b of document.querySelectorAll(`[data-action=rail-next][data-id="${CSS.escape(name)}"]`))b.disabled=r.scrollLeft>=max;}
};
