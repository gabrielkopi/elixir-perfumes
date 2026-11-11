/* Core: migração v2→v3, saneamento, demo, exportar/apagar, cota e armazenamento indisponível (Store v3, §4.2). */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const JS=f=>fs.readFileSync(path.join(__dirname,'..','assets','js',f),'utf8');

function makeStorage({throwAll=false,quotaOver=Infinity}={}){
 const m=new Map();
 const api={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{v=String(v);if(v.length>quotaOver){const e=new Error('cota');e.name='QuotaExceededError';throw e;}m.set(k,v);},removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size;},_m:m};
 if(!throwAll)return api;
 return new Proxy({},{get(){throw new Error('SecurityError');}});
}
function load({search='',storage=makeStorage(),seed=null}={}){
 if(seed)for(const [k,v] of Object.entries(seed))storage.setItem(k,v);
 const toasts=[],session=makeStorage();
 const ctx=vm.createContext({console,setTimeout,clearTimeout,Intl,URL,URLSearchParams,
  document:{documentElement:{dataset:{brand:'elixir'}},addEventListener(){}},location:{search,hash:''},localStorage:storage,sessionStorage:session,toast:t=>toasts.push(t)});
 let files=['data/brand.js','data/data.js','data/catalog-100.js','data/notes.js','engine/engine.js','engine/taste-engine.js'];
 vm.runInContext(files.map(JS).join('\n;\n'),ctx);
 try{vm.runInContext(JS('data/ingredients.js'),ctx);}catch(e){vm.runInContext("var FAMILIES=[['aquatic','Aquática','',8],['green','Verde','',1],['citrus','Cítrica','',0],['floral','Floral','',5],['woody','Amadeirada','',3],['gourmand','Doce','',7],['spicy','Especiada','',10]];",ctx);console.log('  (ingredients.js indisponível no VM; FAMILIES mínimo)');}
 vm.runInContext(JS('core/profile-rules.js')+'\n;\n'+JS('core/store.js')+'\n;\n'+JS('data/community.js'),ctx);
 vm.runInContext('globalThis.__=()=>({Store,Select,state,People,ProfileRules});globalThis.byId=byId;',ctx);
 return {ctx,storage,toasts,api:()=>ctx.__()};
}
const ok=(c,m)=>{assert.ok(c,m);};
let passed=0;const t=(name,fn)=>{fn();passed++;console.log('  ok  '+name);};

/* 1. primeira visita */
t('estado inicial',()=>{const L=load();const {Store,state}=L.api();Store.load();const s=L.api().state;
 ok(s.version===3&&s.onboarded===false&&s.profile.name==='Gabriel'&&s.profile.handle==='gabriel','padrões v3');
 ok(L.storage.getItem('elixir-demo-v1'),'salva na primeira visita');ok(L.api().Store.available,'storage disponível');});

/* 2. migração v2 */
const v2={version:2,onboarded:true,photo:'',name:'Você',username:'voce',bio:'x'.repeat(200),fashion:'Essencial',music:'Jazz & MPB',
 ratings:{vetiver:9,santal:9,terre:8,bogus:5,polo:15},reviews:{vetiver:{comment:'ótimo',occasion:'Trabalho',time:'Dia',temp:22,skin:'Seca',rating:9,hours:9}},
 favorites:['vetiver','santal'],lists:{'Minha coleção':['vetiver','santal'],'Favoritos':['vetiver','santal','polo'],'Já experimentei':['terre'],'Quero experimentar':['hwyl'],'Não compraria novamente':[],
  'Perfumes para o trabalho':['bleu'],'Perfumes para o verão':[],'Perfumes para sair à noite':[],'Minha lista':['arbo']},
 following:['sofia'],likes:[],saved:[],comments:{},posts:[{id:'local-1',user:'me',perfume:'arbo',photo:'',text:'oi',occasion:'Trabalho',rating:8,likes:0}],
 sotd:[{date:'2026-11-01',id:'arbo',postId:'local-1',photo:'data:image/jpeg;base64,AAAA',note:'nota'}],socialShelf:[],seenStories:[],activitySeen:123,
 preferences:{styles:['woody'],likedNotes:['Vetiver'],dislikedNotes:[]},context:{city:'São Paulo',temp:22,occasion:'Todas',time:'Noite',environment:'Aberto'}};
t('migração v2 → v3',()=>{const L=load({seed:{'elixir-demo-v1':JSON.stringify(v2),'elixir-theme':'dark','elixir-recent':JSON.stringify(['#perfume/vetiver','#ingredient/baunilha'])}});
 L.api().Store.load();const s=L.api().state;
 assert.equal(s.version,3);assert.equal(s.profile.name,'Gabriel');assert.equal(s.profile.handle,'gabriel');ok(s.profile.bio.length<=150,'bio ≤150');
 assert.deepEqual([...s.profile.styleTags],['Essencial']);assert.deepEqual([...s.profile.musicTags],['Jazz','MPB']);
 assert.equal(s.shelf.vetiver,'have');assert.equal(s.shelf.santal,'have');assert.equal(s.shelf.polo,'want');assert.equal(s.shelf.terre,'tried');assert.equal(s.shelf.hwyl,'want');
 ok(s.lists['Perfumes para o trabalho']&&s.lists['Minha lista'],'listas próprias mantidas');ok(!s.lists['Perfumes para o verão']&&!s.lists['Minha coleção']&&!s.lists['Favoritos'],'semeadas vazias/estantes removidas');
 for(const k of ['favorites','username','fashion','music','activitySeen','name','bio','photo'])ok(!(k in s),'sem '+k);
 assert.equal(s.activity.seenAt,123);assert.equal(s.onboarded,true);
 ok(!('bogus' in s.ratings),'id inválido descartado');assert.equal(s.ratings.polo,10);
 for(const id of Object.keys(s.ratings))ok(Number.isFinite(s.ratedAt[id]),'ratedAt '+id);
 ok(Object.values(s.ratedAt).every(v=>v<Date.now()-864e5),'ratedAt nunca "agora"');
 assert.deepEqual([...s.reviews.vetiver.occasions],['Trabalho']);ok(!('time' in s.reviews.vetiver)&&!('temp' in s.reviews.vetiver)&&!('skin' in s.reviews.vetiver),'review sem time/temp/skin');
 ok(s.posts[0].when&&!isNaN(Date.parse(s.posts[0].when)),'post ganha when');assert.equal(s.posts[0].photo,'data:image/jpeg;base64,AAAA');assert.equal(s.posts[0].text,'oi');
 ok(!('photo' in s.sotd[0])&&!('note' in s.sotd[0]),'sotd sem foto/nota duplicada');
 assert.equal(s.context.environment,'Aberto');assert.equal(s.context.intensity,'Equilibrada');assert.equal(s.context.occasion,'Dia a dia');
 assert.equal(s.settings.theme,'dark');ok(L.storage.getItem('elixir-theme')===null&&L.storage.getItem('elixir-recent')===null,'chaves antigas removidas');
 ok(s.recentSearches.includes('Vétiver'),'recentes convertidas');});

t('migração idempotente',()=>{const L=load();const {Store}=L.api();const a=Store.sanitize(Store.migrate(JSON.parse(JSON.stringify(v2))));const b=Store.sanitize(Store.migrate(JSON.parse(JSON.stringify(a))));
 const strip=x=>JSON.stringify({...x,createdAt:0});assert.equal(strip(a),strip(b));});

t('JSON corrompido: padrões, backup e aviso',()=>{const L=load({seed:{'elixir-demo-v1':'{quebrado'}});L.api().Store.load();
 ok(L.api().state.version===3,'padrões');assert.equal(L.storage.getItem('elixir-demo-v1-backup'),'{quebrado');ok(L.api().Store.notices.includes('Não foi possível ler seus dados antigos.'),'aviso');});

t('tipos errados em todas as chaves',()=>{const bad={version:3,onboarded:'sim',ratings:'x',ratedAt:[],reviews:5,feedback:{vetiver:{v:7,src:'x'}},shelf:[1],shelfAt:'x',lists:{'a/b':['vetiver','nada'],'Tenho':['polo']},
  profile:{tone:'#ff0000',cover:'http://x',name:'🔥🔥',handle:'Ga Bi!',link:'javascript:alert(1)',bio:5,pinned:['vetiver','x','vetiver','polo','arbo','clash','terre','santal'],styleTags:['Punk','Essencial']},
  compare:['a','vetiver','polo','terre','arbo'],recentSearches:Array.from({length:20},(_,i)=>'q'+i),sotd:'x',posts:{},circle:['nao-existe','sofia','sofia'],
  location:{mode:'geo',lat:999,lon:3},connect:{minutes:7,scopes:{map:'sim'}},map:{corrections:{amadeirado:{v:3}},snapshots:'x'},bubble:{mode:'radical'},context:{temp:99,environment:'Lua'},settings:{theme:'roxo',privacy:{profile:'x'}}};
 const L=load({seed:{'elixir-demo-v1':JSON.stringify(bad)}});L.api().Store.load();const s=L.api().state;
 assert.equal(s.profile.tone,'papel');assert.equal(s.profile.cover,'none');assert.equal(s.profile.name,'Gabriel');ok(/^[a-z0-9._]{3,20}$/.test(s.profile.handle),'handle válido');
 assert.equal(s.profile.link,'');assert.deepEqual([...s.profile.pinned],['vetiver','polo','arbo','clash','terre']);assert.deepEqual([...s.profile.styleTags],['Essencial']);
 ok(s.compare.length<=3&&s.compare.every(id=>L.ctx.byId(id)),'compare ≤3 válidos');assert.equal(s.recentSearches.length,8);assert.equal(s.onboarded,false);
 ok(!('a/b' in s.lists)&&'a b' in s.lists&&!('Tenho' in s.lists),'nomes de lista saneados');assert.deepEqual([...s.lists['a b']],['vetiver']);
 assert.deepEqual([...s.circle],['sofia']);assert.equal(s.location.mode,'city');assert.equal(s.location.name,'São Paulo');assert.equal(s.connect.minutes,30);assert.equal(s.connect.scopes.map,true);
 assert.equal(s.bubble.mode,'equilibrio');assert.equal(s.context.temp,45);assert.equal(s.context.environment,'Fechado');assert.equal(s.settings.theme,'system');assert.equal(s.settings.privacy.profile,'public');
 ok(Object.keys(s.feedback).length===0,'feedback inválido descartado');});

t('tom legado e capa "signature" sem assinatura',()=>{const L=load({seed:{'elixir-demo-v1':JSON.stringify({version:3,profile:{tone:'pedra',cover:'signature'}})}});L.api().Store.load();const s=L.api().state;
 assert.equal(s.profile.tone,'marinho');assert.equal(s.profile.cover,'none');
 const {ProfileRules}=L.api();assert.equal(ProfileRules.cleanTone('areia'),'ambar');assert.equal(ProfileRules.cleanTone('musgo'),'herbal');assert.equal(ProfileRules.cleanTone('onix'),'grafite');
 assert.equal(ProfileRules.sanitize({cover:'signature',signature:'vetiver'}).cover,'signature');});

t('usando hoje: 1 por data e fotos só nos 20 mais novos',()=>{const L=load();const {Store}=L.api();
 const posts=Array.from({length:25},(_,i)=>({id:'local-'+i,user:'me',perfume:'arbo',photo:'data:image/jpeg;base64,AAAA',text:'t',when:new Date(Date.now()-i*1000).toISOString()}));
 const s=Store.sanitize({posts,sotd:[{date:'2026-11-01',id:'arbo'},{date:'2026-11-01',id:'polo'},{date:'2026-11-03',id:'vetiver'}]});
 assert.equal(s.sotd.length,2);assert.equal(s.sotd[0].date,'2026-11-03');assert.equal(s.posts.filter(p=>p.photo).length,20);});

t('demonstração cobre o intel',()=>{const L=load();const {Store}=L.api();Store.load();Store.demo();const s=L.api().state,ids=Object.keys(s.ratings);
 ok(ids.length>=12,'≥12 avaliações');const span=Math.max(...ids.map(i=>s.ratedAt[i]))-Math.min(...ids.map(i=>s.ratedAt[i]));ok(span>150*864e5,'ratedAt espalhado (≥5 meses)');
 assert.equal(Object.values(s.shelf).filter(x=>x==='have').length,4);assert.equal(Object.values(s.shelf).filter(x=>x==='want').length,3);assert.equal(s.profile.pinned.length,5);
 assert.equal(s.sotd.length,3);ok(new Set(s.sotd.map(x=>x.ctx.occasion)).size>=2,'2 ocasiões');assert.equal(s.circle.length,3);ok(s.circle.includes('tiago'),'tiago no círculo');
 assert.equal(L.api().People.get('tiago').shareMap,false);assert.equal(Object.keys(s.feedback).length,2);assert.equal(s.location.mode,'city');assert.equal(s.onboarded,true);});

t('exportar JSON',()=>{const L=load();const {Store}=L.api();Store.load();Store.demo();const j=JSON.parse(Store.exportJSON());assert.equal(j.app,'ELIXIR');assert.equal(j.version,3);ok(j.ratings&&j.exportedAt,'campos');});

t('apagar meus dados',()=>{const L=load({seed:{'elixir-demo-v1-backup':'x','elixir-weather-v1':'{}','elixir-theme':'dark'}});const {Store}=L.api();Store.load();Store.demo();Store.wipe();
 for(const k of ['elixir-demo-v1','elixir-demo-v1-backup','elixir-weather-v1','elixir-theme'])assert.equal(L.storage.getItem(k),null,k);
 assert.equal(L.api().state.onboarded,false);assert.equal(Object.keys(L.api().state.ratings).length,0);});

t('cota: salva o texto sem a foto',()=>{const st=makeStorage({quotaOver:60000});const L=load({storage:st});const {Store}=L.api();Store.load();
 Store.update(s=>{s.posts=[{id:'local-big',user:'me',perfume:'arbo',photo:'data:image/jpeg;base64,'+'A'.repeat(80000),text:'meu texto',when:new Date().toISOString()}];},{silent:true});Store.flush();
 const saved=JSON.parse(st.getItem('elixir-demo-v1'));assert.equal(saved.posts[0].text,'meu texto');assert.equal(saved.posts[0].photo,'');ok(L.toasts.includes('Sem espaço para a foto. O registro foi salvo sem ela.'),'toast de cota');});

t('armazenamento indisponível',()=>{const L=load({storage:makeStorage({throwAll:true})});const {Store}=L.api();Store.load();ok(!Store.available,'indisponível');ok(Store.notices.includes('Seus dados ficarão só nesta sessão.'),'aviso único');
 Store.update(s=>{s.ratings.arbo=8;});assert.equal(L.api().state.ratings.arbo,8);});

t('sandbox nunca toca a chave principal',()=>{const st=makeStorage();st.setItem('elixir-demo-v1',JSON.stringify({version:3,onboarded:false}));const L=load({search:'?sandbox',storage:st});const {Store}=L.api();Store.load();
 assert.equal(Store.key,'elixir-presentation-sandbox-v1');assert.equal(L.api().state.onboarded,true);ok(st.getItem('elixir-presentation-sandbox-v1'),'sandbox salvo');assert.equal(JSON.parse(st.getItem('elixir-demo-v1')).onboarded,false);});

t('Select memorizado por revisão',()=>{const L=load();const {Store,Select}=L.api();Store.load();const a=Select.ranked(),b=Select.ranked();ok(a===b,'mesmo array em cache');
 Store.update(s=>{s.following=['sofia'];},{silent:true});ok(Select.ranked()===a,'mudança social não invalida');
 Store.update(s=>{s.ratings.arbo=2;},{silent:true});ok(Select.ranked()!==a,'avaliação invalida');const r=Select.bump();ok(r>=1,'bump');
 assert.equal(Select.handle(),'@gabriel');ok(/^\d{4}-\d{2}-\d{2}$/.test(Select.todayKey()),'todayKey');ok(Select.perfumeOfDay(),'perfume do dia');});

t('virada do dia no contexto',()=>{const L=load();const {Store}=L.api();const s=Store.sanitize({context:{date:'2000-01-01',occasion:'Encontro',outfit:'social',environment:'Aberto',intensity:'Marcante',city:'Recife',temp:30}});
 assert.equal(s.context.occasion,'Dia a dia');assert.equal(s.context.outfit,'');assert.equal(s.context.environment,'Aberto');assert.equal(s.context.intensity,'Marcante');assert.equal(s.context.city,'Recife');ok(['Dia','Noite'].includes(s.context.time),'time derivado');});

console.log(`verify-store: ${passed} verificações ok`);
