'use strict';
/* Comparar (§5): até 3 perfumes lado a lado numa tabela real. A URL (compare/a,b,c) manda; state.compare acompanha em silêncio. */
const Compare={
 MAX:3,
 clean(list){const out=[];for(const x of list||[]){const p=byId(String(x).trim());if(p&&!out.includes(p.id))out.push(p.id);}return out.slice(0,this.MAX);},
 fromUrl(id){const raw=String(id||'').split(',').map(s=>s.trim()).filter(Boolean);return raw.length?this.clean(raw):this.clean(state.compare);},
 here(){return route.page==='compare';},
 /* Aplica a nova seleção: no Comparar troca o conteúdo no lugar e reescreve a URL sem novo histórico; fora dele, a bandeja aparece. */
 /* Espera a folha (ex.: seletor de busca) fechar e o histórico assentar antes de reescrever a URL. */
 idle(fn,tries=0){const busy=typeof Sheet!=='undefined'&&(Sheet.backPending||Sheet.isOpen()||Sheet.closing);if(busy&&tries<24){setTimeout(()=>this.idle(fn,tries+1),50);return;}fn();},
 set(ids,opts={}){if(this.here()&&typeof Sheet!=='undefined'&&(Sheet.backPending||Sheet.isOpen()||Sheet.closing)){this.idle(()=>this.apply(ids,opts));return this.clean(ids);}return this.apply(ids,opts);},
 apply(ids,{toastText='',undo=null}={}){const next=this.clean(ids);
  if(this.here()){Store.update(s=>{s.compare=next;},{silent:true});Router.replace('compare',next.join(','));const sec=document.querySelector('#main .v-compare');
   if(sec){const tmp=document.createElement('div');tmp.innerHTML=this.view(next.join(','));const nx=tmp.firstElementChild;Motion.swap(sec,nx?nx.innerHTML:'');}}
  else Store.update(s=>{s.compare=next;});
  if(toastText)toast(toastText,undo?{undo}:undefined);return next;},
 add(id){const p=byId(id);if(!p)return false;const cur=this.here()?this.fromUrl(route.id):state.compare;if(cur.includes(p.id))return true;
  if(cur.length>=this.MAX){toast('Máximo de 3. Remova um para adicionar.');return false;}
  const prev=[...cur];this.set([...cur,p.id],{toastText:this.here()?'':`${p.name} no Comparar`,undo:()=>this.set(prev)});return true;},
 remove(id){const p=byId(id);if(!p)return;const cur=this.here()?this.fromUrl(route.id):state.compare,prev=[...cur];
  this.set(cur.filter(x=>x!==p.id),{toastText:`${p.name} saiu do Comparar`,undo:()=>this.set(prev)});},
 toggle(id){const p=byId(id);if(!p)return;const cur=this.here()?this.fromUrl(route.id):state.compare;if(cur.includes(p.id))this.remove(p.id);else this.add(p.id);},
 pick(){const cur=this.here()?this.fromUrl(route.id):state.compare;if(cur.length>=this.MAX){toast('Máximo de 3. Remova um para adicionar.');return;}
  if(typeof Search!=='undefined'&&Search.pick)Search.pick({title:'Adicionar ao Comparar',exclude:cur,onPick:id=>this.add(id)});
  else if(typeof Search!=='undefined'&&Search.open)Search.open();else Router.go('explore');},

 /* ---------- dados de cada coluna ---------- */
 info(p){const nR=Object.keys(state.ratings).length;let x=null;try{x=Select.explain(p.id,{source:'perfume'});}catch(e){}
  const rec=Select.rec(p.id)||{score:50,confidence:'Dados insuficientes',reason:''};
  const chance=x&&Number.isFinite(Number(x.chance))?Math.round(x.chance):rec.score;
  const level=x&&x.level?x.level:nR<3?'Dados insuficientes':rec.confidence;
  return {p,chance,level,n:nR,line:x&&x.line?x.line:rec.reason||'',season:Advisor.season(p),tier:Advisor.tier(p),bb:Advisor.blindBuy(p,state.ratings,state.preferences),
   pol:Advisor.polarity(p),perf:Engine.performance(p.id),axes:Advisor.axes(p),notes:this.notes(p)};},
 notes(p){const seen=new Map();for(const w of p.noteWeights||[]){const k=Catalog.norm(w.name);if(k&&!seen.has(k))seen.set(k,w.name);}return seen;},
 avoided(p){const g=state.guide,list=[...new Set([...(state.preferences.dislikedNotes||[]),...(g&&g.mode==='me'?g.answers.avoidNotes:[])])];return list.filter(n=>Advisor.hasNote(p,n));},
 fam(c){return Advisor.families().map(f=>({id:f.id,v:c.axes[f.id]||0})).sort((a,b)=>b.v-a.v).slice(0,2).filter((x,i)=>i===0||x.v>=.45).map(x=>Advisor.famLabel(x.id)).join(' · ');},
 dots(v){const n=v>=.7?3:v>=.5?2:v>=.3?1:0;return `<span class="c-dots" role="img" aria-label="${n} de 3">${[0,1,2].map(i=>`<i${i<n?' class="on"':''}></i>`).join('')}</span>`;},
 polText(c){const people=typeof PEOPLE!=='undefined'?PEOPLE.filter(u=>Number.isFinite(u.ratings[c.p.id])).length:0;
  if(people<2)return '<span class="muted">Poucas opiniões</span>';return c.pol>=.6?'Divide opiniões':c.pol<=.25?'Quase todos concordam':'Opiniões variadas';},
 perfText(c){const f=c.perf;if(!f||f.count<3)return '<span class="muted">Sem relatos suficientes</span>';
  return `${Math.round(f.hours)} h · projeção ${String(Math.round(f.projection*10)/10).replace('.',',')} de 5<small class="c-note">${UI.plural(f.count,'relato','relatos')} de demonstração</small>`;},

 /* ---------- marcação ---------- */
 head(c){const p=c.p;return `<th scope="col" class="c-col"><div class="c-head"><a class="c-plate pressable" href="#perfume/${esc(p.id)}" data-action="perfume" data-id="${esc(p.id)}">${UI.photo(p)}</a>
  <div class="c-name"><a href="#perfume/${esc(p.id)}" data-action="perfume" data-id="${esc(p.id)}">${esc(p.name)}</a><span class="brand">${esc(p.brand)}</span></div>
  ${UI.iconBtn('close',{action:'compare-remove',label:'Remover '+p.name,attrs:`data-id="${esc(p.id)}"`,cls:'c-x'})}</div></th>`;},
 table(cols){const n=cols.length,add=n<this.MAX;
  const common=[...cols[0].notes.keys()].filter(k=>cols.every(c=>c.notes.has(k))).map(k=>cols[0].notes.get(k));
  const row=(label,fn,cls='')=>`<tr${cls?` class="${cls}"`:''}><th scope="row">${esc(label)}</th>${cols.map(c=>`<td>${fn(c)}</td>`).join('')}${add?'<td class="c-add-cell"></td>':''}</tr>`;
  const occ=['Dia a dia','Trabalho','Encontro','Festa','Calor e praia'];
  const best=Math.max(...cols.map(c=>c.chance));
  const rows=[
   row('Chance de gostar',c=>`<b class="c-big${c.chance===best&&n>1?' c-best':''}">${c.chance}%</b><small class="c-note">${esc(UI.levelText(c.level,c.n))}</small>`),
   row('Compra às cegas',c=>`<span class="c-pill">${esc(c.bb.level)}</span>`),
   row('Faixa',c=>esc(Advisor.tierLabel(c.tier))),
   row('Família',c=>esc(this.fam(c))||'<span class="muted">Sem dados</span>'),
   row('Estação',c=>`<span class="c-season"><span class="c-track" aria-hidden="true"><i style="--v:${(c.season.warm/(c.season.warm+c.season.cold||1)).toFixed(2)}"></i></span><span class="c-ends" aria-hidden="true"><small>Frio</small><small>Calor</small></span><span>${esc(c.season.label)}</span></span>`),
   row('Ocasiões',c=>`<ul class="c-occ">${occ.map(o=>`<li><span>${esc(o)}</span>${this.dots(Advisor.occasionFit(c.p,o))}</li>`).join('')}</ul>`),
   row('Fixação e projeção',c=>this.perfText(c)),
   `<tr class="c-span"><th scope="row">Notas em comum</th><td colspan="${n+(add?1:0)}">${common.length?`<div class="chips">${common.slice(0,10).map(x=>`<span class="chip on">${esc(x)}</span>`).join('')}</div>`:'<span class="muted">Nenhuma nota em comum</span>'}</td></tr>`,
   row('Notas exclusivas',c=>{const own=[...c.notes.entries()].filter(([k])=>!cols.some(o=>o!==c&&o.notes.has(k))).map(([,v])=>v).slice(0,6);return own.length?`<span class="c-notes">${own.map(esc).join(', ')}</span>`:'<span class="muted">Nenhuma</span>';}),
   row('Notas que você evita',c=>{const a=this.avoided(c.p);return a.length?`<span class="c-avoid">${a.map(esc).join(', ')}</span>`:'<span class="muted">Nenhuma</span>';}),
   row('Divide opiniões',c=>this.polText(c))];
  const addHead=add?`<th scope="col" class="c-col c-add-col"><button type="button" class="c-add pressable" data-action="compare-pick">${icon('plus')}<span>Adicionar</span></button></th>`:'';
  return `<div class="c-scroll" tabindex="0" role="region" aria-label="Tabela de comparação"><table class="c-table" style="--cols:${n+(add?1:0)}"><thead><tr><td class="c-corner"><span class="sr-only">Perfume</span></td>${cols.map(c=>this.head(c)).join('')}${addHead}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;},
 verdict(cols){const s=[...cols].sort((a,b)=>b.chance-a.chance||a.p.id.localeCompare(b.p.id)),w=s[0],nR=Object.keys(state.ratings).length;
  let why=String(w.line||'').trim().replace(/\.$/,'');if(why)why=/^(parecido|muito parecido)/i.test(why)?'é '+why.charAt(0).toLowerCase()+why.slice(1):why.charAt(0).toLowerCase()+why.slice(1);
  if(!why)why=`combina melhor com o que você contou até aqui`;
  const tie=s[1]&&s[0].chance-s[1].chance<3;
  return `<article class="c-verdict"><p class="t-eyebrow muted">Veredito</p><p class="c-verdict-t">Para você: <b>${esc(w.p.name)}</b>, porque ${esc(why)}.</p>
   ${tie||nR<3?`<p class="t-sm muted">${nR<3?'Avalie 3 perfumes para um veredito mais confiável.':`Está bem perto de ${esc(s[1].p.name)}. Vale testar os dois na pele.`}</p>`:''}
   <div class="c-verdict-act">${UI.btn('Ver '+w.p.name,{href:'#perfume/'+w.p.id,action:'perfume',attrs:`data-id="${esc(w.p.id)}"`})}</div></article>`;},
 similar(p,cur){let list=Advisor.alternatives(p,{n:8});if(list.length<4){const seen=new Set([p.id,...cur,...list.map(x=>x.p.id)]);
   const more=PERFUMES.filter(q=>!seen.has(q.id)&&q.vector).map(q=>({p:q,sim:Engine.cosine(p.vector,q.vector)})).sort((a,b)=>b.sim-a.sim||a.p.id.localeCompare(b.p.id)).slice(0,8-list.length);list=[...list,...more];}
  return list.filter(x=>!cur.includes(x.p.id)).slice(0,8);},
 view(id){const ids=this.fromUrl(id);
  if(JSON.stringify(ids)!==JSON.stringify(state.compare))Store.update(s=>{s.compare=ids;},{silent:true});
  const head=UI.pageHead({eyebrow:'Guia',title:'Comparar',sub:ids.length>1?'Lado a lado, com o que importa para você.':''});
  const searchBtn=typeof Search!=='undefined'&&(Search.pick||Search.open)?`<button type="button" class="input c-find pressable" data-action="compare-pick">${icon('search','icon--20')}<span>Buscar outro perfume</span></button>`:'';
  if(!ids.length)return `<section class="v-compare" data-view="compare">${head}${UI.empty({icon:'scale',title:'Escolha perfumes para comparar',text:'Coloque até 3 lado a lado: notas, estação, fixação e o que combina com você.',cta:{label:'Buscar',action:'compare-pick'}})}</section>`;
  if(ids.length===1){const p=byId(ids[0]),sim=this.similar(p,ids);
   const one=`<div class="c-one list-hair">${UI.row(p,{sub:esc(p.brand),trail:UI.iconBtn('close',{action:'compare-remove',label:'Remover '+p.name,attrs:`data-id="${esc(p.id)}"`})})}</div>`;
   const rail=sim.length?UI.section({title:'Parecidos para comparar',rail:'compare-alt',body:UI.rail(sim.map((x,i)=>UI.tile(x.p,{i,action:'compare-alt',sub:`${Math.round(x.sim*100)}% parecido`})),{name:'compare-alt',label:'Parecidos para comparar'})}):'';
   return `<section class="v-compare" data-view="compare">${head}${one}${UI.empty({title:'Escolha mais um',text:'Toque em um parecido abaixo, ou busque outro perfume.'})}${searchBtn}${rail}</section>`;}
  const cols=ids.map(x=>this.info(byId(x)));
  return `<section class="v-compare" data-view="compare">${head}${this.table(cols)}${this.verdict(cols)}</section>`;},
 after(id){const ids=this.fromUrl(id);if(ids.join(',')!==String(id||''))Router.replace('compare',ids.join(','));
  const sc=document.querySelector('#main .c-scroll');if(sc){const upd=()=>sc.classList.toggle('c-scrolled',sc.scrollLeft>4);sc.addEventListener('scroll',upd,{passive:true});upd();}}
};

Router.add('compare',{view:id=>Compare.view(id),title:'Comparar',nav:'origin',after:id=>Compare.after(id)});

Actions.add({
 'compare-remove':el=>Compare.remove(el.dataset.id),
 'compare-pick':()=>Compare.pick(),
 'compare-alt':el=>Compare.add(el.dataset.id)
});
