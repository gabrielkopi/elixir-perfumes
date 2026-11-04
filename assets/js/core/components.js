'use strict';
/* Peças de interface reutilizadas pelas telas. */
const UI={
 avatar(user,cls=''){
  if(!user&&state.photo)return `<span class="avatar ${cls} has-photo"><img src="${esc(state.photo)}" alt=""></span>`;
  if(user?.image)return `<span class="avatar ${cls} has-photo"><img src="${esc(user.image)}" alt=""></span>`;
  return `<span class="avatar ${cls}" style="--avatar:${user?.color||'var(--accent)'}">${esc(user?.initials||state.name.slice(0,2).toUpperCase())}</span>`;
 },
 photo(p){return p.image?`<img src="${p.image}" alt="${esc(p.brand+' '+p.name)}" loading="lazy" data-product="${p.id}">`:`<div class="fallback"><span>${esc(p.name)}</span></div>`;},
 thumb(src){return src?`<img src="${esc(src)}" alt="" loading="lazy">`:'<span class="ph"></span>';},
 badge(){return '<svg class="verified" viewBox="0 0 24 24" role="img" aria-label="Verificado"><path fill="currentColor" d="m12 1 3 2 3.5.5 1 3.5 2.5 3-1.5 3.3.2 3.5-3.3 1.7-2.1 2.8-3.3-1-3.3 1-2.1-2.8-3.3-1.7.2-3.5L1 10l2.5-3 1-3.5L8 3Z"/><path d="m7.5 11.5 3 3 6-6" fill="none" stroke="var(--bg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';},
 back(){return `<button class="back" data-action="back">${icon('back')}<span>Voltar</span></button>`;},
 tabs(items,active,action,cls=''){return `<nav class="tabs ${cls}" role="tablist">${items.map(t=>`<button role="tab" data-action="${action}" data-value="${esc(t)}" class="${active===t?'active':''}" aria-selected="${active===t}">${esc(t)}</button>`).join('')}</nav>`;},
 empty(title,text='',action=''){return `<div class="empty">${title?`<h2>${title}</h2>`:''}${text?`<p>${text}</p>`:''}${action}</div>`;},
 bars(values,limit=5){return `<div class="bars">${values.map((v,i)=>({name:DIMENSIONS[i],value:v})).sort((a,b)=>b.value-a.value).slice(0,limit).map(x=>`<div><span>${x.name}</span><i><b style="width:${x.value}%"></b></i><em>${x.value}</em></div>`).join('')}</div>`;},
 /* Cartão de perfume do catálogo. */
 card(p){const fav=state.favorites.includes(p.id),score=Select.recommend(p).score;return `<article class="pcard" data-reveal><button class="pcard-media" data-action="perfume" data-id="${p.id}" aria-label="Abrir ${esc(p.name)}">${this.photo(p)}</button><button class="pcard-save ${fav?'on':''}" data-action="favorite" data-id="${p.id}" aria-label="${fav?'Remover dos':'Adicionar aos'} favoritos" aria-pressed="${fav}">${icon('heart')}</button><button class="pcard-info" data-action="perfume" data-id="${p.id}"><small>${esc(p.brand)}</small><strong>${esc(p.name)}</strong><span>${score}% afinidade</span></button></article>`;},
 personRow(u){const c=Engine.compatibility(state.ratings,u),f=state.following.includes(u.id);return `<div class="rail-person"><a href="#person/${u.id}">${this.avatar(u)}<span><strong>${esc(u.name)}</strong><small>${c.score}% afinidade</small></span></a><button class="link" data-action="follow" data-id="${u.id}" aria-pressed="${f}">${f?'Seguindo':'Seguir'}</button></div>`;},
 perfumeRow(p,{action='perfume',trail=''}={}){return `<button class="row-item" data-action="${action}" data-id="${p.id}">${this.thumb(p.image)}<span><strong>${esc(p.name)}</strong><small>${esc(p.brand)}</small></span>${trail}</button>`;},
 preference(n){return n>=9?'Amo':n>=7?'Gosto':n>=5?'Indiferente':'Não gosto';}
};
const avatar=(u,c)=>UI.avatar(u,c),card=p=>UI.card(p),back=()=>UI.back();
