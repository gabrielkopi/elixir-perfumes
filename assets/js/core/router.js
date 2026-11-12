'use strict';
/* Rotas por hash (#pagina/resto). As views registram as próprias rotas; o core só conhece a tabela §1 para dar um aviso gracioso. */
let route={page:'home',id:''};
const Router={
 routes:{},
 dir:'none',origin:'explore',idx:0,pending:null,pendingScroll:null,queued:null,hash:'',
 /* Tabela §1: layout, aba e título padrão de cada página (usados quando a view ainda não existe). */
 table:{
  home:['tab','home','Início'],explore:['tab','explore','Descobrir'],ingredients:['tab','explore','Notas'],brands:['tab','explore','Marcas'],edits:['tab','explore','Edições'],
  ingredient:['push','explore','Nota'],family:['push','explore','Família'],brand:['push','explore','Marca'],edit:['push','explore','Edição'],perfume:['push','origin','Perfume'],
  guide:[id=>/^(me|gift)\//.test(id)?'full':id==='results'?'push':'tab','guide','Guia'],
  today:['push','guide','Hoje'],bubble:['push','guide','Fora da Bolha'],circle:['push','guide','Meu círculo'],
  connect:[id=>/^store\//.test(id)?'full':'push',id=>/^store\//.test(id)?'none':'guide','ELIXIR Connect'],
  map:['push','profile','Mapa olfativo'],compare:['push','origin','Comparar'],welcome:['full','none','Boas-vindas'],refine:['full','profile','Refinar meu mapa'],
  collection:['tab','collection','Coleção'],list:['push','collection','Lista'],profile:['tab','profile','Perfil'],person:['push','origin','Perfil']
 },
 NAVS:['home','explore','guide','collection','profile','none','origin'],
 /* layout, nav e title podem ser valores ou funções (id)=>valor. */
 add(page,{view,title='',layout,nav,after,placeholder=false}={}){
  const t=this.table[page];
  const L=layout===undefined?(t?t[0]:'push'):layout,N=nav===undefined?(t?t[1]:'origin'):nav;
  this.routes[page]={page,view,title:title||(t?t[2]:''),layout:L,nav:N,after,placeholder};},
 has(page){return !!this.routes[page];},
 def(page){return this.routes[page]||this.routes.home||{page:'home',layout:'tab',nav:'home',title:'Início',view:()=>''};},
 val(v,id){try{return typeof v==='function'?v(id):v;}catch(e){return '';}},
 layoutOf(page=route.page,id=route.id){const v=this.val(this.def(page).layout,id);return ['tab','push','full'].includes(v)?v:'tab';},
 /* Aba da rota; 'origin' resolve para a última aba (Router.origin). */
 navOf(page=route.page,id=route.id){let v=this.val(this.def(page).nav,id);if(!this.NAVS.includes(v))v='origin';return v==='origin'?this.origin:v;},
 title(page=route.page,id=route.id){const v=this.val(this.def(page).title,id);return String(v||'');},
 href(page,id=''){return '#'+page+(id?'/'+encodeURIComponent(id).replace(/%2C/gi,',').replace(/%2F/gi,'/'):'');},
 parse(hash=location.hash){const raw=String(hash||'').replace(/^#/,'');if(!raw)return {page:'home',id:''};
  const i=raw.indexOf('/'),page=i<0?raw:raw.slice(0,i);let id=i<0?'':raw.slice(i+1);try{id=decodeURIComponent(id);}catch(e){}
  return this.routes[page]?{page,id}:{page:'home',id:''};},
 sheetEntry(){return !!(history.state&&history.state.sheet);},
 go(page,id='',{replace=false}={}){
  if(typeof Sheet!=='undefined'&&Sheet.backPending){this.queued=()=>this.go(page,id,{replace});return;}
  const fromSheet=this.sheetEntry();
  if(typeof Sheet!=='undefined'&&Sheet.isOpen())Sheet.close({force:true,keepHistory:true});
  const hash=this.href(page,id),same=this.parse(hash),cur=this.parse();
  if(same.page===cur.page&&same.id===cur.id&&(location.hash===hash||!location.hash&&page==='home')){
   if(fromSheet)history.replaceState({...history.state,sheet:0},'');
   App.render({transition:false});return;}
  this.pending={replace:replace||fromSheet,fromSheet};
  if(replace||fromSheet)location.replace(hash);else location.hash=hash;},
 /* Sincroniza o hash sem desenhar (segmentos refletidos na URL). */
 replace(page,id=''){const hash=this.href(page,id);try{history.replaceState({...(history.state||{}),idx:this.idx},'',hash);}catch(e){}route={page,id};this.hash=hash;this.setTitle();},
 back(fallback=['home','']){if(this.idx>0)history.back();else this.go(fallback[0],fallback[1]||'',{replace:true});},
 setTitle(){const t=this.title(),brand=typeof BRAND!=='undefined'?BRAND.name:'ELIXIR';document.title=route.page==='home'||!t?brand:t+' · '+brand;},
 scrolls(){try{return JSON.parse(sessionStorage.getItem('elixir-scroll')||'{}')||{};}catch(e){return {};}},
 rememberScroll(hash){if(!hash)return;try{const m=this.scrolls();m[hash]=Math.round(scrollY);const keys=Object.keys(m);if(keys.length>60)delete m[keys[0]];sessionStorage.setItem('elixir-scroll',JSON.stringify(m));}catch(e){}},
 onHash(){
  const raw=location.hash.replace(/^#/,''),page=raw.split('/')[0];
  /* âncoras internas (ex.: #main) não são rotas */
  if(raw&&!this.routes[page]&&document.getElementById(raw)){try{history.replaceState(history.state,'',this.hash||'#home');}catch(e){}return;}
  const prev={...route},st=history.state||{};
  this.rememberScroll(this.hash);
  let idx,dir;
  if(typeof st.idx==='number'){idx=st.idx;dir=idx<this.idx?'back':'forward';}
  else{idx=this.pending&&this.pending.replace&&!this.pending.fromSheet?this.idx:this.idx+1;dir='forward';try{history.replaceState({...st,idx,sheet:0},'');}catch(e){}}
  this.pending=null;
  route=this.parse();this.hash=location.hash||'#home';
  if(prev.page===route.page&&prev.id===route.id&&dir!=='back'){this.idx=idx;return;}
  const la=this.layoutOf(prev.page,prev.id),lb=this.layoutOf(),na=this.val(this.def(prev.page).nav,prev.id),nb=this.val(this.def(route.page).nav,route.id);
  if(la==='tab'&&lb==='tab'&&na!==nb)dir='tab';
  this.idx=idx;this.dir=dir;
  if(lb==='tab'){const n=this.val(this.def(route.page).nav,route.id);if(this.NAVS.includes(n)&&n!=='origin'&&n!=='none')this.origin=n;}
  const saved=this.scrolls()[this.hash];
  this.pendingScroll=dir==='back'||dir==='tab'?(Number(saved)||0):0;
  App.render({transition:true,dir});
 },
 onPop(){
  if(typeof Sheet!=='undefined'){
   if(Sheet.backPending){Sheet.backPending=false;const q=this.queued;this.queued=null;if(q)q();return;}
   if(Sheet.isOpen()&&!this.sheetEntry())Sheet.close({fromPop:true});
  }
 },
 start(){
  for(const page of Object.keys(this.table))if(!this.routes[page])this.add(page,{placeholder:true,view:id=>App.placeholder(page,id)});
  addEventListener('hashchange',()=>this.onHash());
  addEventListener('popstate',()=>this.onPop());
  addEventListener('pagehide',()=>this.rememberScroll(this.hash));
  route=this.parse();this.hash=location.hash||'#home';
  const st=history.state||{};
  if(typeof st.idx==='number')this.idx=st.idx;
  try{history.replaceState({...st,idx:this.idx,sheet:0},'');}catch(e){}
  const lb=this.layoutOf();if(lb==='tab'){const n=this.val(this.def(route.page).nav,route.id);if(n&&n!=='origin'&&n!=='none')this.origin=n;}
  this.dir='none';this.pendingScroll=Number(this.scrolls()[this.hash])||0;
 }
};
