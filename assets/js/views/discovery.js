'use strict';
/* Boas-vindas (welcome/1–4, done; REQ §1) e Refinar meu mapa (refine/1–5). Respostas salvas em silêncio a cada toque. */
const Discovery={
 RATE:[['Amo',8],['Gosto',6],['Neutro',4],['Detesto',2]],
 OCC:['Dia a dia','Trabalho','Noite','Encontro','Festa','Evento','Ar livre'],
 sel:null,           /* escolhas do passo 2 (espelho de state.welcome.picked, que zera depois do onboarding) */

 /* ---------- boas-vindas ---------- */
 picked(){if(!this.sel)this.sel=[...(state.welcome.picked||[])];this.sel=this.sel.filter(id=>byId(id));return this.sel;},
 setPicked(list){this.sel=[...new Set(list)].slice(0,12);const ids=this.sel;Store.update(s=>{s.welcome.picked=ids;},{silent:true});},
 nearest(v){if(v===undefined||v===null)return null;const n=Number(v);return n>=7?8:n>=5?6:n>=3?4:2;},
 top(step,{back=true,skip=true}={}){return Guide.chrome({back:back?'welcome-back':'',end:skip?UI.btn('Pular',{variant:'tertiary',action:'welcome-skip'}):'',step:step-1,total:4});},
 s1(){const now=new Date();
  return `<section class="v-welcome v-guide" data-view="welcome" data-step="1"><div class="w-hero full">${UI.cover({image:'night',eyebrow:[UI.date(now,'month-year'),'Elixir','Rede olfativa'],title:'ELIXIR',mega:true,text:'Perfumes, pessoas e o seu mapa olfativo.',eager:true,ratio:'3/4'})}</div>
   <div class="w-start"><p class="t-h2">Comece pelo que você já conhece.</p><p class="muted">Três perfumes e um minuto. O resto é opcional.</p>
   <div class="w-actions">${UI.btn('Começar',{size:'block',action:'welcome-go',attrs:'data-n="2"'})}${UI.btn('Explorar primeiro',{variant:'tertiary',action:'welcome-explore'})}</div></div></section>`;},
 pickTile(p,on){return `<button type="button" class="w-pick pressable" aria-pressed="${on}" data-action="welcome-pick" data-id="${esc(p.id)}">${UI.photo(p)}<span class="w-check" aria-hidden="true">${icon('check','icon--20')}</span><span class="name">${esc(p.name)}</span><span class="brand">${esc(p.brand)}</span></button>`;},
 countText(n){return n<3?`${n} de 3`:`${UI.plural(n,'escolhido','escolhidos')}`;},
 s2(){const sel=this.picked(),base=Catalog.trending(12),extra=sel.map(id=>byId(id)).filter(p=>p&&!base.some(b=>b.id===p.id));
  const list=[...base,...extra];
  const find=typeof Search!=='undefined'&&Search.pick?`<button type="button" class="input w-find pressable" data-action="welcome-find">${icon('search','icon--20')}<span>Buscar outro perfume</span></button>`:'';
  return `<section class="v-welcome v-guide" data-view="welcome" data-step="2">${this.top(2)}<h1 class="t-display q-title" id="q-title" tabindex="-1">Quais destes você conhece?</h1>
   <p class="q-sub muted">Escolha pelo menos 3. Pode ser de experimentar em loja.</p>
   <div class="w-grid stagger" role="group" aria-labelledby="q-title">${list.map((p,i)=>this.pickTile(p,sel.includes(p.id)).replace('class="w-pick',`style="--i:${Math.min(i,8)}" class="w-pick`)).join('')}</div>${find}
   <div class="q-foot w-foot"><p class="w-count" aria-live="polite">${this.countText(sel.length)}</p>${UI.btn('Continuar',{action:'welcome-go',attrs:`data-n="3"${sel.length<3?' disabled':''}`})}</div></section>`;},
 scale(p){const cur=this.nearest(state.ratings[p.id]),i=this.RATE.findIndex(r=>r[1]===cur);
  return `<div class="seg seg--quiet seg--block w-scale${i<0?' seg--none':''}" role="radiogroup" aria-label="Como você se sente com ${esc(p.name)}" style="--n:4;--i:${Math.max(0,i)}">${this.RATE.map(([l,v],k)=>`<button type="button" role="radio" aria-checked="${k===i}" tabindex="${k===i||i<0&&k===0?0:-1}" data-action="welcome-rate" data-p="${esc(p.id)}" data-id="${v}">${esc(l)}</button>`).join('')}</div>`;},
 rateRow(p,i,scale){return `<li class="w-row" style="--i:${Math.min(i,8)}"><div class="w-info"><span class="thumb plate">${p.image?`<img src="${esc(p.image)}" alt="" loading="lazy" decoding="async" data-brand="${esc(p.brand)}" data-name="${esc(p.name)}">`:''}</span><span class="grow"><b>${esc(p.name)}</b><span class="muted t-sm">${esc(p.brand)}</span></span></div>${scale}</li>`;},
 allRated(){const sel=this.picked();return sel.length>0&&sel.every(id=>state.ratings[id]!==undefined);},
 s3(){const sel=this.picked();if(sel.length<3)return null;
  return `<section class="v-welcome v-guide" data-view="welcome" data-step="3">${this.top(3)}<h1 class="t-display q-title" id="q-title" tabindex="-1">Como você se sente com cada um?</h1>
   <p class="q-sub muted">Uma resposta por perfume. Dá para mudar depois.</p>
   <ol class="w-rate list-hair stagger">${sel.map((id,i)=>{const p=byId(id);return this.rateRow(p,i,this.scale(p));}).join('')}</ol>
   <div class="q-foot">${UI.btn('Continuar',{size:'block',action:'welcome-go',attrs:`data-n="4"${this.allRated()?'':' disabled'}`})}</div></section>`;},
 seg(items,value,action,label){const i=items.indexOf(value);
  return `<div class="seg seg--quiet seg--block w-seg${i<0?' seg--none':''}" role="radiogroup" aria-label="${esc(label)}" style="--n:${items.length};--i:${Math.max(0,i)}">${items.map((x,k)=>`<button type="button" role="radio" aria-checked="${k===i}" tabindex="${k===i||i<0&&k===0?0:-1}" data-action="${action}" data-id="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;},
 s4(){const P=state.preferences,pri=state.map.priors||{};
  const occ=`<div class="chips" role="group" aria-label="Ocasiões">${this.OCC.map(o=>{const on=P.occasions.includes(o);return `<button type="button" class="chip pressable" aria-pressed="${on}" data-action="welcome-occ" data-id="${esc(o)}">${on?icon('check','icon--20'):''}${esc(o)}</button>`;}).join('')}</div>`;
  return `<section class="v-welcome v-guide" data-view="welcome" data-step="4">${this.top(4,{skip:false})}<h1 class="t-display q-title" id="q-title" tabindex="-1">Quer contar mais?</h1>
   <p class="q-sub muted">Tudo aqui é opcional. Vira hipótese no seu mapa, nunca certeza.</p>
   <div class="w-groups">
    <div class="w-group"><p class="t-eyebrow muted">Famílias</p><p class="t-sm muted">Um toque para gosto, dois para evito.</p><div id="w-fams">${Guide.famChips(pri,'welcome-fam')}</div></div>
    <div class="w-group"><p class="t-eyebrow muted">Ocasiões</p><p class="t-sm muted">Até três.</p>${occ}</div>
    <div class="w-group"><p class="t-eyebrow muted">Clima onde você vive</p>${this.seg(['Calor','Meia-estação','Frio'],P.climate,'welcome-climate','Clima onde você vive')}</div>
    <div class="w-group"><p class="t-eyebrow muted">Intensidade</p>${this.seg(['Discreta','Equilibrada','Marcante'],P.intensity,'welcome-intensity','Intensidade')}</div>
   </div>
   <div class="q-foot w-foot2">${UI.btn('Ver meu mapa',{size:'block',action:'welcome-go',attrs:'data-n="done"'})}${UI.btn('Pular',{variant:'tertiary',action:'welcome-skip'})}</div></section>`;},
 /* Primeiro mapa: OMap quando o intel estiver carregado; senão a mesma leitura feita aqui (hipóteses com poucos dados). */
 firstMap(){const n=Object.keys(state.ratings).length,priors=state.map.priors||{};let axes=[],level='';
  const map=typeof OMap!=='undefined'?Select.map():null;
  if(map&&Array.isArray(map.axes)){axes=map.axes.filter(a=>a&&a.level!=='sem-dados'&&(a.family!==false)).map(a=>({...a,label:Advisor.famLabel(a.id)!==a.id?Advisor.famLabel(a.id):a.label}));level=map.level||'';
   axes.sort((a,b)=>(b.value-.5)-(a.value-.5)||String(a.id).localeCompare(String(b.id)));}
  else{const pa=Advisor.personAxes(state.ratings),rated=Object.keys(state.ratings).map(id=>byId(id)).filter(Boolean);
   axes=pa.map(x=>{const cnt=rated.filter(p=>(Advisor.axes(p)[x.id]||0)>=.3).length,pr=priors[x.id];let v=x.value;if(pr==='like')v=Math.max(v,.62);if(pr==='avoid')v=Math.min(v,.3);
    return {id:x.id,label:Advisor.famLabel(x.id),value:v,n:cnt,nh:pr?1:0,level:cnt>=3&&n>=3&&Math.abs(v-.5)>=.12?'comprovado':cnt||pr?'hipotese':'sem-dados'};})
    .filter(a=>a.level!=='sem-dados').sort((a,b)=>b.value-a.value||a.id.localeCompare(b.id));}
  const liked=axes.filter(a=>a.value>.55);const primary=n||Object.keys(priors).length?(liked[0]||axes[0]):null;
  const conf=/moderada|boa/i.test(level)?level.toLowerCase():'baixa';
  return {primary,axes:axes.slice(0,3),n,conf};},
 done(){const m=this.firstMap();
  const line=m.n?`Confiança inicial: ${m.conf} · ${UI.plural(m.n,'avaliação','avaliações')}. O mapa melhora a cada avaliação.`:'Avalie 3 perfumes para o mapa aparecer.';
  return `<section class="v-welcome v-guide" data-view="welcome" data-step="done">${Guide.chrome({step:4,total:4})}<div class="w-done">
   <p class="t-eyebrow muted">Seu primeiro mapa</p><h1 class="t-display q-title w-axis" id="q-title" tabindex="-1">${esc(m.primary?m.primary.label:'Ainda sem dados')}</h1>
   ${m.axes.length?`<div class="w-bars">${UI.axisBars(m.axes,{limit:3})}</div>`:''}<p class="w-conf">${esc(line)}</p></div>
   <div class="q-foot">${UI.btn('Entrar',{size:'block',action:'welcome-enter'})}</div></section>`;},
 welcome(id){const step=String(id||'1');
  if(step==='done')return this.done();
  if(step==='2')return this.s2();
  if(step==='3')return this.s3()||this.s2();
  if(step==='4')return this.s4();
  return this.s1();},
 finish(){this.sel=null;Store.update(s=>{s.onboarded=true;s.welcome.picked=[];},{silent:true});Router.go('home','',{replace:true});},

 /* ---------- refinar assinatura ---------- */
 STEPS:[{title:'Frescos',sub:'Cítricos, aquáticos e aromáticos.',axes:['citrico','aquatico','aromatico','verde']},
  {title:'Amadeirados',sub:'Madeiras, incenso e couro.',axes:['amadeirado','incensado','couro']},
  {title:'Florais',sub:'Flores, frutas e almíscar.',axes:['floral','frutado','almiscarado']},
  {title:'Doces e ambarados',sub:'Baunilha, âmbar e especiarias.',axes:['gourmand','ambar','especiado']},
  {title:'Para fechar',sub:'Alguns muito conhecidos, de famílias variadas.',axes:null}],
 refineItems(n){const S=this.STEPS[n-1];if(!S)return [];const tr=Catalog.trending(80),idx=new Map(tr.map((p,i)=>[p.id,i]));
  const taken=new Set();for(let k=1;k<n;k++)for(const p of this.refinePick(k,idx,taken))taken.add(p.id);
  return this.refinePick(n,idx,taken);},
 refinePick(n,idx,taken){const S=this.STEPS[n-1];
  const score=p=>{const a=Advisor.axes(p),s=S.axes?Math.max(...S.axes.map(k=>a[k]||0)):.6,t=idx.has(p.id)?(80-idx.get(p.id))/80*.6:0;return (S.axes&&s<.55?-9:s)+t+(p.image?.35:0)+(state.ratings[p.id]===undefined?.25:0);};
  const out=[],brands=new Set();for(const p of PERFUMES.filter(p=>p.vector&&!taken.has(p.id)).map(p=>[score(p),p]).sort((a,b)=>b[0]-a[0]||a[1].id.localeCompare(b[1].id)).map(x=>x[1])){
   if(brands.has(p.brand))continue;brands.add(p.brand);out.push(p);if(out.length>=4)break;}return out;},
 refine(id){let n=Math.max(1,Math.min(5,Number(id)||1));const S=this.STEPS[n-1],items=this.refineItems(n);
  const top=Guide.chrome({back:n>1?'refine-back':'',end:UI.iconBtn('close',{action:'refine-close',label:'Fechar'}),step:n,total:5,eyebrow:`${n} de 5 · ${S.title}`});
  const rows=items.map((p,i)=>this.rateRow(p,i,`<div class="w-rs" data-p="${esc(p.id)}">${UI.ratingScale(state.ratings[p.id],'refine-rate')}</div>`)).join('');
  return `<section class="v-welcome v-guide" data-view="refine" data-step="${n}">${top}<h1 class="t-display q-title" id="q-title" tabindex="-1">Já sentiu algum destes?</h1>
   <p class="q-sub muted">${esc(S.sub)} Avalie os que você conhece e pule os outros.</p>
   <ol class="w-rate list-hair stagger">${rows}</ol>
   <div class="q-foot">${UI.btn(n<5?'Continuar':'Concluir',{size:'block',action:'refine-next',attrs:`data-n="${n}"`})}</div></section>`;},
 focus(){const h=document.getElementById('q-title'),a=document.activeElement;if(h&&(!a||a===document.body||a.id==='main'))try{h.focus({preventScroll:true});}catch(e){}}
};

Router.add('welcome',{view:id=>Discovery.welcome(id),title:'Boas-vindas',layout:'full',nav:'none',after:id=>{
 const step=String(id||'1');if(step==='3'&&Discovery.picked().length<3)Router.replace('welcome','2');else if(!['1','2','3','4','done'].includes(step))Router.replace('welcome','1');
 if(step!=='1')Discovery.focus();}});
Router.add('refine',{view:id=>Discovery.refine(id),title:'Refinar meu mapa',layout:'full',nav:'profile',after:id=>{if(String(id)!==String(Math.max(1,Math.min(5,Number(id)||1))))Router.replace('refine',String(Math.max(1,Math.min(5,Number(id)||1))));Discovery.focus();}});

Actions.add({
 'welcome-go':el=>{const n=el.dataset.n;if(n==='3'&&Discovery.picked().length<3)return;if(n==='4'&&!Discovery.allRated())return;Router.go('welcome',n);},
 'welcome-back':()=>Router.back(['welcome','1']),
 'welcome-skip':()=>Router.go('welcome','done'),
 'welcome-explore':()=>Discovery.finish(),
 'welcome-enter':()=>{Discovery.finish();},
 'welcome-pick':el=>{const id=el.dataset.id,cur=Discovery.picked(),on=!cur.includes(id);Discovery.setPicked(on?[...cur,id]:cur.filter(x=>x!==id));el.setAttribute('aria-pressed',on);
  const n=Discovery.picked().length,c=document.querySelector('.v-welcome .w-count'),b=document.querySelector('.v-welcome [data-action=welcome-go][data-n="3"]');if(c)c.textContent=Discovery.countText(n);if(b)b.disabled=n<3;},
 'welcome-find':()=>{if(typeof Search==='undefined'||!Search.pick)return;Search.pick({title:'Buscar perfume',exclude:Discovery.picked(),onPick:id=>{const p=byId(id);if(!p)return;Discovery.setPicked([...Discovery.picked(),p.id]);
  const grid=document.querySelector('.v-welcome .w-grid');if(grid&&!grid.querySelector(`[data-id="${CSS.escape(p.id)}"]`)){grid.insertAdjacentHTML('beforeend',Discovery.pickTile(p,true));Motion.after(grid);}
  else if(grid){const t=grid.querySelector(`[data-id="${CSS.escape(p.id)}"]`);if(t)t.setAttribute('aria-pressed','true');}
  const n=Discovery.picked().length,c=document.querySelector('.v-welcome .w-count'),b=document.querySelector('.v-welcome [data-action=welcome-go][data-n="3"]');if(c)c.textContent=Discovery.countText(n);if(b)b.disabled=n<3;}});},
 'welcome-rate':el=>{const id=el.dataset.p,v=Number(el.dataset.id);if(!byId(id)||![2,4,6,8].includes(v))return;Store.update(s=>{s.ratings[id]=v;s.ratedAt[id]=Date.now();},{silent:true});
  UI.segSet(el.closest('.seg'),String(v));const b=document.querySelector('.v-welcome [data-action=welcome-go][data-n="4"]');if(b)b.disabled=!Discovery.allRated();},
 'welcome-fam':el=>{const id=el.dataset.id,cur=el.dataset.state||'',next=cur===''?'like':cur==='like'?'avoid':'';
  Store.update(s=>{if(next)s.map.priors[id]=next;else delete s.map.priors[id];},{silent:true});
  const tmp=document.createElement('div');tmp.innerHTML=Guide.famChip(id,next,'welcome-fam');const nb=tmp.firstElementChild;el.replaceWith(nb);nb.focus();},
 'welcome-occ':el=>{const id=el.dataset.id;let list=[...state.preferences.occasions];const on=!list.includes(id);list=on?[...list,id].slice(-3):list.filter(x=>x!==id);
  Store.update(s=>{s.preferences.occasions=list;},{silent:true});
  for(const b of el.parentElement.querySelectorAll('[data-action=welcome-occ]')){const x=list.includes(b.dataset.id);b.setAttribute('aria-pressed',x);b.innerHTML=(x?icon('check','icon--20'):'')+esc(b.dataset.id);}},
 'welcome-climate':el=>{const v=state.preferences.climate===el.dataset.id&&!/^(Arrow|Home|End)/.test(Guide.lastKey.k)?'':el.dataset.id;Store.update(s=>{s.preferences.climate=v;},{silent:true});UI.segSet(el.closest('.seg'),v);},
 'welcome-intensity':el=>{const v=state.preferences.intensity===el.dataset.id&&!/^(Arrow|Home|End)/.test(Guide.lastKey.k)?'':el.dataset.id;Store.update(s=>{s.preferences.intensity=v;},{silent:true});UI.segSet(el.closest('.seg'),v);},
 'refine-back':()=>Router.back(['profile','']),
 'refine-close':()=>Router.go('profile'),
 'refine-rate':el=>{const box=el.closest('[data-p]'),id=box&&box.dataset.p,v=Number(el.dataset.v);if(!id||!byId(id)||!Number.isFinite(v))return;
  const same=state.ratings[id]===v&&!/^(Arrow|Home|End)/.test(Guide.lastKey.k);
  Store.update(s=>{if(same){delete s.ratings[id];delete s.ratedAt[id];}else{s.ratings[id]=v;s.ratedAt[id]=Date.now();if(!s.shelf[id]){s.shelf[id]='tried';s.shelfAt[id]=Date.now();}}},{silent:true});
  UI.segSet(el.closest('.seg'),same?'':String(v));},
 'refine-next':el=>{const n=Number(el.dataset.n)||1;if(n<5){Router.go('refine',String(n+1));return;}
  Store.update(s=>{s.preferences.completedDiscovery=true;},{silent:true});if(typeof Profile!=='undefined')try{Profile.tab='dna';}catch(e){}
  Router.go('profile','',{replace:true});toast('Seu mapa foi atualizado.');}
});
