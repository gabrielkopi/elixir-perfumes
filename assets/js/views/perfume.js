'use strict';
/* Página do perfume (dados oficiais × percepção da comunidade, explicação, compra às cegas, desempenho, onde comprar)
   e a folha de avaliação no estilo Letterboxd (Rating). */
const Perfume={
 perf:{},OCC5:['Dia a dia','Trabalho','Encontro','Noite','Ar livre'],
 hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;},
 ratingsCount(){return typeof state!=='undefined'?Object.keys(state.ratings).length:0;},
 level(n){return n<3?'Dados insuficientes':n<6?'Baixa':n<12?'Moderada':'Boa';},
 /* "Parecido com": o perfume que você ama (≥8) ou tem que mais se parece com este. */
 similar(p){let best=null,bc=0;const ids=new Set([...Object.keys(state.ratings).filter(id=>state.ratings[id]>=8),...Select.shelfIds('have')]);
  for(const id of ids){if(id===p.id)continue;const q=byId(id);if(!q)continue;const c=Engine.cosine(p.vector,q.vector);if(c>bc){bc=c;best=q;}}
  return best&&bc>=.5?{p:best,pct:Math.round(bc*100)}:null;},
 /* Explicação: OMap quando existir (Select.explain); senão o motor base, com os mesmos campos. */
 explain(p){let x=null;try{x=Select.explain(p.id,{source:'perfume'});}catch(e){}if(x)return x;
  const r=Select.rec(p.id),n=this.ratingsCount();
  return {id:p.id,line:n?(r&&r.reason)||'':'Avalie alguns perfumes para a explicação ficar pessoal.',chance:r?r.score:null,similar:this.similar(p),level:this.level(n),n,kind:'chance',experimental:false,caution:''};},
 polarity(p){const v=(typeof PEOPLE!=='undefined'?PEOPLE:[]).map(u=>u.ratings&&u.ratings[p.id]).filter(x=>Number.isFinite(x));if(v.length<2)return null;
  const m=v.reduce((s,x)=>s+x,0)/v.length;return Math.min(1,Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/v.length)/5);},
 blind(p){if(typeof Advisor!=='undefined'&&Advisor.blindBuy)try{const b=Advisor.blindBuy(p,state.ratings,state.preferences);if(b)return b;}catch(e){}
  const x=this.explain(p),chance=Number(x.chance)||50,pol=this.polarity(p),vers=Explore.OCCASIONS.filter(o=>Explore.occasionFit(p,o)>=.55).length/Explore.OCCASIONS.length;
  const score=Math.round(chance*.6+(1-(pol===null?.5:pol))*20+vers*20),f=[];
  f.push(chance>=65?'Combina com o que você avalia bem.':chance<45?'Foge um pouco do que você costuma gostar.':'Fica no meio do caminho do seu gosto.');
  f.push(pol===null?'Ainda há poucas opiniões sobre ele.':pol<.25?'Costuma agradar quase todo mundo.':'Divide opiniões.');
  f.push(vers>=.5?'Funciona em várias ocasiões.':'Pede a ocasião certa.');
  return {score,level:score>=70?'Compra segura':score>=52?'Teste antes':'Só com amostra',factors:f};},
 alternatives(p,n=6){if(typeof Advisor!=='undefined'&&Advisor.alternatives)try{return Advisor.alternatives(p,{n}).map(x=>x.p||x).filter(Boolean);}catch(e){}
  return PERFUMES.filter(q=>q.id!==p.id&&q.brand!==p.brand).map(q=>[q,Engine.cosine(p.vector,q.vector)]).filter(x=>x[1]>=.85).sort((a,b)=>b[1]-a[1]||(a[0].id<b[0].id?-1:1)).slice(0,n).map(x=>x[0]);},
 layering(p){if(typeof Advisor!=='undefined'&&Advisor.layering)try{return Advisor.layering(p,state.ratings,state.preferences);}catch(e){}return null;},
 /* Percepções de demonstração (REQ §6/§8), determinísticas. OMap.perceptions quando existir. */
 official(p){const n=p.notes||{};const all=[...(n.top||[]),...(n.heart||[]),...(n.base||[])];return all.length?all:[...(n.highlights||[]),...(n.extra||[])];},
 perceptions(p,review){if(typeof OMap!=='undefined'&&OMap.perceptions)try{const r=OMap.perceptions(p,review);if(r)return r;}catch(e){}
  const off=this.official(p);if(!off.length)return null;const w=new Map((p.noteWeights||[]).map(x=>[NoteModel.normalize(x.name),x.weight]));
  const felt=off.map(name=>{const j=.6+(this.hash(p.id+'|'+name)%400)/1000;return {note:name,pct:Math.round(35+55*(w.get(NoteModel.normalize(name))||.7)*j),official:true};}).sort((a,b)=>b.pct-a.pct||a.note.localeCompare(b.note,'pt-BR'));
  const offN=new Set(off.map(x=>NoteModel.normalize(x)));const dims=(p.vector||[]).map((v,i)=>[i,v]).sort((a,b)=>b[1]-a[1]).slice(0,4).filter(([i,v])=>v>=.5&&!offN.has(NoteModel.normalize(DIMENSIONS[i])));
  const divergent=dims.slice(0,1+(this.hash(p.id)%2)).map(([i])=>({note:DIMENSIONS[i],pct:12+this.hash(p.id+DIMENSIONS[i])%19}));
  const obs=typeof OBSERVATIONS!=='undefined'?OBSERVATIONS.filter(o=>o.id===p.id).length:0,top3=felt.slice(0,3);
  return {official:off,felt,n:obs+12+this.hash(p.id)%40,agreement:Math.round(top3.reduce((s,x)=>s+x.pct,0)/top3.length),divergent,demo:true};},
 quotes(p){const out=[],seen=new Set(),person=id=>typeof People!=='undefined'&&People.get?People.get(id):null;
  if(typeof COMMUNITY!=='undefined')for(const x of COMMUNITY.posts){const prod=COMMUNITY.products.find(y=>y.id===x.product);if(prod&&prod.catalog===p.id&&x.text&&!seen.has(x.user)){seen.add(x.user);out.push({text:x.text,author:person(x.user)||{name:x.user}});}}
  if(typeof POSTS!=='undefined')for(const x of POSTS)if(x.perfume===p.id&&x.text&&!seen.has(x.user)){seen.add(x.user);const u=person(x.user)||(typeof PEOPLE!=='undefined'?PEOPLE.find(y=>y.id===x.user):null);out.push({text:x.text,author:u||{name:x.user}});}
  return out.slice(0,8);},
 posts(p){return [...(state.posts||[]).filter(x=>x.perfume===p.id),...(typeof POSTS!=='undefined'?POSTS.filter(x=>x.perfume===p.id):[])];},
 domain(u){try{return new URL(u).hostname.replace(/^www\./,'');}catch(e){return '';}},
 dots(n,label){const v=Math.max(0,Math.min(5,Math.round(n)));return `<span class="pf-dots" role="img" aria-label="${esc(label)}: ${v} de 5">${[1,2,3,4,5].map(i=>`<i${i<=v?' class="on"':''}></i>`).join('')}</span>`;},

 /* ---------- blocos ---------- */
 head(p){const sub=[p.concentration&&!/não informada/i.test(p.concentration)?p.concentration:'',p.family].filter(Boolean).join(' · ');
  const r=state.ratings[p.id],rev=state.reviews[p.id];
  return `<header class="pf-head"><a class="pf-brand t-eyebrow" href="#brand/${esc(Catalog.slug(p.brand))}">${esc(p.brand)}</a><h1 class="t-display pf-name">${esc(p.name)}</h1>
<p class="pf-meta muted">${esc(sub)}${p.subtitle?` · ${esc(p.subtitle)}`:''}${p.audience?` · <span class="pf-aud">${esc(p.audience)}</span>`:''}</p>${r!==undefined?`<p class="pf-mine t-sm">Sua avaliação: <b>${esc(UI.ratingLabel(r))}</b>${rev&&rev.at?' · '+esc(UI.date(rev.editedAt||rev.at,'day')):''}</p>`:''}<i data-sentinel aria-hidden="true"></i></header>`;},
 actions(p){const rated=state.ratings[p.id]!==undefined;
  return `<div class="pf-actions">${UI.shelfSeg(p.id)}<div class="pf-row">${UI.btn('Usar hoje',{action:'sotd',size:'sm',attrs:`data-id="${esc(p.id)}"`})}${UI.btn(rated?'Editar avaliação':'Avaliar',{action:'rate',variant:'secondary',size:'sm',attrs:`data-id="${esc(p.id)}"`})}${UI.iconBtn('more',{action:'perf-more',label:'Mais ações',attrs:`data-id="${esc(p.id)}" aria-haspopup="dialog"`})}</div></div>`;},
 cardYou(p){const r=state.ratings[p.id];
  if(r!==undefined&&Select.shelf(p.id)==='have'){const rev=state.reviews[p.id]||{};
   return `<article class="data-card pf-you"><p class="t-eyebrow muted">Sua avaliação</p><p class="t-h1">${esc(UI.ratingLabel(r))}</p><p class="t-sm muted">Está em Tenho${rev.at?' · avaliado em '+esc(UI.date(rev.at,'day')):''}.</p>${rev.comment?`<p class="pf-quote">“${esc(rev.comment)}”</p>`:''}</article>`;}
  const x=this.explain(p),ch=Number(x.chance);
  return `<article class="data-card pf-you"><p class="t-eyebrow muted">Para você</p><div class="pf-you-top"><div><p class="pf-num">${UI.num(Number.isFinite(ch)?ch:null,'%')}</p><p class="t-sm muted">Chance de gostar</p></div>${Number.isFinite(ch)?UI.gauge(ch,{size:104}):''}</div>${UI.why({...x,chance:undefined},{feedback:'perfume'})}</article>`;},
 cardBlind(p){const n=this.ratingsCount();
  if(n<3)return `<article class="data-card pf-blind"><p class="t-eyebrow muted">Compra às cegas</p><p class="t-h2">Avalie 3 perfumes para ver</p><p class="t-sm muted">Com poucas avaliações, qualquer palpite seria chute.</p><div class="dc-foot">${UI.btn('Refinar meu mapa',{variant:'tertiary',href:'#refine/1',icon:'arrow'})}</div></article>`;
  const b=this.blind(p);
  return `<article class="data-card pf-blind"><p class="t-eyebrow muted">Compra às cegas</p><p class="t-h2">${esc(b.level)}</p><ul class="pf-factors">${(b.factors||[]).slice(0,3).map(f=>`<li>${esc(f)}</li>`).join('')}</ul><p class="t-sm muted">Experimente na pele antes.</p></article>`;},
 cardSeason(p){const s=Explore.season(p),x=Math.max(0,Math.min(1,(Number(s.warm)-Number(s.cold)+1)/2));
  const word=s.label==='Qualquer estação'?'Vai bem o ano todo':s.label==='Calor'?'Mais para o calor':s.label==='Frio'?'Mais para o frio':'Meia-estação';
  return `<article class="data-card pf-season"><p class="t-eyebrow muted">Estação e ocasiões</p><p class="t-h2">${esc(word)}</p>
<div class="pf-temp"><span class="t-sm muted">Frio</span><span class="pf-track" role="img" aria-label="Entre frio e calor: ${Math.round(x*100)} de 100"><i style="--x:${x.toFixed(3)}"></i></span><span class="t-sm muted">Calor</span></div>
<ul class="pf-occ">${this.OCC5.map(o=>{const f=Explore.occasionFit(p,o);return `<li><span>${esc(o)}</span>${this.dots(f*5,o)}</li>`;}).join('')}</ul></article>`;},
 perfPanel(p,filter){const rev=state.reviews[p.id],local=rev&&(rev.hours||rev.projection)?[{id:p.id,hours:rev.hours||0,projection:rev.projection||0,temp:null,time:''}]:[];
  const r=Engine.performance(p.id,filter,filter==='Geral'?local:[]);
  if(r.count<3){const pr=Explore.presence(p),L={discreta:'discreta',equilibrada:'equilibrada',marcante:'marcante'}[pr.id];
   return `<p class="t-h3">Ainda poucos relatos</p><p class="t-sm muted">Presença estimada pela concentração: ${esc(L)}. Avalie para contar como foi na sua pele.</p>`;}
  return `<div class="pf-perf"><div><p class="pf-num">${UI.num(r.hours,'h',{w:2})}</p><p class="t-sm muted">Fixação média</p></div><div><p class="pf-proj">${this.dots(r.projection,'Projeção')}</p><p class="t-sm muted">Projeção</p></div></div><p class="t-sm muted">${UI.plural(r.count,'relato','relatos')} de demonstração</p>`;},
 cardPerf(p){const cur=this.perf[p.id]||'Geral',items=['Geral','Calor','Frio','Noite'].map(id=>({id,label:id}));
  return `<article class="data-card pf-perfcard"><p class="t-eyebrow muted">Desempenho</p>${UI.seg(items,cur,'perf-perf',{name:'perf',label:'Condição',block:true})}<div id="panel-perf" role="tabpanel" aria-labelledby="tab-perf-${esc(cur)}" data-swap="perf" data-id="${esc(p.id)}">${this.perfPanel(p,cur)}</div></article>`;},
 noteChip(name){const n=typeof Notes!=='undefined'?Notes.lookup(name):null;
  return n?`<a class="chip pressable pf-note" href="#ingredient/${esc(n.id)}">${n.image?`<img src="${esc(n.image)}" alt="" loading="lazy" decoding="async">`:''}<span>${esc(name)}</span></a>`:`<span class="chip pf-note pf-note--plain">${esc(name)}</span>`;},
 pyramid(p){const n=p.notes||{},tiers=[['Saída',n.top],['Coração',n.heart],['Fundo',n.base]].filter(([,l])=>l&&l.length);
  const hl=!tiers.length&&n.highlights&&n.highlights.length?[['Destaques',n.highlights]]:[],extra=n.extra&&n.extra.length?[['Destaques',n.extra]]:[];
  const cols=[...tiers,...hl,...(tiers.length?extra:[])];
  if(!cols.length)return UI.section({title:'Notas oficiais',body:UI.empty({title:'Pirâmide não confirmada',text:'Ainda não encontramos uma fonte confiável para as notas deste perfume.'})});
  const src=n.source&&/^https:\/\//.test(n.source)?this.domain(n.source):'',cred=Catalog.credit(p.id);
  const lines=[src?`Fonte: <a href="${esc(n.source)}" target="_blank" rel="noopener noreferrer">${esc(src)}${icon('arrow-up-right','pf-ext')}<span class="sr-only"> (abre em nova aba)</span></a>${n.accessed?' · consultado em '+esc(UI.date(n.accessed,'short')):''}${n.reliability==='Em revisão'?' · em revisão':''}`:'',
   cred&&cred.domain?`Imagem: ${cred.page&&/^https:\/\//.test(cred.page)?`<a href="${esc(cred.page)}" target="_blank" rel="noopener noreferrer">${esc(cred.domain)}<span class="sr-only"> (abre em nova aba)</span></a>`:esc(cred.domain)}`:''].filter(Boolean);
  return UI.section({title:'Notas oficiais',cls:'pf-sec',body:`<div class="pf-pyr">${cols.map(([t,l])=>`<div class="pf-tier"><h3 class="t-eyebrow muted">${esc(t)}</h3><div class="chips">${l.map(x=>this.noteChip(x)).join('')}</div></div>`).join('')}</div>${lines.length?`<p class="pf-src t-sm muted">${lines.join('<br>')}</p>`:''}`});},
 community(p){const rev=state.reviews[p.id]||null,c=this.perceptions(p,rev);if(!c)return '';
  const chips=list=>`<div class="chips">${list.map(x=>`<span class="chip">${esc(x.note)}</span>`).join('')}</div>`;
  const yours=c.you.length?`<p class="t-eyebrow muted pf-comm-k">O que você sentiu</p>${c.felt.length?chips(c.felt):''}
${c.divergent.length?`<p class="t-sm muted pf-comm-d">Fora das notas da marca:</p>${chips(c.divergent)}`:''}`
   :`<p class="em pf-comm-empty">Ainda não há relatos sobre as notas percebidas deste perfume.</p>${UI.btn('Contar o que você sentiu',{variant:'tertiary',action:'rate',attrs:`data-id="${esc(p.id)}"`,icon:'chevron-right'})}`;
  return UI.section({title:'O que as pessoas percebem',cls:'pf-sec pf-comm',body:`<p class="t-sm muted pf-demo">Percepção é opinião, não fórmula. As notas declaradas pela marca ficam na pirâmide acima.</p>${yours}`});},
 shop(p){const links=Catalog.shopLinks(p).map(l=>UI.linkRow({icon:l.kind==='official'?'link':'search',title:l.label,sub:l.kind==='search'?'Compare preços em várias lojas':this.domain(l.href),href:l.href,external:true})).join('');
  return UI.section({title:'Onde experimentar e comprar',cls:'pf-sec',body:`<div class="list-hair pf-shop">${links}${UI.linkRow({icon:'qr',title:'Leve seu mapa à loja',sub:'ELIXIR Connect',href:'#connect'})}</div>
<p class="t-sm muted pf-note-line">Resultados orgânicos. O ELIXIR não recebe por estes links e não tem parceiros.</p><p class="pf-tip">Experimente antes: peça uma amostra ou teste na pele numa loja; a pele muda o perfume ao longo do dia.</p>`});},
 price:{dir:'cheaper',origin:'any'},
 priceBody(p){const P=this.price,list=Advisor.priceAlternatives?Advisor.priceAlternatives(p,{dir:P.dir,origin:P.origin,n:6}):[];
  const rows=list.map(x=>{const meta=[x.p.brand,Advisor.tierLabel(x.tier),x.national?'Nacional':'Importado'].filter(Boolean).join(' · ');
   const why=x.declared?'Inspiração declarada pela marca':x.shared.length?'Em comum: '+x.shared.slice(0,4).map(s=>String(s).toLowerCase()).join(', '):'Perfil olfativo parecido';
   return `<li class="pf-alt-row">${UI.row(x.p,{sub:esc(meta),trail:`<span class="pf-sim"><b>${x.sim}%</b><small>parecido</small></span>`})}<p class="t-sm muted pf-alt-why">${esc(why)}</p></li>`;}).join('');
  const t=Advisor.tier(p),empty=P.dir==='cheaper'&&t===1?'Este já está na faixa mais acessível.':P.dir==='pricier'&&t===4?'Este já está na faixa mais exclusiva.':'Nada parecido o bastante nesta combinação. Troque a faixa ou a origem.';
  return list.length?`<ol class="list-hair pf-alts">${rows}</ol>`:`<p class="em pf-alt-empty">${esc(empty)}</p>`;},
 priceSection(p){if(this.price.id!==p.id)this.price={dir:'cheaper',origin:'any',id:p.id};const P=this.price,t=Advisor.tier(p);if(!t)return '';
  const seg=UI.seg([{id:'cheaper',label:'Mais acessível'},{id:'same',label:'Mesma faixa'},{id:'pricier',label:'Mais exclusivo'}],P.dir,'pf-price-dir',{variant:'quiet',name:'pf-price',label:'Faixa',block:true});
  const chips=UI.chips([{id:'any',label:'Todos',on:P.origin==='any'},{id:'national',label:'Nacional',on:P.origin==='national'},{id:'imported',label:'Importado',on:P.origin==='imported'}],'pf-price-origin',{label:'Origem'});
  return UI.section({title:'Mais barato ou mais caro, com notas parecidas',cls:'pf-sec pf-price',body:`<p class="t-sm muted">Este é <b>${esc(Advisor.tierLabel(t))}</b>. Faixa pela marca, não pelo preço. Parecido não é igual: vale testar na pele.</p>${seg}${chips}<div id="pf-price-list">${this.priceBody(p)}</div>`});},
 rails(p){const out=[this.priceSection(p)];const alt=this.alternatives(p,6);
  if(alt.length)out.push(UI.section({title:'Alternativas de perfil parecido',rail:'pf-alt',body:UI.rail(alt.map((q,i)=>UI.tile(q,{i})),{name:'pf-alt',label:'Alternativas'})}));
  const lay=this.layering(p);if(lay&&lay.p)out.push(UI.section({title:'Em camadas com',body:`<div class="card pf-layer">${UI.row(lay.p)}${lay.why?`<p class="t-sm muted">${esc(lay.why)}</p>`:''}</div>`}));
  const q=this.quotes(p);if(q.length)out.push(UI.section({title:'Quem usa',rail:'pf-quotes',body:UI.rail(q.map(x=>UI.quote(x)),{name:'pf-quotes',label:'O que as pessoas dizem'})}));
  const posts=this.posts(p);let grid='';if(posts.length&&typeof Post!=='undefined'&&Post.grid)try{grid=Post.grid(posts);}catch(e){grid='';}
  if(grid)out.push(UI.section({title:'Publicações',body:grid}));
  else if(!posts.length)out.push(UI.section({title:'Publicações',body:UI.empty({title:'Seja a primeira pessoa a usar hoje',text:'Registre o dia em que usar este perfume.',cta:{label:'Usar hoje',action:'sotd',variant:'tertiary',attrs:`data-id="${esc(p.id)}"`}})}));
  return out.join('');},
 view(id){const p=byId(id);
  if(!p)return `<section class="v-perfume" data-view="perfume">${UI.empty({icon:'search',title:'Não encontramos este perfume',text:'Talvez o endereço tenha mudado.',cta:{label:'Ir para Descobrir',href:'#explore'}})}</section>`;
  return `<section class="v-perfume" data-view="perfume"><div class="pf-split"><div class="pf-hero full">${UI.photo(p,{eager:true,hero:true,cls:'pf-plate'})}</div>
<div class="pf-main">${this.head(p)}${this.actions(p)}
<div class="pf-cards">${this.cardYou(p)}${this.cardBlind(p)}${this.cardPerf(p)}${this.cardSeason(p)}</div>
${this.pyramid(p)}${this.community(p)}${this.shop(p)}</div></div>
<div class="pf-rails">${this.rails(p)}</div></section>`;},
 /* ---------- folha "Mais ações" ---------- */
 more(id){const p=byId(id);if(!p)return;const inCmp=state.compare.includes(p.id);
  const row=(ic,t,action,sub='')=>`<button type="button" class="link-row pressable" data-action="${action}" data-id="${esc(p.id)}"><span class="ico">${icon(ic,'icon--20')}</span><span class="grow"><b>${esc(t)}</b>${sub?`<span>${esc(sub)}</span>`:''}</span>${icon('chevron-right','icon--20')}</button>`;
  Sheet.open({title:p.name,cls:'sh-more',body:`<div class="list-hair">${row('compare',inCmp?'Remover da comparação':'Comparar','perf-compare',inCmp?'':'Lado a lado, até 3 perfumes')}${row('bookmark','Salvar em lista','perf-list')}${row('share','Compartilhar','perf-share')}</div>`});}
};

/* ---------- Folha de avaliação ---------- */
const Rating={
 id:null,d:null,open_:false,noteQ:'',
 HOURS:[[3,'Curta'],[6,'Média'],[9,'Longa']],PROJ:[[1,'Discreta'],[3,'Média'],[5,'Forte']],
 EVO:[['linear','Igual do começo ao fim'],['muda','Muda bastante'],['fundo','Melhora no fundo'],['saida','Melhor na saída']],
 VALUE:[['vale','Vale cada centavo'],['justo','Justo'],['caro','Caro pelo que entrega']],
 CLIMATE:['Calor','Meia-estação','Frio'],
 draft(id){const r=state.reviews[id]||{},v=state.ratings[id];
  return {rating:v===undefined?null:UI.RATING[Math.max(0,UI.ratingStep(v))][0],hours:r.hours||0,projection:r.projection||0,evolution:r.evolution||'',value:r.value||'',
   occasions:[...(r.occasions||[])],climate:[...(r.climate||[])],perceived:[...(r.perceived||[])],comment:r.comment||''};},
 single(key,items){const cur=this.d[key];return `<div class="chips" role="group" aria-label="${esc({hours:'Fixação',projection:'Projeção',evolution:'Evolução',value:'Custo-benefício'}[key])}">${items.map(([v,l])=>`<button type="button" class="chip pressable" aria-pressed="${cur===v}" data-action="rate-pick" data-key="${key}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>`;},
 multi(key,items,max,label){const cur=this.d[key];return `<div class="chips" role="group" aria-label="${esc(label)}" data-key="${key}">${items.map(v=>`<button type="button" class="chip pressable" aria-pressed="${cur.includes(v)}" data-action="rate-multi" data-key="${key}" data-max="${max}" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div>`;},
 noteItems(p){const off=Perfume.official(p),extra=this.d.perceived.filter(x=>!off.some(o=>NoteModel.normalize(o)===NoteModel.normalize(x)));return [...off,...extra].slice(0,24);},
 group(title,body,hint=''){return `<div class="rt-group"><h3 class="t-eyebrow muted">${esc(title)}${hint?` <span class="rt-hint">${esc(hint)}</span>`:''}</h3>${body}</div>`;},
 metaLine(id){const r=state.reviews[id];if(!r||state.ratings[id]===undefined)return '';return `Avaliada em ${UI.date(r.at,'day')}${r.editedAt?' · editada em '+UI.date(r.editedAt,'day'):''}`;},
 body(p){const has=state.ratings[p.id]!==undefined,occ=Explore.OCCASIONS;
  return `<div class="rt-top">${UI.photo(p,{cls:'rt-thumb'})}<div class="rt-id"><b>${esc(p.name)}</b><span class="t-sm muted">${esc(p.brand)}</span></div></div>
<p class="t-h3 rt-q" id="rt-q">O que você achou?</p>${UI.ratingScale(this.d.rating,'rate-set')}
${has?`<p class="t-sm muted rt-meta">${esc(this.metaLine(p.id))}</p>`:''}
<button type="button" class="rt-more pressable" data-action="rate-more" aria-expanded="${this.open_}" aria-controls="rt-details"><span>Mais detalhes <span class="muted">(opcional)</span></span>${icon('chevron-down','icon--20')}</button>
<div class="rt-details" id="rt-details" data-open="${this.open_}"${this.open_?'':' inert'}><div class="rt-inner">
${this.group('Fixação',this.single('hours',this.HOURS))}${this.group('Projeção',this.single('projection',this.PROJ))}
${this.group('Evolução',this.single('evolution',this.EVO))}${this.group('Custo-benefício',this.single('value',this.VALUE))}
${this.group('Ocasiões',this.multi('occasions',occ,3,'Ocasiões'),'até 3')}${this.group('Clima',this.multi('climate',this.CLIMATE,3,'Clima'),'até 3')}
${this.group('Notas que senti',`<div id="rt-notes">${this.multi('perceived',this.noteItems(p),8,'Notas que senti')}</div><div class="rt-other"><label class="field"><span>Outra nota</span><input type="text" id="rt-note-q" autocomplete="off" placeholder="Ex.: baunilha" data-input="rate-note-q" value="${esc(this.noteQ)}"></label><div id="rt-note-sug" class="rt-sug" aria-live="polite"></div></div>`,'até 8')}
${UI.textarea({name:'comment',label:'Resenha',value:this.d.comment,max:280,rows:3,attrs:'data-input="rate-comment" placeholder="Opcional. O que ficou na memória?"'})}
</div></div>
<div class="sheet-foot rt-foot">${UI.btn('Salvar avaliação',{action:'rate-save',size:'block',attrs:`id="rt-save"${this.d.rating===null?' disabled':''}`})}${has?UI.btn('Remover avaliação',{action:'rate-remove',variant:'danger',size:'sm'}):''}</div>`;},
 open(id){const p=byId(id);if(!p)return;this.id=p.id;this.d=this.draft(p.id);this.open_=false;this.noteQ='';
  Sheet.open({title:state.ratings[p.id]!==undefined?'Editar avaliação':'Avaliar',body:this.body(p),cls:'sh-rate',focus:'.rating-scale [tabindex="0"]'});},
 suggest(q){const n=NoteModel.normalize(q);if(n.length<2)return [];const alias=typeof INGREDIENT_ALIASES!=='undefined'?INGREDIENT_ALIASES:{};
  const list=(typeof INGREDIENTS!=='undefined'?INGREDIENTS:[]).filter(i=>NoteModel.normalize(i.name).includes(n)||(alias[i.id]||[]).some(a=>NoteModel.normalize(a).startsWith(n)));
  return list.sort((a,b)=>(NoteModel.normalize(a.name).startsWith(n)?0:1)-(NoteModel.normalize(b.name).startsWith(n)?0:1)||a.name.localeCompare(b.name,'pt-BR')).slice(0,6).map(i=>i.name);},
 save(){const id=this.id,d=this.d;if(!id||!d||d.rating===null)return;const prev=state.ratings[id],now=Date.now();
  Store.update(s=>{const old=s.reviews[id]||{},r={comment:String(d.comment||'').trim().slice(0,280),at:old.at&&prev!==undefined?old.at:now};
   if(prev!==undefined)r.editedAt=now;if(d.hours)r.hours=d.hours;if(d.projection)r.projection=d.projection;if(d.evolution)r.evolution=d.evolution;if(d.value)r.value=d.value;
   if(d.occasions.length)r.occasions=d.occasions.slice(0,3);if(d.climate.length)r.climate=d.climate.slice(0,3);if(d.perceived.length)r.perceived=d.perceived.slice(0,8);
   r.history=[...(old.history||[])];if(prev!==d.rating)r.history=[...r.history,{rating:d.rating,at:now}].slice(-5);
   s.reviews[id]=r;s.ratings[id]=d.rating;if(prev!==d.rating||!s.ratedAt[id])s.ratedAt[id]=now;
   if(!s.shelf[id]){s.shelf[id]='tried';s.shelfAt[id]=now;}});
  Sheet.close();toast('Avaliação salva');},
 async remove(){const id=this.id;if(!id)return;const ok=await Sheet.confirm({title:'Remover avaliação?',text:'A nota, os detalhes e a resenha deste perfume serão apagados.',ok:'Remover',danger:true});if(!ok)return;
  const snap={r:state.ratings[id],at:state.ratedAt[id],rev:state.reviews[id]?JSON.parse(JSON.stringify(state.reviews[id])):null};
  Sheet.close({force:true});Store.update(s=>{delete s.ratings[id];delete s.ratedAt[id];delete s.reviews[id];});
  toast('Avaliação removida',{undo:()=>Store.update(s=>{s.ratings[id]=snap.r;if(snap.at)s.ratedAt[id]=snap.at;if(snap.rev)s.reviews[id]=snap.rev;})});}
};

Actions.add({
 'perf-more':el=>Perfume.more(el.dataset.id),
 'perf-compare':el=>{const id=el.dataset.id;Sheet.close({force:true});
  if(typeof Compare!=='undefined'&&Compare.toggle){Compare.toggle(id);return;}
  const on=state.compare.includes(id);if(!on&&state.compare.length>=3){toast('Compare até 3 perfumes por vez.');return;}
  Store.update(s=>{s.compare=on?s.compare.filter(x=>x!==id):[...s.compare,id];});toast(on?'Removido da comparação':'Adicionado à comparação');},
 'perf-list':el=>{if(typeof Lists!=='undefined'&&Lists.pick)Lists.pick(el.dataset.id);else{Sheet.close();toast('As listas chegam em breve.');}},
 'perf-share':el=>{if(typeof Compose!=='undefined'&&Compose.share)Compose.share('perfume',el.dataset.id);else{Sheet.close();toast('O compartilhamento chega em breve.');}},
 'perf-perf':el=>{const panel=document.getElementById('panel-perf'),id=panel&&panel.dataset.id,p=byId(id),f=el.dataset.id;if(!p||Perfume.perf[p.id]===f&&el.getAttribute('aria-selected')==='true')return;
  Perfume.perf[p.id]=f;UI.segSet(el.closest('.seg'),f);panel.setAttribute('aria-labelledby','tab-perf-'+f);Motion.swap(panel,Perfume.perfPanel(p,f));},
 'rate-set':el=>{if(!Rating.d)return;Rating.d.rating=Number(el.dataset.v);UI.segSet(el.closest('.rating-scale'),el.dataset.id);const b=document.getElementById('rt-save');if(b)b.disabled=false;},
 'rate-more':el=>{Rating.open_=!Rating.open_;el.setAttribute('aria-expanded',Rating.open_);const box=document.getElementById('rt-details');if(!box)return;box.dataset.open=Rating.open_;box.inert=!Rating.open_;
  if(Rating.open_&&!Motion.reduced())setTimeout(()=>{try{el.scrollIntoView({block:'start',behavior:'smooth'});}catch(e){}},60);},
 'rate-pick':el=>{if(!Rating.d)return;const k=el.dataset.key,raw=el.dataset.v,v=['hours','projection'].includes(k)?Number(raw):raw;Rating.d[k]=Rating.d[k]===v?(typeof v==='number'?0:''):v;
  for(const b of el.parentElement.querySelectorAll('[data-action=rate-pick]'))b.setAttribute('aria-pressed',String(Rating.d[k])===b.dataset.v&&!!Rating.d[k]);},
 'rate-multi':el=>{if(!Rating.d)return;const k=el.dataset.key,v=el.dataset.v,max=Number(el.dataset.max)||3,cur=Rating.d[k];
  if(cur.includes(v))Rating.d[k]=cur.filter(x=>x!==v);else{if(cur.length>=max){toast(`Escolha até ${max}.`);return;}Rating.d[k]=[...cur,v];}
  el.setAttribute('aria-pressed',Rating.d[k].includes(v));},
 'rate-note-add':el=>{if(!Rating.d)return;const v=el.dataset.v,p=byId(Rating.id);if(!v||!p)return;
  if(!Rating.d.perceived.some(x=>NoteModel.normalize(x)===NoteModel.normalize(v))){if(Rating.d.perceived.length>=8){toast('Escolha até 8.');return;}Rating.d.perceived=[...Rating.d.perceived,v];}
  Rating.noteQ='';const box=document.getElementById('rt-notes');if(box)box.innerHTML=Rating.multi('perceived',Rating.noteItems(p),8,'Notas que senti');
  const inp=document.getElementById('rt-note-q');if(inp){inp.value='';inp.focus();}const sug=document.getElementById('rt-note-sug');if(sug)sug.innerHTML='';},
 'rate-save':()=>Rating.save(),
 'rate-remove':()=>Rating.remove()
});
Actions.input('rate-comment',el=>{if(Rating.d)Rating.d.comment=el.value;});
Actions.input('rate-note-q',el=>{Rating.noteQ=el.value;const sug=document.getElementById('rt-note-sug');if(!sug)return;const list=Rating.suggest(el.value);
 sug.innerHTML=list.length?`<div class="chips" role="group" aria-label="Sugestões de notas">${list.map(n=>`<button type="button" class="chip pressable" data-action="rate-note-add" data-v="${esc(n)}">${icon('plus','rt-plus')}<span>${esc(n)}</span></button>`).join('')}</div>`:el.value.trim().length>=2?`<p class="t-sm muted">Nenhuma nota com esse nome.</p>`:'';});

Router.add('perfume',{view:id=>Perfume.view(id),title:id=>{const p=byId(id);return p?p.name:'Perfume';}});

Actions.add({
 'pf-price-dir':el=>{Perfume.price.dir=el.dataset.id;UI.segSet(el.closest('.seg'),el.dataset.id);const p=byId(route.id),box=document.getElementById('pf-price-list');if(p&&box)Motion.swap(box,Perfume.priceBody(p));},
 'pf-price-origin':el=>{Perfume.price.origin=el.dataset.id;for(const b of el.parentElement.querySelectorAll('[data-action=pf-price-origin]'))b.setAttribute('aria-pressed',b===el);const p=byId(route.id),box=document.getElementById('pf-price-list');if(p&&box)Motion.swap(box,Perfume.priceBody(p));}
});
