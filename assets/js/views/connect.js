'use strict';
/* ELIXIR Connect (intel, REQ §15): levar o mapa a uma loja por pouco tempo, com QR Code, contagem regressiva e revogação.
   Demonstração no mesmo aparelho: o token viaja no fragmento da URL (#connect/store/<token>), que o navegador nunca envia a um servidor. */
const Connect={
 KEYS:['v','s','exp','m','a','h','r','t'],
 SCOPES:[{id:'map',label:'Mapa olfativo',sub:'Suas famílias e características, com o nível de confiança.'},{id:'have',label:'Perfumes que tenho',sub:'Até 8, os mais recentes.'},
  {id:'avoid',label:'Notas que evito',sub:'Para a loja não oferecer o que você não usa.'},{id:'ratings',label:'Minhas avaliações',sub:'Até 8 notas que você deu.'},{id:'budget',label:'Faixa de orçamento',sub:'Por marca, não por preço.'}],
 SHARED_LABEL:{map:'Mapa olfativo',have:'Perfumes que tem',avoid:'Notas que evita',ratings:'Avaliações',budget:'Faixa de orçamento'},
 TIERS:[{id:'1',label:'Acessível'},{id:'2',label:'Intermediária'},{id:'3',label:'Premium'},{id:'4',label:'Nicho'}],
 DURATIONS:[{id:'10',label:'10 min'},{id:'30',label:'30 min'},{id:'120',label:'2 h'}],
 tier:2,ended:false,timer:null,lastMinute:-1,stockCache:null,filters:{},trimmed:false,
 /* ---------- token ---------- */
 b64(str){const bytes=unescape(encodeURIComponent(str));return btoa(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');},
 unb64(t){const s=String(t).replace(/-/g,'+').replace(/_/g,'/');return decodeURIComponent(escape(atob(s+'==='.slice((s.length+3)%4))));},
 token(payload){return this.b64(JSON.stringify(payload));},
 read(token){try{if(!token||!/^[A-Za-z0-9_-]{8,700}$/.test(token))return null;const o=JSON.parse(this.unb64(token));
  if(!o||typeof o!=='object'||Array.isArray(o)||o.v!==1||typeof o.s!=='string'||!Number.isFinite(o.exp))return null;
  if(Object.keys(o).some(k=>!this.KEYS.includes(k)))return null;return o;}catch(e){return null;}},
 /* ---------- QR (só o subconjunto addData/make/getModuleCount/isDark) ---------- */
 qrSvg(text){if(typeof qrcode==='undefined')return '';const q=qrcode(0,'M');q.addData(text);q.make();const n=q.getModuleCount();let d='';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+=`M${c} ${r}h1v1h-1z`;
  return `<svg class="qr" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="QR Code do acesso temporário" xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`;},
 base(){const l=location;return (l.protocol==='file:'?'file://':l.origin)+l.pathname;},
 /* ---------- sessões ---------- */
 scopesOn(){const S=state.connect.scopes,pv=state.settings.privacy;return this.SCOPES.map(x=>x.id).filter(k=>S[k]&&!(k==='map'&&!pv.shareMap)&&!(k==='have'&&!pv.shareCollection));},
 active(){const now=Date.now();return state.connect.sessions.find(s=>!s.revokedAt&&s.exp>now)||null;},
 start({scopes=this.scopesOn(),minutes=state.connect.minutes}={}){const now=Date.now(),id='c'+now.toString(36)+Math.random().toString(36).slice(2,6);
  const sc=[...scopes];if(sc.includes('budget'))sc.push('t'+this.tier);
  const session={id,createdAt:now,exp:now+minutes*60000,scopes:sc,revokedAt:0};
  Store.update(s=>{s.connect.sessions=[session,...s.connect.sessions].slice(0,5);},{silent:true});this.ended=false;return session;},
 revoke(id){Store.update(s=>{const x=s.connect.sessions.find(y=>y.id===id);if(x&&!x.revokedAt)x.revokedAt=Date.now();},{silent:true});},
 /* O conteúdo vem do estado atual e das escolhas da sessão; nada do conteúdo é guardado. Sem nome, @ ou foto. */
 avoidNotes(){const out=[...state.preferences.dislikedNotes];const R=state.ratings;
  const pos=new Set();for(const id of Object.keys(R))if(R[id]>=6){const p=byId(id);if(p)for(const w of p.noteWeights||[])pos.add(w.name.toLowerCase());}
  for(const id of Object.keys(R).filter(id=>R[id]<=2).sort()){const p=byId(id);if(!p)continue;for(const w of (p.noteWeights||[]).filter(w=>w.weight>=.85))if(!pos.has(w.name.toLowerCase())&&!out.some(x=>x.toLowerCase()===w.name.toLowerCase()))out.push(w.name);}
  return out.slice(0,6);},
 payload(session){const sc=session.scopes||[],pl={v:1,s:session.id,exp:Math.floor(session.exp/1000)},pv=state.settings.privacy;
  if(sc.includes('map')&&pv.shareMap){const map=Select.map();if(map){const top=map.axes.map((a,i)=>({a,i})).filter(x=>x.a.level!=='sem-dados').sort((x,y)=>Math.abs(y.a.value-.5)-Math.abs(x.a.value-.5)||x.i-y.i).slice(0,8).sort((x,y)=>x.i-y.i);
   if(top.length)pl.m=top.map(x=>[x.i,Math.round(x.a.value*100)]);}}
  if(sc.includes('avoid')){const a=this.avoidNotes();if(a.length)pl.a=a;}
  if(sc.includes('have')&&pv.shareCollection){const h=Select.shelfIds('have').slice(0,8);if(h.length)pl.h=h;}
  if(sc.includes('ratings')){const r=Object.keys(state.ratings).sort((a,b)=>(state.ratedAt[b]||0)-(state.ratedAt[a]||0)||(a<b?-1:1)).slice(0,8).map(id=>[id,state.ratings[id]]);if(r.length)pl.r=r;}
  const t=sc.find(x=>/^t[1-4]$/.test(x));if(sc.includes('budget')&&t)pl.t=Number(t.slice(1));
  this.trimmed=false;let tok=this.token(pl);
  while(tok.length>480&&((pl.r&&pl.r.length)||(pl.h&&pl.h.length))){if(pl.r&&pl.r.length){pl.r.pop();if(!pl.r.length)delete pl.r;}else{pl.h.pop();if(!pl.h.length)delete pl.h;}this.trimmed=true;tok=this.token(pl);}
  return pl;},
 url(token){return this.base()+'#connect/store/'+token;},
 /* Estoque de demonstração: determinístico, só perfumes com foto. */
 stock(){if(this.stockCache&&this.stockCache.n===PERFUMES.length)return this.stockCache.list;
  const list=PERFUMES.filter(p=>p.image).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0).filter((_,i)=>i%4===0).slice(0,30);this.stockCache={n:PERFUMES.length,list};return list;},
 rank(payload,{tier=null,occasion='',trait=''}={}){if(typeof OMap==='undefined')return {items:[],basis:'popular'};return OMap.storeRank(payload,this.stock(),{tier,occasion,trait});},
 /* ---------- painéis ---------- */
 radios(name,items,value,label){const i=items.findIndex(x=>x.id===value);
  return `<div class="seg seg--quiet seg--block" role="radiogroup" aria-label="${esc(label)}" style="--n:${items.length};--i:${Math.max(0,i)}">${items.map((x,k)=>`<button type="button" role="radio" aria-checked="${x.id===value}" tabindex="${x.id===value||i<0&&k===0?0:-1}" data-action="${esc(name)}" data-id="${esc(x.id)}">${esc(x.label)}</button>`).join('')}</div>`;},
 consent(){const S=state.connect.scopes,pv=state.settings.privacy,on=this.scopesOn();
  const rows=this.SCOPES.map(x=>{const off=(x.id==='map'&&!pv.shareMap)||(x.id==='have'&&!pv.shareCollection);
   return UI.toggle({name:x.id,label:x.label,on:!off&&S[x.id],sub:off?'Desligado em Privacidade':x.sub,attrs:`data-change="connect-scope"${off?' disabled':''}`});}).join('');
  const preview=this.payloadPreview();
  return `<div class="cn-consent"><h2 class="t-h3">O que compartilhar</h2><div class="list-hair cn-scopes">${rows}</div>
   <div class="cn-budget"${S.budget&&on.includes('budget')?'':' hidden'}><p class="cn-label">Faixa de orçamento</p>${this.radios('connect-tier',this.TIERS,String(this.tier),'Faixa de orçamento')}</div>
   <div class="cn-dur"><p class="cn-label">Duração</p>${this.radios('connect-minutes',this.DURATIONS,String(state.connect.minutes),'Duração do acesso')}</div>
   <p class="cn-promise">${icon('lock','icon--20')}<span>Nunca enviamos seu nome, @ ou foto. A loja não guarda nada depois que o acesso termina.</span></p>
   ${preview}
   <div class="cn-go">${UI.btn('Gerar QR Code',{action:'connect-start',size:'block',icon:'qr',attrs:on.length?'':'disabled aria-describedby="cn-hint"'})}<p class="t-sm muted" id="cn-hint"${on.length?' hidden':''}>Escolha pelo menos um item.</p></div></div>`;},
 payloadPreview(){const on=this.scopesOn();if(!on.length)return '';const fake={id:'preview',exp:Date.now()+state.connect.minutes*60000,scopes:on.includes('budget')?[...on,'t'+this.tier]:on};this.payload(fake);
  return this.trimmed?`<p class="t-sm muted cn-trim">Mostrando só os 8 mais recentes.</p>`:'';},
 clock(ms){const s=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60,z=n=>String(n).padStart(2,'0');return h?`${h}:${z(m)}:${z(x)}`:`${z(m)}:${z(x)}`;},
 activePanel(sess){const pl=this.payload(sess),tok=this.token(pl),url=this.url(tok),left=sess.exp-Date.now(),mins=Math.max(1,Math.ceil(left/60000));
  const at=new Date(sess.exp).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const shared=(sess.scopes||[]).filter(k=>this.SHARED_LABEL[k]).map(k=>`<span class="chip">${esc(k==='budget'&&pl.t?'Orçamento: '+this.TIERS[pl.t-1].label:this.SHARED_LABEL[k])}</span>`).join('');
  return `<div class="cn-active"><figure class="cn-qr">${this.qrSvg(url)}<figcaption class="t-sm muted">Mostre este código na loja. Ele abre só o que você autorizou.</figcaption></figure>
   <div class="cn-timer"><p class="countdown" aria-hidden="true" data-exp="${sess.exp}">${this.clock(left)}</p><p class="t-sm muted">Expira às ${esc(at)}</p><p class="sr-only cn-live" aria-live="polite">Expira em ${mins} ${mins===1?'minuto':'minutos'}</p></div>
   <div class="cn-shared"><p class="cn-label">A loja vê</p><div class="chips">${shared}</div>${this.trimmed?'<p class="t-sm muted">Mostrando só os 8 mais recentes.</p>':''}</div>
   <div class="cn-actions">${UI.btn('Ver como a loja vê',{href:'#connect/store/'+tok,variant:'secondary',icon:'eye'})}${UI.btn('Encerrar acesso',{action:'connect-revoke',variant:'danger',attrs:`data-id="${esc(sess.id)}"`})}</div></div>`;},
 endedPanel(){return UI.empty({icon:'lock',title:'Acesso encerrado',text:'A loja não vê mais nada. Gere um novo QR Code quando quiser.',cta:{label:'Gerar novo QR Code',action:'connect-new'}});},
 panel(){const a=this.active();if(a)return this.activePanel(a);if(this.ended)return this.endedPanel();return this.consent();},
 history(){const list=state.connect.sessions;if(!list.length)return '';const now=Date.now();
  const rows=list.map(s=>{const st=s.revokedAt?'Encerrado':s.exp<=now?'Expirado':'Ativo',mins=Math.round((s.exp-s.createdAt)/60000);
   return `<li class="cn-hist"><span class="grow"><b>${esc(UI.when(s.createdAt))}</b><span>${esc(mins>=60?Math.round(mins/60)+' h':mins+' min')} · ${esc((s.scopes||[]).filter(k=>this.SHARED_LABEL[k]).map(k=>this.SHARED_LABEL[k]).join(', ')||'nada')}</span></span><span class="cn-status${st==='Ativo'?' on':''}">${st}</span></li>`;}).join('');
  return UI.section({eyebrow:'Histórico',title:'Acessos recentes',body:`<ul class="list-hair cn-history">${rows}</ul><p class="t-sm muted">O conteúdo de cada acesso não fica guardado.</p>`});},
 view(id){if(/^store\//.test(id||''))return this.storeView(id.slice(6));
  return `<section class="v-connect" data-view="connect">${UI.pageHead({eyebrow:'Guia',title:'ELIXIR Connect',sub:'Leve seu mapa a uma loja por pouco tempo. Você escolhe o que mostrar e encerra quando quiser.'})}
   <div id="panel-connect" class="cn-panel">${this.panel()}</div><div class="cn-hist-slot">${this.history()}</div>
   <footer class="cn-foot"><p>Demonstração: nesta versão, a loja é simulada neste aparelho.</p><p>Conteúdo patrocinado, quando existir, será sempre sinalizado e nunca muda a compatibilidade nem a ordem.</p></footer></section>`;},
 swapPanel(){const p=document.getElementById('panel-connect');const h=document.querySelector('.v-connect .cn-hist-slot');
  if(h)h.innerHTML=this.history();if(p)return Motion.swap(p,this.panel()).then(()=>this.startTimer());return Promise.resolve();},
 /* Um único setInterval; para sozinho fora da rota ou sem o .countdown na página. */
 startTimer(){clearInterval(this.timer);this.timer=null;this.lastMinute=-1;if(!document.querySelector('.v-connect .countdown'))return;this.timer=setInterval(()=>this.tick(),1000);this.tick(true);},
 tick(first=false){const el=document.querySelector('.v-connect .countdown');
  if(route.page!=='connect'||/^store\//.test(route.id||'')||!el){clearInterval(this.timer);this.timer=null;return;}
  const left=Number(el.dataset.exp)-Date.now();
  if(left<=0){clearInterval(this.timer);this.timer=null;this.ended=true;this.swapPanel();return;}
  el.textContent=this.clock(left);const mins=Math.ceil(left/60000);
  if(mins!==this.lastMinute){const live=document.querySelector('.v-connect .cn-live');if(live&&!first)live.textContent=`Expira em ${mins} ${mins===1?'minuto':'minutos'}`;this.lastMinute=mins;}},
 /* ---------- modo loja (o que o atendente vê) ---------- */
 FILTERS:{
  tier:[{id:'1',label:'Acessível'},{id:'2',label:'Intermediária'},{id:'3',label:'Premium'},{id:'4',label:'Nicho'}],
  occasion:[{id:'Dia a dia',label:'Dia a dia'},{id:'Trabalho',label:'Trabalho'},{id:'Encontro',label:'Encontro'},{id:'Evento',label:'Evento'},{id:'Ar livre',label:'Ar livre'}],
  trait:[{id:'fresco',label:'Fresco'},{id:'doce',label:'Doce'},{id:'amadeirado',label:'Amadeirado'},{id:'especiado',label:'Especiado'},{id:'floral',label:'Floral'},{id:'citrico',label:'Cítrico'}]},
 valid(pl){if(!pl)return false;if(pl.exp*1000<=Date.now())return false;const s=state.connect.sessions.find(x=>x.id===pl.s);if(s&&(s.revokedAt||s.exp<=Date.now()))return false;return true;},
 storeFilters(token,pl){if(!this.filters[token])this.filters[token]={tier:pl.t?String(pl.t):'',occasion:'',trait:''};return this.filters[token];},
 storeList(token,pl){const f=this.storeFilters(token,pl),R=this.rank(pl,{tier:f.tier?Number(f.tier):null,occasion:f.occasion,trait:f.trait});
  const basis={map:'Ordenado pelo mapa autorizado',ratings:'Sem mapa autorizado: ordem pelas avaliações compartilhadas',popular:'Sem dados autorizados: os mais bem avaliados do estoque'}[R.basis];
  if(!R.items.length)return `<p class="st-basis t-sm muted">${esc(basis)}</p>${UI.empty({icon:'filter',title:'Nada no estoque com esses filtros',text:'Tire um filtro para ver mais opções.',cta:{label:'Limpar filtros',action:'store-clear'}})}`;
  return `<p class="st-basis t-sm muted">${esc(basis)} · ${UI.plural(R.items.length,'perfume','perfumes')}</p><ol class="st-list list-hair">${R.items.map((x,i)=>{const p=x.p;
   return `<li class="st-row${x.owned?' owned':''}" style="--i:${Math.min(i,8)}"><a class="st-main pressable" href="#perfume/${esc(p.id)}"><span class="st-thumb plate">${p.image?`<img src="${esc(p.image)}" alt="" loading="lazy" decoding="async" data-brand="${esc(p.brand)}" data-name="${esc(p.name)}">`:''}</span>
    <span class="grow"><span class="st-brand">${esc(p.brand)}</span><b>${esc(p.name)}</b><span class="st-why">${esc(x.owned?'O cliente já tem.':x.why)}</span></span></a>
    <span class="st-pct">${x.owned?'<span class="t-sm muted">Já tem</span>':`<b>${x.pct}%</b><span>Compatibilidade</span>`}</span></li>`;}).join('')}</ol>`;},
 storeView(token){const pl=this.read(token);
  const close=`<div class="st-close">${UI.iconBtn('close',{action:'store-close',label:'Fechar modo loja'})}</div>`;
  if(!this.valid(pl))return `<section class="v-store" data-view="store">${close}${UI.empty({icon:'lock',title:'Este acesso expirou ou foi encerrado',text:'Peça ao cliente um novo QR Code.',cta:{label:'Fechar',action:'store-close'}})}</section>`;
  const mins=Math.max(1,Math.ceil((pl.exp*1000-Date.now())/60000)),f=this.storeFilters(token,pl);
  const auth=[pl.m?'Mapa olfativo':'',pl.h?'Perfumes que tem':'',pl.a?'Notas que evita':'',pl.r?'Avaliações':'',pl.t?'Faixa de orçamento':''].filter(Boolean);
  let bars='';if(pl.m&&typeof OMap!=='undefined'){const m=OMap.fromShared(pl);const top=m.axes.filter(a=>a.level==='comprovado').sort((a,b)=>Math.abs(b.value-.5)-Math.abs(a.value-.5)).slice(0,6)
   .map(a=>({...a,text:String(Math.round(a.value*100))}));bars=`<article class="data-card st-map"><p class="t-eyebrow muted">Mapa autorizado</p>${UI.axisBars(top,{limit:6})}${pl.a?`<p class="t-sm muted">Evita: ${esc(pl.a.join(', ').toLowerCase())}</p>`:''}</article>`;}
  const group=(key,label)=>`<div class="st-filter"><p class="st-label">${esc(label)}</p><div data-key="${key}">${UI.chips(this.FILTERS[key].map(x=>({id:x.id,label:x.label,on:f[key]===x.id})),'store-filter',{label})}</div></div>`;
  return `<section class="v-store" data-view="store" data-token="${esc(token)}">${close}
   <header class="st-head"><p class="t-eyebrow muted">Modo loja · demonstração</p><h1 class="t-display">Cliente ELIXIR</h1><p class="st-meta">Acesso temporário · expira em ${mins} min</p><p class="em">O cliente autorizou: <b>${esc(auth.join(', ')||'nada além do acesso')}</b>.</p></header>
   <div class="st-grid"><div class="st-side">${bars}<div class="st-filters">${group('tier','Orçamento')}${group('occasion','Ocasião')}${group('trait','Característica')}</div></div>
   <div id="panel-store" class="st-panel">${this.storeList(token,pl)}</div></div>
   <footer class="st-foot">O patrocínio não altera esta ordem. Nada fica salvo depois que o acesso termina. Estoque de demonstração.</footer></section>`;},
 /* ---------- Onde experimentar e comprar (para a página do perfume, se o grupo explore quiser usar) ---------- */
 shop(p){if(!p)return '';const links=typeof Catalog!=='undefined'&&Catalog.shopLinks?Catalog.shopLinks(p):[];
  return `<div class="list-hair">${links.map(l=>UI.linkRow({icon:l.kind==='search'?'search':'arrow-up-right',title:l.label,sub:l.kind==='search'?'Busca orgânica, abre em outra aba.':'Fonte oficial da marca.',href:l.href,external:true})).join('')}
   ${UI.linkRow({icon:'qr',title:'Leve seu mapa à loja · ELIXIR Connect',sub:'Acesso temporário, você escolhe o que mostrar.',href:'#connect'})}</div>
   <p class="t-sm muted">Resultados orgânicos. O ELIXIR não recebe por estes links e não tem parceiros.</p><p class="em">Experimente antes: peça uma amostra ou teste na pele numa loja; a pele muda o perfume ao longo do dia.</p>`;}
};

Actions.add({
 'connect-start':()=>{const on=Connect.scopesOn();if(!on.length)return;Connect.start({scopes:on,minutes:state.connect.minutes});Connect.swapPanel();toast('QR Code pronto');},
 'connect-revoke':el=>{Connect.revoke(el.dataset.id);Connect.ended=true;Connect.swapPanel();toast('Acesso encerrado');},
 'connect-new':()=>{Connect.ended=false;Connect.swapPanel();},
 'connect-tier':el=>{Connect.tier=Number(el.dataset.id)||2;UI.segSet(el.closest('.seg'),el.dataset.id);},
 'connect-minutes':el=>{const m=Number(el.dataset.id);if(![10,30,120].includes(m))return;Store.update(s=>{s.connect.minutes=m;},{silent:true});UI.segSet(el.closest('.seg'),el.dataset.id);},
 'store-close':()=>Router.back(['connect','']),
 'store-filter':el=>{const sec=el.closest('.v-store'),g=el.closest('[data-key]');if(!sec||!g)return;const token=sec.dataset.token,pl=Connect.read(token);if(!pl)return;
  const f=Connect.storeFilters(token,pl),k=g.dataset.key,id=el.dataset.id;f[k]=f[k]===id?'':id;
  g.querySelectorAll('.chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===f[k]));Motion.swap('#panel-store',Connect.storeList(token,pl));},
 'store-clear':()=>{const sec=document.querySelector('.v-store');if(!sec)return;const token=sec.dataset.token,pl=Connect.read(token);if(!pl)return;Connect.filters[token]={tier:'',occasion:'',trait:''};
  sec.querySelectorAll('.st-filters .chip').forEach(b=>b.setAttribute('aria-pressed','false'));Motion.swap('#panel-store',Connect.storeList(token,pl));}
});
Actions.change('connect-scope',el=>{const k=el.name;if(!Connect.SCOPES.some(x=>x.id===k))return;Store.update(s=>{s.connect.scopes[k]=el.checked;},{silent:true});
 const root=document.querySelector('.v-connect .cn-consent');if(!root)return;const on=Connect.scopesOn();
 const b=root.querySelector('.cn-budget');if(b)b.hidden=!on.includes('budget');
 const go=root.querySelector('[data-action="connect-start"]');if(go){go.disabled=!on.length;if(on.length)go.removeAttribute('aria-describedby');else go.setAttribute('aria-describedby','cn-hint');}
 const hint=root.querySelector('#cn-hint');if(hint)hint.hidden=!!on.length;
 const old=root.querySelector('.cn-trim');const html=Connect.payloadPreview();if(old)old.remove();if(html){const t=document.createElement('div');t.innerHTML=html;root.querySelector('.cn-go').before(t.firstElementChild);}});

Router.add('connect',{view:id=>Connect.view(id),title:id=>/^store\//.test(id||'')?'Modo loja':'ELIXIR Connect',layout:id=>/^store\//.test(id||'')?'full':'push',nav:id=>/^store\//.test(id||'')?'none':'guide',
 after:id=>{if(/^store\//.test(id||'')){clearInterval(Connect.timer);Connect.timer=null;return;}Connect.startTimer();}});
