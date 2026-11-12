'use strict';
/* Estado da aplicação (v3): um único objeto, salvo no navegador, com migração, saneamento e seletores memorizados. */
const SANDBOX=typeof location!=='undefined'&&new URLSearchParams(location.search).has('sandbox');
const SHELF=[{id:'have',label:'Tenho'},{id:'want',label:'Quero'},{id:'tried',label:'Testei'}];
/* Só para migração: as listas semeadas da v2. */
const LIST_NAMES=['Minha coleção','Quero experimentar','Favoritos','Já experimentei','Não compraria novamente','Perfumes para o trabalho','Perfumes para o verão','Perfumes para sair à noite'];

const Store={
 get key(){return SANDBOX?'elixir-presentation-sandbox-v1':Accounts.keyFor(Accounts.active());},
 backupKey:'elixir-demo-v1-backup',
 weatherKey:SANDBOX?'elixir-weather-sandbox-v1':'elixir-weather-v1',
 version:3,
 available:true,
 notices:[],          /* toasts pendentes até o primeiro desenho (App.boot os mostra) */
 listeners:new Set(),
 rev:0, sig:'',

 /* ---------- helpers ---------- */
 ls(){try{return typeof localStorage!=='undefined'?localStorage:null;}catch(e){return null;}},
 now(){return Date.now();},
 dayKey(d=new Date()){const z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());},
 periodNow(d=new Date()){const h=d.getHours();return h>=5&&h<12?'manha':h>=12&&h<18?'tarde':'noite';},
 valid(id){return typeof id==='string'&&typeof byId==='function'&&!!byId(id);},
 canon(id){const p=typeof byId==='function'?byId(id):null;return p?p.id:null;},
 person(id){if(typeof id!=='string')return false;if(typeof People==='undefined')return true;
  try{if(People.all)return People.all().some(p=>p.id===id);return !!(People.find&&People.find(id))||!!(People.legacy&&People.legacy(id));}catch(e){return true;}},
 strs(a,max=Infinity,len=200){return Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim().slice(0,len)))].slice(0,max):[];},
 ids(a,max=Infinity){if(!Array.isArray(a))return [];const out=[];for(const x of a){const c=this.canon(x);if(c&&!out.includes(c))out.push(c);}return out.slice(0,max);},
 obj(o){return o&&typeof o==='object'&&!Array.isArray(o)?o:{};},
 num(v,min,max,def){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):def;},
 oneOf(v,list,def){return list.includes(v)?v:def;},
 iso(v,def){return typeof v==='string'&&!isNaN(Date.parse(v))?v:def;},

 /* ---------- formato ---------- */
 defaults(){const now=new Date();return {
  version:3,onboarded:false,createdAt:now.toISOString(),
  profile:ProfileRules.defaults(),
  ratings:{},ratedAt:{},reviews:{},feedback:{},
  map:{corrections:{},priors:{},snapshots:[]},
  bubble:{mode:'equilibrio',seen:{}},
  circle:[],
  location:{mode:'city',name:'São Paulo',lat:-23.55,lon:-46.63,consentAt:0},
  connect:{scopes:{map:true,have:true,avoid:true,ratings:false,budget:false},minutes:30,sessions:[]},
  shelf:{},shelfAt:{},lists:{},
  following:[],likes:[],saved:[],comments:{},posts:[],socialShelf:[],seenStories:[],
  sotd:[],activity:{seenAt:0,dismissed:[]},welcome:{picked:[]},guide:null,compare:[],recentSearches:[],
  preferences:{styles:[],likedNotes:[],dislikedNotes:[],intensity:'',occasions:[],climate:'',completedDiscovery:false},
  context:{date:this.dayKey(now),city:'São Paulo',temp:24,occasion:'Dia a dia',period:this.periodNow(now),time:this.periodNow(now)==='noite'?'Noite':'Dia',environment:'Fechado',intensity:'Equilibrada',outfit:''},
  settings:{theme:'system',reduceMotion:'system',dismissedTips:[],privacy:{profile:'public',shareMap:true,shareCollection:true}}
 };},

 /* ---------- leitura ---------- */
 load(){
  const ls=this.ls();let raw=null,text=null;
  try{if(!ls)throw new Error('sem storage');const probe='elixir-probe';ls.setItem(probe,'1');ls.removeItem(probe);this.available=true;}
  catch(e){this.available=false;}
  if(this.available){try{text=ls.getItem(this.key);}catch(e){this.available=false;}}
  if(text){try{raw=JSON.parse(text);}catch(e){this.backup(text);raw=null;this.notices.push('Não foi possível ler seus dados antigos.');}}
  let s;
  if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
   try{s=this.migrate(raw);}catch(e){this.backup(text);s=this.defaults();this.notices.push('Não foi possível ler seus dados antigos.');}
  }else if(raw!==null&&raw!==undefined&&text){this.backup(text);s=this.defaults();this.notices.push('Não foi possível ler seus dados antigos.');}
  else s=SANDBOX?this.demoState():this.defaults();
  if(!SANDBOX&&this.available)this.legacyKeys(s);
  state=this.sanitize(s);
  this.sig=this.signature(state);this.rev++;Select.clear();
  if(!this.available)this.notices.push('Seus dados ficarão só nesta sessão.');
  if(this.available&&(!text||raw?.version!==3))this.flush();
  return state;
 },
 backup(text){const ls=this.ls();if(!ls||SANDBOX||!text)return;try{if(!ls.getItem(this.backupKey))ls.setItem(this.backupKey,text);}catch(e){}},
 /* elixir-theme e elixir-recent viram settings.theme e recentSearches, uma vez. */
 legacyKeys(s){const ls=this.ls();if(!ls)return;
  try{const t=ls.getItem('elixir-theme');if(t){if(['light','dark','system'].includes(t))s.settings={...this.obj(s.settings),theme:t};ls.removeItem('elixir-theme');}}catch(e){}
  try{const r=ls.getItem('elixir-recent');if(r){let list=[];try{list=JSON.parse(r);}catch(e){}
   const q=(Array.isArray(list)?list:[]).map(x=>{const m=/^#?([a-z]+)\/(.+)$/.exec(String(x));if(!m)return String(x);let id=m[2];try{id=decodeURIComponent(id);}catch(e){}const p=m[1]==='perfume'&&typeof byId==='function'?byId(id):null;return p?p.name:id.replace(/-/g,' ');}).filter(Boolean);
   s.recentSearches=[...new Set([...(Array.isArray(s.recentSearches)?s.recentSearches:[]),...q])].slice(0,8);ls.removeItem('elixir-recent');}}catch(e){}
 },

 /* ---------- migração (v1 → v2 → v3; idempotente) ---------- */
 migrate(raw){
  let s=JSON.parse(JSON.stringify(raw));
  const v=Number(s.version)||1;
  if(v<2){delete s.accent;delete s.socialEdition;delete s.simulation;if(s.preferences){delete s.preferences.density;delete s.preferences.feedMode;}s.seenStories=s.seenStories||[];s.activitySeen=s.activitySeen||0;s.version=2;}
  if(Number(s.version)<3)s=this.v2to3(s);
  return this.v3extras(s);
 },
 v2to3(o){
  const d=this.defaults(),now=this.now(),lists=this.obj(o.lists);
  const name=!o.name||o.name==='Você'?'Gabriel':o.name;
  let handle=ProfileRules.cleanHandle(o.username||'');if(!ProfileRules.validHandle(handle)||handle==='voce')handle='gabriel';
  const profile={...this.obj(o.profile),name,handle,bio:String(o.bio||'').trim().slice(0,150),photo:typeof o.photo==='string'?o.photo:'',
   styleTags:ProfileRules.matchTags(o.fashion,PROFILE_RULES.styleTags),musicTags:ProfileRules.matchTags(o.music,PROFILE_RULES.musicTags)};
  /* estantes: have > tried > want */
  const shelf={},put=(ids,status)=>{for(const id of Array.isArray(ids)?ids:[]){const c=this.canon(id);if(!c)continue;const rank={have:3,tried:2,want:1};if(!shelf[c]||rank[status]>rank[shelf[c]])shelf[c]=status;}};
  put(lists['Minha coleção'],'have');put(lists['Já experimentei'],'tried');put(lists['Não compraria novamente'],'tried');
  put(lists['Quero experimentar'],'want');put(lists['Favoritos'],'want');put(o.favorites,'want');
  const shelfAt=Object.fromEntries(Object.keys(shelf).map(id=>[id,now]));
  /* listas próprias: as não semeadas + algumas semeadas, se não vazias */
  const keepSeeded=['Não compraria novamente','Perfumes para o trabalho','Perfumes para o verão','Perfumes para sair à noite'];
  const custom={};for(const [n,ids] of Object.entries(lists)){if(!Array.isArray(ids))continue;if(LIST_NAMES.includes(n)&&!(keepSeeded.includes(n)&&ids.length))continue;custom[n]=ids;}
  /* posts ganham when; foto/nota do sotd vão para o post ligado */
  const posts=(Array.isArray(o.posts)?o.posts:[]).map((p,i)=>({...p,when:p.when&&!isNaN(Date.parse(p.when))?p.when:new Date(now-i*60000).toISOString()}));
  const sotd=(Array.isArray(o.sotd)?o.sotd:[]).map(x=>{const e={...x};const post=posts.find(p=>p.id===e.postId);if(post){if(!post.photo&&e.photo)post.photo=e.photo;if(!post.text&&e.note)post.text=e.note;}delete e.photo;delete e.note;return e;});
  /* ratedAt nunca "agora": a v2 não tem datas de avaliação, então ficam no passado (epoch) para não inventar tendência. */
  const ratedAt={};for(const id of Object.keys(this.obj(o.ratings))){const r=this.obj(this.obj(o.reviews)[id]);const at=Date.parse(r.at)||Number(r.at)||Date.parse(o.createdAt)||0;ratedAt[id]=Number.isFinite(at)?at:0;}
  const out={...d,...o,version:3,profile,shelf,shelfAt,ratedAt,lists:custom,posts,sotd,activity:{seenAt:Number(o.activitySeen)||0,dismissed:[]},createdAt:o.createdAt||d.createdAt};
  out.onboarded=o.onboarded===undefined?d.onboarded:!!o.onboarded;
  for(const k of ['favorites','username','fashion','music','activitySeen','name','bio','photo'])delete out[k];
  return out;
 },
 /* 7a: chaves do intel, também para v3 salvos antes da emenda. */
 v3extras(s){
  s.ratings=this.obj(s.ratings);s.ratedAt=this.obj(s.ratedAt);s.reviews=this.obj(s.reviews);s.shelfAt=this.obj(s.shelfAt);
  const created=Date.parse(s.createdAt)||0;
  for(const id of Object.keys(s.ratings)){if(Number.isFinite(s.ratedAt[id]))continue;const r=this.obj(s.reviews[id]);
   const at=Date.parse(r.at)||Number(r.at)||Number(s.shelfAt[id])||created;s.ratedAt[id]=Number.isFinite(at)?at:0;}
  for(const [id,r0] of Object.entries(s.reviews)){const r=this.obj(r0);if(typeof r.occasion==='string'&&r.occasion&&!Array.isArray(r.occasions))r.occasions=[r.occasion];
   delete r.occasion;delete r.time;delete r.temp;delete r.skin;delete r.application;delete r.id;s.reviews[id]=r;}
  const c=this.obj(s.context);if(!c.period&&(c.time==='Dia'||c.time==='Noite'))c.period=c.time==='Noite'?'noite':'tarde';
  if(!c.intensity)c.intensity='Equilibrada';if(c.outfit===undefined)c.outfit='';if(c.occasion==='Todas')c.occasion='Dia a dia';s.context=c;
  if(s.profile&&s.profile.name==='Você'&&(!s.profile.handle||s.profile.handle==='voce')){s.profile.name='Gabriel';s.profile.handle='gabriel';}
  s.version=3;return s;
 },

 /* ---------- saneamento (na leitura e após cada update) ---------- */
 sanitize(src){
  const d=this.defaults(),s=this.obj(src),out=d,now=this.now(),today=this.dayKey();
  out.version=3;out.onboarded=s.onboarded===true;out.createdAt=this.iso(s.createdAt,d.createdAt);
  out.profile=ProfileRules.sanitize(s.profile);
  /* avaliações */
  for(const [id,v] of Object.entries(this.obj(s.ratings))){const c=this.canon(id),n=Number(v);if(c&&Number.isFinite(n))out.ratings[c]=Math.round(Math.min(10,Math.max(0,n)));}
  for(const [id,v] of Object.entries(this.obj(s.ratedAt))){const c=this.canon(id),n=Number(v);if(c&&out.ratings[c]!==undefined&&Number.isFinite(n)&&n<=now)out.ratedAt[c]=Math.max(0,n);}
  for(const id of Object.keys(out.ratings))if(out.ratedAt[id]===undefined)out.ratedAt[id]=Date.parse(out.createdAt)||0;
  const OCC=x=>this.strs(x,3,40);
  for(const [id,r0] of Object.entries(this.obj(s.reviews))){const c=this.canon(id);if(!c)continue;const r=this.obj(r0),o={};
   o.comment=typeof r.comment==='string'?r.comment.slice(0,280):'';
   if([3,6,9].includes(Number(r.hours)))o.hours=Number(r.hours);
   if([1,3,5].includes(Number(r.projection)))o.projection=Number(r.projection);
   if(['linear','muda','fundo','saida'].includes(r.evolution))o.evolution=r.evolution;
   if(['vale','justo','caro'].includes(r.value))o.value=r.value;
   if(Array.isArray(r.occasions))o.occasions=OCC(r.occasions);
   if(Array.isArray(r.climate))o.climate=[...new Set(r.climate.filter(x=>['Calor','Meia-estação','Frio'].includes(x)))].slice(0,3);
   if(Array.isArray(r.perceived))o.perceived=this.strs(r.perceived,8,40);
   if(Array.isArray(r.history))o.history=r.history.filter(h=>h&&Number.isFinite(Number(h.rating))).map(h=>({rating:Math.round(Math.min(10,Math.max(0,Number(h.rating)))),at:Number(h.at)||0})).slice(-5);
   o.at=Number.isFinite(Number(r.at))?Number(r.at):(Date.parse(r.at)||out.ratedAt[c]||now);
   if(r.editedAt!==undefined&&Number.isFinite(Number(r.editedAt)))o.editedAt=Number(r.editedAt);
   out.reviews[c]=o;}
  /* feedback (≤300 mais novos) */
  const fb=Object.entries(this.obj(s.feedback)).map(([id,f0])=>{const c=this.canon(id),f=this.obj(f0);if(!c||![1,-1].includes(Number(f.v))||!['perfume','guide','today','bubble','gift'].includes(f.src))return null;
   const e={v:Number(f.v),src:f.src,at:Number(f.at)||0};if(f.ctx&&typeof f.ctx==='object'){const x=f.ctx;e.ctx={tempBand:Number.isFinite(Number(x.tempBand))?Number(x.tempBand):null,occasion:typeof x.occasion==='string'?x.occasion.slice(0,40):'',period:this.oneOf(x.period,['manha','tarde','noite'],'')};}return [c,e];}).filter(Boolean)
   .sort((a,b)=>b[1].at-a[1].at).slice(0,300);out.feedback=Object.fromEntries(fb);
  /* mapa */
  const m=this.obj(s.map),axes=typeof MAP_AXES!=='undefined'&&Array.isArray(MAP_AXES)?MAP_AXES.map(a=>a.id):null,axisOk=k=>!axes||axes.includes(k);
  for(const [k,v0] of Object.entries(this.obj(m.corrections))){const v=this.obj(v0);if(axisOk(k)&&[1,-1].includes(Number(v.v)))out.map.corrections[k]={v:Number(v.v),at:Number(v.at)||0};}
  for(const [k,v] of Object.entries(this.obj(m.priors)))if(axisOk(k)&&['like','avoid'].includes(v))out.map.priors[k]=v;
  const months=new Set();out.map.snapshots=(Array.isArray(m.snapshots)?m.snapshots:[]).filter(x=>x&&/^\d{4}-\d{2}$/.test(x.month)).sort((a,b)=>b.month.localeCompare(a.month))
   .filter(x=>!months.has(x.month)&&months.add(x.month)).slice(0,12).map(x=>({month:x.month,top:this.strs(x.top,3,40).filter(axisOk),n:Number(x.n)||0}));
  /* fora da bolha */
  const b=this.obj(s.bubble);out.bubble.mode=this.oneOf(b.mode,['equilibrio','seguro','ousado'],'equilibrio');
  out.bubble.seen=Object.fromEntries(Object.entries(this.obj(b.seen)).map(([id,x0])=>{const c=this.canon(id),x=this.obj(x0);return c&&[1,-1].includes(Number(x.v))?[c,{v:Number(x.v),at:Number(x.at)||0}]:null;}).filter(Boolean).sort((a,b)=>b[1].at-a[1].at).slice(0,200));
  /* círculo */
  out.circle=[...new Set((Array.isArray(s.circle)?s.circle:[]).filter(id=>this.person(id)))].slice(0,12);
  /* localização */
  const L=this.obj(s.location),lat=Number(L.lat),lon=Number(L.lon),mode=this.oneOf(L.mode,['none','geo','city'],'none');
  if(mode!=='none'&&L.lat!==null&&L.lon!==null&&Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180)
   out.location={mode,name:String(L.name||'').replace(/[<>]/g,'').slice(0,60),lat:Math.round(lat*100)/100,lon:Math.round(lon*100)/100,consentAt:Number(L.consentAt)||0};
  /* connect */
  const C=this.obj(s.connect),sc=this.obj(C.scopes);for(const k of Object.keys(out.connect.scopes))if(typeof sc[k]==='boolean')out.connect.scopes[k]=sc[k];
  out.connect.minutes=[10,30,120].includes(Number(C.minutes))?Number(C.minutes):30;
  out.connect.sessions=(Array.isArray(C.sessions)?C.sessions:[]).filter(x=>x&&typeof x.id==='string').map(x=>({id:x.id.slice(0,40),createdAt:Number(x.createdAt)||0,exp:Number(x.exp)||0,scopes:this.strs(x.scopes,8,20),revokedAt:Number(x.revokedAt)||0}))
   .sort((a,b)=>b.createdAt-a.createdAt).slice(0,5);
  /* estantes e listas */
  for(const [id,st] of Object.entries(this.obj(s.shelf))){const c=this.canon(id);if(c&&['have','want','tried'].includes(st))out.shelf[c]=st;}
  for(const id of Object.keys(out.shelf)){const t=Number(this.obj(s.shelfAt)[id]);out.shelfAt[id]=Number.isFinite(t)?t:now;}
  const seen=new Set(['tenho','quero','testei']);
  for(const [n0,ids] of Object.entries(this.obj(s.lists))){const n=String(n0).replace(/\//g,' ').replace(/\s+/g,' ').trim().slice(0,40),k=n.toLowerCase();if(!n||seen.has(k))continue;seen.add(k);out.lists[n]=this.ids(ids);}
  /* social */
  out.following=[...new Set((Array.isArray(s.following)?s.following:[]).filter(id=>this.person(id)))];
  out.likes=this.strs(s.likes,500,80);out.saved=this.strs(s.saved,500,80);out.seenStories=this.strs(s.seenStories,200,80);out.socialShelf=this.strs(s.socialShelf,200,80);
  for(const [pid,list] of Object.entries(this.obj(s.comments)))if(Array.isArray(list)){const l=list.filter(c=>c&&typeof c.text==='string'&&c.text.trim()).map(c=>({text:c.text.slice(0,280),at:this.iso(c.at,new Date(Number(c.at)||now).toISOString()),...(typeof c.by==='string'&&/^[a-z0-9-]{2,40}$/.test(c.by)?{by:c.by,demo:true}:{})}));if(l.length)out.comments[String(pid).slice(0,80)]=l;}
  const posts=(Array.isArray(s.posts)?s.posts:[]).filter(p=>p&&typeof p.id==='string').map(p=>{const o={id:p.id.slice(0,60),user:'me',perfume:this.canon(p.perfume)||'',photo:typeof p.photo==='string'&&(p.photo.startsWith('data:image/')||/^assets\//.test(p.photo))?p.photo:'',
    text:typeof p.text==='string'?p.text.slice(0,280):'',occasion:typeof p.occasion==='string'?p.occasion.slice(0,40):'',likes:Math.max(0,Number(p.likes)||0),when:this.iso(p.when,new Date(now).toISOString())};
    if(Number.isFinite(Number(p.rating))&&p.rating!==null&&p.rating!=='')o.rating=Math.round(Math.min(10,Math.max(0,Number(p.rating))));if(p.sotd)o.sotd=true;return o;})
   .sort((a,b)=>Date.parse(b.when)-Date.parse(a.when));
  posts.forEach((p,i)=>{if(i>=20&&p.photo.startsWith('data:'))p.photo='';});out.posts=posts;
  /* usando hoje: 1 por data, mais novo primeiro */
  const dates=new Set();out.sotd=(Array.isArray(s.sotd)?s.sotd:[]).filter(x=>x&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&this.canon(x.id)).sort((a,b)=>b.date.localeCompare(a.date))
   .filter(x=>!dates.has(x.date)&&dates.add(x.date)).map(x=>{const e={date:x.date,id:this.canon(x.id),occasion:typeof x.occasion==='string'?x.occasion.slice(0,40):'',postId:typeof x.postId==='string'?x.postId:''};
    if(x.ctx&&typeof x.ctx==='object'){const c=x.ctx;e.ctx={temp:Number.isFinite(Number(c.temp))?Number(c.temp):null,humidity:Number.isFinite(Number(c.humidity))?Number(c.humidity):null,occasion:typeof c.occasion==='string'?c.occasion.slice(0,40):'',environment:this.oneOf(c.environment,['Aberto','Fechado'],''),period:this.oneOf(c.period,['manha','tarde','noite'],''),intensity:this.oneOf(c.intensity,['Discreta','Equilibrada','Marcante'],''),outfit:typeof c.outfit==='string'?c.outfit.slice(0,30):''};}return e;});
  const A=this.obj(s.activity);out.activity={seenAt:Number(A.seenAt)||0,dismissed:this.strs(A.dismissed,200,80)};
  out.welcome={picked:out.onboarded?[]:this.ids(this.obj(s.welcome).picked,12)};
  out.guide=this.guide(s.guide);
  out.compare=this.ids(s.compare,3);
  out.recentSearches=this.strs(s.recentSearches,8,80);
  /* preferências */
  const P=this.obj(s.preferences);out.preferences={styles:this.strs(P.styles,8,20),likedNotes:this.strs(P.likedNotes,12,40),dislikedNotes:this.strs(P.dislikedNotes,12,40),
   intensity:this.oneOf(P.intensity,['','Discreta','Equilibrada','Marcante'],''),occasions:this.strs(P.occasions,3,40),climate:this.oneOf(P.climate,['','Calor','Meia-estação','Frio'],''),completedDiscovery:P.completedDiscovery===true};
  /* contexto (virada do dia) */
  const X=this.obj(s.context),c=d.context;
  c.city=typeof X.city==='string'&&X.city.trim()?X.city.replace(/[<>]/g,'').slice(0,60):c.city;
  c.temp=Math.round(this.num(X.temp,-10,45,24));
  c.environment=this.oneOf(X.environment,['Aberto','Fechado'],c.environment);
  c.intensity=this.oneOf(X.intensity,['Discreta','Equilibrada','Marcante'],'Equilibrada');
  if(X.date===today){c.occasion=typeof X.occasion==='string'&&X.occasion.trim()?X.occasion.slice(0,40):'Dia a dia';c.period=this.oneOf(X.period,['manha','tarde','noite'],c.period);c.outfit=typeof X.outfit==='string'?X.outfit.slice(0,30):'';}
  c.date=today;c.time=c.period==='noite'?'Noite':'Dia';out.context=c;
  /* ajustes */
  const S=this.obj(s.settings),pv=this.obj(S.privacy);
  out.settings={theme:this.oneOf(S.theme,['system','light','dark'],'system'),reduceMotion:this.oneOf(S.reduceMotion,['system','on'],'system'),dismissedTips:this.strs(S.dismissedTips,50,40),
   privacy:{profile:this.oneOf(pv.profile,['public','circle','private'],'public'),shareMap:pv.shareMap!==false,shareCollection:pv.shareCollection!==false}};
  return out;
 },
 guide(g0){if(!g0||typeof g0!=='object')return null;const g=g0,a=this.obj(g.answers),fam={};
  for(const [k,v] of Object.entries(this.obj(a.families)))if(['like','avoid'].includes(v))fam[String(k).slice(0,30)]=v;
  return {mode:this.oneOf(g.mode,['me','gift'],'me'),step:Math.round(this.num(g.step,0,6,0)),giftFor:typeof g.giftFor==='string'&&this.person(g.giftFor)?g.giftFor:null,giftStyles:this.strs(g.giftStyles,3,30),
   answers:{occasions:this.strs(a.occasions,2,40),climate:typeof a.climate==='string'?a.climate.slice(0,30):'',presence:typeof a.presence==='string'?a.presence.slice(0,30):'',allDay:a.allDay===true,families:fam,
    avoidNotes:this.strs(a.avoidNotes,12,40),tier:typeof a.tier==='string'?a.tier.slice(0,30):'',audience:typeof a.audience==='string'?a.audience.slice(0,30):''},updatedAt:Number(g.updatedAt)||0};},

 /* ---------- gravação ---------- */
 signature(s){return JSON.stringify([s.ratings,s.shelf,s.feedback,s.map,s.bubble,s.preferences,s.context,s.profile.pinned,s.reviews,s.sotd.length,typeof PERFUMES!=='undefined'?PERFUMES.length:0]);},
 saveTimer:null,
 save(){if(this.saveTimer)return;this.saveTimer=setTimeout(()=>{this.saveTimer=null;this.flush();},150);},
 flush(){clearTimeout(this.saveTimer);this.saveTimer=null;const ls=this.ls();if(!ls||!this.available&&!this.retryable)return false;
  try{ls.setItem(this.key,JSON.stringify(state));this.available=true;return true;}
  catch(e){const quota=e&&(e.name==='QuotaExceededError'||e.code===22||e.code===1014);
   if(quota){const p=state.posts.find(x=>x.photo&&x.photo.startsWith('data:'));if(p){p.photo='';try{ls.setItem(this.key,JSON.stringify(state));if(typeof toast==='function')toast('Sem espaço para a foto. O registro foi salvo sem ela.');return true;}catch(e2){}}}
   if(this.available&&typeof toast==='function')toast('Seus dados ficarão só nesta sessão.');this.available=false;return false;}},
 /* Aplica uma mudança: fn altera um rascunho; depois sanitize, salva e avisa (a menos que silent). */
 update(fn,{silent=false}={}){
  const draft=JSON.parse(JSON.stringify(state));const r=fn(draft);
  state=this.sanitize(draft);
  const sig=this.signature(state);if(sig!==this.sig){this.sig=sig;this.rev++;Select.clear();}
  this.save();if(!silent)this.emit();return r;},
 on(fn){this.listeners.add(fn);return ()=>this.listeners.delete(fn);},
 emit(){for(const fn of [...this.listeners]){try{fn(state);}catch(e){console.warn(e);}}},
 reset({silent=false}={}){state=this.sanitize(this.defaults());this.sig=this.signature(state);this.rev++;Select.clear();this.flush();if(!silent)this.emit();return state;},
 /* "Apagar meus dados": nada fica neste aparelho (a sandbox e o app principal não se tocam). */
 wipe(){const ls=this.ls();
  try{if(ls){ls.removeItem(this.key);if(!SANDBOX){ls.removeItem(this.backupKey);ls.removeItem('elixir-theme');ls.removeItem('elixir-recent');}ls.removeItem(this.weatherKey);}}catch(e){}
  try{sessionStorage.removeItem('elixir-scroll');sessionStorage.removeItem('elixir-explore');}catch(e){}
  this.reset({silent:true});
  try{if(ls)ls.removeItem(this.key);}catch(e){}
  this.wiped=true;return state;},
 /* Exportar meus dados: JSON legível de tudo o que está salvo. */
 exportJSON(){return JSON.stringify({...state,exportedAt:new Date().toISOString(),app:'ELIXIR',version:3},null,2);},
 /* Demonstração de Gabriel: cobre todas as telas do intel. */
 demoState(){const s=this.defaults(),now=this.now(),day=864e5,ago=n=>now-n*day,iso=n=>new Date(ago(n)).toISOString(),key=n=>this.dayKey(new Date(ago(n)));
  s.onboarded=true;s.createdAt=iso(250);
  s.profile={...s.profile,name:'Gabriel',handle:'gabriel',bio:'Madeiras, boas histórias e novas descobertas.',cover:'forest',tone:'papel',signature:'vetiver',
   pinned:['vetiver','santal','terre','hwyl','polo'],families:['woody','green'],styleTags:['Essencial','Alfaiataria'],musicTags:['Jazz','MPB']};
  const R=[['vetiver',10,230],['polo',8,210],['terre',8,190],['lemale',2,200],['coffee',4,175],['chanel5',2,160],['santal',10,140],['hwyl',8,120],['bleu',8,100],['sauvage',6,85],['arbo',6,70],['clash',6,40],['malbec',8,20],['unico',8,8]];
  for(const [id,r,d] of R){s.ratings[id]=r;s.ratedAt[id]=ago(d);}
  s.reviews={vetiver:{comment:'Verde, seco e elegante. Meu perfume de trabalho.',hours:9,projection:3,occasions:['Trabalho','Dia a dia'],climate:['Meia-estação'],at:ago(230)},
   santal:{comment:'Madeira cremosa para a noite.',occasions:['Encontro'],at:ago(140)},hwyl:{occasions:['Encontro'],at:ago(120)},terre:{occasions:['Trabalho'],at:ago(190)},bleu:{occasions:['Trabalho'],at:ago(100)}};
  for(const [id,st,d] of [['vetiver','have',230],['santal','have',140],['terre','have',190],['bleu','have',100],['philosykos','want',30],['sonar','want',12],['homem','want',5],['sauvage','tried',85],['lemale','tried',200]]){s.shelf[id]=st;s.shelfAt[id]=ago(d);}
  s.feedback={terre:{v:1,src:'perfume',at:ago(15)},coffee:{v:-1,src:'guide',at:ago(9)}};
  s.map.priors={verde:'like'};
  s.circle=['sofia','mateo','tiago'];s.following=['sofia','mateo'];
  s.lists={'Perfumes para o trabalho':['vetiver','bleu','terre']};
  const posts=[['bleu',1,'Trabalho','Reunião longa, Bleu discreto do começo ao fim.'],['santal',3,'Encontro','Jantar sem pressa. Santal 33 na pele.'],['vetiver',6,'Trabalho','Segunda-feira pede o clássico.']];
  s.posts=posts.map(([id,d,occ,text])=>({id:'local-demo-'+id,user:'me',perfume:id,photo:'',text,occasion:occ,likes:3+d*2,when:iso(d),sotd:true}));
  s.sotd=posts.map(([id,d,occ])=>({date:key(d),id,occasion:occ,postId:'local-demo-'+id,ctx:{temp:23,humidity:null,occasion:occ,environment:'Fechado',period:occ==='Encontro'?'noite':'manha',intensity:'Equilibrada',outfit:''}}));
  s.saved=['post3'];s.likes=['post0'];
  s.preferences={styles:['woody'],likedNotes:['Vetiver','Sândalo','Cedro'],dislikedNotes:['Caramelo'],intensity:'Equilibrada',occasions:['Trabalho','Encontro'],climate:'Meia-estação',completedDiscovery:true};
  s.activity={seenAt:ago(4),dismissed:[]};
  return s;},
 demo(){state=this.sanitize(this.demoState());this.sig=this.signature(state);this.rev++;Select.clear();this.flush();this.emit();return state;}
};

/* Estado global atual (preenchido por Store.load em App.boot). */
let state=Store.defaults();

/* Seletores derivados, memorizados por revisão (Store.rev + Select.bump). */
/* ---------- Perfis de teste no aparelho ----------
   Não é conta nem login de verdade (o app não tem servidor): cada perfil guarda o próprio estado no navegador.
   Sem senha. Gabriel usa a chave antiga, então os dados que já existiam continuam dele. */
const Accounts={
 regKey:'elixir-accounts-v1',sessKey:'elixir-session-account',
 PRESETS:[
  {id:'gabriel',name:'Gabriel',handle:'gabriel',vibe:'night',cover:'woody',bio:'Madeiras escuras, especiarias e noite longa.',love:['amadeirado','especiado','couro'],hate:['aquatico','frutado']},
  {id:'vinicius',name:'Vinicius',handle:'vinicius',vibe:'sea',cover:'pool',bio:'Sal, sol e um cítrico que acorda.',love:['aquatico','citrico'],hate:['gourmand','ambar']},
  {id:'amanda',name:'Amanda',handle:'amanda',vibe:'flowers',cover:'floral',bio:'Flores frescas, frutas e algo que abraça.',love:['floral','frutado'],hate:['couro','incensado']},
  {id:'helo',name:'Heloísa',handle:'helo',vibe:'forest',cover:'rain',bio:'Mato molhado, chá verde e ervas.',love:['verde','aromatico','herbal'],hate:['gourmand','ambar']},
  {id:'theo',name:'Theo',handle:'theo',vibe:'city',cover:'woody',bio:'Baunilha, âmbar e a cidade à noite.',love:['gourmand','ambar'],hate:['aquatico','verde']}
 ],
 ss(){try{return typeof sessionStorage!=='undefined'?sessionStorage:null;}catch(e){return null;}},
 read(){const ls=Store.ls();let r=null;try{r=ls&&JSON.parse(ls.getItem(this.regKey)||'null');}catch(e){r=null;}
  r=r&&typeof r==='object'?r:{};const list=Array.isArray(r.list)?r.list.filter(a=>a&&typeof a.id==='string'&&/^[a-z0-9-]{2,24}$/.test(a.id)):[];
  for(const p of this.PRESETS){const a=list.find(x=>x.id===p.id);if(!a)list.push({id:p.id,name:p.name,handle:p.handle,vibe:p.vibe,preset:true,createdAt:0,lastAt:0});else{a.vibe=p.vibe;a.preset=true;}}
  return {active:typeof r.active==='string'&&list.some(a=>a.id===r.active)?r.active:'gabriel',list};},
 write(r){const ls=Store.ls();try{ls&&ls.setItem(this.regKey,JSON.stringify(r));}catch(e){}},
 list(){return this.read().list;},
 active(){return this.read().active;},
 get(id){return this.list().find(a=>a.id===id)||null;},
 keyFor(id){return id==='gabriel'?'elixir-demo-v1':'elixir-acct-'+id;},
 /* A tela de perfis aparece uma vez por sessão do navegador. */
 chosen(){const ss=this.ss();try{return !!ss&&ss.getItem(this.sessKey)===this.active();}catch(e){return false;}},
 slug(name){const base=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,18)||'perfil';
  const taken=new Set(this.list().map(a=>a.id));let id=base,n=2;while(taken.has(id))id=base+'-'+(n++);return id;},
 use(id){const r=this.read();if(!r.list.some(a=>a.id===id))return false;r.active=id;const a=r.list.find(x=>x.id===id);a.lastAt=Date.now();this.write(r);
  const ss=this.ss();try{ss&&ss.setItem(this.sessKey,id);}catch(e){}
  Store.flush&&clearTimeout(Store.saveTimer);Store.load();
  const preset=this.PRESETS.find(p=>p.id===id);if(preset&&!state.onboarded&&!Object.keys(state.ratings).length)this.seed(preset);
  return true;},
 create({name,photo='',vibe=''}){const clean=String(name||'').replace(/[<>]/g,'').trim().slice(0,32);if(clean.length<2)return null;
  const id=this.slug(clean),r=this.read();r.list.push({id,name:clean,handle:id.replace(/-/g,'.'),vibe:vibe||'',preset:false,createdAt:Date.now(),lastAt:Date.now()});this.write(r);
  try{Store.ls().removeItem(this.keyFor(id));}catch(e){}
  this.use(id);
  Store.update(s=>{s.profile.name=clean;s.profile.handle=id.replace(/-/g,'.').slice(0,20);s.profile.photo=photo||'';s.profile.avatarVibe=vibe||'';s.onboarded=false;},{silent:true});
  Store.flush();return id;},
 remove(id){if(this.PRESETS.some(p=>p.id===id))return false;const r=this.read();r.list=r.list.filter(a=>a.id!==id);if(r.active===id)r.active='gabriel';this.write(r);
  try{Store.ls().removeItem(this.keyFor(id));}catch(e){}return true;},
 /* Perfis prontos e bem distintos, montados com perfumes reais do catálogo pelas famílias de cada um. Avaliações de teste. */
 seed(p){const fam=x=>{try{const t=Advisor.topFamily(x);return t?t.id:'';}catch(e){return '';}};
  const pool=PERFUMES.filter(x=>x.vector&&x.image),loved=[],hated=[];
  for(const f of p.love)loved.push(...pool.filter(x=>fam(x)===f).slice(0,4));
  for(const f of p.hate)hated.push(...pool.filter(x=>fam(x)===f).slice(0,2));
  const now=Date.now();
  Store.update(s=>{s.onboarded=true;s.profile.name=p.name;s.profile.handle=p.handle;s.profile.bio=p.bio;s.profile.avatarVibe=p.vibe;s.profile.cover=p.cover;
   loved.forEach((x,i)=>{s.ratings[x.id]=[10,9,8,9][i%4];s.ratedAt[x.id]=now-i*864e5;if(i<4){s.shelf[x.id]='have';s.shelfAt[x.id]=now-i*864e5;}});
   hated.forEach((x,i)=>{if(s.ratings[x.id]===undefined){s.ratings[x.id]=[2,3][i%2];s.ratedAt[x.id]=now-(i+5)*864e5;}});
   s.profile.pinned=loved.slice(0,5).map(x=>x.id);},{silent:true});Store.flush();}
};

const Select={
 cache:new Map(),seen:-1,extra:0,
 clear(){this.cache.clear();},
 bump(){this.extra++;this.cache.clear();return this.extra;},
 memo(key,fn){const rev=Store.rev+':'+this.extra+':'+(typeof PERFUMES!=='undefined'?PERFUMES.length:0);if(this.seen!==rev){this.cache.clear();this.seen=rev;}
  if(this.cache.has(key))return this.cache.get(key);const v=fn();this.cache.set(key,v);return v;},
 mapInput(){return {ratings:state.ratings,ratedAt:state.ratedAt,shelf:state.shelf,shelfAt:state.shelfAt,feedback:state.feedback,bubble:state.bubble,map:state.map,reviews:state.reviews,pinned:state.profile.pinned,sotd:state.sotd};},
 map(){return this.memo('map',()=>{if(typeof OMap==='undefined')return null;try{return OMap.build(this.mapInput());}catch(e){console.warn(e);return null;}});},
 explain(id,{source='perfume'}={}){return this.memo('explain:'+id+':'+source,()=>{const p=byId(id),m=this.map();if(!p||!m||typeof OMap==='undefined')return null;
  try{return OMap.explain(p,m,{ctx:typeof Today!=='undefined'&&Today.ctx?Today.ctx():null,source});}catch(e){console.warn(e);return null;}});},
 rec(id){return this.memo('rec:'+id,()=>{const p=byId(id);return p?Engine.recommend(p,state.ratings,state.context,state.preferences):null;});},
 ranked(){return this.memo('ranked',()=>PERFUMES.map(p=>({p,r:this.rec(p.id)})).sort((a,b)=>b.r.score-a.r.score||(a.p.id<b.p.id?-1:a.p.id>b.p.id?1:0)));},
 identity(){return this.memo('identity',()=>Engine.identity(state.ratings,state.preferences));},
 shelf(id){const p=byId(id);return p?state.shelf[p.id]||null:null;},
 shelfIds(status){return Object.keys(state.shelf).filter(id=>state.shelf[id]===status).sort((a,b)=>(state.shelfAt[b]||0)-(state.shelfAt[a]||0)||(a<b?-1:1));},
 handle(){return '@'+state.profile.handle;},
 likedNotes(){return (state.preferences.likedNotes.length?state.preferences.likedNotes:Engine.favoriteNotes(state.ratings,state.preferences)||[]).slice(0,3);},
 todayKey(){return Store.dayKey();},
 sotdToday(){const k=this.todayKey();return state.sotd.find(x=>x.date===k)||null;},
 /* Fallback de "Para hoje": entre os 5 melhores, sem os usados nos últimos 7 registros. */
 perfumeOfDay(){const recent=new Set(state.sotd.slice(0,7).map(x=>x.id)),top=this.ranked().slice(0,12).filter(x=>!recent.has(x.p.id)).slice(0,5);
  const list=top.length?top:this.ranked().slice(0,5);if(!list.length)return null;let h=0;for(const c of this.todayKey())h=(h*31+c.charCodeAt(0))>>>0;return list[h%list.length].p;}
};
