'use strict';
/* Todas as interações passam por aqui: data-action="nome" chama Actions.nome(el, event). */
const Actions={
 /* Navegação */
 nav:el=>Router.go(el.dataset.page,el.dataset.id||''),
 back:()=>Router.back(),
 perfume:el=>{Perfume.performance='Geral';Router.go('perfume',el.dataset.id);},
 person:el=>Router.go('person',el.dataset.id),
 list:el=>Router.go('list',el.dataset.name),
 'rate-perfume':el=>Router.go('rate',el.dataset.id),
 'close-link':()=>Modal.dismiss(),
 'search-go':el=>{Search.remember(el.getAttribute('href'));Modal.dismiss();},
 close:()=>Modal.close(),
 theme:()=>Theme.toggle(),
 search:()=>Search.open(),
 activity:()=>Activity.open(),
 settings:()=>Compose.settings(),

 /* Social: atualiza no lugar, sem redesenhar a página. */
 like(el){const id=el.dataset.id,on=!state.likes.includes(id);Store.update(s=>{s.likes=toggle(s.likes,id);},{silent:true});
  $$(`[data-action=like][data-id="${CSS.escape(id)}"]`).forEach(b=>{b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);Motion.pop(b);});
  const post=Posts.find(id);if(post)$$(`[data-likes="${CSS.escape(id)}"]`).forEach(n=>n.textContent=compact(Posts.likes(post)));},
 'save-post'(el){const id=el.dataset.id,on=!state.saved.includes(id);Store.update(s=>{s.saved=toggle(s.saved,id);},{silent:true});$$(`[data-action=save-post][data-id="${CSS.escape(id)}"]`).forEach(b=>{b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);Motion.pop(b);});toast(on?'Publicação salva.':'Removida dos salvos.',{undo:()=>Actions['save-post'](el)});if(Feed.filter==='Salvos'&&route.page==='home')App.render();},
 'post-media'(el,e){const now=performance.now();if(el._t&&now-el._t<320){clearTimeout(el._open);el._t=0;if(!state.likes.includes(el.dataset.id))Actions.like(el);Motion.burst(el,e.clientX,e.clientY);return;}el._t=now;el._open=setTimeout(()=>{el._t=0;Actions['open-post'](el);},320);},
 'open-post'(el){const p=Posts.find(el.dataset.id);if(p)openModal('Publicação',`<div class="post-modal">${Feed.post(p)}</div>`,{cls:'post-dialog'});},
 follow(el){const id=el.dataset.id,on=!state.following.includes(id);Store.update(s=>{s.following=toggle(s.following,id);});toast(on?'Seguindo.':'Você deixou de seguir.');},
 comments:el=>Compose.comments(el.dataset.id),
 'share-post':el=>Compose.share('#home'),
 'share-profile':el=>Compose.share('#person/'+el.dataset.id),
 share:el=>Compose.share('#perfume/'+el.dataset.id),
 'copy-share':()=>Compose.copy(),
 publish:()=>Compose.publish(),
 atmosphere(el){Compose.photo='assets/products/'+el.dataset.value+'.jpg';$('#publish-preview').src=Compose.photo;$$('[data-action=atmosphere]').forEach(b=>b.classList.toggle('active',b===el));},
 story:el=>Stories.open(el.dataset.id),
 product:el=>Explore.product(el.dataset.id),
 shelf(el){const id=el.dataset.id,on=!state.socialShelf.includes(id);Store.update(s=>{s.socialShelf=toggle(s.socialShelf,id);});if($('#modal').open&&$('.sheet'))Explore.product(id);toast(on?'Salvo na sua coleção.':'Removido da coleção.');},

 /* Filtros e abas */
 'feed-filter':el=>{Feed.filter=el.dataset.value;App.render();},
 'profile-tab':el=>{Profile.tab=el.dataset.value;App.render();},
 'person-tab':el=>{Profile.personTab=el.dataset.value;App.render();},
 'radar-mode':el=>{Radar.mode=el.dataset.value;App.render();},
 'catalog-audience':el=>{Explore.audience=el.dataset.value;Explore.limit=24;App.render();},
 'catalog-more':()=>Explore.loadMore(),
 'catalog-filter':el=>{Explore.filter=Explore.filter===el.dataset.value?'':el.dataset.value;Explore.limit=24;App.render();},
 'note-group':el=>{Notes.group=el.dataset.value;App.render();},
 performance(el){Perfume.performance=el.dataset.value;$$('[data-action=performance]').forEach(b=>b.classList.toggle('active',b===el));$('#perf-metrics').outerHTML=Perfume.metrics(el.dataset.id);},

 /* Coleção */
 favorite(el){const id=el.dataset.id,on=!state.favorites.includes(id);Store.update(s=>{s.favorites=toggle(s.favorites,id);s.lists.Favoritos=[...s.favorites];},{silent:true});$$(`[data-action=favorite][data-id="${CSS.escape(id)}"]`).forEach(b=>{b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);Motion.pop(b);});toast(on?'Adicionado aos favoritos.':'Removido dos favoritos.');},
 'add-list':el=>Collection.lists(el.dataset.id),
 'toggle-list'(el){const {id,name}=el.dataset;Store.update(s=>{s.lists[name]=toggle(s.lists[name],id);if(name==='Favoritos')s.favorites=[...s.lists[name]];},{silent:true});el.classList.toggle('active');},
 'new-list':()=>Compose.newList(),
 'list-remove'(el){const {id,name}=el.dataset;Store.update(s=>{s.lists[name]=s.lists[name].filter(x=>x!==id);if(name==='Favoritos')s.favorites=[...s.lists[name]];});toast('Removido da lista.',{undo:()=>Store.update(s=>{s.lists[name].push(id);if(name==='Favoritos')s.favorites=[...s.lists[name]];})});},
 'compare-add':el=>Compare.add(el.dataset.id),
 compare:()=>Compare.show(),
 'compare-clear':()=>{Compare.ids=[];App.render();},

 /* Perfil e dados */
 'profile-photo-remove':()=>{Compose.photoDraft='';$('.settings-avatar .avatar').outerHTML=`<span class="avatar lg">${esc(state.name.slice(0,2).toUpperCase())}</span>`;},
 export:()=>Compose.export(),
 'reset-dialog':()=>openModal('Restaurar dados?',`<p class="muted">Suas avaliações, listas e publicações locais serão apagadas.</p><div class="row">${btn('Restaurar','reset')}${btn('Cancelar','close','','ghost')}</div>`),
 reset:()=>{Compare.ids=[];Modal.dismiss();Store.reset();Router.go('home');toast('Dados restaurados.');},
 demo:()=>{Store.update(s=>{s.onboarded=true;});Router.go('home');},

 /* Descoberta */
 'discovery-start':()=>Discovery.begin(),
 'discovery-cancel':()=>Discovery.cancel(),
 'discovery-next':()=>Discovery.go(Discovery.step+1),
 'discovery-back':()=>Discovery.go(Discovery.step-1),
 'discovery-done':()=>Discovery.finish(),
 'discovery-style':el=>{Discovery.draft.styles=toggle(Discovery.draft.styles,el.dataset.id);App.render();},
 'discovery-tone':el=>{Discovery.tone=el.dataset.value;App.render();},
 'discovery-note'(el){const d=Discovery.draft,key=Discovery.tone+'Notes',other=key==='likedNotes'?'dislikedNotes':'likedNotes';d[key]=toggle(d[key],el.dataset.value);d[other]=d[other].filter(x=>x!==el.dataset.value);App.render();},
 'discovery-perfume':el=>openModal(esc(byId(el.dataset.id).name),`<div class="score-options">${[[10,'Amo'],[8,'Gosto'],[5,'Indiferente'],[2,'Não gosto']].map(([r,t])=>`<button data-action="discovery-rating" data-id="${el.dataset.id}" data-value="${r}" class="${Discovery.draft.ratings[el.dataset.id]===r?'active':''}">${t}</button>`).join('')}</div>`),
 'discovery-rating':el=>{Discovery.draft.ratings[el.dataset.id]=Number(el.dataset.value);Modal.close();App.render();},
 'discovery-intensity':el=>{Discovery.draft.intensity=el.dataset.value;App.render();},
 'discovery-occasion':el=>{Discovery.draft.context.occasion=el.dataset.value;App.render();},
 'discovery-time':el=>{Discovery.draft.context.time=el.dataset.value;App.render();}
};

document.addEventListener('click',e=>{
 if(e.target.closest('.skip')){e.preventDefault();$('#main')?.focus();return;}
 const el=e.target.closest('[data-action]');if(!el||el.closest('#stories')&&el.dataset.action.startsWith('story-'))return;
 const fn=Actions[el.dataset.action];if(!fn)return;
 if(el.tagName==='A'&&!['search-go','close-link','story-profile'].includes(el.dataset.action))e.preventDefault();
 fn(el,e);
});
document.addEventListener('keydown',e=>{
 if($('#stories')&&!$('#stories').hidden){Stories.key(e);return;}
 if(e.target.matches?.('.post-media')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();Actions['open-post'](e.target);}
 if(e.target.id==='palette-input')Search.key(e);
 const typing=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)||e.target.isContentEditable;
 if(!typing&&(e.key==='/'||(e.key==='k'&&(e.ctrlKey||e.metaKey)))){e.preventDefault();Search.open();}
 if(!typing&&e.key==='n'&&!e.ctrlKey&&!e.metaKey&&!$('#modal').open&&state.onboarded){Compose.publish();}
});
document.addEventListener('input',e=>{const t=e.target;
 if(t.id==='catalog-search'){Explore.query=t.value;Explore.limit=24;Explore.refresh();}
 if(t.id==='ingredient-search'){Notes.query=t.value;$('#ingredient-grid').innerHTML=Notes.cards();Motion.reveal();}
 if(t.id==='rate-search'){const q=t.value.toLowerCase();$('#rate-results').innerHTML=Rate.rows(PERFUMES.filter(p=>(p.name+' '+p.brand).toLowerCase().includes(q)).slice(0,60));}
 if(t.id==='discovery-search'){Discovery.query=t.value;$('#discovery-catalog').innerHTML=Discovery.catalog();}
 if(t.id==='palette-input')Search.input(t.value);
 if(t.name==='rating'&&t.type==='range'){$('#rating-value').textContent=t.value;t.style.setProperty('--v',t.value*10+'%');}
});
document.addEventListener('change',async e=>{const t=e.target;
 try{
  if(t.id==='photo-upload'&&t.files[0]){Compose.photo=await readImage(t.files[0]);$('#publish-preview').src=Compose.photo;$$('[data-action=atmosphere]').forEach(b=>b.classList.remove('active'));}
  if(t.id==='profile-photo-input'&&t.files[0]){Compose.photoDraft=await readImage(t.files[0],{max:320,square:true,limit:8});$('.settings-avatar .avatar').outerHTML=`<span class="avatar lg has-photo"><img src="${Compose.photoDraft}" alt=""></span>`;}
 }catch(err){toast(err.message.startsWith('Escolha')?err.message:'Não foi possível abrir essa imagem.');}
});
document.addEventListener('submit',e=>{const f=e.target,handlers={'publish-form':()=>Compose.submitPost(f),'comment-form':()=>Compose.submitComment(f),'profile-form':()=>Compose.submitProfile(f),'list-form':()=>Compose.submitList(f),'rating-form':()=>Rate.save(f)};if(handlers[f.id]){e.preventDefault();handlers[f.id]();}});
/* Imagem quebrada vira um bloco neutro com o nome do produto. */
document.addEventListener('error',e=>{const img=e.target;if(img.tagName!=='IMG'||img.dataset.failed)return;img.dataset.failed='1';const d=document.createElement('div');d.className='fallback';d.textContent=img.dataset.product?byId(img.dataset.product)?.name||'':'';img.replaceWith(d);},true);
