'use strict';
/* Feed: stories, publicações e grade de fotos. */
const Feed={
 filter:'Para você',
 post(raw){const p=Posts.normalize(raw),a=People.author(p.user),liked=state.likes.includes(p.id),saved=state.saved.includes(p.id),comments=(state.comments[p.id]||[]).length;
  return `<article class="post" data-post="${p.id}" data-reveal>
<header class="post-head"><a href="${a.href}" class="post-author">${a.avatar}<span><strong>${esc(a.name)}${a.verified?UI.badge():''}</strong><small>${esc(p.occasion||'')}</small></span></a><time>${esc(p.when||'')}</time></header>
<div class="post-media" data-action="post-media" data-id="${p.id}" role="button" tabindex="0" aria-label="Abrir publicação de ${esc(a.name)}. Toque duas vezes para curtir."><img src="${esc(p.image)}" alt="" loading="lazy"></div>
<div class="post-bar"><button class="act ${liked?'on':''}" data-action="like" data-id="${p.id}" aria-label="Curtir" aria-pressed="${liked}">${icon('heart')}</button><button class="act" data-action="comments" data-id="${p.id}" aria-label="Comentar">${icon('comment')}</button><button class="act" data-action="share-post" data-id="${p.id}" aria-label="Compartilhar">${icon('share')}</button><button class="act end ${saved?'on':''}" data-action="save-post" data-id="${p.id}" aria-label="Salvar" aria-pressed="${saved}">${icon('bookmark')}</button></div>
<div class="post-body"><p class="post-likes"><span data-likes="${p.id}">${compact(Posts.likes(p))}</span> curtidas</p><p><a href="${a.href}"><strong>${esc(a.handle)}</strong></a> ${esc(p.text)}</p>${comments?`<button class="post-comments" data-action="comments" data-id="${p.id}">Ver ${plural(comments,'comentário','comentários')}</button>`:''}
${p.tag?`<button class="post-tag" ${p.tag.action}>${UI.thumb(p.tag.image)}<span><strong>${esc(p.tag.name)}</strong><small>${esc(p.tag.brand)}</small></span>${p.rating!==undefined?`<em>${p.rating}/10</em>`:''}${icon('chevron')}</button>`:''}</div></article>`;},
 tile(raw){const p=Posts.normalize(raw);return `<button class="tile" data-action="open-post" data-id="${p.id}" aria-label="Abrir publicação" data-reveal><img src="${esc(p.image)}" alt="" loading="lazy"><span class="tile-meta">${icon('heart')} ${compact(Posts.likes(p))}</span></button>`;},
 grid(posts,empty=''){return posts.length?`<div class="tiles">${posts.map(p=>this.tile(p)).join('')}</div>`:UI.empty('',empty);},
 view(){const list=Posts.all().filter(p=>this.filter==='Seguindo'?state.following.includes(p.user)||p.user==='me':this.filter==='Salvos'?state.saved.includes(p.id):true);
  return `${Stories.strip()}<button class="composer" data-action="publish">${UI.avatar(null)}<span>Compartilhe um momento…</span>${icon('plus')}</button>${UI.tabs(['Para você','Seguindo','Salvos'],this.filter,'feed-filter')}<div class="feed">${list.map(p=>this.post(p)).join('')||UI.empty(this.filter==='Seguindo'?'Ninguém por aqui ainda.':'Nada salvo ainda.',this.filter==='Seguindo'?'Siga perfis para ver as histórias deles.':'Toque no marcador de uma publicação para guardá-la.')}</div>${list.length?'<p class="feed-end">Você está em dia.</p>':''}`;}
};
Router.add('home',{view:()=>Feed.view(),title:'Início',layout:'social'});
