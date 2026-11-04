'use strict';
/* ELIXIR · apresentação em movimento.
   Motor: um relógio único (pausável), cenas montadas sob demanda, troca com fundido e HUD.
   Conteúdo: usa o catálogo, as notas e a comunidade reais do aplicativo. */

/* ================= utilitários ================= */
const W0=1920,H0=1080,NS='http://www.w3.org/2000/svg';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function h(tag,cls,html,parent){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;if(parent)parent.appendChild(e);return e;}
function S(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e;}
const on=e=>{e.getBoundingClientRect();e.classList.remove('out');e.classList.add('in');return e;};
const off=e=>{e.classList.remove('in');e.classList.add('out');return e;};
const easeOut=p=>1-Math.pow(1-p,3),easeIO=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const HEART='<svg viewBox="0 0 24 24"><path d="M20 5c-3-3-7-1-8 2-1-3-5-5-8-2-5 5 1 10 8 15 7-5 13-10 8-15Z"/></svg>';
const I={heart:'<svg viewBox="0 0 24 24"><path d="M20 5c-3-3-7-1-8 2-1-3-5-5-8-2-5 5 1 10 8 15 7-5 13-10 8-15Z"/></svg>',comment:'<svg viewBox="0 0 24 24"><path d="M20 15a9 9 0 1 0-5 5l5 1Z"/></svg>',share:'<svg viewBox="0 0 24 24"><path d="M12 15V2m-5 5 5-5 5 5M5 12v9h14v-9"/></svg>',save:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>',search:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>'};
/* "{...}" = apagado, "[...]" = destaque, "\n" = quebra. Cada palavra vira um span animável. */
function W(text){let i=0;const out=[];text.split(/(\{[^}]*\}|\[[^\]]*\])/).forEach(seg=>{if(!seg)return;let cls='',s=seg;if(seg[0]==='{'){cls=' mu';s=seg.slice(1,-1);}else if(seg[0]==='['){cls=' gd';s=seg.slice(1,-1);}
 s.split(/(\n| +)/).forEach(t=>{if(t==='\n')out.push('<br>');else if(/^ +$/.test(t))out.push(' ');else if(t)out.push(`<span class="w${cls}" style="--i:${i++}">${esc(t)}</span>`);});});return out.join('');}
const av=(u,d=56)=>u.image?`<span class="av" style="--d:${d}px"><img src="${u.image}" alt=""></span>`:`<span class="av" style="--d:${d}px;background:${u.color||'#6c7f68'};color:#fff">${esc(u.initials||u.name.slice(0,2))}</span>`;

/* ================= relógio e execuções ================= */
let CLK=0,paused=false;const TIMERS=new Set(),RUNS=new Set();
class Run{
 constructor(){this.alive=true;this.t=new Set();this.frames=new Set();RUNS.add(this);}
 wait(ms){return new Promise(res=>{if(!this.alive)return;const t={at:CLK+ms,res,run:this};TIMERS.add(t);this.t.add(t);});}
 frame(fn){if(this.alive)this.frames.add(fn);}
 tween(ms,fn,ease=easeOut){return new Promise(res=>{let t0=null;this.frame(()=>{if(t0===null)t0=CLK;const p=Math.min(1,(CLK-t0)/ms);fn(ease(p));if(p>=1){res();return false;}});});}
 stop(){this.alive=false;RUNS.delete(this);this.t.forEach(t=>TIMERS.delete(t));this.frames.clear();}
}
function tick(){for(const t of [...TIMERS])if(t.at<=CLK){TIMERS.delete(t);t.run.t.delete(t);if(t.run.alive)t.res();}for(const r of [...RUNS])for(const fn of [...r.frames])if(fn()===false)r.frames.delete(fn);}

/* ================= peças de cena ================= */
function head(root,s,run){const d=h('div','head',`<div class="eyebrow rv">${esc(s.kicker)}</div><h2 class="words">${W(s.heading)}</h2>`,root);run.wait(150).then(()=>{on(d.children[0]);on(d.children[1]);});return d;}
function slot(root,css){const s=h('div','capslot',null,root);if(css)s.style.cssText=css;return s;}
/* Legenda: entra palavra a palavra, fica o tempo de leitura e sai. */
async function say(run,sl,text,hold=0){const n=h('div','cap words',W(text),sl),k=n.querySelectorAll('.w').length;on(n);await run.wait(1000+k*65+Math.max(hold,1800+k*320));off(n);await run.wait(560+k*20);n.remove();}
function sayLast(sl,text){const n=h('div','cap words',W(text),sl);on(n);return n;}
const countUp=(run,el,to,ms=1400,fmt=v=>Math.round(v))=>run.tween(ms,p=>{el.textContent=fmt(to*p);});
async function type(run,el,text,speed=70){const sp=h('span','',null,el),car=h('span','caret',null,el);for(const c of text){sp.textContent+=c;await run.wait(speed*(.7+Math.random()*.6));}car.remove();}
function particles(root,run,n=60){const cv=h('canvas','bgcanvas',null,root),ctx=cv.getContext('2d'),R=Math.min(2,devicePixelRatio||1);cv.width=W0*R;cv.height=H0*R;ctx.scale(R,R);
 let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;const P=[...Array(n)].map(()=>({x:rnd()*W0,y:rnd()*H0,vx:(rnd()-.5)*.3,vy:(rnd()-.5)*.3}));
 run.frame(()=>{if(paused)return;ctx.clearRect(0,0,W0,H0);for(const p of P){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W0)p.vx*=-1;if(p.y<0||p.y>H0)p.vy*=-1;}
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const a=P[i],b=P[j],dx=a.x-b.x,dy=a.y-b.y,d=dx*dx+dy*dy;if(d<32400){ctx.strokeStyle=`rgba(157,187,152,${(1-Math.sqrt(d)/180)*.18})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
  ctx.fillStyle='rgba(243,242,238,.45)';for(const p of P){ctx.beginPath();ctx.arc(p.x,p.y,1.6,0,6.283);ctx.fill();}});}
function hero(root,run,sats){const hr=h('div','hero',`<div class="orbit o2"></div><div class="orbit"></div><div class="mono">${BRAND.monogram}</div>`,root);
 const els=sats.map(id=>{const n=INGREDIENTS.find(x=>x.id===id);return h('div','sat',`<img src="${n.image}" alt=""><small>${esc(n.name)}</small>`,hr);});
 run.wait(500).then(()=>on(hr));
 run.frame(()=>{const t=CLK/1000;els.forEach((e,i)=>{const a=t*.12+i*(Math.PI*2/els.length),r=(i%2?370:280);e.style.transform=`translate(${Math.cos(a)*r}px,${Math.sin(a)*r}px)`;});});
 els.forEach((e,i)=>run.wait(1200+i*240).then(()=>e.style.opacity=1));return hr;}

/* ================= dados de demonstração (reais do catálogo) ================= */
const DEMO={ratings:{vetiver:9,santal:9,terre:8,polo:8,malbec:3},prefs:{styles:['woody','spicy'],likedNotes:['Vetiver','Sândalo','Cedro','Tabaco'],dislikedNotes:['Caramelo']},ctx:{temp:22,occasion:'Todas',time:'Noite',environment:'Aberto'}};
const withImg=PERFUMES.filter(p=>p.image);
const bestPick=PERFUMES.filter(p=>p.image&&p.notes&&p.notes.top&&DEMO.ratings[p.id]===undefined).map(p=>({p,...Engine.recommend(p,DEMO.ratings,DEMO.ctx,DEMO.prefs)})).sort((a,b)=>b.score-a.score)[0];
const ID=Engine.identity(DEMO.ratings,DEMO.prefs);
const PEOPLE_ALL=[...COMMUNITY.people,...PEOPLE.filter(u=>!COMMUNITY.people.some(c=>c.id===u.id))];

/* ================= cenas ================= */
const T={};

T.titulo=(root,s,run)=>{
 h('div','ghost','ELIXIR',root);
 const w=h('div','twrap',`<div class="eyebrow rv">Perfumes · Pessoas · Afinidades</div><h1 class="ttl words">${[...BRAND.name].map((c,i)=>`<span class="w" style="--i:${i}">${c}</span>`).join('')}</h1><p class="tsub rv">A rede social de quem guarda memórias pelo cheiro. E descobre o próximo perfume pelas pessoas.</p>`,root);
 hero(root,run,['bergamota','rosa','baunilha','cedro','vetiver','jasmim']);h('div','tline',null,root);
 const [e,t,p]=w.children;run.wait(250).then(()=>on(e));run.wait(450).then(()=>on(t));run.wait(1500).then(()=>on(p));
};

T.problema=(root,s,run)=>{
 head(root,s,run);const sl=slot(root);
 const shelf=h('div','shelf',null,root),bts=withImg.slice(0,8).map(p=>h('div','bt',`<img src="${p.image}" alt="">`,shelf));
 const revs=h('div','revs',null,root);
 (async()=>{
  for(let i=0;i<bts.length;i++){await run.wait(110);on(bts[i]);}
  await say(run,sl,'Centenas de frascos. {Nenhum cheiro na tela.}');
  bts.forEach((b,i)=>run.wait(i*60).then(()=>{b.classList.add('blur');if(i%3===1)b.classList.add('q');}));
  await run.wait(500);
  const R=[['“Fixação monstruosa, projeção absurda.”','— alguém, em algum fórum',260,90],['“Cheira a rico.”','— 4.812 curtidas',1100,40],['“Nota 4,2 de 5.”','— média de desconhecidos',700,250]];
  const els=R.map(([t,sm,x,y])=>{const e=h('div','rev',`${t}<small>${sm}</small>`,revs);e.style.left=x+'px';e.style.top=y+'px';return e;});
  for(const e of els){await run.wait(450);on(e);}
  await say(run,sl,'Resenhas que {não falam de você.}');
  els.forEach(e=>e.classList.add('some'));
  sayLast(sl,'E se o caminho fosse [pelas pessoas]?');
 })();
};

T.feed=(root,s,run)=>{
 head(root,s,run);
 const posts=COMMUNITY.posts.slice(0,3).map(p=>{const u=COMMUNITY.people.find(x=>x.id===p.user),x=COMMUNITY.products.find(y=>y.id===p.product);return {p,u,x};});
 const ph=h('div','phone',null,root);ph.style.cssText='left:1280px;top:232px';
 const scr=h('div','scr',`<div class="notch"></div><div class="ahead">${BRAND.name}<i><b></b><b></b></i></div><div class="feedscroll"><div class="astories">${PEOPLE_ALL.slice(0,6).map(u=>`<div class="ast"><span>${u.image?`<img src="${u.image}" alt="">`:`<em>${esc(u.initials)}</em>`}</span>${esc((u.handle||u.name).split(/[ .]/)[0].toLowerCase())}</div>`).join('')}</div>${posts.map(({p,u,x},i)=>`<div class="apost"><div class="aph">${av(u,32)}<span><b>${esc(u.name)}</b><small>${esc(p.occasion)}</small></span></div><div class="amed"><img src="${p.image}" alt=""><div class="heart">${HEART}</div></div><div class="abar"><span class="lk">${I.heart}</span>${I.comment}${I.share}<span class="sv">${I.save}</span></div><p class="atx"><b data-l="${i}">${p.likes}</b> curtidas</p><p class="atx"><b>${esc(u.handle)}</b> ${esc(p.text)}</p><div class="atag"><img src="${x.image}" alt=""><span><b>${esc(x.name)}</b><small>${esc(x.brand)}</small></span></div></div>`).join('')}</div><div class="atab"><i class="on"></i><i></i><i></i><i></i><i></i></div>`,ph);
 const side=h('div','fside',[['01','Momentos, não fichas técnicas','Uma foto, um lugar e o perfume na legenda.'],['02','Duplo toque para curtir','O gesto que todo mundo já conhece.'],['03','O frasco está a um toque','Cada post leva ao perfume, às notas e à sua afinidade.']].map(([n,b,t])=>`<div class="fs"><i>${n}</i><div><b>${b}</b><span>${t}</span></div></div>`).join(''),root);
 const fs=[...side.children],scroll=scr.querySelector('.feedscroll');
 (async()=>{
  await run.wait(900);fs[0].classList.add('on');
  await run.wait(3600);fs[1].classList.add('on');
  const heart=scr.querySelector('.heart'),lk=scr.querySelector('.lk'),n=scr.querySelector('[data-l="0"]');
  heart.classList.add('go');await run.wait(200);lk.classList.add('on');n.textContent=posts[0].p.likes+1;
  await run.wait(3200);fs[2].classList.add('on');
  await run.tween(1800,p=>scroll.style.transform=`translateY(${-560*p}px)`,easeIO);
  await run.wait(1800);await run.tween(1800,p=>scroll.style.transform=`translateY(${-560-520*p}px)`,easeIO);
 })();
};

T.stories=(root,s,run)=>{
 head(root,s,run);
 const ph=h('div','phone',null,root);ph.style.cssText='left:330px;top:232px';
 const scr=h('div','scr',null,ph);
 const seq=COMMUNITY.posts.filter(p=>['vincenzo','sofia','mateo'].includes(p.user)).slice(0,4);
 const g=h('div','gest',[['›','Toque para avançar','Ou deslize para a próxima pessoa.'],['❚❚','Segure para pausar','O tempo para quando você quer olhar.'],['↓','Arraste para fechar','E volte para o feed de onde parou.']].map(([i,b,t])=>`<div><i>${i}</i><div><b>${b}</b><span>${t}</span></div></div>`).join(''),root);
 const G=[...g.children];
 (async()=>{
  await run.wait(700);
  for(let k=0;k<seq.length;k++){const p=seq[k],u=COMMUNITY.people.find(x=>x.id===p.user),x=COMMUNITY.products.find(y=>y.id===p.product);
   scr.innerHTML=`<div class="notch"></div><div class="sty"><img class="bg" src="${p.image}" alt=""></div><div class="sbars">${seq.map((_,i)=>`<i><b style="width:${i<k?100:0}%"></b></i>`).join('')}</div><div class="sh">${av(u,34)}<b>${esc(u.handle)}</b><span style="opacity:.7">${esc(p.when)}</span></div><div class="sf">${esc(p.text)}<div class="atag"><img src="${x.image}" alt=""><span><b>${esc(x.name)}</b><small>${esc(x.brand)}</small></span></div></div>`;
   G.forEach((e,i)=>e.classList.toggle('on',i===Math.min(k,2)));
   const bar=scr.querySelectorAll('.sbars b')[k];const dur=k===1?6200:3600;
   if(k===1){await run.tween(1500,q=>bar.style.width=q*40+'%',p=>p);await run.wait(1800);await run.tween(1400,q=>bar.style.width=40+q*60+'%',p=>p);}
   else await run.tween(dur,q=>bar.style.width=q*100+'%',p=>p);
  }
  scr.animate([{transform:'none',opacity:1},{transform:'translateY(60%)',opacity:0}],{duration:600,easing:'ease-in',fill:'forwards'});
 })();
};

T.assinatura=(root,s,run)=>{
 head(root,s,run);
 const vals=Engine.profile(DEMO.ratings,DEMO.prefs),axes=FAMILIES.map(([,n,,d])=>({n,v:vals[d]}));
 const box=h('div','rad',null,root),svg=S('svg',{viewBox:'0 0 760 700',width:760,height:700},box);
 const cx=380,cy=360,R=250,pt=(i,v,e=0)=>{const a=-Math.PI/2+i*2*Math.PI/axes.length;return [cx+Math.cos(a)*(R*v/100+e),cy+Math.sin(a)*(R*v/100+e)];};
 [33,66,100].forEach(v=>S('polygon',{points:axes.map((_,i)=>pt(i,v).join(',')).join(' '),class:'grid'},svg));
 axes.forEach((x,i)=>{const [ex,ey]=pt(i,100),[lx,ly]=pt(i,100,42);S('line',{x1:cx,y1:cy,x2:ex,y2:ey,class:'grid'},svg);const t=S('text',{x:lx,y:ly+8,'text-anchor':Math.abs(lx-cx)<10?'middle':lx<cx?'end':'start'},svg);t.textContent=x.n;});
 S('polygon',{points:axes.map((x,i)=>pt(i,x.v).join(',')).join(' '),class:'area'},svg);
 axes.forEach((x,i)=>{const [px,py]=pt(i,x.v);S('circle',{cx:px,cy:py,r:7,class:'dot'},svg);});
 const r=h('div','sig-r',`<div class="eyebrow rv">Sua assinatura</div><h3 class="words">${W(ID.family)}</h3><p class="rv">Nuances ${esc(({'cítrica':'cítricas','aromática':'aromáticas','verde':'verdes'})[ID.nuance]||ID.nuance+'s')}. Calculada das suas escolhas, não de um teste.</p><div class="sig-ch">${DEMO.prefs.likedNotes.map(n=>`<span class="chip g">${esc(n)}</span>`).join('')}${DEMO.prefs.dislikedNotes.map(n=>`<span class="chip no">${esc(n)}</span>`).join('')}</div>`,root);
 const sl=slot(root,'left:1060px;right:140px;bottom:96px;justify-items:start');
 (async()=>{await run.wait(800);on(box);await run.wait(1200);on(r.children[0]);on(r.children[1]);await run.wait(900);on(r.children[2]);
  for(const c of r.querySelectorAll('.sig-ch .chip')){await run.wait(260);on(c);}
  await run.wait(1200);sayLast(sl,'Seu gosto [tem uma forma.]').style.cssText='text-align:left;font-size:48px';})();
};

T.mente=(root,s,run)=>{
 head(root,s,run);
 const N=[['01','Notas da marca','Saída, coração e fundo, com fonte.',140,330],['02','24 acordes','Cada nota vira um vetor de sensações.',140,620],['03','Suas avaliações','O que você ama e o que evita.',560,330],['04','Contexto','Clima, horário e ocasião.',560,620],['05','Comunidade','Quem sente parecido com você.',980,475]];
 const svg=S('svg',{viewBox:'0 0 1920 1080',class:'svg'},root);
 const wires=[[440,400,560,400],[440,690,560,690],[860,400,980,545],[860,690,980,545],[1280,545,1440,590]].map(([a,b,c,d])=>S('path',{d:`M${a} ${b} C ${a+70} ${b}, ${c-70} ${d}, ${c} ${d}`,class:'wire draw',pathLength:1},svg));
 const nodes=N.map(([e,b,t,x,y])=>{const n=h('div','nd',`<em>${e}</em><b>${b}</b><span>${t}</span>`,root);n.style.left=x+'px';n.style.top=y+'px';return n;});
 const out=h('div','result',`<div><b>0</b><small>% de afinidade</small></div>`,root);
 const sl=slot(root);
 (async()=>{
  for(let i=0;i<4;i++){await run.wait(i?650:900);on(nodes[i]);}
  await run.wait(500);for(const w of wires.slice(0,4)){on(w);await run.wait(250);}
  await run.wait(700);on(nodes[4]);nodes[4].classList.add('hot');
  await say(run,sl,'Uma leitura, {não uma regra.}',600);
  on(wires[4]);wires[4].classList.add('g');await run.wait(900);on(out);
  await countUp(run,out.querySelector('b'),bestPick.score,1600);
  out.querySelector('small').innerHTML=`% de afinidade<br>com ${esc(bestPick.p.name)}`;
  sayLast(sl,'Explicável. {Sempre com os motivos.}');
 })();
};

T.perfume=(root,s,run)=>{
 head(root,s,run);const p=bestPick.p,m=bestPick;
 const img=h('div','pf-img',`<img src="${p.image}" alt="">`,root);
 const acc=p.vector.map((v,i)=>({n:DIMENSIONS[i],v:Math.round(v*100)})).sort((a,b)=>b.v-a.v).slice(0,4);
 const pf=h('div','pf',`<div class="brand rv">${esc(p.brand)}</div><h3 class="words">${W(p.name)}</h3><div class="sc rv"><b>0</b><span>% de afinidade<br>${esc(p.concentration)}</span></div><div class="tiers">${[['Saída',p.notes.top],['Coração',p.notes.heart],['Fundo',p.notes.base]].map(([t,n])=>`<div class="tier"><small>${t}</small><p>${n.slice(0,3).map(esc).join(' · ')}</p></div>`).join('')}</div><div class="acc">${acc.map(a=>`<div><span>${a.n}</span><i><b></b></i><em>${a.v}</em></div>`).join('')}</div>`,root);
 (async()=>{await run.wait(700);on(img);await run.wait(400);on(pf.children[0]);on(pf.children[1]);await run.wait(700);on(pf.children[2]);await countUp(run,pf.querySelector('.sc b'),m.score,1400);
  for(const t of pf.querySelectorAll('.tier')){await run.wait(300);on(t);}
  await run.wait(500);pf.querySelectorAll('.acc b').forEach((b,i)=>run.wait(i*160).then(()=>b.style.width=acc[i].v+'%'));})();
};

T.pessoas=(root,s,run)=>{
 head(root,s,run);
 const list=PEOPLE_ALL.map(u=>({u,c:Engine.compatibility(DEMO.ratings,u).score})).sort((a,b)=>b.c-a.c).slice(0,8);
 const cx=960,cy=590,svg=S('svg',{viewBox:'0 0 1920 1080',class:'svg'},root);
 const me=h('div','pn me',`${av({name:'Você',initials:'VC',color:'#5C7A59'},180)}<b>Você</b>`,root);me.style.cssText=`left:${cx}px;top:${cy}px`;
 const pts=list.map((x,i)=>{const a=-Math.PI/2+i*2*Math.PI/list.length;return [cx+Math.cos(a)*660,cy+Math.sin(a)*240];});
 const lines=pts.map(([x,y])=>S('path',{d:`M${cx} ${cy} L${x} ${y}`,class:'wire draw',pathLength:1},svg));
 const nodes=list.map(({u,c},i)=>{const n=h('div','pn',`${av(u,110)}<b>${esc(u.name.split(' ')[0])}</b><span class="pct">${c}%</span>`,root);n.style.cssText=`left:${pts[i][0]}px;top:${pts[i][1]}px`;return n;});
 const sl=slot(root,'bottom:30px;height:110px');
 (async()=>{await run.wait(800);on(me);for(let i=0;i<nodes.length;i++){await run.wait(180);on(lines[i]);on(nodes[i]);}
  await run.wait(1200);nodes.forEach((n,i)=>{if(i){n.classList.add('dim');}else n.classList.add('top');});lines[0].classList.add('g');
  await say(run,sl,`[${list[0].c}%] em comum com ${esc(list[0].u.name.split(' ')[0])}.`,800);
  sayLast(sl,'Siga quem sente {como você.}');})();
};

T.busca=(root,s,run)=>{
 head(root,s,run);
 const pal=h('div','pal',`<div class="q">${I.search}<span class="qt"></span><kbd>/</kbd></div><div class="res"></div>`,root);
 const key=NoteModel.normalize('Baunilha'),perf=PERFUMES.filter(p=>p.image&&p.noteWeights.some(w=>NoteModel.normalize(w.name)===key)).slice(0,3),note=INGREDIENTS.find(n=>n.id==='baunilha'),clara=COMMUNITY.people.find(p=>p.id==='clara');
 const rows=[{img:note.image,c:1,t:note.name,s:'Doces e balsâmicas',k:'Nota'},...perf.map(p=>({img:p.image,c:1,t:p.name,s:p.brand,k:'Perfume'})),{img:clara.image,r:1,t:clara.name,s:'@'+clara.handle+' · ama baunilha',k:'Pessoa'}];
 const res=pal.querySelector('.res'),els=rows.map(x=>h('div','sr',`<span class="im ${x.c?'c':''} ${x.r?'r':''}"><img src="${x.img}" alt=""></span><span><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span><em>${x.k}</em>`,res));
 const sl=slot(root,'bottom:40px;height:110px');
 (async()=>{await run.wait(1000);await type(run,pal.querySelector('.qt'),'baun',160);
  for(const e of els){await run.wait(140);on(e);}
  for(let i=0;i<3;i++){await run.wait(700);els.forEach((e,j)=>e.classList.toggle('sel',j===i));}
  await say(run,sl,'Perfumes, notas e pessoas. {Numa tecla.}');})();
};

T.notas=(root,s,run)=>{
 head(root,s,run);
 const pick=['bergamota','rosa','jasmim','neroli','lavanda','sandalo','cedro','vetiver','patchouli','oud','baunilha','fava-tonka','cacau','canela','cardamomo','pimenta-rosa','tabaco','whiskey'].map(id=>INGREDIENTS.find(n=>n.id===id)).filter(Boolean);
 const g=h('div','ngrid',null,root),els=pick.map((n,i)=>{const e=h('div','ni',`<img src="${n.image}" alt="">`,g);e.style.setProperty('--t',(4+i%5)+'s');return e;});
 const f=INGREDIENTS.find(n=>n.id==='bergamota'),count=PERFUMES.filter(p=>p.noteWeights.some(w=>NoteModel.normalize(w.name)===NoteModel.normalize('Bergamota'))).length;
 const fo=h('div','nfocus',`<img src="${f.image}" alt=""><h3>${f.name}</h3><p>${esc(f.description)}</p><span class="chip g">${count} perfumes no catálogo</span>`,root);
 (async()=>{for(const e of els){await run.wait(70);on(e);}await run.wait(1800);els.forEach((e,i)=>e.classList.add(i===0?'hot':'dim'));await run.wait(400);on(fo);})();
};

T.descoberta=(root,s,run)=>{
 head(root,s,run);
 const labs=['Atmosferas','Notas','Experiências','Momento','Assinatura'];
 h('div','steps',labs.map(()=>'<div class="step"><b></b></div>').join(''),root);
 const lab=h('div','stlab',labs.map(l=>`<span>${l}</span>`).join(''),root);
 const area=h('div','dpanel',null,root);
 const p1=h('div','dp esc',`<h3>Que sensação chama você?</h3><div class="fams">${FAMILIES.map(([id,n])=>`<div class="fam" data-f="${id}"><img src="assets/families/${id}.png" alt=""><b>${n}</b></div>`).join('')}</div>`,area);
 const p2=h('div','dp esc',`<h3>O que você gosta de sentir?</h3><div class="ncl">${NOTE_CHOICES.slice(0,18).map(n=>`<span class="chip" data-n="${esc(n)}">${esc(n)}</span>`).join('')}</div>`,area);
 const p3=h('div','dp esc',`<h3>Alguns cheiros já contam sua história.</h3><div class="fams six">${withImg.slice(0,6).map(p=>`<div class="fam" data-p="${p.id}"><img src="${p.image}" alt=""><b>${esc(p.name)}</b></div>`).join('')}</div>`,area);
 const p4=h('div','dp esc dres',`<h3 class="words">${W('Uma assinatura '+'['+ID.family.toLowerCase()+'.]')}</h3>`,area);
 const steps=[...root.querySelectorAll('.step b')],L=[...lab.children],P=[p1,p2,p3,p4];
 const show=i=>{P.forEach((p,j)=>p.classList.toggle('esc',j!==i));steps.forEach((b,j)=>b.style.width=j<=(i===3?4:i)?'100%':'0');L.forEach((l,j)=>l.classList.toggle('on',j<=(i===3?4:i)));};
 (async()=>{await run.wait(700);show(0);
  for(const f of ['woody','spicy']){await run.wait(900);p1.querySelector(`[data-f=${f}]`).classList.add('on');}
  await run.wait(1500);show(1);for(const n of ['Vetiver','Sândalo','Cedro','Tabaco']){await run.wait(450);p2.querySelector(`[data-n="${n}"]`)?.classList.add('on');}
  await run.wait(1400);show(2);for(const c of [...p3.querySelectorAll('.fam')].slice(0,3)){await run.wait(500);c.classList.add('on');}
  await run.wait(1500);show(3);on(p4.querySelector('h3'));})();
};

T.tema=(root,s,run)=>{
 head(root,s,run);
 const ui=k=>`<div class="dv-${k}"><div class="dv-s"><b>${BRAND.name}</b>${[70,60,75,55,65].map(w=>`<i style="--w:${w}%"></i>`).join('')}</div><div class="dv-m"><div class="st">${[0,1,2,3,4].map(()=>'<i></i>').join('')}</div><div class="im" style="background-image:url(assets/products/sea.jpg)"></div><div class="ln" style="--w:40%"></div><div class="ln" style="--w:80%"></div></div><div class="dv-r">${[0,1,2,3].map(()=>'<i></i>').join('')}</div></div>`;
 const dev=h('div','dev',ui('l')+ui('d'),root);
 const mob=h('div','mob',`<div class="dev">${ui('l')+ui('d')}</div>`,root);
 const sl=slot(root,'bottom:60px');
 (async()=>{await run.wait(1500);dev.classList.add('dk');mob.querySelector('.dev').classList.add('dk');await say(run,sl,'Escuro de verdade. {Não só invertido.}');
  dev.classList.remove('dk');mob.querySelector('.dev').classList.remove('dk');await run.wait(1200);dev.classList.add('dk');mob.querySelector('.dev').classList.add('dk');
  sayLast(sl,'No celular, no tablet, {no computador.}');})();
};

T.privacidade=(root,s,run)=>{
 head(root,s,run);
 const lk=h('div','lock',`<div class="ring"></div><svg viewBox="0 0 300 340"><path class="shackle" d="M90 150V100a60 60 0 0 1 120 0v50"/><rect class="body" x="50" y="150" width="200" height="170" rx="28"/><circle cx="150" cy="225" r="14"/><path d="M150 239v30"/></svg>`,root);
 const c=h('div','chk',[['01','Sem cadastro','Abra e use. Nenhuma conta, nenhum e-mail.'],['02','Fica no seu aparelho','Avaliações e publicações salvas no navegador.'],['03','Exporte quando quiser','Seus dados em um arquivo, a um clique.']].map(([n,b,t])=>`<div class="ck rv"><em>${n}</em><div><b>${b}</b><span>${t}</span></div></div>`).join(''),root);
 (async()=>{await run.wait(1100);lk.classList.add('shut');for(const e of c.children){await run.wait(700);on(e);}})();
};

T.fim=(root,s,run)=>{
 particles(root,run);
 const w=h('div','cl',`<div class="hero"><div class="orbit o2"></div><div class="orbit"></div><div class="mono">${BRAND.monogram}</div></div><h1 class="words">${[...BRAND.name].map((c,i)=>`<span class="w" style="--i:${i}">${c}</span>`).join('')}</h1><p class="rv">O invisível, em comum.</p><a class="url rv" href="index.html">gabrielkopi.github.io/elixir-perfumes</a>`,root);
 run.wait(300).then(()=>on(w.querySelector('.hero')));run.wait(700).then(()=>on(w.querySelector('h1')));run.wait(1700).then(()=>on(w.querySelector('p')));run.wait(2300).then(()=>on(w.querySelector('.url')));
};

/* ================= roteiro ================= */
const SC=[
 {type:'titulo',theme:'dark',dur:10000},
 {type:'problema',theme:'light',ch:'O problema',dur:21000,kicker:'O problema',heading:'Como escolher um perfume {sem sentir na pele?}'},
 {type:'feed',theme:'dark',ch:'Feed',dur:20000,kicker:'Feed',heading:'Pessoas reais. {O perfume na legenda.}'},
 {type:'stories',theme:'light',ch:'Stories',dur:18000,kicker:'Stories',heading:'O dia de quem você segue, {em segundos.}'},
 {type:'assinatura',theme:'dark',ch:'Assinatura',dur:15000,kicker:'Assinatura olfativa',heading:'Sete famílias. {Uma forma só sua.}'},
 {type:'mente',theme:'light',ch:'Como pensa',dur:20000,kicker:'Como o ELIXIR pensa',heading:'Cinco leituras. {Uma afinidade.}'},
 {type:'perfume',theme:'dark',ch:'Perfume',dur:15000,kicker:'Para você',heading:'O próximo perfume, {com os motivos.}'},
 {type:'pessoas',theme:'light',ch:'Afinidades',dur:17000,kicker:'Afinidades',heading:'Gosto parecido {aproxima pessoas.}'},
 {type:'busca',theme:'dark',ch:'Busca',dur:14000,kicker:'Busca rápida',heading:'Comece a digitar. {O resto aparece.}'},
 {type:'notas',theme:'light',ch:'Notas',dur:13000,kicker:'Biblioteca de notas',heading:`${INGREDIENTS.length} matérias-primas. {Uma de cada vez.}`},
 {type:'descoberta',theme:'dark',ch:'Descoberta',dur:16000,kicker:'Descoberta guiada',heading:'Cinco passos {até a sua assinatura.}'},
 {type:'tema',theme:'light',ch:'Design',dur:15000,kicker:'Design',heading:'Minimalista. {Claro ou escuro.}'},
 {type:'privacidade',theme:'dark',ch:'Privacidade',dur:13000,kicker:'Privacidade',heading:'Seus dados {ficam com você.}'},
 {type:'fim',theme:'dark',dur:12000}
];
const NOHUD=new Set(['titulo','fim']);
const TOTAL=SC.reduce((a,s)=>a+s.dur,0),START=SC.map((s,i)=>SC.slice(0,i).reduce((a,x)=>a+x.dur,0));

/* ================= reprodução ================= */
const vp=$('#vp'),hud=$('.hud'),hudB=hud.querySelector('b'),bar=$('#prog i'),help=$('#help');
let cur=-1,live=null,elapsed=0,last=null,SCALE=1;
function fit(){SCALE=Math.min(innerWidth/W0,innerHeight/H0);document.documentElement.style.setProperty('--s',SCALE);}
addEventListener('resize',fit);fit();
$('#chs').innerHTML=SC.map(s=>`<i style="--w:${s.dur}"></i>`).join('');
function go(i){
 i=(i%SC.length+SC.length)%SC.length;const s=SC[i];
 const el=h('div','scene '+s.theme),box=h('div','box',null,el),run=new Run();
 vp.insertBefore(el,hud);T[s.type](box,s,run);
 if(live){const old=live;old.run.stop();old.el.classList.remove('on');setTimeout(()=>old.el.remove(),1000);}
 live={el,run};cur=i;elapsed=0;requestAnimationFrame(()=>el.classList.add('on'));
 vp.dataset.theme=s.theme;hud.style.setProperty('--hudink',s.theme==='dark'?'#F3F2EE':'#121212');hud.style.setProperty('--hudg',s.theme==='dark'?'#9DBB98':'#5C7A59');
 hud.classList.toggle('hide',NOHUD.has(s.type));
 const n=SC.slice(0,i+1).filter(x=>!NOHUD.has(x.type)).length;hudB.innerHTML=`<span>${String(n).padStart(2,'0')}</span>${esc(s.ch||'')}`;
 history.replaceState(null,'','#'+s.type);
}
function loop(t){if(last===null)last=t;const dt=Math.min(250,t-last);last=t;if(!paused){CLK+=dt;elapsed+=dt;tick();if(elapsed>=SC[cur].dur)go(cur+1);}bar.style.transform=`scaleX(${(START[cur]+Math.min(elapsed,SC[cur].dur))/TOTAL})`;requestAnimationFrame(loop);}
function pause(v=!paused){paused=v;live?.el.classList.toggle('paused',paused);flash(paused?'<b>Pausado</b> · espaço continua':'');}
let helpT;function flash(msg){if(msg)help.innerHTML=msg;else help.innerHTML='<b>→</b> próxima &nbsp;·&nbsp; <b>←</b> anterior &nbsp;·&nbsp; <b>espaço</b> pausa &nbsp;·&nbsp; <b>F</b> tela cheia';help.classList.remove('hide');clearTimeout(helpT);helpT=setTimeout(()=>help.classList.add('hide'),paused?60000:3500);}
addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();go(cur+1);}if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();go(cur-1);}if(e.key===' '){e.preventDefault();pause();}if(e.key==='f'||e.key==='F'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.().catch(()=>{});}if(e.key==='Home')go(0);});
$('#tap').addEventListener('click',e=>{if(e.clientX<innerWidth*.3)go(cur-1);else go(cur+1);});
let idleT;addEventListener('mousemove',()=>{document.body.classList.remove('idle');clearTimeout(idleT);idleT=setTimeout(()=>document.body.classList.add('idle'),2500);if(help.classList.contains('hide')&&!paused)flash('');});
/* Avança o relógio sem esperar (útil para revisar cenas). */
async function skip(ms){for(let k=0;k<ms;k+=50){CLK+=50;elapsed+=50;tick();for(let j=0;j<6;j++)await null;}}
const startAt=Math.max(0,SC.findIndex(s=>'#'+s.type===location.hash));
go(startAt);flash('');requestAnimationFrame(loop);
