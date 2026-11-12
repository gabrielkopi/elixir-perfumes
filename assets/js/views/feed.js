'use strict';
/* Início (Hoje): cabeçalho com o contexto do dia, stories, Para hoje, Seu dia, Edições, pessoas e o feed.
   Também declara Post: o cartão de publicação usado no feed, no perfil e na página do perfume. */

/* ---------- Post: cartão de publicação ---------- */
const Post={
 /* Converte "agora", "40 min", "2 h", "1 d" (sementes) em instantes, para UI.when. */
 at(raw,fallback){
  if(raw&&raw.when&&!isNaN(Date.parse(raw.when))&&/\d{4}-\d{2}-\d{2}/.test(raw.when))return Date.parse(raw.when);
  const s=String((raw&&raw.when)||fallback||'').trim(),n=parseFloat(s)||0,now=Date.now();
  if(/^agora/.test(s))return now-90*1000;
  if(/min/.test(s))return now-n*60000;
  if(/\bh\b|hora/.test(s))return now-n*3600000;
  if(/\bd\b|dia/.test(s))return now-n*864e5-((n*7)%5)*3600000;
  return now-864e5;},
 /* Forma única de uma publicação, qualquer que seja a origem (comunidade, sementes antigas ou sua). */
 data(raw){if(!raw)return null;
  const own=raw.user==='me';let perfume=null,image='';
  if(raw.product){const x=typeof Products!=='undefined'?Products.find(raw.product):null;perfume=x&&x.catalog?byId(x.catalog)||null:null;image=raw.image||'';}
  else{perfume=raw.perfume?byId(raw.perfume)||null:null;image=raw.photo||raw.image||'';}
  let fallback='';if(!raw.when&&!own){const n=Number(String(raw.id).replace(/\D/g,''))||0;fallback=(1+Math.floor(n/3))+' d';}
  const u=own?null:(People.get(raw.user)||null),a=People.author(raw.user);
  return {id:String(raw.id),user:raw.user,own,author:own?{id:'me',name:state.profile.name,handle:state.profile.handle,href:'#profile'}:{id:raw.user,name:a.name,handle:a.handle,verified:!!a.verified,href:'#person/'+raw.user},
   avatar:own?null:(u?{name:u.name,image:u.image,initials:u.initials}:{name:a.name,initials:a.initials}),
   image,perfume,text:String(raw.text||''),occasion:String(raw.occasion||''),at:this.at(raw,fallback),
   likes:(Number(raw.likes)||0)+(state.likes.includes(String(raw.id))?1:0),liked:state.likes.includes(String(raw.id)),saved:state.saved.includes(String(raw.id)),
   comments:(state.comments[raw.id]||[]).length};},
 find(id){const raw=typeof Posts!=='undefined'?Posts.find(id):null;return raw?this.data(raw):null;},
 who(d){return esc(d.author.name.split(/\s+/)[0]);},
 media(d,{compact=false}={}){
  if(d.image)return `<img src="${esc(d.image)}" alt="Foto de ${esc(d.author.name)}${d.perfume?' usando '+esc(d.perfume.name):''}" loading="lazy" decoding="async">`;
  if(d.perfume)return UI.photo(d.perfume,{cls:'post-plate'});
  return '';},
 likeBtn(d){return `<button type="button" class="post-act heart${d.liked?' on':''} pressable" data-action="like" data-id="${esc(d.id)}" data-like="${esc(d.id)}" aria-pressed="${d.liked}">${icon(d.liked?'heart-fill':'heart')}<span class="sr-only">Curtir</span><span class="post-n" data-likes="${esc(d.id)}">${UI.count(d.likes)}</span></button>`;},
 /* variant: 'feed' (coluna editorial 4:5) | 'compact' (grades e trilhos: 1:1, legenda curta). */
 card(raw,{variant='feed'}={}){
  const d=raw&&raw.author&&raw.at?raw:this.data(raw);if(!d)return '';
  const compact=variant==='compact',meta=[d.occasion,UI.when(d.at)].filter(Boolean).map(esc).join(' · ');
  const who=d.own?`<a class="post-who pressable" href="#profile">`:`<a class="post-who pressable" href="${esc(d.author.href)}" data-action="person" data-id="${esc(d.author.id)}">`;
  const media=this.media(d);
  const tag=d.perfume?`<a class="post-tag pressable" href="#perfume/${esc(d.perfume.id)}" data-action="perfume" data-id="${esc(d.perfume.id)}"><span class="post-tag-img">${UI.photo(d.perfume)}</span><span class="post-tag-txt"><b>${esc(d.perfume.name)}</b><small>${esc(d.perfume.brand)}</small></span>${icon('chevron-right','icon--20')}</a>`:'';
  const cap=d.text?`<p class="post-cap" data-cap="${esc(d.id)}">${esc(d.text)}</p><button type="button" class="post-more-text" data-action="post-text" hidden>mais</button>`:'';
  return `<article class="post${compact?' post--compact':''}" data-post="${esc(d.id)}" aria-label="Publicação de ${esc(d.author.name)}"><div class="post-in" data-reveal>
<header class="post-head">${who}${UI.avatar(d.avatar,compact?'xs':'sm')}<span class="post-id"><span class="post-name"><b>${esc(d.author.name)}</b>${UI.badge(d.author.verified)}</span>${meta||!d.own?`<span class="post-meta">${meta}${!d.own?`${meta?' · ':''}<span class="demo-tag">Demonstração</span>`:''}</span>`:''}</span></a>${UI.iconBtn('more',{action:'post-more',bare:true,label:'Mais opções',attrs:`data-id="${esc(d.id)}"`})}</header>
${media?`<div class="post-media" data-dbl="${esc(d.id)}">${media}</div>`:''}
<div class="post-bar">${this.likeBtn(d)}<button type="button" class="post-act pressable" data-action="comment-open" data-id="${esc(d.id)}">${icon('comment')}<span class="sr-only">Comentários</span><span class="post-n" data-comments="${esc(d.id)}">${d.comments?UI.count(d.comments):''}</span></button><span class="post-sp"></span><button type="button" class="post-act post-save pressable" data-action="save-post" data-id="${esc(d.id)}" data-save="${esc(d.id)}" aria-pressed="${d.saved}" aria-label="Salvar">${icon(d.saved?'bookmark-fill':'bookmark')}</button></div>
${cap}${compact?'':tag}</div></article>`;},
 /* Grade 3 colunas, quadrada. Lista vazia → '' (quem chama desenha o vazio). */
 grid(posts){const list=(posts||[]).map(r=>r&&r.author&&r.at?r:this.data(r)).filter(Boolean);if(!list.length)return '';
  return `<div class="post-grid">${list.map((d,i)=>`<button type="button" class="post-cell pressable" data-action="post-open" data-id="${esc(d.id)}" style="--i:${Math.min(i,8)}" aria-label="Publicação de ${esc(d.author.name)}${d.perfume?' com '+esc(d.perfume.name):''}">${d.image?`<img src="${esc(d.image)}" alt="" loading="lazy" decoding="async">`:d.perfume?UI.photo(d.perfume):''}</button>`).join('')}</div>`;},
 /* Atualiza no lugar todos os cartões/stories de uma publicação. */
 patch(id){const d=this.find(id);if(!d)return;
  for(const b of document.querySelectorAll(`[data-like="${CSS.escape(id)}"]`)){b.classList.toggle('on',d.liked);b.setAttribute('aria-pressed',d.liked);const ic=b.querySelector('svg');if(ic)ic.outerHTML=icon(d.liked?'heart-fill':'heart');const n=b.querySelector('[data-likes]');if(n)n.textContent=UI.count(d.likes);}
  for(const b of document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`)){b.setAttribute('aria-pressed',d.saved);const ic=b.querySelector('svg');if(ic)ic.outerHTML=icon(d.saved?'bookmark-fill':'bookmark');}
  for(const n of document.querySelectorAll(`[data-comments="${CSS.escape(id)}"]`))n.textContent=d.comments?UI.count(d.comments):'';},
 like(id,{on=null,x=null,y=null}={}){const has=state.likes.includes(id),next=on===null?!has:on;
  if(next!==has)Store.update(s=>{s.likes=next?[...new Set([...s.likes,id])]:s.likes.filter(v=>v!==id);},{silent:true});
  this.patch(id);if(next)for(const b of document.querySelectorAll(`[data-like="${CSS.escape(id)}"]`))Motion.pop(b.querySelector('svg'));},
 /* Legendas: o "mais" só aparece quando o texto foi de fato cortado em 3 linhas. */
 measure(root=document){for(const p of root.querySelectorAll('.post-cap:not([data-measured])')){if(!p.isConnected||!p.clientHeight)continue;p.dataset.measured='1';const b=p.nextElementSibling;if(b&&b.classList.contains('post-more-text'))b.hidden=p.scrollHeight<=p.clientHeight+2;}},
 queued:false,
 schedule(){if(this.queued)return;this.queued=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{this.queued=false;this.measure();}));},
 /* Folha "Mais opções" da publicação. */
 more(id){const d=this.find(id);if(!d)return;
  const row=(ic,title,attrs)=>`<button type="button" class="link-row pressable" ${attrs}><span class="ico">${icon(ic,'icon--20')}</span><span class="grow"><b>${esc(title)}</b></span></button>`;
  const rows=[row('share','Compartilhar',`data-action="share-post" data-id="${esc(id)}"`)];
  if(d.perfume)rows.push(`<a class="link-row pressable" href="#perfume/${esc(d.perfume.id)}"><span class="ico">${icon('drop','icon--20')}</span><span class="grow"><b>Ver ${esc(d.perfume.name)}</b><span>${esc(d.perfume.brand)}</span></span>${icon('chevron-right','icon--20')}</a>`);
  if(!d.own)rows.push(`<a class="link-row pressable" href="${esc(d.author.href)}"><span class="ico">${icon('user','icon--20')}</span><span class="grow"><b>Ver perfil de ${this.who(d)}</b><span>@${esc(d.author.handle)}</span></span>${icon('chevron-right','icon--20')}</a>`);
  if(d.own)rows.push(row('trash','Apagar publicação',`data-action="post-delete" data-id="${esc(id)}"`));
  Sheet.open({title:'Publicação',body:`<div class="post-sheet list-hair">${rows.join('')}</div>`,cls:'post-sheet-body'});},
 open(id){const d=this.find(id);if(!d)return;Sheet.open({title:d.author.name,body:`<div class="post-sheet post-sheet--card">${this.card(d)}</div>`,cls:'post-sheet-body'});this.schedule();},
 async remove(id){const raw=state.posts.find(p=>p.id===id);if(!raw)return;
  const ok=await Sheet.confirm({title:'Apagar esta publicação?',text:'A foto e a legenda saem do seu perfil. O registro do dia continua no Diário.',ok:'Apagar',danger:true});if(!ok)return;
  const prev=JSON.parse(JSON.stringify({posts:state.posts,sotd:state.sotd}));
  if(Sheet.isOpen())await Sheet.close({force:true});
  Store.update(s=>{s.posts=s.posts.filter(p=>p.id!==id);s.sotd=s.sotd.map(x=>x.postId===id?{...x,postId:''}:x);});
  toast('Publicação apagada',{undo:()=>Store.update(s=>{s.posts=prev.posts;s.sotd=prev.sotd;})});}
};

/* Duplo toque na foto curte (o botão de coração é o equivalente acessível). */
(()=>{let last={t:0,id:'',x:0,y:0};
 const hit=(el,x,y)=>{const id=el.dataset.dbl;Post.like(id,{on:true});Motion.burst(el,x,y);};
 document.addEventListener('dblclick',e=>{const el=e.target.closest&&e.target.closest('[data-dbl]');if(!el)return;e.preventDefault();hit(el,e.clientX,e.clientY);});
 document.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')return;const el=e.target.closest&&e.target.closest('[data-dbl]');if(!el)return;const now=performance.now(),id=el.dataset.dbl;
  if(last.id===id&&now-last.t<320&&Math.hypot(e.clientX-last.x,e.clientY-last.y)<36){last={t:0,id:'',x:0,y:0};hit(el,e.clientX,e.clientY);}else last={t:now,id,x:e.clientX,y:e.clientY};});
})();

/* ---------- Feed: a tela Início ---------- */
const Feed={
 tab:'foryou',
 desk(){try{return matchMedia('(min-width:1024px)').matches;}catch(e){return false;}},
 /* Publicações: as suas primeiro (mais novas), depois a comunidade na ordem editorial. */
 posts(tab=this.tab){const all=typeof Posts!=='undefined'?Posts.all():[],mine=all.filter(p=>p.user==='me').sort((a,b)=>Date.parse(b.when)-Date.parse(a.when)),rest=all.filter(p=>p.user!=='me');
  if(tab==='following')return rest.filter(p=>state.following.includes(p.user));
  return [...mine,...rest];},
 /* Contexto do dia: Today (intel) quando existe; senão, o contexto salvo. */
 chipLabel(){try{if(typeof Today!=='undefined'&&Today.chipLabel){const t=Today.chipLabel();if(t)return String(t);}}catch(e){console.warn(e);}
  const c=state.context||{};const per={manha:'Manhã',tarde:'Tarde',noite:'Noite'}[c.period]||(c.time||'Dia');return `${Math.round(Number(c.temp)||24)}° · ${per} · ${c.city||'São Paulo'}`;},
 chip(){const label=this.chipLabel(),night=(state.context&&state.context.period)==='noite';
  return `<button type="button" class="chip pressable home-ctx" data-action="context" aria-label="Contexto do dia: ${esc(label)}. Alterar">${icon(night?'moon':'sun','icon--20')}<span>${esc(label)}</span>${icon('chevron-down','icon--20')}</button>`;},
 /* Para hoje: Today.pick() com Select.perfumeOfDay() como reserva. */
 pick(){let pk=null;try{if(typeof Today!=='undefined'&&Today.pick)pk=Today.pick();}catch(e){console.warn(e);}
  if(pk&&pk.p){let ex=pk.explain||null;if(!ex)try{ex=Select.explain(pk.p.id,{source:'today'});}catch(e){}
   const line=pk.reasons&&pk.reasons[0]?pk.reasons[0]:ex&&ex.line;return {p:pk.p,from:pk.fromCollection!==undefined?!!pk.fromCollection:Select.shelf(pk.p.id)==='have',why:ex?{...ex,line}:line?{line}:null};}
  const p=Select.perfumeOfDay();if(!p)return null;let ex=null;try{ex=Select.explain(p.id,{source:'today'});}catch(e){}
  if(!ex){const r=Select.rec(p.id);ex=r?{line:r.reason,chance:r.score}:null;}
  return {p,from:Select.shelf(p.id)==='have',why:ex};},
 today(){const pk=this.pick();if(!pk)return '';const p=pk.p,done=!!Select.sotdToday();
  const acts=done?UI.btn('Ver',{href:'#perfume/'+p.id,action:'perfume',variant:'secondary',size:'sm',attrs:`data-id="${esc(p.id)}"`})
   :UI.btn('Usar hoje',{action:'sotd-use',size:'sm',attrs:`data-id="${esc(p.id)}"`})+UI.btn('Ver',{href:'#perfume/'+p.id,action:'perfume',variant:'tertiary',attrs:`data-id="${esc(p.id)}"`});
  return `<section class="today" aria-labelledby="today-name"><div class="today-card"><a class="today-plate" href="#perfume/${esc(p.id)}" data-action="perfume" data-id="${esc(p.id)}" tabindex="-1" aria-hidden="true">${UI.photo(p,{eager:true})}</a>
<div class="glass-card today-glass"><p class="t-eyebrow muted">Para hoje · ${pk.from?'Da sua coleção':'Fora da sua coleção'}</p><div class="today-title"><p class="today-brand">${esc(p.brand)}</p><h2 class="t-h2" id="today-name">${esc(p.name)}</h2></div>${pk.why?UI.why(pk.why,{compact:true}):''}<div class="today-acts">${acts}</div></div></div>
${UI.btn('Mais opções para hoje',{href:'#today',variant:'tertiary',icon:'arrow-up-right'})}</section>`;},
 /* Seu dia: o registro de hoje, com Trocar e Desfazer. */
 day(){const s=Select.sotdToday();if(!s)return '';const p=byId(s.id);if(!p)return '';
  const trail=UI.btn('Trocar',{action:'sotd-swap',variant:'tertiary'})+UI.iconBtn('close',{action:'sotd-undo',bare:true,label:'Desfazer registro de hoje'});
  return UI.section({eyebrow:'Seu dia',body:`<div class="day">${UI.row(p,{trail,sub:esc(['Usando hoje',s.occasion].filter(Boolean).join(' · '))})}</div>`,cls:'home-day'});},
 eds(){const E=typeof Editions!=='undefined'&&Editions.current?Editions:(typeof EDITIONS!=='undefined'&&EDITIONS.current?EDITIONS:null);if(!E)return '';
  let list=[];try{list=(E.current()||[]).filter(e=>e&&(!(typeof Editions!=='undefined'&&Editions.items)||(Editions.items(e.id)||[]).length>=6)).slice(0,6);}catch(e){console.warn(e);}
  if(!list.length)return '';
  const tile=e=>{const s=UI.coverSrc(e.cover);return `<a class="cover ed pressable" href="#edit/${esc(e.id)}"><img class="bw" src="${esc(s.src)}"${s.srcset?` srcset="${esc(s.srcset)}" sizes="(min-width:1024px) 200px, 44vw"`:''} alt="" loading="lazy" decoding="async"><span class="scrim"></span><span class="caption"><span class="t-eyebrow">Edição</span><b>${esc(e.title)}</b></span></a>`;};
  const desk=this.desk();
  return UI.section({title:'Edições',more:{label:'Ver todas',href:'#edits'},rail:desk?'':'home-eds',cls:'home-eds',body:desk?`<div class="ed-grid">${list.slice(0,4).map(tile).join('')}</div>`:UI.rail(list.map(tile),{name:'home-eds',label:'Edições'})});},
 people(){if(state.following.length>=3||typeof People==='undefined')return '';const list=People.suggestions(12).map((u,i)=>[u.image?0:1,i,u]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(x=>x[2]).slice(0,6);if(!list.length)return '';
  const desk=this.desk(),cards=list.map((u,i)=>UI.personCard(u,{i}));
  return UI.section({eyebrow:'Pessoas',title:'Com o seu nariz',rail:desk?'':'home-people',cls:'home-people',body:desk?`<div class="people-grid">${cards.slice(0,6).join('')}</div>`:UI.rail(cards,{name:'home-people',label:'Pessoas com gosto parecido',rows:2})});},
 /* Painel do feed (Para você · Seguindo). */
 panel(){const list=this.posts();
  if(this.tab==='following'){
   if(!state.following.length){const rows=(typeof People!=='undefined'?People.suggestions(3):[]).map(u=>UI.personRow(u,{affinity:true})).join('');
    return `${UI.empty({icon:'people',title:'Siga pessoas com gosto parecido',text:'O que elas usam e publicam aparece aqui.'})}<div class="follow list-hair">${rows}</div>`;}
   if(!list.length)return UI.empty({icon:'people',title:'Nada novo de quem você segue',text:'Enquanto isso, veja o que a comunidade está usando.',cta:{label:'Ver Para você',action:'feed-seg',variant:'tertiary',attrs:'data-id="foryou"'}});}
  if(!list.length)return UI.empty({icon:'drop',title:'Nada por aqui ainda',text:'As publicações da comunidade aparecem aqui.'});
  Post.schedule();
  return `<div class="posts">${list.map(r=>Post.card(r)).join('')}</div><p class="feed-end">${icon('check','icon--20')}<span>Você está em dia</span></p>`;},
 feed(){return `<section class="feed" aria-label="Publicações">${UI.seg([{id:'foryou',label:'Para você'},{id:'following',label:'Seguindo'}],this.tab,'feed-seg',{variant:'ink',name:'feed',label:'Publicações'})}<div id="panel-feed" role="tabpanel" aria-labelledby="tab-feed-${this.tab}" data-swap="feed">${this.panel()}</div></section>`;},
 view(){
  const wx=this.weather(),head=UI.pageHead({eyebrow:UI.date(new Date(),'eyebrow'),title:'Hoje',actions:wx?'':this.chip()});
  const stories=typeof Stories!=='undefined'&&Stories.rail?Stories.rail():'';
  const today=this.today(),day=this.day(),eds=this.eds(),people=this.people(),feed=this.feed();
  if(this.desk())return `<section class="v-home" data-view="home">${head}<div class="layout-split"><div class="main">${wx}${stories}${day}${feed}</div><aside class="aside" aria-label="Para hoje e sugestões">${today}${people}${eds}</aside></div></section>`;
  return `<section class="v-home" data-view="home">${head}<div class="main">${wx}${stories}${today}${day}${eds}${people}${feed}</div></section>`;},
 /* Clima de agora (Open-Meteo, São Paulo por padrão) com a arte animada; toque abre o Contexto do dia. */
 weather(){if(typeof Weather==='undefined')return '';let r=null;try{r=Weather.cached();}catch(e){}if(!r)return '';
  const L=state.location||{},place=L.name||'São Paulo',n=v=>Number.isFinite(v)?Math.round(v)+'°':'—';
  const meta=[Number.isFinite(r.max)&&Number.isFinite(r.min)?`Máx ${n(r.max)} · Mín ${n(r.min)}`:'',Number.isFinite(r.rain)?`Chuva ${Math.round(r.rain)}%`:''].filter(Boolean);
  return `<button type="button" class="wx-card pressable" data-action="context" aria-label="Clima em ${esc(place)}: ${Math.round(r.temp)} graus, ${esc(r.label)}. Ajustar o dia">
   ${Weather.art(r.code,r.isDay)}<span class="wx-main"><b class="wx-temp">${Math.round(r.temp)}°</b><span class="wx-label">${esc(r.label)}</span></span>
   <span class="wx-side"><span class="wx-place">${esc(place)}</span>${meta.map(m=>`<span class="wx-meta">${esc(m)}</span>`).join('')}<span class="wx-src">Open-Meteo</span></span></button>`;},
 /* Barra lateral fixa que rola até o fim antes de grudar (desktop). */
 stick(){const a=document.querySelector('.v-home .aside');if(!a)return;if(!this.desk()){a.style.top='';return;}
  const tb=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h'))||64,gap=24;
  a.style.top=Math.min(tb+gap,innerHeight-a.offsetHeight-gap)+'px';},
 after(){Post.measure();this.stick();try{if(typeof Weather!=='undefined')Weather.get({render:false}).then(r=>{if(r&&route.page==='home'&&!document.querySelector('.v-home .wx-card'))App.render();}).catch(()=>{});}catch(e){}}
};

Router.add('home',{view:()=>Feed.view(),title:'Início',layout:'tab',nav:'home',after:()=>Feed.after()});

/* Muda de layout ao cruzar 1024px (cada bloco é desenhado uma vez só). */
try{matchMedia('(min-width:1024px)').addEventListener('change',()=>{if(route.page==='home'&&typeof App!=='undefined')App.render();});}catch(e){}
addEventListener('resize',()=>{if(route.page==='home')Feed.stick();},{passive:true});

Actions.add({
 'feed-seg':el=>{const id=el.dataset.id==='following'?'following':'foryou';if(Feed.tab===id&&el.closest('.seg'))return;const prev=Feed.tab;Feed.tab=id;
  const seg=document.querySelector('[data-seg="feed"]');if(seg)UI.segSet(seg,id);
  const panel=document.getElementById('panel-feed');if(!panel)return;panel.setAttribute('aria-labelledby','tab-feed-'+id);
  Motion.swap(panel,Feed.panel(),{dir:id==='following'?1:-1}).then(()=>Post.measure(panel));
  if(!el.closest('.seg')&&seg){const t=seg.querySelector(`[data-id="${id}"]`);if(t)t.focus({preventScroll:true});}
  if(prev!==id){const top=panel.closest('.feed');if(top&&top.getBoundingClientRect().top<0)top.scrollIntoView({block:'start',behavior:Motion.reduced()?'auto':'smooth'});}},
 like:(el,e)=>{const id=el.dataset.id;if(id)Post.like(id);},
 'save-post':el=>{const id=el.dataset.id;if(!id)return;const on=!state.saved.includes(id);
  const apply=v=>{Store.update(s=>{s.saved=v?[...new Set([id,...s.saved])]:s.saved.filter(x=>x!==id);},{silent:true});Post.patch(id);};
  apply(on);toast(on?'Salvo na sua Coleção':'Removido dos salvos',{undo:()=>apply(!on)});},
 'comment-open':el=>{if(el.dataset.id&&typeof Compose!=='undefined')Compose.comments(el.dataset.id);},
 'share-post':el=>{if(el.dataset.id&&typeof Compose!=='undefined')Compose.share('post',el.dataset.id);},
 'post-more':el=>Post.more(el.dataset.id),
 'post-open':el=>Post.open(el.dataset.id),
 'post-delete':el=>Post.remove(el.dataset.id),
 'post-text':el=>{const p=el.previousElementSibling;if(p&&p.classList.contains('post-cap')){p.classList.add('open');el.hidden=true;}},
 'sotd-use':el=>{if(typeof Compose==='undefined')return;let ctx=null;try{if(typeof Today!=='undefined'&&Today.ctx)ctx=Today.ctx();}catch(e){}Compose.sotd(el.dataset.id,{ctx});},
 'sotd-swap':()=>{if(typeof Compose!=='undefined')Compose.sotd();},
 'sotd-undo':async()=>{const s=Select.sotdToday();if(!s)return;
  const ok=await Sheet.confirm({title:'Desfazer o registro de hoje?',text:'O perfume sai do Diário de hoje, e a publicação ligada a ele também.',ok:'Desfazer',danger:true});if(!ok)return;
  const prev=JSON.parse(JSON.stringify({posts:state.posts,sotd:state.sotd}));
  Store.update(st=>{st.sotd=st.sotd.filter(x=>x.date!==s.date);if(s.postId)st.posts=st.posts.filter(p=>p.id!==s.postId);});
  toast('Registro desfeito',{undo:()=>Store.update(st=>{st.posts=prev.posts;st.sotd=prev.sotd;})});}
});

/* Quem segue alguém a partir do vazio de Seguindo vê as publicações chegarem, sem recarregar. */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#panel-feed [data-action="follow"]');if(!b)return;
 setTimeout(()=>{if(route.page!=='home'||Feed.tab!=='following'||!state.following.length)return;const panel=document.getElementById('panel-feed');if(panel&&panel.querySelector('.follow'))Motion.swap(panel,Feed.panel(),{dir:1}).then(()=>Post.measure(panel));},900);});
