'use strict';
/* Mapa olfativo (intel, §4.13): rota `map`, a folha Corrigir mapa e os blocos que o perfil e a página de pessoa usam. */
const MapView={
 fixState:null,
 first(name){return String(name||'').trim().split(/\s+/)[0]||'';},
 lower(l){return typeof OMap!=='undefined'?OMap.lower(l):String(l).toLowerCase();},
 join(list){return list.length<2?(list[0]||''):list.slice(0,-1).join(', ')+' e '+list[list.length-1];},
 levelWord(level){return {'Dados insuficientes':'Dados insuficientes','Baixa':'Confiança baixa','Moderada':'Confiança moderada','Boa':'Confiança boa'}[level]||'Confiança baixa';},
 /* Frase honesta de confiança: nível + de onde vem. Nunca "Alta". */
 sentence(map){const e=map.evidence,parts=[];
  if(e.ratings)parts.push(UI.plural(e.ratings,'avaliação','avaliações'));
  if(e.have)parts.push(UI.plural(e.have,'perfume em Tenho','perfumes em Tenho'));
  if(e.feedback)parts.push(UI.plural(e.feedback,'resposta','respostas'));
  return `${this.levelWord(map.level)}${parts.length?' · a partir de '+this.join(parts):''}.`;},
 /* ---------- radial ---------- */
 radial(map,{size=240,labels=true}={}){if(!map)return '';
  const withData=map.axes.filter(a=>a.level!=='sem-dados');
  let axes=[...withData].sort((a,b)=>b.value-a.value||(a.id<b.id?-1:1)).slice(0,8);
  if(axes.length<3)axes=[...map.axes].filter(a=>a.family).slice(0,6);
  const order=MAP_AXES.map(a=>a.id);axes.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
  const pad=labels?64:12,W=size+pad*2,H=size+(labels?40:24),cx=W/2,cy=H/2,R=size/2-6,n=axes.length;
  const pt=(i,r)=>{const t=-Math.PI/2+i*2*Math.PI/n;return [cx+r*Math.cos(t),cy+r*Math.sin(t)];};
  const f=v=>v.toFixed(1);
  const rings=[.25,.5,.75,1].map(k=>`<circle class="mapv-ring" cx="${f(cx)}" cy="${f(cy)}" r="${f(R*k)}"/>`).join('');
  const spokes=axes.map((a,i)=>{const [x,y]=pt(i,R);return `<line class="mapv-spoke${a.level==='hipotese'?' hyp':''}" x1="${f(cx)}" y1="${f(cy)}" x2="${f(x)}" y2="${f(y)}"/>`;}).join('');
  const pts=axes.map((a,i)=>pt(i,Math.max(.06,a.value)*R));
  const d=pts.map((p,i)=>(i?'L':'M')+f(p[0])+' '+f(p[1])).join('')+'Z';
  const dots=axes.map((a,i)=>`<circle class="mapv-dot${a.level==='hipotese'?' hyp':''}" cx="${f(pts[i][0])}" cy="${f(pts[i][1])}" r="3"/>`).join('');
  const lbl=labels?axes.map((a,i)=>{const [x,y]=pt(i,R+14),anchor=Math.abs(x-cx)<4?'middle':x>cx?'start':'end';
   return `<text class="mapv-lbl" x="${f(x)}" y="${f(y+4)}" text-anchor="${anchor}">${esc(a.label==='Oriental/âmbar'?'Âmbar':a.label)}</text>`;}).join(''):'';
  const alt='Mapa olfativo: '+axes.map(a=>`${a.label} ${Math.round(a.value*100)}${a.level==='hipotese'?' (hipótese)':''}`).join(', ');
  return `<svg class="chart mapv-radial" viewBox="0 0 ${f(W)} ${f(H)}" role="img" aria-label="${esc(alt)}">${rings}${spokes}<path class="mapv-area" d="${d}"/><path class="line" data-draw d="${d}"/>${dots}${lbl}</svg>`;},
 primaryLabel(map){const p=map.primary;if(!p.length)return 'Em descoberta';return p.map((a,i)=>i?this.lower(a.label):a.label).join(' ');},
 /* ---------- blocos para o perfil e a página de pessoa ---------- */
 portraitCard(map,{own=true,big=false}={}){const sec=map.secondary.map(a=>a.label);
  const conf=Math.round(map.confidence*100);
  return `<article class="data-card mapv-card${big?' mapv-card--big':''}"><div class="mapv-chart">${this.radial(map)}</div>
   <div class="mapv-text"><p class="t-eyebrow muted">${map.primaryHyp?'Sua família, por enquanto':'Sua família'}</p><p class="t-display mapv-primary">${esc(this.primaryLabel(map))}</p>
    ${sec.length?`<p class="em">Secundárias: <b>${esc(sec.join(', '))}</b></p>`:''}
    <div class="mapv-conf">${UI.num(conf,'%')}<p class="t-sm muted">Confiança do mapa${map.primaryHyp?' · ainda hipótese':''}</p></div>
    <p class="t-sm muted">${esc(this.sentence(map))}</p></div></article>`;},
 combos(map){const c=map.combos;if(!c.liked.length&&!c.rejected.length&&!c.contrasts.length)return '';
  const chips=list=>`<div class="chips">${list.map(x=>`<span class="chip">${esc(x.a)} + ${esc(x.b.toLowerCase())}</span>`).join('')}</div>`;
  return `<div class="mapv-combos">${c.liked.length?`<div class="mapv-cgroup"><p class="t-sm muted">Funcionam para você</p>${chips(c.liked)}</div>`:''}
   ${c.rejected.length?`<div class="mapv-cgroup"><p class="t-sm muted">Você costuma recusar</p>${chips(c.rejected)}</div>`:''}
   ${c.contrasts.map(x=>`<p class="em">Você gosta de <b>${esc(x.note.toLowerCase())}</b>, mas não com ${esc(x.with.toLowerCase())}.</p>`).join('')}</div>`;},
 summary(map,{own=true,person=null}={}){
  if(!map)return '';
  if(own&&map.evidence.ratings<3)return `<div class="mapv">${UI.empty({icon:'compass',title:'Seu mapa aparece depois de 3 avaliações',text:'Avalie perfumes que você conhece. Com poucos dados, tudo é hipótese.',cta:{label:'Refinar meu mapa',href:'#refine/1'}})}</div>`;
  if(!own&&!map.axes.some(a=>a.level!=='sem-dados'))return '';
  const comp=map.axes.filter(a=>a.level==='comprovado'&&a.sign!=='evita').sort((a,b)=>b.value-a.value).slice(0,4);
  const hyp=map.axes.filter(a=>a.level==='hipotese'&&a.sign==='gosta').sort((a,b)=>b.value-a.value).slice(0,3);
  const bars=UI.axisBars([...comp,...hyp],{limit:7});
  return `<div class="mapv">${this.portraitCard(map,{own})}
   ${bars?`<article class="data-card mapv-bars"><p class="t-eyebrow muted">${comp.length?'Comprovado e hipóteses':'Hipóteses'}</p>${bars}${this.combos(map)}</article>`:''}
   ${own?`<div class="mapv-more">${UI.btn('Ver mapa completo',{href:'#map',variant:'tertiary',icon:'arrow'})}</div>`:''}</div>`;},
 mini(map){if(!map)return '';
  return `<div class="mapv mapv-mini"><div class="mapv-chart">${this.radial(map,{size:180})}</div><p class="t-eyebrow muted">Seu primeiro mapa</p><p class="t-h1">${esc(this.primaryLabel(map))}</p>
   <p class="t-sm muted">${esc(this.sentence(map))}</p></div>`;},
 compat(personId){if(typeof OMap==='undefined')return '';const map=Select.map();if(!map)return '';
  let c=null;try{c=OMap.compat(map,state.ratings,personId);}catch(e){console.warn(e);}if(!c)return '';
  const name=this.first(c.person.name);
  if(!c.person.shareMap)return `<div class="mapv mapv-compat"><p class="em">${esc(name)} não compartilha o Mapa. Usamos só os favoritos públicos.</p></div>`;
  const L=id=>{const a=MAP_AXES.find(x=>x.id===id);return a?a.label:id;};
  const agree=c.agree.map(L),dis=c.disagree.map(L);
  const head=c.enough?(agree.length?`Concordam em ${this.join(agree)}`:dis.length?`Gostos diferentes em ${this.join(dis)}`:'Gostos próximos, sem extremos'):'Poucos perfumes em comum para comparar.';
  const sub=c.enough&&agree.length&&dis.length?`<p class="em">Discordam em <b>${esc(this.join(dis))}</b></p>`:c.enough&&!agree.length&&!dis.length?`<p class="em">Nenhuma família separa ou une vocês com força ainda.</p>`:'';
  const rows=c.byAxis.slice(0,5).map(x=>({id:x.axis,label:x.label,value:x.you,them:x.them,level:'',
   text:`Você ${Math.round(x.you*100)} · ${name} ${x.them===null?'—':Math.round(x.them*100)} · ${x.estimate?'estimativa':UI.plural(x.n,'em comum','em comum')}`}));
  return `<div class="mapv mapv-compat">${c.enough?`<p class="t-h2">${esc(head)}</p>`:`<p class="em">${esc(head)}</p>`}${sub}
   ${UI.axisBars(rows,{limit:5})}<p class="mapv-legend t-sm muted"><span class="mapv-key"></span>Você <span class="mapv-key mapv-key--them"></span>${esc(name)}</p>
   <p class="t-sm muted">${c.enough?esc(UI.plural(c.common,'perfume avaliado pelos dois','perfumes avaliados pelos dois')):'Comparamos os mapas, não as avaliações: é uma estimativa.'}</p></div>`;},
 /* ---------- página ---------- */
 evidenceRows(map){const e=map.evidence,fb=Object.values(state.feedback),hits=fb.filter(f=>f.v===1).length;
  const rows=[['Avaliações',e.ratings],['Tenho',e.have],['Quero',e.want],['Esse sou eu',e.pinned],['Respostas “Acertou?”',e.feedback],['Fora da Bolha',e.bubble]];
  return `<ul class="mapv-evidence list-hair">${rows.map(([l,n])=>`<li><span>${esc(l)}</span><b>${esc(UI.count(n))}</b></li>`).join('')}</ul>
   ${fb.length>=3?`<p class="em mapv-quality">Recomendações que acertaram: <b>${hits} de ${fb.length}</b></p>`:''}
   <div class="list-hair">${UI.linkRow({icon:'info',title:'Como o algoritmo usa seus dados',sub:'Em poucas palavras, sem letras miúdas.',href:'#',attrs:'data-action="settings-algorithm"'})}</div>`;},
 trendCards(map){if(!map.trend.length)return '';
  const cards=map.trend.map(t=>`<article class="data-card mapv-trend"><p class="t-eyebrow muted">${esc(t.label)}</p><div class="mapv-trend-nums">${UI.num(Math.round(t.from*100),'',{w:2})}<span class="mapv-arrow" aria-hidden="true">${icon(t.delta>0?'arrow-up-right':'arrow','icon--20')}</span>${UI.num(Math.round(t.to*100),'',{w:2})}</div>
   <p class="t-sm muted"><span class="sr-only">de ${Math.round(t.from*100)} para ${Math.round(t.to*100)}, </span>${t.delta>0?'Você tem gostado mais':'Você tem gostado menos'}, comparando os últimos 60 dias com antes.</p></article>`).join('');
  let spark='';const p=map.primary[0];if(p&&typeof OMap!=='undefined'&&OMap.series){const s=OMap.series(Select.mapInput(),p.id);
   if(s.length>=2)spark=`<article class="data-card mapv-spark"><p class="t-eyebrow muted">${esc(p.label)} mês a mês</p>${UI.spark(s.map(x=>Math.round(x.value*100)),{label:`${p.label}: de ${Math.round(s[0].value*100)} em ${UI.date(s[0].month+'-01','month-year')} para ${Math.round(s[s.length-1].value*100)} em ${UI.date(s[s.length-1].month+'-01','month-year')}`})}</article>`;}
  return UI.section({eyebrow:'Tendência',title:'Como seu gosto mudou',body:`<div class="mapv-grid">${cards}${spark}</div>`});},
 body(map){const ratings=map.evidence.ratings;
  const comp=map.axes.filter(a=>a.level==='comprovado'&&a.sign!=='evita').sort((a,b)=>b.value-a.value);
  const hyp=map.axes.filter(a=>a.level==='hipotese'&&a.sign!=='evita').sort((a,b)=>Math.abs(b.value-.5)-Math.abs(a.value-.5)||(a.id<b.id?-1:1)).slice(0,8);
  const avoid=map.axes.filter(a=>a.sign==='evita'&&a.level!=='sem-dados').sort((a,b)=>a.value-b.value).slice(0,3);
  const cta=map.level!=='Boa'?`<div class="mapv-cta"><p class="em">Cada avaliação deixa o mapa mais preciso.</p>${UI.btn('Avaliar mais perfumes',{href:'#refine/1',size:'sm'})}</div>`:'';
  return [this.portraitCard(map,{big:true}),cta,
   comp.length?UI.section({eyebrow:'Comprovado',title:'O que seus perfumes mostram',body:UI.axisBars(comp,{limit:12,action:'map-fix'})}):'',
   hyp.length?UI.section({eyebrow:'Hipóteses',title:'Ainda em teste',body:`<p class="em mapv-note">Ainda não temos dados suficientes para afirmar. Cada avaliação ajuda.</p>${UI.axisBars(hyp,{limit:8,action:'map-fix'})}`}):'',
   avoid.length?UI.section({eyebrow:'Evita',title:'O que você evita',body:UI.axisBars(avoid,{limit:3,action:'map-fix'})}):'',
   this.combos(map)?UI.section({eyebrow:'Combinações',title:'Nota isolada não é combinação',body:this.combos(map)}):'',
   this.trendCards(map),
   UI.section({eyebrow:'Evidências',title:'De onde vem',body:this.evidenceRows(map)})].join('')+(ratings<3?'':'');},
 view(){const map=Select.map();
  if(!map)return `<section class="v-map" data-view="map">${UI.pageHead({eyebrow:'Perfil',title:'Seu mapa olfativo'})}${UI.empty({icon:'compass',title:'O mapa não carregou',text:'Tente abrir esta tela de novo.',cta:{label:'Ir para o perfil',href:'#profile'}})}</section>`;
  if(map.total===0)return `<section class="v-map" data-view="map">${UI.pageHead({eyebrow:'Perfil',title:'Seu mapa olfativo'})}${UI.empty({icon:'compass',title:'Seu mapa aparece depois de 3 avaliações',text:'Avalie perfumes que você já conhece. Leva menos de um minuto.',cta:{label:'Refinar meu mapa',href:'#refine/1'}})}</section>`;
  const sub=map.evidence.ratings<3?'Com poucos dados, tudo aqui é hipótese.':this.sentence(map);
  return `<section class="v-map" data-view="map">${UI.pageHead({eyebrow:'Perfil',title:'Seu mapa olfativo',sub:esc(sub)})}<div id="panel-map" class="mapv-page">${this.body(map)}</div></section>`;},
 /* Uma foto por mês (silenciosa), para o histórico do mapa. */
 snapshot(){const map=Select.map();if(!map||!map.primary.length)return;const d=new Date(),month=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  const top=[...map.primary,...map.secondary].slice(0,3).map(a=>a.id),cur=state.map.snapshots.find(s=>s.month===month);
  if(cur&&cur.n===map.evidence.ratings&&JSON.stringify(cur.top)===JSON.stringify(top))return;
  Store.update(s=>{s.map.snapshots=[{month,top,n:map.evidence.ratings},...s.map.snapshots.filter(x=>x.month!==month)].slice(0,12);},{silent:true});},
 /* ---------- Corrigir mapa ---------- */
 sources(map,axisId){const i=OMap.index(axisId),st=map.st,R=st.ratings||{},out=[];
  for(const id of Object.keys(R)){const p=byId(id);if(p)out.push({p,c:Math.abs(OMap.ratingSignal(R[id])*OMap.axesOf(p)[i]),label:UI.ratingLabel(R[id])});}
  for(const id of st.pinned||[]){const p=byId(id);if(p&&R[p.id]===undefined)out.push({p,c:.8*OMap.axesOf(p)[i],label:'Esse sou eu'});}
  for(const [id,s] of Object.entries(st.shelf||{})){const p=byId(id);if(p&&R[p.id]===undefined&&s==='have'&&!(st.pinned||[]).includes(p.id))out.push({p,c:.35*OMap.axesOf(p)[i],label:'Tenho'});}
  return out.filter(x=>x.c>=.12).sort((a,b)=>b.c-a.c||(a.p.id<b.p.id?-1:1)).slice(0,4);},
 fixBody(axisId){const map=Select.map(),a=map&&map.axes.find(x=>x.id===axisId);if(!a)return '';
  const has=!!state.map.corrections[axisId],ch=this.fixState?this.fixState.v:null,l=this.lower(a.label);
  const says=a.sign==='gosta'?`você gosta de ${l}`:a.sign==='evita'?`você evita ${l}`:`${l} é neutro para você`;
  const src=this.sources(map,axisId);
  const opt=(v,label,sub)=>`<button type="button" role="radio" class="mf-opt pressable" aria-checked="${ch===v}" tabindex="${ch===v||ch===null&&v===-1?0:-1}" data-action="map-fix-pick" data-v="${v}"><b>${esc(label)}</b><span>${esc(sub)}</span></button>`;
  return `<p class="mf-now">Hoje o mapa diz: <b>${esc(says)}</b> · ${esc(OMap.levelText(a).toLowerCase())}</p>
   ${src.length?`<div class="mf-src"><p class="t-eyebrow muted">Vem de</p><div class="list-hair">${src.map(x=>UI.row(x.p,{trail:`<span class="t-sm muted">${esc(x.label)}</span>`})).join('')}</div></div>`:''}
   <div class="mf-opts" role="radiogroup" aria-label="Sua correção">${opt(-1,'Isso não sou eu','O mapa passa a tratar como algo que você evita.')}${opt(1,'Gosto mais disso do que parece','O mapa passa a tratar como algo de que você gosta.')}${has?opt(0,'Remover correção','Volta a valer só o que os seus perfumes mostram.'):''}</div>
   <div class="sheet-foot mf-foot">${UI.btn('Salvar correção',{action:'map-fix-save',size:'block',attrs:ch===null?'disabled':''})}</div>`;},
 fix(axisId){const a=MAP_AXES.find(x=>x.id===axisId);if(!a)return;this.fixState={axis:axisId,v:null};
  Sheet.open({title:a.label,body:this.fixBody(axisId),cls:'sh-map-fix'});},
 refresh(){if(route.page==='map'){const el=document.getElementById('panel-map');if(el){Motion.swap(el,this.body(Select.map()));return;}}App.render();}
};

Actions.add({
 'map-fix':el=>MapView.fix(el.dataset.id),
 'map-fix-pick':el=>{if(!MapView.fixState)return;MapView.fixState.v=Number(el.dataset.v);const g=el.closest('[role=radiogroup]');
  g.querySelectorAll('[role=radio]').forEach(b=>{const on=b===el;b.setAttribute('aria-checked',on);b.tabIndex=on?0:-1;});
  const s=document.querySelector('#sheet [data-action="map-fix-save"]');if(s)s.disabled=false;},
 'map-fix-save':()=>{const f=MapView.fixState;if(!f||f.v===null)return;const axis=f.axis,prev=state.map.corrections[axis]?{...state.map.corrections[axis]}:null;
  const apply=c=>{Store.update(s=>{if(c)s.map.corrections[axis]=c;else delete s.map.corrections[axis];},{silent:true});};
  apply(f.v===0?null:{v:f.v,at:Date.now()});MapView.fixState=null;
  Sheet.close().then(()=>MapView.refresh());
  toast(f.v===0?'Correção removida':'Mapa corrigido',{undo:()=>{apply(prev);MapView.refresh();}});}
});

Router.add('map',{view:()=>MapView.view(),title:'Mapa olfativo',layout:'push',nav:'profile',after:()=>{try{MapView.snapshot();}catch(e){console.warn(e);}}});
