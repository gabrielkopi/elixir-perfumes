'use strict';
/* Catálogo: marcas, famílias, em alta, busca e links de compra orgânicos (§4.6). Sem DOM. */
const Catalog={
 _c:{},
 cached(key,fn){const n=PERFUMES.length;const c=this._c[key];if(c&&c.n===n)return c.v;const v=fn();this._c[key]={n,v};return v;},
 norm(s){return typeof NoteModel!=='undefined'?NoteModel.normalize(s):String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');},
 words(s){return String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);},
 slug(s){return String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');},
 tierOf(brand){return typeof BRAND_TIERS!=='undefined'&&BRAND_TIERS&&BRAND_TIERS[brand]?BRAND_TIERS[brand]:null;},
 nationalList(){return typeof NATIONAL_BRANDS!=='undefined'&&Array.isArray(NATIONAL_BRANDS)?NATIONAL_BRANDS:['Natura','O Boticário','Granado','Eudora','Jequiti'];},
 isNational(p){return !!p&&this.nationalList().includes(p.brand);},
 brands(){return this.cached('brands',()=>{const map=new Map();for(const p of PERFUMES){const k=this.slug(p.brand);if(!k)continue;if(!map.has(k))map.set(k,{name:p.brand,slug:k,count:0});map.get(k).count++;}
  const coll=new Intl.Collator('pt-BR',{sensitivity:'base'});
  return [...map.values()].map(b=>({...b,tier:this.tierOf(b.name),national:this.nationalList().includes(b.name)})).sort((a,b)=>coll.compare(a.name,b.name));});},
 brand(slug){const b=this.brands().find(x=>x.slug===slug);if(!b)return null;return {...b,items:PERFUMES.filter(p=>this.slug(p.brand)===slug)};},
 families(){return (typeof FAMILIES!=='undefined'?FAMILIES:[]).map(([id,name,description,d])=>({id,name,description,d,image:'assets/families/'+id+'.webp'}));},
 familyOf(p){if(!p||!p.vector)return null;const fams=this.families();let best=null,bv=-1;for(const f of fams){const v=p.vector[f.d]||0;if(v>bv){bv=v;best=f;}}return best;},
 /* Em alta: publicações recentes ×3 + curtidas/50 + relatos; determinístico. */
 trending(n=12){return this.cached('trending',()=>{const score=new Map(),add=(id,v)=>{const p=byId(id);if(p)score.set(p.id,(score.get(p.id)||0)+v);};
   if(typeof POSTS!=='undefined')for(const p of POSTS){add(p.perfume,3);add(p.perfume,(p.likes||0)/50);}
   if(typeof OBSERVATIONS!=='undefined')for(const o of OBSERVATIONS)add(o.id,1);
   if(typeof COMMUNITY!=='undefined')for(const p of COMMUNITY.posts){const prod=COMMUNITY.products.find(x=>x.id===p.product);if(prod&&prod.catalog)add(prod.catalog,3+(p.likes||0)/50);}
   return [...score.entries()].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)).map(([id])=>byId(id));}).slice(0,n);},
 index(){return this.cached('index',()=>PERFUMES.map(p=>({p,name:this.norm(p.name),brand:this.norm(p.brand),full:this.norm(p.brand+' '+p.name),words:this.words(p.name+' '+p.brand+' '+(p.subtitle||''))})));},
 rank(q,key,words){if(!q)return -1;if(key===q)return 0;if(key.startsWith(q))return 1;if(words&&words.some(w=>w.startsWith(q)))return 2;if(key.includes(q))return 4;return -1;},
 /* Busca única: perfumes, notas, marcas e pessoas; sem acento; prefixo antes de "contém". */
 search(q){const n=this.norm(q),out={perfumes:[],notes:[],brands:[],people:[]};if(!n)return out;
  const qw=this.words(q),first=qw[0]||n;
  const ps=[];for(const x of this.index()){let r=this.rank(n,x.name,x.words);const rb=this.rank(n,x.brand);const rf=this.rank(n,x.full);
   if(r<0&&qw.length>1&&qw.every(w=>x.words.some(y=>y.startsWith(w))))r=3;
   const best=[r,rb>=0?rb+1:-1,rf>=0?rf+1:-1].filter(v=>v>=0);if(best.length)ps.push([Math.min(...best),x.p]);}
  out.perfumes=ps.sort((a,b)=>a[0]-b[0]||a[1].name.localeCompare(b[1].name,'pt-BR')).map(x=>x[1]);
  const ing=typeof INGREDIENTS!=='undefined'?INGREDIENTS:[],alias=typeof INGREDIENT_ALIASES!=='undefined'?INGREDIENT_ALIASES:{};
  out.notes=ing.map(i=>{let r=this.rank(n,this.norm(i.name),this.words(i.name));for(const k of alias[i.id]||[]){const v=this.rank(n,this.norm(k),this.words(k));if(v>=0&&(r<0||v+5<r))r=v+5;}return [r,i];})
   .filter(x=>x[0]>=0).sort((a,b)=>a[0]-b[0]||a[1].name.localeCompare(b[1].name,'pt-BR')).map(x=>x[1]);
  out.brands=this.brands().map(b=>[this.rank(n,this.norm(b.name),this.words(b.name)),b]).filter(x=>x[0]>=0).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  const people=typeof People!=='undefined'&&People.all?People.all():[];
  out.people=people.map(u=>[Math.min(...[this.rank(n,this.norm(u.name),this.words(u.name)),this.rank(this.norm(first),this.norm(u.handle||''))].map(v=>v<0?99:v)),u]).filter(x=>x[0]<99).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  return out;},
 credit(id){try{return typeof IMAGE_CREDITS!=='undefined'&&IMAGE_CREDITS[id]?IMAGE_CREDITS[id]:null;}catch(e){return null;}},
 /* Onde comprar (REQ §16): só busca orgânica e a página oficial; nada de preço, estoque ou parceiro. */
 marketplace:/(shopee|ebay|amazon|mercadolivre|mercadolibre|magazineluiza|magalu|aliexpress|americanas|fragrantica|sephora|epocacosmeticos|belezanaweb|olx)\./i,
 shopLinks(p){if(!p)return [];const conc=p.concentration&&!/não informada/i.test(p.concentration)?' '+p.concentration:'';
  const out=[{kind:'search',label:'Ver preços no Google Shopping',href:'https://www.google.com/search?tbm=shop&q='+encodeURIComponent(p.brand+' '+p.name+conc)}];
  const n=p.notes;if(n&&typeof n.source==='string'&&/^https:\/\//.test(n.source)&&(n.reliability==='Fonte oficial'||n.sourceLabel==='Fonte oficial')&&!this.marketplace.test(n.source))
   out.push({kind:'official',label:'Página oficial da marca',href:n.source});
  return out;}
};
