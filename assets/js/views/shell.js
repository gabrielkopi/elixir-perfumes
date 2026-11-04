'use strict';
/* Estrutura da página: navegação lateral, coluna central, sugestões e barra inferior. */
const Shell={
 items:[['home','home','Início'],['explore','search','Explorar'],['ingredients','drop','Notas'],['collection','bookmark','Coleção'],['profile','user','Perfil']],
 nav(only){const current=Router.current().nav;return this.items.filter(([p])=>!only||only.includes(p)).map(([page,ic,label])=>{const active=current===page;return `<button data-action="nav" data-page="${page}" class="${active?'active':''}" ${active?'aria-current="page"':''} aria-label="${label}">${page==='profile'?UI.avatar(null):icon(ic)}<span>${label}</span></button>`;}).join('');},
 unread(){return Activity.unread()?'<i class="dot" aria-label="Novidades"></i>':'';},
 rail(){const next=Select.ranked().filter(x=>state.ratings[x.p.id]===undefined).slice(0,3),people=People.suggestions();return `<a class="rail-me" href="#profile">${UI.avatar(null)}<span><strong>${esc(Select.handle())}</strong><small>${esc(state.name)}</small></span></a>${people.length?`<section class="rail-block"><h3>Sugestões para você</h3>${people.map(p=>`<div class="rail-person"><a href="#person/${p.id}">${UI.avatar(p)}<span><strong>${esc(p.handle)}${p.verified?UI.badge():''}</strong><small>${esc(p.family)}</small></span></a><button class="link" data-action="follow" data-id="${p.id}">Seguir</button></div>`).join('')}</section>`:''}<section class="rail-block"><h3>Para experimentar</h3>${next.map(x=>UI.perfumeRow(x.p,{trail:`<em>${x.score}</em>`})).join('')}</section><p class="rail-foot">${BRAND.name} · <kbd>/</kbd> para buscar</p>`;},
 render(body){const layout=Router.current().layout;return `<div class="app" data-layout="${layout}">
<aside class="sidebar"><a href="#home" class="wordmark" aria-label="${BRAND.name}">${BRAND.name}</a><a href="#home" class="monogram" aria-label="${BRAND.name}">${BRAND.monogram}</a>
<nav class="side-nav" aria-label="Principal">${this.nav()}<button data-action="search" aria-label="Buscar">${icon('search')}<span>Buscar</span></button><button data-action="activity" aria-label="Atividade">${icon('bell')}<span>Atividade</span>${this.unread()}</button><button class="create" data-action="publish" aria-label="Publicar">${icon('plus')}<span>Publicar</span></button></nav>
<div class="side-foot"><button data-action="theme">${Theme.button()}</button><button data-action="settings">${icon('settings')}<span>Ajustes</span></button></div></aside>
<header class="mobile-head"><a href="#home" class="wordmark">${BRAND.name}</a><div><button class="icon-btn" data-action="search" aria-label="Buscar">${icon('search')}</button><button class="icon-btn" data-action="activity" aria-label="Atividade">${icon('bell')}${this.unread()}</button><button class="icon-btn" data-action="theme" aria-label="Alternar tema">${Theme.button()}</button></div></header>
<main id="main" tabindex="-1">${body}</main>
${layout==='social'?`<aside class="rail" id="rail">${this.rail()}</aside>`:''}
<nav class="tabbar" aria-label="Principal">${this.nav(['home','explore'])}<button class="tab-create" data-action="publish" aria-label="Publicar">${icon('plus')}</button>${this.nav(['collection','profile'])}</nav>
${Compare.tray()}</div>`;}
};
