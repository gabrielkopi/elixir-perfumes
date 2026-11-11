'use strict';
/* Folhas do feed: Usando hoje (o único jeito de publicar), Comentários e Compartilhar. */
const Compose={
 OCCASIONS:['Dia a dia','Trabalho','Encontro','Jantar','Festa','Praia','Ar livre','Evento'],
 draft:null,

 /* ---------- Usando hoje ---------- */
 sotd(perfumeId,{ctx=null}={}){
  const today=Select.sotdToday(),post=today&&today.postId?state.posts.find(p=>p.id===today.postId)||null:null;
  const given=perfumeId&&byId(perfumeId)?byId(perfumeId).id:'';
  const same=!given||(today&&today.id===given);
  this.draft={id:given||(today?today.id:''),photo:same&&post?post.photo:'',text:same&&post?post.text:'',
   occasion:(ctx&&ctx.occasion)||(same&&today?today.occasion:'')||'',ctx:ctx||(same&&today&&today.ctx)||null,editing:!!today,picking:false,q:'',dirty:false};
  this.render();},
 render(){Sheet.open({title:'Usando hoje',body:this.body(),cls:'sh-sotd',confirmClose:()=>this.confirmClose()});},
 refresh(sel){const root=document.querySelector('#sheet .sh-sotd');if(!root)return;if(!sel){Sheet.update(this.body());return;}
  const old=root.querySelector(sel),tmp=document.createElement('div');tmp.innerHTML=this.body();const nu=tmp.querySelector(sel);if(old&&nu){old.replaceWith(nu);Motion.after(nu,{quiet:false});}},
 async confirmClose(){const d=this.draft;if(!d||!d.dirty||!(d.text.trim()||d.photo))return true;
  return Sheet.confirm({title:'Descartar o registro?',text:'A foto e a legenda que você escreveu não serão salvas.',ok:'Descartar',danger:true});},
 shelf(){const ids=Select.shelfIds('have').slice(0,10);return ids.map(id=>byId(id)).filter(Boolean);},
 body(){const d=this.draft,p=d.id?byId(d.id):null;
  if(d.picking)return this.picker();
  const sel=p?`<div class="sotd-sel"><span class="sotd-plate">${UI.photo(p)}</span><span class="sotd-name"><span class="t-eyebrow muted">${esc(p.brand)}</span><b class="t-h3">${esc(p.name)}</b></span>${UI.btn('Trocar',{action:'sotd-pick',variant:'tertiary'})}</div>`
   :`<button type="button" class="input pressable" data-action="sotd-pick">${icon('search','icon--20')}<span>Escolher perfume</span></button>`;
  const mine=this.shelf();
  const quick=mine.length?`<div class="sotd-quick"><p class="t-eyebrow muted">Da sua coleção</p>${UI.rail(mine.map(x=>`<button type="button" class="sotd-q pressable" data-action="sotd-choose" data-id="${esc(x.id)}" aria-pressed="${x.id===d.id}" aria-label="${esc(x.name+', '+x.brand)}">${UI.photo(x)}<span>${esc(x.name)}</span></button>`),{name:'sotd-shelf',label:'Perfumes da sua coleção'})}</div>`:'';
  const photo=d.photo?`<figure class="sotd-photo sotd-preview"><img src="${esc(d.photo)}" alt="Prévia da sua foto">${UI.btn('Remover',{action:'sotd-photo-remove',variant:'secondary',size:'sm',icon:'trash'})}</figure>`
   :`<label class="sotd-photo sotd-add pressable"><span class="ico">${icon('camera','icon--20')}</span><span class="grow"><b>Adicionar foto</b><span>Opcional. O momento, a roupa, o lugar.</span></span><input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp" data-change="sotd-photo" aria-label="Adicionar foto (opcional)"></label>`;
  const occs=[...this.OCCASIONS];if(d.occasion&&!occs.includes(d.occasion))occs.unshift(d.occasion);
  const chips=UI.chips(occs.map(o=>({id:o,label:o,on:o===d.occasion})),'sotd-occ',{name:'sotd-occ',label:'Ocasião'});
  return `<div class="sotd-sec">${sel}${quick}</div>
<div class="sotd-sec">${photo}</div>
<div class="sotd-sec"><p class="t-eyebrow muted" id="sotd-occ-l">Ocasião</p>${chips}</div>
<div class="sotd-sec" data-input="sotd-text">${UI.textarea({name:'text',label:'Legenda',value:d.text,max:280,rows:3,attrs:'placeholder="Como está sendo o dia com ele?"'})}</div>
<div class="sheet-foot">${UI.btn('Publicar',{action:'sotd-publish',size:'block',attrs:p?'':'disabled aria-describedby="sotd-hint"'})}${p?'':'<p class="sotd-hint" id="sotd-hint">Escolha um perfume</p>'}</div>`;},
 /* Escolher perfume: o seletor da busca (Search.pick); sem ele, um seletor simples dentro da folha. */
 pick(){const d=this.draft;
  if(typeof Search!=='undefined'&&typeof Search.pick==='function'){
   Search.pick({title:'Escolha o perfume',exclude:[],onPick:id=>{const p=byId(id);if(p){d.id=p.id;d.dirty=true;}this.render();}});return;}
  d.picking=true;d.q='';Sheet.update(this.body());const f=document.querySelector('#sheet .sotd-find input');if(f)f.focus();},
 results(q){const n=String(q||'').trim();let list=[];
  if(n&&typeof Catalog!=='undefined'&&Catalog.search)list=Catalog.search(n).perfumes.slice(0,8);
  else list=[...this.shelf(),...Select.ranked().slice(0,8).map(x=>x.p)].filter((p,i,a)=>a.findIndex(y=>y.id===p.id)===i).slice(0,8);
  if(!list.length)return `<p class="sotd-none">Nada encontrado para “${esc(n)}”.</p>`;
  return `<div class="list-hair" role="list">${list.map(p=>`<div role="listitem">${UI.row(p,{action:'sotd-choose'})}</div>`).join('')}</div>`;},
 picker(){const d=this.draft;
  return `<div class="sotd-find">${UI.btn('Voltar',{action:'sotd-unpick',variant:'tertiary',icon:'chevron-left'})}<label class="field" data-input="sotd-q"><span class="sr-only">Buscar perfume</span><input type="search" name="q" value="${esc(d.q)}" placeholder="Nome ou marca" autocomplete="off" enterkeyhint="search"></label></div><div class="sotd-results" aria-live="polite">${this.results(d.q)}</div>`;},
 choose(id){const d=this.draft,p=byId(id);if(!d||!p)return;const was=d.picking;d.id=p.id;d.picking=false;d.dirty=true;
  if(was){Sheet.update(this.body());return;}
  for(const b of document.querySelectorAll('#sheet .sotd-q'))b.setAttribute('aria-pressed',b.dataset.id===p.id);
  this.refresh('.sotd-sel');this.refresh('.sheet-foot');
  const ta=document.querySelector('#sheet .sh-sotd textarea');if(ta)ta.value=d.text;},
 async photo(input){const f=input.files&&input.files[0];if(!f)return;
  try{this.draft.photo=await readImage(f,{max:720,quality:.72});this.draft.dirty=true;this.refresh('.sotd-photo');}
  catch(e){toast(e&&e.message?e.message:'Não foi possível usar esta foto.');}},
 publish(){const d=this.draft,p=d&&d.id?byId(d.id):null;if(!p)return;
  const date=Select.todayKey(),prev=JSON.parse(JSON.stringify({posts:state.posts,sotd:state.sotd}));
  const old=Select.sotdToday(),oldPost=old&&old.postId?state.posts.find(x=>x.id===old.postId):null;
  const postId=oldPost?oldPost.id:'local-'+Date.now().toString(36);
  const post={id:postId,user:'me',perfume:p.id,photo:d.photo||'',text:d.text.trim().slice(0,280),occasion:d.occasion||'',likes:oldPost?oldPost.likes:0,when:new Date().toISOString(),sotd:true};
  const entry={date,id:p.id,occasion:d.occasion||'',postId};
  if(d.ctx){const c=d.ctx;entry.ctx={temp:c.temp,humidity:c.humidity,occasion:d.occasion||c.occasion||'',environment:c.environment,period:c.period,intensity:c.intensity,outfit:c.outfit||''};}
  this.draft=null;
  Sheet.close({force:true});
  Store.update(s=>{s.posts=[post,...s.posts.filter(x=>x.id!==postId)];s.sotd=[entry,...s.sotd.filter(x=>x.date!==date)];});
  toast('Registrado para hoje',{undo:()=>Store.update(s=>{s.posts=prev.posts;s.sotd=prev.sotd;})});},

 /* ---------- Comentários ---------- */
 comments(postId){const id=String(postId||'');if(!id)return;
  Sheet.open({title:'Comentários',body:this.cbody(id),cls:'sh-comments',focus:'.sh-comments input'});this.cscroll();},
 cbody(id){const list=state.comments[id]||[],me={name:state.profile.name};
  const items=list.length?`<ul class="sh-comments-list">${list.map(c=>`<li>${UI.avatar(null,'sm')}<div><p class="sh-comments-who"><b>${esc(me.name)}</b><span>${esc(UI.when(c.at))}</span></p><p>${esc(c.text)}</p></div></li>`).join('')}</ul>`
   :UI.empty({icon:'comment',title:'Nenhum comentário ainda',text:'Seja a primeira pessoa a comentar.'});
  return `${items}<form class="sheet-foot sh-comments-form" data-submit="comment-send" data-id="${esc(id)}"><label class="field" data-input="comment-text"><span class="sr-only">Comentário</span><input name="text" maxlength="280" placeholder="Escreva um comentário" autocomplete="off" enterkeyhint="send"></label>${UI.btn('Enviar',{size:'sm',attrs:'type="submit" disabled'}).replace('type="button" ','')}</form>`;},
 cscroll(){const d=document.getElementById('sheet');if(d)requestAnimationFrame(()=>{d.scrollTop=d.scrollHeight;});},
 send(form){const id=form.dataset.id,input=form.querySelector('input'),text=(input&&input.value||'').trim().slice(0,280);if(!id||!text)return;
  Store.update(s=>{s.comments[id]=[...(s.comments[id]||[]),{text,at:new Date().toISOString()}];},{silent:true});
  Sheet.update(this.cbody(id));if(typeof Post!=='undefined')Post.patch(id);this.cscroll();
  const f=document.querySelector('#sheet .sh-comments input');if(f)f.focus({preventScroll:true});},

 /* ---------- Compartilhar ---------- */
 base(){return location.href.split('#')[0].split('?')[0];},
 target(kind,id){const P=(page,x='')=>Router.href(page,x);
  if(kind==='perfume'){const p=byId(id);return p?{href:P('perfume',p.id),title:p.name,sub:p.brand,text:`${p.name}, de ${p.brand}, no ${BRAND.name}`,thumb:UI.photo(p)}:null;}
  if(kind==='post'){const d=typeof Post!=='undefined'?Post.find(id):null;if(!d)return null;const first=d.author.name.split(/\s+/)[0];
   if(d.perfume)return {href:P('perfume',d.perfume.id),title:d.perfume.name,sub:d.own?'Sua publicação':`Publicação de ${d.author.name}`,text:d.own?`Hoje estou usando ${d.perfume.name}`:`${first} está usando ${d.perfume.name}`,thumb:UI.photo(d.perfume)};
   return d.own?null:{href:P('person',d.author.id),title:d.author.name,sub:'@'+d.author.handle,text:`${d.author.name} no ${BRAND.name}`,thumb:UI.avatar(d.avatar,'lg')};}
  if(kind==='person'){const u=typeof People!=='undefined'?People.get(id):null;return u?{href:P('person',u.id),title:u.name,sub:'@'+(u.handle||u.id),text:`${u.name} no ${BRAND.name}`,thumb:UI.avatar(u,'lg')}:null;}
  if(kind==='profile'){const pr=state.profile;let line='';
   try{if(state.settings.privacy.shareMap!==false){const m=Select.map(),ax=m&&(m.top||m.axes||[]);const names=(Array.isArray(ax)?ax:[]).slice(0,3).map(a=>(a&&(a.label||a.name))||'').filter(Boolean);if(names.length)line=': '+names.join(', ').toLowerCase();}}catch(e){}
   return {href:P('profile'),title:pr.name,sub:'@'+pr.handle,text:`${pr.name} no ${BRAND.name}${line}`,thumb:UI.avatar(null,'lg')};}
  if(kind==='compare'){const ps=String(id).split(',').map(x=>byId(x)).filter(Boolean);if(!ps.length)return null;
   return {href:P('compare',ps.map(p=>p.id).join(',')),title:'Comparação',sub:ps.map(p=>p.name).join(' · '),text:`Comparando ${ps.map(p=>p.name).join(', ')} no ${BRAND.name}`,thumb:UI.photo(ps[0])};}
  if(kind==='edition'){const E=typeof EDITIONS!=='undefined'?EDITIONS:[],e=Array.isArray(E)?E.find(x=>x.id===id):null;if(!e)return null;const s=UI.coverSrc(e.cover);
   return {href:P('edit',e.id),title:e.title,sub:'Edição',text:`${e.title}, uma edição do ${BRAND.name}`,thumb:`<img class="bw" src="${esc(s.src)}" alt="" loading="lazy">`};}
  if(kind==='list'){const name=String(id||''),n=(state.lists[name]||[]).length;if(!name)return null;
   return {href:P('list',name),title:name,sub:UI.plural(n,'perfume','perfumes'),text:`${name}: minha lista no ${BRAND.name}`,thumb:(state.lists[name]||[]).length?UI.photo(byId(state.lists[name][0])):`<span class="ico">${icon('list')}</span>`};}
  return null;},
 share(kind,id){const t=this.target(kind,id);if(!t){toast('Não foi possível compartilhar isto agora.');return;}
  const url=this.base()+t.href;this.sharing={url,title:t.title,text:t.text};
  const sys=typeof navigator!=='undefined'&&typeof navigator.share==='function';
  Sheet.open({title:'Compartilhar',cls:'sh-share',body:`<div class="sh-share-card"><span class="sh-share-thumb">${t.thumb||''}</span><span class="sh-share-txt"><b>${esc(t.title)}</b>${t.sub?`<span>${esc(t.sub)}</span>`:''}</span></div>
<label class="field"><span>Link</span><input class="sh-share-url" readonly value="${esc(url)}" aria-label="Link para compartilhar"></label>
<div class="sh-share-acts">${UI.btn('Copiar link',{action:'share-copy',size:'block',icon:'link'})}${sys?UI.btn('Enviar por outro app',{action:'share-system',variant:'secondary',size:'block',icon:'share'}):''}</div>`});},
 async copy(){const s=this.sharing;if(!s)return;const field=document.querySelector('#sheet .sh-share-url');let ok=false;
  try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(s.url);ok=true;}}catch(e){}
  if(!ok&&field){try{field.focus();field.select();ok=document.execCommand&&document.execCommand('copy');}catch(e){ok=false;}}
  if(ok){await Sheet.close({force:true});toast('Link copiado');}
  else if(field){field.focus();field.select();toast('Selecione o link e copie');}},
 system(){const s=this.sharing;if(!s||!navigator.share)return;navigator.share({title:s.title,text:s.text,url:s.url}).then(()=>Sheet.close({force:true})).catch(()=>{});}
};

Actions.add({
 'sotd-pick':()=>Compose.pick(),
 'sotd-unpick':()=>{if(!Compose.draft)return;Compose.draft.picking=false;Sheet.update(Compose.body());},
 'sotd-choose':el=>Compose.choose(el.dataset.id),
 'sotd-occ':el=>{const d=Compose.draft;if(!d)return;const v=el.dataset.id;d.occasion=d.occasion===v?'':v;d.dirty=true;
  for(const b of document.querySelectorAll('#sheet [data-chips="sotd-occ"] .chip'))b.setAttribute('aria-pressed',b.dataset.id===d.occasion);},
 'sotd-photo-remove':()=>{if(!Compose.draft)return;Compose.draft.photo='';Compose.refresh('.sotd-photo');const i=document.querySelector('#sheet .sotd-add');if(i)i.focus();},
 'sotd-publish':()=>Compose.publish(),
 'share-copy':()=>Compose.copy(),
 'share-system':()=>Compose.system()
});
Actions.input('sotd-text',t=>{if(Compose.draft&&t.name==='text'){Compose.draft.text=t.value;Compose.draft.dirty=true;}});
Actions.input('sotd-q',t=>{if(!Compose.draft)return;Compose.draft.q=t.value;const r=document.querySelector('#sheet .sotd-results');if(r)r.innerHTML=Compose.results(t.value);});
Actions.change('sotd-photo',t=>Compose.photo(t));
Actions.input('comment-text',t=>{const b=t.closest('form')&&t.closest('form').querySelector('[type=submit]');if(b)b.disabled=!t.value.trim();});
Actions.submit('comment-send',f=>Compose.send(f));
