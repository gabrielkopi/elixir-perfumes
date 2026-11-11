/* Catálogo importado (spec §7): carrega os dados como o app e confere forma, vetores, aliases e imagens. */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),js=f=>path.join(root,'assets','js',f);
const ctx=vm.createContext({console,document:{documentElement:{dataset:{brand:'elixir'}},addEventListener(){}}});
const load=f=>vm.runInContext(fs.readFileSync(js(f),'utf8'),ctx,{filename:f});
['data/brand.js','data/data.js','data/catalog-100.js','data/notes.js'].forEach(load);
const t0=process.hrtime.bigint();
load('data/catalog-br.js');
const parseMs=Number(process.hrtime.bigint()-t0)/1e6;
['data/image-credits.js','data/catalog-photos.js','data/ingredients.js'].forEach(load);
vm.runInContext(`globalThis.__r={
 ids:PERFUMES.map(p=>p.id),
 perfumes:PERFUMES.map(p=>({id:p.id,name:p.name,brand:p.brand,vector:p.vector,image:p.image,origin:p.origin,audience:p.audience,
  noteWeights:p.noteWeights.length,notes:p.notes&&{top:p.notes.top||[],heart:p.notes.heart||[],base:p.notes.base||[],highlights:p.notes.highlights||[],source:p.notes.source}})),
 aliases:Object.keys(PERFUME_ALIASES).map(a=>[a,PERFUME_ALIASES[a],!!byId(a),byId(a)&&byId(a).id]),
 ingredients:INGREDIENTS.map(i=>({id:i.id,image:i.image,family:i.family,illustrated:i.illustrated})),
 groups:NOTE_GROUPS.length,
 aliasIds:Object.keys(INGREDIENT_ALIASES),
 noteImage:typeof noteImage==='function'&&noteImage('abacaxi'),
 credits:Object.entries(IMAGE_CREDITS),
 extendWorks:typeof NoteModel.extend==='function'&&NoteModel.translate('Pineapple accord')==='Acorde de abacaxi',
 brands:[...new Set(PERFUMES.map(p=>p.brand))]
};`,ctx);
const r=ctx.__r;

/* tamanho e ids */
assert(r.ids.length>=480&&r.ids.length<=520,'PERFUMES fora de 480–520: '+r.ids.length);
assert.equal(new Set(r.ids).size,r.ids.length,'ids duplicados');
assert.equal(r.perfumes.filter(p=>p.origin==='base').length,100,'a base 100 deve continuar intacta');

/* vetores */
for(const p of r.perfumes){
 assert.equal(p.vector.length,24,'vetor sem 24 dimensões: '+p.id);
 assert(p.vector.every(x=>typeof x==='number'&&x>=0&&x<=1),'vetor fora de [0,1]: '+p.id);
 assert(p.vector.some(x=>x>0),'vetor zerado: '+p.id);
 assert(p.noteWeights>0,'sem pesos de nota: '+p.id);
 assert(p.notes&&p.notes.source,'sem fonte das notas: '+p.id);
 assert(['Feminino','Masculino','Compartilhável',''].includes(p.audience),'público inválido: '+p.id);
}

/* aliases: todos resolvem (o alvo 'exclusivo' é criado por community.js; carregá-lo aqui confirma) */
try{load('data/community.js');}catch(e){/* community.js pode depender do DOM em versões futuras */}
const resolved=vm.runInContext('Object.keys(PERFUME_ALIASES).map(a=>[a,!!byId(a),byId(a)&&byId(a).id===PERFUME_ALIASES[a]])',ctx);
for(const [a,ok,same] of resolved)assert(ok&&same,'alias não resolve: '+a);
assert(r.aliases.length>=20,'aliases esperados (13 exatos + 9 normalizados + exclusivo)');

/* imagens */
const exists=p=>fs.existsSync(path.join(root,p));
for(const p of r.perfumes)if(p.image)assert(exists(p.image),'imagem inexistente: '+p.id+' → '+p.image);
const withImage=r.perfumes.filter(p=>p.image).length;
for(const i of r.ingredients){assert(i.image&&exists(i.image),'imagem de nota inexistente: '+i.id);assert(/\.webp$/.test(i.image),'nota sem webp: '+i.id);}
assert.equal(new Set(r.ingredients.map(i=>i.id)).size,r.ingredients.length,'ingredientes duplicados');
assert(r.ingredients.length>=150,'manifesto de ilustrações não importado');
assert(r.ingredients.every(i=>Number.isInteger(i.family)&&i.family>=0&&i.family<r.groups),'grupo de nota inválido');
assert(r.ingredients.some(i=>i.family===8),'grupo Frutadas sem notas');
assert(r.ingredients.every(i=>i.illustrated===true),'flag illustrated ausente');
assert.equal(r.noteImage,'assets/ingredients/abacaxi.webp');
for(const id of r.aliasIds)assert(r.ingredients.some(i=>i.id===id),'INGREDIENT_ALIASES para id inexistente: '+id);
for(const [id,c] of r.credits){assert(r.ids.includes(id),'crédito para id inexistente: '+id);assert(c.domain&&/^https?:\/\//.test(c.page),'crédito inválido: '+id);assert.deepEqual(Object.keys(c).sort(),['domain','page'],'crédito com campos extras: '+id);}
for(const f of ['families','img/covers'])for(const x of fs.readdirSync(path.join(root,'assets',f)).filter(x=>x.endsWith('.webp')))
 assert(fs.statSync(path.join(root,'assets',f,x)).size<=300*1024,'imagem acima de 300 KB: '+f+'/'+x);
for(const id of ['forest','sea','night','flowers','city','pool','jazz','woody','citrus','floral','aquatic','rain'])
 for(const s of ['','-800'])assert(exists('assets/img/covers/'+id+s+'.webp'),'capa ausente: '+id+s);
for(const p of r.perfumes)if(p.image&&/\.webp$/.test(p.image))assert(fs.statSync(path.join(root,p.image)).size<=300*1024,'foto acima de 300 KB: '+p.id);

/* paridade: o vetor gravado é o que NoteModel calcula a partir das notas (exceto o de reserva, marcado 'Em revisão') */
const parity=vm.runInContext(`CATALOG_BR.items.filter(r=>r.notes.reliability!=='Em revisão'||r.vector.some((x,i,a)=>x!==0&&x!==.6)).filter(r=>JSON.stringify(NoteModel.buildVector(NoteModel.weights(r.notes)))!==JSON.stringify(r.vector)).map(r=>r.id)`,ctx);
assert.deepEqual(parity,[],'vetor gravado diverge do NoteModel');

/* dicionário e marcas */
assert(r.extendWorks,'NoteModel.extend não aplicou o dicionário');
assert(!r.brands.includes('Dolce&Gabbana'),'alias de marca não aplicado');

/* orçamento */
const size=fs.statSync(js('data/catalog-br.js')).size;
assert(size<=400*1024,'catalog-br.js acima de 400 KB: '+size);
assert(parseMs<120,'catalog-br.js lento demais: '+parseMs.toFixed(1)+' ms');

console.log(JSON.stringify({perfumes:r.ids.length,base:100,imported:r.perfumes.filter(p=>p.origin==='br').length,withImage,aliases:r.aliases.length,
 ingredients:r.ingredients.length,credits:r.credits.length,catalogBrKB:+(size/1024).toFixed(1),parseMs:+parseMs.toFixed(1)},null,1));
