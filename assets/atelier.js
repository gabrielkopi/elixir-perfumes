/* ELIXIR v5 — theme, ingredient exploration and factual note matching. */
(() => {
 const V=window.ElixirAtelier={selected:new Set(),excluded:new Set(),mode:'all',search:'',limit:48,resultLimit:24};
 const norm=NoteModel.normalize.bind(NoteModel);
 const extraAliases={"limao":"Limão-siciliano","laranja":"Laranja-doce","pimenta":"Pimenta preta","tangerina":"Mandarina","cumaru":"Fava tonka","tonka":"Fava tonka","freesia":"Frésia","osmanthus":"Osmanto","muguet":"Lírio do vale","lilyofthevalley":"Lírio do vale","cognac":"Conhaque","anise":"Anis","tea":"Chá","brownsugar":"Açúcar","sugar":"Açúcar","pomegranate":"Romã","pomelo":"Toranja","lime":"Lima","lily":"Lírio","orchid":"Orquídea","whitemusk":"Musk","lavandin":"Lavanda","lavenderdiva":"Lavanda","spice":"Notas especiadas","wood":"Madeiras","whitewoods":"Madeiras","amadeirado":"Madeiras","citrus":"Notas cítricas","bitterorange":"Laranja-amarga","bloodorange":"Laranja sanguínea","heliotrope":"Heliotrópio","honeysuckle":"Madressilva","frangipani":"Jasmim-manga","suede":"Camurça","tarragon":"Estragão","ambergris":"Âmbar cinzento","almondmilk":"Leite de amêndoa","greenpear":"Pera","wildberries":"Frutas vermelhas","whiteflowers":"Flores brancas","chamomile":"Camomila","daffodil":"Narciso","liquor":"Licor","tiare":"Flor de tiaré"};
 const aliases={flordeplumeria:'jasmimmanga',flordemaca:'appleblossom',folhasdevioleta:'folhadevioleta',grapefruit:'toranja',ginger:'gengibre',rosemary:'alecrim',mango:'manga',muskbranco:'musk',almiscar:'musk',whitemusk:'musk',tonka:'favatonka',vanilla:'baunilha',sugar:'acucar',sandalwood:'sandalo',cedarwood:'cedro',rose:'rosa',wood:'madeiras',woody:'madeiras',rgamota:'bergamota',pear:'pera',praline:'praline',irisbranca:'iris'};
 V.key=n=>{const v=norm(n);return aliases[v]||norm(extraAliases[v]||v);};
 V.names=[...new Map(PERFUMES.flatMap(p=>p.noteWeights.map(n=>n.name)).map(n=>[V.key(n),n])).values()].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 V.art={};
 // Build the normalized lookup once; note grids reuse it on every interaction.
 let imageIndex=null,imageCache=new Map();
 V.refreshImages=()=>{
   const art=Object.entries(V.art).map(([name,image])=>[V.key(name),image]);
   const ingredients=INGREDIENTS.map(i=>[V.key(i.name),i.image]);
   const exact=new Map();
   for(const [key,image] of [...art,...ingredients])if(!exact.has(key))exact.set(key,image);
   imageIndex={exact,variants:[...art,...ingredients].filter(([key])=>key.length>=4).sort((a,b)=>b[0].length-a[0].length)};
   imageCache=new Map();
 };
 V.image=n=>{
   if(!imageIndex)V.refreshImages();
   const key=V.key(n);if(imageCache.has(key))return imageCache.get(key);
   let image=imageIndex.exact.get(key);
   if(!image&&!['jasmimmanga','ambarcinzento'].includes(key))image=imageIndex.variants.find(([k])=>key.startsWith(k)||key.endsWith(k))?.[1];
   imageCache.set(key,image);return image;
 };
 V.imageAttrs=(file,sizes='auto, 160px')=>{
   const variants=V.responsive?.[file];
   return variants?`srcset="${variants.map(v=>esc(v.src)+' '+v.width+'w').join(', ')}" sizes="${esc(sizes)}"`:'';
 };
 const originalIcon=ElixirCatalog.noteIcon.bind(ElixirCatalog);
 ElixirCatalog.noteIcon=n=>V.image(n)?`<span class="scent-note-art"><img src="${esc(V.image(n))}" ${V.imageAttrs(V.image(n))} width="640" height="640" alt="" loading="lazy" decoding="async"></span>`:originalIcon(n);
 const oldNotes=ElixirCatalog.notes.bind(ElixirCatalog);
 ElixirCatalog.notes=p=>oldNotes(p).replace(/<div class="scent-note">([\s\S]*?)<span>([^<]+)<\/span><\/div>/g,(_,art,n)=>`<button class="scent-note" data-v5="note" data-note="${n}" aria-label="Explorar nota ${n}">${art}<span>${n}</span></button>`);
 V.matches=p=>{const keys=p.noteWeights.map(n=>V.key(n.name)),has=n=>keys.some(k=>k===V.key(n)||k.startsWith(V.key(n))&&V.key(n).length>=4);return ![...V.excluded].some(has)&&(!V.selected.size||(V.mode==='all'?[...V.selected].every(has):[...V.selected].some(has)));};
 V.results=()=>PERFUMES.filter(p=>V.matches(p));
 V.filteredNotes=()=>V.names.filter(n=>norm(n).includes(norm(V.search)));
 V.picker=()=>V.filteredNotes().slice(0,V.limit).map(n=>`<button class="v5-note-pick ${V.selected.has(n)?'selected':''}" data-v5="mix" data-note="${esc(n)}" aria-pressed="${V.selected.has(n)}">${ElixirCatalog.noteIcon(n)}<span>${esc(n)}</span>${icon(V.selected.has(n)?'check':'plus')}</button>`).join('')||`<div class="empty wide v5-note-empty"><h3>Nenhuma nota encontrada.</h3><p>Confira a escrita ou experimente outro nome.</p><button class="btn outline" data-v5="reset-search">Limpar busca</button></div>`;
 V.noteStatus=()=>{const total=V.filteredNotes().length;return V.search?`${total} ${total===1?'nota encontrada':'notas encontradas'}`:`${Math.min(V.limit,total)} de ${total} notas`;};
 V.resultHTML=()=>{const results=V.selected.size||V.excluded.size?V.results():[];return V.selected.size||V.excluded.size?`<p class="v5-result-count" role="status">${results.length} ${results.length===1?'perfume':'perfumes'} com ${!V.selected.size?'as exclusões escolhidas':V.mode==='all'?'todas as notas escolhidas':'pelo menos uma nota escolhida'}</p><div class="product-grid">${results.slice(0,V.resultLimit).map(card).join('')||'<div class="empty wide"><h3>Ainda não encontramos essa combinação.</h3><p>Experimente “Qualquer nota” ou retire uma nota da mistura.</p></div>'}</div>${results.length>V.resultLimit?'<button class="btn outline" data-v5="more-results">Mostrar mais perfumes</button>':''}`:'<div class="v5-empty"><h3>Que cheiro você quer encontrar?</h3><p>Escolha notas para revelar perfumes que as citam nas referências.</p></div>';};
 V.chipsHTML=()=>[...V.selected].map(n=>'<button data-v5="mix" data-note="'+esc(n)+'">'+esc(n)+' ×</button>').join('')||'<span>Escolha suas primeiras notas abaixo</span>';
 V.excludedHTML=()=>[...V.excluded].map(n=>'<button data-v5="exclude-remove" data-note="'+esc(n)+'">Evitar '+esc(n)+' ×</button>').join('');
 V.updateMix=()=>{
   const focused=document.activeElement,wasChip=focused?.closest('.v5-mix-chips'),wasExclusion=focused?.closest('.v5-excluded'),note=focused?.dataset.note;
   Motion.replace(document.querySelector('.v5-mix-chips'),V.chipsHTML());
   Motion.replace(document.querySelector('.v5-excluded'),V.excludedHTML());
   document.querySelectorAll('.v5-note-pick').forEach(button=>{
     const selected=V.selected.has(button.dataset.note);
     if(button.getAttribute('aria-pressed')===String(selected))return;
     button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));
     const svg=button.querySelector(':scope > .icon'),template=document.createElement('template');template.innerHTML=icon(selected?'check':'plus');
     if(svg)svg.replaceWith(template.content.firstElementChild);
   });
   document.querySelectorAll('.v5-mode button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.value===V.mode)));
   const exclude=document.querySelector('#v5-exclude');if(exclude)exclude.value='';
   Motion.replace(document.querySelector('#v5-mix-results'),V.resultHTML(),{animate:true});
   if(!focused?.isConnected){
     if(wasChip)[...document.querySelectorAll('.v5-note-pick')].find(button=>button.dataset.note===note)?.focus({preventScroll:true});
     else if(wasExclusion)exclude?.focus({preventScroll:true});
   }
 };
 V.view=()=>`<section class="v5-alchemy"><p class="eyebrow">ALQUIMIA / SEU ACORDE, SEU CAMINHO</p><h1>Misture a sua<br><em>curiosidade.</em></h1><p>Combine notas e descubra perfumes que as declaram. Este laboratório pesquisa referências do catálogo; não prevê uma fórmula química ou o cheiro de uma mistura real.</p><div class="v5-mix-panel"><header><h2>Sua mistura</h2><button data-v5="clear" class="text-button">Limpar</button></header><div class="v5-mix-chips">${V.chipsHTML()}</div><div class="v5-mode"><button data-v5="mode" data-value="all" aria-pressed="${V.mode==='all'}">Todas as notas</button><button data-v5="mode" data-value="any" aria-pressed="${V.mode==='any'}">Qualquer nota</button></div><label class="v5-exclude">Prefiro evitar<select id="v5-exclude"><option value="">Adicionar nota a evitar</option>${V.names.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select></label><div class="v5-excluded">${V.excludedHTML()}</div></div><label class="searchbox">${icon('search')}<input id="v5-note-search" type="search" aria-label="Buscar notas para alquimia" placeholder="Gengibre, alecrim, baunilha…" value="${esc(V.search)}"></label><p id="v5-note-count" class="v5-note-status" role="status" aria-atomic="true">${V.noteStatus()}</p><div class="v5-note-picker" id="v5-note-picker">${V.picker()}</div><button data-v5="more-notes" class="btn outline" ${V.filteredNotes().length<=V.limit?'hidden':''}>Mostrar mais notas</button><p class="scent-caption">Ilustrações visuais das notas e acordes. Variações do mesmo nome são agrupadas quando reconhecidas; uma ausência de resultado não comprova ausência na composição.</p><section id="v5-mix-results">${V.resultHTML()}</section></section>`;
 V.note=(n,limit=24)=>{const products=PERFUMES.filter(p=>p.noteWeights.some(x=>V.key(x.name)===V.key(n)||V.key(x.name).startsWith(V.key(n))&&V.key(n).length>=4));openModal('A nota: '+esc(n),`<div class="v5-note-detail">${ElixirCatalog.noteIcon(n)}<p>${products.length} ${products.length===1?'perfume cita':'perfumes citam'} esta nota na referência do catálogo. A ilustração representa a nota, sem comprovar ingrediente natural.</p><button class="btn" data-v5="note-to-mix" data-note="${esc(n)}">Adicionar à alquimia ${icon('plus')}</button><div class="v5-note-perfumes">${products.slice(0,limit).map(p=>`<button data-action="perfume" data-id="${p.id}">${photo(p)}<span><small>${esc(p.brand)}</small><strong>${esc(p.name)}</strong></span>${icon('arrow')}</button>`).join('')||'<p>Nenhuma referência exata no catálogo.</p>'}</div>${products.length>limit?`<button class="btn outline" data-v5="more-note-results" data-note="${esc(n)}" data-limit="${limit}">Ver mais perfumes com esta nota</button>`:''}</div>`);};
 try{V.theme=localStorage.getItem('elixir-theme-v5')||'system';}catch{V.theme='system';}
 V.applyTheme=()=>{document.documentElement.dataset.theme=V.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):V.theme;document.documentElement.style.colorScheme=document.documentElement.dataset.theme;document.querySelector('meta[name=theme-color]')?.setAttribute('content',document.documentElement.dataset.theme==='dark'?'#111815':'#fcfcfb');V.updateThemeControl?.();};V.applyTheme();
 matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(V.theme==='system')V.applyTheme();});
 const names=['Helena Prado','Caio Mendes','Luiza Ramos','Pedro Vieira','Marina Torres','André Alves','Beatriz Campos','Lucas Ferreira','Isadora Melo','Thiago Freitas','Camila Rocha','Arthur Sales'];
 const refs=['sospiro-vibrato','boticario-lily','vetiver','rabanne-fame','natura-homem-essence','santal','boticario-egeo-dolce','philosykos','guerlain-mon-guerlain','terre','chance','arbo'];
 names.forEach((name,i)=>{const id='atelier-person-'+i,p=byId(refs[i])||PERFUMES[i],base=Social.people[i%Social.people.length];Social.people.push({...base,id,name,handle:name.toLowerCase().replaceAll(' ','.'),image:ElixirStudio.avatarImage(name,['#e4dacb','#cbded7','#dccfe3'][i%3]),verified:false,role:'Perfil fictício · comunidade de teste',bio:'Perfil fictício para explorar notas, conversas e novas descobertas.',followers:30+i*19,following:12+i,ratings:{[p.id]:8},liked:[],disliked:[],studio:true});if(!Social.products.some(x=>x.id==='v5-product-'+i))Social.products.push({id:'v5-product-'+i,catalog:p.id,name:p.name,brand:p.brand,image:p.image,family:p.family,notes:p.noteWeights.slice(0,3).map(n=>n.name),reason:'Uma descoberta demonstrativa.',source:p.notes?.source});for(let j=0;j<2;j++)Social.posts.push({id:'v5-post-'+i+'-'+j,user:id,product:'v5-product-'+i,image:p.image,kind:'product',when:j?'Nesta semana':'Hoje',text:['Hoje escolhi descobrir uma nota de cada vez. O que você percebe primeiro neste perfume?','Minha próxima experiência na prateleira: comparar as notas da referência com o que sinto na pele.'][j],likes:3+i*2,occasion:'Relato fictício · para experimentar'});});
 const ingredientDetail=IngredientLibrary.detail.bind(IngredientLibrary);IngredientLibrary.detail=id=>{const n=INGREDIENTS.find(n=>n.id===id);return ingredientDetail(id)+(n?'<div class="v5-action-bar v5-note-actions" role="group" aria-label="Ações da nota"><button data-v5="note" data-note="'+esc(n.name)+'">Ver perfumes com esta nota '+icon('search')+'</button><button data-v5="note-to-mix" data-note="'+esc(n.name)+'">Adicionar à alquimia '+icon('plus')+'</button></div>':'');};
 V.themeLabel=()=>V.theme==='dark'?'Escuro':V.theme==='light'?'Claro':'Automático';
 V.updateThemeControl=()=>document.querySelectorAll('[data-v5=theme]').forEach(button=>{button.setAttribute('aria-label','Alternar tema. Atual: '+V.theme);button.innerHTML=icon('sun')+' '+V.themeLabel();});
 V.bar=()=>'<nav class="v5-action-bar" aria-label="Atelier e aparência"><a href="#alchemy">'+icon('spark')+' Alquimia</a><button data-v5="theme" aria-label="Alternar tema. Atual: '+V.theme+'">'+icon('sun')+' '+V.themeLabel()+'</button></nav>';
 const previousShell=shell;shell=body=>previousShell(V.bar()+body);
 const previousRender=render;
 render=()=>{if(route.page==='alchemy'){Premium.palette();Motion.paint(shell(V.view()));document.title='ELIXIR · Alquimia';}else previousRender();V.applyTheme();};
 document.addEventListener('click',e=>{const b=e.target.closest('[data-v5]');if(!b)return;const {v5,note,value}=b.dataset;if(v5==='theme'){V.theme=V.theme==='system'?'dark':V.theme==='dark'?'light':'system';try{localStorage.setItem('elixir-theme-v5',V.theme);}catch{}V.applyTheme();}if(v5==='note')V.note(note);if(v5==='note-to-mix'){V.excluded.delete(note);V.resultLimit=24;V.selected.add(note);closeModal();go('alchemy');}if(v5==='mix'){V.excluded.delete(note);V.resultLimit=24;V.selected.has(note)?V.selected.delete(note):V.selected.add(note);V.updateMix();}if(v5==='reset-search'){V.search='';V.limit=48;render();document.querySelector('#v5-note-search')?.focus({preventScroll:true});}if(v5==='clear'){V.selected.clear();V.excluded.clear();V.updateMix();}if(v5==='mode'){V.mode=value;V.resultLimit=24;V.updateMix();}if(v5==='more-results'){V.resultLimit+=24;document.querySelector('#v5-mix-results').innerHTML=V.resultHTML();}if(v5==='more-note-results')V.note(note,Number(b.dataset.limit)+24);if(v5==='more-notes'){V.limit+=48;document.querySelector('#v5-note-picker').innerHTML=V.picker();b.hidden=V.filteredNotes().length<=V.limit;document.querySelector('#v5-note-count').textContent=V.noteStatus();}if(v5==='exclude-remove'){V.excluded.delete(note);V.updateMix();}});
 document.addEventListener('input',e=>{if(e.target.id==='v5-note-search'){V.search=e.target.value;V.limit=48;document.querySelector('#v5-note-picker').innerHTML=V.picker();document.querySelector('[data-v5=more-notes]').hidden=V.filteredNotes().length<=V.limit;document.querySelector('#v5-note-count').textContent=V.noteStatus();}});
 document.addEventListener('change',e=>{if(e.target.id==='v5-exclude'&&e.target.value){V.resultLimit=24;V.excluded.add(e.target.value);V.selected.delete(e.target.value);V.updateMix();}});
 render();
})();
