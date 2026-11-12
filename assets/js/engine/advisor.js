'use strict';
/* Guia de compra (§4.8): ranking explicável, compra às cegas, alternativas e camadas.
   Puro e determinístico: sem DOM e sem o estado global. Lê PERFUMES, PEOPLE, OBSERVATIONS, Engine e NoteModel;
   BRAND_TIERS, INGREDIENTS, INGREDIENT_ALIASES, MAP_AXES e OMap são opcionais (typeof). Nada é patrocinado: nenhuma marca ganha peso. */
const Advisor=(()=>{
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
 const N=s=>typeof NoteModel!=='undefined'?NoteModel.normalize(s):String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const byIdSafe=id=>{try{return typeof byId==='function'?byId(id):null;}catch(e){return null;}};
 const cmpId=(a,b)=>a<b?-1:a>b?1:0;
 const first=name=>String(name||'').trim().split(/\s+/)[0]||'';
 const top2=list=>{const s=[...list].sort((a,b)=>b-a);return ((s[0]||0)+(s[1]||0))/2;};

 /* ---------- famílias (14 eixos; MAP_AXES quando o intel estiver carregado) ---------- */
 const OWN=[['citrico','Cítrico',v=>v[0]],['aquatico','Aquático',v=>v[8]],['aromatico','Aromático',v=>v[2]],['verde','Verde',v=>v[1]],['herbal','Herbal',v=>v[19]],
  ['floral','Floral',v=>v[5]],['frutado','Frutado',v=>v[6]],['amadeirado','Amadeirado',v=>v[3]],['especiado','Especiado',v=>Math.max(v[9],v[10])],
  ['ambar','Âmbar',v=>Math.max(v[14],v[18])],['gourmand','Gourmand',v=>v[17]],['almiscarado','Almiscarado',v=>v[15]],['couro','Couro',v=>v[11]],
  ['incensado','Incensado',v=>Math.max(v[20],.6*v[13])]].map(([id,label,f])=>({id,label,f}));
 const SHORT={ambar:'âmbar',gourmand:'gourmand'};
 let famCache=null;
 function families(){
  if(famCache)return famCache;
  let list=OWN;
  if(typeof MAP_AXES!=='undefined'&&Array.isArray(MAP_AXES)){const fam=MAP_AXES.filter(a=>a&&a.family&&typeof a.f==='function'&&OWN.some(o=>o.id===a.id));
   if(fam.length>=8)list=fam.map(a=>({id:a.id,label:(OWN.find(o=>o.id===a.id)||a).label,f:a.f}));}
  famCache=list;return list;}
 const famLabel=id=>{const f=OWN.find(x=>x.id===id);return f?f.label:String(id||'');};
 const famWord=id=>SHORT[id]||famLabel(id).toLowerCase();
 const axCache=new Map();
 function axes(p){if(!p||!p.vector)return {};const hit=axCache.get(p.id);if(hit&&hit.v===p.vector)return hit.a;
  const a={};for(const f of families()){let x=0;try{x=f.f(p.vector);}catch(e){}a[f.id]=clamp(Number(x)||0);}axCache.set(p.id,{v:p.vector,a});return a;}
 function topFamily(p){const a=axes(p);let best=null;for(const f of families())if(!best||a[f.id]>a[best]||a[f.id]===a[best]&&f.id<best)best=f.id;return best?{id:best,label:famLabel(best),value:a[best]}:null;}

 /* ---------- atributos do perfume ---------- */
 const FRESH=[0,1,2,8,9,19],HEAVY=[7,10,11,12,13,14,17,18];
 const concOf=p=>String(p&&p.concentration||'');
 const strongConc=p=>/^(parfum|perfume|extrait|elixir)|extrait|elixir/i.test(concOf(p).trim());
 const lightConc=p=>/col[oô]nia|body splash|splash/i.test(concOf(p));
 function tier(p){if(!p)return null;const t=typeof BRAND_TIERS!=='undefined'&&BRAND_TIERS?BRAND_TIERS[p.brand]:null;return [1,2,3,4].includes(t)?t:null;}
 function tierLabel(t){const L=typeof TIER_LABELS!=='undefined'?TIER_LABELS:['','Acessível','Intermediária','Premium','Nicho'];return t?L[t]:'Faixa não informada';}
 const seasonCache=new Map();
 function season(p){if(!p||!p.vector)return {warm:.5,cold:.5,label:'Meia-estação'};const hit=seasonCache.get(p.id);if(hit&&hit.v===p.vector)return hit.s;
  const v=p.vector;let fresh=top2(FRESH.map(d=>v[d]||0)),heavy=top2(HEAVY.map(d=>v[d]||0));
  if(strongConc(p))heavy+=.1;if(lightConc(p))fresh+=.05;
  const warm=clamp(.2+fresh*.8-heavy*.4),cold=clamp(.2+heavy*.8-fresh*.3);
  const label=warm>=.55&&cold>=.45?'Qualquer estação':warm-cold>.2?'Calor':cold-warm>.2?'Frio':'Meia-estação';
  const s={warm:Math.round(warm*100)/100,cold:Math.round(cold*100)/100,label};seasonCache.set(p.id,{v:p.vector,s});return s;}
 function perf(p){try{if(typeof Engine!=='undefined'&&Engine.performance)return Engine.performance(p.id);}catch(e){}return {count:0,hours:0,projection:0};}
 function intensity(p){if(!p||!p.vector)return .5;const v=p.vector,heavy=top2(HEAVY.map(d=>v[d]||0));
  let x=.25+heavy*.55+(v[23]||0)*.1+(strongConc(p)?.15:/eau de parfum/i.test(concOf(p))?.08:lightConc(p)?-.1:0);
  const pf=perf(p);if(pf.count>=3)x=x*.5+clamp((pf.projection-1)/4)*.5;return clamp(x);}
 /* Vocabulário: ocasiões do Guia, dos presentes e do motor (OBSERVATIONS). */
 const OCC_ALIAS={'Cotidiano':'Dia a dia','Dia a dia':'Dia a dia','Trabalho':'Trabalho','Encontro':'Encontro','Jantar':'Encontro','Noite':'Encontro','Festa':'Festa','Evento':'Ocasião especial',
  'Calor e praia':'Calor e praia','Praia':'Calor e praia','Piscina':'Calor e praia','Ar livre':'Calor e praia','Ocasião especial':'Ocasião especial',
  'Aniversário':'Ocasião especial','Data especial':'Encontro','Natal':'Ocasião especial','Agradecimento':'Dia a dia','Sem motivo':'Dia a dia'};
 const ENGINE_OCC={'Dia a dia':'Cotidiano','Trabalho':'Trabalho','Encontro':'Jantar','Calor e praia':'Praia'};
 const OCCASIONS=['Dia a dia','Trabalho','Encontro','Festa','Calor e praia','Ocasião especial'];
 function occasionFit(p,occ){if(!p||!p.vector)return 0;const o=OCC_ALIAS[occ]||occ,v=p.vector,s=season(p),it=intensity(p);
  const fresh=top2(FRESH.map(d=>v[d]||0)),heavy=top2(HEAVY.map(d=>v[d]||0));let x=.4;
  if(o==='Dia a dia')x=.35+fresh*.35+(1-Math.abs(it-.4))*.25-heavy*.2;
  else if(o==='Trabalho')x=.3+Math.max(v[0],v[2],v[3],v[1])*.4+(v[15]||0)*.1-(v[17]+v[7]+v[23])*.12-Math.max(0,it-.6)*.4;
  else if(o==='Encontro')x=.25+Math.max(v[5],v[14],v[15],v[17],v[3])*.45+(v[21]||0)*.1+(1-Math.abs(it-.6))*.15;
  else if(o==='Festa')x=.2+Math.max(v[7],v[17],v[14],v[6],v[10])*.45+it*.3-(v[19]||0)*.1;
  else if(o==='Calor e praia')x=.2+Math.max(v[8],v[0],v[1])*.45+(v[21]||0)*.15+s.warm*.25-heavy*.25;
  else if(o==='Ocasião especial')x=.2+Math.max(v[14],v[13],v[11],v[5],v[3],v[18])*.45+it*.2+(strongConc(p)?.1:0);
  const eo=ENGINE_OCC[o];
  if(eo&&typeof OBSERVATIONS!=='undefined'){const obs=OBSERVATIONS.filter(b=>b.id===p.id&&b.occasion===eo);if(obs.length>=2)x=x*.7+(obs.reduce((a,b)=>a+b.rating,0)/obs.length/10)*.3;}
  return Math.round(clamp(x)*100)/100;}
 function polarity(p){if(!p||typeof PEOPLE==='undefined')return .5;const r=PEOPLE.map(u=>u.ratings&&u.ratings[p.id]).filter(x=>Number.isFinite(x));if(r.length<2)return .5;
  const m=r.reduce((a,b)=>a+b,0)/r.length;return Math.round(clamp(Math.sqrt(r.reduce((a,b)=>a+(b-m)**2,0)/r.length)/5)*100)/100;}
 function versatility(p){if(!p)return 0;const s=season(p),fits=['Dia a dia','Trabalho','Encontro','Festa','Calor e praia'].map(o=>occasionFit(p,o)).sort((a,b)=>b-a);
  const breadth=(fits[0]+fits[1]+fits[2])/3;return Math.round(clamp(.35*(1-Math.abs(s.warm-s.cold))+.35*breadth+.3*(1-Math.abs(intensity(p)-.45)*1.6))*100)/100;}

 /* ---------- notas (nome normalizado + aliases dos ingredientes) ---------- */
 const aliasCache=new Map();
 function aliasSet(name){const q=N(name);if(aliasCache.has(q))return aliasCache.get(q);const set=new Set([q]);
  if(typeof INGREDIENT_ALIASES!=='undefined'&&INGREDIENT_ALIASES){const ing=typeof INGREDIENTS!=='undefined'&&Array.isArray(INGREDIENTS)?INGREDIENTS:[];
   for(const [id,list] of Object.entries(INGREDIENT_ALIASES)){const i=ing.find(x=>x.id===id);if(N(id)===q||i&&N(i.name)===q){set.add(N(id));if(i)set.add(N(i.name));for(const a of list||[]){const k=N(a);if(k.length>=3)set.add(k);}}}}
  aliasCache.set(q,set);return set;}
 function noteMatches(note,name){const q=N(name);if(!q)return false;const n=N(note);if(!n)return false;const set=aliasSet(name);
  if(set.has(n))return true;if(q.length>=4&&n.startsWith(q))return true;
  const tail=String(note).split(/\s+(?:de|da|do|das|dos)\s+/i).pop();return tail!==note&&set.has(N(tail));}
 function noteNames(p){if(!p)return [];const out=(p.noteWeights||[]).map(w=>w.name);const x=p.notes&&p.notes.extra;if(Array.isArray(x))out.push(...x);return out;}
 function hasNote(p,noteName){return noteNames(p).some(n=>noteMatches(n,noteName));}

 /* ---------- avaliações e similaridade ---------- */
 const cos=(a,b)=>typeof Engine!=='undefined'?Engine.cosine(a,b):0;
 function clean(ratings){const out={};for(const [id,r] of Object.entries(ratings||{})){const p=byIdSafe(id),n=Number(r);if(p&&Number.isFinite(n))out[p.id]=Math.max(0,Math.min(10,n));}return out;}
 function nearest(p,R,test){let best=null;for(const [id,r] of Object.entries(R)){if(id===p.id||!test(r))continue;const q=byIdSafe(id);if(!q)continue;const s=cos(p.vector,q.vector);if(!best||s>best.sim||s===best.sim&&q.id<best.p.id)best={p:q,sim:s,r};}return best;}
 function engineRec(p,R,ctx,prefs){try{return Engine.recommend(p,R,ctx||{},prefs||{});}catch(e){return {score:50,confidence:'Dados insuficientes',reason:'',risk:'',peers:[],observations:0};}}
 /* Parecidos em outra faixa: perfil olfativo (cosseno) + notas em comum. Faixa é pela marca, nunca preço inventado.
   Inspiração só quando a marca declara (campo inspiredBy no catálogo). */
function noteKeySet(p){const m=new Map();for(const n of noteNames(p)){const k=String(n).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();if(k&&!m.has(k))m.set(k,n);}return m;}
function isNationalBrand(p){return typeof NATIONAL_BRANDS!=='undefined'&&Array.isArray(NATIONAL_BRANDS)?NATIONAL_BRANDS.includes(p.brand):false;}
function priceAlternatives(p,{dir='any',origin='any',n=6}={}){if(!p||!p.vector)return [];const t0=tier(p)||2,A=noteKeySet(p),out=[];
  for(const q of catalog()){if(q.id===p.id||!q.vector)continue;
   const declared=q.inspiredBy===p.id||p.inspiredBy===q.id;
   const tq=tier(q);if(!tq&&!declared)continue;
   if(dir==='cheaper'&&!(tq<t0))continue;if(dir==='pricier'&&!(tq>t0))continue;if(dir==='same'&&tq!==t0)continue;
   const nat=isNationalBrand(q);if(origin==='national'&&!nat)continue;if(origin==='imported'&&nat)continue;
   const B=noteKeySet(q),shared=[...A.keys()].filter(k=>B.has(k)).map(k=>A.get(k));
   const c=cos(p.vector,q.vector),jac=shared.length/Math.max(1,Math.min(A.size,B.size));
   if(!declared&&!(c>=.8||(shared.length>=3&&c>=.6)))continue;
   out.push({p:q,sim:Math.round(c*100),shared,tier:tq,national:nat,declared,score:.55*c+.45*jac+(declared?2:0)});}
  out.sort((a,b)=>b.score-a.score||cmpId(a.p.id,b.p.id));
  const brands=new Map(),res=[];for(const x of out){const k=brands.get(x.p.brand)||0;if(k>=2&&!x.declared)continue;brands.set(x.p.brand,k+1);res.push(x);if(res.length>=n)break;}
  return res;}
/* Recomendações (Guia, presentes, layering) usam fichas com foto ou da base curada: mostram o frasco e são mais confiáveis.
   O resto do catálogo continua na busca, em Descobrir e nos "parecidos em outra faixa". */
let poolCache=null,poolN=-1;
function rankPool(){const n=typeof PERFUMES!=='undefined'?PERFUMES.length:0;if(poolCache&&poolN===n)return poolCache;poolN=n;poolCache=catalog().filter(p=>p.image||p.origin!=='studio');return poolCache;}
function catalog(){const seen=new Set(),out=[];for(const p of typeof PERFUMES!=='undefined'?PERFUMES:[]){if(!p||seen.has(p.id))continue;seen.add(p.id);out.push(p);}return out;}

 function blindBuy(p,ratings={},prefs={}){
  if(!p)return {score:0,level:'Só com amostra',factors:[]};
  const R=clean(ratings),n=Object.keys(R).length,eng=engineRec(p,R,{},prefs);
  const love=nearest(p,R,r=>r>=8),hate=nearest(p,R,r=>r<=4),pol=polarity(p),ver=versatility(p);
  const people=typeof PEOPLE!=='undefined'?PEOPLE.filter(u=>u.ratings&&Number.isFinite(u.ratings[p.id])).length:0;
  const avoid=(prefs.dislikedNotes||[]).some(x=>hasNote(p,x));
  let score=eng.score*.45+(love?love.sim:0)*100*.2+(1-pol)*100*.15+ver*100*.2-(hate&&hate.sim>=.8?15:0)-(avoid?12:0);
  if(n<3)score=Math.min(score,64);score=Math.round(clamp(score,0,100));
  const level=score>=70?'Compra segura':score>=50?'Teste antes':'Só com amostra',f=[];
  if(love&&love.sim>=.85)f.push(`Muito parecido com ${love.p.name}, que você ama.`);
  if(hate&&hate.sim>=.8)f.push(`Lembra ${hate.p.name}, que você não gostou.`);
  if(avoid)f.push('Tem uma nota que você prefere evitar.');
  if(people>=2&&pol>=.6)f.push('Divide opiniões entre quem testou.');else if(people>=2&&pol<=.25)f.push('Quem testou costuma concordar.');
  if(ver>=.6)f.push('Versátil: funciona em vários momentos.');else if(ver<.4)f.push('Pede a ocasião certa.');
  if(n<3)f.push('Ainda há poucas avaliações suas.');
  return {score,level,factors:f.slice(0,3)};}

 function alternatives(p,{maxTier=null,n=2}={}){if(!p||!p.vector)return [];
  const run=lim=>{const out=[];for(const q of catalog()){if(q.id===p.id||q.brand===p.brand||!q.vector)continue;const t=tier(q);if(lim&&(!t||t>lim))continue;const s=cos(p.vector,q.vector);if(s>=.85)out.push({p:q,sim:Math.round(s*100)/100});}
   return out.sort((a,b)=>b.sim-a.sim||(tier(a.p)||9)-(tier(b.p)||9)||cmpId(a.p.id,b.p.id));};
  let out=run(maxTier);if(!out.length&&maxTier)out=run(null);
  /* variar marcas: no máximo uma por marca */
  const brands=new Set(),res=[];for(const x of out){if(brands.has(x.p.brand))continue;brands.add(x.p.brand);res.push(x);if(res.length>=n)break;}return res;}

 const COMPLEMENT={citrico:['amadeirado','almiscarado','aromatico'],aquatico:['amadeirado','almiscarado','citrico'],aromatico:['amadeirado','citrico','ambar'],verde:['amadeirado','floral','citrico'],
  herbal:['amadeirado','citrico','floral'],floral:['almiscarado','amadeirado','citrico','gourmand'],frutado:['almiscarado','floral','amadeirado'],amadeirado:['citrico','aromatico','especiado','ambar'],
  especiado:['amadeirado','ambar','citrico'],ambar:['amadeirado','especiado','citrico'],gourmand:['amadeirado','especiado','almiscarado'],almiscarado:['floral','citrico','amadeirado'],
  couro:['amadeirado','floral','especiado'],incensado:['amadeirado','citrico','floral']};
 function layering(p,ratings={},prefs={},{owned=[]}={}){if(!p||!p.vector)return null;const tp=topFamily(p);if(!tp)return null;
  const R=clean(ratings),own=new Set((owned||[]).map(id=>(byIdSafe(id)||{}).id).filter(Boolean)),want=COMPLEMENT[tp.id]||['amadeirado','citrico'];
  const avoid=prefs.dislikedNotes||[];let best=null;
  for(const q of rankPool()){if(q.id===p.id||!q.vector)continue;if(R[q.id]!==undefined&&R[q.id]<=4)continue;const tq=topFamily(q);if(!tq||tq.id===tp.id)continue;const k=want.indexOf(tq.id);if(k<0)continue;
   const s=cos(p.vector,q.vector);if(s<.3||s>.82)continue;if(avoid.some(x=>hasNote(q,x)))continue;
   const sc=(3-k)*.3+tq.value*.4+(1-Math.abs(s-.55))*.5+(own.has(q.id)?.6:0)+(R[q.id]>=6?(R[q.id]-5)/8:0)+(q.image?.08:0);
   if(!best||sc>best.sc||sc===best.sc&&q.id<best.q.id)best={q,tq,sc};}
  if(!best)return null;const q=best.q,heavier=intensity(q)>intensity(p)?q:p;
  return {p:q,why:`Junte o ${famWord(tp.id)} deste ao ${famWord(best.tq.id)} de ${q.name}. Aplique primeiro ${heavier===p?'este':q.name}, em pouca quantidade.`};}

 /* ---------- ranking ---------- */
 const TEMP={'Calor':30,'Frio':14,'Meia-estação':22};
 const OCC_WHY={'Dia a dia':'Vai bem no dia a dia.','Trabalho':'Combina com o trabalho.','Encontro':'Feito para encontros.','Festa':'Tem presença para festas.','Calor e praia':'Fresco para calor e praia.','Ocasião especial':'Elegante para ocasiões especiais.'};
 function normAnswers(a0){const a=a0&&typeof a0==='object'?a0:{};const fam={};for(const [k,v] of Object.entries(a.families||{}))if(v==='like'||v==='avoid')fam[k]=v;
  return {occasions:(Array.isArray(a.occasions)?a.occasions:[]).filter(x=>typeof x==='string').slice(0,2),climate:typeof a.climate==='string'?a.climate:'',presence:typeof a.presence==='string'?a.presence:'',
   allDay:a.allDay===true,families:fam,avoidNotes:(Array.isArray(a.avoidNotes)?a.avoidNotes:[]).filter(x=>typeof x==='string'&&x.trim()),tier:typeof a.tier==='string'?a.tier:'',audience:typeof a.audience==='string'?a.audience:''};}
 const TIER_IDS={'Acessível':1,'Intermediária':2,'Premium':3,'Nicho':4};
 /* Nicho é um estilo (só nicho); as outras faixas valem "até". */
 function tierFails(p,t){if(!t)return false;const x=tier(p);if(t===4)return x!==4;if(!x)return t<3;return x>t;}
 function personAxes(ratings){const R=clean(ratings),sum={},w={};for(const [id,r] of Object.entries(R)){const q=byIdSafe(id);if(!q)continue;const a=axes(q),s=(r-5)/5;for(const k of Object.keys(a)){sum[k]=(sum[k]||0)+s*a[k];w[k]=(w[k]||0)+a[k];}}
  return families().map(f=>({id:f.id,value:clamp(.5+.5*(sum[f.id]||0)/((w[f.id]||0)+1.5))})).sort((a,b)=>b.value-a.value||cmpId(a.id,b.id));}

 function rank(answers={},ratings={},prefs={},{forPerson=null,n=10,exclude=[],map=null,ctx=null,owned=[]}={}){
  const a=normAnswers(answers),R=clean(ratings),nR=Object.keys(R).length,P=prefs&&typeof prefs==='object'?prefs:{};
  const t=TIER_IDS[a.tier]||0,ex=new Set((exclude||[]).map(id=>(byIdSafe(id)||{}).id).filter(Boolean));
  const occ=a.occasions.map(o=>OCC_ALIAS[o]||o),mainOcc=occ[0]||'';
  const ectx={occasion:ENGINE_OCC[mainOcc]||'',temp:TEMP[a.climate]||'',time:['Encontro','Festa'].includes(mainOcc)?'Noite':''};
  const eprefs={...P,intensity:['Discreta','Equilibrada','Marcante'].includes(a.presence)?a.presence:(P.intensity||'')};
  const avoidFam=Object.keys(a.families).filter(k=>a.families[k]==='avoid'),likeFam=Object.keys(a.families).filter(k=>a.families[k]==='like');
  const who=forPerson&&forPerson.name?first(forPerson.name):'',handle=forPerson&&(forPerson.handle||forPerson.id);
  const pAx=forPerson?personAxes(R):null;
  const fails=p=>{const f=[];if(tierFails(p,t))f.push('tier');
   if(a.audience&&p.audience&&p.audience!=='Compartilhável'&&p.audience!==a.audience)f.push('audience');
   for(const x of a.avoidNotes)if(hasNote(p,x))f.push('note:'+x);
   if(avoidFam.length){const ax=axes(p),tp=topFamily(p);for(const k of avoidFam)if(ax[k]>=.4||tp&&tp.id===k)f.push('fam:'+k);}
   return f;};
  const gain={},pool=[];
  for(const p of rankPool()){if(!p.vector||ex.has(p.id))continue;if(forPerson?R[p.id]!==undefined:R[p.id]!==undefined&&R[p.id]<=4)continue;
   const f=fails(p);if(!f.length)pool.push(p);else if(f.length===1)gain[f[0]]=(gain[f[0]]||0)+1;}
  const scored=pool.map(p=>{const eng=engineRec(p,R,ectx,eprefs),s=season(p),it=intensity(p),ax=axes(p),pf=perf(p);
   const sm=a.climate==='Calor'?s.warm:a.climate==='Frio'?s.cold:a.climate==='Meia-estação'?1-Math.abs(s.warm-s.cold):.5;
   const of=occ.length?Math.max(...occ.map(o=>occasionFit(p,o))):.5;
   const pres=a.presence==='Discreta'?(.5-it)*12:a.presence==='Marcante'?(it-.5)*12:a.presence==='Equilibrada'?3-Math.abs(it-.5)*12:0;
   const fam=likeFam.reduce((x,k)=>x+(ax[k]||0)*6,0);
   const day=a.allDay&&pf.count>=3&&pf.hours>=6?5:0;const tb=t&&tier(p)===t?3:0;
   const fit=sm*8+of*8+Math.max(-6,Math.min(6,pres))+Math.min(12,fam)+day+tb;
   return {p,eng,raw:eng.score+fit,sm,of,it,ax,day,s};})
   .sort((x,y)=>y.raw-x.raw||cmpId(x.p.id,y.p.id));
  /* variedade: no máximo 2 por marca entre os primeiros */
  const picked=[],count={};for(const x of scored){if((count[x.p.brand]||0)>=2)continue;count[x.p.brand]=(count[x.p.brand]||0)+1;picked.push(x);if(picked.length>=n)break;}
  if(picked.length<n)for(const x of scored){if(picked.length>=n)break;if(!picked.includes(x))picked.push(x);}
  const lowSignal=nR<3&&!(P.styles||[]).length;
  const items=picked.map(x=>{const p=x.p,why=[],caution=[];const love=nearest(p,R,r=>r>=8);const chance=Math.round(clamp(x.raw*.82+6,5,96));
   if(forPerson&&pAx){const pa=pAx.slice(0,3).find(z=>x.ax[z.id]>=.45);if(pa)why.push([9,`Combina com o gosto de @${handle} por ${famWord(pa.id)}.`]);}
   if(love&&love.sim>=.8)why.push([8+love.sim,`Parecido com ${love.p.name}, que ${who||'você'} ama.`]);
   for(const k of likeFam)if(x.ax[k]>=.5)why.push([6+x.ax[k],`Tem o ${famWord(k)} que ${who?who+' gosta':'você escolheu'}.`]);
   if(a.climate&&x.sm>=.6)why.push([5+x.sm,a.climate==='Calor'?'Leve o bastante para o calor.':a.climate==='Frio'?'Encorpado para dias frios.':'Equilibrado para a meia-estação.']);
   if(mainOcc&&x.of>=.6&&OCC_WHY[mainOcc])why.push([5+x.of,OCC_WHY[mainOcc]]);
   if(a.presence==='Discreta'&&x.it<.42)why.push([4,'Discreto, sem invadir o espaço de ninguém.']);
   if(a.presence==='Marcante'&&x.it>.6)why.push([4,'Tem presença e deixa rastro.']);
   if(x.day)why.push([4.5,'Dura o dia todo, segundo relatos de demonstração.']);
   if(!why.length)why.push([1,'Equilibra bem as suas respostas.']);
   const hate=nearest(p,R,r=>r<=4),pol=polarity(p);
   const avoided=(P.dislikedNotes||[]).find(nm=>hasNote(p,nm))||a.avoidNotes.find(nm=>hasNote(p,nm));
   if(avoided)caution.push(`Tem ${String(avoided).toLowerCase()}, que ${who?who+' prefere':'você prefere'} evitar.`);
   else if(hate&&hate.sim>=.75)caution.push(`Lembra ${hate.p.name}, que ${who?who+' não curtiu':'você não gostou'}. Teste antes.`);
   else if(pol>=.6)caution.push('Divide opiniões. Vale testar na pele.');
   else if(a.climate==='Calor'&&x.s.cold>.65)caution.push('Pode pesar no calor.');
   const whyTxt=why.sort((u,v)=>v[0]-u[0]).map(w=>w[1]).filter((w,i,l)=>l.indexOf(w)===i).slice(0,3);
   const level=nR<3&&!forPerson?'Dados insuficientes':x.eng.confidence==='Dados insuficientes'?'Dados insuficientes':x.eng.confidence;
   let explain={id:p.id,line:whyTxt[0],chance,similar:love?{p:love.p,pct:Math.round(love.sim*100)}:null,level,n:nR,kind:love?'similar':'chance',experimental:false,because:whyTxt,caution:caution[0]||''};
   if(!forPerson&&map&&typeof OMap!=='undefined'&&OMap.explain){try{const o=OMap.explain(p,map,{ctx,source:'guide'});if(o)explain={...o,id:p.id,chance,caution:caution[0]||o.caution||''};}catch(e){}}
   return {p,score:Math.round(x.raw*10)/10,chance,why:whyTxt,cautions:caution.slice(0,1),blindBuy:blindBuy(p,R,P),alternatives:alternatives(p,{maxTier:tier(p),n:2}),
    layering:layering(p,R,P,{owned}),explain,season:x.s};});
  const LABEL=k=>k==='tier'?'Qualquer faixa':k==='audience'?'Qualquer público':k.startsWith('note:')?'Aceitar '+k.slice(5).toLowerCase():k.startsWith('fam:')?'Aceitar '+famWord(k.slice(4)):k;
  const relax=items.length<3?Object.entries(gain).filter(([,g])=>g>0).sort((x,y)=>y[1]-x[1]||cmpId(x[0],y[0])).map(([key,g])=>({key,label:LABEL(key),gain:g})).slice(0,6):[];
  return {items,relax,lowSignal,total:pool.length};}

 /* Remove uma restrição (chip "relaxar"); devolve respostas novas. */
 function relaxAnswers(answers,key){const a=normAnswers(answers);
  if(key==='tier')a.tier='';else if(key==='audience')a.audience='';
  else if(key.startsWith('note:')){const x=key.slice(5);a.avoidNotes=a.avoidNotes.filter(n=>n!==x);}
  else if(key.startsWith('fam:')){const k=key.slice(4);delete a.families[k];}
  return a;}

 /* ---------- presentes (REQ §14) ---------- */
 function gift(result,person=null,{styles=[],wishlist=[]}={}){
  const items=(result&&result.items)||[],R=person&&person.shareMap!==false?clean(person.ratings):{},name=person?first(person.name):'';
  const dislikes=person?[...(person.disliked||[])].map(s=>String(s).replace(/-/g,' ')):[];
  const bad=Object.entries(R).filter(([,r])=>r<=4).map(([id])=>byIdSafe(id)).filter(Boolean);
  const ok=x=>R[x.p.id]===undefined&&!dislikes.some(d=>hasNote(x.p,d))&&!bad.some(q=>cos(q.vector,x.p.vector)>=.9);
  const pool=items.filter(ok);
  const nR=Object.keys(R).length,conf=person?nR/(nR+4):0,lowSignal=!person||nR<3;
  const level=!person||nR<3?'Dados insuficientes':conf>.6?'Moderada':'Baixa';
  const pAx=person?personAxes(R):[];const topIds=pAx.slice(0,2).map(x=>x.id),sec=pAx.slice(2,5).map(x=>x.id);
  const accept=x=>{let v=Math.round(x.chance*(.55+.45*conf));if(!person)v=Math.min(65,v);return Math.max(5,Math.min(95,v));};
  const reason=(x,wish)=>{const w=[];if(wish)w.push(`Está na lista de desejos de ${name}.`);
   if(person){const fa=pAx.slice(0,3).find(z=>axes(x.p)[z.id]>=.45);if(fa)w.push(`Tem o ${famWord(fa.id)} que ${name} mais avalia bem.`);
    const love=nearest(x.p,R,r=>r>=8);if(love&&love.sim>=.8)w.push(`Parecido com ${love.p.name}, que ${name} ama.`);}
   else if(styles.length)w.push('Combina com o estilo que você escolheu.');
   for(const y of x.why)if(w.length<2&&!/^Combina com o gosto/.test(y))w.push(y);return [...new Set(w)].slice(0,2);};
  const mk=(x,wish)=>({p:x.p,acceptance:accept(x),level,why:reason(x,wish),fromWishlist:!!wish});
  const wishIds=new Set((wishlist||[]).map(id=>(byIdSafe(id)||{}).id).filter(Boolean));
  const safe=[];for(const x of pool)if(wishIds.has(x.p.id)&&safe.length<3)safe.push(mk(x,true));
  const scores=pool.map(x=>x.score).sort((a,b)=>a-b),p70=scores.length?scores[Math.floor(scores.length*.3)]:0;
  const calm=pool.filter(x=>!wishIds.has(x.p.id)&&x.score>=p70).sort((a,b)=>polarity(a.p)-polarity(b.p)||b.score-a.score||cmpId(a.p.id,b.p.id));
  for(const x of calm){if(safe.length>=3)break;safe.push(mk(x,false));}
  const used=new Set(safe.map(s=>s.p.id)),bold=[];
  const boldPool=pool.filter(x=>!used.has(x.p.id)).map(x=>{const tp=topFamily(x.p),ax=axes(x.p);const outside=tp&&!topIds.includes(tp.id);const bridge=sec.find(k=>ax[k]>=.4);return {x,outside,bridge,nov:outside?1:0};})
   .filter(z=>z.outside&&(person?z.bridge:true)).sort((a,b)=>b.x.score-a.x.score||cmpId(a.x.p.id,b.x.p.id));
  const brands=new Set(safe.map(s=>s.p.brand));
  for(const z of boldPool){if(bold.length>=2)break;if(brands.has(z.x.p.brand))continue;brands.add(z.x.p.brand);
   const it=mk(z.x,false);if(person&&z.bridge)it.why=[`Fora do ${famWord(topIds[0])} de sempre, mas o ${famWord(z.bridge)} faz a ponte com o gosto de ${name}.`,...it.why].slice(0,2);
   else it.why=['Uma aposta diferente, ainda dentro do que você contou.',...it.why].slice(0,2);
   it.acceptance=Math.max(5,it.acceptance-8);bold.push(it);}
  const known=Object.keys(R).length;
  return {safe,bold,lowSignal,excluded:known};}

 return {priceAlternatives,isNationalBrand,tier,tierLabel,season,occasionFit,polarity,versatility,intensity,hasNote,blindBuy,alternatives,layering,rank,gift,relaxAnswers,
  families,famLabel,famWord,axes,topFamily,personAxes,OCCASIONS,OCC_ALIAS,TIERS:['Acessível','Intermediária','Premium','Nicho']};
})();
