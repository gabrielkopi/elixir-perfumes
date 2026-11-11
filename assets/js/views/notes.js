'use strict';
/* Notas: biblioteca de notas ilustradas, página da nota, página da família e o Radar de afinidades (usado pelo perfil). */
const Radar={
 mode:'Famílias',
 plural(n){return ({'cítrica':'cítricas','aromática':'aromáticas','verde':'verdes'})[n]||n+'s';},
 stats(ratings){const liked=Object.entries(ratings||{}).filter(([,r])=>r>=8),map=new Map();for(const [id] of liked)for(const n of new Set(((byId(id)||{}).noteWeights||[]).map(x=>x.name))){const k=NoteModel.normalize(n),row=map.get(k)||{name:n,count:0};row.count++;map.set(k,row);}return {total:liked.length,notes:[...map.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'pt')).slice(0,5)};},
 /* Traços em tokens (estilo inline: o radar aparece dentro de outras telas). */
 svg(ratings,notes=false){const st=this.stats(ratings),values=Engine.profile(ratings||{}),axes=notes?st.notes.map(n=>({name:n.name,value:st.total?Math.round(n.count/st.total*100):0})):FAMILIES.map(([,name,,d])=>({name,value:values[d]}));if(axes.length<3)return '<p class="muted">Poucos dados para desenhar o mapa.</p>';
  const cx=200,cy=170,r=110,pt=(i,v,extra=0)=>{const a=-Math.PI/2+i*2*Math.PI/axes.length;return [cx+Math.cos(a)*(r*v/100+extra),cy+Math.sin(a)*(r*v/100+extra)];},pts=axes.map((x,i)=>pt(i,x.value));
  const grid='style="fill:none;stroke:var(--hair-strong);stroke-width:1"',label='style="fill:var(--muted);font:500 12px var(--sans)"';
  return `<svg class="radar" viewBox="0 0 400 340" role="img" aria-label="${esc(axes.map(x=>x.name+' '+Math.round(x.value)).join('; '))}">${[33,66,100].map(v=>`<circle cx="${cx}" cy="${cy}" r="${r*v/100}" class="r-grid" ${grid}/>`).join('')}${axes.map((x,i)=>{const [ex,ey]=pt(i,100),[lx,ly]=pt(i,100,22);return `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" class="r-grid" ${grid}/><text x="${lx}" y="${ly+4}" text-anchor="${Math.abs(lx-cx)<8?'middle':lx<cx?'end':'start'}" class="r-label" ${label}>${esc(x.name)}</text>`;}).join('')}<path d="${this.smooth(pts)}" class="r-area" style="fill:var(--signal-soft);stroke:var(--signal);stroke-width:1.5"/>${pts.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" class="r-dot" style="fill:var(--bg-elev);stroke:var(--signal);stroke-width:1.5"/>`).join('')}</svg>`;},
 smooth(points){return points.map((p,i)=>{const n=points.length,prev=points[(i+n-1)%n],next=points[(i+1)%n],after=points[(i+2)%n],c1=[p[0]+(next[0]-prev[0])*.15,p[1]+(next[1]-prev[1])*.15],c2=[next[0]-(after[0]-p[0])*.15,next[1]-(after[1]-p[1])*.15];return `${i===0?'M'+p.join(','):''} C${c1.join(',')} ${c2.join(',')} ${next.join(',')}`;}).join('')+'Z';}
};

const Notes={
 group:'all',LIMIT:24,_ix:null,
 LEGACY:{'limao-siciliano':['Limão'],'laranja-doce':['Laranja'],grapefruit:['Toranja'],neroli:['Néroli'],'fava-tonka':['Fava tonka'],'pimenta-rosa':['Pimenta rosa'],guaiaco:['Madeira guáiaco']},
 norm(s){return NoteModel.normalize(String(s||''));},
 list(){return typeof INGREDIENTS!=='undefined'?INGREDIENTS:[];},
 groups(){return typeof NOTE_GROUPS!=='undefined'?NOTE_GROUPS:[];},
 get(id){return this.list().find(n=>n.id===id)||null;},
 /* Índice nome/apelido → nota e perfume → notas (refeito quando o catálogo muda). */
 index(){const n=typeof PERFUMES!=='undefined'?PERFUMES.length:0;if(this._ix&&this._ix.n===n)return this._ix;
  const key=new Map(),alias=typeof INGREDIENT_ALIASES!=='undefined'?INGREDIENT_ALIASES:{};
  for(const i of this.list())key.set(this.norm(i.name),i.id);
  for(const i of this.list())for(const a of [...(alias[i.id]||[]),...(this.LEGACY[i.id]||[])]){const k=this.norm(a);if(k&&!key.has(k))key.set(k,i.id);}
  const byP=new Map(),byI=new Map(),count=new Map();
  for(const p of PERFUMES){const s=new Set(),names=[...(p.noteWeights||[]).map(w=>w.name),...((p.notes&&p.notes.highlights)||[]),...((p.notes&&p.notes.extra)||[])];
   for(const nm of names){const id=key.get(this.norm(nm));if(id)s.add(id);}
   byP.set(p.id,s);for(const id of s){if(!byI.has(id))byI.set(id,[]);byI.get(id).push(p);count.set(id,(count.get(id)||0)+1);}}
  this._ix={n,key,byP,byI,count};return this._ix;},
 lookup(name){const id=this.index().key.get(this.norm(name));return id?this.get(id):null;},
 has(p,id){if(!p)return false;const s=this.index().byP.get(p.id);if(s&&s.has(id))return true;
  if(typeof Advisor!=='undefined'&&Advisor.hasNote){const i=this.get(id);try{return !!(i&&Advisor.hasNote(p,i.name));}catch(e){}}return false;},
 perfumes(id){const ranked=typeof Select!=='undefined'?Select.ranked().map(x=>x.p):PERFUMES;return ranked.filter(p=>this.has(p,id));},
 count(id){return this.index().count.get(id)||0;},
 top(n=18){return this.list().filter(i=>this.count(i.id)>0).sort((a,b)=>this.count(b.id)-this.count(a.id)||a.name.localeCompare(b.name,'pt-BR')).slice(0,n);},
 /* Notas que mais aparecem junto (nos mesmos perfumes). */
 related(id,n=12){const c=new Map();for(const p of this.perfumes(id))for(const o of this.index().byP.get(p.id)||[])if(o!==id)c.set(o,(c.get(o)||0)+1);
  return [...c.entries()].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)).slice(0,n).map(([k])=>this.get(k)).filter(Boolean);},

 /* ---------- marcação ---------- */
 card(n,{i=0,rail=false}={}){if(!n)return '';const c=this.count(n.id);
  return `<a class="nt-card pressable" href="#ingredient/${esc(n.id)}" style="--i:${i}"${rail?'':' data-reveal'}><span class="nt-ill">${n.image?`<img src="${esc(n.image)}" alt="" loading="lazy" decoding="async">`:`<span class="nt-ini" aria-hidden="true">${esc(UI.initials(n.name))}</span>`}</span><b>${esc(n.name)}</b><span class="nt-sub">${c?UI.plural(c,'perfume','perfumes'):'Sem perfumes ainda'}</span></a>`;},
 famCard(f,i){return `<a class="nt-fam pressable" href="#family/${esc(f.id)}" style="--i:${i}"><span class="nt-sphere"><img class="bw" src="${esc(f.image)}" alt="" loading="lazy" decoding="async"></span><b>${esc(f.name)}</b><span>${esc(f.description)}</span></a>`;},
 groupChips(){const items=[{id:'all',label:'Todas'},...this.groups().map((g,i)=>({id:String(i),label:g}))];
  return `<div class="chips rail-x nt-groups" role="group" aria-label="Grupos de notas">${items.map(x=>`<button type="button" class="chip pressable" aria-pressed="${x.id===this.group}" aria-controls="panel-notes" data-action="note-group" data-id="${esc(x.id)}">${esc(x.label)}</button>`).join('')}</div>`;},
 gridHtml(){const list=this.list().filter(n=>this.group==='all'||String(n.family)===this.group).sort((a,b)=>this.count(b.id)-this.count(a.id)||a.name.localeCompare(b.name,'pt-BR'));
  if(!list.length)return UI.empty({title:'Nenhuma nota neste grupo',text:'Escolha outro grupo para continuar.'});
  return `<p class="t-sm muted nt-count">${UI.plural(list.length,'nota','notas')}</p><div class="nt-grid">${list.map((n,i)=>this.card(n,{i})).join('')}</div>`;},
 view(){const fams=typeof Catalog!=='undefined'?Catalog.families():[];
  return `<section class="v-explore v-notes" data-view="ingredients">${Explore.head('ingredients')}
${fams.length?UI.section({title:'Famílias',rail:'nt-fams',cls:'nt-sec',body:UI.rail(fams.map((f,i)=>this.famCard(f,i)),{name:'nt-fams',label:'Famílias olfativas'})}):''}
${UI.section({title:'Notas',cls:'nt-sec',body:`${this.groupChips()}<div id="panel-notes" class="nt-panel" data-swap="notes">${this.gridHtml()}</div>`})}
<p class="t-sm muted nt-foot">Ilustrações geradas para o ELIXIR. São símbolos, não identificação botânica.</p></section>`;},
 notFound(kind){return `<section class="v-notes" data-view="${kind}">${UI.empty({icon:'search',title:kind==='family'?'Não encontramos esta família':'Não encontramos esta nota',text:'Talvez o endereço tenha mudado.',cta:{label:'Ir para Descobrir',href:'#explore'}})}</section>`;},
 detail(id){const n=this.get(id);if(!n)return this.notFound('ingredient');
  const list=this.perfumes(n.id),rel=this.related(n.id),group=this.groups()[n.family]||'Nota';
  const grid=list.length?`<div class="grid-z stagger">${list.slice(0,this.LIMIT).map((p,i)=>UI.tile(p,{i})).join('')}</div>${list.length>this.LIMIT?`<div class="nt-all">${UI.btn(`Ver os ${UI.count(list.length)} em Descobrir`,{action:'note-explore',variant:'secondary',attrs:`data-id="${esc(n.id)}"`})}</div>`:''}`
   :UI.empty({title:'Ainda não há perfumes com esta nota no catálogo',text:'O catálogo cresce sempre. Enquanto isso, conheça outras notas.',cta:{label:'Ver todas as notas',href:'#ingredients'}});
  return `<section class="v-notes" data-view="ingredient"><header class="nt-hero"><div class="nt-hero-ill">${n.image?`<img src="${esc(n.image)}" alt="Ilustração de ${esc(n.name)}" loading="eager" decoding="async">`:''}</div>
<div class="nt-hero-text"><p class="t-eyebrow muted">${esc(group)}</p><h1 class="t-display">${esc(n.name)}</h1>${n.description?`<p class="nt-lead">${esc(n.description)}</p>`:''}<p class="t-sm muted">${list.length?UI.plural(list.length,'perfume no catálogo','perfumes no catálogo'):'Nenhum perfume no catálogo ainda'}</p><i data-sentinel aria-hidden="true"></i></div></header>
${list.length?UI.section({title:`Perfumes com ${n.name.toLowerCase()}`,body:grid}):grid}
${rel.length?UI.section({title:'Costuma aparecer com',rail:'nt-rel',body:UI.rail(rel.map((r,i)=>this.card(r,{i,rail:true})),{name:'nt-rel',label:'Notas relacionadas'})}):''}
<p class="t-sm muted nt-foot">Ilustração gerada para o ELIXIR. É um símbolo, não identificação botânica.</p></section>`;},
 family(id){const f=(typeof Catalog!=='undefined'?Catalog.families():[]).find(x=>x.id===id);if(!f)return this.notFound('family');
  const ranked=typeof Select!=='undefined'?Select.ranked().map(x=>x.p):PERFUMES,list=ranked.filter(p=>(p.vector[f.d]||0)>=.5);
  const bars=list.length?DIMENSIONS.map((name,i)=>({i,label:name,value:Math.round(list.filter(p=>(p.vector[i]||0)>=.5).length/list.length*100)})).filter(x=>x.i!==f.d&&x.value>=8).sort((a,b)=>b.value-a.value).slice(0,5).map(x=>({label:x.label,value:x.value,text:x.value+'% dos perfumes'})):[];
  const grid=list.length?`<div class="grid-z stagger">${list.slice(0,this.LIMIT).map((p,i)=>UI.tile(p,{i})).join('')}</div>${list.length>this.LIMIT?`<div class="nt-all">${UI.btn(`Ver os ${UI.count(list.length)} em Descobrir`,{action:'family-explore',variant:'secondary',attrs:`data-id="${esc(f.id)}"`})}</div>`:''}`
   :UI.empty({title:'Ainda não há perfumes desta família no catálogo',cta:{label:'Ver todas as notas',href:'#ingredients'}});
  return `<section class="v-notes" data-view="family"><header class="nt-hero nt-hero--fam"><div class="nt-hero-ill nt-hero-sphere"><img src="${esc(f.image)}" alt="" loading="eager" decoding="async"></div>
<div class="nt-hero-text"><p class="t-eyebrow muted">Família olfativa</p><h1 class="t-display">${esc(f.name)}</h1><p class="nt-lead">${esc(f.description)}</p><p class="t-sm muted">${UI.plural(list.length,'perfume no catálogo','perfumes no catálogo')}</p><i data-sentinel aria-hidden="true"></i></div></header>
${bars.length?UI.section({title:'O que costuma vir junto',body:`<div class="nt-bars">${UI.bars(bars,5)}</div>`}):''}
${list.length?UI.section({title:'Perfumes',body:grid}):grid}</section>`;}
};

Actions.add({
 'note-group':el=>{const id=el.dataset.id;if(Notes.group===id)return;Notes.group=id;for(const b of el.parentElement.querySelectorAll('[data-action=note-group]'))b.setAttribute('aria-pressed',b===el);
  const panel=document.getElementById('panel-notes');if(panel)Motion.swap(panel,Notes.gridHtml());},
 'note-explore':el=>{const vs=Explore.state();vs.filters=Explore.blank();vs.filters.notes=[el.dataset.id];vs.q='';vs.batches=1;Explore.save();Router.go('explore');},
 'family-explore':el=>{const vs=Explore.state();vs.filters=Explore.blank();vs.filters.family=[el.dataset.id];vs.q='';vs.batches=1;Explore.save();Router.go('explore');}
});
Router.add('ingredients',{view:()=>Notes.view(),title:'Notas'});
Router.add('ingredient',{view:id=>Notes.detail(id),title:id=>(Notes.get(id)||{}).name||'Nota'});
Router.add('family',{view:id=>Notes.family(id),title:id=>((typeof Catalog!=='undefined'?Catalog.families():[]).find(f=>f.id===id)||{}).name||'Família'});
