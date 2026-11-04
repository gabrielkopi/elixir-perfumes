'use strict';
/* Estado da aplicação: um único objeto, salvo no navegador, com versão e migração. */
const LIST_NAMES=['Minha coleção','Quero experimentar','Favoritos','Já experimentei','Não compraria novamente','Perfumes para o trabalho','Perfumes para o verão','Perfumes para sair à noite'];
const SANDBOX=new URLSearchParams(location.search).has('sandbox');

const Store={
 key:SANDBOX?'elixir-presentation-sandbox-v1':'elixir-demo-v1',
 version:2,
 available:true,
 listeners:new Set(),

 defaults(){const favorites=['vetiver','santal'];return {
  version:2,onboarded:true,photo:'',name:'Gabriel',username:'gabriel',bio:'Madeiras, boas histórias e novas descobertas.',fashion:'Essencial',music:'Jazz & MPB',
  ratings:{vetiver:9,santal:9,terre:8},reviews:{},favorites,
  lists:Object.fromEntries(LIST_NAMES.map(n=>[n,['Minha coleção','Favoritos','Já experimentei'].includes(n)?[...favorites]:[]])),
  following:[],likes:[],saved:[],comments:{},posts:[],socialShelf:[],seenStories:[],activitySeen:0,
  preferences:{styles:['woody'],likedNotes:['Vetiver','Sândalo','Cedro'],dislikedNotes:['Caramelo']},
  context:{city:'São Paulo',temp:22,occasion:'Todas',time:'Noite',environment:'Aberto'}
 };},

 load(){
  let s=this.defaults();
  try{
   const saved=JSON.parse(localStorage.getItem(this.key)||'null');
   if(saved&&saved.version>=1)s=this.migrate({...s,...saved});
  }catch{this.available=false;}
  s.ratings=Object.fromEntries(Object.entries(s.ratings||{}).filter(([id,r])=>byId(id)&&Number.isFinite(r)&&r>=0&&r<=10));
  for(const n of LIST_NAMES)if(!Array.isArray(s.lists[n]))s.lists[n]=[];
  return s;
 },
 /* v1 → v2: remove preferências de interface que deixaram de existir. */
 migrate(s){
  if(s.version<2){delete s.accent;delete s.socialEdition;delete s.simulation;if(s.preferences){delete s.preferences.density;delete s.preferences.feedMode;}s.seenStories=s.seenStories||[];s.activitySeen=s.activitySeen||0;s.version=2;}
  return s;
 },
 save(){try{localStorage.setItem(this.key,JSON.stringify(state));this.available=true;return true;}catch{this.available=false;return false;}},
 /* Aplica uma mudança, salva e avisa quem estiver ouvindo. */
 update(fn,{silent=false}={}){fn(state);this.save();if(!silent)this.emit();},
 reset(){state=this.defaults();this.save();this.emit();},
 on(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);},
 emit(){for(const fn of this.listeners)fn(state);}
};
let state=Store.load();

/* Seletores derivados, usados por várias telas. */
const Select={
 recommend:(p,ctx=state.context)=>Engine.recommend(p,state.ratings,ctx,state.preferences),
 ranked:(ctx=state.context)=>PERFUMES.map(p=>({p,...Engine.recommend(p,state.ratings,ctx,state.preferences)})).sort((a,b)=>b.score-a.score),
 identity:()=>Engine.identity(state.ratings,state.preferences),
 handle:()=>state.username||state.name.toLowerCase().replace(/\s/g,''),
 likedNotes:()=>(state.preferences.likedNotes?.length?state.preferences.likedNotes:Engine.favoriteNotes(state.ratings,state.preferences)).slice(0,3)
};
