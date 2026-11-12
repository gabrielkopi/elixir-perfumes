'use strict';
/* Coleção (§5 Coleção, REQ §9): Tenho · Quero · Testei · Diário, estatísticas, redundâncias e complementos,
   listas próprias e automáticas (Favoritos, Não gostei), publicações salvas. Lists: salvar em lista, nova lista e o seletor de perfume. */
const Collection={
 SEGS:[{id:'have',label:'Tenho'},{id:'want',label:'Quero'},{id:'tried',label:'Testei'},{id:'diary',label:'Diário'}],
 seg:'have',editing:false,sort:'recent',month:'',
 SORTS:[{id:'recent',label:'Recentes'},{id:'brand',label:'Marca'},{id:'family',label:'Família'},{id:'used',label:'Mais usados'}],
 WEEK:[['D','domingo'],['S','segunda-feira'],['T','terça-feira'],['Q','quarta-feira'],['Q','quinta-feira'],['S','sexta-feira'],['S','sábado']],

 /* ---------- dados ---------- */
 ids(status){return Select.shelfIds(status).filter(id=>byId(id));},
 uses(id){return state.sotd.filter(x=>x.id===id).length;},
 famOf(p){return typeof Catalog!=='undefined'&&Catalog.familyOf?Catalog.familyOf(p):null;},
 label(status){const s=SHELF.find(x=>x.id===status);return s?s.label:'';},
 monthKey(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');},
 monthDate(key){const [y,m]=key.split('-').map(Number);return new Date(y,m-1,1);},
 minMonth(){const keys=[this.monthKey(UI.toDate(state.createdAt)),...state.sotd.map(x=>x.date.slice(0,7))].sort();const min=keys[0]||this.monthKey();
  const floor=new Date();floor.setMonth(floor.getMonth()-24);const f=this.monthKey(floor);return min<f?f:min;},

 /* ---------- topo e segmentos ---------- */
 segItems(){return this.SEGS.map(s=>{const n=s.id==='diary'?state.sotd.length:this.ids(s.id).length;return {id:s.id,label:s.label,html:`${esc(s.label)}${n?` <small>${esc(UI.count(n))}</small>`:''}`};});},
 view(id){const seg=this.SEGS.some(s=>s.id===id)?id:'have';if(seg!==this.seg)this.editing=false;this.seg=seg;
  return `<section class="v-collection" data-view="collection">${UI.pageHead({title:'Coleção'})}
${UI.seg(this.segItems(),seg,'collection-seg',{name:'collection',label:'Partes da coleção',block:true})}
<div class="cl-panel" id="panel-collection" role="tabpanel" aria-labelledby="tab-collection-${esc(seg)}" data-swap="collection">${this.panel(seg)}</div>
${this.listsSection()}${this.savedSection()}</section>`;},
 panel(seg){
  if(seg==='diary')return this.diary();
  const ids=this.ids(seg);
  if(!ids.length)return this.emptySeg(seg);
  const hint=seg==='tried'?`<p class="cl-hint muted">O que você já teve ou experimentou. Avaliar ajuda o seu mapa.</p>`:seg==='want'?`<p class="cl-hint muted">Seus próximos perfumes. Teste antes de comprar quando puder.</p>`:'';
  return `${seg==='have'&&ids.length>=3?this.stats(ids):''}${hint}${this.tools(ids)}${this.grid(ids,seg)}`;},
 emptySeg(seg){
  if(seg==='have')return UI.empty({icon:'bookmark',title:'Adicione o que está na sua penteadeira',text:'Os frascos que você tem viram estatísticas, sugestões e o seu perfume do dia.',cta:{label:'Buscar perfume',action:'collection-add',attrs:'data-id="have"'}});
  if(seg==='want')return UI.empty({icon:'sparkle',title:'Descubra o próximo',text:'O Guia sugere perfumes a partir do seu gosto, com o motivo de cada um.',cta:{label:'Abrir o Guia',href:'#guide'}});
  return UI.empty({icon:'star',title:'Avalie o que já passou pela sua pele',text:'Perfumes que você teve ou experimentou ensinam o seu mapa.',cta:{label:'Descobrir',href:'#explore'}});},
 tools(ids){const cur=this.SORTS.find(s=>s.id===this.sort)||this.SORTS[0];
  const sort=ids.length>=4?`<button type="button" class="btn btn--tertiary pressable cl-sort" data-action="collection-sort-open" aria-haspopup="dialog"><span>Ordenar: ${esc(cur.label)}</span>${icon('chevron-down')}</button>`:'<span></span>';
  return `<div class="cl-tools">${sort}<button type="button" class="btn btn--tertiary pressable cl-edit" data-action="collection-edit" aria-pressed="${this.editing}">${this.editing?'Concluir':'Editar'}</button></div>`;},
 /* Grade com ordenação e grupos (marca, família) e, no modo Editar, um botão "mais" de 44px por perfume. */
 grid(ids,seg){let list=ids.map(byId).filter(Boolean),groups=null;
  if(this.sort==='brand'){list.sort((a,b)=>a.brand.localeCompare(b.brand,'pt')||a.name.localeCompare(b.name,'pt'));groups=p=>p.brand;}
  else if(this.sort==='family'){const f=p=>{const x=this.famOf(p);return x?x.name:'Outras';};list.sort((a,b)=>f(a).localeCompare(f(b),'pt')||a.name.localeCompare(b.name,'pt'));groups=f;}
  else if(this.sort==='used')list.sort((a,b)=>this.uses(b.id)-this.uses(a.id)||a.name.localeCompare(b.name,'pt'));
  let last=null,i=0;const out=[];
  for(const p of list){
   if(groups){const g=groups(p);if(g!==last){const n=list.filter(x=>groups(x)===g).length;out.push(`<p class="cl-group span-all t-eyebrow muted">${esc(g)} · ${esc(String(n))}</p>`);last=g;}}
   const r=state.ratings[p.id],u=this.uses(p.id);
   const sub=this.sort==='used'?(u?`Usado ${UI.plural(u,'vez','vezes')}`:'Ainda não usado'):seg==='tried'?(r!==undefined?UI.ratingLabel(r):'Sem avaliação'):'';
   out.push(`<div class="cl-item" style="--i:${i}" data-item="${esc(p.id)}">${UI.tile(p,{i,sub:sub?esc(sub):''})}${this.editing?UI.iconBtn('more',{action:'collection-item',label:`Opções de ${p.name}`,cls:'cl-more icon-btn--on-image',attrs:`data-id="${esc(p.id)}"`}):''}</div>`);i++;}
  return `<div class="grid-z cl-grid stagger${this.editing?' is-editing':''}">${out.join('')}</div>`;},

 /* ---------- Sua coleção: números, famílias, redundância e complemento ---------- */
 stats(ids){const ps=ids.map(byId).filter(Boolean),n=ps.length;
  const fam=new Map();for(const p of ps){const f=this.famOf(p);if(!f)continue;fam.set(f.id,{f,c:(fam.get(f.id)||{c:0}).c+1});}
  const bars=[...fam.values()].sort((a,b)=>b.c-a.c||a.f.name.localeCompare(b.f.name,'pt')).slice(0,4).map(x=>({label:x.f.name,value:Math.round(x.c/n*100),text:UI.plural(x.c,'frasco','frascos')}));
  let pair=null;for(let a=0;a<ps.length;a++)for(let b=a+1;b<ps.length;b++){const c=Engine.cosine(ps[a].vector,ps[b].vector);if(c>=.92&&(!pair||c>pair.c))pair={a:ps[a],b:ps[b],c};}
  const red=pair?`<div class="cl-insight"><p class="t-eyebrow muted">Parecido com</p><p class="em">Parecidos entre si: <b>${esc(pair.a.name)}</b> e <b>${esc(pair.b.name)}</b> · ${Math.round(pair.c*100)}%</p></div>`:'';
  let comp='';try{const have=new Set(ps.map(p=>(this.famOf(p)||{}).id));
   const hit=Select.ranked().find(({p})=>{const f=this.famOf(p);return f&&!have.has(f.id)&&!state.shelf[p.id]&&state.ratings[p.id]===undefined;});
   if(hit){const p=hit.p,f=this.famOf(p),dim=DIMENSIONS[f.d]||f.name;let season='';
    if(typeof Advisor!=='undefined'&&Advisor.season){try{const s=Advisor.season(p).label;season=s==='Calor'?' para o calor':s==='Frio'?' para o frio':s==='Meia-estação'?' para a meia-estação':'';}catch(e){}}
    const why=typeof Select.explain==='function'?Select.explain(p.id):null;
    comp=`<div class="cl-insight"><p class="t-eyebrow muted">Para completar</p>${UI.row(p,{sub:esc(`Falta na sua coleção: um perfume ${dim.toLowerCase()}${season}`)})}${why?UI.why(why,{compact:true}):''}</div>`;}}catch(e){console.warn(e);}
  return `<article class="data-card cl-stats"><div class="cl-stats-main"><p class="t-eyebrow muted">Sua coleção</p><div class="cl-count">${UI.num(n,'',{w:2})}<span>${n===1?'frasco':'frascos'}</span></div>${UI.bars(bars,4)}</div>${red||comp?`<div class="cl-stats-side">${red}${comp}</div>`:''}</article>`;},

 /* ---------- Diário: calendário do mês + "Seu mês" ---------- */
 diary(){if(!state.sotd.length)return UI.empty({icon:'calendar',title:'Registre o que você usa',text:'Cada registro vira um dia no calendário e ensina o que funciona em cada ocasião.',cta:{label:'Usando hoje',action:'sotd'}});
  if(!this.month)this.month=this.monthKey();
  return `<div class="cl-diary" id="cl-diary">${this.monthHtml(this.month)}</div>`;},
 monthHtml(key){const first=this.monthDate(key),y=first.getFullYear(),m=first.getMonth(),days=new Date(y,m+1,0).getDate(),lead=first.getDay();
  const today=Select.todayKey(),cur=this.monthKey(),min=this.minMonth(),byDate=new Map(state.sotd.map(x=>[x.date,x]));
  const label=UI.date(first,'month-year'),z=n=>String(n).padStart(2,'0');
  const cells=[];for(let i=0;i<lead;i++)cells.push('<span role="gridcell" class="cl-day is-blank"></span>');
  for(let d=1;d<=days;d++){const k=`${y}-${z(m+1)}-${z(d)}`,e=byDate.get(k),p=e&&byId(e.id),t=k===today?' is-today':'',full=UI.date(k,'long').replace(/ de \d{4}$/,'');
   if(e&&p)cells.push(`<span role="gridcell" class="cl-day${t}"><button type="button" class="cl-day-btn pressable" data-action="collection-day" data-id="${k}" aria-label="${esc(full+', '+p.name)}"${t?' aria-current="date"':''}><span class="cl-thumb">${UI.photo(p)}</span><span class="cl-dot" aria-hidden="true"></span><span class="cl-n" aria-hidden="true">${d}</span></button></span>`);
   else cells.push(`<span role="gridcell" class="cl-day${t}"${t?' aria-current="date"':''}><span class="cl-n">${d}</span></span>`);}
  while(cells.length%7)cells.push('<span role="gridcell" class="cl-day is-blank"></span>');
  const rows=[];for(let i=0;i<cells.length;i+=7)rows.push(`<div role="row" class="cl-week">${cells.slice(i,i+7).join('')}</div>`);
  const nav=`<div class="cl-cal-nav">${UI.iconBtn('chevron-left',{action:'collection-month',label:'Mês anterior',attrs:`data-id="-1"${key<=min?' disabled':''}`})}${UI.iconBtn('chevron-right',{action:'collection-month',label:'Próximo mês',attrs:`data-id="1"${key>=cur?' disabled':''}`})}</div>`;
  return `<div class="cl-cal-wrap"><div class="cl-cal-head"><h2 class="t-h2 cl-month">${esc(label)}</h2>${nav}</div>
<div class="cl-cal" role="grid" aria-label="${esc('Diário de '+label)}"><div role="row" class="cl-week cl-wd">${this.WEEK.map(([s,f])=>`<span role="columnheader" class="cl-wd-h"><abbr title="${esc(f)}">${s}</abbr></span>`).join('')}</div>${rows.join('')}</div></div>${this.monthCard(key,label)}`;},
 sortSheet(){Sheet.open({title:'Ordenar',cls:'sh-lists',body:`<div class="ls-menu list-hair" role="group" aria-label="Ordenar">${this.SORTS.map(s=>`<button type="button" class="ls-row ls-toggle pressable" aria-pressed="${this.sort===s.id}" data-action="collection-sort" data-id="${s.id}"><span class="grow"><b>${esc(s.label)}</b></span><span class="ls-check" aria-hidden="true">${icon('check')}</span></button>`).join('')}</div>`});},
 monthCard(key,label){const list=state.sotd.filter(x=>x.date.startsWith(key)&&byId(x.id)).sort((a,b)=>a.date.localeCompare(b.date));
  if(!list.length)return `<p class="cl-month-empty muted">${esc('Nenhum registro em '+label.replace(/ \d{4}$/,''))}.</p>`;
  const count=new Map();for(const x of list)count.set(x.id,(count.get(x.id)||0)+1);
  const top=[...count.entries()].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1))[0],tp=byId(top[0]);
  const aff=list.map(x=>{try{return Math.round(Select.rec(x.id).score);}catch(e){return null;}}).filter(v=>Number.isFinite(v));
  const fam=new Map();for(const x of list){const f=this.famOf(byId(x.id));if(f)fam.set(f.name,(fam.get(f.name)||0)+1);}
  const bars=[...fam.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([l,c])=>({label:l,value:Math.round(c/list.length*100),text:UI.plural(c,'dia','dias')}));
  return `<article class="data-card cl-month-card"><div class="cl-stats-main"><p class="t-eyebrow muted">Seu mês</p><div class="cl-count">${UI.num(list.length,'',{w:2})}<span>${list.length===1?'dia registrado':'dias registrados'}</span></div>
${aff.length>=2?UI.spark(aff,{label:'Afinidade dos perfumes usados ao longo do mês'}):''}</div>
<div class="cl-stats-side"><div class="cl-insight"><p class="t-eyebrow muted">Mais usado</p>${UI.row(tp,{sub:esc(`${tp.brand} · ${UI.plural(top[1],'dia','dias')}`)})}</div>${UI.bars(bars,4)}</div></article>`;},
 dayOpen(date){const e=state.sotd.find(x=>x.date===date),p=e&&byId(e.id);if(!p)return;
  const post=state.posts.find(x=>x.id===e.postId);
  let body='';
  if(post&&typeof Post!=='undefined'&&Post.card){try{body=Post.card(post,{variant:'compact'})||'';}catch(err){body='';}}
  if(!body){const occ=e.occasion||(e.ctx&&e.ctx.occasion)||'';
   body=`<div class="cl-day-sheet">${post&&post.photo?`<img class="cl-day-photo" src="${esc(post.photo)}" alt="" loading="eager">`:`<div class="cl-day-plate">${UI.photo(p,{eager:true})}</div>`}
<p class="t-eyebrow muted">${esc(UI.date(date,'eyebrow'))}${occ?' · '+esc(occ):''}</p><h3 class="t-h2">${esc(p.name)}</h3><p class="muted">${esc(p.brand)}</p>${post&&post.text?`<p class="cl-day-text">${esc(post.text)}</p>`:''}
${UI.btn('Ver perfume',{variant:'secondary',size:'block',href:'#perfume/'+encodeURIComponent(p.id)})}</div>`;}
  Sheet.open({title:UI.date(date,'long'),body,cls:'sh-lists'});},

 /* ---------- listas e salvos ---------- */
 AUTO:{'Favoritos':{test:r=>r>=7,sub:'Perfumes que você avaliou como Amo ou Elixir.',empty:'Ainda não há favoritos'},'Não gostei':{test:r=>r<=3,sub:'Perfumes que você avaliou como Não é pra mim. Eles mostram ao mapa o que evitar.',empty:'Nada por aqui'}},
 auto(name){const a=this.AUTO[name];if(!a||state.lists[name])return null;
  return Object.keys(state.ratings).filter(id=>byId(id)&&a.test(state.ratings[id])).sort((x,y)=>state.ratings[y]-state.ratings[x]||(state.ratedAt[y]||0)-(state.ratedAt[x]||0));},
 stack(ids){const ps=ids.slice(0,3).map(byId).filter(Boolean);return `<span class="cl-stack" aria-hidden="true" data-n="${ps.length}">${ps.length?ps.map(p=>UI.photo(p)).join(''):'<span class="plate"></span>'}</span>`;},
 listCard(name,ids,{auto=false,i=0}={}){return `<a class="cl-list pressable" href="${esc(Router.href('list',name))}" style="--i:${i}">${this.stack(ids)}<span class="cl-list-name">${esc(name)}</span><span class="cl-list-count">${esc(UI.plural(ids.length,'perfume','perfumes'))}${auto?' · automática':''}</span></a>`;},
 listsSection(){const cards=[];let i=0;
  for(const name of Object.keys(this.AUTO)){const ids=this.auto(name);if(ids&&ids.length)cards.push(this.listCard(name,ids,{auto:true,i:i++}));}
  for(const [name,ids] of Object.entries(state.lists))cards.push(this.listCard(name,ids,{i:i++}));
  cards.push(`<button type="button" class="cl-list cl-list--new pressable" data-action="list-new" style="--i:${i}"><span class="cl-stack cl-stack--new" aria-hidden="true">${icon('plus')}</span><span class="cl-list-name">Nova lista</span><span class="cl-list-count">Agrupe como quiser</span></button>`);
  return UI.section({eyebrow:'Organize',title:'Listas',cls:'cl-lists',body:`<div class="cl-lists-grid">${cards.join('')}</div>`});},
 savedSection(){const posts=typeof Posts!=='undefined'&&Posts.find?state.saved.map(id=>{try{return Posts.find(id);}catch(e){return null;}}).filter(Boolean):[];if(!posts.length)return '';
  let body='';if(typeof Post!=='undefined'&&Post.grid){try{const h=Post.grid(posts);if(h&&!/class="empty"/.test(h))body=h;}catch(e){body='';}}
  if(!body)body=`<div class="cl-saved">${posts.map((x,i)=>{const n=typeof Posts.normalize==='function'?Posts.normalize(x):x,pr=x.product&&typeof Products!=='undefined'?Products.find(x.product):null,p=byId(x.perfume||(pr&&pr.catalog)||'');const img=n.image||x.photo||x.image||'';
   const href=p?'#perfume/'+encodeURIComponent(p.id):'#person/'+encodeURIComponent(x.user||'');return `<a class="cl-saved-cell pressable" href="${esc(href)}" style="--i:${i}" aria-label="${esc('Publicação salva'+(p?', '+p.name:''))}">${img?`<img src="${esc(img)}" alt="" loading="lazy" decoding="async">`:UI.photo(p)}</a>`;}).join('')}</div>`;
  return UI.section({eyebrow:'Salvos',title:'Publicações salvas',body});},
 listView(name){const auto=this.AUTO[name]&&!state.lists[name]?this.auto(name):null,ids=auto||state.lists[name];
  if(!ids)return `<section class="v-collection" data-view="list">${UI.empty({icon:'list',title:'Não encontramos esta lista',text:'Ela pode ter sido apagada ou renomeada.',cta:{label:'Ir para a Coleção',href:'#collection'}})}</section>`;
  const ps=ids.map(byId).filter(Boolean),a=this.AUTO[name];
  const actions=auto?'':`${UI.btn('Adicionar',{action:'list-add-to',variant:'secondary',size:'sm',icon:'plus',attrs:`data-name="${esc(name)}"`})}${UI.iconBtn('more',{action:'list-more',label:'Opções da lista',attrs:`data-name="${esc(name)}"`})}`;
  const sub=auto?esc(a.sub):esc(UI.plural(ps.length,'perfume','perfumes'));
  let body;
  if(!ps.length)body=auto?UI.empty({icon:'list',title:a.empty,text:'A lista se monta sozinha a partir das suas avaliações.',cta:{label:'Avaliar um perfume',action:'profile-rate-pick'}})
   :UI.empty({icon:'list',title:'Esta lista está vazia',text:'Junte perfumes por ocasião, estação ou do jeito que fizer sentido para você.',cta:{label:'Buscar perfume',action:'list-add-to',attrs:`data-name="${esc(name)}"`}});
  else body=`<div class="grid-z cl-grid stagger">${ps.map((p,i)=>`<div class="cl-item" style="--i:${i}">${UI.tile(p,{i,sub:auto?esc(UI.ratingLabel(state.ratings[p.id])):''})}${auto?'':UI.iconBtn('close',{action:'list-remove',label:`Remover ${p.name} da lista`,cls:'cl-more icon-btn--on-image',attrs:`data-id="${esc(p.id)}" data-name="${esc(name)}"`})}</div>`).join('')}</div>`;
  return `<section class="v-collection" data-view="list">${UI.pageHead({eyebrow:auto?'Lista automática':'Lista',title:name,sub,actions})}${body}</section>`;},

 /* ---------- interações ---------- */
 setSeg(id){if(!this.SEGS.some(s=>s.id===id)||id===this.seg)return;this.seg=id;this.editing=false;Router.replace('collection',id);
  const seg=document.querySelector('.v-collection [data-seg="collection"]'),panel=document.getElementById('panel-collection');
  if(seg)UI.segSet(seg,id);if(panel){panel.setAttribute('aria-labelledby','tab-collection-'+id);Motion.swap(panel,this.panel(id));}},
 repaint(){const panel=document.getElementById('panel-collection');if(panel)Motion.swap(panel,this.panel(this.seg));},
 move(id,status){const p=byId(id);if(!p)return;const prev=state.shelf[p.id]||null,prevAt=state.shelfAt[p.id];
  const apply=(st,at)=>Store.update(s=>{if(st){s.shelf[p.id]=st;s.shelfAt[p.id]=at||Date.now();}else{delete s.shelf[p.id];delete s.shelfAt[p.id];}});
  apply(status);toast(status?`${p.name} foi para ${this.label(status)}`:`${p.name} saiu de ${this.label(prev)}`,{undo:()=>apply(prev,prevAt)});},
 itemMenu(id){const p=byId(id);if(!p)return;const cur=state.shelf[p.id];
  const rows=SHELF.filter(s=>s.id!==cur).map(s=>`<button type="button" class="ls-row pressable" data-action="collection-move" data-id="${esc(p.id)}" data-status="${s.id}"><span class="ls-ico">${icon('arrow')}</span><span class="grow">Mover para ${esc(s.label)}</span></button>`).join('');
  Sheet.open({title:p.name,cls:'sh-lists',body:`<div class="ls-menu list-hair">${rows}<button type="button" class="ls-row pressable" data-action="list-add" data-id="${esc(p.id)}"><span class="ls-ico">${icon('list')}</span><span class="grow">Salvar em lista</span></button>${cur?`<button type="button" class="ls-row ls-row--danger pressable" data-action="collection-move" data-id="${esc(p.id)}" data-status=""><span class="ls-ico">${icon('trash')}</span><span class="grow">Remover de ${esc(this.label(cur))}</span></button>`:''}</div>`});},
 /* Toque longo (500 ms) abre o mesmo menu; o clique que viria depois é cancelado. */
 lp:null,
 init(){
  document.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;const it=e.target.closest('.v-collection[data-view="collection"] .cl-item');if(!it)return;
   const x=e.clientX,y=e.clientY;clearTimeout(this.lp&&this.lp.t);
   this.lp={x,y,t:setTimeout(()=>{this.lp=null;try{navigator.vibrate&&navigator.vibrate(8);}catch(err){}
    const block=ev=>{ev.preventDefault();ev.stopPropagation();};document.addEventListener('click',block,{capture:true,once:true});setTimeout(()=>document.removeEventListener('click',block,{capture:true}),700);
    this.itemMenu(it.dataset.item);},500)};},{passive:true});
  const cancel=e=>{if(!this.lp)return;if(e.type==='pointermove'&&Math.hypot(e.clientX-this.lp.x,e.clientY-this.lp.y)<10)return;clearTimeout(this.lp.t);this.lp=null;};
  for(const t of ['pointerup','pointercancel','pointermove'])document.addEventListener(t,cancel,{passive:true});
  document.addEventListener('contextmenu',e=>{if(e.target.closest&&e.target.closest('.v-collection .cl-item')&&matchMedia('(pointer:coarse)').matches)e.preventDefault();});
 }
};

const Lists={
 RESERVED:['tenho','quero','testei','favoritos','não gostei','nao gostei'],
 pk:null,
 /* Seletor de perfume: Search.pick quando existe; senão uma versão simples, na mesma folha. */
 choose(o){if(typeof Search!=='undefined'&&Search.pick){try{Search.pick(o);return;}catch(e){console.warn(e);}}this.picker(o);},
 picker({title='Escolher perfume',onPick,exclude=[],first=[]}={}){
  this.pk={onPick,exclude:new Set(exclude),first:first.filter(id=>byId(id)),snap:Sheet.isOpen()?Sheet.save():null};
  Sheet.open({title,cls:'sh-lists',body:`<label class="field ls-find" data-input="list-find"><span>Buscar perfume</span><input type="search" name="q" placeholder="Nome ou marca" autocomplete="off" enterkeyhint="search"></label><div class="list-hair ls-results" id="ls-results" aria-live="polite">${this.results('')}</div>`,focus:'.ls-find input'});},
 norm(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();},
 results(q){const k=this.norm(q).trim(),pk=this.pk||{exclude:new Set(),first:[]};
  const firsts=pk.first.map(byId).filter(Boolean),rest=PERFUMES.filter(p=>!pk.first.includes(p.id));
  const all=[...firsts,...rest].filter(p=>!pk.exclude.has(p.id)&&(!k||this.norm(p.name+' '+p.brand).includes(k))).slice(0,30);
  if(!all.length)return `<p class="ls-none muted">${esc(k?`Nada encontrado para “${q.trim()}”.`:'Nenhum perfume disponível.')}</p>`;
  return all.map(p=>`<button type="button" class="ls-row ls-pick pressable" data-action="list-choose" data-id="${esc(p.id)}"><span class="thumb plate">${p.image?`<img src="${esc(p.image)}" alt="" loading="lazy" decoding="async">`:''}</span><span class="grow"><b>${esc(p.name)}</b><span>${esc(p.brand)}${pk.first.includes(p.id)?' · na sua coleção':''}</span></span></button>`).join('');},
 chosen(id){const pk=this.pk;this.pk=null;if(!pk)return;
  if(pk.snap)Sheet.restore(pk.snap);
  try{pk.onPick&&pk.onPick(id);}catch(e){console.warn(e);}
  if(!pk.snap&&document.querySelector('#sheet .ls-find'))Sheet.close();},
 /* "Salvar em lista": coleção (Tenho · Quero · Testei) e listas próprias, com desfazer. */
 pickBody(id){const names=Object.keys(state.lists);
  const rows=names.map(n=>{const on=state.lists[n].includes(id);return `<button type="button" class="ls-row ls-toggle pressable" data-action="list-toggle" data-id="${esc(id)}" data-name="${esc(n)}" aria-pressed="${on}">${Collection.stack(state.lists[n])}<span class="grow"><b>${esc(n)}</b><span data-count>${esc(UI.plural(state.lists[n].length,'perfume','perfumes'))}</span></span><span class="ls-check" aria-hidden="true">${icon('check')}</span></button>`;}).join('');
  return `<div class="ls-pick-body"><p class="t-eyebrow muted">Na sua coleção</p>${UI.shelfSeg(id)}<p class="t-eyebrow muted">Listas</p><div class="list-hair">${rows}<button type="button" class="ls-row pressable" data-action="list-new" data-id="${esc(id)}"><span class="ls-ico">${icon('plus')}</span><span class="grow"><b>Nova lista</b></span></button></div></div>`;},
 pick(perfumeId){const p=byId(perfumeId);if(!p)return;Sheet.open({title:'Salvar em lista',cls:'sh-lists',body:this.pickBody(p.id)});},
 toggle(id,name){const p=byId(id);if(!p||!state.lists[name])return;const on=!state.lists[name].includes(p.id);
  const apply=v=>{Store.update(s=>{const l=s.lists[name];if(!l)return;s.lists[name]=v?[...new Set([...l,p.id])]:l.filter(x=>x!==p.id);},{silent:true});
   for(const b of document.querySelectorAll(`#sheet [data-action="list-toggle"][data-id="${CSS.escape(p.id)}"][data-name="${CSS.escape(name)}"]`)){b.setAttribute('aria-pressed',v);const c=b.querySelector('[data-count]');if(c&&state.lists[name])c.textContent=UI.plural(state.lists[name].length,'perfume','perfumes');}};
  apply(on);toast(on?`Salvo em ${name}`:`Removido de ${name}`,{undo:()=>apply(!on)});},
 validName(raw,{except=''}={}){const n=String(raw||'').replace(/\//g,' ').replace(/\s+/g,' ').trim();
  if(!n)return {error:'Dê um nome à lista.'};if(n.length>40)return {error:'Use até 40 caracteres.'};
  const k=n.toLowerCase();if(this.RESERVED.includes(k)||Object.keys(state.lists).some(x=>x.toLowerCase()===k&&x!==except))return {error:'Já existe uma lista com esse nome'};return {name:n};},
 form(kind,{value='',add='',name=''}={}){return `<form class="ls-form" data-submit="${kind}" data-add="${esc(add)}" data-name="${esc(name)}" novalidate>${UI.field({name:'name',label:'Nome da lista',value,max:40,counter:true,attrs:'autocomplete="off" required'})}${UI.btn(kind==='list-rename-save'?'Salvar nome':'Criar lista',{size:'block',attrs:'type="submit"'}).replace('type="button" ','')}</form>`;},
 create({add=''}={}){Sheet.open({title:'Nova lista',cls:'sh-lists',body:this.form('list-create',{add}),focus:'.ls-form input'});},
 showError(form,msg){const f=form.querySelector('.field'),inp=form.querySelector('input');if(!f||!inp)return;let e=f.querySelector('.err');
  if(msg){if(!e){e=document.createElement('span');e.className='err';e.id='ls-err';e.setAttribute('role','alert');f.append(e);}e.textContent=msg;f.setAttribute('aria-invalid','true');inp.setAttribute('aria-invalid','true');inp.setAttribute('aria-describedby','ls-err');inp.focus();}
  else{if(e)e.remove();f.removeAttribute('aria-invalid');inp.removeAttribute('aria-invalid');inp.removeAttribute('aria-describedby');}},
 submitCreate(form){const v=this.validName(form.querySelector('input').value);if(v.error){this.showError(form,v.error);return;}
  const add=form.dataset.add&&byId(form.dataset.add)?byId(form.dataset.add).id:'';
  Store.update(s=>{s.lists[v.name]=add?[add]:[];},{silent:true});
  if(add){Sheet.open({title:'Salvar em lista',cls:'sh-lists',body:this.pickBody(add)});toast(`Lista criada com ${byId(add).name}`);return;}
  toast('Lista criada');Router.go('list',v.name);},
 more(name){if(!state.lists[name])return;
  Sheet.open({title:name,cls:'sh-lists',body:`<div class="ls-menu list-hair"><button type="button" class="ls-row pressable" data-action="list-rename" data-name="${esc(name)}"><span class="ls-ico">${icon('edit')}</span><span class="grow">Renomear</span></button><button type="button" class="ls-row pressable" data-action="share" data-kind="list" data-id="${esc(name)}"><span class="ls-ico">${icon('share')}</span><span class="grow">Compartilhar</span></button><button type="button" class="ls-row ls-row--danger pressable" data-action="list-delete" data-name="${esc(name)}"><span class="ls-ico">${icon('trash')}</span><span class="grow">Apagar lista</span></button></div>`});},
 submitRename(form){const old=form.dataset.name;if(!state.lists[old]){Sheet.close();return;}const v=this.validName(form.querySelector('input').value,{except:old});if(v.error){this.showError(form,v.error);return;}
  if(v.name!==old)Store.update(s=>{const out={};for(const [k,ids] of Object.entries(s.lists))out[k===old?v.name:k]=ids;s.lists=out;},{silent:true});
  Sheet.close({force:true});Router.go('list',v.name,{replace:true});toast('Lista renomeada');},
 async remove(name){if(!state.lists[name])return;const ok=await Sheet.confirm({title:'Apagar a lista?',text:`“${name}” some das suas listas. Os perfumes continuam na sua coleção.`,ok:'Apagar',danger:true});if(!ok)return;
  const ids=[...state.lists[name]],order=Object.keys(state.lists);
  Store.update(s=>{delete s.lists[name];},{silent:true});Sheet.close({force:true});Router.go('collection','',{replace:true});
  toast('Lista apagada',{undo:()=>Store.update(s=>{const out={};for(const k of order){if(k===name)out[k]=ids;else if(s.lists[k])out[k]=s.lists[k];}for(const [k,v] of Object.entries(s.lists))if(!out[k])out[k]=v;s.lists=out;})});},
 removeItem(id,name){const p=byId(id);if(!p||!state.lists[name])return;const prev=[...state.lists[name]];
  Store.update(s=>{s.lists[name]=s.lists[name].filter(x=>x!==p.id);});toast(`${p.name} saiu da lista`,{undo:()=>Store.update(s=>{if(s.lists[name])s.lists[name]=prev;})});},
 addTo(name){if(!state.lists[name])return;
  this.choose({title:`Adicionar a ${name}`,exclude:state.lists[name],first:[...Select.shelfIds('have'),...Select.shelfIds('want')],onPick:id=>{const p=byId(id);if(!p)return;
   Store.update(s=>{if(s.lists[name]&&!s.lists[name].includes(p.id))s.lists[name].push(p.id);});toast(`${p.name} entrou na lista`,{undo:()=>Store.update(s=>{if(s.lists[name])s.lists[name]=s.lists[name].filter(x=>x!==p.id);})});}});},
 addShelf(status){this.choose({title:`Adicionar a ${Collection.label(status)}`,exclude:Object.keys(state.shelf),onPick:id=>{const p=byId(id);if(!p)return;
  Store.update(s=>{s.shelf[p.id]=status;s.shelfAt[p.id]=Date.now();});toast(`Adicionado a ${Collection.label(status)}`,{undo:()=>Store.update(s=>{delete s.shelf[p.id];delete s.shelfAt[p.id];})});}});}
};

Router.add('collection',{view:id=>Collection.view(id),title:'Coleção',layout:'tab',nav:'collection'});
Router.add('list',{view:name=>Collection.listView(name),title:name=>name||'Lista',layout:'push',nav:'collection'});
Actions.add({
 'collection-seg':el=>Collection.setSeg(el.dataset.id),
 'collection-edit':()=>{Collection.editing=!Collection.editing;Collection.repaint();},
 'collection-sort-open':()=>Collection.sortSheet(),
 'collection-sort':el=>{Collection.sort=el.dataset.id||'recent';Sheet.close();Collection.repaint();},
 'collection-item':el=>Collection.itemMenu(el.dataset.id),
 'collection-move':el=>{Sheet.close({force:true});Collection.move(el.dataset.id,el.dataset.status||null);},
 'collection-add':el=>Lists.addShelf(el.dataset.id||'have'),
 'collection-day':el=>Collection.dayOpen(el.dataset.id),
 'collection-month':el=>{const d=Collection.monthDate(Collection.month||Collection.monthKey());d.setMonth(d.getMonth()+Number(el.dataset.id||0));const k=Collection.monthKey(d);
  if(k>Collection.monthKey()||k<Collection.minMonth())return;Collection.month=k;const box=document.getElementById('cl-diary');
  if(box)Motion.swap(box,Collection.monthHtml(k),{dir:Number(el.dataset.id)}).then(()=>{const b=box.querySelector(`[data-action="collection-month"][data-id="${el.dataset.id}"]:not([disabled])`)||box.querySelector('[data-action="collection-month"]:not([disabled])');try{b&&b.focus({preventScroll:true});}catch(e){}});},
 'list-new':el=>Lists.create({add:el.dataset.id||''}),
 'list-toggle':el=>Lists.toggle(el.dataset.id,el.dataset.name),
 'list-choose':el=>Lists.chosen(el.dataset.id),
 'list-more':el=>Lists.more(el.dataset.name),
 'list-rename':el=>{const n=el.dataset.name;Sheet.open({title:'Renomear lista',cls:'sh-lists',body:Lists.form('list-rename-save',{value:n,name:n}),focus:'.ls-form input'});},
 'list-delete':el=>Lists.remove(el.dataset.name),
 'list-remove':el=>Lists.removeItem(el.dataset.id,el.dataset.name),
 'list-add-to':el=>Lists.addTo(el.dataset.name)
});
Actions.input('list-find',t=>{const box=document.getElementById('ls-results');if(box)box.innerHTML=Lists.results(t.value);});
Actions.submit('list-create',f=>Lists.submitCreate(f));
Actions.submit('list-rename-save',f=>Lists.submitRename(f));
Collection.init();
