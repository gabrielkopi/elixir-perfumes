'use strict';
/* Rotas por hash (#pagina/id). Cada tela se registra com sua função de render. */
let route={page:'home',id:''};
const Router={
 routes:{},
 /* layout: 'social' mostra a coluna de sugestões; 'wide' ocupa a largura toda. */
 add(page,{view,title,layout='wide',nav=page,after}){this.routes[page]={view,title,layout,nav,after};},
 current(){return this.routes[route.page]||this.routes.home;},
 parse(){const [page,id]=(location.hash.slice(1)||'home').split('/');let value='';try{value=decodeURIComponent(id||'');}catch{}return {page:this.routes[page]?page:'home',id:value};},
 href(page,id){return '#'+page+(id?'/'+encodeURIComponent(id):'');},
 go(page,id=''){Modal.dismiss();const hash=this.href(page,id);if(location.hash===hash)App.render();else location.hash=hash;},
 back(){if(this.depth>0)history.back();else this.go('home');},
 depth:0,
 start(){addEventListener('hashchange',()=>{Modal.dismiss();const next=this.parse();const same=next.page===route.page&&next.id===route.id;route=next;this.depth++;App.render({transition:!same});if(!same)scrollTo({top:0,behavior:'instant'});});route=this.parse();}
};
