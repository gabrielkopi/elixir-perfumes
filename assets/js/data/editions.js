'use strict';
/* Edições editoriais de Descobrir (§4.7). Só declara dados ao carregar (o deck de apresentação também lê este arquivo).
   cover = id de capa de PROFILE_RULES.covers; dimension = índice em DIMENSIONS; query opcional. */
const EDITIONS=[
 {id:'verao',title:'Verão 26',thesis:'Água, sal e casca de fruta. Perfumes que respiram junto com o calor.',cover:'pool',months:[12,1,2],dimension:8,query:{}},
 {id:'depois-das-oito',title:'Depois das oito',thesis:'Âmbar, especiarias e madeira morna. Para quando a luz baixa.',cover:'night',months:[1,2,3,4,5,6,7,8,9,10,11,12],dimension:14,query:{}},
 {id:'verde-absoluto',title:'Verde absoluto',thesis:'Folha amassada, caule e terra molhada. Um respiro fora do óbvio.',cover:'forest',months:[1,2,3,4,5,6,7,8,9,10,11,12],dimension:1,query:{}},
 {id:'pele-e-memoria',title:'Pele e memória',thesis:'Almíscar e madeiras macias. O perfume que parece a sua própria pele.',cover:'woody',months:[1,2,3,4,5,6,7,8,9,10,11,12],dimension:15,query:{}},
 {id:'dias-de-sol',title:'Dias de sol',thesis:'Limão, bergamota e luz. Deixe o dia acontecer.',cover:'citrus',months:[10,11,12,1,2,3],dimension:0,query:{}},
 {id:'inverno',title:'Frio bom',thesis:'Canela, cravo e calor de lã. Para dias que pedem abraço.',cover:'rain',months:[5,6,7,8],dimension:10,query:{}},
 {id:'nacionais',title:'Feito no Brasil',thesis:'Casas brasileiras, do clássico ao inesperado.',cover:'flowers',months:[1,2,3,4,5,6,7,8,9,10,11,12],dimension:null,query:{national:true}},
 {id:'trabalho',title:'Para o escritório',thesis:'Limpos, aromáticos e discretos. Presença sem invadir a sala.',cover:'city',months:[1,2,3,4,5,6,7,8,9,10,11,12],dimension:2,query:{}}
];
const Editions={
 get(id){return EDITIONS.find(e=>e.id===id)||null;},
 /* As do mês primeiro, depois as demais, na ordem editorial. */
 current(date=new Date()){const m=date.getMonth()+1,now=EDITIONS.filter(e=>e.months.includes(m));return [...now,...EDITIONS.filter(e=>!now.includes(e))];},
 /* Itens: ranking pessoal filtrado pela dimensão (≥ .5) e pela query; até 24. */
 items(id){const e=this.get(id);if(!e||typeof PERFUMES==='undefined')return [];
  const ranked=typeof Select!=='undefined'&&Select.ranked?Select.ranked().map(x=>x.p):PERFUMES;const q=e.query||{};
  const national=p=>typeof Catalog!=='undefined'&&Catalog.isNational?Catalog.isNational(p):['Natura','O Boticário','Granado','Eudora','Jequiti'].includes(p.brand);
  const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  return ranked.filter(p=>p&&(e.dimension===null||e.dimension===undefined||(p.vector[e.dimension]||0)>=.5)
   &&(!q.national||national(p))
   &&(!q.families||q.families.some(f=>norm(p.family).includes(norm(f))))
   &&(!q.notes||q.notes.some(n=>(p.noteWeights||[]).some(w=>norm(w.name)===norm(n))))
   &&(!q.tier||(typeof Advisor!=='undefined'&&Advisor.tier?Advisor.tier(p):null)===q.tier)).slice(0,24);},
 /* Para trilhos e intercalações: só edições com 6 ou mais perfumes. */
 rail(){return this.current().filter(e=>this.items(e.id).length>=6);}
};
