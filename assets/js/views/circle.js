'use strict';
/* Meu círculo e presentes (intel, REQ §13 e §14): pessoas próximas, mapas comparados por família e o caminho para o presente. */
const Circle={
 MAX:12,wishCache:new Map(),query:'',
 people(){try{return typeof People!=='undefined'&&People.all?People.all():[];}catch(e){return [];}},
 get(id){return this.people().find(p=>p.id===id)||null;},
 first(name){return String(name||'').trim().split(/\s+/)[0]||'';},
 members(){return state.circle.map(id=>this.get(id)).filter(Boolean).map(u=>({id:u.id,name:u.name,handle:u.handle||u.id,image:u.image||'',initials:u.initials||UI.initials(u.name),
  map:u.shareMap!==false&&typeof OMap!=='undefined'?OMap.forPerson(u.id):null,shareMap:u.shareMap!==false,source:u.source||''}));},
 has(id){return state.circle.includes(id);},
 /* Liga/desliga no círculo; corrige todos os botões [data-circle=id] no lugar; toast com Desfazer. */
 toggle(id){const u=this.get(id);if(!u)return;const on=!this.has(id);
  if(on&&state.circle.length>=this.MAX){toast('Seu círculo tem no máximo 12 pessoas.');return;}
  const prev=[...state.circle];
  const apply=list=>{Store.update(s=>{s.circle=list;},{silent:true});this.patch(id);if(['circle'].includes(route.page))this.repaint();};
  apply(on?[...prev,id]:prev.filter(x=>x!==id));
  toast(on?`${this.first(u.name)} entrou no seu círculo`:`${this.first(u.name)} saiu do seu círculo`,{undo:()=>apply(prev)});},
 patch(id){const on=this.has(id);
  for(const b of document.querySelectorAll(`[data-circle="${CSS.escape(id)}"]`)){b.setAttribute('aria-pressed',on);const t=b.querySelector('span')||b;
   t.textContent=on?(b.dataset.on||'No seu círculo'):(b.dataset.off||'Adicionar ao círculo');}},
 repaint(){if(route.page!=='circle')return;const main=document.querySelector('.v-circle .ci-body');
  if(main&&!route.id){Motion.swap(main,this.listBody());return;}
  if(route.id){const a=document.querySelector('.v-circle .ci-actions');if(a){const t=document.createElement('div');t.innerHTML=this.personActions(this.get(route.id));a.replaceWith(t.firstElementChild);}}},
 /* Desejos de demonstração: os 4 melhores não avaliados pela pessoa, pelo mapa dela. Determinístico. */
 wishlist(id){const key=id+':'+(typeof PERFUMES!=='undefined'?PERFUMES.length:0);if(this.wishCache.has(key))return this.wishCache.get(key);
  const u=this.get(id);if(!u||typeof OMap==='undefined'){return [];}const map=OMap.forPerson(id);if(!map)return [];
  const rated=new Set(Object.keys(u.ratings||{}));
  const pre=PERFUMES.filter(p=>p.image&&!rated.has(p.id)).map(p=>{const a=OMap.axesOf(p);let s=0;map.axes.forEach((x,i)=>{s+=(x.value-.5)*a[i];});return {p,s};})
   .sort((a,b)=>b.s-a.s||(a.p.id<b.p.id?-1:1)).slice(0,24);
  const list=pre.map(x=>({p:x.p,c:OMap.chance(x.p,map)})).sort((a,b)=>b.c-a.c||(a.p.id<b.p.id?-1:1)).slice(0,4).map(x=>x.p);
  this.wishCache.set(key,list);return list;},
 shared(id){const u=this.get(id);if(!u)return {loved:[],wanted:[]};const R=u.ratings||{};
  const loved=Object.keys(state.ratings).filter(pid=>state.ratings[pid]>=8&&R[pid]>=8).map(byId).filter(Boolean);
  const wish=new Set(this.wishlist(id).map(p=>p.id));const wanted=Select.shelfIds('want').filter(pid=>wish.has(pid)).map(byId).filter(Boolean);
  return {loved,wanted};},
 favorites(u){const R=u.ratings||{},ids=[...(u.picks||[]),...Object.keys(R).filter(k=>R[k]>=9).sort((a,b)=>R[b]-R[a]||(a<b?-1:1))];
  return [...new Set(ids.map(byId).filter(Boolean).map(p=>p.id))].slice(0,8).map(byId);},
 line(m){if(!m.shareMap)return 'Não compartilha o mapa';if(typeof OMap==='undefined')return '';
  try{const c=OMap.compat(Select.map(),state.ratings,m.id);if(!c||!c.enough)return 'Poucos perfumes em comum';
   if(c.agree.length){const a=MAP_AXES.find(x=>x.id===c.agree[0]);return 'Concordam em '+OMap.lower(a.label)+(a.label.endsWith('o')?'s':'');}
   if(c.disagree.length){const a=MAP_AXES.find(x=>x.id===c.disagree[0]);return 'Discordam em '+OMap.lower(a.label);}return 'Gostos próximos';}catch(e){return '';}},
 /* ---------- lista ---------- */
 personRow(m){return `<a class="ci-person pressable" href="#circle/${esc(m.id)}">${UI.avatar(m,'')}<span class="grow"><b>${esc(m.name)}</b><span>@${esc(m.handle)} · ${esc(this.line(m))}</span></span>${icon('chevron-right','icon--20')}</a>`;},
 giftRows(){const site=typeof PROFILE_RULES!=='undefined'&&PROFILE_RULES.giftSite?PROFILE_RULES.giftSite:'https://gabrielkopi.github.io/presente/';
  return `<div class="list-hair">${UI.linkRow({icon:'gift',title:'Escolher um presente',sub:'Para alguém do círculo ou mesmo sabendo pouco do gosto.',href:'#guide/gift/0'})}
   ${UI.linkRow({icon:'arrow-up-right',title:'Minha lista de presentes',sub:'Abre o site separado com a minha lista de presentes.',href:site,external:true})}</div>`;},
 listBody(){const ms=this.members();
  const people=ms.length?UI.section({eyebrow:'Pessoas',title:'',body:`<div class="list-hair ci-people stagger">${ms.map(m=>this.personRow(m)).join('')}</div>
    <div class="ci-add">${UI.btn('Adicionar pessoa',{action:'circle-add',variant:'secondary',size:'sm',icon:'plus'})}<span class="t-sm muted">Pessoas de demonstração</span></div>`})
   :UI.empty({icon:'people',title:'Seu círculo está vazio',text:'Adicione amigos e família para comparar gostos e acertar no presente.',cta:{label:'Adicionar pessoa',action:'circle-add'}});
  const want=new Set(Select.shelfIds('want'));const common=[];
  for(const m of ms)for(const p of this.wishlist(m.id))if(want.has(p.id)&&!common.some(x=>x.p.id===p.id))common.push({p,m});
  const rail=common.length?UI.section({eyebrow:'Demonstração',title:'Desejos em comum',rail:'ci-common',body:UI.rail(common.map((x,i)=>UI.tile(x.p,{i,sub:`${UI.avatar(x.m,'xs')} ${esc(this.first(x.m.name))} também quer`})),{name:'ci-common',label:'Desejos em comum'})}):'';
  return people+rail+UI.section({eyebrow:'Presentes',title:'',body:this.giftRows()})+`<p class="ci-privacy">${icon('lock','icon--20')}<span>Você vê só o que cada pessoa autorizou.</span></p>`;},
 listView(){return `<section class="v-circle" data-view="circle">${UI.pageHead({eyebrow:'Guia',title:'Meu círculo',sub:'Compare gostos com quem você conhece e acerte no presente.'})}<div class="ci-body">${this.listBody()}</div></section>`;},
 /* ---------- comparar mapas ---------- */
 personActions(u){const name=this.first(u.name),inC=this.has(u.id);
  return `<div class="ci-actions">${UI.btn('Presentear '+name,{action:'circle-gift',attrs:`data-id="${esc(u.id)}"`,icon:'gift'})}
   ${inC?UI.btn('Remover do círculo',{action:'circle-remove',variant:'tertiary',attrs:`data-id="${esc(u.id)}"`}):UI.btn('Adicionar ao círculo',{action:'circle-toggle',variant:'secondary',attrs:`data-id="${esc(u.id)}" data-circle="${esc(u.id)}" aria-pressed="false"`})}</div>`;},
 tiles(list,label,name){return UI.rail(list.map((p,i)=>UI.tile(p,{i})),{name,label});},
 personView(id){const u=this.get(id);
  if(!u)return `<section class="v-circle" data-view="circle">${UI.pageHead({eyebrow:'Meu círculo',title:'Comparar mapas'})}${UI.empty({icon:'people',title:'Não encontramos este perfil',text:'O link pode estar errado ou a pessoa saiu da demonstração.',cta:{label:'Ir para o Guia',href:'#guide'}})}</section>`;
  const name=this.first(u.name),sh=this.shared(id),fav=this.favorites(u).filter(p=>!sh.loved.some(x=>x.id===p.id)),wish=this.wishlist(id);
  const pair=`<span class="ci-pair" aria-hidden="true">${UI.avatar(null,'lg')}${UI.avatar(u,'lg')}</span>`;
  const compat=typeof MapView!=='undefined'?MapView.compat(id):'';
  const rails=[
   sh.loved.length?UI.section({eyebrow:'Em comum',title:'Vocês dois amam',rail:'ci-loved',body:this.tiles(sh.loved,'Vocês dois amam','ci-loved')}):'',
   fav.length?UI.section({eyebrow:'Favoritos',title:'Favoritos de '+name,rail:'ci-fav',body:this.tiles(fav,'Favoritos de '+name,'ci-fav')}):'',
   wish.length?UI.section({eyebrow:'Demonstração',title:'Desejos de '+name,rail:'ci-wish',body:this.tiles(wish,'Desejos de '+name,'ci-wish')}):'',
   sh.wanted.length?UI.section({eyebrow:'Em comum',title:'Vocês dois querem',rail:'ci-want',body:this.tiles(sh.wanted,'Vocês dois querem','ci-want')}):''].join('');
  return `<section class="v-circle" data-view="circle">${UI.pageHead({eyebrow:'Meu círculo',title:'Você e '+name,actions:pair})}
   ${this.personActions(u)}${compat?`<article class="data-card ci-compat">${compat}</article>`:''}${rails}
   <p class="ci-privacy">${icon('lock','icon--20')}<span>Você vê só o que ${esc(name)} autorizou. Pessoa de demonstração.</span></p></section>`;},
 view(id){return id?this.personView(id):this.listView();},
 /* ---------- Adicionar ao círculo (folha) ---------- */
 candidates(q=''){const k=typeof Catalog!=='undefined'&&Catalog.norm?Catalog.norm(q):String(q).toLowerCase();
  const norm=s=>typeof Catalog!=='undefined'&&Catalog.norm?Catalog.norm(s):String(s||'').toLowerCase();
  const list=this.people().filter(u=>!k||norm(u.name).includes(k)||norm(u.handle||'').includes(k.replace(/^@/,'')));
  const f=new Set(state.following);return list.sort((a,b)=>(f.has(b.id)?1:0)-(f.has(a.id)?1:0)||a.name.localeCompare(b.name,'pt'));},
 addRows(q=''){const list=this.candidates(q);
  if(!list.length)return `<p class="ca-empty t-sm muted">Ninguém com esse nome por aqui.</p>`;
  return list.map(u=>{const on=this.has(u.id);return `<div class="ca-row">${UI.avatar(u,'')}<span class="grow"><b>${esc(u.name)}</b><span>@${esc(u.handle||u.id)}${state.following.includes(u.id)?' · você segue':''}</span></span>
   <button type="button" class="chip pressable" data-action="circle-toggle" data-id="${esc(u.id)}" data-circle="${esc(u.id)}" data-on="No círculo" data-off="Adicionar" aria-pressed="${on}" aria-label="${esc(u.name)}: ${on?'no círculo':'adicionar'}"><span>${on?'No círculo':'Adicionar'}</span></button></div>`;}).join('');},
 openAdd(){this.query='';Sheet.open({title:'Adicionar ao círculo',cls:'sh-circle-add',focus:'#ca-q',
  body:`<label class="field ca-search"><span>Buscar por nome ou @</span><input id="ca-q" type="search" autocomplete="off" spellcheck="false" data-input="circle-q" placeholder="Ex.: Sofia"></label><div class="ca-list list-hair" aria-live="polite">${this.addRows()}</div>`});},
 gift(id){const u=this.get(id);if(!u)return;
  Store.update(s=>{s.guide={mode:'gift',step:1,giftFor:id,giftStyles:[],answers:{occasions:[],climate:'',presence:'',allDay:false,families:{},avoidNotes:[],tier:'',audience:''},updatedAt:Date.now()};},{silent:true});
  Router.go('guide','gift/1');}
};

Actions.add({
 'circle-toggle':el=>{const id=el.dataset.id||el.dataset.circle;if(!id)return;Circle.toggle(id);
  if(el.closest('.sh-circle-add')){const on=Circle.has(id);el.setAttribute('aria-label',`${(Circle.get(id)||{}).name||''}: ${on?'no círculo':'adicionar'}`);}},
 'circle-remove':el=>Circle.toggle(el.dataset.id),
 'circle-add':()=>Circle.openAdd(),
 'circle-gift':el=>Circle.gift(el.dataset.id)
});
Actions.input('circle-q',t=>{Circle.query=t.value;const l=document.querySelector('#sheet .ca-list');if(l)l.innerHTML=Circle.addRows(t.value);});

Router.add('circle',{view:id=>Circle.view(id),title:id=>{if(!id)return 'Meu círculo';const u=Circle.get(id);return u?'Você e '+Circle.first(u.name):'Meu círculo';},layout:'push',nav:'guide'});
