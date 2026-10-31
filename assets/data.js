/* ELIXIR — Dados de demonstração. Vetores são estimativas editoriais, não composição química.
   Notas confirmadas mantêm fonte própria. Perfis, relatos e métricas são fictícios. */
const DIMENSIONS=['Cítrico','Verde','Aromático','Amadeirado','Terroso','Floral','Frutado','Doce','Aquático','Especiado fresco','Especiado quente','Couro','Tabaco','Resinoso','Âmbar','Musk','Atalcado','Gourmand','Balsâmico','Herbal','Defumado','Lactônico','Aldeídico','Animalizado'];
const RAW=[
['vetiver','Vétiver','Guerlain','Eau de Toilette','Amadeirado fresco',{0:.7,1:.9,2:.8,3:.8,4:.8,7:.1,10:.4,12:.5,19:.7},'forest'],
['polo','Polo Green','Ralph Lauren','Eau de Toilette','Amadeirado especiado',{1:.9,2:.8,3:.8,4:.5,7:.1,11:.6,12:.6,19:.8,20:.3},'forest'],
['arbo','Arbo','O Boticário','Desodorante Colônia','Fougère fresco',{0:.7,1:.9,2:.8,3:.3,8:.3,15:.3,19:.9},'forest'],
['clash','Clash','O Boticário','Desodorante Colônia','Fougère aquoso',{0:.4,1:.5,2:.9,3:.5,6:.3,8:.8,9:.5,19:.7,22:.4},'sea'],
['extreme','Clash Extreme','O Boticário','Desodorante Colônia','Fougère amadeirado',{1:.4,2:.8,3:.8,6:.6,7:.3,8:.5,14:.4,19:.5},'sea'],
['malbec','Malbec','O Boticário','Desodorante Colônia','Amadeirado • estimativa',{0:.2,2:.3,3:.9,7:.5,10:.7,11:.5,14:.7,18:.4},'night'],
['coffee','Coffee Man Lucky','O Boticário','Desodorante Colônia','Fougère amadeirado',{0:.4,2:.5,3:.7,7:.5,9:.5,10:.5,14:.7,17:.3},'night'],
['unico','Essencial Único Masculino','Natura','Deo Parfum','Amadeirado especiado',{0:.3,3:.9,4:.4,7:.4,10:.8,13:.7,14:.6,18:.6},'night'],
['sonar','Kaiak Sonar Masculino','Natura','Deo Colônia','Aromático amadeirado',{0:.5,1:.3,2:.7,3:.5,8:.9,22:.5},'sea'],
['terre','Terre d’Hermès','Hermès','Eau de Toilette','Amadeirado • estimativa',{0:.9,1:.5,2:.5,3:.8,4:.8,9:.5,7:.1},'forest'],
['lemale','Le Male Elixir','Jean Paul Gaultier','Parfum','Âmbar aromático • estimativa',{2:.6,7:.95,10:.5,12:.4,14:.8,17:.8,18:.6},'night'],
['coolwater','Cool Water','Davidoff','Eau de Toilette','Aquático aromático • estimativa',{0:.5,1:.6,2:.8,3:.3,8:.9,15:.5,19:.6},'sea'],
['homem','Natura Homem','Natura','Desodorante Colônia','Amadeirado • estimativa',{0:.5,1:.4,2:.7,3:.7,9:.5,15:.5},'city'],
['hwyl','Hwyl','Aesop','Eau de Parfum','Amadeirado • estimativa',{1:.8,2:.6,3:.9,4:.8,13:.5,19:.6,20:.8},'forest'],
['santal','Santal 33','Le Labo','Eau de Parfum','Amadeirado • estimativa',{1:.3,3:.9,4:.3,5:.3,11:.6,15:.6,16:.4},'city'],
['philosykos','Philosykos','Diptyque','Eau de Toilette','Verde • estimativa',{1:.95,3:.5,6:.6,7:.2,19:.7,21:.5},'forest'],
['sauvage','Sauvage','Dior','Eau de Toilette','Aromático • estimativa',{0:.8,2:.8,3:.6,9:.8,14:.7,15:.5},'city'],
['chanel5','N°5','Chanel','Eau de Parfum','Floral • estimativa',{5:.95,7:.3,15:.6,16:.7,22:.9},'flowers'],
['chance','Chance Eau Tendre','Chanel','Eau de Toilette','Floral frutado • estimativa',{0:.5,5:.8,6:.8,7:.4,15:.6},'flowers'],
['blackorchid','Black Orchid','Tom Ford','Eau de Parfum','Âmbar floral • estimativa',{3:.5,4:.4,5:.8,7:.7,10:.6,14:.7,17:.5},'night'],
['lightblue','Light Blue','Dolce & Gabbana','Eau de Toilette','Cítrico • estimativa',{0:.95,1:.4,5:.3,6:.5,8:.5,15:.4},'sea'],
['jadore','J’adore','Dior','Eau de Parfum','Floral • estimativa',{5:.95,6:.5,7:.4,15:.4},'flowers'],
['bleu','Bleu de Chanel','Chanel','Eau de Parfum','Amadeirado aromático • estimativa',{0:.7,2:.7,3:.8,9:.5,13:.4,14:.5},'city'],
['ckone','CK One','Calvin Klein','Eau de Toilette','Cítrico • estimativa',{0:.9,1:.5,2:.5,5:.3,15:.6},'sea']
];
const VERIFIED={
vetiver:{top:['Laranja','Bergamota','Limão'],heart:['Noz-moscada','Pimenta'],base:['Vetiver','Tabaco','Fava tonka'],source:'https://www.guerlain.com/us/en-us/p/vetiver-eau-de-toilette-G030486.html'},
polo:{top:['Pinheiro','Tomilho','Manjericão'],heart:['Couro','Tabaco','Estragão'],base:['Patchouli','Musgo de carvalho','Incenso'],source:'https://www.ralphlaurenfragrances.com/en_US/men/polo/polo-eau-de-toilette/RLFE016.html'},
arbo:{highlights:['Menta','Notas verdes','Sândalo'],source:'https://static-cms.internacional.grupoboticario.digital/SEGREDINHO_Perfumaria_completa_2ff6b13fd2.pdf'},
clash:{top:['Timur pepper','Aldeídos metálicos','Notas marinhas','Carambola'],heart:['Sálvia','Lavanda','Gerânio'],base:['Vetiver','Cedro','Musgo','Patchouli','Âmbar','Cipreste','Cumarina','Cashmeran'],source:'https://www.boticario.com.br/clash-desodorante-colonia-100ml'},
extreme:{top:['Timur pepper','Notas marinhas','Carambola'],heart:['Sálvia','Gerânio','Lavanda','Figo'],base:['Sândalo','Cashmeran','Cedro','Vetiver','Musgo','Patchouli','Âmbar'],source:'https://www.boticario.com.br/dicas-de-beleza/qual-a-diferenca-entre-as-fragrancias-de-clash-compare-e-escolha-a-sua/'},
coffee:{highlights:['Âmbar','Patchouli','Pimenta preta'],source:'https://www.boticario.com.br/coffee-man-lucky-desodorante-colonia-100ml/'},
unico:{top:['Pimenta rosa','Ishipink','Noz-moscada','Açafrão','Pomelo'],heart:['Frésia','Cedro','Vetiver','Copaíba'],base:['Mirra','Opoponax','Benjoim','Cumaru','Baunilha','Musk','Âmbar','Ládano'],source:'https://www.natura.com.br/p/desodorante-perfume-essencial-unico-masculino-90-ml/NATBRA-103348'},
sonar:{highlights:['Notas marinhas','Metálico','Amadeirado','Salgado'],source:'https://www.natura.com.br/c/kaiak-sonar'}
};
const PRODUCT_PHOTOS=['polo','arbo','clash','extreme','coffee','unico','coolwater','santal','philosykos','blackorchid'];
const PERFUMES=RAW.map(([id,name,brand,concentration,family,values,scene])=>({id,name,brand,concentration,family,scene,vector:DIMENSIONS.map((_,i)=>values[i]||0),image:PRODUCT_PHOTOS.includes(id)?`assets/products/${id}.jpg`:'',notes:VERIFIED[id]||null}));
const byId=id=>PERFUMES.find(p=>p.id===id);
const PEOPLE=[
{id:'lucas',name:'Lucas Martins',initials:'LM',color:'#65755b',bio:'Entre folhas, raízes e clássicos. O verde sempre me encontra.',ratings:{vetiver:10,polo:9,arbo:9,terre:9,malbec:9,clash:8,philosykos:9,hwyl:8,coffee:7,lemale:5}},
{id:'marina',name:'Marina Costa',initials:'MC',color:'#986956',bio:'Gosto de noites longas e perfumes que ficam na memória.',ratings:{lemale:10,malbec:8,coffee:9,unico:9,blackorchid:10,santal:8,vetiver:4,arbo:5,clash:6}},
{id:'clara',name:'Clara Reis',initials:'CR',color:'#a894a3',bio:'Uma flor, uma cidade, uma nova lembrança.',ratings:{chance:10,jadore:9,chanel5:8,lightblue:8,philosykos:9,arbo:8,vetiver:6,polo:5}},
{id:'rafael',name:'Rafael Lima',initials:'RL',color:'#718c94',bio:'Sal na pele e frescor no caminho.',ratings:{sonar:10,coolwater:10,clash:9,arbo:9,extreme:9,lightblue:9,lemale:3,malbec:4,vetiver:8}},
{id:'bia',name:'Beatriz Melo',initials:'BM',color:'#987c62',bio:'Madeiras, pele e conforto. Sem pressa.',ratings:{santal:10,hwyl:9,philosykos:9,terre:8,vetiver:8,arbo:7,malbec:5,chanel5:7}},
{id:'andre',name:'André Alves',initials:'AA',color:'#656960',bio:'Clássicos nunca contam a mesma história duas vezes.',ratings:{polo:10,vetiver:10,terre:9,homem:9,arbo:8,malbec:6,bleu:8,sauvage:7}},
{id:'luiza',name:'Luiza Prado',initials:'LP',color:'#ae8f87',bio:'Do floral transparente ao abraço de baunilha.',ratings:{jadore:10,chance:9,lemale:8,blackorchid:8,ckone:8,arbo:6,vetiver:4}},
{id:'pedro',name:'Pedro Nunes',initials:'PN',color:'#637c70',bio:'Sempre existe algo novo para sentir.',ratings:{arbo:10,clash:9,vetiver:9,polo:8,malbec:2,extreme:9,philosykos:9,terre:8}},
{id:'sofia',name:'Sofia Duarte',initials:'SD',color:'#837b95',bio:'Minha coleção é um diário de lugares.',ratings:{philosykos:10,lightblue:9,santal:9,chanel5:6,arbo:8,polo:5,vetiver:7}},
{id:'tiago',name:'Tiago Rocha',initials:'TR',color:'#8c796b',bio:'Um pouco de tudo, muito de curiosidade.',ratings:{coffee:8,unico:9,bleu:9,homem:8,clash:8,arbo:7,vetiver:7,malbec:8}}
];
const POST_SEEDS=[
['lucas','arbo','arbo-editorial','Tem dias em que tudo o que eu quero é sentir o ar da montanha. Hoje, Arbo foi esse pequeno respiro.','Cotidiano',9],
['marina','lemale','night','Luz baixa, uma mesa para dois e um perfume que não tem pressa de ir embora. Para mim, funciona melhor à noite.','Encontro',10],
['rafael','clash','clash-editorial','Frescor para acompanhar um dia inteiro em movimento. Na minha pele, o lado aromático aparece primeiro.','Trabalho',9],
['bia','santal','santal','Madeira e conforto, como abrir um livro que já é seu.','Cotidiano',10],
['lucas','vetiver','forest','Verde, elegante e cheio de personalidade. Gosto de usar nos dias amenos.','Trabalho',10],
['clara','chance','flowers','Uma manhã tranquila, flores na janela e vontade de começar de novo.','Cotidiano',10],
['rafael','coolwater','sea','O mar nunca parece tão longe quando uso esse clássico.','Praia',10],
['andre','polo','polo','Alguns clássicos continuam abrindo novas conversas. Pinheiro e memória.','Trabalho',10],
['bia','philosykos','philosykos','A sensação de sombra de uma figueira em um dia de verão.','Viagem',9],
['marina','blackorchid','blackorchid','Uma presença que combina com meu lado mais noturno.','Festa',10],
['pedro','extreme','sea','Experimentando um novo frescor. Ainda descobrindo suas camadas.','Cotidiano',9],
['sofia','lightblue','sea','Esse azul me lembra uma viagem que quero repetir.','Viagem',9],
['tiago','coffee','coffee','Um jantar simples ganha uma memória nova.','Jantar',8],
['luiza','jadore','flowers','Um floral que faz parte dos meus pequenos rituais.','Cotidiano',10],
['andre','terre','forest','Caminhar sem destino, sentir a terra depois da chuva.','Viagem',9],
['marina','unico','unico','As madeiras aparecem diferentes a cada uso. Hoje, senti mais calor e resina.','Jantar',9],
['pedro','arbo','forest','Não é só sobre o perfume. É sobre como o dia começa.','Trabalho',10],
['sofia','santal','city','Guardo cidades também pelo cheiro.','Viagem',9]
];
const POSTS=POST_SEEDS.map(([user,perfume,photo,text,occasion,rating],i)=>({id:'post'+i,user,perfume,photo:'assets/products/'+photo+'.jpg',text,occasion,rating,likes:12+i*7}));
/* Observações sintéticas ligadas ao catálogo; contexto filtra relatos, nunca presume causalidade. */
const OBSERVATIONS=PEOPLE.flatMap((u,j)=>Object.entries(u.ratings).map(([id,rating],k)=>({user:u.id,id,rating,temp:[20,29,16,32][(j+k)%4],time:(j+k)%2?'Noite':'Dia',skin:['Seca','Oleosa','Não informada'][(j+k)%3],application:(j+k)%3?'Pele':'Roupa',occasion:['Trabalho','Cotidiano','Jantar','Praia'][(j+k)%4],environment:(j+k)%2?'Fechado':'Aberto',hours:3+(j*3+k*2)%7,projection:1+(j+k)%5,descriptors:DIMENSIONS.filter((_,d)=>byId(id).vector[d]>.65)})));
const EDITORIALS=[{id:'green',name:'Verde absoluto',sub:'Um respiro fora do óbvio.',photo:'forest',dimension:1},{id:'night',name:'Depois das oito',sub:'Histórias que ficam na pele.',photo:'night',dimension:14},{id:'skin',name:'Pele e memória',sub:'A intimidade de um aroma.',photo:'flowers',dimension:15},{id:'sun',name:'Dias de sol',sub:'Deixe o dia acontecer.',photo:'sea',dimension:8}];
