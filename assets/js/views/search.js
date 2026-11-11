'use strict';
/* Busca única (folha): perfumes, notas, marcas e pessoas; combobox/listbox; modo seletor (Search.pick). */
const Search={
 q:'',picker:null,snapshot:null,active:-1,opts:[],
 MAX:5,
 /* ---------- dados ---------- */
 results(q){const r=Catalog.search(q);if(this.picker){const ex=new Set(this.picker.exclude||[]);return {perfumes:r.perfumes.filter(p=>!ex.has(p.id)),notes:[],brands:[],people:[]};}return r;},
 suggestions(){const notes=typeof Notes!=='undefined'?Notes.top(4).map(n=>n.name):[],brands=Catalog.brands().slice().sort((a,b)=>b.count-a.count).slice(0,2).map(b=>b.name);return [...notes,...brands].slice(0,6);},
 /* Sugestão mais próxima: encurta a consulta até achar algo. */
 nearest(q){const w=String(q||'').trim();for(let n=w.length-1;n>=2;n--){const r=Catalog.search(w.slice(0,n));const hit=r.perfumes[0]||r.notes[0]||r.brands[0];if(hit)return hit.name;}return '';},
 /* ---------- marcação ---------- */
 opt(kind,id,inner,label){const k=this.opts.length;this.opts.push({kind,id,label});return `<li role="option" id="ss-o-${k}" class="ss-opt" aria-selected="false" data-action="search-go" data-k="${k}">${inner}</li>`;},
 perfumeOpt(p){return this.opt('perfume',p.id,`<span class="thumb plate">${p.image?`<img src="${esc(p.image)}" alt="" loading="lazy" decoding="async" data-brand="${esc(p.brand)}" data-name="${esc(p.name)}">`:''}</span><span class="grow"><b>${esc(p.name)}${p.subtitle?` <span class="muted">${esc(p.subtitle)}</span>`:''}</b><span>${esc(p.brand)} · ${esc(p.concentration)}</span></span>`,p.name);},
 noteOpt(n){return this.opt('note',n.id,`<span class="thumb ss-ill">${n.image?`<img src="${esc(n.image)}" alt="" loading="lazy" decoding="async">`:''}</span><span class="grow"><b>${esc(n.name)}</b><span>Nota${typeof Notes!=='undefined'&&Notes.count(n.id)?' · '+UI.plural(Notes.count(n.id),'perfume','perfumes'):''}</span></span>`,n.name);},
 brandOpt(b){return this.opt('brand',b.slug,`<span class="thumb ss-mono" aria-hidden="true">${esc(UI.initials(b.name))}</span><span class="grow"><b>${esc(b.name)}</b><span>Marca · ${UI.plural(b.count,'perfume','perfumes')}</span></span>`,b.name);},
 personOpt(u){return this.opt('person',u.id,`${UI.avatar(u,'')}<span class="grow"><b>${esc(u.name)}</b><span>@${esc(u.handle||u.id)}</span></span>`,u.name);},
 group(title,list,fn,more){if(!list.length)return '';const id='ss-g-'+Catalog.slug(title);const max=this.picker?20:this.MAX;
  return `<section class="ss-group"><div class="ss-ghead"><h3 class="t-eyebrow muted" id="${id}">${esc(title)}</h3>${more&&list.length>this.MAX?UI.btn('Ver todos',{action:'search-all',variant:'tertiary',attrs:`data-kind="${more}"`}):''}</div><ul role="group" aria-labelledby="${id}" class="ss-list">${list.slice(0,max).map(x=>fn.call(this,x)).join('')}</ul></section>`;},
 resultsHtml(){this.opts=[];this.active=-1;const q=this.q.trim();
  if(!q){if(this.picker)return `<p class="t-sm muted ss-hint">Digite o nome do perfume ou da marca.</p>`;
   const rec=typeof state!=='undefined'?state.recentSearches:[];
   if(rec.length)return `<section class="ss-group"><div class="ss-ghead"><h3 class="t-eyebrow muted">Buscas recentes</h3>${UI.btn('Limpar',{action:'search-clear',variant:'tertiary'})}</div>${UI.chips(rec.map(x=>({id:x,label:x})),'search-fill')}</section>`;
   return `<section class="ss-group"><div class="ss-ghead"><h3 class="t-eyebrow muted">Sugestões</h3></div>${UI.chips(this.suggestions().map(x=>({id:x,label:x})),'search-fill')}</section>`;}
  const r=this.results(q),n=r.perfumes.length+r.notes.length+r.brands.length+r.people.length;
  if(!n){const near=this.nearest(q);return UI.empty({icon:'search',title:`Nada encontrado para “${q}”`,text:near?`Tente buscar por “${near}”. Ou deixe o Guia sugerir pelo seu gosto.`:'Confira a grafia ou deixe o Guia sugerir pelo seu gosto.',cta:this.picker?null:{label:'Usar o Guia',href:'#guide'}});}
  const html=this.picker?this.group('Perfumes',r.perfumes.slice(0,20),this.perfumeOpt,''):[this.group('Perfumes',r.perfumes,this.perfumeOpt,'perfume'),this.group('Notas',r.notes,this.noteOpt,'note'),this.group('Marcas',r.brands,this.brandOpt,'brand'),this.group('Pessoas',r.people,this.personOpt,'')].join('');
  return `<div role="listbox" id="ss-list" aria-label="Resultados">${html}</div>`;},
 body(){const t=this.picker?this.picker.title:'';
  return `<div class="ss-bar">${t?`<p class="t-h3 ss-title">${esc(t)}</p>`:''}<div class="ss-row"><label class="input ss-field">${icon('search','icon--20')}<span class="sr-only">${this.picker?'Buscar perfume':'Buscar perfumes, notas, marcas e pessoas'}</span><input id="ss-input" type="search" role="combobox" aria-expanded="${this.q.trim()?'true':'false'}" aria-controls="ss-list" aria-autocomplete="list" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" placeholder="${this.picker?'Nome do perfume ou marca':'Perfumes, notas, marcas, pessoas'}" value="${esc(this.q)}" data-input="search-q"></label>${UI.btn('Cancelar',{action:'search-cancel',variant:'tertiary'})}</div></div>
<div id="ss-results" class="ss-results">${this.resultsHtml()}</div>`;},
 /* ---------- abrir ---------- */
 open(q=''){this.picker=null;this.snapshot=null;this.q=String(q||'');
  Sheet.open({title:'Buscar',head:'',body:this.body(),cls:'sh-search',size:'full',focus:'#ss-input'});this.select(-1);},
 /* Modo seletor: só perfumes; ao escolher, devolve o id e restaura a folha de quem chamou (ou fecha). */
 pick({title='Escolher perfume',onPick=null,exclude=[]}={}){this.snapshot=typeof Sheet.save==='function'&&Sheet.isOpen()?Sheet.save():null;
  this.picker={title,onPick,exclude:Array.isArray(exclude)?exclude:[]};this.q='';
  Sheet.open({title,head:'',body:this.body(),cls:'sh-search',size:'full',focus:'#ss-input'});},
 /* ---------- lista e teclado ---------- */
 render(){const box=document.getElementById('ss-results');if(!box)return;box.innerHTML=this.resultsHtml();Motion.after(box);
  const inp=document.getElementById('ss-input');if(inp){inp.setAttribute('aria-expanded',this.opts.length?'true':'false');inp.removeAttribute('aria-activedescendant');}},
 select(k){const inp=document.getElementById('ss-input');const all=[...document.querySelectorAll('#ss-results [role=option]')];
  this.active=all.length?Math.max(-1,Math.min(all.length-1,k)):-1;all.forEach((o,i)=>o.setAttribute('aria-selected',i===this.active));
  if(!inp)return;if(this.active>=0){inp.setAttribute('aria-activedescendant',all[this.active].id);all[this.active].scrollIntoView({block:'nearest'});}else inp.removeAttribute('aria-activedescendant');},
 remember(text){const t=String(text||'').trim().slice(0,60);if(!t||typeof Store==='undefined')return;
  Store.update(s=>{s.recentSearches=[t,...s.recentSearches.filter(x=>x.toLowerCase()!==t.toLowerCase())].slice(0,8);},{silent:true});},
 go(k){const o=this.opts[k];if(!o)return;
  if(this.picker){const pk=this.picker,snap=this.snapshot;this.picker=null;this.snapshot=null;
   if(snap&&Sheet.restore){Sheet.restore(snap);}else Sheet.close();
   if(typeof pk.onPick==='function')try{pk.onPick(o.id);}catch(e){console.warn(e);}return;}
  this.remember(this.q.trim()||o.label);
  if(o.kind==='perfume')Router.go('perfume',o.id);else if(o.kind==='note')Router.go('ingredient',o.id);else if(o.kind==='brand')Router.go('brand',o.id);else if(o.kind==='person')Router.go('person',o.id);},
 key(e){if(!e.target||e.target.id!=='ss-input')return;const n=this.opts.length;
  if(e.key==='ArrowDown'){e.preventDefault();this.select(this.active+1>=n?0:this.active+1);}
  else if(e.key==='ArrowUp'){e.preventDefault();this.select(this.active<=0?n-1:this.active-1);}
  else if(e.key==='Enter'){e.preventDefault();if(this.active>=0)this.go(this.active);else if(n)this.go(0);}
  /* O campo type=search limparia o texto no primeiro Esc; aqui Esc fecha a busca direto. */
  else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();Sheet.close();}}
};

document.addEventListener('keydown',e=>{if(e.isComposing||e.keyCode===229)return;if(e.target&&e.target.id==='ss-input')Search.key(e);});
Actions.input('search-q',el=>{Search.q=el.value;Search.render();});
Actions.add({
 'search-go':el=>Search.go(Number(el.dataset.k)),
 'search-cancel':()=>{if(Search.picker&&Search.snapshot&&Sheet.restore){const s=Search.snapshot;Search.picker=null;Search.snapshot=null;Sheet.restore(s);}else Sheet.close();},
 'search-fill':el=>{const inp=document.getElementById('ss-input');Search.q=el.dataset.id||'';if(inp){inp.value=Search.q;inp.focus();}Search.render();},
 'search-clear':()=>{Store.update(s=>{s.recentSearches=[];},{silent:true});Search.render();const inp=document.getElementById('ss-input');if(inp)inp.focus();},
 'search-all':el=>{const q=Search.q.trim(),k=el.dataset.kind;Search.remember(q);
  if(k==='perfume')Explore.applyQuery(q);else if(k==='note'){Notes.group='all';Router.go('ingredients');}else if(k==='brand')Router.go('brands');}
});
