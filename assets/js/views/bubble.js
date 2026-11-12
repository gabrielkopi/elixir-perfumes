'use strict';
/* Fora da Bolha (intel, REQ §4): fora das famílias favoritas, com uma ponte para o que a pessoa já gosta. Experimental. */
const Bubble={
 MODES:[{id:'seguro',label:'Seguro'},{id:'equilibrio',label:'Equilíbrio'},{id:'ousado',label:'Ousado'}],
 hidden:new Set(),
 items(mode=state.bubble.mode){return Select.memo('bubble:'+mode,()=>{const map=Select.map();if(!map||typeof OMap==='undefined')return [];
  try{return OMap.bubble(map,Select.mapInput(),{n:6,mode});}catch(e){console.warn(e);return [];}});},
 ready(){const map=Select.map();return !!(map&&map.primary.length&&!map.primaryHyp&&map.evidence.ratings>=3);},
 card(x,i){const p=x.p;
  return `<article class="bb-card" data-bubble="${esc(p.id)}" style="--i:${i}">
   <a class="bb-plate" href="#perfume/${esc(p.id)}" data-action="perfume" data-id="${esc(p.id)}" aria-label="${esc(p.brand+' '+p.name)}">${UI.photo(p)}</a>
   <div class="bb-body"><p class="bb-brand">${esc(p.brand)}</p><h3 class="t-h3"><a href="#perfume/${esc(p.id)}" data-action="perfume" data-id="${esc(p.id)}">${esc(p.name)}</a></h3>
    <p class="bb-family t-sm muted">${esc(x.family.label)}</p>
    <p class="em">Ponte: ${x.bridge.note?`<b>${esc(x.bridge.note.toLowerCase())}</b> leva ao ${esc(OMap.lower(x.bridge.label))} que você gosta.`:`o ${esc(OMap.lower(x.bridge.label))} que você gosta.`}</p>
    <p class="t-sm muted">${esc(x.surprise)}</p>
    ${UI.why({...x.explain,line:''},{compact:false})}
    <div class="bb-actions">${UI.btn('Quero provar',{action:'bubble-yes',variant:'secondary',size:'sm',attrs:`data-id="${esc(p.id)}"`})}${UI.btn('Não é pra mim',{action:'bubble-no',variant:'tertiary',attrs:`data-id="${esc(p.id)}"`})}</div></div></article>`;},
 list(mode=state.bubble.mode){
  if(!this.ready())return UI.empty({icon:'compass',title:'Primeiro precisamos conhecer a sua bolha',text:'Avalie pelo menos 3 perfumes que você conhece. Depois mostramos o que fica fora dela.',cta:{label:'Refinar meu mapa',href:'#refine/1'}});
  const items=this.items(mode).filter(x=>!this.hidden.has(x.p.id));
  if(!items.length)return UI.empty({icon:'compass',title:'Você já viu tudo o que encontramos por enquanto',text:'Avalie mais perfumes e voltamos com novas pontes.',cta:mode==='ousado'?null:{label:'Tentar o modo Ousado',action:'bubble-mode',attrs:'data-id="ousado"'}});
  return `<div class="bb-list list-hair stagger">${items.map((x,i)=>this.card(x,i)).join('')}</div>`;},
 footer(){const seen=Object.values(state.bubble.seen),yes=seen.filter(x=>x.v===1).length,no=seen.length-yes;
  return `<footer class="bb-foot">${seen.length?`<p class="em">Você aceitou <b>${yes}</b> e recusou <b>${no}</b> ${seen.length===1?'sugestão':'sugestões'} daqui.</p>`:''}
   <div class="list-hair">${UI.linkRow({icon:'info',title:'Como escolhemos',sub:'Novidade e segurança em equilíbrio, sem patrocínio.',href:'#',attrs:'data-action="settings-algorithm"'})}</div></footer>`;},
 view(){const mode=state.bubble.mode;this.hidden.clear();
  const seg=this.ready()?`<div class="bb-seg">${UI.seg(this.MODES,mode,'bubble-mode',{name:'bubble',label:'Quanto arriscar',block:true})}</div>`:'';
  return `<section class="v-bubble" data-view="bubble">${UI.pageHead({eyebrow:'Experimental',title:'Fora da Bolha',sub:'Perfumes fora das suas famílias favoritas, com uma ponte para o que você já gosta.'})}
   ${seg}<div id="panel-bubble" ${seg?'role="tabpanel" aria-labelledby="tab-bubble-'+esc(mode)+'"':''} class="bb-panel">${this.list(mode)}</div>${this.ready()?this.footer():''}</section>`;},
 /* O cartão sai com opacidade e transform; o próximo da lista ocupa o lugar. A lista só reordena na próxima visita. */
 leave(id){const el=document.querySelector(`[data-bubble="${CSS.escape(id)}"]`);this.hidden.add(id);
  const next=()=>{const panel=document.getElementById('panel-bubble');if(!panel)return;
   const visible=new Set([...panel.querySelectorAll('[data-bubble]')].map(x=>x.dataset.bubble));
   const fresh=this.items().filter(x=>!this.hidden.has(x.p.id)&&!visible.has(x.p.id));
   if(el)el.remove();
   if(!panel.querySelector('[data-bubble]')){Motion.swap(panel,this.list());return;}
   if(fresh[0]){const list=panel.querySelector('.bb-list'),tmp=document.createElement('div');tmp.innerHTML=this.card(fresh[0],0);const c=tmp.firstElementChild;c.classList.add('bb-in');list.append(c);Motion.after(c);}};
  if(!el||Motion.reduced()){next();return;}
  el.classList.add('bb-out');Motion.wait(el,420).then(next);},
 refreshFoot(){const f=document.querySelector('.v-bubble .bb-foot');if(f){const t=document.createElement('div');t.innerHTML=this.footer();f.replaceWith(t.firstElementChild);}}
};

Actions.add({
 'bubble-mode':el=>{const id=el.dataset.id;if(!Bubble.MODES.some(m=>m.id===id))return;
  Store.update(s=>{s.bubble.mode=id;},{silent:true});Bubble.hidden.clear();
  const seg=document.querySelector('.v-bubble [data-seg="bubble"]');if(seg)UI.segSet(seg,id);
  const panel=document.getElementById('panel-bubble');if(panel){panel.setAttribute('aria-labelledby','tab-bubble-'+id);Motion.swap(panel,Bubble.list(id));}},
 'bubble-yes':el=>{const id=el.dataset.id,p=byId(id);if(!p)return;const prevShelf=state.shelf[p.id]||null,prevAt=state.shelfAt[p.id];
  Store.update(s=>{s.bubble.seen[p.id]={v:1,at:Date.now()};if(!s.shelf[p.id]){s.shelf[p.id]='want';s.shelfAt[p.id]=Date.now();}},{silent:true});
  Bubble.leave(p.id);Bubble.refreshFoot();
  toast('Adicionado a Quero',{undo:()=>{Store.update(s=>{delete s.bubble.seen[p.id];if(prevShelf){s.shelf[p.id]=prevShelf;s.shelfAt[p.id]=prevAt;}else{delete s.shelf[p.id];delete s.shelfAt[p.id];}},{silent:true});Bubble.hidden.delete(p.id);
   const panel=document.getElementById('panel-bubble');if(panel)Motion.swap(panel,Bubble.list());Bubble.refreshFoot();}});},
 'bubble-no':el=>{const id=el.dataset.id,p=byId(id);if(!p)return;
  Store.update(s=>{s.bubble.seen[p.id]={v:-1,at:Date.now()};},{silent:true});Bubble.leave(p.id);Bubble.refreshFoot();
  toast('Anotado. Isso ajusta o seu mapa.',{undo:()=>{Store.update(s=>{delete s.bubble.seen[p.id];},{silent:true});Bubble.hidden.delete(p.id);
   const panel=document.getElementById('panel-bubble');if(panel)Motion.swap(panel,Bubble.list());Bubble.refreshFoot();}});}
});

Router.add('bubble',{view:()=>Bubble.view(),title:'Fora da Bolha',layout:'push',nav:'guide'});
