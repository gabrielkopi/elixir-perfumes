'use strict';
/* Perfil (§5 Perfil e Pessoa): cabeçalho curado, Assinatura, "Esse sou eu", "As três notas que ficam",
   abas Diário · Avaliações · Mapa e a página de outras pessoas. O cabeçalho também desenha a prévia do Editar perfil. */
const Profile={
 tab:'',occ:'',more:false,
 OCCASIONS:['Dia a dia','Trabalho','Noite','Encontro','Festa','Evento','Ar livre'],

 /* ---------- utilitários ---------- */
 norm(s){try{if(typeof NoteModel!=='undefined'&&NoteModel.normalize)return NoteModel.normalize(s);}catch(e){}return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();},
 aliasIdx:null,
 /* Nota → ilustração (id, imagem, nome canônico). Sem ilustração: só o nome (plate tipográfica). */
 ingredient(name){
  if(!this.aliasIdx){this.aliasIdx=new Map();
   if(typeof INGREDIENTS!=='undefined')for(const x of INGREDIENTS)this.aliasIdx.set(this.norm(x.name),x);
   if(typeof INGREDIENT_ALIASES!=='undefined'&&typeof INGREDIENTS!=='undefined')for(const [id,list] of Object.entries(INGREDIENT_ALIASES)){const x=INGREDIENTS.find(i=>i.id===id);if(!x)continue;for(const a of list||[]){const k=this.norm(a);if(!this.aliasIdx.has(k))this.aliasIdx.set(k,x);}}}
  const x=this.aliasIdx.get(this.norm(name));return x?{id:x.id,image:x.image||'',name:x.name}:{id:null,image:'',name:String(name||'')};},
 topNotes(p,n=3){return [...(p&&p.noteWeights||[])].sort((a,b)=>b.weight-a.weight||a.name.localeCompare(b.name,'pt')).slice(0,n).map(x=>x.name);},
 person(id){if(typeof People==='undefined')return null;try{return People.get?People.get(id):People.all().find(p=>p.id===id)||null;}catch(e){return null;}},
 host(url){try{return new URL(url).hostname.replace(/^www\./,'');}catch(e){return '';}},
 mapRef(){try{return typeof Select!=='undefined'?Select.map():null;}catch(e){return null;}},

 /* ---------- dados do intel (com alternativa simples quando o OMap ainda não existe) ---------- */
 /* "Esse sou eu": família e notas deduzidas só dos perfumes escolhidos. */
 portrait(ids){
  if(typeof OMap!=='undefined'&&OMap.portrait){try{const r=OMap.portrait(ids);if(r)return r;}catch(e){console.warn(e);}}
  const ps=(ids||[]).map(byId).filter(Boolean),none={notes:[],family:null,secondary:null,line:''};if(ps.length<2)return none;
  const v=DIMENSIONS.map((_,d)=>ps.reduce((a,p)=>a+(p.vector[d]||0),0)/ps.length),order=v.map((x,d)=>[x,d]).sort((a,b)=>b[0]-a[0]||a[1]-b[1]);
  const fam={axis:String(order[0][1]),label:DIMENSIONS[order[0][1]]},sec=order[1]&&order[1][0]>=.35?{axis:String(order[1][1]),label:DIMENSIONS[order[1][1]]}:null;
  const score=new Map();for(const p of ps)for(const w of p.noteWeights||[]){const k=this.norm(w.name),o=score.get(k)||{name:w.name,s:0};o.s+=w.weight;score.set(k,o);}
  const notes=[...score.values()].sort((a,b)=>b.s-a.s||a.name.localeCompare(b.name,'pt')).slice(0,5).map(x=>x.name);
  const two=notes.slice(0,2).map(n=>n.toLowerCase());
  return {notes,family:fam,secondary:sec,line:`Você volta sempre ao ${fam.label.toLowerCase()}${two.length===2?`, com ${two[0]} e ${two[1]} por perto`:''}.`};},
 /* "As três notas que ficam": OMap.notes, ou a mesma regra em versão simples. */
 notesOf(st,{occasion=''}={}){
  if(typeof OMap!=='undefined'&&OMap.notes){try{const r=OMap.notes(st,{occasion});if(r)return r;}catch(e){console.warn(e);}}
  const R=st.ratings||{},pos=new Map(),neg=new Set();
  const occOk=id=>!occasion||!!(st.reviews&&st.reviews[id]&&(st.reviews[id].occasions||[]).includes(occasion))||(st.sotd||[]).some(x=>x.id===id&&((x.ctx&&x.ctx.occasion)||x.occasion)===occasion);
  for(const [id,r] of Object.entries(R)){if(!occOk(id))continue;if(r>=6)pos.set(id,r>=9?1:r>=7?.8:.45);else if(r<=4)neg.add(id);}
  for(const id of st.pinned||[])if(occOk(id)&&!pos.has(id)&&!neg.has(id))pos.set(id,.8);
  for(const [id,s] of Object.entries(st.shelf||{}))if(s==='have'&&occOk(id)&&!pos.has(id)&&!neg.has(id))pos.set(id,.35);
  const score=new Map();
  for(const [id,s] of pos){const p=byId(id);if(!p)continue;for(const w of p.noteWeights||[]){const k=this.norm(w.name),o=score.get(k)||{name:w.name,score:0,ids:new Set()};o.score+=w.weight*s;o.ids.add(id);score.set(k,o);}}
  for(const id of neg){const p=byId(id);if(!p)continue;for(const w of p.noteWeights||[]){const o=score.get(this.norm(w.name));if(o)o.score-=w.weight;}}
  const notes=[...score.values()].filter(o=>o.ids.size>=2&&o.score>0).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'pt')).slice(0,3)
   .map(o=>{const ing=this.ingredient(o.name);return {name:ing.name||o.name,id:ing.id,image:ing.image,score:o.score,n:o.ids.size};});
  return {notes,n:pos.size,enough:pos.size>=2&&notes.length>=3};},
 occasions(st){
  if(typeof OMap!=='undefined'&&OMap.occasions){try{return OMap.occasions(st)||[];}catch(e){console.warn(e);}}
  return this.OCCASIONS.filter(o=>this.notesOf(st,{occasion:o}).enough);},

 /* ---------- cabeçalho (o mesmo na prévia do Editar perfil) ---------- */
 cover(pr){const c=ProfileRules.coverOf(pr);
  if(c.kind==='image')return `<figure class="cover pf-cover" aria-hidden="true"><img class="bw" src="${esc(c.src800)}" srcset="${esc(c.src800)} 800w, ${esc(c.src)} 1600w" sizes="(min-width:1080px) 1080px, 100vw" alt="" loading="eager" decoding="async"></figure>`;
  if(c.kind==='signature')return `<div class="pf-cover pf-cover--sig" aria-hidden="true">${UI.photo(c.perfume,{eager:true})}</div>`;
  return `<div class="pf-cover pf-cover--none" aria-hidden="true"></div>`;},
 avatar(pr,person){if(person)return UI.avatar(person,'xl');
  const vibe=!pr.photo&&pr.avatarVibe&&PROFILE_RULES.covers[pr.avatarVibe]?PROFILE_RULES.covers[pr.avatarVibe].src800:'';const html=UI.avatar({name:pr.name,photo:pr.photo||vibe,initials:UI.initials(pr.name)},'xl');return pr.photoBW&&pr.photo?html.replace('class="avatar ','class="avatar mono '):html;},
 stat(n,one,many){return `<div class="pf-stat"><dt>${esc(n===1?one:many)}</dt><dd>${esc(UI.count(n))}</dd></div>`;},
 privacyLabel(){const v=state.settings&&state.settings.privacy?state.settings.privacy.profile:'public';
  return v==='private'?'Perfil privado':v==='circle'?'Visível para o seu círculo':'';},
 header(pr,{own=true,person=null,preview=false}={}){
  const name=person?person.name:pr.name,handle=person?(person.handle||person.id):pr.handle,bio=person?(person.bio||''):pr.bio;
  const link=!person&&pr.link?`<a class="pf-link" href="${esc(pr.link)}" target="_blank" rel="noopener nofollow noreferrer">${icon('link','icon--20')}<span>${esc(this.host(pr.link)||pr.link)}</span>${icon('arrow-up-right','icon--20')}<span class="sr-only"> (abre em nova aba)</span></a>`:'';
  const tags=person?[person.role].filter(Boolean):[...(pr.styleTags||[]),...(pr.musicTags||[])];
  const priv=own&&!preview?this.privacyLabel():'';
  const stats=person?this.stat(Object.keys(person.ratings||{}).length,'avaliado','avaliados')+this.stat(Number(person.followers)||0,'seguidor','seguidores')+this.stat(Number(person.following)||0,'seguindo','seguindo')
   :this.stat(Object.keys(state.ratings).length,'avaliado','avaliados')+this.stat(Select.shelfIds('have').length,'na coleção','na coleção')+this.stat(state.following.length,'seguindo','seguindo');
  const actions=person
   ?`${UI.followBtn(person.id,state.following.includes(person.id))}${UI.iconBtn('share',{action:'share',label:'Compartilhar perfil',attrs:`data-kind="person" data-id="${esc(person.id)}"`})}`
   :`${UI.btn('Editar perfil',{action:'profile-edit',variant:'secondary',size:'sm'})}${UI.iconBtn('share',{action:'share',label:'Compartilhar perfil',attrs:'data-kind="profile" data-id="me"'})}`;
  return `<header class="pf-head">${person?`<div class="pf-cover pf-cover--none" aria-hidden="true"></div>`:this.cover(pr)}
<div class="pf-id"><div class="pf-top">${this.avatar(pr,person)}<div class="pf-actions">${actions}</div></div>
<h1 class="t-h1 pf-name">${esc(name)}${person?UI.badge(person.verified):''}</h1>
<p class="pf-handle"><span>@${esc(handle)}</span>${person?'<span class="demo-tag">Perfil de demonstração</span>':''}${priv?`<span class="pf-priv">${icon('lock','icon--20')}${esc(priv)}</span>`:''}</p>
${bio?`<p class="pf-bio">${esc(bio)}</p>`:''}${link}
${tags.length?`<div class="pf-tags" aria-label="Estilo e trilha">${tags.map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>`:''}
<dl class="pf-stats">${stats}</dl></div>${preview?'':'<i data-sentinel aria-hidden="true"></i>'}</header>`;},

 /* ---------- blocos ---------- */
 sigCard(p,{own=true}={}){
  if(!p){if(!own)return '';
   return `<section class="pf-sig pf-sig--empty"><div class="pf-sig-plate" aria-hidden="true"><div class="plate"></div></div><div class="pf-sig-txt"><p class="t-eyebrow muted">Meu Elixir</p><h2 class="t-h3">Escolha o seu Elixir</h2><p class="t-sm muted">O perfume que as pessoas lembram quando pensam em você.</p>${UI.btn('Escolher',{action:'profile-edit',variant:'tertiary',icon:'chevron-right',attrs:'data-id="signature"'})}</div></section>`;}
  const notes=this.topNotes(p,3);
  return `<a class="pf-sig pressable" href="#perfume/${esc(p.id)}" data-action="perfume" data-id="${esc(p.id)}"><div class="pf-sig-plate">${UI.photo(p)}</div><div class="pf-sig-txt"><p class="t-eyebrow muted">Meu Elixir</p><h2 class="t-h2">${esc(p.name)}</h2><p class="pf-sig-brand">${esc(p.brand)}</p>${notes.length?`<p class="pf-sig-notes">${notes.map(esc).join(' · ')}</p>`:''}</div></a>`;},
 pinned(ids,{own=true}={}){
  const ps=(ids||[]).map(byId).filter(Boolean);
  if(!own&&ps.length<2)return '';
  const prompt=own&&ps.length<2?`<div class="card pf-prompt"><p class="t-h3">Escolha até 5 perfumes que são a sua cara</p><p class="t-sm muted">Com eles, mostramos o que eles dizem sobre você.</p>${UI.btn('Escolher',{action:'profile-edit',variant:'tertiary',icon:'chevron-right',attrs:'data-id="pinned"'})}</div>`:'';
  const tiles=ps.map((p,i)=>UI.tile(p,{i}));
  const grid=!tiles.length?'':tiles.length>3?`<div class="pf-pin-rail">${UI.rail(tiles,{name:'pf-pinned',label:'Esse sou eu'})}</div><div class="pf-pin-grid pf-pin-grid--wide stagger">${tiles.join('')}</div>`:`<div class="pf-pin-grid stagger" style="--n:${tiles.length}">${tiles.join('')}</div>`;
  const pt=ps.length>=2?this.portrait(ps.map(p=>p.id)):null;
  const fam=pt&&pt.family?(pt.family.label+(pt.secondary?' '+pt.secondary.label.toLowerCase():'')):'';
  const result=pt&&(fam||pt.line)?`<div class="pf-portrait">${fam?`<p class="t-h2">${esc(fam)}</p>`:''}${pt.line?`<p class="em">${esc(pt.line)}</p>`:''}${(pt.notes||[]).length?`<div class="pf-tags">${pt.notes.slice(0,5).map(n=>`<span class="chip">${esc(n)}</span>`).join('')}</div>`:''}</div>`:'';
  return UI.section({eyebrow:'Esse sou eu',cls:'pf-pinned',body:grid+result+prompt});},
 notesBlock(r){if(!r||!r.notes||!r.notes.length)return '';
  const items=r.notes.slice(0,3);
  return `<div class="pf-notes-row">${items.map(n=>{const img=n.image||(n.id&&typeof noteImage==='function'?noteImage(n.id):'')||'';
   return `<figure class="pf-note">${n.id?`<a class="pf-note-img pressable" href="#ingredient/${esc(n.id)}" aria-label="${esc(n.name)}">`:'<div class="pf-note-img">'}${img?`<img src="${esc(img)}" alt="" loading="lazy" decoding="async">`:`<span class="pf-note-ph" aria-hidden="true">${esc(n.name)}</span>`}${n.id?'</a>':'</div>'}<figcaption><span class="pf-note-name">${esc(n.name)}</span>${n.n?`<small>${esc('em '+UI.plural(n.n,'perfume','perfumes'))}</small>`:''}</figcaption></figure>`;}).join('')}</div>
<p class="muted pf-notes-cap">Um retrato do seu universo olfativo.</p>`;},
 threeNotes(st,{own=true,label='As três notas que ficam'}={}){
  const all=this.notesOf(st);if(!all||!all.enough||!all.notes.length)return '';
  const occ=own?this.occasions(st):[];if(own&&this.occ&&!occ.includes(this.occ))this.occ='';
  const cur=own&&this.occ?this.notesOf(st,{occasion:this.occ}):all;
  const chips=occ.length?UI.chips([{id:'',label:'Geral',on:!this.occ},...occ.map(o=>({id:o,label:o,on:this.occ===o}))],'profile-notes',{scroll:true,label:'Ocasião'}):'';
  return UI.section({eyebrow:label,cls:'pf-three',body:`${chips}<div class="pf-notes" id="pf-notes" aria-live="polite">${this.notesBlock(cur)}</div>`});},
 shelfRail(status,title,more){const ids=Select.shelfIds(status);if(!ids.length)return '';
  const tiles=ids.slice(0,12).map(byId).filter(Boolean).map((p,i)=>`<div class="pf-rail-tile">${UI.tile(p,{i})}</div>`);
  return UI.section({eyebrow:'Coleção',title,more:{label:'Ver tudo',href:more},rail:'pf-'+status,body:UI.rail(tiles,{name:'pf-'+status,label:title})});},

 /* ---------- abas ---------- */
 TABS:[{id:'diary',label:'Diário',sec:'diary'},{id:'reviews',label:'Avaliações',sec:'reviews'},{id:'map',label:'Mapa',sec:'dna'}],
 tabsFor(pr){return this.TABS.filter(t=>pr.sections[t.sec]!==false);},
 postGrid(posts){
  if(!posts.length)return '';
  if(typeof Post!=='undefined'&&Post.grid){try{const h=Post.grid(posts);if(typeof h==='string'&&h&&!/class="empty"/.test(h))return h;}catch(e){console.warn(e);}}
  return `<div class="pf-grid stagger">${posts.map((x,i)=>{const p=byId(x.perfume),d=UI.date(x.when,'day');
   return `<a class="pf-cell pressable" href="#perfume/${esc(x.perfume)}" data-action="perfume" data-id="${esc(x.perfume)}" style="--i:${i}" aria-label="${esc(d+(p?', '+p.name:''))}">${x.photo?`<img class="pf-cell-img" src="${esc(x.photo)}" alt="" loading="lazy" decoding="async">`:UI.photo(p)}<span class="pf-cell-date" aria-hidden="true">${esc(d)}</span></a>`;}).join('')}</div>`;},
 diary(){const posts=state.posts.filter(p=>p.sotd||state.sotd.some(s=>s.postId===p.id));
  return posts.length?this.postGrid(posts):UI.empty({icon:'calendar',title:'Seu diário começa hoje',text:'Registre o perfume do dia. Ele aparece aqui e no seu calendário.',cta:{label:'Usando hoje',action:'sotd'}});},
 reviews(){const ids=Object.keys(state.ratings).filter(id=>byId(id)).sort((a,b)=>(state.ratedAt[b]||0)-(state.ratedAt[a]||0)||(a<b?-1:1));
  if(!ids.length)return UI.empty({icon:'star',title:'Nenhuma avaliação ainda',text:'Cada avaliação deixa o seu mapa mais preciso.',cta:{label:'Avaliar um perfume',action:'profile-rate-pick'}});
  return `<div class="list-hair pf-reviews">${ids.map(id=>{const p=byId(id),r=state.reviews[id]||{},lab=UI.ratingLabel(state.ratings[id]);
   const sub=r.comment?`<span class="pf-rev-text">${esc(r.comment)}</span>`:esc(p.brand);
   return UI.row(p,{sub,trail:UI.btn(lab,{action:'rate',variant:'secondary',size:'sm',attrs:`data-id="${esc(id)}" aria-label="Sua avaliação: ${esc(lab)}. Mudar avaliação de ${esc(p.name)}"`})});}).join('')}</div>`;},
 /* Mapa: MapView.summary quando o intel existe; senão um resumo honesto com o que houver. */
 mapTab(){const n=Object.keys(state.ratings).length;
  const empty=UI.empty({icon:'compass',title:'Seu mapa aparece depois de 3 avaliações',text:'Avalie perfumes que você conhece. O mapa mostra do que você gosta e com que confiança.',cta:{label:'Refinar meu mapa',href:'#refine/1'}});
  if(n<3)return empty;
  const map=this.mapRef();
  if(typeof MapView!=='undefined'&&MapView.summary&&map){try{const h=MapView.summary(map,{own:true});if(h)return h;}catch(e){console.warn(e);}}
  const full=UI.btn('Ver mapa completo',{variant:'tertiary',href:'#map',icon:'chevron-right'});
  if(map&&Array.isArray(map.axes)){
   const proof=map.axes.filter(a=>a.level==='comprovado').sort((a,b)=>Math.abs(b.value-.5)-Math.abs(a.value-.5)).slice(0,4),hyp=map.axes.filter(a=>a.level==='hipotese').sort((a,b)=>Math.abs(b.value-.5)-Math.abs(a.value-.5)).slice(0,3);
   const prim=(map.primary||[])[0],primLabel=prim?(typeof prim==='string'?(map.axes.find(a=>a.id===prim)||{}).label:prim.label):'';
   const sec=(map.secondary||[]).map(s=>typeof s==='string'?(map.axes.find(a=>a.id===s)||{}).label:s.label).filter(Boolean);
   const ev=map.evidence||{};
   return `<div class="pf-map"><article class="data-card"><p class="t-eyebrow muted">Seu mapa olfativo</p>${primLabel?`<p class="t-display pf-map-axis">${esc(primLabel)}</p>`:''}${sec.length?`<p class="em">Secundárias: ${esc(sec.join(', '))}</p>`:''}
<div class="pf-map-conf">${UI.num(Math.round((Number(map.confidence)||0)*100),'%')}<p class="t-sm muted">Confiança do mapa · a partir de ${esc(UI.plural(Number(ev.ratings)||n,'avaliação','avaliações'))}</p></div></article>
${proof.length||hyp.length?`<article class="data-card">${UI.axisBars([...proof,...hyp],{limit:7})}</article>`:''}<div class="pf-map-more">${full}</div></div>`;}
  const v=Engine.profile(state.ratings),bars=FAMILIES.map(f=>({label:f[1],value:v[f[3]]})).sort((a,b)=>b.value-a.value);
  const radar=typeof Radar!=='undefined'&&Radar.svg?(()=>{try{return Radar.svg(state.ratings);}catch(e){return '';}})():'';
  return `<div class="pf-map"><article class="data-card"><p class="t-eyebrow muted">Famílias que você mais avalia bem</p><p class="t-display pf-map-axis">${esc(bars[0].label)}</p>${radar?`<div class="pf-radar">${radar}</div>`:''}${UI.bars(bars,5)}<p class="t-sm muted">${esc('A partir de '+UI.plural(n,'avaliação','avaliações')+'.')}</p></article><div class="pf-map-more">${full}</div></div>`;},
 panel(id){return id==='reviews'?this.reviews():id==='map'?this.mapTab():this.diary();},
 tabsBlock(pr){const tabs=this.tabsFor(pr);if(!tabs.length)return '';
  if(!tabs.some(t=>t.id===this.tab))this.tab=tabs[0].id;
  if(tabs.length===1)return `<section class="sec pf-tabs"><div class="sec-head"><div class="sec-title"><h2 class="t-h2">${esc(tabs[0].label)}</h2></div></div><div class="pf-panel">${this.panel(tabs[0].id)}</div></section>`;
  return `<section class="sec pf-tabs">${UI.seg(tabs,this.tab,'profile-tab',{name:'profile',label:'Seções do perfil',block:true})}<div class="pf-panel" id="panel-profile" role="tabpanel" aria-labelledby="tab-profile-${esc(this.tab)}" data-swap="profile">${this.panel(this.tab)}</div></section>`;},

 /* ---------- telas ---------- */
 view(){const pr=state.profile,sig=pr.signature?byId(pr.signature):null,st=Select.mapInput();
  const gift=typeof PROFILE_RULES!=='undefined'&&PROFILE_RULES.giftSite?`<div class="pf-gift">${UI.linkRow({icon:'gift',title:'Minha lista de presentes',sub:'Abre o site separado da lista, para quem quer me dar um perfume.',href:PROFILE_RULES.giftSite,external:true})}</div>`:'';
  return `<section class="v-profile" data-view="profile" data-tone="${esc(pr.tone)}">${this.header(pr,{own:true})}${gift}
<div class="pf-body">${this.sigCard(sig,{own:true})}${this.pinned(pr.pinned,{own:true})}${this.threeNotes(st,{own:true})}
${pr.sections.collection!==false?this.shelfRail('have','Tenho','#collection/have'):''}${pr.sections.want!==false?this.shelfRail('want','Quero','#collection/want'):''}${this.tabsBlock(pr)}</div></section>`;},
 /* Outra pessoa: sem % global; compatibilidade só por eixo (MapView.compat). */
 compat(u){
  if(typeof MapView!=='undefined'&&MapView.compat){try{const h=MapView.compat(u.id);if(h)return `<div class="pf-compat">${h}</div>`;}catch(e){console.warn(e);}}
  const mine=state.ratings,common=Object.keys(u.ratings||{}).filter(id=>mine[id]!==undefined);
  if(common.length<3)return `<p class="pf-compat pf-compat--low muted">Poucos perfumes em comum para comparar.</p>`;
  const close=common.filter(id=>Math.abs(mine[id]-u.ratings[id])<=2).length;
  return `<p class="pf-compat em">Vocês avaliaram <b>${esc(UI.plural(common.length,'perfume','perfumes'))}</b> em comum e concordam em <b>${esc(String(close))}</b>.</p>`;},
 personView(id){const u=this.person(id);
  if(!u)return `<section class="v-profile" data-view="person" data-tone="papel">${UI.empty({icon:'user',title:'Não encontramos este perfil',text:'O link pode estar errado ou o perfil não existe mais.',cta:{label:'Ir para o início',href:'#home'}})}</section>`;
  const R=u.ratings||{},mine=state.ratings,first=u.name.split(' ')[0];
  const sigId=Object.keys(R).filter(k=>R[k]>=10&&byId(k)).sort()[0],sig=sigId?byId(sigId):null;
  const circle=typeof Circle!=='undefined'&&Circle.has&&Circle.toggle?(()=>{const on=!!Circle.has(u.id);return UI.btn(on?'No seu círculo':'Adicionar ao círculo',{action:'circle-toggle',variant:'secondary',size:'sm',attrs:`data-id="${esc(u.id)}" data-circle="${esc(u.id)}" aria-pressed="${on}"`});})():'';
  const cmp=typeof Circle!=='undefined'?UI.btn('Comparar mapas',{variant:'tertiary',href:'#circle/'+encodeURIComponent(u.id),icon:'chevron-right'}):'';
  let map='';
  if(u.shareMap===false)map=`<p class="muted">${esc(first)} não compartilha o Mapa.</p>`;
  else if(typeof MapView!=='undefined'&&MapView.summary&&typeof OMap!=='undefined'&&OMap.forPerson){try{const m=OMap.forPerson(u.id);if(m)map=MapView.summary(m,{own:false,person:u});}catch(e){console.warn(e);}}
  const loved=Object.keys(R).filter(k=>R[k]>=8&&mine[k]>=8).map(byId).filter(Boolean);
  const diff=Object.keys(R).filter(k=>mine[k]!==undefined&&Math.abs(R[k]-mine[k])>=4).map(byId).filter(Boolean).slice(0,4);
  const posts=typeof Posts!=='undefined'&&Posts.by?Posts.by(u.id):[];
  const diffRows=diff.length?`<div class="list-hair">${diff.map(p=>UI.row(p,{sub:esc(`Você: ${UI.ratingLabel(mine[p.id])} · ${first}: ${UI.ratingLabel(R[p.id])}`)})).join('')}</div>`:'';
  const postsHtml=posts.length&&typeof Post!=='undefined'&&Post.grid?(()=>{try{const h=Post.grid(posts);return /class="empty"/.test(h)?'':h;}catch(e){return '';}})():'';
  return `<section class="v-profile" data-view="person" data-tone="papel">${this.header(null,{own:false,person:u})}
<div class="pf-body">${this.compat(u)}${circle||cmp?`<div class="pf-person-acts">${circle}${cmp}</div>`:''}
${this.sigCard(sig,{own:false})}${map?UI.section({eyebrow:'Mapa olfativo',body:map}):''}
${loved.length?UI.section({eyebrow:'Em comum',title:'Perfumes que vocês dois amam',rail:'pf-loved',body:UI.rail(loved.map((p,i)=>`<div class="pf-rail-tile">${UI.tile(p,{i})}</div>`),{name:'pf-loved',label:'Perfumes que vocês dois amam'})}):''}
${diffRows?UI.section({title:'Onde vocês discordam',body:diffRows}):''}
${this.threeNotes({ratings:R},{own:false,label:`As notas que ficam em ${first}`})}
${postsHtml?UI.section({title:'Publicações',body:postsHtml}):''}</div></section>`;},

 /* ---------- interações ---------- */
 setTab(id){const pr=state.profile;if(!this.tabsFor(pr).some(t=>t.id===id)||id===this.tab)return;this.tab=id;
  const seg=document.querySelector('.v-profile [data-seg="profile"]'),panel=document.getElementById('panel-profile');
  if(seg)UI.segSet(seg,id);if(panel){panel.setAttribute('aria-labelledby','tab-profile-'+id);Motion.swap(panel,this.panel(id));}},
 setOcc(id){this.occ=id||'';const box=document.getElementById('pf-notes');
  const chips=document.querySelectorAll('.v-profile [data-action="profile-notes"]');chips.forEach(c=>c.setAttribute('aria-pressed',c.dataset.id===this.occ));
  if(box)Motion.swap(box,this.notesBlock(this.occ?this.notesOf(Select.mapInput(),{occasion:this.occ}):this.notesOf(Select.mapInput())));},
 ratePick(){const go=id=>{if(typeof Rating!=='undefined'&&Rating.open)Rating.open(id);else Router.go('perfume',id);};
  if(typeof Lists!=='undefined'&&Lists.choose)Lists.choose({title:'Avaliar um perfume',exclude:Object.keys(state.ratings),first:[...Select.shelfIds('tried'),...Select.shelfIds('have')],onPick:id=>go(id)});}
};

Router.add('profile',{view:()=>Profile.view(),title:'Perfil',layout:'tab',nav:'profile'});
Router.add('person',{view:id=>Profile.personView(id),title:id=>{const u=Profile.person(id);return u?u.name:'Perfil';},layout:'push',nav:'origin'});
Actions.add({
 'profile-tab':el=>Profile.setTab(el.dataset.id),
 'profile-notes':el=>Profile.setOcc(el.dataset.id),
 'profile-edit':el=>{if(typeof ProfileEdit!=='undefined'&&ProfileEdit.open)ProfileEdit.open({focus:el.dataset.id||''});},
 'profile-rate-pick':()=>Profile.ratePick()
});
