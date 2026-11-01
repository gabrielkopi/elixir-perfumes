/* Keep navigation mounted; animate content rather than rebuilding the whole app. */
const Motion={
 reduced:matchMedia('(prefers-reduced-motion: reduce)'),key:null,observer:null,closing:null,
 ease:'cubic-bezier(.22,1,.36,1)',
 animate(el,frames,options={}){if(!el||this.reduced.matches)return null;return el.animate(frames,{duration:380,easing:this.ease,...options});},
 paint(html){
  const key=[route.page,route.id||'',route.name||'',Social.tab,Social.feed,Families.mode||'',Minimal.profileTab].join('|');
  const changed=this.key!==key,first=this.key===null;this.key=key;let navigated=false;
  const mounted=document.querySelector('.floating-app'),template=document.createElement('template');template.innerHTML=html;
  const next=template.content.querySelector('#main'),current=document.querySelector('#main');
  const focused=current?.contains(document.activeElement)?document.activeElement:null;
  const focusAttributes=focused?[...focused.attributes].filter(a=>['id','name','href','type'].includes(a.name)||a.name.startsWith('data-')).map(a=>[a.name,a.value]):[];
  const focusForm=focused?.form?.id;
  if(mounted&&current&&next){
   current.replaceChildren(...next.childNodes);
   const head=document.querySelector('.floating-topbar'),nextHead=template.content.querySelector('.floating-topbar');if(head&&nextHead&&head.innerHTML!==nextHead.innerHTML)head.innerHTML=nextHead.innerHTML;
   const nextNav=template.content.querySelectorAll('.floating-dock>button');document.querySelectorAll('.floating-dock>button').forEach((b,i)=>{const n=nextNav[i];b.className=n.className;if(n.hasAttribute('aria-current'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');b.querySelector('i')?.remove();if(n.querySelector('i'))b.append(n.querySelector('i').cloneNode());});
   const tray=document.querySelector('.compare-tray'),nextTray=template.content.querySelector('.compare-tray');if(tray?.outerHTML!==nextTray?.outerHTML){tray?.remove();if(nextTray)mounted.append(nextTray);}
  }else document.querySelector('#app').innerHTML=html;
  document.querySelectorAll('.studio-shortcuts a').forEach(a=>{if(a.getAttribute('href')==='#'+route.page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(changed){
   this.observer?.disconnect();const main=document.querySelector('#main');
   const routeKey=[route.page,route.id||'',route.name||''].join('|');navigated=!first&&this.routeKey!==routeKey;if(navigated)scrollTo({top:0,behavior:'instant'});this.routeKey=routeKey;
   this.animate(main,[{opacity:.15,transform:'translateY(9px)'},{opacity:1,transform:'translateY(0)'}]);
   this.animate(document.querySelector('.taste-radar path'),[{opacity:0,transform:'scale(.94)'},{opacity:1,transform:'scale(1)'}],{duration:650});
   if(!this.reduced.matches){this.observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){this.animate(entry.target,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:500});this.observer.unobserve(entry.target);}},{threshold:.08});document.querySelectorAll('.family-world-grid>a,.community-post,.scent-product').forEach((el,i)=>{if(i<24)this.observer.observe(el);});}
  }
  const main=document.querySelector('#main');
  if(navigated){
   const heading=main?.querySelector('h1');
   if(heading){heading.setAttribute('tabindex','-1');const focus=()=>{if(heading.isConnected)heading.focus({preventScroll:true});};const dialog=document.querySelector('#modal');if(dialog?.open)dialog.addEventListener('close',focus,{once:true});else focus();}
  }else if(focused&&focusAttributes.length){
   const target=[...main.querySelectorAll(focused.tagName)].find(el=>(!focusForm||el.form?.id===focusForm)&&focusAttributes.every(([name,value])=>el.getAttribute(name)===value));
   target?.focus({preventScroll:true});
  }
 },
 open(){this.closing?.cancel();this.closing=null;const dialog=document.querySelector('#modal');this.animate(dialog,[{opacity:0,transform:'translateY(18px) scale(.98)',filter:'blur(3px)'},{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0)'}],{duration:360});},
 close(){const dialog=document.querySelector('#modal');if(!dialog.open)return;if(this.reduced.matches){dialog.close();return;}if(this.closing)return;this.closing=this.animate(dialog,[{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(10px) scale(.985)'}],{duration:160});this.closing.finished.then(()=>{dialog.close();this.closing=null;}).catch(()=>{});},
 dismissNow(){this.closing?.cancel();this.closing=null;document.querySelector('#modal').close();}
};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||Motion.reduced.matches)return;const {action,id,social}=b.dataset;if(['like','favorite','save-post','follow'].includes(action)||social==='shelf')queueMicrotask(()=>{const target=[...document.querySelectorAll('button')].find(x=>x.dataset.id===id&&(action?x.dataset.action===action:x.dataset.social===social));Motion.animate(target,[{transform:'scale(.92)'},{transform:'scale(1.04)'},{transform:'scale(1)'}],{duration:320});});},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('#modal').open){e.preventDefault();Motion.close();}});
