'use strict';
/* Hoje (intel, §4.12): qual perfume usar hoje, com o clima real (quando o usuário permite) e o contexto do dia.
   Também a folha Contexto (única editora de state.context) e a folha Escolher cidade (única UI que chama Weather.setCity/locate). */
const OUTFITS=[
 {id:'alfaiataria',label:'Alfaiataria',formal:.9,activity:.1,heat:0,night:0},
 {id:'social',label:'Social',formal:.8,activity:.2,heat:0,night:.3},
 {id:'casual',label:'Casual',formal:.3,activity:.3,heat:0,night:0},
 {id:'esportivo',label:'Esportivo',formal:0,activity:.9,heat:.3,night:0},
 {id:'praia',label:'Praia ou piscina',formal:0,activity:.4,heat:.9,night:0},
 {id:'festa',label:'Festa ou balada',formal:.4,activity:.6,heat:.2,night:.9}];

const Today={
 OCCASIONS:['Dia a dia','Trabalho','Encontro','Evento','Ar livre'],
 PERIODS:[{id:'manha',label:'Manhã'},{id:'tarde',label:'Tarde'},{id:'noite',label:'Noite'}],
 ENVS:[{id:'Fechado',label:'Fechado'},{id:'Aberto',label:'Aberto'}],
 INTENSITIES:[{id:'Discreta',label:'Discreta'},{id:'Equilibrada',label:'Equilibrada'},{id:'Marcante',label:'Marcante'}],
 SP:{name:'São Paulo',lat:-23.55,lon:-46.63},
 tried:new Set(),tempTimer:null,

 /* ---------- dados ---------- */
 hasWeather(){return typeof Weather!=='undefined';},
 reading(){if(!this.hasWeather()||state.location.mode==='none')return null;try{return Weather.cached();}catch(e){return null;}},
 status(){if(!this.hasWeather())return 'none';try{return Weather.status();}catch(e){return 'none';}},
 ctx(){const c=state.context,r=this.reading(),o=OUTFITS.find(x=>x.id===c.outfit)||null;
  const temp=r?Math.round(Number.isFinite(r.feels)?r.feels:r.temp):c.temp;
  return {temp,humidity:r?r.humidity:null,rain:r?r.rain:null,live:!!r,stale:!!(r&&r.stale),occasion:c.occasion,environment:c.environment,period:c.period,time:c.time,
   intensity:c.intensity,outfit:c.outfit,outfitF:o?{formal:o.formal,activity:o.activity,heat:o.heat,night:o.night}:null,today:Select.todayKey(),place:r?(state.location.name||c.city):c.city};},
 /* Pode buscar o tempo sozinho só quando já há um local escolhido; uma tentativa por local e meia hora. */
 autoFetch(){if(!this.hasWeather())return null;const L=state.location;if(L.mode==='none')return null;const r=this.reading();if(r&&!r.stale)return null;
  if(typeof navigator!=='undefined'&&navigator.onLine===false)return null;
  const k=L.lat+','+L.lon+':'+Math.floor(Date.now()/Weather.TTL);if(this.tried.has(k))return null;this.tried.add(k);return Weather.get({render:false});},
 needsFetch(){if(!this.hasWeather())return false;const L=state.location;if(L.mode==='none')return false;const r=this.reading();
  if(r)return false;if(typeof navigator!=='undefined'&&navigator.onLine===false)return false;const k=L.lat+','+L.lon+':'+Math.floor(Date.now()/Weather.TTL);return !this.tried.has(k)||this.status()==='loading';},
 pool(){const have=Select.shelfIds('have').filter(id=>byId(id)),want=Select.shelfIds('want').filter(id=>byId(id));
  if(have.length>=3)return {ids:have,kind:'have',have};
  const ids=[...have,...want];const bad=new Set(Object.keys(state.ratings).filter(id=>state.ratings[id]<=4));
  for(const x of Select.ranked()){if(ids.length>=have.length+want.length+14)break;if(ids.includes(x.p.id)||bad.has(x.p.id)||state.shelf[x.p.id]==='tried')continue;ids.push(x.p.id);}
  return {ids,kind:have.length?'mixed':'catalog',have};},
 rank({n=3}={}){const ctx=this.ctx(),key='today:'+n+':'+JSON.stringify(ctx);
  return Select.memo(key,()=>{const map=Select.map(),w=this.reading(),{ids,kind,have}=this.pool();if(typeof OMap==='undefined'||!ids.length)return {pick:null,alternatives:[],pool:kind};
   const items=ids.map(id=>{const p=byId(id),r=OMap.today(p,map,w,ctx);return {p,score:r.score,reasons:r.reasons,fromCollection:have.includes(p.id)};})
    .sort((a,b)=>b.score-a.score||(a.p.id<b.p.id?-1:1)).slice(0,n);
   for(const x of items){x.explain=map?OMap.explain(x.p,map,{ctx,source:'today'}):null;}
   return {pick:items[0]||null,alternatives:items.slice(1),pool:kind};});},
 pick(){try{this.autoFetch();}catch(e){}try{return this.rank().pick;}catch(e){console.warn(e);return null;}},
 periodLabel(id){return (this.PERIODS.find(x=>x.id===id)||this.PERIODS[1]).label;},
 chipLabel(){const c=this.ctx();return c.live?`${c.temp}° · ${this.periodLabel(c.period)} · ${c.place}`:`${state.context.temp}° · ${state.context.time} · ${state.context.city}`;},

 /* ---------- partes ---------- */
 radios(key,items,value,label){const i=items.findIndex(x=>x.id===value);
  return `<div class="seg seg--quiet seg--block" role="radiogroup" aria-label="${esc(label)}" data-key="${esc(key)}" style="--n:${items.length};--i:${Math.max(0,i)}">${items.map((x,k)=>`<button type="button" role="radio" aria-checked="${x.id===value}" tabindex="${x.id===value||i<0&&k===0?0:-1}" data-action="today-set" data-id="${esc(x.id)}">${esc(x.label)}</button>`).join('')}</div>`;},
 chipGroup(key,items,value,label){return `<div data-key="${esc(key)}">${UI.chips(items.map(x=>({id:x.id,label:x.label,on:x.id===value})),'today-set',{label})}</div>`;},
 /* Controles do dia: os mesmos no Hoje e na folha Contexto (uma função só). */
 controls(c,{compact=false}={}){
  const g=(label,html,hint='')=>`<div class="td-group"><p class="td-label">${esc(label)}</p>${html}${hint?`<p class="td-hint">${esc(hint)}</p>`:''}</div>`;
  return `<div class="td-controls${compact?' td-controls--compact':''}">${[
   g('Ocasião',this.chipGroup('occasion',this.OCCASIONS.map(x=>({id:x,label:x})),c.occasion,'Ocasião')),
   g('Ambiente',this.radios('environment',this.ENVS,c.environment,'Ambiente')),
   g('Período',this.radios('period',this.PERIODS,c.period,'Período')),
   g('Intensidade',this.radios('intensity',this.INTENSITIES,c.intensity,'Intensidade')),
   g('Roupa do dia (opcional)',this.chipGroup('outfit',[{id:'',label:'Nenhuma'},...OUTFITS],c.outfit||'','Roupa do dia'),'Só ajusta frescor e presença. Nunca é regra de estilo.')].join('')}</div>`;},
 stepper(temp,{label='Sem clima real, usamos'}={}){
  return `<div class="td-stepper"><p class="td-manual">${esc(label)} <b class="td-temp" aria-live="polite">${esc(temp)}°</b></p><div class="td-step-btns">${UI.iconBtn('minus',{action:'today-temp',label:'Menos um grau',attrs:'data-d="-1"'})}${UI.iconBtn('plus',{action:'today-temp',label:'Mais um grau',attrs:'data-d="1"'})}</div></div>`;},
 weatherCard(){const st=this.status(),r=this.reading(),L=state.location,loading=this.needsFetch();
  const credit=`<span class="td-credit">Dados do tempo: Open-Meteo</span>`;
  if(r){const name=L.name||state.context.city;
   const meta=[`Sensação ${Math.round(r.feels)}°`,`Umidade ${Math.round(r.humidity)}%`,Number.isFinite(r.max)&&r.max!==null?`Máx ${Math.round(r.max)}°`:'',Number.isFinite(r.min)&&r.min!==null?`Mín ${Math.round(r.min)}°`:'',r.rain!==null&&r.rain!==undefined?`Chuva ${Math.round(r.rain)}%`:''].filter(Boolean);
   return `<article class="data-card td-weather" aria-label="Clima agora"><div class="td-w-head"><p class="t-eyebrow muted">Clima agora</p>${UI.btn('Trocar cidade',{action:'city-open',variant:'tertiary'})}</div>
    <div class="td-w-main">${UI.num(Math.round(r.temp),'°',{w:2})}<div class="td-w-label"><p class="t-h3">${esc(r.label)}</p><p class="t-sm muted">${esc(name)} · atualizado ${esc(UI.when(r.at))}</p></div></div>
    <p class="td-w-meta">${meta.map(x=>`<span>${esc(x)}</span>`).join('')}</p>
    ${r.stale?`<p class="t-sm muted">${st==='offline'||st==='stale'&&!Weather.online()?'Sem conexão: mostrando a última leitura.':'Leitura com mais de 30 minutos. Atualizando quando der.'}</p>`:''}
    <div class="dc-foot">${credit}</div></article>`;}
  if(loading||st==='loading')return `<article class="data-card td-weather" aria-busy="true" aria-label="Buscando o clima"><p class="t-eyebrow muted">Clima agora</p><div class="td-w-main">${UI.skeleton(1,'num')}<p class="t-sm muted">Buscando o tempo em ${esc(L.name||state.context.city)}…</p></div><div class="dc-foot">${credit}</div></article>`;
  const msg=st==='denied'?'Sem acesso à localização. Escolha uma cidade.':st==='offline'?'Sem conexão agora. Você ainda pode informar a temperatura.':st==='error'?'Não foi possível buscar o clima agora.':'';
  if(L.mode!=='none'||msg){
   return `<article class="data-card td-weather" aria-label="Clima"><p class="t-eyebrow muted">Clima</p><p class="t-h3">${esc(msg||'Não foi possível buscar o clima agora.')}</p>${this.stepper(state.context.temp)}<div class="td-w-actions">${UI.btn('Escolher cidade',{action:'city-open',variant:'tertiary'})}</div></article>`;}
  return `<article class="data-card td-weather td-ask" aria-labelledby="td-ask-t"><p class="t-eyebrow muted">Clima</p><h2 class="t-h2" id="td-ask-t">Use o clima de agora</h2>
   <p class="td-ask-text">Para escolher pelo tempo real, precisamos da sua localização aproximada ou de uma cidade. Ela fica só neste aparelho e vai apenas ao serviço de clima.</p>
   <div class="td-w-actions">${UI.btn('Usar minha localização',{action:'city-locate',variant:'secondary',size:'sm',icon:'pin'})}<button type="button" class="chip pressable" data-action="city-sp">São Paulo</button>${UI.btn('Outra cidade',{action:'city-open',variant:'tertiary'})}</div>
   ${this.stepper(state.context.temp)}</article>`;},
 bullets(list){return list&&list.length?`<ul class="td-reasons">${list.map(t=>`<li>${icon('check','icon--20')}<span class="em">${esc(t)}</span></li>`).join('')}</ul>`:'';},
 result(){const R=this.rank(),x=R.pick;
  if(!x)return UI.empty({icon:'sun',title:'Ainda não temos o que sugerir',text:'Avalie alguns perfumes ou coloque os seus em Tenho para receber a sugestão do dia.',cta:{label:'Ir para Tenho',href:'#collection/have'}});
  const done=Select.sotdToday(),p=x.p;
  const primary=done?UI.btn('Ver registro',{href:'#collection/diary',variant:'secondary',size:'sm'}):UI.btn('Usar hoje',{action:'today-use',size:'sm',attrs:`data-id="${esc(p.id)}"`});
  const pick=`<article class="td-pick" aria-labelledby="td-pick-name"><a class="td-plate" href="#perfume/${esc(p.id)}" data-action="perfume" data-id="${esc(p.id)}" aria-label="${esc(p.brand+' '+p.name)}">${UI.photo(p,{eager:true})}</a>
   <div class="td-pick-body"><p class="t-eyebrow muted">${x.fromCollection?'Da sua coleção':'Fora da sua coleção'}</p><p class="td-brand">${esc(p.brand)}</p><h2 class="t-h1" id="td-pick-name">${esc(p.name)}</h2>
    ${this.bullets(x.reasons)}${UI.why(x.explain,{feedback:'today'})}
    <div class="td-actions">${primary}${UI.btn('Ver perfume',{variant:'tertiary',href:'#perfume/'+p.id,icon:'arrow'})}</div></div></article>`;
  const alts=R.alternatives.length?UI.section({eyebrow:'Outras opções',title:'',body:`<div class="list-hair td-alts">${R.alternatives.map(a=>UI.row(a.p,{sub:esc(a.reasons[0]||a.p.brand),trail:a.explain?`<span class="td-chance">${UI.why({chance:a.explain.chance},{compact:true})}</span>`:''})).join('')}</div>`}):'';
  const note=Select.shelfIds('have').length<3?`<div class="td-note"><p>Adicione perfumes em Tenho para escolhas só da sua coleção.</p>${UI.btn('Ir para Tenho',{href:'#collection/have',variant:'tertiary',icon:'arrow'})}</div>`:'';
  return pick+alts+note;},
 view(){const c=state.context;
  return `<section class="v-today" data-view="today">${UI.pageHead({eyebrow:UI.date(new Date(),'eyebrow'),title:'Hoje',sub:'Qual perfume usar hoje?'})}
   <div class="layout-split td-split"><div class="td-main"><div id="today-weather" class="td-weather-slot">${this.weatherCard()}</div><div id="panel-today" class="td-panel" aria-live="polite">${this.result()}</div></div>
   <aside class="aside td-aside" aria-labelledby="td-adjust"><h2 class="t-h3" id="td-adjust">Ajustar o dia</h2>${this.controls(c)}</aside></div></section>`;},
 /* Troca no lugar: o cartão do tempo e/ou o resultado, com o blur curto do Motion.swap. */
 refresh({weather=true,panel=true}={}){if(route.page!=='today')return;const jobs=[];
  if(weather){const w=document.getElementById('today-weather');if(w)jobs.push(Motion.swap(w,this.weatherCard()));}
  if(panel){const p=document.getElementById('panel-today');if(p)jobs.push(Motion.swap(p,this.result()));}return Promise.all(jobs);},
 fetchAndRefresh(promise){const pr=promise||(this.hasWeather()?Weather.get({force:true,render:false}):Promise.resolve(null));
  this.refresh({weather:true,panel:false});return Promise.resolve(pr).then(()=>{if(route.page==='today')this.refresh();else App.render();});},
 after(){const pr=this.autoFetch();if(pr)pr.then(()=>this.refresh());}
};

/* ---------- Contexto (folha) e Escolher cidade (folha) ---------- */
const Context={
 draft:null,cityTimer:null,citySeq:0,cityResults:[],cityActive:-1,
 statusLine(){const r=Today.reading();
  if(r)return `<div class="cx-status"><span class="cx-ico">${icon('sun','icon--20')}</span><p><b>${Math.round(r.temp)}°</b> · ${esc(r.label)} · ${esc(state.location.name||state.context.city)}</p>${UI.btn('Trocar',{action:'city-open',variant:'tertiary'})}</div>`;
  return `<div class="cx-status cx-status--manual"><span class="cx-ico">${icon('cloud','icon--20')}</span>${Today.stepper(this.draft.temp,{label:'Clima manual ·'})}</div>`;},
 body(){const d=this.draft;return `${this.statusLine()}${Today.controls(d,{compact:true})}
  <div class="sheet-foot cx-foot">${UI.btn('Aplicar',{action:'context-apply',size:'block'})}${UI.btn('Abrir o Hoje',{action:'context-today',variant:'tertiary'})}</div>`;},
 open(){this.draft={...state.context};Sheet.open({title:'Contexto do dia',body:this.body(),cls:'sh-context'});},
 apply(){const d=this.draft;if(!d)return Sheet.close();
  Store.update(s=>{for(const k of ['occasion','environment','period','intensity','outfit','temp'])s.context[k]=d[k];s.context.date=Select.todayKey();});
  this.draft=null;Sheet.close();toast('Dia ajustado');},
 /* Escolher cidade: combobox + listbox, sem pedir nada antes de um toque. */
 cityBody(){return `<div class="cy-search"><label class="field"><span id="cy-label">Buscar cidade</span><input id="cy-input" type="search" inputmode="search" autocomplete="off" spellcheck="false" placeholder="Ex.: Recife"
   role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="cy-list" aria-labelledby="cy-label" data-input="city-q"></label></div>
  <div class="cy-quick"><button type="button" class="link-row cy-locate pressable" data-action="city-locate"><span class="ico">${icon('pin','icon--20')}</span><span class="grow"><b>Usar minha localização</b><span>Aproximada, cerca de 1 km.</span></span></button>
   <div class="cy-suggest"><span class="t-sm muted">Sugestão</span><button type="button" class="chip pressable" data-action="city-sp">São Paulo</button></div></div>
  <p class="cy-msg t-sm muted" id="cy-msg" aria-live="polite"></p><ul class="cy-list list-hair" id="cy-list" role="listbox" aria-label="Cidades encontradas"></ul>
  <p class="cy-foot">${icon('lock','icon--20')}<span>A cidade fica salva só neste aparelho.</span></p>`;},
 city(){this.cityResults=[];this.cityActive=-1;Sheet.open({title:'Escolher cidade',body:this.cityBody(),cls:'sh-city',focus:'#cy-input'});},
 renderCities(list,msg=''){const ul=document.getElementById('cy-list'),m=document.getElementById('cy-msg'),inp=document.getElementById('cy-input');if(!ul)return;
  this.cityResults=list;this.cityActive=-1;
  ul.innerHTML=list.map((c,i)=>`<li role="option" id="cy-opt-${i}" aria-selected="false" class="cy-opt pressable" data-action="city-pick" data-i="${i}"><b>${esc(c.name)}</b><span>${esc([c.region,c.country].filter(Boolean).join(' · '))}</span></li>`).join('');
  if(m)m.textContent=msg;if(inp){inp.setAttribute('aria-expanded',list.length?'true':'false');inp.removeAttribute('aria-activedescendant');}},
 query(q){clearTimeout(this.cityTimer);const s=String(q||'').trim();
  if(s.length<2){this.renderCities([],'');return;}
  this.cityTimer=setTimeout(()=>{const seq=++this.citySeq;const m=document.getElementById('cy-msg');if(m)m.textContent='Buscando…';
   if(typeof Weather==='undefined'){this.renderCities([],'Não foi possível buscar cidades agora.');return;}
   Weather.search(s).then(list=>{if(seq!==this.citySeq)return;this.renderCities(list,list.length?(list.length===1?'1 cidade encontrada.':list.length+' cidades encontradas.'):'Não encontramos essa cidade.');})
    .catch(e=>{if(seq!==this.citySeq)return;this.renderCities([],e&&e.message==='offline'?'Sem conexão para buscar cidades. Você ainda pode informar a temperatura.':'Não foi possível buscar cidades agora.');});},300);},
 move(d){const n=this.cityResults.length;if(!n)return;this.cityActive=(this.cityActive+d+n)%n;const inp=document.getElementById('cy-input');
  document.querySelectorAll('#cy-list [role=option]').forEach((o,i)=>{o.setAttribute('aria-selected',i===this.cityActive);if(i===this.cityActive)o.scrollIntoView({block:'nearest'});});
  if(inp)inp.setAttribute('aria-activedescendant','cy-opt-'+this.cityActive);},
 choose(c){if(!c||typeof Weather==='undefined')return;const pr=Weather.setCity(c,{render:false});Sheet.close();toast(`Clima de ${c.name}`);this.done(pr);},
 done(pr){if(route.page==='today')Today.fetchAndRefresh(pr);else Promise.resolve(pr).then(()=>{App.render();if(typeof Settings!=='undefined'&&Settings.refresh)Settings.refresh();});},
 locate(){if(typeof Weather==='undefined')return;const fromSheet=Sheet.isOpen();
  Weather.locate().then(ok=>{if(ok){if(fromSheet)Sheet.close();this.done(Weather.get({force:true,render:false}));}else if(route.page==='today')Today.refresh({weather:true,panel:false});});}
};

/* ---------- ações (today-*, context-*, city-*) ---------- */
Actions.add({
 'today-set':el=>{const g=el.closest('[data-key]');if(!g)return;const key=g.dataset.key,id=el.dataset.id||'';
  const valid={occasion:Today.OCCASIONS,environment:Today.ENVS.map(x=>x.id),period:Today.PERIODS.map(x=>x.id),intensity:Today.INTENSITIES.map(x=>x.id),outfit:['',...OUTFITS.map(x=>x.id)]}[key];
  if(!valid||!valid.includes(id))return;
  const seg=el.closest('.seg');if(seg)UI.segSet(seg,id);else g.querySelectorAll('.chip').forEach(b=>b.setAttribute('aria-pressed',b===el));
  if(el.closest('.sh-context')){if(Context.draft)Context.draft[key]=id;return;}
  Store.update(s=>{s.context[key]=id;s.context.date=Select.todayKey();},{silent:true});
  Motion.swap('#panel-today',Today.result());},
 'today-temp':el=>{const d=Number(el.dataset.d)||0,inSheet=!!el.closest('.sh-context');
  const cur=inSheet&&Context.draft?Context.draft.temp:state.context.temp,next=Math.max(-10,Math.min(45,cur+d));
  const out=el.closest('.td-stepper')&&el.closest('.td-stepper').querySelector('.td-temp');if(out)out.textContent=next+'°';
  if(inSheet){if(Context.draft)Context.draft.temp=next;return;}
  Store.update(s=>{s.context.temp=next;},{silent:true});clearTimeout(Today.tempTimer);
  Today.tempTimer=setTimeout(()=>{if(route.page==='today')Motion.swap('#panel-today',Today.result());},320);},
 'today-use':el=>{const id=el.dataset.id;if(!id)return;if(typeof Compose!=='undefined'&&Compose.sotd)Compose.sotd(id,{ctx:Today.ctx()});else toast('O registro do dia chega em breve.');},
 'context-apply':()=>Context.apply(),
 'context-today':()=>{Context.draft=null;Router.go('today');},
 'city-open':()=>Context.city(),
 'city-sp':()=>{if(typeof Weather==='undefined')return;const pr=Weather.setCity(Today.SP,{render:false});if(Sheet.isOpen())Sheet.close();toast('Clima de São Paulo');Context.done(pr);},
 'city-locate':()=>Context.locate(),
 'city-pick':el=>Context.choose(Context.cityResults[Number(el.dataset.i)])
});
Actions.input('city-q',t=>Context.query(t.value));
document.addEventListener('keydown',e=>{if(!e.target||e.target.id!=='cy-input')return;
 if(e.key==='ArrowDown'){e.preventDefault();Context.move(1);}else if(e.key==='ArrowUp'){e.preventDefault();Context.move(-1);}
 else if(e.key==='Enter'){e.preventDefault();const c=Context.cityResults[Context.cityActive>=0?Context.cityActive:0];if(c)Context.choose(c);}});

Router.add('today',{view:()=>Today.view(),title:'Hoje',layout:'push',nav:'guide',after:()=>Today.after()});
