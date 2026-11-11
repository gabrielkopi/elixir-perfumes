'use strict';
/* Mapa olfativo (intel, §4.10). Puro e sem DOM: lê DIMENSIONS, PERFUMES, byId, PEOPLE, OBSERVATIONS, Engine e NoteModel,
   e de forma opcional (typeof) COMMUNITY, People, Advisor, BRAND_TIERS, INGREDIENTS, noteImage e INGREDIENT_ALIASES.
   Recebe o estado como parâmetro; nunca lê o `state` global. Determinístico: empates resolvidos pelo id. */
const MAP_AXES=[
 {id:'citrico',label:'Cítrico',family:true,f:v=>v[0]},
 {id:'aquatico',label:'Aquático',family:true,f:v=>v[8]},
 {id:'aromatico',label:'Aromático',family:true,f:v=>v[2]},
 {id:'verde',label:'Verde',family:true,f:v=>v[1]},
 {id:'herbal',label:'Herbal',family:true,f:v=>v[19]},
 {id:'floral',label:'Floral',family:true,f:v=>v[5]},
 {id:'frutado',label:'Frutado',family:true,f:v=>v[6]},
 {id:'amadeirado',label:'Amadeirado',family:true,f:v=>v[3]},
 {id:'especiado',label:'Especiado',family:true,f:v=>Math.max(v[9],v[10])},
 {id:'ambar',label:'Oriental/âmbar',family:true,f:v=>Math.max(v[14],v[18])},
 {id:'gourmand',label:'Gourmand',family:true,f:v=>v[17]},
 {id:'almiscarado',label:'Almiscarado',family:true,f:v=>v[15]},
 {id:'couro',label:'Couro',family:true,f:v=>v[11]},
 {id:'incensado',label:'Incensado',family:true,f:v=>Math.max(v[20],.6*v[13])},
 {id:'atalcado',label:'Atalcado',family:false,f:v=>v[16]},
 {id:'doce',label:'Doce',family:false,f:v=>Math.max(v[7],.7*v[17],.5*v[21])},
 {id:'fresco',label:'Fresco',family:false,f:v=>{const s=[v[0],v[1],v[2],v[8],v[9],v[19]].sort((a,b)=>b-a);return (s[0]+s[1])/2;}},
 {id:'seco',label:'Seco',family:false,f:v=>Math.max(v[3],v[4],v[20])*(1-v[7])},
 {id:'quente',label:'Quente',family:false,f:v=>Math.max(v[10],v[14],v[18],v[17])},
 {id:'terroso',label:'Terroso',family:false,f:v=>v[4]},
 {id:'resinoso',label:'Resinoso',family:false,f:v=>v[13]},
 {id:'tabaco',label:'Tabaco',family:false,f:v=>v[12]},
 {id:'lactonico',label:'Lactônico',family:false,f:v=>v[21]},
 {id:'aldeidico',label:'Aldeídico',family:false,f:v=>v[22]},
 {id:'animalico',label:'Animálico',family:false,f:v=>v[23]}
];

const OMap=(()=>{
 const AX=MAP_AXES,NA=AX.length,IDX=Object.fromEntries(AX.map((a,i)=>[a.id,i]));
 const DAY=864e5,WINDOW=60*DAY;
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const round=x=>Math.round(x);
 const P=id=>typeof byId==='function'?byId(id):null;
 const norm=s=>typeof NoteModel!=='undefined'&&NoteModel.normalize?NoteModel.normalize(s):String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
 const frac=s=>(hash(s)%10007)/10007;
 const byIdCmp=(a,b)=>a<b?-1:a>b?1:0;
 const lower=label=>label==='Oriental/âmbar'?'âmbar':label.toLowerCase();
 const join=list=>list.length<2?(list[0]||''):list.slice(0,-1).join(', ')+' e '+list[list.length-1];
 const plural=(n,one,many)=>n+' '+(n===1?one:many);

 /* ---------- eixos de um perfume (cache por id + identidade do vetor) ---------- */
 const axCache=new Map();
 function axesOf(p){if(!p||!p.vector)return new Float64Array(NA);const hit=axCache.get(p.id);if(hit&&hit.v===p.vector)return hit.a;
  const a=new Float64Array(NA);for(let i=0;i<NA;i++)a[i]=clamp(Number(AX[i].f(p.vector))||0);axCache.set(p.id,{v:p.vector,a});return a;}
 function noteAxes(name){const v=typeof NoteModel!=='undefined'&&NoteModel.vector?NoteModel.vector(name):null;if(!v)return new Float64Array(NA);
  const a=new Float64Array(NA);for(let i=0;i<NA;i++)a[i]=clamp(Number(AX[i].f(v))||0);return a;}
 const strongest=(a,{family=false}={})=>{let best=-1,bv=-1;for(let i=0;i<NA;i++){if(family&&!AX[i].family)continue;if(a[i]>bv+1e-9){bv=a[i];best=i;}}return best;};
 const cos=(a,b)=>{let d=0,x=0,y=0;for(let i=0;i<a.length;i++){d+=a[i]*b[i];x+=a[i]*a[i];y+=b[i]*b[i];}return x&&y?d/Math.sqrt(x*y):0;};

 /* ---------- notas ---------- */
 let ingIndex=null;
 function ingredientOf(name){
  if(typeof INGREDIENTS==='undefined')return null;
  if(!ingIndex){ingIndex=new Map();
   for(const i of INGREDIENTS){ingIndex.set(norm(i.name),i);ingIndex.set(norm(i.id),i);}
   if(typeof INGREDIENT_ALIASES!=='undefined'&&INGREDIENT_ALIASES){for(const [id,labels] of Object.entries(INGREDIENT_ALIASES)){const i=INGREDIENTS.find(x=>x.id===id);if(!i)continue;for(const l of labels||[]){const k=norm(l);if(k&&!ingIndex.has(k))ingIndex.set(k,i);}}}}
  return ingIndex.get(norm(name))||null;}
 function noteNames(p){return p&&Array.isArray(p.noteWeights)?p.noteWeights:[];}
 function hasNote(p,note){
  if(typeof Advisor!=='undefined'&&Advisor.hasNote){try{return !!Advisor.hasNote(p,note);}catch(e){}}
  const k=norm(note);if(!k)return false;const ing=ingredientOf(note);
  const keys=new Set([k]);if(ing){keys.add(norm(ing.name));if(typeof INGREDIENT_ALIASES!=='undefined'&&INGREDIENT_ALIASES[ing.id])for(const l of INGREDIENT_ALIASES[ing.id])keys.add(norm(l));}
  return noteNames(p).some(w=>{const n=norm(w.name);return keys.has(n)||(ing&&ingredientOf(w.name)===ing);});}

 /* ---------- evidências ---------- */
 const RATING_PTS=[[0,-1],[2,-.9],[4,0],[6,.45],[8,.8],[10,1]];
 function ratingSignal(r){r=clamp(Number(r)||0,0,10);for(let i=1;i<RATING_PTS.length;i++){const [x1,y1]=RATING_PTS[i],[x0,y0]=RATING_PTS[i-1];if(r<=x1)return y0+(y1-y0)*(r-x0)/(x1-x0);}return 1;}
 const STRONG=new Set(['quente','ambar','couro','resinoso','tabaco']);
 function concFactor(p,axis){if(!STRONG.has(axis))return 1;const c=String(p.concentration||'');
  if(/parfum$|^parfum|extrait|elixir|^perfume$/i.test(c)&&!/eau de parfum|deo parfum/i.test(c))return 1.1;
  if(/col[oô]nia|body splash/i.test(c))return .9;return 1;}
 const ob=o=>o&&typeof o==='object'?o:{};
 /* Lista de sinais por perfume: {id, s, w, kind:'proof'|'hyp', at, src} */
 function evidence(st){
  const out=[],R=ob(st.ratings),RA=ob(st.ratedAt),SH=ob(st.shelf),SA=ob(st.shelfAt),pinned=Array.isArray(st.pinned)?st.pinned:[];
  for(const id of Object.keys(R).sort()){const p=P(id);if(!p)continue;out.push({id:p.id,s:ratingSignal(R[id]),w:1,kind:'proof',at:Number(RA[id])||0,src:'rating'});}
  for(const id0 of pinned){const p=P(id0);if(!p||R[p.id]!==undefined)continue;out.push({id:p.id,s:.8,w:1,kind:'proof',at:null,src:'pinned'});}
  for(const id of Object.keys(SH).sort()){const p=P(id);if(!p||R[p.id]!==undefined)continue;const stt=SH[id];
   if(stt==='have'&&!pinned.includes(p.id))out.push({id:p.id,s:.35,w:.5,kind:'proof',at:Number(SA[id])||0,src:'have'});
   else if(stt==='want')out.push({id:p.id,s:.25,w:.4,kind:'hyp',at:Number(SA[id])||0,src:'want'});}
  for(const [id,f] of Object.entries(ob(st.feedback)).sort((a,b)=>byIdCmp(a[0],b[0]))){const p=P(id);if(!p||![1,-1].includes(Number(f&&f.v)))continue;out.push({id:p.id,s:.6*Number(f.v),w:.8,kind:'proof',at:Number(f.at)||0,src:'feedback'});}
  const seen=ob(ob(st.bubble).seen);for(const [id,x] of Object.entries(seen).sort((a,b)=>byIdCmp(a[0],b[0]))){const p=P(id);if(!p||![1,-1].includes(Number(x&&x.v)))continue;out.push({id:p.id,s:.4*Number(x.v),w:.6,kind:'proof',at:Number(x.at)||0,src:'bubble'});}
  return out;}

 /* Valores por eixo a partir de uma lista de sinais (+ hipóteses por eixo). */
 function axisValues(sig,extra=[]){
  const num=new Float64Array(NA),den=new Float64Array(NA),n=new Int32Array(NA),nh=new Int32Array(NA),agreeP=new Float64Array(NA),agreeN=new Float64Array(NA);
  const proofIds=Array.from({length:NA},()=>new Set());
  for(const e of sig){const p=P(e.id);if(!p)continue;const a=axesOf(p);
   for(let i=0;i<NA;i++){const ai=a[i];if(ai<.05)continue;const s=e.s*concFactor(p,AX[i].id);
    num[i]+=e.w*s*ai;den[i]+=e.w*ai;
    if(ai>=.3){if(e.kind==='proof'){proofIds[i].add(e.id);if(s>0.05)agreeP[i]++;else if(s<-0.05)agreeN[i]++;}else nh[i]++;}}}
  for(const h of extra){const i=IDX[h.axis];if(i===undefined)continue;num[i]+=h.w*h.s*(h.a||.6);den[i]+=h.w*(h.a||.6);nh[i]++;}
  for(let i=0;i<NA;i++)n[i]=proofIds[i].size;
  const value=new Float64Array(NA);for(let i=0;i<NA;i++)value[i]=clamp(.5+.5*num[i]/(den[i]+1.5));
  return {value,n,nh,agreeP,agreeN};}

 const signOf=v=>v>=.62?'gosta':v<=.38?'evita':'neutro';

 /* ---------- build ---------- */
 function build(st0,{hyp=[]}={}){
  const st=ob(st0),sig=evidence(st),m=ob(st.map),priors=ob(m.priors),corr=ob(m.corrections);
  const extra=[...hyp];for(const [axis,v] of Object.entries(priors).sort((a,b)=>byIdCmp(a[0],b[0]))){if(v==='like')extra.push({axis,s:.3,w:.5});else if(v==='avoid')extra.push({axis,s:-.5,w:.5});}
  const V=axisValues(sig,extra);
  const ratedCount=Object.keys(ob(st.ratings)).filter(id=>P(id)).length;
  const axes=AX.map((d,i)=>{let value=V.value[i];const n=V.n[i],nh=V.nh[i],conf=Math.min(.85,n/(n+3));
   const agreeing=value>=.5?V.agreeP[i]:V.agreeN[i],total=V.agreeP[i]+V.agreeN[i];
   let level='sem-dados';
   if(n>=3&&ratedCount>=3&&Math.abs(value-.5)>=.12&&total>0&&agreeing/total>=.75)level='comprovado';
   else if(n>0||nh>0)level='hipotese';
   const o={id:d.id,label:d.label,family:d.family,value,n,nh,confidence:conf,level,sign:signOf(value),corrected:false};
   const c=corr[d.id];
   if(c&&c.v===-1){o.value=Math.min(value,.2);o.level='comprovado';o.corrected=true;o.correction=-1;}
   else if(c&&c.v===1){o.value=Math.max(value,.75);o.level='comprovado';o.corrected=true;o.correction=1;}
   o.sign=signOf(o.value);return o;});
  const byVal=(a,b)=>(b.value-.5)*Math.max(b.confidence,.2)-(a.value-.5)*Math.max(a.confidence,.2)||b.value-a.value||byIdCmp(a.id,b.id);
  const fam=axes.filter(a=>a.family);
  let primary=fam.filter(a=>a.sign==='gosta'&&a.level==='comprovado').sort(byVal).slice(0,2),primaryHyp=false;
  if(!primary.length){primary=fam.filter(a=>a.sign==='gosta'&&a.level==='hipotese').sort(byVal).slice(0,2);primaryHyp=primary.length>0;}
  const pIds=new Set(primary.map(a=>a.id));
  const secondary=fam.filter(a=>!pIds.has(a.id)&&a.sign==='gosta'&&a.level!=='sem-dados').sort((a,b)=>(a.level==='comprovado'?0:1)-(b.level==='comprovado'?0:1)||byVal(a,b)).slice(0,3);
  const rejected=axes.filter(a=>a.sign==='evita'&&a.level!=='sem-dados').sort((a,b)=>(a.level==='comprovado'?0:1)-(b.level==='comprovado'?0:1)||a.value-b.value||byIdCmp(a.id,b.id)).slice(0,3);
  const top6=[...axes].filter(a=>a.level!=='sem-dados').sort((a,b)=>Math.abs(b.value-.5)-Math.abs(a.value-.5)||byIdCmp(a.id,b.id)).slice(0,6);
  const confidence=top6.length?top6.reduce((s,a)=>s+a.confidence,0)/top6.length:0;
  const level=ratedCount<3?'Dados insuficientes':confidence>=.7&&ratedCount>=8?'Boa':confidence>=.55&&ratedCount>=5?'Moderada':'Baixa';
  const count=src=>sig.filter(e=>e.src===src).length;
  const evidenceCount={ratings:count('rating'),have:Object.values(ob(st.shelf)).filter(x=>x==='have').length,want:Object.values(ob(st.shelf)).filter(x=>x==='want').length,
   tried:Object.values(ob(st.shelf)).filter(x=>x==='tried').length,pinned:(Array.isArray(st.pinned)?st.pinned:[]).filter(id=>P(id)).length,feedback:count('feedback'),bubble:count('bubble')};
  const combos=combosOf(sig);
  const trend=trendOf(sig);
  const total=sig.length+extra.length;
  return {axes,primary,primaryHyp,secondary,rejected,combos,trend,evidence:evidenceCount,confidence,level,total,ratings:ob(st.ratings),st,rev:hash(JSON.stringify([sig.map(e=>[e.id,e.s,e.w]),priors,corr]))};}

 /* ---------- combinações (nota isolada ≠ combinação) ---------- */
 function combosOf(sig){
  const per=new Map();for(const e of sig){if(e.kind!=='proof')continue;const x=per.get(e.id)||{sw:0,w:0};x.sw+=e.s*e.w;x.w+=e.w;per.set(e.id,x);}
  const pos=[],neg=[];for(const [id,x] of [...per].sort((a,b)=>byIdCmp(a[0],b[0]))){const s=x.sw/x.w,p=P(id);if(!p)continue;if(s>=.3)pos.push({p,s});else if(s<=-.3)neg.push({p,s});}
  const names=new Map(),notesOf=p=>{const set=[...new Set(noteNames(p).map(w=>{const k=norm(w.name);if(k&&!names.has(k))names.set(k,w.name);return k;}).filter(Boolean))].sort();return set;};
  const pair=(list)=>{const m=new Map();for(const {p,s} of list){const ns=notesOf(p);for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){const k=ns[i]+'|'+ns[j];const x=m.get(k)||{n:0,abs:0};x.n++;x.abs+=Math.abs(s);m.set(k,x);}}return m;};
  const P2=pair(pos),N2=pair(neg);
  const label=k=>names.get(k)||k;
  const rank=(a,b)=>b[1].n-a[1].n||b[1].abs-a[1].abs||byIdCmp(a[0],b[0]);
  const liked=[...P2].filter(([k,x])=>x.n>=2&&!N2.has(k)).sort(rank).slice(0,4).map(([k,x])=>{const [a,b]=k.split('|');return {a:label(a),b:label(b),ka:a,kb:b,n:x.n};});
  const rejectedAll=[...N2].filter(([k,x])=>x.n>=2&&!P2.has(k)).sort(rank);
  const rejected=rejectedAll.slice(0,4).map(([k,x])=>{const [a,b]=k.split('|');return {a:label(a),b:label(b),ka:a,kb:b,n:x.n};});
  const posNotes=pos.map(x=>new Set(notesOf(x.p)));
  const contrasts=[];for(const [k] of rejectedAll){const [a,b]=k.split('|');const aw=posNotes.filter(s=>s.has(a)&&!s.has(b)).length,bw=posNotes.filter(s=>s.has(b)&&!s.has(a)).length;
   if(aw>=2&&bw>=2)contrasts.push({note:label(a),with:label(b)});if(contrasts.length>=4)break;}
  return {liked,rejected,contrasts};}

 /* ---------- mudança de gosto ---------- */
 function trendOf(sig,now=null){
  const timed=sig.filter(e=>e.kind==='proof'&&Number.isFinite(e.at)&&e.at>0);if(timed.length<4)return [];
  const ref=now||Math.max(...timed.map(e=>e.at));
  const old=timed.filter(e=>e.at<ref-WINDOW),recent=timed.filter(e=>e.at>=ref-WINDOW);if(old.length<2||recent.length<2)return [];
  const A=axisValues(old),B=axisValues(recent),out=[];
  for(let i=0;i<NA;i++){if(A.n[i]>=2&&B.n[i]>=2){const d=B.value[i]-A.value[i];if(Math.abs(d)>=.15)out.push({axis:AX[i].id,label:AX[i].label,delta:d,from:A.value[i],to:B.value[i]});}}
  return out.sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||byIdCmp(a.axis,b.axis)).slice(0,2);}

 /* Série mensal de um eixo (para o gráfico de evolução): valor com a evidência acumulada até o fim de cada mês. */
 function series(st,axis,{months=8}={}){
  const sig=evidence(ob(st)).filter(e=>e.kind==='proof'&&Number.isFinite(e.at)&&e.at>0);const i=IDX[axis];if(i===undefined||sig.length<2)return [];
  const end=Math.max(...sig.map(e=>e.at)),d=new Date(end),out=[];
  for(let k=months-1;k>=0;k--){const cut=new Date(d.getFullYear(),d.getMonth()-k+1,1).getTime();const part=sig.filter(e=>e.at<cut);if(part.length<2)continue;
   const V=axisValues(part);if(V.n[i]<1)continue;const md=new Date(cut-1);out.push({month:md.getFullYear()+'-'+String(md.getMonth()+1).padStart(2,'0'),value:V.value[i]});}
  return out;}

 /* ---------- pessoas ---------- */
 const personCache=new Map();
 function person(id){if(typeof People!=='undefined'&&People.all){try{return People.all().find(p=>p.id===id)||null;}catch(e){}}
  return typeof PEOPLE!=='undefined'?PEOPLE.find(p=>p.id===id)||null:null;}
 const FAMILY_WORD={floral:'floral',amadeirada:'amadeirado',amadeirado:'amadeirado',citrica:'citrico',citrico:'citrico',aquatica:'aquatico',aquatico:'aquatico',verde:'verde',
  aromatica:'aromatico',aromatico:'aromatico',gourmand:'gourmand',doce:'doce',especiada:'especiado',especiado:'especiado',oriental:'ambar',ambar:'ambar',ambarada:'ambar',couro:'couro',frutada:'frutado',frutado:'frutado',almiscarada:'almiscarado'};
 function forPerson(id){const u=person(id);if(!u)return null;const key=id+':'+(typeof PERFUMES!=='undefined'?PERFUMES.length:0);if(personCache.has(key))return personCache.get(key);
  const ratings={};for(const [pid,r] of Object.entries(ob(u.ratings))){const p=P(pid);if(p)ratings[p.id]=r;}
  const hyp=[];const fw=norm(u.family||'');for(const [k,axis] of Object.entries(FAMILY_WORD))if(fw.startsWith(k)){hyp.push({axis,s:.5,w:.8,a:1});break;}
  const noteHyp=(list,s)=>{for(const n of list||[]){const ing=ingredientOf(n);const label=ing?ing.name:n;const a=noteAxes(label);const i=strongest(a);if(i>=0&&a[i]>=.4)hyp.push({axis:AX[i].id,s,w:.5,a:a[i]});}};
  noteHyp(u.liked,.5);noteHyp(u.disliked,-.6);
  const map=build({ratings,ratedAt:{},shelf:{},shelfAt:{},feedback:{},bubble:{seen:{}},map:{corrections:{},priors:{}},pinned:[]},{hyp});
  map.person={id:u.id,name:u.name,shareMap:u.shareMap!==false};personCache.set(key,map);return map;}

 /* ---------- chance de gostar ---------- */
 function engineScore(p,ratings,ctx){if(typeof Engine==='undefined')return 50;try{return Engine.recommend(p,ratings||{},ctx||{}).score;}catch(e){return 50;}}
 function mapScore(p,map){const a=axesOf(p);let S=0,N=0;
  for(let i=0;i<NA;i++){const x=map.axes[i];if(!x||x.level==='sem-dados')continue;const c=Math.max(x.confidence,x.corrected?.6:0,x.level==='hipotese'?.15:0);S+=(x.value-.5)*a[i]*c;N+=.5*a[i]*c;}
  let s=50+50*S/(N+.35);
  const ns=new Set(noteNames(p).map(w=>norm(w.name)));
  for(const r of map.combos.rejected)if(ns.has(r.ka)&&ns.has(r.kb))s-=15;
  const top=strongest(a);if(top>=0){const x=map.axes[top];if(x&&x.sign==='evita'&&x.level==='comprovado')s-=25;}
  return clamp(s,0,100);}
 /* O Engine é conservador (votos neutros puxam tudo para perto de 50): esticamos em torno do centro antes de misturar 60/40 com o mapa. */
 function chance(p,map,{ctx=null}={}){if(!p||!map)return 50;const e=clamp(50+(engineScore(p,map.ratings,ctx)-50)*2.4,0,100);return round(clamp(.6*e+.4*mapScore(p,map),3,97));}

 function similar(p,st){if(!p)return null;st=ob(st);const R=ob(st.ratings),SH=ob(st.shelf);
  const pool=new Set([...Object.keys(R).filter(id=>R[id]>=8),...Object.keys(SH).filter(id=>SH[id]==='have')]);pool.delete(p.id);
  let best=null,bv=-1;for(const id of [...pool].sort()){const q=P(id);if(!q||q.id===p.id)continue;const c=typeof Engine!=='undefined'?Engine.cosine(p.vector,q.vector):cos(p.vector,q.vector);if(c>bv+1e-9){bv=c;best=q;}}
  return best?{p:best,pct:round(bv*100),rating:R[best.id]}:null;}

 /* ---------- explicação ---------- */
 function contributions(p,map){const a=axesOf(p);return map.axes.map((x,i)=>({x,a:a[i],c:(x.value-.5)*a[i]*Math.max(x.confidence,x.level==='hipotese'?.2:0,x.corrected?.6:0)}));}
 function caution(p,map,{third=false}={}){const a=axesOf(p);const ns=new Set(noteNames(p).map(w=>norm(w.name)));
  for(const r of map.combos.rejected)if(ns.has(r.ka)&&ns.has(r.kb))return third?`Tem ${r.a.toLowerCase()} com ${r.b.toLowerCase()}, combinação que o cliente costuma recusar.`:`Tem ${r.a.toLowerCase()} com ${r.b.toLowerCase()}, combinação que você costuma recusar.`;
  const bad=map.axes.filter((x,i)=>x.sign==='evita'&&x.level==='comprovado'&&a[i]>=.5).sort((x,y)=>a[IDX[y.id]]-a[IDX[x.id]])[0];
  if(bad)return third?`Tem ${lower(bad.label)}, que o cliente costuma evitar.`:`Tem ${lower(bad.label)}, que você costuma evitar.`;
  return '';}
 function explain(p,map,{ctx=null,source='perfume'}={}){if(!p||!map)return null;
  const ch=chance(p,map,{ctx}),sim=similar(p,map.st);
  const pos=contributions(p,map).filter(c=>c.c>0&&c.a>=.35&&c.x.sign==='gosta').sort((a,b)=>b.c-a.c||byIdCmp(a.x.id,b.x.id));
  const top=pos.slice(0,2).map(c=>lower(c.x.label));
  let line='',kind='chance';
  if(sim&&sim.pct>=85&&sim.rating>=8){line=`Parecido com ${sim.p.name}, que você ${sim.rating>=10?'adora':'ama'}.`;kind='similar';}
  else if(top.length===2)line=`Tem o ${top[0]} e o ${top[1]} que você mais avalia bem.`;
  else if(top.length===1)line=`Tem o ${top[0]} que você costuma avaliar bem.`;
  else if(sim&&sim.pct>=80){line=`Lembra ${sim.p.name}, que está na sua coleção.`;kind='similar';}
  else if(Object.keys(map.ratings).length<3)line='Avalie alguns perfumes para entendermos se este combina com você.';
  else line='Fica fora do que você costuma usar. Vale testar com calma.';
  const nRatings=Object.keys(map.ratings).filter(id=>P(id)).length;
  return {id:p.id,line,chance:ch,similar:sim&&sim.pct>=60?{p:sim.p,pct:sim.pct}:null,level:nRatings<3?'Dados insuficientes':map.level,n:nRatings,kind,
   experimental:source==='bubble',because:pos.slice(0,3).map(c=>c.x.label),caution:caution(p,map)};}

 /* ---------- compatibilidade contextual entre pessoas (nunca um % global) ---------- */
 function compat(mapA,ratingsA,personId){const u=person(personId);if(!u||!mapA)return null;
  const RA=ob(ratingsA),RB={};for(const [id,r] of Object.entries(ob(u.ratings))){const p=P(id);if(p)RB[p.id]=r;}
  const common=Object.keys(RA).filter(id=>RB[id]!==undefined&&P(id)).sort();
  const enough=common.length>=3,mapB=forPerson(personId);
  const byAxis=[];
  AX.forEach((d,i)=>{if(!d.family)return;
   if(enough){let t=0,w=0,n=0;for(const id of common){const a=axesOf(P(id))[i],wt=a*a;if(wt<.04)continue;t+=(1-Math.abs(RA[id]-RB[id])/10)*wt;w+=wt;if(a>=.3)n++;}
    byAxis.push({axis:d.id,label:d.label,score:round((t+2*.5)/(w+2)*100),n,confidence:w/(w+4),you:mapA.axes[i].value,them:mapB?mapB.axes[i].value:null,estimate:false});}
   else{const va=mapA.axes[i],vb=mapB&&mapB.axes[i];if(!vb||(va.level==='sem-dados'&&vb.level==='sem-dados'))return;
    byAxis.push({axis:d.id,label:d.label,score:round(100*(1-Math.abs(va.value-vb.value))),n:0,confidence:0,you:va.value,them:vb.value,estimate:true});}});
  const strong=x=>x.n>=2;
  const agree=byAxis.filter(x=>strong(x)&&x.score>=70).sort((a,b)=>b.score-a.score||b.n-a.n||byIdCmp(a.axis,b.axis)).slice(0,3).map(x=>x.axis);
  const disagree=byAxis.filter(x=>strong(x)&&x.score<=40).sort((a,b)=>a.score-b.score||b.n-a.n||byIdCmp(a.axis,b.axis)).slice(0,3).map(x=>x.axis);
  byAxis.sort((a,b)=>b.n-a.n||Math.abs(b.score-50)-Math.abs(a.score-50)||byIdCmp(a.axis,b.axis));
  return {byAxis,agree,disagree,common:common.length,enough,person:{id:u.id,name:u.name,shareMap:u.shareMap!==false}};}

 /* ---------- Fora da Bolha ---------- */
 function tierOf(p){if(typeof Advisor!=='undefined'&&Advisor.tier){try{return Advisor.tier(p);}catch(e){}}
  return typeof BRAND_TIERS!=='undefined'&&BRAND_TIERS?BRAND_TIERS[p.brand]||null:null;}
 function bridgeNote(p,axisIdx){let best=null,bv=0;for(const w of noteNames(p)){const v=noteAxes(w.name)[axisIdx]*w.weight;if(v>bv+1e-9){bv=v;best=w.name;}}return bv>=.3?best:null;}
 function bubble(map,st,{n=6,mode='equilibrio'}={}){
  if(!map||!map.primary.length||map.primaryHyp)return [];st=ob(st);
  const k={seguro:.25,equilibrio:.4,ousado:.55}[mode]??.4;
  const R=ob(st.ratings),SH=ob(st.shelf),seen=ob(ob(st.bubble).seen);
  const liked=Object.keys(R).filter(id=>R[id]>=7&&P(id));for(const id of Object.keys(SH))if(SH[id]==='have'&&P(id)&&!liked.includes(id))liked.push(id);
  if(!liked.length)return [];
  const cen=new Array(24).fill(0);for(const id of liked){const v=P(id).vector;for(let d=0;d<24;d++)cen[d]+=v[d]/liked.length;}
  const primary=new Set(map.primary.map(a=>a.id));
  const bridges=[...map.secondary,...map.axes.filter(a=>a.sign==='gosta'&&a.level==='hipotese'&&!primary.has(a.id))].filter((a,i,l)=>l.findIndex(b=>b.id===a.id)===i);
  const ns=p=>new Set(noteNames(p).map(w=>norm(w.name)));
  const out=[];
  for(const p of PERFUMES){if(R[p.id]!==undefined||SH[p.id]||seen[p.id])continue;
   const a=axesOf(p),fi=strongest(a,{family:true});if(fi<0||primary.has(AX[fi].id))continue;
   const c=cos(p.vector,cen);if(c>=.8)continue;
   const top=strongest(a);const tx=map.axes[top];if(tx&&tx.sign==='evita'&&tx.level==='comprovado')continue;
   const fx=map.axes[fi];if(fx.sign==='evita'&&fx.level==='comprovado')continue;
   const notes=ns(p);if(map.combos.rejected.some(r=>notes.has(r.ka)&&notes.has(r.kb)))continue;
   let br=null;for(const b of bridges){const i=IDX[b.id];if(i===fi)continue;if(a[i]>=.45&&(!br||a[i]>br.v)){br={axis:b.id,label:b.label,v:a[i],i};}}
   if(!br)continue;
   out.push({p,a,fi,c,br});}
  const scored=out.map(x=>{const ch=chance(x.p,map),fx=map.axes[x.fi],novelty=clamp((.85-x.c)/.75)*(fx.sign==='gosta'?.6:fx.level==='sem-dados'?1:.85);return {...x,ch,novelty,score:ch*(1-k)+novelty*100*k};})
   .sort((a,b)=>b.score-a.score||byIdCmp(a.p.id,b.p.id));
  const brands=new Map(),tiers=new Map(),picked=[];const tierCap=Math.max(2,Math.ceil(n/2));
  for(const pass of [0,1]){for(const x of scored){if(picked.length>=n)break;if(picked.includes(x))continue;const b=x.p.brand;if((brands.get(b)||0)>=2)continue;
    const t=tierOf(x.p);if(pass===0&&t&&(tiers.get(t)||0)>=tierCap)continue;
    picked.push(x);brands.set(b,(brands.get(b)||0)+1);if(t)tiers.set(t,(tiers.get(t)||0)+1);}}
  return picked.map(x=>{const fam=AX[x.fi],note=bridgeNote(x.p,x.br.i),famAxis=map.axes[x.fi];
   const pf=map.primary.map(a=>lower(a.label));
   const fora=pf.length?`Fora dos seus ${plurais(pf[0])}`:'Fora da sua bolha';
   const why=note?`${fora}, com ${note.toLowerCase()} fazendo a ponte para o ${lower(x.br.label)} que você gosta.`:`${fora}, com o ${lower(x.br.label)} fazendo a ponte para o que você já gosta.`;
   const surprise=famAxis.level==='sem-dados'?`Pode surpreender: é ${lower(fam.label)}, uma família que você ainda não avaliou.`
    :famAxis.level==='hipotese'?`Pode surpreender: é ${lower(fam.label)}, uma família que você ainda conhece pouco.`
    :famAxis.sign==='gosta'?`Pode surpreender: é ${lower(fam.label)}, que você gosta, num estilo diferente do seu.`
    :`Pode surpreender: é ${lower(fam.label)}, longe do que você costuma usar.`;
   const ex=explain(x.p,map,{source:'bubble'});ex.chance=x.ch;ex.line=why;
   return {p:x.p,chance:x.ch,novelty:Math.round(x.novelty*100)/100,bridge:{axis:x.br.axis,label:x.br.label,note:note||''},family:{axis:fam.id,label:fam.label},surprise,why,explain:ex};});}
 function plurais(w){return w==='âmbar'?'âmbares':/al$/.test(w)?w.replace(/al$/,'ais'):/r$/.test(w)?w+'es':w+'s';}

 /* ---------- percepções coletivas (demonstração, deterministas) ---------- */
 function officialNotes(p){const n=p&&p.notes;if(!n)return [];const tiers=[...(n.top||[]),...(n.heart||[]),...(n.base||[])];return [...new Set(tiers.length?tiers:(n.highlights||[]))];}
 function perceptions(p,review=null){if(!p||!p.notes)return null;const off=officialNotes(p);if(!off.length)return null;
  const wOf=name=>{const w=noteNames(p).find(x=>norm(x.name)===norm(name));return w?w.weight:.7;};
  const felt=off.map(note=>{const j=.6+.4*frac(p.id+'|'+note);return {note,pct:round(35+55*wOf(note)*j),official:true};}).sort((a,b)=>b.pct-a.pct||byIdCmp(a.note,b.note));
  const a=axesOf(p),offN=new Set(off.map(norm));
  const cand=AX.map((x,i)=>({x,v:a[i]})).filter(o=>o.v>=.5&&!offN.has(norm(o.x.label))).sort((x,y)=>y.v-x.v||byIdCmp(x.x.id,y.x.id));
  const nd=1+(hash(p.id)%2);
  const divergent=cand.slice(0,nd).map((o,i)=>({note:o.x.label,pct:12+Math.round(18*frac(p.id+'#'+i)),official:false}));
  const obs=typeof OBSERVATIONS!=='undefined'?OBSERVATIONS.filter(o=>o.id===p.id).length:0;
  const top3=felt.slice(0,3),agreement=round(top3.reduce((s,x)=>s+x.pct,0)/Math.max(1,top3.length));
  const you=review&&Array.isArray(review.perceived)?review.perceived.slice(0,8):[];
  return {official:off,felt,n:obs+12+hash(p.id)%40,agreement,divergent,you,demo:true};}

 /* ---------- Hoje (§4.12) ---------- */
 const OCC_AXES={
  'Trabalho':{aromatico:.9,amadeirado:.8,citrico:.7,fresco:.8,almiscarado:.5,verde:.6,gourmand:-.6,doce:-.5,animalico:-.8,couro:-.2},
  'Encontro':{ambar:.8,doce:.6,almiscarado:.8,quente:.7,floral:.5,amadeirado:.5,gourmand:.5,lactonico:.5},
  'Evento':{quente:.8,ambar:.8,couro:.6,incensado:.6,amadeirado:.6,floral:.4,resinoso:.5,fresco:-.2},
  'Dia a dia':{fresco:.8,citrico:.7,aromatico:.7,verde:.5,almiscarado:.4,aquatico:.5,animalico:-.6},
  'Ar livre':{fresco:.9,citrico:.8,aquatico:.8,verde:.7,herbal:.5,doce:-.5,gourmand:-.6,ambar:-.4}};
 const OCC_MAP={'Dia a dia':'Dia a dia','Trabalho':'Trabalho','Encontro':'Encontro','Evento':'Evento','Ar livre':'Ar livre','Noite':'Encontro','Festa':'Evento'};
 function occasionFit(p,occ){
  if(typeof Advisor!=='undefined'&&Advisor.occasionFit){try{const v=Number(Advisor.occasionFit(p,occ));if(Number.isFinite(v))return clamp(v);}catch(e){}}
  const W=OCC_AXES[OCC_MAP[occ]||'Dia a dia'],a=axesOf(p);let s=0,t=0;for(const [k,w] of Object.entries(W)){const v=a[IDX[k]];if(w>0){s+=w*v;t+=w;}else s+=w*v*.8;}
  return clamp(.25+s/Math.max(.001,t)*1.05);}
 function versatility(p){if(typeof Advisor!=='undefined'&&Advisor.versatility){try{const v=Number(Advisor.versatility(p));if(Number.isFinite(v))return clamp(v);}catch(e){}}
  const fits=Object.keys(OCC_AXES).map(o=>occasionFit(p,o));return clamp(fits.reduce((s,x)=>s+x,0)/fits.length*1.15);}
 function projection(p){const a=axesOf(p);let pr=.18+.55*Math.max(a[IDX.quente],a[IDX.ambar],a[IDX.couro],a[IDX.resinoso],a[IDX.tabaco],a[IDX.animalico])+.15*a[IDX.doce];
  if(typeof Engine!=='undefined'&&Engine.performance){try{const r=Engine.performance(p.id);if(r.count>=3)pr=pr*.5+((r.projection-1)/4)*.5;}catch(e){}}
  const c=String(p.concentration||'');if(/extrait|elixir|^parfum$/i.test(c))pr+=.12;else if(/col[oô]nia|body splash/i.test(c))pr-=.12;
  return clamp(pr);}
 function freshness(a){return clamp(.6*Math.max(a[IDX.fresco],a[IDX.citrico],a[IDX.aquatico])+.4*(a[IDX.fresco]+a[IDX.citrico]+a[IDX.aquatico]+a[IDX.verde])/4);}
 function heaviness(a){return clamp(.7*Math.max(a[IDX.quente],a[IDX.ambar],a[IDX.gourmand],a[IDX.doce],a[IDX.resinoso])+.3*(a[IDX.quente]+a[IDX.ambar]+a[IDX.gourmand]+a[IDX.doce])/4);}
 const PRESENCE={Discreta:.25,Equilibrada:.5,Marcante:.8};
 const OCC_WORD={'Trabalho':'o trabalho','Encontro':'um encontro','Evento':'um evento','Dia a dia':'o dia a dia','Ar livre':'um dia ao ar livre'};
 function dayKey(d=new Date()){const z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate());}
 function today(p,map,w,ctx0){const ctx=ob(ctx0);if(!p)return {score:0,reasons:[]};const a=axesOf(p),reasons=[];
  const live=!!ctx.live;const t=Number.isFinite(Number(ctx.temp))?Number(ctx.temp):(w&&Number.isFinite(Number(w.feels))?Number(w.feels):24);
  const hum=Number.isFinite(Number(ctx.humidity))&&ctx.humidity!==null?Number(ctx.humidity):(w&&Number.isFinite(Number(w.humidity))?Number(w.humidity):null);
  const rain=Number.isFinite(Number(ctx.rain))&&ctx.rain!==null?Number(ctx.rain):(w&&Number.isFinite(Number(w.rain))?Number(w.rain):null);
  const ch=map?chance(p,map,{ctx:{occasion:ctx.occasion,time:ctx.time,environment:ctx.environment,temp:t}}):50;
  /* clima */
  const fresh=freshness(a),heavy=heaviness(a),hot=clamp((t-22)/8,-1,1);let climate=50;
  if(hot>0)climate=50+hot*(48*fresh-52*heavy);else climate=50+(-hot)*(45*heavy-28*fresh);
  const muggy=hum!==null&&hum>=70&&t>=26;if(muggy)climate-=22*Math.max(a[IDX.doce],a[IDX.gourmand],a[IDX.ambar]);
  if(rain!==null&&rain>=60)climate+=8*Math.max(a[IDX.aromatico],a[IDX.amadeirado],a[IDX.verde]);
  climate=clamp(climate,0,100);
  const deg=round(t)+'°'+(live?'':' (informado)');
  if(t>=27&&fresh>=.45)reasons.push(`Fresco para ${deg}${live&&hum!==null&&hum>=70?` e umidade de ${round(hum)}%`:''}`);
  else if(muggy&&heavy<.35)reasons.push(`Leve para o tempo abafado, com umidade de ${round(hum)}%`);
  else if(t<=17&&heavy>=.45)reasons.push(`Aquece bem em ${deg}`);
  else if(t<=17&&Math.max(a[IDX.amadeirado],a[IDX.especiado],a[IDX.ambar])>=.6)reasons.push(`Encorpado o bastante para ${deg}`);
  else if(t>17&&t<27&&Math.abs(fresh-heavy)<.35)reasons.push(`Equilibrado para ${deg}`);
  else if(rain!==null&&rain>=60&&Math.max(a[IDX.aromatico],a[IDX.amadeirado],a[IDX.verde])>=.5)reasons.push(`Combina com dia de chuva, ${round(rain)}% de chance`);
  /* ocasião */
  const occ=ctx.occasion||'Dia a dia',ofit=occasionFit(p,occ),occasion=ofit*100;
  /* presença */
  let want=PRESENCE[ctx.intensity]??.5;if(ctx.environment==='Fechado')want-=.1;else if(ctx.environment==='Aberto')want+=.1;if(ctx.period==='noite')want+=.12;want=clamp(want,.1,.95);
  const pr=projection(p),presence=clamp(100-150*Math.abs(pr-want),0,100);
  if(ctx.environment==='Fechado'&&ctx.intensity==='Discreta'&&pr<=.42)reasons.push('Discreto para ambiente fechado');
  else if(ctx.intensity==='Marcante'&&pr>=.6)reasons.push(ctx.period==='noite'?'Tem presença para a noite':'Tem presença, como você pediu');
  else if(ctx.environment==='Aberto'&&pr>=.45&&pr<=.75)reasons.push('Projeção boa para ambiente aberto');
  if(ofit>=.62&&OCC_WORD[occ])reasons.push(`Combina com ${OCC_WORD[occ]}`);
  /* roupa (só traços: formal, atividade, calor, noite) */
  let outfit=0;const of=ctx.outfitF;
  if(of&&typeof of==='object'){const v=versatility(p);let s=50;
   s+=Number(of.formal||0)*40*(v-.5);s+=(Number(of.activity||0)*.6+Number(of.heat||0))*(40*(fresh-.45)-25*a[IDX.doce]);s+=Number(of.night||0)*35*(pr-.5);
   outfit=clamp(s,0,100);
   if(Number(of.heat||0)>=.6&&fresh>=.5)reasons.push('Leve para o calor e o movimento');
   else if(Number(of.activity||0)>=.6&&fresh>=.5)reasons.push('Fresco para um dia de movimento');
   else if(Number(of.formal||0)>=.7&&v>=.55)reasons.push('Versátil para um dia mais formal');
   else if(Number(of.night||0)>=.6&&pr>=.55)reasons.push('Tem presença para a noite');}
  else outfit=50;
  /* aprendido: Acertou? em dia parecido */
  let learned=50;const fb=ob(ob(map&&map.st).feedback)[p.id];
  if(fb&&fb.src==='today'&&fb.ctx){const band=Number(fb.ctx.tempBand);const close=Number.isFinite(band)&&Math.abs(band-t)<=5&&(!fb.ctx.occasion||fb.ctx.occasion===occ);
   if(close){learned=fb.v>0?100:0;if(fb.v>0)reasons.unshift('Você marcou que acertou em um dia parecido');}}
  /* recência */
  let rec=0;const sotd=Array.isArray(ob(map&&map.st).sotd)?map.st.sotd:[];const tk=ctx.today||dayKey();
  const dt=k=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d).getTime();};
  for(const s of sotd){if(!s||s.id!==p.id||!/^\d{4}-\d{2}-\d{2}$/.test(s.date))continue;const days=Math.round((dt(tk)-dt(s.date))/DAY);if(days===1)rec=Math.max(rec,12);else if(days>1&&days<=3)rec=Math.max(rec,6);}
  const score=clamp(.40*ch+.25*climate+.15*occasion+.10*presence+.05*outfit+.05*learned-rec,0,100);
  return {score:Math.round(score*10)/10,reasons:[...new Set(reasons)].slice(0,3),parts:{chance:ch,climate:round(climate),occasion:round(occasion),presence:round(presence),outfit:round(outfit),learned,recency:rec}};}

 /* ---------- As três notas que ficam / Esse sou eu ---------- */
 const OCCASIONS=['Dia a dia','Trabalho','Noite','Encontro','Festa','Evento','Ar livre'];
 function notes(st0,{occasion=''}={}){const st=ob(st0),R=ob(st.ratings),SH=ob(st.shelf),pinned=Array.isArray(st.pinned)?st.pinned:ob(st.profile).pinned||[];
  let allowed=null;if(occasion){allowed=new Set();
   for(const [id,r] of Object.entries(ob(st.reviews)))if(r&&Array.isArray(r.occasions)&&r.occasions.includes(occasion))allowed.add(id);
   for(const s of Array.isArray(st.sotd)?st.sotd:[])if(s&&(s.occasion===occasion||(s.ctx&&s.ctx.occasion===occasion)))allowed.add(s.id);}
  const pos=new Map(),neg=new Set();
  for(const id of Object.keys(R)){const p=P(id);if(!p)continue;if(R[id]>=6)pos.set(p.id,ratingSignal(R[id]));else if(R[id]<=4)neg.add(p.id);}
  for(const id of pinned||[]){const p=P(id);if(p&&!pos.has(p.id)&&!neg.has(p.id))pos.set(p.id,.8);}
  for(const id of Object.keys(SH)){const p=P(id);if(p&&SH[id]==='have'&&!pos.has(p.id)&&!neg.has(p.id))pos.set(p.id,.35);}
  const use=[...pos].filter(([id])=>!allowed||allowed.has(id)).sort((a,b)=>byIdCmp(a[0],b[0]));
  const score=new Map(),count=new Map(),label=new Map();
  for(const [id,s] of use){const seenHere=new Set();for(const w of noteNames(P(id))){const k=norm(w.name);if(!k||seenHere.has(k))continue;seenHere.add(k);if(!label.has(k))label.set(k,w.name);score.set(k,(score.get(k)||0)+w.weight*s);count.set(k,(count.get(k)||0)+1);}}
  if(!allowed)for(const id of [...neg].sort()){for(const w of noteNames(P(id))){const k=norm(w.name);if(score.has(k))score.set(k,score.get(k)-w.weight);}}
  const minN=allowed&&use.length<4?1:2;
  const list=[...score].filter(([k,v])=>(count.get(k)||0)>=minN&&v>0).sort((a,b)=>b[1]-a[1]||(count.get(b[0])-count.get(a[0]))||byIdCmp(a[0],b[0])).slice(0,3)
   .map(([k,v])=>{const name=label.get(k),ing=ingredientOf(name);let image='';if(ing){try{image=typeof noteImage==='function'?(noteImage(ing.id)||ing.image||''):(ing.image||'');}catch(e){image=ing.image||'';}}
    return {name:ing?ing.name:name,id:ing?ing.id:null,image,score:Math.round(v*100)/100,n:count.get(k)};});
  return {notes:list,n:use.length,enough:use.length>=2&&list.length>0};}
 function occasions(st){return OCCASIONS.filter(o=>notes(st,{occasion:o}).enough);}
 function portrait(ids){const list=[...new Set((Array.isArray(ids)?ids:[]).map(P).filter(Boolean))].slice(0,5);
  if(list.length<2)return {notes:[],family:null,secondary:null,line:''};
  const sc=new Map(),lab=new Map();for(const p of list)for(const w of noteNames(p)){const k=norm(w.name);if(!k)continue;if(!lab.has(k))lab.set(k,w.name);sc.set(k,(sc.get(k)||0)+w.weight);}
  const notesTop=[...sc].sort((a,b)=>b[1]-a[1]||byIdCmp(a[0],b[0])).slice(0,5).map(([k])=>{const ing=ingredientOf(lab.get(k));return ing?ing.name:lab.get(k);});
  const mean=new Float64Array(NA);for(const p of list){const a=axesOf(p);for(let i=0;i<NA;i++)mean[i]+=a[i]/list.length;}
  const fam=AX.map((x,i)=>({x,v:mean[i]})).filter(o=>o.x.family).sort((a,b)=>b.v-a.v||byIdCmp(a.x.id,b.x.id));
  const family={axis:fam[0].x.id,label:fam[0].x.label},secondary=fam[1]&&fam[1].v>=.3?{axis:fam[1].x.id,label:fam[1].x.label}:null;
  const near=notesTop.slice(0,2).map(n=>n.toLowerCase());
  const line=`Você volta sempre ao ${lower(family.label)}${near.length?`, com ${join(near)} por perto`:''}.`;
  return {notes:notesTop,family,secondary,line};}

 /* ---------- Connect: mapa compartilhado e ranking da loja ---------- */
 function fromShared(payload){const pl=ob(payload);
  const ratings={};for(const x of Array.isArray(pl.r)?pl.r:[]){if(!Array.isArray(x))continue;const p=P(String(x[0]));const r=Number(x[1]);if(p&&Number.isFinite(r))ratings[p.id]=clamp(r,0,10);}
  const owned=(Array.isArray(pl.h)?pl.h:[]).map(id=>P(String(id))).filter(Boolean).map(p=>p.id);
  const avoid=(Array.isArray(pl.a)?pl.a:[]).filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim().slice(0,40)).slice(0,6);
  const shared=new Map();for(const x of Array.isArray(pl.m)?pl.m:[]){if(!Array.isArray(x))continue;const i=Number(x[0]),v=Number(x[1]);if(Number.isInteger(i)&&i>=0&&i<NA&&Number.isFinite(v))shared.set(i,clamp(v/100));}
  const axes=AX.map((d,i)=>{const has=shared.has(i),value=has?shared.get(i):.5;return {id:d.id,label:d.label,family:d.family,value,n:has?3:0,nh:0,confidence:has?.6:0,level:has?'comprovado':'sem-dados',sign:signOf(value),corrected:false};});
  const byVal=(a,b)=>b.value-a.value||byIdCmp(a.id,b.id);
  const primary=axes.filter(a=>a.family&&a.sign==='gosta'&&a.level==='comprovado').sort(byVal).slice(0,2);
  const secondary=axes.filter(a=>a.family&&a.sign==='gosta'&&a.level==='comprovado'&&!primary.includes(a)).sort(byVal).slice(0,3);
  const rejected=axes.filter(a=>a.sign==='evita'&&a.level==='comprovado').sort((a,b)=>a.value-b.value||byIdCmp(a.id,b.id)).slice(0,3);
  const shelf={};for(const id of owned)shelf[id]='have';
  return {axes,primary,primaryHyp:false,secondary,rejected,combos:{liked:[],rejected:[],contrasts:[]},trend:[],evidence:{ratings:Object.keys(ratings).length,have:owned.length},
   confidence:shared.size?.6:0,level:shared.size?'Moderada':'Dados insuficientes',ratings,st:{ratings,shelf},avoid,owned,tier:Number.isInteger(pl.t)&&pl.t>=1&&pl.t<=4?pl.t:null,shared:true,hasMap:shared.size>0,rev:0};}
 function popularity(p){const rs=(typeof PEOPLE!=='undefined'?PEOPLE:[]).map(u=>u.ratings&&u.ratings[p.id]).filter(x=>Number.isFinite(x));
  const obs=typeof OBSERVATIONS!=='undefined'?OBSERVATIONS.filter(o=>o.id===p.id):[];
  const mean=(rs.reduce((s,x)=>s+x,0)+obs.reduce((s,o)=>s+o.rating,0)+6*3)/(rs.length+obs.length+3);return round(mean*10);}
 function storeRank(payload,stock,{tier=null,occasion='',trait=''}={}){const map=fromShared(payload);
  const basis=map.hasMap?'map':Object.keys(map.ratings).length?'ratings':'popular';
  const ti=trait&&IDX[trait]!==undefined?IDX[trait]:-1;const owned=new Set(map.owned);
  const items=[];
  for(const p of Array.isArray(stock)?stock:[]){if(!p)continue;
   if(map.avoid.some(n=>hasNote(p,n)))continue;
   if(tier){const t=tierOf(p);if(t&&t>Number(tier))continue;}
   if(ti>=0&&axesOf(p)[ti]<.5)continue;
   if(occasion&&occasionFit(p,occasion)<.45)continue;
   const pct=basis==='popular'?popularity(p):chance(p,map);
   items.push({p,pct,why:storeWhy(p,map,basis),owned:owned.has(p.id)});}
  items.sort((a,b)=>(a.owned?1:0)-(b.owned?1:0)||b.pct-a.pct||byIdCmp(a.p.id,b.p.id));
  return {items,basis};}
 function storeWhy(p,map,basis){const a=axesOf(p);
  if(basis==='popular')return 'Entre os mais bem avaliados do estoque.';
  const pos=map.axes.map((x,i)=>({x,c:(x.value-.5)*a[i]*(x.level==='comprovado'?1:.2),a:a[i]})).filter(o=>o.c>0&&o.a>=.35&&o.x.sign==='gosta').sort((x,y)=>y.c-x.c||byIdCmp(x.x.id,y.x.id)).slice(0,2).map(o=>lower(o.x.label));
  let s=pos.length===2?`Tem o ${pos[0]} e o ${pos[1]} que o cliente prefere`:pos.length?`Tem o ${pos[0]} que o cliente prefere`:'';
  if(!s){const sim=similar(p,map.st);s=sim&&sim.pct>=75?`Parecido com ${sim.p.name}, que o cliente avaliou bem`:'Pode agradar, mas fica fora do perfil mais claro do cliente';}
  const av=map.avoid.slice(0,1).map(n=>n.toLowerCase());if(av.length)s+=`; sem ${av[0]}, que ${map.avoid.length>1?'está entre as notas que ele evita':'ele evita'}`;
  const c=caution(p,map,{third:true});return s+'.'+(c?' '+c:'');}

 /* ---------- textos ---------- */
 function label(level){return {comprovado:'Comprovado',hipotese:'Hipótese','sem-dados':'Sem dados'}[level]||String(level||'');}
 function levelText(axis){const a=ob(axis);if(a.level==='comprovado')return a.corrected?'Comprovado · corrigido por você':'Comprovado · '+plural(a.n,'avaliação','avaliações');
  if(a.level==='hipotese')return 'Hipótese · '+plural(Math.max(a.n+a.nh,1),'sinal','sinais');return 'Sem dados';}

 return {axesOf,build,forPerson,chance,similar,explain,compat,bubble,perceptions,today,notes,occasions,portrait,fromShared,storeRank,label,levelText,
  series,hasNote,occasionFit,projection,tierOf,ratingSignal,index:id=>IDX[id]??-1,axis:id=>AX[IDX[id]]||null,lower};
})();
