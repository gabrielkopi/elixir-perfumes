/* Privacidade (spec §7): nada dos grupos de mensagens, telefones, ids de mensagem ou campos internos da pesquisa
   pode chegar aos arquivos servidos. Varre os .js, .json, .css e .html de assets e os .html da raiz (exceto assets/research/). */
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const EXCLUDE=[path.join(root,'assets','research')];
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{const p=path.join(d,e.name);
 if(e.isDirectory())return EXCLUDE.includes(p)?[]:walk(p);return /\.(js|json|css|html)$/i.test(e.name)?[p]:[];});
const files=[...walk(path.join(root,'assets')),...fs.readdirSync(root).filter(f=>/\.html$/i.test(f)).map(f=>path.join(root,f))];

const BANNED=[
 [/MD Links/,'nome de grupo'],
 [/Vitrine Perfumes/,'nome de grupo'],
 [/referencias_grupos|origem_pesquisa|ocorrencias_consolidadas|notas_declaradas_na_fonte|imagem_proveniencia|notas_ilustradas/,'campo interno da pesquisa'],
 [/@g\.us\b/,'id de grupo de mensagens'],
 [/@c\.us\b/,'id de contato de mensagens'],
 [/\b(?:true|false)_\d{8,}@/,'id serializado de mensagem'],
 [/3EB0[0-9A-F]{8,}/,'prefixo de id de mensagem'],
 [/\+55[\s.-]?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/,'telefone (+55)'],
 [/(?<![\w.\/-])\(\d{2}\)\s?9\d{4}[-\s]\d{4}(?![\w])/,'telefone (DDD)'],
 [/atualiza(?:ç|c)(?:ã|a)o Elixir[\\\/]whatsapp/i,'caminho da pasta de mensagens'],
 [/\.codex[\\\/]generated_images/,'caminho local de geração'],
];
/* arquivos gerados a partir da pesquisa: regras mais estritas */
const GENERATED=['catalog-br.js','image-credits.js','catalog-photos.js','ingredients.js'].map(f=>path.join(root,'assets','js','data',f));
const STRICT=[[/whatsapp/i,'menção a mensagens'],[/\bgrupos?\b/i,'menção a grupos'],[/Vitrine/,'nome de grupo'],[/sha256|url_imagem|consulta_busca|titulo_na_fonte/,'metadado de imagem'],[/[-]/,'caractere de uso privado']];

const hits=[];
for(const f of files){
 const text=fs.readFileSync(f,'utf8');
 const rules=GENERATED.includes(f)?[...BANNED,...STRICT]:BANNED;
 for(const [re,why] of rules){const m=text.match(re);if(m)hits.push(path.relative(root,f)+': '+why+' ('+JSON.stringify(text.slice(Math.max(0,m.index-20),m.index+m[0].length+20))+')');}
}
for(const f of GENERATED)assert(fs.existsSync(f),'arquivo gerado ausente: '+path.relative(root,f));
assert.deepEqual(hits,[],'Padrões proibidos encontrados:\n'+hits.join('\n'));
console.log(JSON.stringify({scanned:files.length,banned:BANNED.length,strictFiles:GENERATED.length,hits:0}));
