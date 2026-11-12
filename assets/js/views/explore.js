'use strict';
/* Descobrir · Perfumes: catálogo com filtros, ordenação e rolagem em lotes; a folha de filtros (Filters).
   Também guarda os auxiliares que as outras telas de Descobrir usam (cabeçalho comum, estação, ocasião, presença, faixa). */
const Explore={
 KEY:'elixir-explore',BATCH:24,
 SECTIONS:[{id:'explore',label:'Perfumes',href:'#explore'},{id:'ingredients',label:'Notas',href:'#ingredients'},{id:'brands',label:'Marcas',href:'#brands'},{id:'edits',label:'Edições',href:'#edits'}],
 SORTS:[{id:'foryou',label:'Para você'},{id:'trending',label:'Em alta'},{id:'az',label:'A–Z'}],
 OCCASIONS:['Dia a dia','Trabalho','Noite','Encontro','Festa','Evento','Ar livre'],
 CONC:[{id:'colonia',label:'Colônia',match:['Colônia','Deo Colônia','Desodorante Colônia','Body Splash']},{id:'edt',label:'Eau de Toilette',match:['Eau de Toilette']},
  {id:'edp',label:'Eau de Parfum',match:['Eau de Parfum','Deo Parfum','Perfume']},{id:'parfum',label:'Parfum e extrato',match:['Parfum','Extrait de Parfum','Elixir']}],
 AUDIENCE:[{id:'',label:'Qualquer'},{id:'Feminino',label:'Feminino'},{id:'Masculino',label:'Masculino'},{id:'Compartilhável',label:'Compartilhável'}],
 SEASONS:[{id:'',label:'Qualquer'},{id:'Calor',label:'Calor'},{id:'Meia-estação',label:'Meia-estação'},{id:'Frio',label:'Frio'}],
 PRESENCE:[{id:'',label:'Qualquer'},{id:'discreta',label:'Discreta'},{id:'equilibrada',label:'Equilibrada'},{id:'marcante',label:'Marcante'}],
 ORIGIN:[{id:'',label:'Todas'},{id:'nacional',label:'Nacionais'},{id:'importado',label:'Importadas'}],
 TIERS:['','Acessível','Intermediária','Premium','Nicho'],
 vs:null,io:null,_memo:{key:'',list:null},

 /* ---------- estado da tela (sobrevive a voltar, troca de aba e re-render) ---------- */
 blank(){return {color:[],family:[],notes:[],brands:[],conc:[],occasion:[],tier:[],audience:'',season:'',presence:'',origin:'',notOwned:false};},
 clean(f){const b=this.blank(),o=f&&typeof f==='object'?f:{};for(const k of Object.keys(b)){if(Array.isArray(b[k]))b[k]=Array.isArray(o[k])?o[k].map(String).slice(0,80):[];else if(typeof b[k]==='boolean')b[k]=!!o[k];else b[k]=typeof o[k]==='string'?o[k]:'';}return b;},
 state(){if(this.vs)return this.vs;let s=null;try{s=JSON.parse(sessionStorage.getItem(this.KEY)||'null');}catch(e){}
  s=s&&typeof s==='object'?s:{};
  this.vs={q:typeof s.q==='string'?s.q.slice(0,80):'',filters:this.clean(s.filters),sort:this.SORTS.some(x=>x.id===s.sort)?s.sort:'foryou',batches:Math.max(1,Math.min(40,Number(s.batches)||1))};return this.vs;},
 save(){try{sessionStorage.setItem(this.KEY,JSON.stringify(this.vs));}catch(e){}},
 activeCount(f=this.state().filters){let n=0;for(const [k,v] of Object.entries(f))n+=Array.isArray(v)?v.length:v?1:0;return n;},
 filtered(){const vs=this.state();return !!vs.q||this.activeCount()>0;},

 /* ---------- auxiliares de classificação (usam o Advisor quando existir) ---------- */
 mean2(v,idx){const a=idx.map(i=>v[i]||0).sort((x,y)=>y-x);return (a[0]+(a[1]||0))/2;},
 clamp(x){return Math.max(0,Math.min(1,x));},
 season(p){if(typeof Advisor!=='undefined'&&Advisor.season)try{return Advisor.season(p);}catch(e){}
  const v=p.vector||[],fresh=this.mean2(v,[0,1,2,8,9,19]),heavy=this.mean2(v,[7,10,13,14,17,18,11,12]),d=fresh-heavy;
  const warm=this.clamp(.5+d*.7),cold=this.clamp(.5-d*.7),label=d>.22?'Calor':d<-.22?'Frio':fresh>=.45&&heavy>=.45?'Qualquer estação':'Meia-estação';
  return {warm,cold,label};},
 OCC_DIMS:{'Dia a dia':[[0,1],[2,1],[8,1],[15,.8],[19,.8]],Trabalho:[[2,1],[0,.8],[15,1],[3,.8],[19,.6]],Noite:[[14,1],[10,1],[17,.8],[18,.8],[11,.8],[13,.6]],
  Encontro:[[5,1],[17,.8],[14,.8],[15,1],[21,.6]],Festa:[[7,1],[17,1],[6,.8],[14,.6]],Evento:[[3,1],[14,1],[5,.8],[22,.6],[13,.6]],'Ar livre':[[0,1],[1,1],[8,1],[19,.8],[9,.6]]},
 occasionFit(p,occ){if(typeof Advisor!=='undefined'&&Advisor.occasionFit)try{return Advisor.occasionFit(p,occ);}catch(e){}
  const w=this.OCC_DIMS[occ];if(!w)return 0;const v=p.vector||[];let s=0,t=0;for(const [i,k] of w){s+=(v[i]||0)*k;t+=k;}
  const top=Math.max(...w.map(([i])=>v[i]||0));return this.clamp((s/t)*.9+top*.45);},
 /* Presença estimada pela concentração e pelo caráter (relatos reais têm prioridade quando há 3 ou mais). */
 presence(p){const obs=typeof OBSERVATIONS!=='undefined'?OBSERVATIONS.filter(o=>o.id===p.id):[];
  if(obs.length>=3){const m=obs.reduce((s,o)=>s+Number(o.projection||0),0)/obs.length;return {id:m<=2?'discreta':m<=3.4?'equilibrada':'marcante',measured:true};}
  const c=p.concentration||'';let base=/Body Splash|Colônia/i.test(c)?1.2:/Toilette/i.test(c)?2.2:/Extrait|Elixir|^Parfum$/i.test(c)?3.6:/Parfum|Perfume/i.test(c)?3:2.2;
  const v=p.vector||[];base+=this.mean2(v,[7,10,13,14,17,18,11,12])*1.2-this.mean2(v,[0,1,8,19])*.6;
  return {id:base<2.2?'discreta':base<3.2?'equilibrada':'marcante',measured:false};},
 tier(p){let t=null;if(typeof Advisor!=='undefined'&&Advisor.tier)try{t=Advisor.tier(p);}catch(e){}if(!t&&typeof Catalog!=='undefined')t=Catalog.tierOf(p.brand);return t||null;},
 tierLabel(t){const L=typeof TIER_LABELS!=='undefined'&&Array.isArray(TIER_LABELS)?TIER_LABELS:this.TIERS;return t&&L[t]?L[t]:'';},
 national(p){return typeof Catalog!=='undefined'?Catalog.isNational(p):false;},
 hasNote(p,ingId){return typeof Notes!=='undefined'&&Notes.has?Notes.has(p,ingId):false;},
 famName(id){const f=(typeof Catalog!=='undefined'?Catalog.families():[]).find(x=>x.id===id);return f?f.name:id;},

 /* ---------- filtro e ordenação ---------- */
 match(p,f,qset){if(qset&&!qset.has(p.id))return false;
  if(f.color.length&&!f.color.includes(Catalog.colorOf(p)))return false;
  if(f.family.length){const fam=Catalog.families();if(!f.family.some(id=>{const x=fam.find(y=>y.id===id);return x&&(p.vector[x.d]||0)>=.5;}))return false;}
  if(f.notes.length&&!f.notes.some(id=>this.hasNote(p,id)))return false;
  if(f.brands.length&&!f.brands.includes(Catalog.slug(p.brand)))return false;
  if(f.conc.length&&!f.conc.some(id=>{const c=this.CONC.find(x=>x.id===id);return c&&c.match.includes(p.concentration);}))return false;
  if(f.occasion.length&&!f.occasion.some(o=>this.occasionFit(p,o)>=.55))return false;
  if(f.tier.length&&!f.tier.includes(String(this.tier(p)||'')))return false;
  if(f.audience&&p.audience!==f.audience)return false;
  if(f.season){const s=this.season(p);if(f.season==='Calor'&&!(s.warm>=.55||s.label==='Qualquer estação'))return false;
   if(f.season==='Frio'&&!(s.cold>=.55||s.label==='Qualquer estação'))return false;if(f.season==='Meia-estação'&&!['Meia-estação','Qualquer estação'].includes(s.label))return false;}
  if(f.presence&&this.presence(p).id!==f.presence)return false;
  if(f.origin==='nacional'&&!this.national(p))return false;if(f.origin==='importado'&&this.national(p))return false;
  if(f.notOwned&&typeof state!=='undefined'&&state.shelf[p.id]==='have')return false;
  return true;},
 order(sort){if(sort==='az'){const c=new Intl.Collator('pt-BR',{sensitivity:'base'});return [...PERFUMES].sort((a,b)=>c.compare(a.name,b.name)||c.compare(a.brand,b.brand));}
  const ranked=typeof Select!=='undefined'?Select.ranked().map(x=>x.p):PERFUMES;
  if(sort==='trending'){const top=Catalog.trending(PERFUMES.length).filter(Boolean),seen=new Set(top.map(p=>p.id));return [...top,...ranked.filter(p=>!seen.has(p.id))];}
  return ranked;},
 list(f=this.state().filters,{q=this.state().q,sort=this.state().sort}={}){
  const key=JSON.stringify([f,q,sort,typeof Store!=='undefined'?Store.rev:0,PERFUMES.length]);if(this._memo.key===key)return this._memo.list;
  const qset=q?new Set(Catalog.search(q).perfumes.map(p=>p.id)):null;const out=this.order(sort).filter(p=>p&&this.match(p,f,qset));
  this._memo={key,list:out};return out;},

 /* ---------- marcação ---------- */
 kbd(){const mac=/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent||'');return mac?'⌘K':'Ctrl K';},
 /* Cabeçalho comum às 4 seções de Descobrir: título, navegação entre seções e o campo que abre a busca. */
 head(active){return `${UI.pageHead({title:'Descobrir'})}<div class="xp-head">${UI.segNav(this.SECTIONS,active,{label:'Seções de Descobrir',block:true})}<button type="button" class="input xp-field pressable" data-action="search" aria-label="Buscar perfumes, notas, marcas e pessoas">${icon('search','icon--20')}<span class="xp-ph">Buscar perfumes, notas, marcas, pessoas</span><kbd class="xp-kbd" aria-hidden="true">${this.kbd()}</kbd></button></div>`;},
 chipLabels(f=this.state().filters){const out=[],fam=typeof Catalog!=='undefined'?Catalog.families():[];
  for(const id of f.color)out.push(['color',id,'Frasco '+((Catalog.COLORS.find(c=>c.id===id)||{}).label||id).toLowerCase()]);
  for(const id of f.family)out.push(['family',id,(fam.find(x=>x.id===id)||{}).name||id]);
  for(const id of f.notes){const n=typeof Notes!=='undefined'?Notes.get(id):null;out.push(['notes',id,n?n.name:id]);}
  for(const id of f.brands){const b=Catalog.brands().find(x=>x.slug===id);out.push(['brands',id,b?b.name:id]);}
  for(const id of f.conc)out.push(['conc',id,(this.CONC.find(x=>x.id===id)||{}).label||id]);
  for(const id of f.occasion)out.push(['occasion',id,id]);
  for(const id of f.tier)out.push(['tier',id,this.tierLabel(Number(id))||id]);
  if(f.audience)out.push(['audience',f.audience,f.audience]);
  if(f.season)out.push(['season',f.season,f.season]);
  if(f.presence)out.push(['presence',f.presence,'Presença '+(this.PRESENCE.find(x=>x.id===f.presence)||{label:''}).label.toLowerCase()]);
  if(f.origin)out.push(['origin',f.origin,(this.ORIGIN.find(x=>x.id===f.origin)||{}).label]);
  if(f.notOwned)out.push(['notOwned','1','Só o que não tenho']);
  return out;},
 toolsHtml(){const vs=this.state(),n=this.activeCount(),chips=[];
  if(vs.q)chips.push(`<button type="button" class="chip pressable xp-x" data-action="explore-unchip" data-key="q" data-id="" aria-label="Remover busca ${esc(vs.q)}"><span>“${esc(vs.q)}”</span>${icon('close','xp-xi')}</button>`);
  for(const [k,id,label] of this.chipLabels())chips.push(`<button type="button" class="chip pressable xp-x" data-action="explore-unchip" data-key="${esc(k)}" data-id="${esc(id)}" aria-label="Remover filtro ${esc(label)}"><span>${esc(label)}</span>${icon('close','xp-xi')}</button>`);
  const btn=`<button type="button" class="chip pressable xp-fbtn${n?' on':''}" data-action="filter-open" aria-haspopup="dialog" aria-label="${n?`Filtros, ${n} ${n===1?'ativo':'ativos'}`:'Filtros'}">${icon('sliders','xp-xi')}<span>Filtros</span>${n?`<span class="xp-badge" aria-hidden="true">${n}</span>`:''}</button>`;
  return `${btn}${chips.length?`<div class="chips rail-x xp-chips" role="group" aria-label="Filtros ativos">${chips.join('')}</div>`:''}`;},
 /* Por cor do frasco: escolha rápida, um toque liga e desliga. */
 colorsHtml(){const on=this.state().filters.color,cnt=Catalog.colorCounts();
  const items=Catalog.COLORS.filter(c=>cnt[c.id]>=3);if(!items.length)return '';
  const tend=on.length===1?Catalog.colorTendency(on[0]):[];
  return `<div class="xp-colors"><p class="t-eyebrow muted">Por cor do frasco</p><div class="color-rail rail-x" role="group" aria-label="Cor do frasco">${items.map(c=>`<button type="button" class="color-chip pressable" aria-pressed="${on.includes(c.id)}" data-action="explore-color" data-id="${c.id}" style="--c:${c.hex}"><span class="dot" aria-hidden="true"></span><span>${esc(c.label)}</span></button>`).join('')}</div>
${tend.length?`<p class="t-sm muted xp-tend">No catálogo, frascos ${esc((Catalog.COLORS.find(c=>c.id===on[0])||{}).label.toLowerCase())} costumam ser mais ${esc(tend.map(t=>t.toLowerCase()).join(' e '))}. Cor lida da foto, aproximada.</p>`:''}</div>`;},
 countText(n){return n===PERFUMES.length?UI.plural(n,'perfume','perfumes'):`${UI.plural(n,'perfume','perfumes')} de ${UI.count(PERFUMES.length)}`;},
 trendHtml(){const items=Catalog.trending(12).filter(Boolean);if(items.length<3)return '';
  return UI.section({title:'Em alta',rail:'xp-trend',cls:'xp-trend',body:UI.rail(items.map((p,i)=>UI.tile(p,{i})),{name:'xp-trend',label:'Perfumes em alta'})});},
 /* Tiles de [from,to) com uma edição a cada 12 (nunca com filtros ou busca). */
 tiles(list,from,to){const eds=this.filtered()||typeof Editions==='undefined'?[]:Editions.rail();let h='';
  for(let i=from;i<Math.min(to,list.length);i++){if(i>0&&i%12===0&&eds.length)h+=UI.edTile(eds[(i/12-1)%eds.length]);h+=UI.tile(list[i],{i:i-from});}return h;},
 moreHtml(list){const shown=this.state().batches*this.BATCH;if(shown>=list.length)return '';const n=Math.min(this.BATCH,list.length-shown);
  return `<div class="xp-more" data-more>${UI.btn(`Carregar mais ${n}`,{action:'explore-more',variant:'tertiary',icon:'chevron-down'})}</div>`;},
 gridHtml(list=this.list()){if(!list.length)return UI.empty({icon:'filter',title:'Nada com esses filtros',text:'Tire um filtro ou tente outra combinação.',cta:{label:'Limpar filtros',action:'explore-clear'}});
  return `<div class="grid-z stagger xp-grid">${this.tiles(list,0,this.state().batches*this.BATCH)}</div>${this.moreHtml(list)}`;},
 view(){const vs=this.state(),list=this.list();
  return `<section class="v-explore" data-view="explore">${this.head('explore')}
<div id="xp-trend">${this.filtered()?'':this.trendHtml()}</div>
<div id="xp-colors">${this.colorsHtml()}</div>
<div class="xp-bar"><div class="xp-tools" id="xp-tools">${this.toolsHtml()}</div>
<div class="xp-sort">${UI.seg(this.SORTS,vs.sort,'sort-set',{name:'grid',label:'Ordenar por'})}</div></div>
<p class="xp-count t-sm muted" id="xp-count" aria-live="polite">${this.countText(list.length)}</p>
<div id="panel-grid" class="xp-panel" role="tabpanel" aria-labelledby="tab-grid-${esc(vs.sort)}" data-swap="grid">${this.gridHtml(list)}</div>
<p class="xp-credit t-sm muted">Dados de catálogo: <a href="https://www.scento.com/perfume-database" target="_blank" rel="noopener noreferrer">Scento<span class="sr-only"> (abre em nova aba)</span></a> · CC BY 4.0</p></section>`;},

 /* ---------- atualização no lugar ---------- */
 refresh({swap=true}={}){this.save();const list=this.list();const xc=document.getElementById('xp-colors');if(xc)xc.innerHTML=this.colorsHtml();const tools=document.getElementById('xp-tools'),count=document.getElementById('xp-count'),trend=document.getElementById('xp-trend'),panel=document.getElementById('panel-grid');
  if(!panel){return;}
  if(tools)tools.innerHTML=this.toolsHtml();if(count)count.textContent=this.countText(list.length);
  if(trend){const want=!this.filtered();if(want!==!!trend.firstElementChild){trend.innerHTML=want?this.trendHtml():'';if(want)Motion.after(trend);}}
  const p=swap?Motion.swap(panel,this.gridHtml(list)):(panel.innerHTML=this.gridHtml(list),Motion.after(panel),Promise.resolve());
  return p.then(()=>this.watch());},
 more(){const vs=this.state(),list=this.list(),grid=document.querySelector('#panel-grid .xp-grid');if(!grid)return;
  const from=vs.batches*this.BATCH;if(from>=list.length)return;vs.batches++;this.save();
  const a=document.activeElement,fromBtn=!!(a&&a.closest&&a.closest('[data-more]'));
  const tmp=document.createElement('div');tmp.innerHTML=this.tiles(list,from,vs.batches*this.BATCH);const first=tmp.querySelector('.tile');grid.append(...tmp.childNodes);
  const old=document.querySelector('#panel-grid [data-more]');const nm=this.moreHtml(list);if(old){if(nm)old.outerHTML=nm;else old.remove();}
  Motion.after(grid);if(fromBtn&&first)first.focus({preventScroll:true});
  this.watch();},
 /* Sentinela: o próximo lote chega antes do fim da tela (o botão continua para teclado). */
 watch(){if(this.io){this.io.disconnect();this.io=null;}const s=document.querySelector('#panel-grid [data-more]');if(!s||!('IntersectionObserver' in window))return;
  this.io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)&&route.page==='explore')this.more();},{rootMargin:'0px 0px 600px 0px'});this.io.observe(s);},
 after(){this.watch();},
 /* "Ver todos" da busca: aplica a consulta como chip removível. */
 applyQuery(q){const vs=this.state();vs.q=String(q||'').trim().slice(0,80);vs.batches=1;this.save();this._memo.key='';
  if(route.page==='explore'&&document.getElementById('panel-grid')){Router.go('explore');}else Router.go('explore');},
 /* Compatibilidade com telas antigas (perfil v2): cartão de um produto da comunidade. */
 productCard(x){const p=x&&x.catalog?byId(x.catalog):null;return p?UI.tile(p):'';}
};

/* ---------- Folha de filtros ---------- */
const Filters={
 draft:null,allBrands:false,
 radio(name,items,value,label){const i=items.findIndex(x=>x.id===value);
  return `<div class="seg seg--quiet${items.length>=4?' seg--block':''}" role="radiogroup" aria-label="${esc(label)}" data-radios="filter-radio" style="--n:${items.length};--i:${Math.max(0,i)}">${items.map((x,k)=>`<button type="button" role="radio" aria-checked="${x.id===value}" tabindex="${x.id===value||i<0&&k===0?0:-1}" data-action="filter-radio" data-key="${esc(name)}" data-id="${esc(x.id)}">${esc(x.label)}</button>`).join('')}</div>`;},
 chips(key,items,label){const on=this.draft[key];return `<div class="chips" role="group" aria-label="${esc(label||key)}">${items.map(x=>`<button type="button" class="chip pressable" aria-pressed="${on.includes(String(x.id))}" data-action="filter-chip" data-key="${esc(key)}" data-id="${esc(x.id)}">${esc(x.label)}</button>`).join('')}</div>`;},
 group(title,body,{hint=''}={}){return `<section class="fl-group"><h3 class="t-eyebrow muted">${esc(title)}</h3>${hint?`<p class="t-sm muted fl-hint">${esc(hint)}</p>`:''}${body}</section>`;},
 brandItems(){const all=Catalog.brands(),top=[...all].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'pt-BR')).slice(0,12);
  const chosen=this.draft.brands.filter(s=>!top.some(b=>b.slug===s)).map(s=>all.find(b=>b.slug===s)).filter(Boolean);
  return (this.allBrands?all:[...top,...chosen]).map(b=>({id:b.slug,label:b.name}));},
 body(){const d=this.draft,X=Explore,fam=Catalog.families().map(f=>({id:f.id,label:f.name}));
  const notes=typeof Notes!=='undefined'&&Notes.top?Notes.top(18).map(n=>({id:n.id,label:n.name})):[];
  const tiers=[1,2,3,4].filter(t=>PERFUMES.some(p=>X.tier(p)===t)).map(t=>({id:String(t),label:X.tierLabel(t)}));
  const n=X.list(d).length;
  return `<div class="fl-groups">
${this.group('Família',this.chips('family',fam,'Família'))}
${notes.length?this.group('Notas',this.chips('notes',notes,'Notas')):''}
${this.group('Marca',`<div id="fl-brands">${this.chips('brands',this.brandItems(),'Marca')}</div>${UI.btn(this.allBrands?'Mostrar menos':'Todas as marcas',{action:'filter-brands',variant:'tertiary',icon:this.allBrands?'chevron-up':'chevron-down',attrs:`aria-expanded="${this.allBrands}" aria-controls="fl-brands"`})}`)}
${this.group('Público declarado',this.radio('audience',X.AUDIENCE,d.audience,'Público declarado'),{hint:'Como a marca apresenta o perfume. Use o que quiser.'})}
${this.group('Concentração',this.chips('conc',X.CONC,'Concentração'))}
${this.group('Ocasião',this.chips('occasion',X.OCCASIONS.map(o=>({id:o,label:o})),'Ocasião'))}
${this.group('Estação',this.radio('season',X.SEASONS,d.season,'Estação'))}
${this.group('Presença',this.radio('presence',X.PRESENCE,d.presence,'Presença'),{hint:'Estimada pela concentração e pelos relatos.'})}
${tiers.length?this.group('Faixa',this.chips('tier',tiers,'Faixa'),{hint:'Pela marca, não pelo preço.'}):''}
${this.group('Origem',this.radio('origin',X.ORIGIN,d.origin,'Origem'))}
<section class="fl-group">${UI.toggle({name:'notOwned',label:'Só o que não tenho',on:d.notOwned,attrs:'data-change="filter-owned"'})}</section>
</div>
<div class="sheet-foot fl-foot">${UI.btn('Limpar',{action:'filter-reset',variant:'tertiary'})}${UI.btn(n?`Ver ${UI.plural(n,'perfume','perfumes')}`:'Nenhum perfume',{action:'filter-apply',attrs:`id="fl-apply"${n?'':' disabled'}`})}</div>`;},
 open(){Explore.state();this.draft=Explore.clean(Explore.vs.filters);this.allBrands=false;
  Sheet.open({title:'Filtros',body:this.body(),cls:'sh-filter',size:'full'});},
 live(){const b=document.getElementById('fl-apply');if(!b)return;const n=Explore.list(this.draft).length;const s=b.querySelector('span');if(s)s.textContent=n?`Ver ${UI.plural(n,'perfume','perfumes')}`:'Nenhum perfume';b.disabled=!n;},
 apply(){const vs=Explore.state();vs.filters=Explore.clean(this.draft);vs.batches=1;Explore.save();Sheet.close().then(()=>{if(route.page==='explore')Explore.refresh();});}
};

Actions.add({
 'filter-open':()=>Filters.open(),
 'filter-chip':el=>{const k=el.dataset.key,id=el.dataset.id,d=Filters.draft;if(!d||!Array.isArray(d[k]))return;d[k]=d[k].includes(id)?d[k].filter(x=>x!==id):[...d[k],id];el.setAttribute('aria-pressed',d[k].includes(id));Filters.live();},
 'filter-radio':el=>{const k=el.dataset.key,d=Filters.draft;if(!d||typeof d[k]!=='string')return;d[k]=el.dataset.id;UI.segSet(el.closest('[role=radiogroup]'),el.dataset.id);Filters.live();},
 'filter-brands':el=>{Filters.allBrands=!Filters.allBrands;const box=document.getElementById('fl-brands');if(box)box.innerHTML=Filters.chips('brands',Filters.brandItems(),'Marca');
  el.setAttribute('aria-expanded',Filters.allBrands);const s=el.querySelector('span');if(s)s.textContent=Filters.allBrands?'Mostrar menos':'Todas as marcas';const ic=el.querySelector('svg');if(ic)ic.outerHTML=icon(Filters.allBrands?'chevron-up':'chevron-down');},
 'filter-reset':()=>{Filters.draft=Explore.blank();Sheet.update(Filters.body());},
 'filter-apply':()=>Filters.apply(),
 'explore-unchip':el=>{const vs=Explore.state(),k=el.dataset.key,id=el.dataset.id;
  if(k==='q')vs.q='';else if(Array.isArray(vs.filters[k]))vs.filters[k]=vs.filters[k].filter(x=>x!==id);else if(k==='notOwned')vs.filters.notOwned=false;else if(k in vs.filters)vs.filters[k]='';
  vs.batches=1;Explore.refresh();const t=document.querySelector('#xp-tools .xp-fbtn');if(t)t.focus({preventScroll:true});},
 'explore-clear':()=>{const vs=Explore.state();vs.filters=Explore.blank();vs.q='';vs.batches=1;Explore.refresh();},
 'explore-more':()=>Explore.more(),
 'sort-set':el=>{const vs=Explore.state(),id=el.dataset.id;if(vs.sort===id||!Explore.SORTS.some(x=>x.id===id))return;vs.sort=id;vs.batches=1;
  UI.segSet(el.closest('.seg'),id);const panel=document.getElementById('panel-grid');if(panel)panel.setAttribute('aria-labelledby','tab-grid-'+id);Explore.refresh();}
});
Actions.change('filter-owned',el=>{if(Filters.draft){Filters.draft.notOwned=!!el.checked;Filters.live();}});

Router.add('explore',{view:()=>Explore.view(),title:'Descobrir',after:()=>Explore.after()});

Actions.add({'explore-color':el=>{const vs=Explore.state(),id=el.dataset.id,f=vs.filters;f.color=f.color.includes(id)?f.color.filter(x=>x!==id):[...f.color,id];vs.batches=1;Explore.refresh();}});
