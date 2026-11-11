'use strict';
/* Guia (§5): hub "Saiba qual perfume comprar", perguntas (para mim e para presentear) e resultados explicados.
   A URL guarda o passo atual; state.guide.step guarda o último passo concluído (0–6). */
const Guide={
 mode:null,          /* seg do hub (estado da view) */
 open:new Set(),     /* "Por que?" abertos nos resultados */
 unknown:false,      /* presente: "Não sei o gosto" escolhido */
 noteQuery:'',
 lastKey:{k:'',t:0},
 memo:{key:'',val:null},

 /* ---------- perguntas ---------- */
 OCC:[['Dia a dia','Casa, rua e rotina'],['Trabalho','Escritório e reuniões'],['Encontro','Jantar e programas a dois'],['Festa','Noite, música e pista'],['Calor e praia','Sol, mar e piscina'],['Ocasião especial','Casamento, evento e gala']],
 GIFT_OCC:[['Aniversário','Um presente com data marcada'],['Data especial','Namoro ou aniversário de casamento'],['Natal','Fim de ano'],['Agradecimento','Um obrigado com cheiro bom'],['Sem motivo','Só porque sim'],['Dia a dia','Para usar sempre']],
 CLIMATE:[['Calor','Dias quentes e úmidos'],['Meia-estação','Nem calor, nem frio'],['Frio','Dias frescos e noites frias'],['Qualquer','Um para o ano todo']],
 PRESENCE:[['Discreta','Só quem chega perto sente'],['Equilibrada','Presente, sem exagero'],['Marcante','Deixa rastro por onde passa']],
 TIER:[['Acessível','Natura, O Boticário, Eudora'],['Intermediária','Granado, Lattafa, Armaf'],['Premium','Dior, Chanel, Carolina Herrera'],['Nicho','Le Labo, Diptyque, Aesop'],['Tanto faz','Mostrar todas as faixas']],
 who(){const g=state.guide;if(!g||g.mode!=='gift'||!g.giftFor||typeof People==='undefined')return null;try{return People.get?People.get(g.giftFor):null;}catch(e){return null;}},
 first(u){return u?String(u.name||'').split(/\s+/)[0]:'';},
 question(mode,n){const gift=mode==='gift',u=gift?this.who():null,nm=this.first(u);
  const Q={
   1:gift?{k:'occasions',type:'multi',max:2,title:'Qual é a ocasião?',sub:'Escolha até duas.',options:this.GIFT_OCC}:{k:'occasions',type:'multi',max:2,title:'Para que ocasião?',sub:'Escolha até duas.',options:this.OCC},
   2:{k:'climate',type:'single',title:'Para que clima?',sub:nm?`Onde ${nm} mais vai usar.`:'Onde você mais vai usar.',options:this.CLIMATE},
   3:{k:'presence',type:'presence',title:'Quanta presença?',sub:nm?`Do jeito que ${nm} gosta.`:'O quanto as pessoas ao redor sentem.',options:this.PRESENCE},
   4:{k:'families',type:'families',title:'Famílias',sub:nm?`O que ${nm} gosta ou evita, se você souber. Toque uma vez para gosto e de novo para evito.`:'Toque uma vez para gosto e de novo para evito. Se não souber, siga em frente.'},
   5:{k:'avoidNotes',type:'notes',title:nm?`Notas que ${nm} evita`:'Notas que você evita',sub:'Busque uma nota ou toque nas sugestões.'},
   6:gift?{k:'tier',type:'single',title:'Qual é o orçamento?',sub:'Faixa por marca, não por preço.',options:this.TIER}:{k:'tier',type:'single',title:'Faixa da marca',sub:'Faixa por marca, não por preço.',options:this.TIER}};
  return Q[n]||null;},

 /* ---------- estado ---------- */
 blank(mode){return {mode,step:0,giftFor:null,giftStyles:[],answers:{occasions:[],climate:'',presence:'',allDay:false,families:{},avoidNotes:[],tier:'',audience:''},updatedAt:Date.now()};},
 ensure(mode){const g=state.guide;if(g&&g.mode===mode)return g;Store.update(s=>{s.guide=this.blank(mode);},{silent:true});return state.guide;},
 save(fn){Store.update(s=>{if(!s.guide)s.guide=this.blank('me');fn(s.guide);s.guide.updatedAt=Date.now();},{silent:true});},
 hasWho(g=state.guide){return !!(g&&(g.giftFor||(g.giftStyles||[]).length));},
 done(g=state.guide){return !!(g&&g.step>=6&&(g.mode!=='gift'||this.hasWho(g)));},
 resumeStep(g=state.guide){if(!g)return 0;if(g.mode==='gift')return this.hasWho(g)?Math.min(6,Math.max(1,g.step+1)):0;return Math.min(6,Math.max(1,g.step+1));},
 partial(g=state.guide){if(!g||this.done(g))return false;return g.mode==='gift'?this.hasWho(g)||g.step>0:g.step>0;},
 complete(n){this.save(g=>{g.step=Math.max(g.step,n);});},
 go(mode,n){Router.go('guide',n>6?'results':`${mode}/${n}`);},

 /* ---------- hub ---------- */
 hub(){const g=state.guide;if(!this.mode)this.mode=g?g.mode:'me';
  const seg=UI.seg([{id:'me',label:'Para mim'},{id:'gift',label:'Para presentear'}],this.mode,'guide-mode',{variant:'ink',name:'guide-mode',label:'Para quem é o perfume'});
  const img=UI.coverSrc('woody');
  const start=`<div class="g-start"><div class="g-start-img" aria-hidden="true"><img class="bw" src="${esc(img.src)}"${img.srcset?` srcset="${esc(img.srcset)}" sizes="(min-width:1024px) 40vw, 100vw"`:''} alt="" loading="eager" decoding="async"></div>
   <div class="g-start-main">${seg}<div id="panel-guide-mode" role="tabpanel" aria-labelledby="tab-guide-mode-${this.mode}" class="g-start-body">${this.startBody(this.mode)}</div></div></div>`;
  const more=[UI.linkRow({icon:'sun',title:'Hoje',sub:'Qual perfume usar hoje, com o clima de agora.',href:'#today'}),UI.linkRow({icon:'compass',title:'Fora da Bolha',sub:'Experimental: além das suas famílias favoritas.',href:'#bubble'}),
   UI.linkRow({icon:'gift',title:'Meu círculo e presentes',sub:'Compare gostos e acerte no presente.',href:'#circle'}),UI.linkRow({icon:'qr',title:'ELIXIR Connect',sub:'Leve seu mapa a uma loja, com acesso temporário.',href:'#connect'})].join('');
  let last='';
  if(this.done(g)){const res=this.compute();const list=res?(res.mode==='gift'?[...res.gift.safe,...res.gift.bold].map(x=>x.p):res.rank.items.map(x=>x.p)).slice(0,8):[];
   if(list.length)last=UI.section({title:'Seus últimos resultados',rail:'guide-last',more:{label:'Ver tudo',href:'#guide/results'},body:UI.rail(list.map((p,i)=>UI.tile(p,{i})),{name:'guide-last',label:'Seus últimos resultados'})});}
  return `<section class="v-guide" data-view="guide">${UI.pageHead({eyebrow:'Guia',title:'Saiba qual perfume comprar'})}${start}
   <div class="g-hub-tools">${UI.btn('Comparar perfumes',{variant:'tertiary',href:'#compare',icon:'chevron-right'})}</div>
   ${UI.section({title:'Mais no Guia',body:`<div class="list-hair g-more">${more}</div>`})}${last}</section>`;},
 startBody(mode){const g=state.guide,same=g&&g.mode===mode,done=same&&this.done(g),part=same&&this.partial(g);
  const gift=mode==='gift';
  const lead=gift?'Diga para quem é e o que importa. Leva 1 minuto.':'Responda 6 perguntas. Leva 1 minuto.';
  const sub=gift?'Usamos o gosto da pessoa, nunca estereótipos. Você recebe opções seguras e ousadas.':'Ocasião, clima, presença, famílias, notas e faixa. Cada sugestão vem com o porquê.';
  const btns=done?UI.btn('Ver resultados',{href:'#guide/results',action:'guide-results'})+UI.btn('Refazer',{variant:'secondary',action:'guide-start',attrs:`data-id="${mode}"`})
   :UI.btn('Começar',{action:'guide-start',attrs:`data-id="${mode}"`})+(part?UI.btn('Continuar de onde parou',{variant:'secondary',action:'guide-resume'}):'');
  return `<p class="t-h2 g-lead">${esc(lead)}</p><p class="muted g-sub">${esc(sub)}</p><div class="g-start-actions">${btns}</div>`;},

 /* ---------- cromo das perguntas (compartilhado com Boas-vindas e Refinar) ---------- */
 chrome({back='',end='',step=0,total=0,eyebrow=''}={}){
  const b=back?UI.iconBtn('chevron-left',{action:back,label:'Voltar'}):'<span class="q-spacer" aria-hidden="true"></span>';
  return `<div class="q-top">${b}<div class="q-progress">${total?UI.progress(step,total):''}</div>${end||'<span class="q-spacer" aria-hidden="true"></span>'}</div>${eyebrow?`<p class="t-eyebrow muted q-eyebrow">${esc(eyebrow)}</p>`:''}`;},
 opts(list,{k,type='single',value,attrs=''}){const multi=type==='multi';
  return `<div class="q-opts" role="${multi?'group':'radiogroup'}" aria-labelledby="q-title" ${attrs}>${list.map(([v,sub],i)=>{const on=multi?(value||[]).includes(v):value===v;
   const tab=multi?0:(on||!value&&i===0?0:-1);
   return `<button type="button" class="q-opt pressable" role="${multi?'checkbox':'radio'}" aria-checked="${on}" tabindex="${tab}" data-action="guide-pick" data-k="${esc(k)}" data-v="${esc(v)}"><span class="q-opt-t"><b>${esc(v)}</b>${sub?`<small>${esc(sub)}</small>`:''}</span><span class="q-check" aria-hidden="true">${icon('check','icon--20')}</span></button>`;}).join('')}</div>`;},

 /* ---------- passos ---------- */
 step(mode,n){const g=this.ensure(mode),a=g.answers;
  if(mode==='gift'&&n===0)return this.stepWho();
  const Q=this.question(mode,n);if(!Q)return '';
  /* pré-preenchimento só na primeira visita ao passo */
  if(n===4&&g.step<4&&!Object.keys(a.families).length){const fam=this.prefillFamilies(mode);if(Object.keys(fam).length){this.save(x=>{x.answers.families=fam;});}}
  if(n===5&&g.step<5&&!a.avoidNotes.length){const notes=this.prefillNotes(mode);if(notes.length)this.save(x=>{x.answers.avoidNotes=notes;});}
  const A=state.guide.answers;
  const firstStep=mode==='me'?n===1:false;
  const top=this.chrome({back:firstStep?'':'guide-back',end:UI.iconBtn('close',{action:'guide-close',label:'Fechar o Guia'}),step:mode==='gift'?n+1:n,total:mode==='gift'?7:6,eyebrow:`${n} de 6`});
  let body='',foot=true;
  if(Q.type==='multi')body=this.opts(Q.options,{k:Q.k,type:'multi',value:A[Q.k]});
  else if(Q.type==='single'){body=this.opts(Q.options,{k:Q.k,value:A[Q.k]});foot=false;}
  else if(Q.type==='presence')body=this.opts(Q.options,{k:Q.k,value:A[Q.k],attrs:'data-stay="1"'})+`<div class="q-extra" data-change="guide-allday">${UI.toggle({name:'allDay',label:'Precisa durar o dia todo',sub:'Damos preferência a quem tem relatos de fixação longa.',on:A.allDay})}</div>`;
  else if(Q.type==='families')body=`<div class="q-chips" id="g-fams">${this.famChips(A.families)}</div>`;
  else if(Q.type==='notes')body=`<label class="field q-field"><span>Buscar nota</span><input type="search" name="note" data-input="guide-note" autocomplete="off" enterkeyhint="done" placeholder="Ex.: baunilha, couro, lavanda" value="${esc(this.noteQuery)}"></label><div class="q-chips" id="g-notes" aria-live="polite">${this.noteChips()}</div>`;
  const skip=UI.btn('Pular esta pergunta',{variant:'tertiary',action:'guide-skip',attrs:`data-n="${n}"`});
  const f=foot?`<div class="q-foot">${UI.btn(n===6?'Ver resultados':'Continuar',{size:'block',action:'guide-next',attrs:`data-n="${n}"`})}</div>`:'';
  return `<section class="v-guide q" data-view="guide-step" data-mode="${mode}" data-n="${n}">${top}<h1 class="t-display q-title" id="q-title" tabindex="-1">${esc(Q.title)}</h1><p class="q-sub muted">${esc(Q.sub)}</p>
   <div class="q-body">${body}</div><div class="q-skip">${skip}</div>${f}</section>`;},
 stepWho(){const g=state.guide,list=this.people(),unknown=this.unknown||!g.giftFor&&(g.giftStyles||[]).length>0;
  const top=this.chrome({end:UI.iconBtn('close',{action:'guide-close',label:'Fechar o Guia'}),step:1,total:7,eyebrow:'Presente'});
  const rows=list.map((u,i)=>{const on=!unknown&&g.giftFor===u.id,tab=on||!g.giftFor&&!unknown&&i===0?0:-1;
   return `<button type="button" class="q-opt q-person pressable" role="radio" aria-checked="${on}" tabindex="${tab}" data-action="guide-who" data-id="${esc(u.id)}">${UI.avatar(u,'sm')}<span class="q-opt-t"><b>${esc(u.name)}</b><small>${esc(u.tag)}</small></span><span class="q-check" aria-hidden="true">${icon('check','icon--20')}</span></button>`;}).join('');
  const unk=`<button type="button" class="q-opt pressable" role="radio" aria-checked="${unknown}" tabindex="${unknown?0:-1}" data-action="guide-unknown"><span class="q-ico" aria-hidden="true">${icon('sparkle','icon--20')}</span><span class="q-opt-t"><b>Não sei o gosto</b><small>Escolha até 3 estilos</small></span><span class="q-check" aria-hidden="true">${icon('check','icon--20')}</span></button>`;
  const styles=unknown?`<div class="q-styles" role="group" aria-label="Estilos">${(typeof STYLE_CHOICES!=='undefined'?STYLE_CHOICES:[]).map(s=>{const on=(g.giftStyles||[]).includes(s.id);
   return `<button type="button" class="q-style pressable" aria-pressed="${on}" data-action="guide-style" data-id="${esc(s.id)}"><span class="q-style-img"><img src="assets/families/${esc(s.id)}.webp" alt="" loading="lazy" decoding="async"></span><b>${esc(s.label)}</b><small>${esc(s.sub)}</small><span class="q-check" aria-hidden="true">${icon('check','icon--20')}</span></button>`;}).join('')}</div>`:'';
  const ok=!!g.giftFor||(g.giftStyles||[]).length>0;
  return `<section class="v-guide q" data-view="guide-step" data-mode="gift" data-n="0">${top}<h1 class="t-display q-title" id="q-title" tabindex="-1">Para quem?</h1><p class="q-sub muted">Usamos o gosto da pessoa, nunca um estereótipo.</p>
   <div class="q-body"><div class="q-opts q-opts--people" role="radiogroup" aria-labelledby="q-title">${rows}${unk}</div>${styles}</div>
   <div class="q-foot">${UI.btn('Continuar',{size:'block',action:'guide-next',attrs:`data-n="0"${ok?'':' disabled'}`})}</div></section>`;},
 people(){if(typeof People==='undefined'||!People.all)return [];const all=People.all(),circle=state.circle||[],fol=state.following||[];
  const tag=u=>circle.includes(u.id)?'No seu círculo':fol.includes(u.id)?'Você segue':'@'+(u.handle||u.id);
  const rank=u=>circle.includes(u.id)?0:fol.includes(u.id)?1:2;
  return all.map(u=>({...u,tag:tag(u)})).sort((a,b)=>rank(a)-rank(b)||String(a.name).localeCompare(String(b.name),'pt-BR')).slice(0,8);},
 prefillFamilies(mode){const out={};try{
  if(mode==='gift'){const u=this.who();if(u&&Object.keys(u.ratings||{}).length)for(const x of Advisor.personAxes(u.ratings).slice(0,2))if(x.value>.55)out[x.id]='like';return out;}
  const id=Select.identity();if(!id||!id.signals)return out;const map={'Aquática':'aquatico','Verde':'verde','Aromática':'aromatico','Amadeirada':'amadeirado','Cítrica':'citrico','Floral':'floral','Gourmand':'gourmand','Ambarada':'ambar'};
  for(const f of id.families.slice(0,2))if(map[f.name])out[map[f.name]]='like';}catch(e){}return out;},
 prefillNotes(mode){if(mode==='gift'){const u=this.who();return u?(u.disliked||[]).map(s=>this.noteName(s)).slice(0,6):[];}return (state.preferences.dislikedNotes||[]).slice(0,8);},
 noteName(slug){const ing=typeof INGREDIENTS!=='undefined'?INGREDIENTS.find(i=>i.id===slug):null;if(ing)return ing.name;const s=String(slug).replace(/-/g,' ');return s.charAt(0).toUpperCase()+s.slice(1);},
 famChips(fam,action='guide-fam'){return `<div class="chips" role="group" aria-label="Famílias">${Advisor.families().map(f=>this.famChip(f.id,fam[f.id]||'',action)).join('')}</div>`;},
 famChip(id,st,action='guide-fam'){const label=Advisor.famLabel(id);
  return `<button type="button" class="chip pressable${st==='avoid'?' avoid':''}" aria-pressed="${st==='like'}" data-action="${action}" data-id="${esc(id)}" data-state="${st}">${st==='like'?icon('check','icon--20'):''}${esc(label)}<span class="sr-only">${st==='like'?' (gosto)':st==='avoid'?' (evito)':''}</span></button>`;},
 noteList(){const set=new Map(),add=n=>{const k=Catalog.norm(n);if(k&&!set.has(k))set.set(k,n);};
  (typeof NOTE_CHOICES!=='undefined'?NOTE_CHOICES:[]).forEach(add);(typeof INGREDIENTS!=='undefined'?INGREDIENTS:[]).forEach(i=>add(i.name));return [...set.values()];},
 noteChips(){const g=state.guide,sel=g?g.answers.avoidNotes:[],q=Catalog.norm(this.noteQuery),selN=new Set(sel.map(x=>Catalog.norm(x)));
  let sug=this.noteList().filter(n=>!selN.has(Catalog.norm(n)));
  if(q){const pre=sug.filter(n=>Catalog.norm(n).startsWith(q)),inc=sug.filter(n=>!Catalog.norm(n).startsWith(q)&&Catalog.norm(n).includes(q));sug=[...pre,...inc];}
  sug=sug.slice(0,q?16:18);
  const chip=(n,on)=>`<button type="button" class="chip pressable" aria-pressed="${on}" data-action="guide-note" data-id="${esc(n)}">${on?icon('close','icon--20'):''}${esc(n)}${on?'<span class="sr-only"> (evito; tocar remove)</span>':''}</button>`;
  const custom=q&&!sug.some(n=>Catalog.norm(n)===q)&&!selN.has(q)?`<button type="button" class="chip pressable" aria-pressed="false" data-action="guide-note" data-id="${esc(this.noteQuery.trim().slice(0,40))}">${icon('plus','icon--20')}Evitar “${esc(this.noteQuery.trim().slice(0,40))}”</button>`:'';
  const selected=sel.length?`<div class="chips q-selected" role="group" aria-label="Você evita">${sel.map(n=>chip(n,true)).join('')}</div>`:'';
  return `${selected}<p class="t-eyebrow muted q-label">${q?'Resultados':'Sugestões'}</p><div class="chips" role="group" aria-label="Sugestões de notas">${sug.map(n=>chip(n,false)).join('')}${custom}</div>${q&&!sug.length&&!custom?'<p class="muted t-sm">Nenhuma nota com esse nome.</p>':''}`;},

 /* ---------- resultados ---------- */
 compute(){const g=state.guide;if(!g)return null;const key=JSON.stringify([g.mode,g.giftFor,g.giftStyles,g.answers,Store.rev,PERFUMES.length]);if(this.memo.key===key)return this.memo.val;
  let val;try{
   if(g.mode==='gift'){const u=this.who(),styles=g.giftStyles||[];
    const prefs=u?{likedNotes:(u.liked||[]).map(s=>this.noteName(s)),dislikedNotes:(u.disliked||[]).map(s=>this.noteName(s))}:{styles};
    const rank=Advisor.rank(g.answers,u?u.ratings:{},prefs,{n:30,forPerson:u});
    let wish=[];try{if(u&&typeof Circle!=='undefined'&&typeof Circle.wishlist==='function')wish=Circle.wishlist(u.id)||[];}catch(e){}
    val={mode:'gift',who:u,rank,gift:Advisor.gift(rank,u,{styles,wishlist:wish})};}
   else{const have=Select.shelfIds('have'),miss=Object.keys(state.feedback).filter(id=>state.feedback[id].v===-1&&state.feedback[id].src==='guide');
    let ctx=null;try{if(typeof Today!=='undefined'&&Today.ctx)ctx=Today.ctx();}catch(e){}
    val={mode:'me',rank:Advisor.rank(g.answers,state.ratings,state.preferences,{n:10,exclude:[...have,...miss],map:Select.map(),ctx,owned:have})};}
  }catch(e){console.warn(e);val=null;}
  this.memo={key,val};return val;},
 summary(){const g=state.guide,a=g.answers,mode=g.mode,chips=[];const add=(label,n)=>chips.push(`<button type="button" class="chip pressable" data-action="guide-edit" data-n="${n}">${esc(label)}</button>`);
  if(mode==='gift'){const u=this.who();add(u?this.first(u):'Estilos escolhidos',0);}
  add(a.occasions.length?a.occasions.join(' · '):'Qualquer ocasião',1);add(a.climate&&a.climate!=='Qualquer'?a.climate:'Qualquer clima',2);
  add((a.presence||'Qualquer presença')+(a.allDay?' · dia todo':''),3);
  const fl=Object.keys(a.families).filter(k=>a.families[k]==='like').map(k=>Advisor.famLabel(k)),fa=Object.keys(a.families).filter(k=>a.families[k]==='avoid').map(k=>Advisor.famLabel(k));
  add(fl.length||fa.length?[fl.join(', '),fa.length?'sem '+fa.join(', ').toLowerCase():''].filter(Boolean).join(' · '):'Todas as famílias',4);
  add(a.avoidNotes.length?'Sem '+a.avoidNotes.slice(0,2).join(', ').toLowerCase()+(a.avoidNotes.length>2?' +'+(a.avoidNotes.length-2):''):'Nenhuma nota evitada',5);
  add(a.tier&&a.tier!=='Tanto faz'?a.tier:'Qualquer faixa',6);
  return `<div class="chips rail-x g-summary" role="group" aria-label="Suas respostas. Toque para mudar">${chips.join('')}</div>`;},
 compareChip(id,label='Comparar'){const on=state.compare.includes(id);return `<button type="button" class="chip pressable g-cmp" aria-pressed="${on}" data-action="guide-compare" data-id="${esc(id)}">${on?icon('check','icon--20'):icon('plus','icon--20')}${esc(label)}</button>`;},
 pill(text){return `<span class="g-pill">${esc(text)}</span>`;},
 mini(list){return list.map(x=>UI.row(x.p,{sub:esc(x.sub)})).join('');},
 extras(it){const alts=it.alternatives.map(a=>({p:a.p,sub:`${Math.round(a.sim*100)}% parecido · ${Advisor.tierLabel(Advisor.tier(a.p))}`}));
  const alt=alts.length?`<div class="g-extra"><p class="t-eyebrow muted">Alternativas parecidas</p><div class="list-hair">${this.mini(alts)}</div></div>`:'';
  const lay=it.layering?`<div class="g-extra"><p class="t-eyebrow muted">Para usar em camadas</p><div class="list-hair">${this.mini([{p:it.layering.p,sub:it.layering.p.brand}])}</div><p class="t-sm muted g-lay">${esc(it.layering.why)}</p></div>`:'';
  return alt||lay?`<div class="g-extras">${alt}${lay}</div>`:'';},
 bullets(list){return list.length?`<ul class="g-bullets">${list.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`:'';},
 hero(it){const p=it.p,x={...it.explain};delete x.chance;delete x.caution;
  return `<article class="g-hero" aria-labelledby="g-hero-name">
   <a class="g-hero-plate pressable" href="#perfume/${esc(p.id)}" data-action="perfume" data-id="${esc(p.id)}" aria-label="${esc(p.name)}, abrir perfume">${UI.photo(p,{eager:true})}</a>
   <div class="g-hero-body"><p class="t-eyebrow muted">Sua melhor aposta</p><div class="g-hero-name"><h2 class="t-h1" id="g-hero-name">${esc(p.name)}</h2><p class="muted">${esc(p.brand)} · ${esc(Advisor.tierLabel(Advisor.tier(p)))}</p></div>
    <div class="g-score"><div class="g-num">${UI.num(it.chance,'%')}<span class="t-sm muted">Chance de gostar</span></div>${this.pill(it.blindBuy.level)}</div>
    <div class="g-why"><p class="t-eyebrow muted">Por que este</p>${this.bullets(it.why)}${it.cautions[0]?`<p class="g-caution t-sm">${esc(it.cautions[0])}</p>`:''}</div>
    ${UI.why(x,{feedback:'guide'})}
    <div class="g-actions">${UI.btn('Ver perfume',{href:'#perfume/'+p.id,action:'perfume',attrs:`data-id="${esc(p.id)}"`})}${this.compareChip(p.id,'Usar no Comparar')}</div></div>
   ${this.extras(it)}</article>`;},
 item(it,i){const p=it.p,open=this.open.has(p.id),id='g-why-'+i,x={...it.explain};delete x.chance;delete x.caution;
  return `<li class="g-item" style="--i:${Math.min(i,8)}">
   <div class="g-row"><span class="g-rank" aria-hidden="true">${i+2}</span>${UI.row(p,{sub:esc(p.brand),trail:`<span class="g-chance"><b>${it.chance}%</b><small>chance</small></span>`})}</div>
   <div class="g-tools"><button type="button" class="btn btn--tertiary pressable g-toggle" aria-expanded="${open}" aria-controls="${id}" data-action="guide-why" data-id="${esc(p.id)}"><span>Por que?</span>${icon('chevron-down')}</button>${this.compareChip(p.id)}</div>
   <div class="g-exp" id="${id}"${open?' data-open':' inert'}><div class="g-exp-in"><div class="g-exp-body">
    <div class="g-score g-score--sm">${this.pill(it.blindBuy.level)}${it.blindBuy.factors[0]?`<span class="t-sm muted">${esc(it.blindBuy.factors[0])}</span>`:''}</div>
    ${this.bullets(it.why)}${it.cautions[0]?`<p class="g-caution t-sm">${esc(it.cautions[0])}</p>`:''}${UI.why(x,{feedback:'guide'})}${this.extras(it)}</div></div></div></li>`;},
 results(){const g=state.guide;if(!g)return `<section class="v-guide" data-view="guide-results">${UI.empty({title:'Responda o Guia primeiro',cta:{label:'Ir para o Guia',href:'#guide'}})}</section>`;
  const res=this.compute();if(!res)return '';
  return res.mode==='gift'?this.giftResults(res):this.meResults(res);},
 meResults(res){const r=res.rank,items=r.items,nR=Object.keys(state.ratings).length;
  const head=UI.pageHead({eyebrow:'Guia',title:'Para você',sub:esc(nR?`Com base nas suas respostas e em ${UI.plural(nR,'avaliação','avaliações')}.`:'Com base nas suas respostas.')});
  const low=r.lowSignal?`<div class="g-note"><p>Recomendações iniciais. Avalie 3 perfumes para mais precisão.</p>${UI.btn('Avaliar agora',{variant:'tertiary',href:'#refine/1',icon:'chevron-right'})}</div>`:'';
  const relax=r.relax.length?`<div class="g-relax">${UI.chips(r.relax.map(x=>({id:x.key,label:`${x.label} · +${UI.count(x.gain)}`})),'guide-relax',{label:'Afrouxar uma resposta'})}</div>`:'';
  if(!items.length)return `<section class="v-guide g-results" data-view="guide-results">${head}${this.summary()}<div class="g-empty">${UI.empty({icon:'filter',title:'Nada cumpre tudo',text:'Afrouxe uma resposta para ver opções.'})}${relax}</div></section>`;
  const rest=items.slice(1);
  const list=rest.length?UI.section({title:'Outras boas opções',body:`<ol class="g-list list-hair stagger">${rest.map((it,i)=>this.item(it,i)).join('')}</ol>`}):'';
  const more=items.length<3&&relax?UI.section({title:'Quer mais opções?',body:relax}):'';
  const top3=items.slice(0,3).map(x=>x.p.id).join(',');
  const acts=`<div class="g-final">${UI.btn('Salvar os 3 em Quero',{variant:'secondary',action:'guide-save',attrs:`data-ids="${esc(top3)}"`})}${UI.btn('Compartilhar resultado',{variant:'tertiary',action:'guide-share',icon:'share',attrs:`data-ids="${esc(top3)}"`})}</div>`;
  return `<section class="v-guide g-results" data-view="guide-results">${head}${this.summary()}${low}${this.hero(items[0])}${more}${list}${acts}</section>`;},
 giftResults(res){const u=res.who,nm=this.first(u),G=res.gift;
  const head=UI.pageHead({eyebrow:'Presente',title:u?`Para ${nm}`:'Para presentear',sub:u&&G.excluded?esc(`Deixamos de fora ${UI.plural(G.excluded,'perfume','perfumes')} que ${nm} já conhece.`):''});
  const low=G.lowSignal?`<div class="g-note"><p>Com pouca informação, priorizamos perfumes versáteis e bem avaliados.</p></div>`:'';
  const row=(x,i,bold)=>`<li class="g-gift" style="--i:${Math.min(i,8)}">${UI.row(x.p,{sub:esc(x.p.brand+' · '+Advisor.tierLabel(Advisor.tier(x.p)))})}
   <div class="g-gift-body"><p class="g-accept t-sm">${bold?'<span class="g-pill">Ousada</span>':''}<span>Chance de aceitação <b>${x.acceptance}%</b> · estimativa</span><span class="muted">${esc(UI.levelText(x.level,0))}</span></p>
   ${this.bullets(x.why)}${!bold&&i===0?`<div class="g-actions">${UI.btn('Ver perfume',{href:'#perfume/'+x.p.id,action:'perfume',attrs:`data-id="${esc(x.p.id)}"`,size:'sm'})}</div>`:''}</div></li>`;
  const safe=G.safe.length?UI.section({title:'Seguras',body:`<ol class="g-glist list-hair stagger">${G.safe.map((x,i)=>row(x,i,false)).join('')}</ol>`}):'';
  const bold=G.bold.length?UI.section({title:'Ousadas',body:`<ol class="g-glist list-hair stagger">${G.bold.map((x,i)=>row(x,i,true)).join('')}</ol>`}):'';
  const relax=res.rank.relax.length?`<div class="g-relax">${UI.chips(res.rank.relax.map(x=>({id:x.key,label:`${x.label} · +${UI.count(x.gain)}`})),'guide-relax',{label:'Afrouxar uma resposta'})}</div>`:'';
  if(!G.safe.length&&!G.bold.length)return `<section class="v-guide g-results" data-view="guide-results">${head}${this.summary()}<div class="g-empty">${UI.empty({icon:'gift',title:'Nada cumpre tudo',text:'Afrouxe uma resposta para ver opções.'})}${relax}</div></section>`;
  return `<section class="v-guide g-results" data-view="guide-results">${head}${this.summary()}${low}${safe}${bold}</section>`;},

 /* ---------- rota ---------- */
 view(id){id=id||'';
  if(id==='results')return this.results();
  const m=/^(me|gift)\/(\d+)$/.exec(id);
  if(m){const mode=m[1];let n=Math.max(0,Math.min(6,Number(m[2])));if(mode==='me'&&n<1)n=1;
   if(mode==='gift'&&n>0){const g=state.guide;if(!g||g.mode!=='gift'||!this.hasWho(g))n=0;}
   return this.step(mode,n);}
  return this.hub();},
 after(id){id=id||'';const m=/^(me|gift)\/(\d+)$/.exec(id);
  if(id==='results'&&!state.guide){setTimeout(()=>Router.go('guide','',{replace:true}),0);return;}
  if(m){const sec=document.querySelector('#main .v-guide.q');const want=sec?`${sec.dataset.mode}/${sec.dataset.n}`:id;if(want!==id)Router.replace('guide',want);
   const h=document.getElementById('q-title'),a=document.activeElement;if(h&&(!a||a===document.body||a.id==='main'))try{h.focus({preventScroll:true});}catch(e){}}},
 title(id){id=id||'';if(id==='results')return state.guide&&state.guide.mode==='gift'?'Presentes':'Resultados do Guia';if(/^(me|gift)\//.test(id))return 'Guia';return 'Guia';}
};

/* Setas do teclado escolhem sem avançar; Enter ou Espaço confirmam (auto-avanço). */
document.addEventListener('keydown',e=>{Guide.lastKey={k:e.key,t:performance.now()};},true);

Router.add('guide',{view:id=>Guide.view(id),title:id=>Guide.title(id),layout:id=>/^(me|gift)\//.test(id||'')?'full':id==='results'?'push':'tab',nav:'guide',after:id=>Guide.after(id)});

Actions.add({
 'guide-mode':el=>{const id=el.dataset.id;if(id===Guide.mode)return;Guide.mode=id;UI.segSet(el.closest('.seg'),id);const panel=document.getElementById('panel-guide-mode');
  if(panel){panel.setAttribute('aria-labelledby','tab-guide-mode-'+id);Motion.swap(panel,Guide.startBody(id),{dir:id==='gift'?1:-1});}},
 'guide-start':el=>{const mode=el.dataset.id==='gift'?'gift':'me';Guide.unknown=false;Guide.noteQuery='';Guide.open.clear();Store.update(s=>{s.guide=Guide.blank(mode);},{silent:true});Guide.go(mode,mode==='gift'?0:1);},
 'guide-resume':()=>{const g=state.guide;if(!g)return;Guide.go(g.mode,Guide.resumeStep(g));},
 'guide-results':()=>Router.go('guide','results'),
 'guide-back':()=>Router.back(['guide','']),
 'guide-close':()=>Router.go('guide'),
 'guide-pick':(el)=>{const sec=el.closest('.v-guide.q');if(!sec)return;const mode=sec.dataset.mode,n=Number(sec.dataset.n),k=el.dataset.k,v=el.dataset.v,Q=Guide.question(mode,n);if(!Q)return;
  const group=el.closest('.q-opts');
  if(Q.type==='multi'){const cur=state.guide.answers[k]||[];let next=cur.includes(v)?cur.filter(x=>x!==v):[...cur,v];if(next.length>(Q.max||9))next=next.slice(-(Q.max||9));
   Guide.save(g=>{g.answers[k]=next;});for(const b of group.querySelectorAll('[data-v]'))b.setAttribute('aria-checked',next.includes(b.dataset.v));return;}
  Guide.save(g=>{g.answers[k]=v;});for(const b of group.querySelectorAll('[data-v]')){const on=b.dataset.v===v;b.setAttribute('aria-checked',on);b.tabIndex=on?0:-1;}
  if(group.dataset.stay)return;
  const nav=/^(Arrow|Home|End)/.test(Guide.lastKey.k)&&performance.now()-Guide.lastKey.t<200;if(nav)return;
  const go=()=>{if(!document.body.contains(el))return;Guide.complete(n);Guide.go(mode,n+1);};
  if(Motion.reduced())go();else setTimeout(go,180);},
 'guide-next':el=>{const sec=el.closest('.v-guide.q');if(!sec)return;const mode=sec.dataset.mode,n=Number(el.dataset.n);
  if(mode==='gift'&&n===0&&!Guide.hasWho())return;Guide.complete(n);Guide.go(mode,n+1);},
 'guide-skip':el=>{const sec=el.closest('.v-guide.q');if(!sec)return;const mode=sec.dataset.mode,n=Number(el.dataset.n),Q=Guide.question(mode,n);
  if(Q)Guide.save(g=>{const a=g.answers;if(Q.k==='occasions'||Q.k==='avoidNotes')a[Q.k]=[];else if(Q.k==='families')a.families={};else a[Q.k]='';if(Q.k==='presence')a.allDay=false;});
  Guide.complete(n);Guide.go(mode,n+1);},
 'guide-fam':el=>{const id=el.dataset.id,cur=el.dataset.state||'',next=cur===''?'like':cur==='like'?'avoid':'';
  Guide.save(g=>{if(next)g.answers.families[id]=next;else delete g.answers.families[id];});
  const tmp=document.createElement('div');tmp.innerHTML=Guide.famChip(id,next);const nb=tmp.firstElementChild;el.replaceWith(nb);nb.focus();},
 'guide-note':el=>{const n=el.dataset.id;if(!n)return;const on=el.getAttribute('aria-pressed')==='true';
  Guide.save(g=>{const l=g.answers.avoidNotes.filter(x=>Catalog.norm(x)!==Catalog.norm(n));if(!on)l.push(n);g.answers.avoidNotes=l.slice(0,12);});
  if(!on){Guide.noteQuery='';const inp=document.querySelector('.v-guide [data-input=guide-note]');if(inp)inp.value='';}
  const box=document.getElementById('g-notes');if(box){box.innerHTML=Guide.noteChips();const same=[...box.querySelectorAll('[data-action=guide-note]')].find(b=>Catalog.norm(b.dataset.id)===Catalog.norm(n));(same||document.querySelector('.v-guide [data-input=guide-note]'))?.focus();}},
 'guide-who':el=>{Guide.unknown=false;const id=el.dataset.id;Guide.save(g=>{g.giftFor=id;g.giftStyles=[];g.answers.families={};g.answers.avoidNotes=[];g.step=0;});
  const sec=el.closest('.v-guide.q');const s=sec&&sec.querySelector('.q-styles');if(s)s.remove();
  for(const b of el.parentElement.querySelectorAll('[role=radio]')){const on=b===el;b.setAttribute('aria-checked',on);b.tabIndex=on?0:-1;}
  const btn=sec&&sec.querySelector('[data-action=guide-next]');if(btn)btn.disabled=false;},
 'guide-unknown':()=>{Guide.unknown=true;Guide.save(g=>{g.giftFor=null;g.answers.families={};g.answers.avoidNotes=[];g.step=0;});App.render();
  requestAnimationFrame(()=>{const b=document.querySelector('.v-guide [data-action=guide-unknown]');if(b)b.focus();});},
 'guide-style':el=>{const id=el.dataset.id;let list=[...(state.guide.giftStyles||[])];list=list.includes(id)?list.filter(x=>x!==id):[...list,id].slice(-3);
  Guide.save(g=>{g.giftStyles=list;g.giftFor=null;});for(const b of document.querySelectorAll('.v-guide [data-action=guide-style]'))b.setAttribute('aria-pressed',list.includes(b.dataset.id));
  const btn=document.querySelector('.v-guide [data-action=guide-next]');if(btn)btn.disabled=!list.length;},
 'guide-edit':el=>{const g=state.guide;if(!g)return;Router.go('guide',`${g.mode}/${Number(el.dataset.n)}`);},
 'guide-relax':el=>{const key=el.dataset.id;Guide.save(g=>{const a=Advisor.relaxAnswers(g.answers,key);g.answers={...g.answers,...a,families:a.families,avoidNotes:a.avoidNotes};});
  const sec=document.querySelector('#main .v-guide.g-results');if(sec&&!Motion.reduced()){const tmp=document.createElement('div');tmp.innerHTML=Guide.results();const nx=tmp.firstElementChild;Motion.swap(sec,nx?nx.innerHTML:'');}else App.render();},
 'guide-why':el=>{const id=el.dataset.id,box=document.getElementById(el.getAttribute('aria-controls'));if(!box)return;const open=el.getAttribute('aria-expanded')!=='true';
  el.setAttribute('aria-expanded',open);if(open){Guide.open.add(id);box.removeAttribute('inert');box.setAttribute('data-open','');Motion.after(box);}else{Guide.open.delete(id);box.removeAttribute('data-open');box.setAttribute('inert','');}},
 'guide-compare':el=>{if(typeof Compare!=='undefined'&&Compare.toggle)Compare.toggle(el.dataset.id);},
 'guide-save':el=>{const ids=(el.dataset.ids||'').split(',').filter(Boolean);if(!ids.length)return;const prev={};for(const id of ids)prev[id]=[state.shelf[id]||null,state.shelfAt[id]||0];
  const added=ids.filter(id=>!state.shelf[id]);if(!added.length){toast('Esses já estão na sua coleção.');return;}
  Store.update(s=>{for(const id of added){s.shelf[id]='want';s.shelfAt[id]=Date.now();}},{silent:true});
  toast(added.length===1?'1 perfume salvo em Quero':`${added.length} perfumes salvos em Quero`,{undo:()=>Store.update(s=>{for(const id of added){delete s.shelf[id];delete s.shelfAt[id];}},{silent:true})});},
 'guide-share':el=>{const ids=el.dataset.ids||'';if(typeof Compose!=='undefined'&&Compose.share){Compose.share('compare',ids);return;}
  const url=location.href.split('#')[0]+Router.href('compare',ids);try{navigator.clipboard.writeText(url).then(()=>toast('Link copiado'),()=>toast('Não foi possível copiar o link.'));}catch(e){toast('Não foi possível copiar o link.');}}
});
Actions.change('guide-allday',el=>{if(el.name!=='allDay')return;Guide.save(g=>{g.answers.allDay=!!el.checked;});});
Actions.input('guide-note',el=>{Guide.noteQuery=el.value.slice(0,40);const box=document.getElementById('g-notes');if(box)box.innerHTML=Guide.noteChips();});
