/* Motor substituível e determinístico. Não produz probabilidades calibradas.
   Conteúdo: média suavizada de notas ponderadas por cosseno^4, com 3 votos neutros.
   Social: concordância por distância de notas nos perfumes compartilhados; confiança
   suavizada por n/(n+4). A comparação pode ser condicionada ao vetor da fragrância.
   Contexto: somente observações sintéticas em condições comparáveis, suavizadas.
   Confiança mede suporte, cobertura, dispersão e qualidade editorial dos dados. */
const Engine={
 cosine(a,b){const dot=a.reduce((s,x,i)=>s+x*b[i],0), norm=Math.hypot(...a)*Math.hypot(...b);return norm?dot/norm:0;},
 profile(ratings){return DIMENSIONS.map((_,d)=>{let sum=0,weight=2;Object.entries(ratings).forEach(([id,r])=>{const p=byId(id);if(p){sum+=p.vector[d]*(r-5)/5;weight+=p.vector[d];}});return Math.round(Math.max(0,Math.min(1,.35+sum/weight*.8))*100);});},
 compatibility(ratings,person,target=null,dimension=null){let total=0,weight=0,count=0;for(const [id,r] of Object.entries(ratings)){if(person.ratings[id]===undefined)continue;const p=byId(id);const w=dimension!==null?p.vector[dimension]**2:target?this.cosine(target.vector,p.vector)**4:1;if(w<.04)continue;total+=(1-Math.abs(r-person.ratings[id])/10)*w;weight+=w;count++;}return {score:Math.round((total+2*.5)/(weight+2)*100),count,confidence:weight/(weight+4)};},
 recommend(p,ratings,context={}){
  const entries=Object.entries(ratings).filter(([id])=>byId(id)&&id!==p.id);
  let sum=15,w=3;const similarities=entries.map(([id,r])=>({p:byId(id),r,sim:this.cosine(p.vector,byId(id).vector)}));
  similarities.forEach(x=>{const weight=x.sim**4;sum+=x.r*weight;w+=weight;});const content=sum/w;
  const peers=PEOPLE.filter(u=>u.ratings[p.id]!==undefined).map(u=>({u,...this.compatibility(ratings,u,p)}));
  let socialSum=10,socialWeight=2;peers.forEach(x=>{const weight=Math.max(0,(x.score-50)/50)*x.confidence;socialSum+=x.u.ratings[p.id]*weight;socialWeight+=weight;});
  const observations=OBSERVATIONS.filter(o=>o.id===p.id&&(!context.occasion||context.occasion==='Todas'||o.occasion===context.occasion)&&(!context.time||o.time===context.time)&&(!context.environment||o.environment===context.environment)&&(!context.temp||Math.abs(o.temp-Number(context.temp))<=7));
  const contextual=(observations.reduce((a,o)=>a+o.rating,0)+15)/(observations.length+3);
  const social=socialSum/socialWeight;
  const score=Math.round(Math.max(0,Math.min(100,(content*.7+social*.2+(observations.length?contextual:content)*.1)*10)));
  const coverage=similarities.reduce((s,x)=>s+x.sim**4,0);const spread=peers.length?Math.sqrt(peers.reduce((s,x)=>s+(x.u.ratings[p.id]-social)**2,0)/peers.length):3;
  const negative=entries.some(([,r])=>r<4);const confidence=Math.min(.8,entries.length/(entries.length+6)*.35+coverage/(coverage+4)*.25+peers.length/(peers.length+6)*.12+(p.notes?.source ? .05 : 0)+(negative ? .03 : 0)+(1-spread/10)*.05);
  const positive=similarities.filter(x=>x.r>=7).sort((a,b)=>b.sim-a.sim).slice(0,2), risk=similarities.filter(x=>x.r<4).sort((a,b)=>b.sim-a.sim)[0];
  return {score,confidence:entries.length<3?'Dados insuficientes':confidence>.55?'Moderada':'Baixa',support:entries.length,observations:observations.length,reason:positive.length?'Conversa com seu gosto por '+positive.map(x=>x.p.name).join(' e ')+'.':'Avalie mais fragrâncias para encontrar sua assinatura.',risk:risk&&risk.sim>.65?'Há semelhanças com '+risk.p.name+', que você não gostou. Experimente na pele antes de decidir.':'Uma afinidade é um convite para experimentar; sua percepção pode ser diferente.',peers:peers.sort((a,b)=>b.score-a.score)};
 },
 performance(id,filter='Geral',local=[]){const all=[...OBSERVATIONS,...local].filter(o=>o.id===id);const samples=all.filter(o=>filter==='Geral'||filter==='Calor'&&o.temp>=27||filter==='Frio'&&o.temp<=20||filter===o.time||filter==='Pele seca'&&o.skin==='Seca'||filter==='Pele oleosa'&&o.skin==='Oleosa'||filter==='Roupa'&&o.application==='Roupa');return {count:samples.length,hours:samples.length?samples.reduce((s,o)=>s+Number(o.hours||0),0)/samples.length:0,projection:samples.length?samples.reduce((s,o)=>s+Number(o.projection||0),0)/samples.length:0,confidence:samples.length<3?'Dados insuficientes':'Baixa • relatos simulados'};}
};
