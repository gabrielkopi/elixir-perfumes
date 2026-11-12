'use strict';
/* Atividade (§5): eventos derivados na hora a partir do que você faz. Abrir não marca como lido; fechar marca.
   O que vem de dados de exemplo leva o rótulo "Demonstração". */
const Activity={
 DAY:864e5,
 at(v){const n=typeof v==='number'?v:Date.parse(v);return Number.isFinite(n)?Math.min(Date.now(),n):0;},
 hash(s){let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h;},
 people(){try{return typeof People!=='undefined'&&People.all?People.all():[];}catch(e){return [];}},
 events(){const out=[],now=Date.now(),created=this.at(state.createdAt)||now,ppl=this.people(),find=id=>ppl.find(p=>p.id===id);
  /* 1. quem você segue entrou na sua rede */
  for(const id of state.following){const u=find(id);if(!u)continue;
   out.push({id:'follow-'+id,kind:'person',at:Math.min(now,created+(this.hash(id)%36+2)*36e5),person:u,html:`<b>${esc(u.name)}</b> agora está na sua rede.`,href:'#person/'+encodeURIComponent(id),demo:true});}
  /* 2. gosto parecido + algo do seu Quero */
  const want=Select.shelfIds('want');
  if(want.length&&typeof Engine!=='undefined')for(const u of ppl){const R=u.ratings||{};let score=0;try{score=Engine.compatibility(state.ratings,u).score||0;}catch(e){}
   if(score<80)continue;const hit=want.find(id=>R[id]>=8);if(!hit)continue;const p=byId(hit);if(!p)continue;
   out.push({id:'want-'+u.id+'-'+hit,kind:'perfume',at:Math.min(now,(state.shelfAt[hit]||created)+6*36e5),person:u,perfume:p,html:`<b>${esc(u.name.split(' ')[0])}</b>, que tem gosto parecido com o seu, ama <b>${esc(p.name)}</b>. Ele está no seu Quero.`,href:'#perfume/'+encodeURIComponent(p.id),demo:true});}
  /* 3. edição do mês */
  if(typeof Editions!=='undefined'&&Editions.current){try{const e=(Editions.current()||[])[0];if(e){const d=new Date();d.setDate(1);d.setHours(9,0,0,0);
   out.push({id:'edition-'+e.id+'-'+d.getMonth(),kind:'edition',at:d.getTime(),edition:e,html:`Edição do mês: <b>${esc(e.title)}</b>.${e.thesis?' '+esc(e.thesis):''}`,href:'#edit/'+encodeURIComponent(e.id)});}}catch(err){}}
  /* 4. Testei há mais de 3 dias, sem avaliação */
  for(const id of Select.shelfIds('tried')){if(state.ratings[id]!==undefined)continue;const t=state.shelfAt[id]||0,p=byId(id);if(!p||now-t<3*this.DAY)continue;
   out.push({id:'rate-'+id,kind:'rate',at:t+3*this.DAY,perfume:p,html:`Como foi <b>${esc(p.name)}</b>? Sua avaliação ajusta o seu mapa.`,rate:p.id});}
  /* 5. curtidas nas suas publicações */
  for(const post of state.posts){const n=Number(post.likes)||0,p=byId(post.perfume);if(!n)continue;
   out.push({id:'likes-'+post.id,kind:'likes',at:Math.min(now,this.at(post.when)+2*36e5),perfume:p,html:`<b>${esc(UI.plural(n,'pessoa','pessoas'))}</b> curtiram sua publicação${p?' com '+esc(p.name):''}.`,href:'#profile',demo:true});}
  /* 6. ao vivo (demonstração): publicações, comentários, seguidores, curtidas e novidades do catálogo nesta sessão */
  if(typeof Live!=='undefined')out.push(...Live.items);
  const dis=new Set(state.activity.dismissed||[]);
  return out.filter(x=>!dis.has(x.id)).sort((a,b)=>b.at-a.at||(a.id<b.id?-1:1));},
 isNew(x){return x.at>(Number(state.activity.seenAt)||0);},
 unread(){try{return this.events().filter(x=>this.isNew(x)).length;}catch(e){return 0;}},
 row(x,i){const fresh=this.isNew(x);
  const lead=x.person?UI.avatar(x.person,'')
   :x.perfume?`<span class="thumb plate ac-thumb">${x.perfume.image?`<img src="${esc(x.perfume.image)}" alt="" loading="lazy" decoding="async">`:''}</span>`
   :`<span class="ac-ico">${icon(x.kind==='edition'?'sparkle':'bell','icon--20')}</span>`;
  const meta=`<span class="ac-meta">${esc(UI.when(x.at))}${x.demo?' · Demonstração':''}</span>`;
  const inner=`${lead}<span class="ac-text"><span class="ac-line">${x.html}</span>${meta}</span>${fresh?'<i class="dot-unread" aria-hidden="true"></i><span class="sr-only">, não lida</span>':''}`;
  const cls=`ac-row pressable${fresh?' is-new':''}`;
  return x.rate?`<li style="--i:${i}"><button type="button" class="${cls}" data-action="rate" data-id="${esc(x.rate)}">${inner}</button></li>`
   :`<li style="--i:${i}"><a class="${cls}" href="${esc(x.href)}">${inner}</a></li>`;},
 body(){const list=this.events(),n=list.filter(x=>this.isNew(x)).length;
  if(!list.length)return UI.empty({icon:'bell',title:'Nada novo por aqui',text:'Quando houver novidades sobre o seu gosto e a sua rede, elas aparecem aqui.'});
  return `${n?`<div class="ac-top"><p class="t-sm muted" data-ac-count>${esc(UI.plural(n,'novidade','novidades'))}</p>${UI.btn('Marcar como lidas',{action:'activity-read',variant:'tertiary'})}</div>`:''}<ul class="ac-list list-hair stagger">${list.map((x,i)=>this.row(x,i)).join('')}</ul>`;},
 open(){Sheet.open({title:'Atividade',cls:'sh-activity',body:this.body(),onClose:()=>this.markRead()});},
 markRead(){if(!this.unread())return;Store.update(s=>{s.activity.seenAt=Date.now();});},
 readNow(){this.markRead();const b=document.querySelector('#sheet .sh-activity');if(!b)return;
  for(const r of b.querySelectorAll('.ac-row.is-new')){r.classList.remove('is-new');r.querySelector('.dot-unread')?.remove();r.querySelector('.sr-only')?.remove();}
  b.querySelector('.ac-top')?.remove();toast('Tudo marcado como lido');}
};
Actions.add({'activity-read':()=>Activity.readNow()});

/* ---------- Ao vivo (demonstração) ----------
   Enquanto o app está aberto, a comunidade de demonstração "acontece": publicações novas, comentários, seguidores,
   curtidas e novidades do catálogo. Tudo rotulado como demonstração; nada é enviado para fora do aparelho. */
const Live={
 released:[],items:[],comments:{},timer:null,n:0,started:false,
 queue(){return typeof COMMUNITY!=='undefined'&&Array.isArray(COMMUNITY.livePosts)?COMMUNITY.livePosts:[];},
 people(){return (typeof People!=='undefined'?People.all():[]).filter(u=>u.id!=='me'&&u.shareMap!==false);},
 pick(list,k){return list.length?list[(this.n*7+k*13)%list.length]:null;},
 start(){if(this.started||(typeof SANDBOX!=='undefined'&&SANDBOX))return;this.started=true;this.next(14000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){clearTimeout(this.timer);this.timer=null;}else if(!this.timer)this.next(8000);});},
 next(ms){clearTimeout(this.timer);this.timer=setTimeout(()=>{this.timer=null;try{this.tick();}catch(e){console.warn(e);}this.next(22000+(this.n*9301%17000));},ms);},
 KINDS:['post','comment','follow','news','post','like','comment','post','news'],
 tick(kind){if(typeof state==='undefined'||!state.onboarded)return null;this.n++;kind=kind||this.KINDS[(this.n-1)%this.KINDS.length];
  const ev=this[kind]?this[kind]():null;if(!ev)return kind!=='post'?this.post():null;
  ev.at=Date.now();ev.demo=true;ev.live=true;this.items.unshift(ev);this.items=this.items.slice(0,30);
  this.banner(ev);this.refreshBell();return ev;},
 post(){const q=this.queue().filter(p=>!this.released.some(r=>r.id===p.id));const p=q[0];if(!p)return null;this.released.unshift({...p});
  const u=typeof People!=='undefined'?People.get(p.user):null,f=byId(p.perfume);
  if(route.page==='home')this.newPill();
  return {id:'live-'+p.id,kind:'post',person:u,perfume:f,html:`<b>${esc(u?u.name.split(' ')[0]:'Alguém')}</b> publicou${f?' com <b>'+esc(f.name)+'</b>':''}.`,href:'#home'};},
 comment(){const ppl=this.people(),u=this.pick(ppl,1),txt=this.pick((typeof COMMUNITY!=='undefined'&&COMMUNITY.comments)||['Que escolha!'],2);if(!u)return null;
  const mine=state.posts[0];
  if(mine){Store.update(s=>{s.comments[mine.id]=[...(s.comments[mine.id]||[]),{text:txt,at:new Date().toISOString(),by:u.id,demo:true}];},{silent:true});
   return {id:'live-c-'+this.n,kind:'comment',person:u,html:`<b>${esc(u.name.split(' ')[0])}</b> comentou na sua publicação: “${esc(txt)}”`,href:'#profile'};}
  const liked=state.likes.map(id=>Posts.find(id)).filter(Boolean),post=liked[0]||Posts.all().find(p=>p.user!=='me');if(!post)return null;
  (this.comments[post.id]=this.comments[post.id]||[]).push({text:txt,by:u.id,at:new Date().toISOString(),demo:true});
  const a=People.get(post.user);
  return {id:'live-c-'+this.n,kind:'comment',person:u,html:`<b>${esc(u.name.split(' ')[0])}</b> comentou ${liked.length?'num post que você curtiu':'no post de '+esc(a?a.name.split(' ')[0]:'alguém')}: “${esc(txt)}”`,href:'#home'};},
 follow(){const ppl=this.people().filter(u=>!state.following.includes(u.id)),u=this.pick(ppl,3);if(!u)return null;
  return {id:'live-f-'+u.id,kind:'person',person:u,html:`<b>${esc(u.name)}</b> começou a seguir você.`,href:'#person/'+encodeURIComponent(u.id)};},
 like(){const ids=Object.keys(state.ratings),id=this.pick(ids,4),p=id&&byId(id),u=this.pick(this.people(),5);if(!p||!u)return null;
  return {id:'live-l-'+this.n,kind:'likes',person:u,perfume:p,html:`<b>${esc(u.name.split(' ')[0])}</b> curtiu sua avaliação de <b>${esc(p.name)}</b>.`,href:'#perfume/'+encodeURIComponent(p.id)};},
 /* Novidade real: perfumes que entraram no catálogo do ELIXIR na atualização mais recente. */
 news(){const fresh=PERFUMES.filter(p=>p.origin==='br'&&p.image),p=this.pick(fresh,6);if(!p)return null;
  return {id:'live-n-'+p.id,kind:'perfume',perfume:p,html:`Novo no catálogo do ELIXIR: <b>${esc(p.name)}</b>, ${esc(p.brand)}.`,href:'#perfume/'+encodeURIComponent(p.id),news:true};},
 refreshBell(){for(const b of document.querySelectorAll('[data-action=activity]')){if(!b.querySelector('.dot-unread'))b.insertAdjacentHTML('beforeend','<i class="dot-unread live-ping" aria-hidden="true"></i>');}},
 newPill(){const host=document.querySelector('.v-home .feed');if(!host||host.querySelector('.feed-new'))return;
  host.insertAdjacentHTML('afterbegin','<button type="button" class="feed-new pressable" data-action="feed-new">'+icon('arrow-up-right','icon--20')+'<span>Novas publicações</span></button>');},
 banner(ev){if(Sheet.isOpen())return;let el=document.getElementById('live-banner');if(el)el.remove();
  const av=ev.person?UI.avatar(ev.person,'sm'):ev.perfume?`<span class="lb-img">${UI.photo(ev.perfume)}</span>`:'';
  document.body.insertAdjacentHTML('beforeend',`<a id="live-banner" class="live-banner glass" href="${esc(ev.href||'#home')}" data-action="live-open" role="status">${av}<span class="lb-txt"><span class="lb-msg">${ev.html}</span><small>${ev.news?'Catálogo':'Demonstração'} · agora</small></span></a>`);
  el=document.getElementById('live-banner');clearTimeout(this.bt);this.bt=setTimeout(()=>{if(el.isConnected){el.classList.add('out');setTimeout(()=>el.remove(),400);}},4800);}
};
Actions.add({
 'feed-new':el=>{el.remove();window.scrollTo({top:0,behavior:Motion.reduced()?'auto':'smooth'});App.render();},
 'live-open':el=>{const href=el.getAttribute('href')||'#home';el.remove();if(location.hash!==href)location.hash=href;}
});
