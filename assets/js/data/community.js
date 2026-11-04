'use strict';
/* Comunidade demonstrativa: pessoas, produtos indicados e publicações. */
const COMMUNITY={
 products:[
  {id:'tobacco',catalog:'tom-ford-tobacco-vanille',name:'Tobacco Vanille',brand:'Tom Ford',image:'assets/products/tobacco-vanille.png',family:'Âmbar especiado',notes:['Tabaco','Baunilha','Fava-tonka'],reason:'Tabaco macio, especiarias e uma doçura que fica na memória.',source:'https://www.tomfordbeauty.com/products/tobacco-vanille-eau-de-parfum'},
  {id:'jazz',catalog:null,name:'Jazz Club',brand:'Maison Margiela',image:'assets/products/jazz-club.jpg',family:'Amadeirado especiado',notes:['Rum','Tabaco','Baunilha'],reason:'O calor do rum e do tabaco. Como o último disco da noite.',source:'https://www.maisonmargiela-fragrances.us/fragrances/replica/replica-jazz-club/MM008.html'},
  {id:'oud',catalog:'tom-ford-oud-wood',name:'Oud Wood',brand:'Tom Ford',image:'assets/products/oud-wood.png',family:'Amadeirado',notes:['Oud','Sândalo','Cardamomo'],reason:'Madeiras e especiarias para uma presença mais contida.',source:'https://www.tomfordbeauty.com/products/oud-wood-eau-de-parfum'},
  {id:'clash-moment',catalog:'clash',name:'Clash',brand:'O Boticário',image:'assets/products/clash.jpg',family:'Fougère aromático',notes:['Notas marinhas','Lavanda','Sândalo'],reason:'Para acompanhar um dia de água e luz.',source:'https://www.boticario.com.br/clash/'},
  {id:'exclusivo',catalog:'exclusivo',name:'Essencial Exclusivo',brand:'Natura',image:'assets/catalog-photos/exclusivo.jpg',family:'Amadeirado aromático',notes:['Conhaque','Cardamomo','Cedro'],reason:'Conhaque, especiarias e madeiras para jantar e bar.',source:'https://www.natura.com.br/p/essencial-exclusivo/NATBRA-76422'}
 ],
 people:[
  {id:'vincenzo',name:'Vincenzo Saggio',handle:'vincenzosaggio',image:'assets/profiles/vincenzo-saggio.png',verified:true,role:'Estilo & perfumaria',bio:'Alfaiataria de outra época. Discos que ficam. Perfumes com história.',followers:128400,following:284,family:'Amadeirada',nuance:'Especiada · âmbar',liked:['whiskey','tabaco','noz-moscada'],disliked:['caramelo','mel','laranja-doce'],fashion:'Vintage',music:'Jazz & soul',artists:'Chet Baker · Nina Simone · Paolo Conte',picks:['tobacco','jazz','oud'],ratings:{'tom-ford-tobacco-vanille':10,'tom-ford-oud-wood':9,santal:9}},
  {id:'sofia',name:'Sofia Almeida',handle:'sofia.almeida',image:'assets/profiles/sofia.jpg',role:'Arquitetura & pequenos rituais',bio:'Luz da manhã, uma boa conversa e perfumes que abraçam.',followers:1840,following:213,family:'Floral',nuance:'Almiscarada · cítrica',liked:['neroli','jasmim','bergamota'],disliked:['oud','tabaco','cacau'],fashion:'Essencial',music:'Bossa nova',artists:'Nara Leão · João Gilberto',picks:['philosykos','clash','coolwater'],ratings:{philosykos:9,'ysl-libre':8}},
  {id:'mateo',name:'Mateo Costa',handle:'mateo.discos',image:'assets/profiles/mateo.jpg',role:'Discos, cidades & madeiras',bio:'Um lado A para cada dia. Um perfume para cada memória.',followers:3260,following:412,family:'Amadeirada',nuance:'Aromática · terrosa',liked:['vetiver','cedro','patchouli'],disliked:['caramelo','mel','ylang-ylang'],fashion:'Casual vintage',music:'Jazz & MPB',artists:'Bill Evans · Milton Nascimento',picks:['oud','santal','polo'],ratings:{vetiver:10,santal:9,terre:9}},
  {id:'clara',name:'Clara Nascimento',handle:'clara.nascimento',image:'assets/profiles/clara.jpg',role:'Design & sensações',bio:'Poucas coisas. Boas histórias. Um perfume que fica.',followers:2480,following:196,family:'Ambarada',nuance:'Gourmand · especiada',liked:['baunilha','cacau','sandalo'],disliked:['grapefruit','petitgrain','lavanda'],fashion:'Contemporâneo',music:'Soul & R&B',artists:'Sade · Erykah Badu',picks:['tobacco','coffee','blackorchid'],ratings:{'tom-ford-tobacco-vanille':9,blackorchid:9}}
 ],
 posts:[
  {id:'moment-beach',user:'sofia',product:'clash-moment',image:'assets/products/sea.jpg',when:'agora',text:'Pé na areia e o mar até onde a vista alcança. Hoje usei Clash. O perfume também faz parte dessa memória.',likes:124,occasion:'Praia'},
  {id:'moment-pool',user:'mateo',product:'clash-moment',image:'assets/products/pool.jpg',when:'40 min',text:'Uma tarde na piscina. Minha escolha de hoje: Clash. Foto do momento, perfume na legenda.',likes:93,occasion:'Piscina'},
  {id:'moment-dinner',user:'vincenzo',product:'exclusivo',image:'assets/products/night.jpg',when:'1 h',text:'Jantar à meia-luz. Usei Essencial Exclusivo: a faceta de conhaque combina com a atmosfera desta noite.',likes:845,occasion:'Jantar'},
  {id:'sim-v1',user:'vincenzo',product:'tobacco',image:'assets/profiles/vincenzo-saggio.png',when:'2 h',text:'Linho, um disco do Chet e o calor do tabaco. Algumas combinações atravessam o tempo.',likes:1248,occasion:'Uma noite sem pressa'},
  {id:'sim-s1',user:'sofia',product:'jazz',image:'assets/products/jazz-club.jpg',when:'3 h',text:'O perfume que escolhi para transformar um jantar simples em uma boa memória.',likes:86,occasion:'Jantar'},
  {id:'sim-m1',user:'mateo',product:'oud',image:'assets/profiles/mateo.jpg',when:'4 h',text:'Madeira, silêncio e uma tarde entre discos. Hoje não precisava de mais nada.',likes:143,occasion:'Lado B'},
  {id:'sim-c1',user:'clara',product:'tobacco',image:'assets/profiles/clara.jpg',when:'5 h',text:'Gosto de quando a baunilha encontra uma madeira seca. O contraste é a melhor parte.',likes:207,occasion:'Texturas na pele'},
  {id:'sim-v2',user:'vincenzo',product:'jazz',image:'assets/products/city.jpg',when:'1 d',text:'Se essa noite tivesse um cheiro, seria rum, tabaco e baunilha. Minha indicação para ouvir um disco inteiro.',likes:963,occasion:'Depois das dez'},
  {id:'sim-s2',user:'sofia',product:'oud',image:'assets/profiles/sofia.jpg',when:'1 d',text:'Saindo um pouco das flores para experimentar o lado mais tranquilo das madeiras.',likes:72,occasion:'Uma nova descoberta'}
 ]
};

/* Essencial Exclusivo não está no catálogo base. */
if(!byId('exclusivo')){const notes={top:['Conhaque','Cardamomo','Maçã','Gengibre','Manjericão'],heart:['Gerânio','Lavanda','Pimenta rosa','Artemísia'],base:['Cedro','Musgo','Patchouli','Musk'],source:COMMUNITY.products[4].source};const noteWeights=[...notes.top.map(name=>({name,tier:'Saída',weight:.7})),...notes.heart.map(name=>({name,tier:'Coração',weight:.85})),...notes.base.map(name=>({name,tier:'Fundo',weight:1}))];PERFUMES.push({id:'exclusivo',name:'Essencial Exclusivo Masculino',brand:'Natura',concentration:'Deo Parfum',family:'Amadeirado aromático',audience:'Masculino',image:COMMUNITY.products[4].image,notes,noteWeights,vector:NoteModel.vector('Cedro Patchouli Cardamomo Gengibre Lavanda'),scene:'night'});}
for(const p of COMMUNITY.products){const x=p.catalog&&byId(p.catalog);if(x&&!x.image)x.image=p.image;}

/* Acesso unificado a pessoas, produtos e publicações (comunidade + perfis antigos + você). */
const People={
 find(id){return COMMUNITY.people.find(p=>p.id===id);},
 legacy(id){return PEOPLE.find(p=>p.id===id);},
 author(uid){
  if(uid==='me')return {id:'me',name:state.name,handle:Select.handle(),avatar:UI.avatar(null),href:'#profile',own:true};
  const s=this.find(uid);if(s)return {id:s.id,name:s.name,handle:s.handle,verified:s.verified,image:s.image,avatar:UI.avatar(s),href:'#person/'+s.id};
  const u=this.legacy(uid);return u?{id:u.id,name:u.name,handle:u.id,avatar:UI.avatar(u),href:'#person/'+u.id}:{id:uid,name:'Perfil',handle:uid,avatar:UI.avatar({initials:'?'}),href:'#home'};
 },
 suggestions(n=4){return COMMUNITY.people.filter(p=>!state.following.includes(p.id)).slice(0,n);}
};
const Products={
 all(){const extra=COMMUNITY.people.flatMap(p=>p.picks).filter(id=>!COMMUNITY.products.some(x=>x.id===id)).map(id=>{const x=byId(id);return x&&{id:'catalog-'+id,catalog:id,name:x.name,brand:x.brand,image:x.image,family:x.family,notes:x.noteWeights.slice(0,3).map(n=>n.name),reason:'Uma escolha para explorar este universo olfativo.',source:x.notes?.source||'https://www.scento.com/perfume-database'};}).filter(Boolean);return [...COMMUNITY.products,...extra];},
 find(id){return this.all().find(p=>p.id===id||p.id==='catalog-'+id);},
 picksOf(person){return person.picks.map(id=>this.find(id)).filter(Boolean);}
};
const Posts={
 /* Publicações em formato único, qualquer que seja a origem. */
 normalize(p){
  if(p.product){const x=Products.find(p.product);return {...p,tag:x&&{name:x.name,brand:x.brand,image:x.image,action:`data-action="product" data-id="${x.id}"`}};}
  const perfume=byId(p.perfume),n=Number(String(p.id).replace(/\D/g,''))||0;
  return {id:p.id,user:p.user,image:p.photo,text:p.text,occasion:p.occasion,likes:p.likes,rating:p.rating,when:p.user==='me'?'agora':(1+Math.floor(n/3))+' d',tag:perfume&&{name:perfume.name,brand:perfume.brand,image:perfume.image,action:`data-action="perfume" data-id="${perfume.id}"`}};
 },
 all(){const taken=new Set(COMMUNITY.people.map(p=>p.id)),legacy=POSTS.filter(p=>!taken.has(p.user)),a=[...COMMUNITY.posts],b=[...legacy],mixed=[];while(a.length||b.length){if(a.length)mixed.push(a.shift());if(b.length)mixed.push(b.shift());if(b.length)mixed.push(b.shift());}return [...state.posts,...mixed];},
 find(id){return this.all().find(p=>p.id===id);},
 by(uid){return this.all().filter(p=>p.user===uid);},
 forPerfume(id){return this.all().filter(p=>p.perfume===id||Products.find(p.product||'')?.catalog===id);},
 likes(p){return p.likes+(state.likes.includes(p.id)?1:0);}
};
