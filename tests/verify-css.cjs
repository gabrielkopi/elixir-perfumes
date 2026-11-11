/* Core: blocos DARK idênticos, contraste dos tokens (§2.1, §6), sem font-family/cores literais fora de base.css,
   !important só no bloco de movimento reduzido, Italiana removida e todo CSS/JS ligado existe. */
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
let fails=0,checks=0;const fail=m=>{fails++;console.log('  FAIL '+m);},check=(c,m)=>{checks++;if(!c)fail(m);};
const base=read('assets/css/base.css');

/* ---------- blocos DARK ---------- */
const grab=(s,start)=>{const i=s.indexOf(start);if(i<0)return null;let d=0,j=i+start.length-1;for(;j<s.length;j++){if(s[j]==='{')d++;else if(s[j]==='}'){d--;if(d===0)break;}}return s.slice(i+start.length,j);};
const norm=s=>(s||'').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').trim();
const darkMedia=grab(base,'@media (prefers-color-scheme:dark){:root:not([data-theme=light]){'),darkAttr=grab(base,':root[data-theme=dark]{');
check(darkMedia&&darkAttr,'blocos DARK presentes');check(norm(darkMedia)===norm(darkAttr),'os dois blocos DARK são idênticos');
const tm=/\/\* TONES-DARK[^*]*\*\/([\s\S]*?)\/\* \/TONES-DARK \*\//.exec(base);
if(tm){const media=grab(tm[1],'@media (prefers-color-scheme:dark){'),rest=tm[1].slice(tm[1].indexOf(media)+media.length+1);
 check(norm(media).replace(/:root:not\(\[data-theme=light\]\)/g,':root[data-theme=dark]')===norm(rest),'tons escuros espelhados nos dois seletores');}else fail('bloco TONES-DARK ausente');

/* ---------- contraste ---------- */
const tokens=block=>{const o={};for(const m of (block||'').matchAll(/--([\w-]+)\s*:\s*([^;]+);/g))o[m[1]]=m[2].trim();return o;};
const light=tokens(grab(base,':root{')),dark={...light,...tokens(darkAttr)};
const hex=v=>{const m=/^#([0-9a-f]{6})$/i.exec(String(v).trim());if(!m)return null;const n=parseInt(m[1],16);return [n>>16&255,n>>8&255,n&255];};
const lum=([r,g,b])=>{const f=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4;};return .2126*f(r)+.7152*f(g)+.0722*f(b);};
const ratio=(a,b)=>{const A=lum(a),B=lum(b);return (Math.max(A,B)+.05)/(Math.min(A,B)+.05);};
const tones={light:{},dark:{}};
for(const m of base.matchAll(/(:root:not\(\[data-theme=light\]\) |:root\[data-theme=dark\] )?:is\(\.v-profile,\.sh-edit \.preview\)\[data-tone=(\w+)\]\{([^}]*)\}/g)){const t=tokens(m[3]);tones[m[1]?'dark':'light'][m[2]]=t;}
check(Object.keys(tones.light).length===5&&Object.keys(tones.dark).length===5,'5 tons além de papel, claro e escuro');
for(const [name,T] of [['claro',light],['escuro',dark]]){
 const surf=['bg','bg-elev','card','card-2'].map(k=>[k,hex(T[k])]);surf.push(['glass-bg',hex(T.bg)]);
 for(const fg of ['ink','ink-2'])for(const [k,c] of surf){const r=ratio(hex(T[fg]),c);check(r>=4.5,`${name}: --${fg} sobre --${k} = ${r.toFixed(2)} (<4.5)`);}
 for(const [k,c] of surf.filter(([k])=>k!=='card-2')){const r=ratio(hex(T.muted),c);check(r>=4.5,`${name}: --muted sobre --${k} = ${r.toFixed(2)} (<4.5)`);}
 for(const [id,t] of Object.entries(name==='claro'?tones.light:tones.dark)){
  check(ratio(hex(T.muted),hex(t.card))>=4.5,`${name}: --muted sobre --card do tom ${id}`);
  for(const fg of ['ink','ink-2']){check(ratio(hex(T[fg]),hex(t.card))>=4.5,`${name}: --${fg} sobre --card do tom ${id}`);check(ratio(hex(T[fg]),hex(t['card-2']))>=4.5,`${name}: --${fg} sobre --card-2 do tom ${id}`);}}
 check(ratio(hex(T['on-ink']),hex(T.ink))>=4.5,`${name}: --on-ink sobre --ink`);
}

/* ---------- regras de folhas de estilo ---------- */
const viewsDir=path.join(ROOT,'assets','css','views'),views=fs.readdirSync(viewsDir).filter(f=>f.endsWith('.css'));
for(const f of views){const s=fs.readFileSync(path.join(viewsDir,f),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 check(!/font-family\s*:/i.test(s),`views/${f}: font-family fora de base.css`);
 for(const m of s.matchAll(/(?:^|[;{\s])font\s*:([^;}]*)/g))check(/var\(--sans\)\s*$/.test(m[1].trim()),`views/${f}: font: deve usar var(--sans)`);
 check(!/#[0-9a-f]{3,8}\b/i.test(s.replace(/url\([^)]*\)/g,'')),`views/${f}: cor hexadecimal literal`);
 check(!/\b(rgba?|hsla?|hwb|lab|lch|oklch|oklab)\s*\(/i.test(s),`views/${f}: função de cor literal`);
 check(!/:\s*[^;{}]*\b(white|black)\b/i.test(s),`views/${f}: cor nomeada literal`);
 check(!/!important/.test(s),`views/${f}: !important`);}
const rm=/\/\* REDUCED-MOTION[^*]*\*\/([\s\S]*?)\/\* \/REDUCED-MOTION \*\//.exec(base);
check(rm&&(rm[1].match(/!important/g)||[]).length===6,'bloco de movimento reduzido com os 6 !important');
check(((rm?base.replace(rm[0],''):base).match(/!important/g)||[]).length===0,'nenhum !important fora do bloco de movimento reduzido');
const fonts=read('assets/css/fonts.css');check(!/Italiana/i.test(fonts+base),'Italiana removida do CSS');check(!/elixir-font-4/.test(fonts),'fonts.css sem elixir-font-4');
check(!fs.existsSync(path.join(ROOT,'assets','elixir-font-4.ttf'))&&!fs.existsSync(path.join(ROOT,'assets','LICENSE-italiana.txt')),'arquivo e licença da Italiana apagados');
check((fonts.match(/font-family:\s*'DM Sans'/g)||[]).length===4,'DM Sans 400/500/600/700');
check(!/font-family\s*:/i.test(base.replace(/--sans:[^;]*;/,'').replace(/font:[^;}]*/g,'')),'base.css: font-family só no token --sans');
check(!fs.existsSync(path.join(ROOT,'assets','css','app.css')),'app.css apagado');

/* ---------- páginas: tudo o que é ligado existe ---------- */
const CSS=['fonts.css','base.css','views/post.css',...['activity','brand','bubble','circle','collection','compare','compose','connect','explore','guide','home','map','notes','perfume','profile-edit','profile','search','stories','today','welcome'].map(v=>`views/${v}.css`)];
for(const html of ['index.html','elixir.html','perfume-social.html','assinatura.html']){const src=read(html);
 const links=[...src.matchAll(/<link rel="stylesheet" href="assets\/css\/([^"?]+)\?v=91">/g)].map(m=>m[1]);
 check(JSON.stringify(links)===JSON.stringify(CSS),`${html}: ordem/conjunto de CSS (§2)`);check(!/app\.css/.test(src),`${html}: sem app.css`);
 for(const m of src.matchAll(/(?:href|src)="(assets\/[^"?]+)/g))check(fs.existsSync(path.join(ROOT,m[1])),`${html}: arquivo ligado não existe: ${m[1]}`);
 check(/<html lang="pt-BR"/.test(src),`${html}: lang pt-BR`);check(/font-family='DM Sans,Arial'/.test(src),`${html}: favicon em DM Sans`);
 check(src.indexOf('data-motion')>0&&src.indexOf('data-motion')<src.indexOf('<link rel="stylesheet"'),`${html}: script pré-pintura antes do CSS`);
 check(/<div class="app" id="app"><\/div><dialog class="sheet" id="sheet"><\/dialog><div id="stories" hidden><\/div><div id="toasts" aria-live="polite"><\/div>/.test(src),`${html}: corpo §3.1`);}

console.log(`verify-css: ${checks} verificações, ${fails} falha(s)`);
if(fails)process.exit(1);
