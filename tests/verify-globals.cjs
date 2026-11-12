/* Core: cada nome de topo (const/let/var/class/function) é declarado uma vez, no arquivo do registro §3.2,
   na ordem de scripts §3.1; e cada seletor de views/*.css começa pelo seu namespace (§3). */
const fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.join(__dirname,'..');

/* ---------- registro §3.2 + globais existentes (data/engine/dom) ---------- */
const REG={
 'core/components.js':['UI','avatar','card','back'],'core/motion.js':['Motion','Sheet','Theme','Modal','openModal','closeModal','reducedMotion'],
 'core/router.js':['Router','route'],'core/store.js':['Store','state','Select','SHELF','LIST_NAMES','SANDBOX'],'core/actions.js':['Actions'],'main.js':['App'],
 'core/catalog.js':['Catalog'],'core/profile-rules.js':['PROFILE_RULES','ProfileRules'],'views/shell.js':['Shell'],'views/settings.js':['Settings'],
 'views/feed.js':['Feed','Post'],'views/stories.js':['Stories'],'views/compose.js':['Compose'],'views/explore.js':['Explore','Filters'],'views/search.js':['Search'],
 'views/perfume.js':['Perfume','Rating'],'views/notes.js':['Notes','Radar'],'views/brand.js':['Brands'],'data/editions.js':['EDITIONS','Editions'],'engine/advisor.js':['Advisor'],
 'data/brand-tiers.js':['BRAND_TIERS','NATIONAL_BRANDS','TIER_LABELS'],'views/guide.js':['Guide'],'views/compare.js':['Compare'],'views/discovery.js':['Discovery'],
 'views/collection.js':['Collection','Lists'],'views/profile.js':['Profile'],'views/profile-edit.js':['ProfileEdit'],'views/activity.js':['Activity'],
 'data/catalog-br.js':['CATALOG_BR'],'data/image-credits.js':['IMAGE_CREDITS'],'data/data.js':['PERFUME_ALIASES'],'data/ingredients.js':['INGREDIENT_ALIASES'],
 'engine/olfactory-map.js':['MAP_AXES','OMap'],'core/weather.js':['Weather'],'vendor/qrcode.js':['qrcode'],'views/map.js':['MapView'],
 'views/today.js':['Today','Context','OUTFITS'],'views/bubble.js':['Bubble'],'views/circle.js':['Circle'],'views/connect.js':['Connect'],
 /* existentes antes do v3 ("data/engine globals stay where they are") */
 'data/brand.js+':['BRAND'],'data/data.js+':['DIMENSIONS','RAW','VERIFIED','PRODUCT_PHOTOS','PERFUMES','byId','PEOPLE','POST_SEEDS','POSTS','OBSERVATIONS','EDITORIALS'],
 'data/catalog-100.js+':['CATALOG_100'],'data/notes.js+':['NoteModel','NOTE_CHOICES','STYLE_CHOICES','EXTRA_NOTES'],'data/catalog-photos.js+':['CatalogPhotos'],
 'data/ingredients.js+':['INGREDIENTS','NOTE_GROUPS','FAMILIES','noteImage'],'engine/engine.js+':['Engine'],'engine/taste-engine.js+':['BaseTasteProfile','BaseTasteRecommend'],
 'data/community.js+':['COMMUNITY','People','Products','Posts'],
 'core/dom.js+':['$','$$','esc','compact','toggle','plural','ICONS','icon','Toast','toast','readImage']
};
/* Nomes antigos que o grupo dono ainda precisa remover (§3.2). Só avisam; colisão continua sendo falha. Apague a linha ao remover. */
const PENDING={Rate:'views/collection.js',Compare:'views/perfume.js'};
const owner={};for(const [f,names] of Object.entries(REG))for(const n of names){const file=f.replace(/\+$/,'');if(owner[n]&&owner[n]!==file)throw new Error('registro duplicado '+n);owner[n]=file;}

/* ---------- tokenizador mínimo: nomes declarados no nível de topo ---------- */
function topNames(src){
 const names=[];let i=0,depth=0,prev='',mode=null;/* mode: 'decl' após const/let/var */
 const isId=c=>/[A-Za-z0-9_$]/.test(c);
 const regexOK=()=>prev===''||/[(,=:[!&|?{};+\-*%<>~^]$/.test(prev)||/^(return|typeof|case|do|else|in|of|new|delete|void|throw|yield|await)$/.test(prev);
 const skipTemplate=()=>{i++;while(i<src.length){const c=src[i];if(c==='\\'){i+=2;continue;}if(c==='`'){i++;return;}if(c==='$'&&src[i+1]==='{'){i+=2;let d=1;while(i<src.length&&d>0){const ch=src[i];
   if(ch==='`'){skipTemplate();continue;}if(ch==='"'||ch==="'"){skipStr(ch);continue;}if(ch==='{')d++;else if(ch==='}')d--;i++;}continue;}i++;}};
 const skipStr=q=>{i++;while(i<src.length){const c=src[i];if(c==='\\'){i+=2;continue;}if(c===q){i++;return;}if(c==='\n'){i++;return;}i++;}};
 while(i<src.length){const c=src[i];
  if(c==='/'&&src[i+1]==='/'){while(i<src.length&&src[i]!=='\n')i++;continue;}
  if(c==='/'&&src[i+1]==='*'){const e=src.indexOf('*/',i+2);i=e<0?src.length:e+2;continue;}
  if(/\s/.test(c)){i++;continue;}
  if(c==='"'||c==="'"){skipStr(c);prev='str';continue;}
  if(c==='`'){skipTemplate();prev='str';continue;}
  if(c==='/'&&regexOK()){i++;let cls=false;while(i<src.length){const ch=src[i];if(ch==='\\'){i+=2;continue;}if(ch==='[')cls=true;else if(ch===']')cls=false;else if(ch==='/'&&!cls){i++;break;}else if(ch==='\n')break;i++;}while(/[a-z]/.test(src[i]||''))i++;prev='re';continue;}
  if(isId(c)){let j=i;while(j<src.length&&isId(src[j]))j++;const w=src.slice(i,j);i=j;
   if(depth===0){
    if(['const','let','var'].includes(w)){mode='name';prev=w;continue;}
    if(w==='class'||w==='function'){let k=i;while(/\s/.test(src[k]))k++;if(src[k]==='*')k++;while(/\s/.test(src[k]))k++;let e=k;while(isId(src[e]||''))e++;if(e>k)names.push(src.slice(k,e));prev=w;i=e;mode=null;continue;}
    if(w==='async'&&/^\s*function/.test(src.slice(i))){prev=w;continue;}
    if(mode==='name'){names.push(w);mode='init';prev=w;continue;}
   }
   prev=w;continue;}
  if('([{'.includes(c))depth++;else if(')]}'.includes(c))depth=Math.max(0,depth-1);
  else if(depth===0&&c===','&&mode==='init')mode='name';
  else if(depth===0&&c===';')mode=null;
  prev=c;i++;}
 return names;
}

/* ---------- ordem §3.1 nas 4 páginas ---------- */
const ORDER=`data/brand.js data/data.js data/catalog-100.js data/notes.js data/catalog-br.js data/image-credits.js data/catalog-photos.js
data/ingredients.js data/brand-tiers.js data/editions.js engine/engine.js engine/taste-engine.js engine/advisor.js engine/olfactory-map.js
core/dom.js core/profile-rules.js core/store.js core/catalog.js core/router.js core/motion.js core/components.js core/actions.js core/weather.js
data/community.js vendor/qrcode.js views/shell.js views/settings.js views/feed.js views/stories.js views/compose.js
views/explore.js views/search.js views/perfume.js views/notes.js views/brand.js views/guide.js views/compare.js views/discovery.js
views/collection.js views/profile.js views/profile-edit.js views/activity.js views/map.js views/today.js views/bubble.js views/circle.js views/connect.js actions.js main.js`.split(/\s+/);
let fails=0,warns=0;const VERSIONS=new Set();const fail=m=>{fails++;console.log('  FAIL '+m);},warn=m=>{warns++;console.log('  AVISO '+m);};
for(const html of ['index.html','elixir.html','perfume-social.html','assinatura.html']){
 const src=fs.readFileSync(path.join(ROOT,html),'utf8');const list=[...src.matchAll(/<script src="assets\/js\/([^"?]+)(\?v=\d+)?"/g)].map(m=>m[1]);
 if(JSON.stringify(list)!==JSON.stringify(ORDER))fail(html+': ordem de scripts difere de §3.1');
 /* Uma única versão de cache (?v=) por página e igual nas quatro entradas; sobe a cada publicação. */
 const vs=[...new Set([...src.matchAll(/\?v=(\d+)"/g)].map(m=>m[1]))];
 if(vs.length!==1)fail(html+': ?v misturado ('+vs.join(', ')+')');
 else{VERSIONS.add(vs[0]);if(Number(vs[0])<91)fail(html+': ?v abaixo de 91');}}
if(VERSIONS.size>1)fail('versões ?v diferentes entre as entradas: '+[...VERSIONS].join(', '));

/* ---------- declarações ---------- */
const seen={};
for(const f of ORDER){const p=path.join(ROOT,'assets','js',f);if(!fs.existsSync(p)){fail('arquivo ausente '+f);continue;}
 for(const n of topNames(fs.readFileSync(p,'utf8'))){
  if(seen[n]){if(PENDING[n]&&(seen[n]===PENDING[n]||f===PENDING[n]))fail(`${n} declarado em ${seen[n]} e ${f} (remova o antigo de ${PENDING[n]})`);else fail(`${n} declarado em ${seen[n]} e ${f}`);continue;}
  seen[n]=f;
  if(PENDING[n]===f){warn(`${n} em ${f} ainda precisa ser removido (§3.2)`);continue;}
  if(!owner[n])fail(`${n} (${f}) não está no registro §3.2`);else if(owner[n]!==f)fail(`${n} deveria estar em ${owner[n]}, não em ${f}`);}}
for(const [n,f] of Object.entries({UI:'core/components.js',Router:'core/router.js',Store:'core/store.js',Actions:'core/actions.js',App:'main.js',Shell:'views/shell.js',Settings:'views/settings.js',Catalog:'core/catalog.js'}))
 if(seen[n]!==f)fail(`${n} ausente de ${f}`);

/* ---------- namespaces das views ---------- */
const NS={'post.css':['.post*'],'home.css':['.v-home'],'stories.css':['.story*'],'compose.css':['.sh-sotd','.sh-comments','.sh-share'],
 'explore.css':['.v-explore','.sh-filter'],'search.css':['.sh-search'],'perfume.css':['.v-perfume','.sh-rate','.sh-more'],'notes.css':['.v-notes'],'brand.css':['.v-brand'],
 'guide.css':['.v-guide'],'compare.css':['.v-compare'],'welcome.css':['.v-welcome'],'profile.css':['.v-profile'],'profile-edit.css':['.sh-edit'],
 'collection.css':['.v-collection','.sh-lists'],'activity.css':['.sh-activity'],'map.css':['.v-map','.sh-map-fix','.mapv*'],'today.css':['.v-today','.sh-context','.sh-city'],
 'bubble.css':['.v-bubble'],'circle.css':['.v-circle','.sh-circle-add'],'connect.css':['.v-connect','.v-store']};
function selectors(css){const out=[];css=css.replace(/\/\*[\s\S]*?\*\//g,'');let i=0;
 const block=(s)=>{let k=0,buf='';while(k<s.length){const c=s[k];
   if(c==='{'){const sel=buf.trim();buf='';let d=1,j=k+1;while(j<s.length&&d>0){if(s[j]==='{')d++;else if(s[j]==='}')d--;j++;}const inner=s.slice(k+1,j-1);
    if(/^@(media|supports|container|layer)/.test(sel))block(inner);else if(/^@/.test(sel)){}else out.push(sel);k=j;continue;}
   if(c===';'&&/^\s*@/.test(buf)){buf='';k++;continue;}buf+=c;k++;}};block(css);return out;}
function splitList(sel){const parts=[];let d=0,b='';for(const c of sel){if(c==='('||c==='[')d++;else if(c===')'||c===']')d--;if(c===','&&d===0){parts.push(b);b='';}else b+=c;}parts.push(b);return parts.map(x=>x.trim()).filter(Boolean);}
for(const [file,allowed] of Object.entries(NS)){const p=path.join(ROOT,'assets','css','views',file);if(!fs.existsSync(p)){fail('css ausente views/'+file);continue;}
 for(const sel of selectors(fs.readFileSync(p,'utf8')))for(const one of splitList(sel)){
  const s=one.replace(/^(?:(?:html|:root)(?:\[[^\]]*\]|\.[\w-]+|:not\([^)]*\))*\s+)/,'');
  const okSel=allowed.some(a=>a.endsWith('*')?s.startsWith(a.slice(0,-1)):s===a||s.startsWith(a)&&/^[^\w-]/.test(s.slice(a.length)));
  if(!okSel)fail(`views/${file}: seletor fora do namespace (${allowed.join(', ')}): ${one}`);}}

console.log(`verify-globals: ${Object.keys(seen).length} nomes de topo, ${warns} aviso(s), ${fails} falha(s)`);
if(fails)process.exit(1);
