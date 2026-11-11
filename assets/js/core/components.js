'use strict';
/* Componentes de interface (§4.1). Todos devolvem HTML; todo texto passa por esc. */
const UI={
 /* ---------- helpers ---------- */
 attr(v){return esc(v);},
 initials(name){const w=String(name||'').trim().split(/\s+/).filter(Boolean);return ((w[0]||'?')[0]+(w.length>1?w[w.length-1][0]:'')).toUpperCase();},
 plural(n,one,many){return `${UI.count(n)} ${n===1?one:many}`;},
 /* ---------- pessoas ---------- */
 avatar(user,cls=''){
  const me=!user,p=me?(typeof state!=='undefined'?state.profile:{name:''}):user,name=p.name||'';
  const src=me?p.photo:(user.photo||user.image||'');const ini=user&&user.initials?user.initials:UI.initials(name);
  const mono=me&&p.photoBW?' mono':'';
  return `<span class="avatar ${esc(cls)}${mono}" data-initials="${esc(ini)}">${src?`<img src="${esc(src)}" alt="" loading="lazy" decoding="async">`:esc(ini)}</span>`;},
 personRow(u,{affinity=false,follow=true}={}){if(!u)return '';
  const on=typeof state!=='undefined'&&state.following.includes(u.id);let line='';
  if(affinity&&typeof OMap!=='undefined'&&OMap.compat){try{const c=OMap.compat(Select.map(),state.ratings,u.id),a=c&&c.agree&&c.agree[0];const ax=a&&(typeof a==='string'?a:a.axis||a.id);
   const def=typeof MAP_AXES!=='undefined'?MAP_AXES.find(x=>x.id===ax):null;if(def)line='Parecido em '+def.label.toLowerCase();}catch(e){}}
  if(!line)line=u.role||'';
  return `<div class="row person-row"><a class="row-main pressable" href="#person/${esc(u.id)}" data-action="person" data-id="${esc(u.id)}">${UI.avatar(u)}<span class="grow"><b>${esc(u.name)}${UI.badge(u.verified)}</b><span class="muted t-sm">@${esc(u.handle||u.id)}${line?' · '+esc(line):''}</span></span></a>${follow?UI.followBtn(u.id,on):''}</div>`;},
 followBtn(id,on){return `<button type="button" class="btn btn--sm ${on?'btn--secondary':''} pressable" data-action="follow" data-id="${esc(id)}" data-follow="${esc(id)}" aria-pressed="${on}">${on?'Seguindo':'Seguir'}</button>`;},
 personCard(u,{i=0}={}){if(!u)return '';const src=u.image||u.photo||'';
  return `<a class="person-card pressable" href="#person/${esc(u.id)}" data-action="person" data-id="${esc(u.id)}" style="--i:${i}"><span class="pc-img">${src?`<img class="bw" src="${esc(src)}" alt="" loading="lazy" decoding="async">`:`<span class="pc-ini">${esc(u.initials||UI.initials(u.name))}</span>`}</span><b>${esc(u.name)}</b><span>${esc(u.role||'@'+(u.handle||u.id))}</span></a>`;},
 /* ---------- perfumes ---------- */
 photo(p,{cls='',eager=false,hero=false}={}){if(!p)return `<div class="plate ${esc(cls)}"></div>`;
  const name=(p.name||'')+(p.subtitle?' '+p.subtitle:'');const vt=hero&&typeof Motion!=='undefined'&&Motion.consumeHero()?' style="view-transition-name:hero"':'';
  const inner=p.image?`<img src="${esc(p.image)}" alt="${esc(p.brand+' '+name)}" ${eager?'loading="eager" fetchpriority="high"':'loading="lazy"'} decoding="async" data-brand="${esc(p.brand)}" data-name="${esc(name)}">`
   :`<div class="fallback"><b>${esc(p.brand)}</b><span>${esc(name)}</span></div>`;
  return `<div class="plate ${esc(cls)}"${vt}>${inner}</div>`;},
 tile(p,{i=0,action='perfume',sub=''}={}){if(!p)return '';
  return `<a class="tile pressable" href="#perfume/${esc(p.id)}" data-action="${esc(action)}" data-id="${esc(p.id)}" style="--i:${i}">${UI.photo(p)}<span class="name">${esc(p.name)}${p.subtitle?' <span class="muted">'+esc(p.subtitle)+'</span>':''}</span><span class="brand">${esc(p.brand)}</span>${sub?`<span class="sub t-sm muted">${sub}</span>`:''}</a>`;},
 row(p,{action='perfume',trail='',sub=''}={}){if(!p)return '';
  return `<div class="row"><a class="row-main pressable" href="#perfume/${esc(p.id)}" data-action="${esc(action)}" data-id="${esc(p.id)}"><span class="thumb plate">${p.image?`<img src="${esc(p.image)}" alt="" loading="lazy" decoding="async" data-brand="${esc(p.brand)}" data-name="${esc(p.name)}">`:''}</span><span class="grow"><b>${esc(p.name)}</b><span class="muted t-sm">${sub||esc(p.brand)}</span></span></a>${trail?`<div class="row-trail">${trail}</div>`:''}</div>`;},
 /* ---------- estrutura ---------- */
 pageHead({eyebrow='',title='',sub='',actions=''}={}){
  return `<header class="page-head">${eyebrow?`<p class="t-eyebrow muted">${esc(eyebrow)}</p>`:''}<h1 class="t-display">${esc(title)}</h1>${sub?`<p class="em page-sub">${sub}</p>`:''}${actions?`<div class="page-actions">${actions}</div>`:''}<i data-sentinel aria-hidden="true"></i></header>`;},
 section({eyebrow='',title='',more=null,body='',cls='',rail=''}={}){if(!body)return '';
  const nav=rail?`<div class="rail-nav">${UI.iconBtn('chevron-left',{action:'rail-prev',label:'Anterior',attrs:`data-id="${esc(rail)}" disabled`})}${UI.iconBtn('chevron-right',{action:'rail-next',label:'Próximo',attrs:`data-id="${esc(rail)}"`})}</div>`:'';
  const mo=more?UI.btn(more.label||'Ver tudo',{variant:'tertiary',href:more.href,icon:'arrow-up-right',attrs:more.attrs||''}):'';
  const head=eyebrow||title||mo||nav?`<div class="sec-head"><div class="sec-title">${eyebrow?`<p class="t-eyebrow muted">${esc(eyebrow)}</p>`:''}${title?`<h2 class="t-h2">${esc(title)}</h2>`:''}</div>${mo||nav?`<div class="sec-tools">${mo}${nav}</div>`:''}</div>`:'';
  return `<section class="sec ${esc(cls)}">${head}${body}</section>`;},
 rail(items,{name='',label='',rows=1}={}){const list=Array.isArray(items)?items.filter(Boolean):[];
  const html=Array.isArray(items)?list.map(x=>`<div role="listitem">${x}</div>`).join(''):String(items||'');if(!html)return '';
  return `<div class="rail rail-x${rows===2?' rail-x--2':''}" data-rail="${esc(name)}" role="list" aria-label="${esc(label)}">${html}</div>`;},
 segNav(items,activeId,{label='',block=false}={}){const i=items.findIndex(x=>x.id===activeId);
  return `<nav class="seg seg--quiet${block||items.length>=4?' seg--block':''}${i<0?' seg--none':''}" aria-label="${esc(label)}" style="--n:${items.length};--i:${Math.max(0,i)}">${items.map(x=>`<a href="${esc(x.href)}" data-id="${esc(x.id)}"${x.id===activeId?' aria-current="page"':''}${x.title?` title="${esc(x.title)}" aria-label="${esc(x.title)}"`:''}>${esc(x.label)}</a>`).join('')}</nav>`;},
 seg(items,active,action,{variant='quiet',name='',block=false,label=''}={}){const i=items.findIndex(x=>x.id===active),n=name||action;
  return `<div class="seg${variant==='ink'?'':' seg--quiet'}${block||items.length>=4?' seg--block':''}${i<0?' seg--none':''}" role="tablist" aria-label="${esc(label)}" style="--n:${items.length};--i:${Math.max(0,i)}" data-seg="${esc(n)}">${items.map((x,k)=>`<button type="button" role="tab" id="tab-${esc(n)}-${esc(x.id)}" aria-selected="${x.id===active}" tabindex="${x.id===active||i<0&&k===0?0:-1}" aria-controls="panel-${esc(n)}" data-action="${esc(action)}" data-id="${esc(x.id)}">${x.html||esc(x.label)}</button>`).join('')}</div>`;},
 /* Atualiza o segmento sem redesenhar (a pílula desliza). */
 segSet(seg,id){if(!seg)return;const items=[...seg.querySelectorAll(':scope>button,:scope>a')];const i=items.findIndex(b=>b.dataset.id===String(id));
  seg.style.setProperty('--i',Math.max(0,i));seg.classList.toggle('seg--none',i<0);
  items.forEach((b,k)=>{const on=k===i;if(b.getAttribute('role')==='tab'){b.setAttribute('aria-selected',on);b.tabIndex=on||i<0&&k===0?0:-1;}
   else if(b.getAttribute('role')==='radio')b.setAttribute('aria-checked',on);else if(b.tagName==='A'){if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}else b.setAttribute('aria-pressed',on);});},
 chips(items,action,{scroll=false,name='',label=''}={}){if(!items||!items.length)return '';
  return `<div class="chips${scroll?' rail-x':''}"${name?` data-chips="${esc(name)}"`:''}${label?` role="group" aria-label="${esc(label)}"`:''}>${items.map(x=>{const st=x.state||'';const pressed=st==='like'||(!st&&!!x.on);
   return `<button type="button" class="chip pressable${st==='avoid'?' avoid':''}" aria-pressed="${pressed}" data-action="${esc(action)}" data-id="${esc(x.id)}"${st?` data-state="${st}"`:''}>${esc(x.label)}${st==='like'?'<span class="sr-only"> (gosto)</span>':st==='avoid'?'<span class="sr-only"> (evito)</span>':''}</button>`;}).join('')}</div>`;},
 btn(label,{action='',variant='primary',size='',icon:ic='',attrs='',href=''}={}){
  const cls=['btn','pressable'];if(variant&&variant!=='primary')cls.push('btn--'+variant);for(const s of String(size).split(/\s+/).filter(Boolean))cls.push('btn--'+s);
  const inner=`${ic&&variant!=='tertiary'?icon(ic,'icon--20'):''}<span>${esc(label)}</span>${ic&&variant==='tertiary'?icon(ic):''}`;
  const act=action?` data-action="${esc(action)}"`:'';
  return href?`<a class="${cls.join(' ')}" href="${esc(href)}"${act} ${attrs}>${inner}</a>`:`<button type="button" class="${cls.join(' ')}"${act} ${attrs}>${inner}</button>`;},
 iconBtn(name,{action='',label='',attrs='',bare=false,href='',cls=''}={}){
  const c=`icon-btn pressable${bare?' icon-btn--bare':''}${cls?' '+cls:''}`,act=action?` data-action="${esc(action)}"`:'';
  return href?`<a class="${c}" href="${esc(href)}"${act} aria-label="${esc(label)}" ${attrs}>${icon(name)}</a>`:`<button type="button" class="${c}"${act} aria-label="${esc(label)}" ${attrs}>${icon(name)}</button>`;},
 empty({icon:ic='',title='',text='',cta=null}={}){
  const b=cta?(cta.href?UI.btn(cta.label,{href:cta.href,size:'sm',variant:cta.variant||'primary',action:cta.action||'',attrs:cta.attrs||''}):UI.btn(cta.label,{action:cta.action||'',size:'sm',variant:cta.variant||'primary',attrs:cta.attrs||''})):'';
  return `<div class="empty">${ic?`<span class="muted">${icon(ic)}</span>`:''}<h2 class="t-h2">${esc(title)}</h2>${text?`<p>${esc(text)}</p>`:''}${b}</div>`;},
 /* ---------- dados ---------- */
 num(value,unit='',{count=true,w=3}={}){const n=Number(value);if(!Number.isFinite(n))return `<b class="num t-num">—</b>`;const v=Math.round(n);
  return `<b class="num t-num"${count?` data-count="${v}"`:''} style="--num-w:${w}ch">${v}${unit?`<small>${esc(unit)}</small>`:''}</b>`;},
 dataCard({eyebrow='',title='',sub='',value=null,unit='',count=true,chart='',foot='',cls=''}={}){
  return `<article class="data-card ${esc(cls)}">${eyebrow?`<p class="t-eyebrow muted">${esc(eyebrow)}</p>`:''}${title?`<h3 class="t-h3">${esc(title)}</h3>`:''}${value!==null&&value!==undefined?UI.num(value,unit,{count}):''}${sub?`<p class="t-sm muted">${sub}</p>`:''}${chart}${foot?`<div class="dc-foot t-sm muted">${foot}</div>`:''}</article>`;},
 spark(values,{w=320,h=88,peak=true,label=''}={}){const v=(values||[]).map(Number).filter(Number.isFinite);
  if(v.length<2)return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label||'Poucos dados')}"><path class="track" d="M4 ${h/2}H${w-4}"/><text x="${w/2}" y="${h/2-10}" text-anchor="middle" class="chart-muted">Poucos dados</text></svg>`;
  const pad=12,top=26,min=Math.min(...v),max=Math.max(...v),span=max-min||1,X=i=>pad+i*(w-2*pad)/(v.length-1),Y=x=>h-pad-(x-min)/span*(h-pad-top);
  const d=v.map((x,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(x).toFixed(1)).join('');const pi=v.indexOf(max),px=X(pi),py=Y(max),txt=String(Math.round(max)),tw=txt.length*7+14;
  const ticks=[.25,.5,.75].map(f=>`<path class="tick" d="M${(pad+f*(w-2*pad)).toFixed(1)} ${h-pad}v-4"/>`).join('');
  const lx=Math.max(tw/2,Math.min(w-tw/2,px));
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${ticks}<path class="line" data-draw d="${d}"/>${peak?`<circle class="dot" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5"/><g class="pill"><rect x="${(lx-tw/2).toFixed(1)}" y="${Math.max(0,py-26).toFixed(1)}" width="${tw}" height="18" rx="9"/><text x="${lx.toFixed(1)}" y="${(Math.max(0,py-26)+12.5).toFixed(1)}" text-anchor="middle">${txt}</text></g>`:''}</svg>`;},
 gauge(pct,{size=120}={}){const p=Math.max(0,Math.min(100,Number(pct)||0)),r=size/2-6,c=size/2,a0=Math.PI*.75,a1=Math.PI*2.25,pt=a=>[(c+r*Math.cos(a)).toFixed(2),(c+r*Math.sin(a)).toFixed(2)];
  const arc=(from,to)=>{const [x0,y0]=pt(from),[x1,y1]=pt(to);return `M${x0} ${y0}A${r} ${r} 0 ${to-from>Math.PI?1:0} 1 ${x1} ${y1}`;};const end=a0+(a1-a0)*p/100;
  return `<svg class="chart gauge" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${Math.round(p)}%"><path class="track" d="${arc(a0,a1)}"/>${p>0?`<path class="arc" data-draw d="${arc(a0,Math.max(a0+.01,end))}"/>`:''}</svg>`;},
 bars(values,limit=5){const list=(values||[]).filter(x=>x&&Number.isFinite(Number(x.value))).slice(0,limit);if(!list.length)return '';
  return `<ul class="bars">${list.map(x=>{const v=Math.max(0,Math.min(100,Number(x.value)));return `<li><span class="lbl">${esc(x.label)}</span><span class="val">${esc(x.text!==undefined?x.text:Math.round(v))}</span><span class="bar"><i style="--v:${(v/100).toFixed(3)}"></i></span></li>`;}).join('')}</ul>`;},
 /* ---------- editorial ---------- */
 coverSrc(image){if(typeof PROFILE_RULES!=='undefined'&&PROFILE_RULES.covers[image]){const c=PROFILE_RULES.covers[image];return {src:c.src,srcset:`${c.src800} 800w, ${c.src} 1600w`};}return {src:image,srcset:''};},
 cover({image='',eyebrow=[],title='',text='',ratio='4/5',bw=true,mega=false,href='',eager=false,cls=''}={}){
  const s=UI.coverSrc(image),tag=href?'a':'figure',eb=(eyebrow||[]).filter(Boolean);
  const img=image?`<img src="${esc(s.src)}"${s.srcset?` srcset="${esc(s.srcset)}" sizes="100vw"`:''} alt="" class="${bw?'bw':''}" ${eager?'loading="eager" fetchpriority="high"':'loading="lazy"'} decoding="async">`:'';
  const h=title?(mega?`<h1 class="t-mega" data-fit>${esc(title)}</h1>`:`<h2 class="t-display">${esc(title)}</h2>`):'';
  return `<${tag} class="cover ${esc(cls)}"${href?` href="${esc(href)}"`:''} style="aspect-ratio:${esc(ratio)}">${img}<div class="scrim"></div>${eb.length||h||text?`<div class="caption">${eb.length?`<p class="t-eyebrow">${eb.map(esc).join(' · ')}</p>`:''}${h}${text?`<p>${esc(text)}</p>`:''}</div>`:''}</${tag}>`;},
 edTile(e){if(!e)return '';const s=UI.coverSrc(e.cover);
  return `<a class="ed-tile span-all pressable" href="#edit/${esc(e.id)}"><span class="cover"><img class="bw" src="${esc(s.src)}"${s.srcset?` srcset="${esc(s.srcset)}" sizes="100vw"`:''} alt="" loading="lazy" decoding="async"><span class="scrim"></span></span><span class="t-display">${esc(e.title)}</span></a>`;},
 who(author){if(!author)return '';const u=typeof author==='string'?{name:author}:author;return `<figcaption>${UI.avatar(u,'xs')}<span>${esc(u.name)}</span></figcaption>`;},
 quote({text='',author=null}={}){return `<figure class="quote"><blockquote>${esc(text)}</blockquote>${UI.who(author)}</figure>`;},
 glassQuote({text='',author=null}={}){const t=esc(text).replace(/&lt;(\/?)b&gt;/g,'<$1b>');return `<figure class="glass-card glass-quote"><blockquote>${t}</blockquote>${UI.who(author)}</figure>`;},
 /* ---------- datas e números (nunca literais) ---------- */
 toDate(d){if(d instanceof Date)return d;if(typeof d==='number')return new Date(d);if(typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)){const [y,m,x]=d.split('-').map(Number);return new Date(y,m-1,x);}const t=new Date(d);return isNaN(t)?new Date():t;},
 date(d=new Date(),fmt='long'){const x=UI.toDate(d),L='pt-BR';
  const mon=x.toLocaleDateString(L,{month:'short'}).replace('.','');
  if(fmt==='eyebrow')return x.toLocaleDateString(L,{weekday:'long'}).replace(/-feira$/,'')+' · '+x.getDate()+' '+mon;
  if(fmt==='month-year')return x.toLocaleDateString(L,{month:'long'})+' '+x.getFullYear();
  if(fmt==='short')return x.toLocaleDateString(L,{day:'2-digit',month:'2-digit',year:'numeric'});
  if(fmt==='day')return x.getDate()+' '+mon;
  return x.toLocaleDateString(L,{day:'numeric',month:'long',year:'numeric'});},
 when(v){const t=UI.toDate(v).getTime(),now=Date.now(),s=Math.max(0,(now-t)/1000);
  if(s<60)return 'agora';if(s<3600)return 'há '+Math.floor(s/60)+' min';
  const a=new Date(t),b=new Date(now),day=x=>new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime(),dd=Math.round((day(b)-day(a))/864e5);
  if(dd===0)return 'há '+Math.floor(s/3600)+' h';if(dd===1)return 'ontem';
  const mon=a.toLocaleDateString('pt-BR',{month:'short'}).replace('.','');return a.getDate()+' '+mon+(a.getFullYear()!==b.getFullYear()?' '+a.getFullYear():'');},
 count(n){const v=Number(n)||0;if(Math.abs(v)<1000)return String(Math.round(v));return new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:v<1e4||v>=1e6&&v<1e7?1:0}).format(v).replace(/\s?mil/,' mil').replace(/\s?mi$/,' mi');},
 /* ---------- formulários ---------- */
 uid:0,
 field({name,label,value='',type='text',max=0,counter=false,hint='',error='',attrs=''}={}){const id='f-'+esc(name)+'-'+(++UI.uid),d=[hint?id+'-h':'',error?id+'-e':''].filter(Boolean).join(' ');
  return `<label class="field"${error?' aria-invalid="true"':''}><span>${esc(label)}</span><input id="${id}" name="${esc(name)}" type="${esc(type)}" value="${esc(value)}"${max?` maxlength="${max}" data-max="${max}"`:''}${d?` aria-describedby="${d}"`:''}${error?' aria-invalid="true"':''} ${attrs}>${counter&&max?`<span class="count" aria-hidden="true">${String(value).length}/${max}</span>`:''}${hint?`<small class="t-sm muted" id="${id}-h">${esc(hint)}</small>`:''}${error?`<span class="err" id="${id}-e" role="alert">${esc(error)}</span>`:''}</label>`;},
 textarea({name,label,value='',max=280,counter=true,rows=3,attrs=''}={}){const id='f-'+esc(name)+'-'+(++UI.uid);
  return `<label class="field"><span>${esc(label)}</span><textarea id="${id}" name="${esc(name)}" rows="${rows}"${max?` maxlength="${max}" data-max="${max}"`:''} ${attrs}>${esc(value)}</textarea>${counter&&max?`<span class="count" aria-hidden="true">${String(value).length}/${max}</span>`:''}</label>`;},
 toggle({name,label,on=false,sub='',attrs=''}={}){return `<label class="toggle-row"><span class="grow"><span class="tg-label">${esc(label)}</span>${sub?`<span class="t-sm muted">${esc(sub)}</span>`:''}</span><input type="checkbox" role="switch" class="switch" name="${esc(name)}"${on?' checked':''} ${attrs}></label>`;},
 /* Grupo de cores (tons): name também é a ação de clique; ←/→ movem (core/actions.js). */
 swatches(name,options,value,{label=''}={}){return `<div class="swatches" role="radiogroup" aria-label="${esc(label||name)}" data-radios="${esc(name)}">${options.map(o=>`<button type="button" class="swatch" role="radio" aria-checked="${o.id===value}" tabindex="${o.id===value?0:-1}" aria-label="${esc(o.label)}" data-action="${esc(name)}" data-id="${esc(o.id)}" data-tone="${esc(o.id)}"><i${o.css?` style="background:${esc(o.css)}"`:''}></i></button>`).join('')}</div>`;},
 progress(step,total){const t=Math.max(1,total),s=Math.max(0,Math.min(t,step));return `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${t}" aria-valuenow="${s}" aria-label="Progresso" style="--p:${(s/t).toFixed(3)}"><i></i></div>`;},
 RATING:[[2,'Não é pra mim'],[4,'Ok'],[6,'Gosto'],[8,'Amo'],[10,'Assinatura']],
 ratingStep(v){if(v===null||v===undefined||v==='')return -1;const n=Number(v);return n>=9?4:n>=7?3:n>=5?2:n>=3?1:0;},
 ratingLabel(v){const i=UI.ratingStep(v);return i<0?'':UI.RATING[i][1];},
 ratingScale(value,action='rate-set'){const i=UI.ratingStep(value);
  return `<div class="seg seg--quiet seg--block rating-scale${i<0?' seg--none':''}" role="radiogroup" aria-label="Sua avaliação" data-radios="${esc(action)}" style="--n:5;--i:${Math.max(0,i)}">${UI.RATING.map(([v,l],k)=>`<button type="button" role="radio" aria-checked="${k===i}" tabindex="${k===i||i<0&&k===0?0:-1}" data-action="${esc(action)}" data-id="${v}" data-v="${v}">${esc(l)}</button>`).join('')}</div>`;},
 shelfSeg(id){const cur=typeof Select!=='undefined'?Select.shelf(id):null,i=SHELF.findIndex(x=>x.id===cur);
  return `<div class="seg seg--quiet seg--block shelf-seg${i<0?' seg--none':''}" role="group" aria-label="Na sua coleção" data-shelf="${esc(id)}" style="--n:3;--i:${Math.max(0,i)}">${SHELF.map(x=>`<button type="button" aria-pressed="${x.id===cur}" data-action="shelf-set" data-id="${esc(id)}" data-status="${x.id}">${esc(x.label)}</button>`).join('')}</div>`;},
 badge(verified){return verified?`<span class="badge" role="img" aria-label="Verificado">${icon('check')}</span>`:'';},
 back(label='Voltar'){return UI.iconBtn('chevron-left',{action:'back',label});},
 skeleton(n=1,cls='tile'){return Array.from({length:n},()=>`<div class="skeleton skeleton--${esc(cls)}" aria-hidden="true"></div>`).join('');},
 sheetHead(title,{close=true,left=''}={}){return `<div class="sheet-head">${left||'<span class="sh-spacer" aria-hidden="true"></span>'}<h2>${esc(title)}</h2>${close?UI.iconBtn('close',{action:'close',label:'Fechar'}):'<span class="sh-spacer" aria-hidden="true"></span>'}</div>`;},
 /* ---------- explicação e confiança ---------- */
 levelText(level,n){const c=Number(n)||0,ev=c?' · '+UI.plural(c,'avaliação','avaliações'):'';
  if(!level||level==='Dados insuficientes')return 'Dados insuficientes'+ev;return 'Confiança '+String(level).toLowerCase()+ev;},
 why(x,{feedback='',compact=false}={}){if(!x)return '';
  const chance=Number.isFinite(Number(x.chance))?`<span>Chance de gostar <b>${Math.round(x.chance)}%</b></span>`:'';
  if(compact)return `<div class="why why--compact">${x.line?`<p class="em">${esc(x.line)}</p>`:''}${chance?`<p class="meta">${chance}</p>`:''}</div>`;
  const sim=x.similar&&x.similar.p?`<span>Parecido com <b>${esc(x.similar.p.name)}</b> · ${Math.round(x.similar.pct)}%</span>`:'';
  const conf=`<span>${esc(UI.levelText(x.level,x.n))}</span>`;
  return `<div class="why">${x.line?`<p class="em">${esc(x.line)}</p>`:''}<p class="meta">${chance}${sim}${conf}${x.experimental?'<span class="exp">Experimental</span>':''}</p>${x.caution?`<p class="t-sm muted caution">${esc(x.caution)}</p>`:''}${feedback&&x.id?UI.feedback(x.id,feedback):''}</div>`;},
 feedback(id,source){const f=typeof state!=='undefined'&&state.feedback[id];const v=f?f.v:0;
  return `<div class="feedback" role="group" aria-label="Esta recomendação acertou?" data-feedback="${esc(id)}"><span>Acertou?</span><button type="button" class="chip pressable" aria-pressed="${v===1}" data-action="intel-feedback" data-id="${esc(id)}" data-v="1" data-src="${esc(source)}">Sim</button><button type="button" class="chip pressable" aria-pressed="${v===-1}" data-action="intel-feedback" data-id="${esc(id)}" data-v="-1" data-src="${esc(source)}">Não</button></div>`;},
 linkRow({icon:ic='arrow',title='',sub='',href='#',external=false,attrs=''}={}){
  return `<a class="link-row pressable" href="${esc(href)}"${external?' target="_blank" rel="noopener noreferrer"':''} ${attrs}><span class="ico">${icon(ic,'icon--20')}</span><span class="grow"><b>${esc(title)}</b>${sub?`<span>${esc(sub)}</span>`:''}</span>${icon(external?'arrow-up-right':'chevron-right','icon--20')}${external?'<span class="sr-only"> (abre em nova aba)</span>':''}</a>`;},
 axisText(a){const n=Number(a.n)||0;if(a.text)return a.text;if(a.level==='hipotese')return 'hipótese · '+UI.plural(Math.max(n,Number(a.nh)||0),'sinal','sinais');
  if(a.level==='sem-dados')return 'sem dados';return Math.round((Number(a.value)||0)*100)+' · '+UI.plural(n,'avaliação','avaliações');},
 axisBars(axes,{limit=8,action=''}={}){const list=(axes||[]).slice(0,limit);if(!list.length)return '';
  return `<ul class="axis-bars">${list.map(a=>`<li data-level="${esc(a.level||'')}"${a.corrected?' data-corrected':''}><span class="lbl">${esc(a.label)}</span><span class="val">${esc(UI.axisText(a))}${action?' '+UI.btn('Corrigir',{action,variant:'tertiary',attrs:`data-id="${esc(a.id)}" aria-label="Corrigir ${esc(a.label)}"`}):''}</span><span class="bar"><i style="--v:${Math.max(0,Math.min(1,Number(a.value)||0)).toFixed(3)}"></i>${a.them!==undefined&&a.them!==null?`<i class="them" style="--v:${Math.max(0,Math.min(1,Number(a.them)||0)).toFixed(3)}"></i>`:''}</span></li>`).join('')}</ul>`;}
};
/* Aliases de compatibilidade (declarados só aqui). */
const card=p=>UI.tile(p),avatar=(u,c)=>UI.avatar(u,c),back=()=>UI.back();
