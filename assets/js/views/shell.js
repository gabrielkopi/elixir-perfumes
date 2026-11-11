'use strict';
/* Shell: barra superior, barra de abas, bandeja de comparação, faixa de blur inferior e região de anúncio. */
const Shell={
 TABS:[{id:'home',label:'Início',icon:'home',fill:'home-fill'},{id:'explore',label:'Descobrir',icon:'search'},{id:'guide',label:'Guia',icon:'sparkle'},{id:'collection',label:'Coleção',icon:'bookmark',fill:'bookmark-fill'},{id:'profile',label:'Perfil'}],
 GUIDE_LABEL:'Guia: saiba qual perfume comprar',
 unread(){try{return typeof Activity!=='undefined'&&typeof Activity.unread==='function'?Math.max(0,Number(Activity.unread())||0):0;}catch(e){return 0;}},
 key(){return Router.layoutOf();},
 bell(cls=''){const n=this.unread();return UI.iconBtn('bell',{action:'activity',bare:true,cls,label:n?`Atividade, ${n} ${n===1?'nova':'novas'}`:'Atividade'}).replace('</button>',n?'<i class="dot-unread" aria-hidden="true"></i></button>':'</button>');},
 topbar(){
  const L=Router.layoutOf(),nav=Router.navOf(),page=route.page,title=Router.title();
  const left=L==='push'?`<span class="tb-m">${UI.back()}</span>`:'';
  const mark=`<a class="wordmark${L==='push'?' tb-d':''}" href="#home" aria-label="${esc(BRAND.name)}, início">${esc(BRAND.name)}</a>`;
  const navItems=this.TABS.filter(t=>t.id!=='profile').map(t=>({id:t.id,label:t.label,href:'#'+t.id,title:t.id==='guide'?this.GUIDE_LABEL:''}));
  const home=page==='home',onProfile=page==='profile';
  const right=[
   UI.iconBtn('search',{action:'search',bare:true,cls:'tb-d',label:'Buscar'}),
   this.bell(home?'':'tb-d'),
   UI.iconBtn('plus',{action:'sotd',bare:true,cls:home?'':'tb-d',label:'Usando hoje'}),
   onProfile?UI.iconBtn('settings',{action:'settings',bare:true,label:'Ajustes'}):'',
   `<a class="tb-avatar tb-d" href="#profile" aria-label="Perfil"${nav==='profile'?' aria-current="page"':''}>${UI.avatar(null,'sm')}</a>`
  ].join('');
  return `<header class="topbar glass"><div class="tb-side">${left}${mark}</div><div class="title" aria-hidden="true">${esc(home?'Hoje':title)}</div><div class="tb-nav">${UI.segNav(navItems,['home','explore','guide','collection'].includes(nav)?nav:'',{label:'Principal'})}</div><div class="tb-side tb-end">${right}</div></header>`;},
 tabbar(){const nav=Router.navOf();
  const ti=this.TABS.findIndex(t=>t.id===nav),lens=ti<0||nav==='guide'?'off':'on';
  return `<nav class="tabbar glass" aria-label="Principal" style="--ti:${Math.max(0,ti)}" data-lens="${lens}">${this.TABS.map(t=>{const on=nav===t.id,cur=on?' aria-current="page"':'';
   if(t.id==='guide')return `<a class="center pressable" href="#guide" aria-label="${esc(this.GUIDE_LABEL)}"${cur}>${icon('sparkle')}</a>`;
   if(t.id==='profile')return `<a class="pressable" href="#profile"${cur}>${UI.avatar(null,'xs')}<span>${t.label}</span></a>`;
   return `<a class="pressable" href="#${t.id}"${cur}>${icon(on&&t.fill?t.fill:t.icon)}<span>${t.label}</span></a>`;}).join('')}</nav>`;},
 /* Bandeja "Comparar (n)": oculta em compare, welcome, refine, modo loja e passos do Guia; visível em guide/results. */
 trayVisible(){const n=state.compare.length,p=route.page,id=route.id;if(n<1)return false;
  if(['compare','welcome','refine'].includes(p))return false;if(p==='connect'&&/^store\//.test(id))return false;if(p==='guide'&&/^(me|gift)\//.test(id))return false;return true;},
 tray(){if(!this.trayVisible())return '';const ids=state.compare;
  return `<div class="tray glass" role="region" aria-label="Comparação"><a class="tray-go pressable" href="${esc(Router.href('compare',ids.join(',')))}">Comparar (${ids.length})${icon('chevron-right')}</a>${UI.iconBtn('close',{action:'tray-clear',bare:true,label:'Limpar comparação'})}</div>`;},
 backRow(){return Router.layoutOf()==='push'?`<div class="back-row"><button type="button" class="btn btn--tertiary pressable" data-action="back">${icon('chevron-left')}<span>Voltar</span></button></div>`:'';},
 render(body){return `<a class="skip" href="#main" data-action="skip">Pular para o conteúdo</a>${this.topbar()}<main id="main" tabindex="-1">${this.backRow()}${body}</main>${this.tabbar()}${this.tray()}<p class="sr-only" id="route-live" aria-live="polite"></p><div class="fade-b" aria-hidden="true"></div>`;},
 announce(text){const el=document.getElementById('route-live');if(!el)return;el.textContent='';setTimeout(()=>{el.textContent=text;},60);}
};
