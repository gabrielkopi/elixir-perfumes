'use strict';
/* Editar perfil (§5, §6): folha cheia que edita um rascunho. A pessoa escolhe entre opções curadas
   (capas, tons, tags), nunca define cores ou fontes. A prévia usa o mesmo cabeçalho do perfil. */
const ProfileEdit={
 draft:null,orig:'',errors:{},raf:0,coverKey:'',dragFrom:-1,
 SECTIONS:[['collection','Tenho','Os frascos da sua coleção'],['want','Quero','Seus próximos perfumes'],['reviews','Avaliações','Suas notas e comentários'],['dna','Mapa olfativo','O resumo do seu gosto'],['diary','Diário','Os perfumes que você registrou']],

 /* ---------- estado ---------- */
 clean(){return ProfileRules.sanitize(this.draft);},
 dirty(){return !!this.draft&&JSON.stringify(this.clean())!==this.orig;},
 validate(){return ProfileRules.validate(this.draft,{ownHandle:state.profile.handle});},
 canSave(){return this.dirty()&&!Object.keys(this.validate()).length;},
 body(){return document.querySelector('#sheet .sheet-body.sh-edit');},
 opts(focus=''){return {title:'Editar perfil',head:this.head(),body:this.bodyHtml(),size:'full',cls:'sh-edit',confirmClose:()=>this.confirmClose(),focus};},

 /* ---------- abrir, salvar, descartar ---------- */
 open({focus=''}={}){
  this.draft=JSON.parse(JSON.stringify(state.profile));this.orig=JSON.stringify(ProfileRules.sanitize(this.draft));this.errors={};this.coverKey='';
  const sel=focus==='signature'?'[data-sec="signature"] .btn':focus==='pinned'?'[data-sec="pinned"] .ed-add, [data-sec="pinned"] .btn':'';
  Sheet.open(this.opts(sel));this.coverKey=this.coverOf(this.draft);},
 async confirmClose(){if(!this.dirty())return true;
  const ok=await Sheet.confirm({title:'Descartar alterações?',text:'As mudanças no seu perfil ainda não foram salvas.',ok:'Descartar',danger:true});
  if(!ok)this.repaint();return ok;},
 save(){const errs=this.validate();this.errors=errs;
  if(Object.keys(errs).length){for(const k of ['name','handle','bio','link'])this.showError(k,errs[k]||'');const first=this.body()&&this.body().querySelector('[aria-invalid="true"] input,[aria-invalid="true"] textarea,input[aria-invalid="true"],textarea[aria-invalid="true"]');
   if(first)first.focus();return;}
  if(!this.dirty()){Sheet.close({force:true});return;}
  const clean=this.clean();
  Store.update(s=>{s.profile=clean;},{silent:true});
  this.draft=null;Sheet.close({force:true});
  Motion.page(()=>App.render(),{dir:'none'});toast('Perfil atualizado');},
 async reset(){const ok=await Sheet.confirm({title:'Restaurar o visual padrão?',text:'Capa, tom, foto em P&B e seções visíveis voltam ao padrão. Nome, bio e perfumes ficam como estão.',ok:'Restaurar'});
  if(ok&&this.draft){const d=ProfileRules.defaults();Object.assign(this.draft,{cover:d.cover,tone:d.tone,photoBW:d.photoBW,sections:{...d.sections}});}
  setTimeout(()=>this.repaint(),20);},
 /* Volta a desenhar a folha a partir do rascunho (depois do seletor ou da confirmação). */
 repaint(){if(!this.draft||!Sheet.isOpen())return;const d=document.getElementById('sheet'),y=d?d.scrollTop:0,b=this.body();
  if(b){b.innerHTML=this.bodyHtml();const h=d.querySelector('.sheet-head');if(h){const t=document.createElement('div');t.innerHTML=this.head();h.replaceWith(t.firstElementChild);}Motion.after(b,{quiet:true});}
  else Sheet.open(this.opts());
  this.coverKey=this.coverOf(this.draft);if(d)d.scrollTop=y;},

 /* ---------- marcação ---------- */
 head(){return `<div class="sheet-head ed-head">${UI.btn('Cancelar',{action:'edit-cancel',variant:'tertiary'})}<h2>Editar perfil</h2>${UI.btn('Salvar',{action:'edit-save',size:'sm',attrs:`data-save${this.canSave()?'':' disabled'}`})}</div>`;},
 sec(id,title,body,hint=''){return `<section class="ed-sec" data-sec="${id}" aria-labelledby="ed-h-${id}"><h3 class="t-eyebrow muted" id="ed-h-${id}">${esc(title)}</h3>${body}${hint?`<p class="ed-hint">${hint}</p>`:''}</section>`;},
 coverOf(d){return String(d.cover)+'|'+String(d.signature||'');},
 preview(){const d=this.draft;return `<div class="preview" data-tone="${esc(ProfileRules.cleanTone(d.tone))}" aria-hidden="true" inert><div class="v-profile" data-tone="${esc(ProfileRules.cleanTone(d.tone))}">${Profile.header(this.previewProfile(),{own:true,preview:true})}</div></div>`;},
 previewProfile(){const d=this.draft,c=this.clean();return {...c,name:ProfileRules.cleanName(d.name)||c.name,handle:String(d.handle||'').toLowerCase()||c.handle,bio:ProfileRules.cleanBio(d.bio),link:ProfileRules.cleanLink(d.link)};},
 photoSec(){const d=this.draft,av=UI.avatar({name:d.name,photo:d.photo,initials:UI.initials(d.name)},'lg');
  return this.sec('photo','Foto',`<div class="ed-photo">${d.photoBW&&d.photo?av.replace('class="avatar ','class="avatar mono '):av}<div class="ed-photo-acts"><label class="btn btn--secondary btn--sm pressable ed-file">${icon('camera','icon--20')}<span>${d.photo?'Trocar foto':'Escolher foto'}</span><input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp" data-change="edit-photo"></label>${d.photo?UI.btn('Remover',{action:'edit-photo-remove',variant:'tertiary'}):''}</div></div>
${UI.toggle({name:'photoBW',label:'Versão P&B',sub:d.photo?'A foto aparece em preto e branco.':'Disponível depois de escolher uma foto.',on:!!d.photoBW,attrs:`data-change="edit-bw"${d.photo?'':' disabled'}`})}`);},
 coverSec(){const d=this.draft,sig=d.signature?byId(d.signature):null;
  const opt=(id,label,inner,{disabled=false}={})=>`<button type="button" class="ed-cover pressable" role="radio" aria-checked="${d.cover===id}" tabindex="${d.cover===id?0:-1}" data-action="edit-cover" data-id="${esc(id)}" aria-label="${esc(label)}"${disabled?' disabled':''}><span class="ed-cover-img">${inner}</span><span class="ed-cover-lbl" aria-hidden="true">${esc(label)}</span></button>`;
  const items=[opt('none','Sem capa','<span class="ed-cover-none"></span>'),opt('signature','Meu Elixir',sig?UI.photo(sig):'<span class="ed-cover-none"></span>',{disabled:!sig}),
   ...Object.values(PROFILE_RULES.covers).map(c=>opt(c.id,c.label,`<img src="${esc(c.src800)}" alt="" loading="lazy" decoding="async">`))];
  return this.sec('cover','Capa',`<div class="ed-covers rail-x" role="radiogroup" aria-label="Capa">${items.join('')}</div>`,sig?'':'Escolha o seu Elixir para usar a capa “Meu Elixir”.');},
 toneSec(){const d=this.draft,t=ProfileRules.tone(d.tone);
  return this.sec('tone','Tom',`<div class="ed-tones">${UI.swatches('edit-tone',PROFILE_RULES.tones.map(x=>({id:x.id,label:x.label})),t.id,{label:'Tom do perfil'})}<p class="ed-tone-name" aria-hidden="true">${esc(t.label)}</p></div>`,'Um toque sutil de cor no seu perfil. Não muda o seu mapa.');},
 fieldsSec(){const d=this.draft,e=this.errors,id='ed-handle',L=PROFILE_RULES.limits;
  const handle=`<label class="field ed-at-field"${e.handle?' aria-invalid="true"':''} data-field="handle"><span>@usuário</span><span class="ed-at-row"><span class="ed-at" aria-hidden="true">@</span><input id="${id}" name="handle" type="text" value="${esc(d.handle)}" maxlength="${L.handle[1]}" autocomplete="off" autocapitalize="none" spellcheck="false"${e.handle?` aria-invalid="true" aria-describedby="${id}-e"`:''}></span>${e.handle?`<span class="err" id="${id}-e" role="alert">${esc(e.handle)}</span>`:''}</label>`;
  return this.sec('about','Sobre você',`<div class="ed-fields" data-input="edit-field">
${UI.field({name:'name',label:'Nome',value:d.name,max:L.name[1],error:e.name||'',attrs:'autocomplete="name" data-field="name"'})}
${handle}
${UI.textarea({name:'bio',label:'Bio',value:d.bio,max:L.bio,rows:3,attrs:'data-field="bio"'})}
${UI.field({name:'link',label:'Link',value:d.link,type:'url',max:L.link,error:e.link||'',hint:'Um endereço que comece com https://',attrs:'inputmode="url" autocomplete="url" placeholder="https://" data-field="link"'})}</div>`);},
 slotRow(p,i,n){return `<li class="ed-slot" draggable="true" data-i="${i}" data-id="${esc(p.id)}"><span class="ed-slot-n" aria-hidden="true">${i+1}</span><span class="thumb plate">${p.image?`<img src="${esc(p.image)}" alt="" loading="lazy" decoding="async">`:''}</span><span class="grow"><b>${esc(p.name)}</b><span>${esc(p.brand)}</span></span><span class="ed-slot-acts">${UI.iconBtn('chevron-up',{action:'edit-pin-move',bare:true,label:`Subir ${p.name}`,attrs:`data-id="${i}" data-dir="-1"${i===0?' disabled':''}`})}${UI.iconBtn('chevron-down',{action:'edit-pin-move',bare:true,label:`Descer ${p.name}`,attrs:`data-id="${i}" data-dir="1"${i===n-1?' disabled':''}`})}${UI.iconBtn('close',{action:'edit-pin-remove',bare:true,label:`Tirar ${p.name}`,attrs:`data-id="${i}"`})}</span></li>`;},
 sigSec(){const p=this.draft.signature?byId(this.draft.signature):null;
  const row=p?`<div class="ed-slot ed-slot--sig"><span class="thumb plate">${p.image?`<img src="${esc(p.image)}" alt="" loading="lazy" decoding="async">`:''}</span><span class="grow"><b>${esc(p.name)}</b><span>${esc(p.brand)}</span></span></div>`:'<p class="muted">O perfume que as pessoas lembram quando pensam em você.</p>';
  return this.sec('signature','Meu Elixir',`${row}<div class="ed-row-acts">${UI.btn(p?'Trocar':'Escolher',{action:'edit-pick-sig',variant:'secondary',size:'sm'})}${p?UI.btn('Remover',{action:'edit-sig-remove',variant:'tertiary'}):''}</div>`);},
 pinSec(){const ids=this.draft.pinned.filter(id=>byId(id)),ps=ids.map(byId),left=PROFILE_RULES.limits.pinned-ps.length;
  const pt=ps.length>=2?Profile.portrait(ids):null;
  const add=left>0?`<li class="ed-slot ed-slot--add"><button type="button" class="ed-add pressable" data-action="edit-pin-add">${icon('plus','icon--20')}<span>Adicionar perfume</span><small>${esc(left===1?'falta 1':'faltam '+left)}</small></button></li>`:'';
  return this.sec('pinned','Esse sou eu',`<p class="ed-lead">Até 5 perfumes que são a sua cara. A ordem é a do seu perfil.</p><ol class="ed-slots list-hair" aria-label="Seus perfumes">${ps.map((p,i)=>this.slotRow(p,i,ps.length)).join('')}${add}</ol>
<p class="em ed-portrait" aria-live="polite">${pt&&pt.line?esc(pt.line):'Escolha pelo menos 2 para ver o que eles dizem sobre você.'}</p>`);},
 chipSec(id,title,list,sel,action,label){return this.sec(id,title,`${UI.chips(list.map(x=>({id:x.id,label:x.label,on:sel.includes(x.id)})),action,{label})}<p class="ed-count" data-count-for="${id}">${esc(`${sel.length} de 3`)}</p>`);},
 sectionsSec(){const s=this.draft.sections;return this.sec('sections','Seções visíveis',`<div class="ed-toggles list-hair">${this.SECTIONS.map(([k,l,sub])=>UI.toggle({name:k,label:l,sub,on:s[k]!==false,attrs:`data-change="edit-section" data-id="${k}"`})).join('')}</div>`);},
 bodyHtml(){const d=this.draft;
  return `${this.preview()}${this.photoSec()}${this.coverSec()}${this.toneSec()}${this.fieldsSec()}${this.sigSec()}${this.pinSec()}
${this.chipSec('style','Estilo',PROFILE_RULES.styleTags.map(t=>({id:t,label:t})),d.styleTags,'edit-style','Estilo')}
${this.chipSec('music','Trilha',PROFILE_RULES.musicTags.map(t=>({id:t,label:t})),d.musicTags,'edit-music','Trilha')}
${typeof FAMILIES!=='undefined'?this.chipSec('families','Famílias favoritas',FAMILIES.map(f=>({id:f[0],label:f[1]})),d.families,'edit-family','Famílias favoritas'):''}
${this.sectionsSec()}<div class="ed-reset">${UI.btn('Restaurar padrão',{action:'edit-reset',variant:'tertiary'})}</div>`;},

 /* ---------- atualizações no lugar ---------- */
 changed(){this.schedule();const b=document.querySelector('#sheet [data-save]');if(b)b.disabled=!this.canSave();},
 schedule(){if(this.raf)return;this.raf=requestAnimationFrame(()=>{this.raf=0;this.paintPreview();});},
 paintPreview(){const box=document.querySelector('#sheet .sh-edit .preview');if(!box||!this.draft)return;
  const tone=ProfileRules.cleanTone(this.draft.tone),inner=box.querySelector('.v-profile'),html=Profile.header(this.previewProfile(),{own:true,preview:true});
  box.dataset.tone=tone;if(inner)inner.dataset.tone=tone;const key=this.coverOf(this.draft);
  const head=inner&&inner.querySelector('.pf-head');if(!head)return;
  const t=document.createElement('div');t.innerHTML=html;const nh=t.firstElementChild;
  if(key===this.coverKey){const a=head.querySelector('.pf-id'),b=nh.querySelector('.pf-id');if(a&&b)a.replaceWith(b);}
  else{nh.classList.add('is-new');head.replaceWith(nh);this.coverKey=key;}
  Motion.settle(box);},
 swapSec(id,html){const old=document.querySelector(`#sheet .sh-edit [data-sec="${id}"]`);if(!old)return;const t=document.createElement('div');t.innerHTML=html;const n=t.firstElementChild;old.replaceWith(n);Motion.settle(n);return n;},
 showError(name,msg){const b=this.body();if(!b)return;const inp=b.querySelector(`[name="${name}"]`);if(!inp)return;const f=inp.closest('.field');const eid=(inp.id||name)+'-e';let e=f.querySelector('.err');
  if(msg){if(!e){e=document.createElement('span');e.className='err';e.id=eid;e.setAttribute('role','alert');f.append(e);}e.textContent=msg;f.setAttribute('aria-invalid','true');inp.setAttribute('aria-invalid','true');
   const d=(inp.getAttribute('aria-describedby')||'').split(' ').filter(x=>x&&x!==eid);d.push(eid);inp.setAttribute('aria-describedby',d.join(' '));}
  else{if(e)e.remove();f.removeAttribute('aria-invalid');inp.removeAttribute('aria-invalid');const d=(inp.getAttribute('aria-describedby')||'').split(' ').filter(x=>x&&x!==eid);if(d.length)inp.setAttribute('aria-describedby',d.join(' '));else inp.removeAttribute('aria-describedby');}},
 check(name){const errs=this.validate();this.errors=errs;this.showError(name,errs[name]||'');},
 input(t){if(!this.draft||!t.name)return;
  if(t.name==='handle'){const v=t.value.replace(/^@+/,'').toLowerCase();if(v!==t.value){const pos=t.selectionStart-(t.value.length-v.length);t.value=v;try{t.setSelectionRange(pos,pos);}catch(e){}}}
  this.draft[t.name]=t.value;if(this.errors[t.name])this.check(t.name);this.changed();},
 blur(t){if(!this.draft||!t.name)return;
  if(t.name==='link'){const v=t.value.trim();if(v&&!/^[a-z]+:\/\//i.test(v)){t.value='https://'+v.replace(/^\/+/,'');this.draft.link=t.value;this.changed();}}
  if(['name','handle','bio','link'].includes(t.name))this.check(t.name);},
 tag(key,id,el,max=3){const list=this.draft[key],on=list.includes(id);
  if(!on&&list.length>=max){toast(`Escolha até ${max}.`);return;}
  this.draft[key]=on?list.filter(x=>x!==id):[...list,id];el.setAttribute('aria-pressed',!on);
  const sec=el.closest('[data-sec]'),c=sec&&sec.querySelector('.ed-count');if(c)c.textContent=`${this.draft[key].length} de ${max}`;this.changed();},
 pinMove(i,dir){const a=this.draft.pinned,j=i+dir;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];
  const n=this.swapSec('pinned',this.pinSec());this.changed();const b=n&&n.querySelector(`[data-action="edit-pin-move"][data-id="${j}"][data-dir="${dir}"]:not([disabled])`)||n&&n.querySelector(`[data-action="edit-pin-move"][data-id="${j}"]`);try{b&&b.focus();}catch(e){}},
 pick(kind){const d=this.draft,have=Select.shelfIds('have'),loved=Object.keys(state.ratings).filter(id=>state.ratings[id]>=7).sort((a,b)=>state.ratings[b]-state.ratings[a]);
  const first=[...new Set([...have,...loved])];
  const done=id=>{if(!this.draft)return;const p=byId(id);if(!p)return;
   if(kind==='sig')this.draft.signature=p.id;else if(!this.draft.pinned.includes(p.id)&&this.draft.pinned.length<PROFILE_RULES.limits.pinned)this.draft.pinned=[...this.draft.pinned,p.id];
   this.repaint();setTimeout(()=>{this.repaint();this.changed();const s=document.querySelector(`#sheet [data-sec="${kind==='sig'?'signature':'pinned'}"]`);if(s)try{s.scrollIntoView({block:'center',behavior:Motion.reduced()?'auto':'smooth'});}catch(e){}},0);};
  Lists.choose({title:kind==='sig'?'Meu Elixir':'Esse sou eu',exclude:kind==='sig'?[d.signature].filter(Boolean):d.pinned,first,onPick:done});},
 async photo(input){const f=input.files&&input.files[0];if(!f||!this.draft)return;
  try{const url=await readImage(f,{max:320,square:true,quality:.82});
   if(url.length>PROFILE_RULES.limits.photoKB*1024*1.37){toast('Essa foto ficou grande demais. Tente outra.');return;}
   this.draft.photo=url;this.swapSec('photo',this.photoSec());this.changed();}
  catch(e){toast(e&&e.message?e.message:'Não foi possível usar essa foto.');}},
 /* Arrastar para reordenar (ponteiro fino); os botões ↑↓ continuam sendo o caminho acessível. */
 init(){
  document.addEventListener('focusout',e=>{const t=e.target;if(t&&t.closest&&t.closest('#sheet .sh-edit [data-input="edit-field"]'))this.blur(t);});
  document.addEventListener('dragstart',e=>{const li=e.target.closest&&e.target.closest('#sheet .sh-edit .ed-slot[draggable]');if(!li)return;this.dragFrom=Number(li.dataset.i);li.classList.add('is-drag');try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',li.dataset.id);}catch(x){}});
  document.addEventListener('dragover',e=>{const li=e.target.closest&&e.target.closest('#sheet .sh-edit .ed-slot[draggable]');if(!li||this.dragFrom<0)return;e.preventDefault();for(const x of document.querySelectorAll('#sheet .ed-slot.is-over'))if(x!==li)x.classList.remove('is-over');li.classList.add('is-over');});
  document.addEventListener('drop',e=>{const li=e.target.closest&&e.target.closest('#sheet .sh-edit .ed-slot[draggable]');if(!li||this.dragFrom<0||!this.draft)return;e.preventDefault();
   const to=Number(li.dataset.i),a=this.draft.pinned,[m]=a.splice(this.dragFrom,1);a.splice(to,0,m);this.dragFrom=-1;this.swapSec('pinned',this.pinSec());this.changed();});
  document.addEventListener('dragend',()=>{this.dragFrom=-1;for(const x of document.querySelectorAll('#sheet .ed-slot.is-drag,#sheet .ed-slot.is-over'))x.classList.remove('is-drag','is-over');});
 }
};

Actions.add({
 'edit-cancel':()=>Sheet.close(),
 'edit-save':()=>ProfileEdit.save(),
 'edit-reset':()=>ProfileEdit.reset(),
 'edit-cover':el=>{if(!ProfileEdit.draft||el.disabled)return;ProfileEdit.draft.cover=el.dataset.id;const g=el.closest('[role=radiogroup]');
  if(g)for(const b of g.querySelectorAll('[role=radio]')){const on=b===el;b.setAttribute('aria-checked',on);b.tabIndex=on?0:-1;}ProfileEdit.changed();},
 'edit-tone':el=>{if(!ProfileEdit.draft)return;const id=ProfileRules.cleanTone(el.dataset.id);ProfileEdit.draft.tone=id;UI.segSet(el.closest('.swatches'),id);
  const n=document.querySelector('#sheet .ed-tone-name');if(n)n.textContent=ProfileRules.tone(id).label;ProfileEdit.changed();},
 'edit-style':el=>ProfileEdit.tag('styleTags',el.dataset.id,el),
 'edit-music':el=>ProfileEdit.tag('musicTags',el.dataset.id,el),
 'edit-family':el=>ProfileEdit.tag('families',el.dataset.id,el),
 'edit-photo-remove':()=>{if(!ProfileEdit.draft)return;ProfileEdit.draft.photo='';ProfileEdit.draft.photoBW=false;const n=ProfileEdit.swapSec('photo',ProfileEdit.photoSec());ProfileEdit.changed();const b=n&&n.querySelector('.ed-file input');try{b&&b.focus();}catch(e){}},
 'edit-pick-sig':()=>ProfileEdit.pick('sig'),
 'edit-sig-remove':()=>{if(!ProfileEdit.draft)return;ProfileEdit.draft.signature=null;if(ProfileEdit.draft.cover==='signature')ProfileEdit.draft.cover='none';ProfileEdit.repaint();ProfileEdit.changed();},
 'edit-pin-add':()=>ProfileEdit.pick('pin'),
 'edit-pin-move':el=>ProfileEdit.pinMove(Number(el.dataset.id),Number(el.dataset.dir)),
 'edit-pin-remove':el=>{if(!ProfileEdit.draft)return;const i=Number(el.dataset.id);ProfileEdit.draft.pinned=ProfileEdit.draft.pinned.filter((_,k)=>k!==i);const n=ProfileEdit.swapSec('pinned',ProfileEdit.pinSec());ProfileEdit.changed();
  const f=n&&(n.querySelector(`[data-action="edit-pin-remove"][data-id="${Math.min(i,ProfileEdit.draft.pinned.length-1)}"]`)||n.querySelector('.ed-add'));try{f&&f.focus();}catch(e){}}
});
Actions.input('edit-field',t=>ProfileEdit.input(t));
Actions.change('edit-photo',t=>ProfileEdit.photo(t));
Actions.change('edit-bw',t=>{if(!ProfileEdit.draft)return;ProfileEdit.draft.photoBW=!!t.checked;const a=document.querySelector('#sheet .ed-photo .avatar');if(a)a.classList.toggle('mono',!!t.checked);ProfileEdit.changed();});
Actions.change('edit-section',t=>{if(!ProfileEdit.draft)return;const k=t.dataset.id;if(PROFILE_RULES.sections.includes(k)){ProfileEdit.draft.sections={...ProfileEdit.draft.sections,[k]:!!t.checked};ProfileEdit.changed();}});
ProfileEdit.init();
