'use strict';
/* Atividade (§5): eventos derivados na hora a partir do que você faz. Abrir não marca como lido; fechar marca.
   O que vem de dados de exemplo leva o rótulo "Demonstração". */
const Activity={
 DAY:864e5,
 at(v){const n=typeof v==='number'?v:Date.parse(v);return Number.isFinite(n)?Math.min(Date.now(),n):0;},
 hash(s){let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h;},
 people(){try{return typeof People!=='undefined'&&People.all?People.all():[];}catch(e){return [];}},
 events(){const out=[],now=Date.now(),created=this.at(state.createdAt)||now,ppl=this.people(),find=id=>ppl.find(p=>p.id===id);
  /* 1. quem você segue entrou na sua rede */
  for(const id of state.following){const u=find(id);if(!u)continue;
   out.push({id:'follow-'+id,kind:'person',at:Math.min(now,created+(this.hash(id)%36+2)*36e5),person:u,html:`<b>${esc(u.name)}</b> agora está na sua rede.`,href:'#person/'+encodeURIComponent(id),demo:true});}
  /* 2. gosto parecido + algo do seu Quero */
  const want=Select.shelfIds('want');
  if(want.length&&typeof Engine!=='undefined')for(const u of ppl){const R=u.ratings||{};let score=0;try{score=Engine.compatibility(state.ratings,u).score||0;}catch(e){}
   if(score<80)continue;const hit=want.find(id=>R[id]>=8);if(!hit)continue;const p=byId(hit);if(!p)continue;
   out.push({id:'want-'+u.id+'-'+hit,kind:'perfume',at:Math.min(now,(state.shelfAt[hit]||created)+6*36e5),person:u,perfume:p,html:`<b>${esc(u.name.split(' ')[0])}</b>, que tem gosto parecido com o seu, ama <b>${esc(p.name)}</b>. Ele está no seu Quero.`,href:'#perfume/'+encodeURIComponent(p.id),demo:true});}
  /* 3. edição do mês */
  if(typeof Editions!=='undefined'&&Editions.current){try{const e=(Editions.current()||[])[0];if(e){const d=new Date();d.setDate(1);d.setHours(9,0,0,0);
   out.push({id:'edition-'+e.id+'-'+d.getMonth(),kind:'edition',at:d.getTime(),edition:e,html:`Edição do mês: <b>${esc(e.title)}</b>.${e.thesis?' '+esc(e.thesis):''}`,href:'#edit/'+encodeURIComponent(e.id)});}}catch(err){}}
  /* 4. Testei há mais de 3 dias, sem avaliação */
  for(const id of Select.shelfIds('tried')){if(state.ratings[id]!==undefined)continue;const t=state.shelfAt[id]||0,p=byId(id);if(!p||now-t<3*this.DAY)continue;
   out.push({id:'rate-'+id,kind:'rate',at:t+3*this.DAY,perfume:p,html:`Como foi <b>${esc(p.name)}</b>? Sua avaliação ajusta o seu mapa.`,rate:p.id});}
  /* 5. curtidas nas suas publicações */
  for(const post of state.posts){const n=Number(post.likes)||0,p=byId(post.perfume);if(!n)continue;
   out.push({id:'likes-'+post.id,kind:'likes',at:Math.min(now,this.at(post.when)+2*36e5),perfume:p,html:`<b>${esc(UI.plural(n,'pessoa','pessoas'))}</b> curtiram sua publicação${p?' com '+esc(p.name):''}.`,href:'#profile',demo:true});}
  const dis=new Set(state.activity.dismissed||[]);
  return out.filter(x=>!dis.has(x.id)).sort((a,b)=>b.at-a.at||(a.id<b.id?-1:1));},
 isNew(x){return x.at>(Number(state.activity.seenAt)||0);},
 unread(){try{return this.events().filter(x=>this.isNew(x)).length;}catch(e){return 0;}},
 row(x,i){const fresh=this.isNew(x);
  const lead=x.person?UI.avatar(x.person,'')
   :x.perfume?`<span class="thumb plate ac-thumb">${x.perfume.image?`<img src="${esc(x.perfume.image)}" alt="" loading="lazy" decoding="async">`:''}</span>`
   :`<span class="ac-ico">${icon(x.kind==='edition'?'sparkle':'bell','icon--20')}</span>`;
  const meta=`<span class="ac-meta">${esc(UI.when(x.at))}${x.demo?' · Demonstração':''}</span>`;
  const inner=`${lead}<span class="ac-text"><span class="ac-line">${x.html}</span>${meta}</span>${fresh?'<i class="dot-unread" aria-hidden="true"></i><span class="sr-only">, não lida</span>':''}`;
  const cls=`ac-row pressable${fresh?' is-new':''}`;
  return x.rate?`<li style="--i:${i}"><button type="button" class="${cls}" data-action="rate" data-id="${esc(x.rate)}">${inner}</button></li>`
   :`<li style="--i:${i}"><a class="${cls}" href="${esc(x.href)}">${inner}</a></li>`;},
 body(){const list=this.events(),n=list.filter(x=>this.isNew(x)).length;
  if(!list.length)return UI.empty({icon:'bell',title:'Nada novo por aqui',text:'Quando houver novidades sobre o seu gosto e a sua rede, elas aparecem aqui.'});
  return `${n?`<div class="ac-top"><p class="t-sm muted" data-ac-count>${esc(UI.plural(n,'novidade','novidades'))}</p>${UI.btn('Marcar como lidas',{action:'activity-read',variant:'tertiary'})}</div>`:''}<ul class="ac-list list-hair stagger">${list.map((x,i)=>this.row(x,i)).join('')}</ul>`;},
 open(){Sheet.open({title:'Atividade',cls:'sh-activity',body:this.body(),onClose:()=>this.markRead()});},
 markRead(){if(!this.unread())return;Store.update(s=>{s.activity.seenAt=Date.now();});},
 readNow(){this.markRead();const b=document.querySelector('#sheet .sh-activity');if(!b)return;
  for(const r of b.querySelectorAll('.ac-row.is-new')){r.classList.remove('is-new');r.querySelector('.dot-unread')?.remove();r.querySelector('.sr-only')?.remove();}
  b.querySelector('.ac-top')?.remove();toast('Tudo marcado como lido');}
};
Actions.add({'activity-read':()=>Activity.readNow()});
