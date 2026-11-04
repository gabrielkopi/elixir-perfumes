'use strict';
/* Stories: faixa no topo do feed e visualizador em tela cheia. */
const Stories={
 duration:5000,
 people(){return [...COMMUNITY.people,...PEOPLE.filter(u=>!People.find(u.id))].map(u=>({u,items:Posts.by(u.id).slice(0,3).map(p=>Posts.normalize(p))})).filter(x=>x.items.length).slice(0,10);},
 seen(id){return state.seenStories.includes(id);},
 strip(){const list=this.people().sort((a,b)=>this.seen(a.u.id)-this.seen(b.u.id));return `<section class="stories" aria-label="Stories"><button class="story me" data-action="publish"><span class="story-ring">${UI.avatar(null)}<i>${icon('plus')}</i></span><small>Seu story</small></button>${list.map(({u})=>`<button class="story" data-action="story" data-id="${u.id}"><span class="story-ring ${this.seen(u.id)?'seen':''}">${UI.avatar(u)}</span><small>${esc((u.handle||u.name).split(/[ .]/)[0].toLowerCase())}</small></button>`).join('')}</section>`;},

 /* Visualizador */
 queue:[],pi:0,ii:0,timer:null,started:0,elapsed:0,paused:false,
 open(id){this.queue=this.people().sort((a,b)=>this.seen(a.u.id)-this.seen(b.u.id));this.pi=Math.max(0,this.queue.findIndex(x=>x.u.id===id));this.ii=0;
  let el=$('#stories');if(!el){el=document.createElement('div');el.id='stories';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Stories');el.tabIndex=-1;document.body.append(el);this.bind(el);}
  el.hidden=false;document.documentElement.classList.add('no-scroll');Motion.animate(el,[{opacity:0,transform:'scale(.96)'},{opacity:1,transform:'none'}],{duration:280});this.show();el.focus();},
 close(){const el=$('#stories');if(!el||el.hidden)return;clearTimeout(this.timer);cancelAnimationFrame(this.raf);const a=Motion.animate(el,[{opacity:1},{opacity:0,transform:'scale(.97)'}],{duration:180});const done=()=>{el.hidden=true;document.documentElement.classList.remove('no-scroll');App.render();};Motion.done(a,240).then(done);},
 show(){const g=this.queue[this.pi];if(!g)return this.close();const item=g.items[this.ii],a=People.author(g.u.id);
  if(!state.seenStories.includes(g.u.id))Store.update(s=>{s.seenStories.push(g.u.id);},{silent:true});
  $('#stories').innerHTML=`<div class="sv" tabindex="-1"><div class="sv-bars">${g.items.map((_,i)=>`<i><b style="${i<this.ii?'width:100%':''}"></b></i>`).join('')}</div><header class="sv-head"><a href="${a.href}" data-action="story-profile">${a.avatar}<strong>${esc(a.handle)}</strong><small>${esc(item.when||'')}</small></a><button class="icon-btn" data-action="story-close" aria-label="Fechar">${icon('close')}</button></header><img class="sv-img" src="${esc(item.image)}" alt=""><button class="sv-prev" data-action="story-prev" aria-label="Anterior"></button><button class="sv-next" data-action="story-next" aria-label="Próximo"></button><footer class="sv-foot"><p>${esc(item.text)}</p>${item.tag?`<button class="post-tag" ${item.tag.action}>${UI.thumb(item.tag.image)}<span><strong>${esc(item.tag.name)}</strong><small>${esc(item.tag.brand)}</small></span>${icon('chevron')}</button>`:''}<button class="act ${state.likes.includes(item.id)?'on':''}" data-action="like" data-id="${item.id}" aria-label="Curtir">${icon('heart')}</button></footer></div>`;
  this.elapsed=0;this.paused=false;this.tick();},
 tick(){cancelAnimationFrame(this.raf);this.started=performance.now()-this.elapsed;const bar=$('#stories .sv-bars i:nth-child('+(this.ii+1)+') b');
  const step=t=>{if(this.paused)return;this.elapsed=t-this.started;const k=Math.min(1,this.elapsed/this.duration);if(bar)bar.style.width=k*100+'%';if(k>=1)this.next();else this.raf=requestAnimationFrame(step);};this.raf=requestAnimationFrame(step);},
 next(){const g=this.queue[this.pi];if(this.ii<g.items.length-1)this.ii++;else{this.pi++;this.ii=0;}if(this.pi>=this.queue.length)return this.close();this.show();},
 prev(){if(this.ii>0)this.ii--;else if(this.pi>0){this.pi--;this.ii=this.queue[this.pi].items.length-1;}this.show();},
 pause(v){this.paused=v;if(!v)this.tick();},
 key(e){if(e.key==='Escape'){e.preventDefault();this.close();}if(e.key==='ArrowRight')this.next();if(e.key==='ArrowLeft')this.prev();},
 bind(el){let y0=null;
  el.addEventListener('pointerdown',e=>{if(e.target.closest('header,footer'))return;y0=e.clientY;this.pressT=setTimeout(()=>this.pause(true),180);});
  el.addEventListener('pointerup',e=>{clearTimeout(this.pressT);if(y0!==null&&e.clientY-y0>100){y0=null;this.close();return;}y0=null;if(this.paused){this.pause(false);this.skipClick=true;}});
  
  el.addEventListener('click',e=>{if(this.skipClick){this.skipClick=false;e.stopPropagation();return;}const a=e.target.closest('[data-action]')?.dataset.action;if(a==='story-next'){e.stopPropagation();this.next();}if(a==='story-prev'){e.stopPropagation();this.prev();}if(a==='story-close'){e.stopPropagation();this.close();}if(a==='story-profile'||a==='perfume'||a==='product'){clearTimeout(this.timer);cancelAnimationFrame(this.raf);el.hidden=true;document.documentElement.classList.remove('no-scroll');}});}
};
