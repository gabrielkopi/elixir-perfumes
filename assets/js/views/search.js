'use strict';
/* Busca rápida (tecla / ou Ctrl+K): perfumes, pessoas e notas num só lugar. */
const Search={
 index:null,sel:0,
 build(){const norm=NoteModel.normalize;this.index=[
  ...COMMUNITY.people.map(p=>({kind:'Pessoa',label:p.name,sub:'@'+p.handle,img:p.image,href:'#person/'+p.id,key:norm(p.name+' '+p.handle)})),
  ...PEOPLE.filter(u=>!People.find(u.id)).map(u=>({kind:'Pessoa',label:u.name,sub:'@'+u.id,av:u,href:'#person/'+u.id,key:norm(u.name+' '+u.id)})),
  ...PERFUMES.map(p=>({kind:'Perfume',label:p.name,sub:p.brand,img:p.image,href:'#perfume/'+p.id,key:norm(p.name+' '+p.brand+' '+p.noteWeights.map(n=>n.name).join(' '))})),
  ...INGREDIENTS.map(n=>({kind:'Nota',label:n.name,sub:NOTE_GROUPS[n.family],img:n.image,href:'#ingredient/'+n.id,key:norm(n.name)}))];},
 results(q){q=NoteModel.normalize(q.trim());if(!q)return [];this.index??=(this.build(),this.index);const starts=[],has=[];for(const x of this.index){const i=x.key.indexOf(q);if(i===0||NoteModel.normalize(x.label).startsWith(q))starts.push(x);else if(i>0)has.push(x);}return [...starts,...has].slice(0,12);},
 recent(){try{return JSON.parse(localStorage.getItem('elixir-recent')||'[]');}catch{return [];}},
 remember(href){try{localStorage.setItem('elixir-recent',JSON.stringify([href,...this.recent().filter(x=>x!==href)].slice(0,6)));}catch{}},
 row(x,i){return `<a class="sr ${i===this.sel?'sel':''}" href="${x.href}" data-action="search-go" role="option" aria-selected="${i===this.sel}">${x.av?UI.avatar(x.av):`<span class="sr-img ${x.kind==='Pessoa'?'round':''}">${UI.thumb(x.img)}</span>`}<span><strong>${esc(x.label)}</strong><small>${esc(x.sub||'')}</small></span><em>${x.kind}</em></a>`;},
 list(q){const r=this.results(q);if(!q.trim()){const rec=this.recent().map(h=>{this.index??=(this.build(),this.index);return this.index.find(x=>x.href===h);}).filter(Boolean);return rec.length?`<p class="label sr-label">Recentes</p>${rec.map((x,i)=>this.row(x,i)).join('')}`:`<p class="sr-hint muted">Busque perfumes, pessoas ou notas.</p>`;}return r.length?r.map((x,i)=>this.row(x,i)).join(''):`<p class="sr-hint muted">Nada para “${esc(q)}”.</p>`;},
 open(){this.sel=0;openModal('Buscar',`<label class="search palette-input">${icon('search')}<input id="palette-input" type="search" placeholder="Perfume, pessoa ou nota" aria-label="Buscar" autocomplete="off" role="combobox" aria-controls="palette-results"></label><div id="palette-results" role="listbox">${this.list('')}</div>`,{cls:'palette'});setTimeout(()=>$('#palette-input')?.focus(),30);},
 input(v){this.sel=0;$('#palette-results').innerHTML=this.list(v);},
 key(e){const rows=$$('#palette-results .sr');if(!rows.length)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();this.sel=(this.sel+(e.key==='ArrowDown'?1:-1)+rows.length)%rows.length;rows.forEach((r,i)=>{r.classList.toggle('sel',i===this.sel);r.setAttribute('aria-selected',i===this.sel);});rows[this.sel].scrollIntoView({block:'nearest'});}if(e.key==='Enter'){e.preventDefault();rows[this.sel].click();}}
};
