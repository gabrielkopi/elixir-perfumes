/* Advisor (§4.8): VM com brand, data, catalog-100, notes, ingredients, brand-tiers, engine, taste-engine e advisor,
   com e sem catalog-br. Determinismo, filtros duros, relaxar, compra às cegas, alternativas, camadas, presentes e desempenho. */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const JS=path.join(__dirname,'..','assets','js');
let fails=0,checks=0;const check=(c,m)=>{checks++;if(!c){fails++;console.log('  FAIL '+m);}};
function load(withBR){
 const ctx=vm.createContext({console,performance:{now:()=>Number(process.hrtime.bigint())/1e6},document:{documentElement:{dataset:{brand:'elixir'}},addEventListener(){}}});
 const files=['data/brand.js','data/data.js','data/catalog-100.js','data/notes.js',...(withBR?['data/catalog-br.js']:[]),'data/ingredients.js','data/brand-tiers.js','engine/engine.js','engine/taste-engine.js','engine/advisor.js'];
 for(const f of files){const p=path.join(JS,f);if(!fs.existsSync(p))throw new Error('ausente: '+f);vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:f});}
 return ctx;}
const run=(ctx,code)=>vm.runInContext(code,ctx);

for(const withBR of [false,true]){
 const tag=withBR?'[com catalog-br]':'[base]';const ctx=load(withBR);
 if(!withBR)check(run(ctx,'PERFUMES.length')===100,tag+' PERFUMES continua com 100');
 const r=run(ctx,`(()=>{
  const ratings={vetiver:10,polo:8,terre:8,lemale:2,santal:10,coffee:4};
  const prefs={likedNotes:['Vetiver'],dislikedNotes:['Caramelo']};
  const ans={occasions:['Trabalho'],climate:'Meia-estação',presence:'Equilibrada',allDay:true,families:{amadeirado:'like'},avoidNotes:['Baunilha'],tier:''};
  const a=Advisor.rank(ans,ratings,prefs,{n:10}),b=Advisor.rank(ans,ratings,prefs,{n:10});
  const empty=Advisor.rank({},{},{},{n:10});
  const skip=Advisor.rank({occasions:[],climate:'',presence:'',families:{},avoidNotes:[],tier:''},{},{},{});
  const imp={occasions:['Festa'],climate:'Frio',presence:'Marcante',families:{amadeirado:'avoid',floral:'avoid',ambar:'avoid',especiado:'avoid'},avoidNotes:[],tier:'Nicho'};
  const im=Advisor.rank(imp,ratings,prefs,{});
  const relaxed=im.relax.length?Advisor.rank(Advisor.relaxAnswers(imp,im.relax[0].key),ratings,prefs,{}):null;
  const cheap=Advisor.rank({tier:'Acessível'},ratings,prefs,{n:10});
  const van=Advisor.rank({avoidNotes:['Baunilha']},ratings,prefs,{n:10});
  const lowVan=Advisor.rank({avoidNotes:['Baunilha']},{},{},{n:10});
  const exc=Advisor.rank({},ratings,prefs,{n:10,exclude:[a.items[0].p.id]});
  const gNo=Advisor.gift(Advisor.rank({},{},{styles:['woody']},{n:30}),null,{styles:['woody']});
  const person=PEOPLE.find(u=>u.id==='sofia');
  const gr=Advisor.rank({occasions:['Aniversário']},person.ratings,{},{n:30,forPerson:person});
  const g=Advisor.gift(gr,person,{});
  const ts=[];Advisor.rank(ans,ratings,prefs,{n:10});for(let i=0;i<5;i++){const t0=performance.now();Advisor.rank(ans,ratings,prefs,{n:10});ts.push(performance.now()-t0);}ts.sort((a,b)=>a-b);const t=ts[0];/* aquecido; melhor de 5 (filtra ruído da máquina) */
  const p=byId('vetiver');
  return {
   same:JSON.stringify(a.items.map(x=>x.p.id))===JSON.stringify(b.items.map(x=>x.p.id)),
   n:a.items.length,hero:a.items[0],emptyN:empty.items.length,skipN:skip.items.length,lowSignal:empty.lowSignal,lowSignalA:a.lowSignal,
   noRated:a.items.every(x=>ratings[x.p.id]===undefined||ratings[x.p.id]>4),
   imp:im.items.length,impRelax:im.relax.length,relaxedN:relaxed?relaxed.items.length:0,
   cheap:cheap.items.every(x=>Advisor.tier(x.p)===1),cheapN:cheap.items.length,
   van5:van.items.slice(0,5).every(x=>!Advisor.hasNote(x.p,'Baunilha')||x.cautions.length>0),
   lowVan5:lowVan.items.slice(0,5).every(x=>!Advisor.hasNote(x.p,'Baunilha')),
   excl:!exc.items.some(x=>x.p.id===a.items[0].p.id),
   brandCap:Object.values(a.items.reduce((m,x)=>(m[x.p.brand]=(m[x.p.brand]||0)+1,m),{})).every(c=>c<=2),
   whys:a.items.every(x=>x.why.length>=1&&x.why.length<=3&&x.cautions.length<=1),
   chance:a.items.every(x=>x.chance>=0&&x.chance<=100&&x.explain&&x.explain.chance===x.chance),
   levels:a.items.every(x=>['Compra segura','Teste antes','Só com amostra'].includes(x.blindBuy.level)),
   noAlta:JSON.stringify(a).indexOf('Alta')<0&&JSON.stringify(g).indexOf('Alta')<0,
   alts:a.items.every(x=>x.alternatives.every(y=>y.sim>=.85&&y.p.brand!==x.p.brand)),
   heroAlt:a.items[0].alternatives.length,heroLayer:!!a.items[0].layering,
   tiers:[Advisor.tier({brand:'Natura'}),Advisor.tier({brand:'Dior'}),Advisor.tier({brand:'Le Labo'}),Advisor.tier({brand:'Marca Inexistente'}),Advisor.tierLabel(null)],
   pol:Advisor.polarity({id:'nao-existe'}),season:Advisor.season(byId('coolwater')).label,seasonCold:Advisor.season(byId('lemale')).label,
   note:Advisor.hasNote(byId('unico'),'Baunilha'),noteNo:Advisor.hasNote(byId('arbo'),'Baunilha'),
   bbFew:Advisor.blindBuy(p,{polo:8},{}).level!=='Compra segura',
   gNo:{safe:gNo.safe.length,low:gNo.lowSignal,max:Math.max(0,...gNo.safe.concat(gNo.bold).map(x=>x.acceptance))},
   g:{safe:g.safe.length,bold:g.bold.length,rated:g.safe.concat(g.bold).some(x=>person.ratings[x.p.id]!==undefined),why:g.safe.concat(g.bold).every(x=>x.why.length>=1&&x.why.length<=2),excluded:g.excluded,safeBrands:new Set(g.safe.map(x=>x.p.brand)).size},
   ms:t,total:PERFUMES.length};
 })()`);
 check(r.same,tag+' mesmo resultado para as mesmas entradas');
 check(r.n>=3,tag+' ≥3 resultados no caminho completo ('+r.n+')');
 check(r.emptyN>=3&&r.skipN>=3,tag+' pular tudo ainda gera resultados');
 check(r.lowSignal&&!r.lowSignalA,tag+' lowSignal só com <3 avaliações');
 check(r.noRated,tag+' nada avaliado como "não é pra mim"');
 check(r.imp<3&&r.impRelax>=1,tag+' Nicho + 4 famílias evitadas → vazio com relaxar ('+r.imp+', '+r.impRelax+')');
 check(r.relaxedN>=1,tag+' um toque em relaxar devolve ≥1 resultado');
 check(r.cheap&&r.cheapN>=1,tag+' faixa Acessível respeitada');
 check(r.van5&&r.lowVan5,tag+' "Baunilha" evitada fora do top 5');
 check(r.excl,tag+' exclusões respeitadas (Acertou? Não, Tenho)');
 check(r.brandCap,tag+' no máximo 2 por marca');
 check(r.whys&&r.chance&&r.levels,tag+' por que, cautela, chance e compra às cegas em todo item');
 check(r.noAlta,tag+' nunca "Alta"');
 check(r.alts,tag+' alternativas: cosseno ≥ .85 e outra marca');
 check(r.heroLayer,tag+' camada sugerida para o primeiro resultado');
 if(withBR)check(r.heroAlt>=1,tag+' alternativa para o primeiro resultado');
 check(JSON.stringify(r.tiers)===JSON.stringify([1,3,4,null,'Faixa não informada']),tag+' faixas por marca '+JSON.stringify(r.tiers));
 check(r.pol===.5,tag+' polaridade .5 com poucas notas');
 check(r.season==='Calor'&&r.seasonCold==='Frio',tag+' estação ('+r.season+', '+r.seasonCold+')');
 check(r.note&&!r.noteNo,tag+' hasNote por nome normalizado');
 check(r.bbFew,tag+' compra às cegas nunca "segura" com <3 avaliações');
 check(r.gNo.low&&r.gNo.safe>=1&&r.gNo.max<=65,tag+' presente sem pessoa: pouca informação e aceitação ≤65');
 check(r.g.safe>=1&&!r.g.rated&&r.g.why,tag+' presente: seguras, sem perfumes que a pessoa conhece, ≤2 motivos');
 { const lim=withBR?150:80; if(r.ms>=lim&&r.ms<lim*2)console.log('  AVISO '+tag+' Advisor.rank em '+r.ms.toFixed(1)+' ms (meta '+lim+' ms; máquina ocupada?)'); check(r.ms<lim*2,tag+' Advisor.rank em '+r.ms.toFixed(1)+' ms ('+r.total+' perfumes)'); }
 console.log(`${tag} ${r.total} perfumes · rank ${r.ms.toFixed(1)} ms · melhor: ${r.hero.p.name} (${r.hero.chance}%, ${r.hero.blindBuy.level})`);
}
console.log(`verify-advisor: ${checks} verificações, ${fails} falha(s)`);
if(fails)process.exit(1);
