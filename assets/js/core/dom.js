'use strict';
/* Utilitários de DOM e de marcação. Sem dependências. */
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const compact=n=>new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1}).format(n);
const toggle=(arr,id)=>arr.includes(id)?arr.filter(x=>x!==id):[...arr,id];
const plural=(n,one,many)=>`${n} ${n===1?one:many}`;

const ICONS={
 home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-8 16-8 16 0"/>',
 heart:'<path d="M20 5c-3-3-7-1-8 2-1-3-5-5-8-2-5 5 1 10 8 15 7-5 13-10 8-15Z"/>',
 comment:'<path d="M20 15a9 9 0 1 0-5 5l5 1Z"/>',
 bookmark:'<path d="M6 3h12v18l-6-4-6 4Z"/>',
 share:'<path d="M12 15V2m-5 5 5-5 5 5M5 12v9h14v-9"/>',
 arrow:'<path d="M4 12h16m-5-5 5 5-5 5"/>',
 back:'<path d="M20 12H4m5-5-5 5 5 5"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 bell:'<path d="M5 17h14l-1.5-3V10a5.5 5.5 0 0 0-11 0v4ZM10 20.5h4"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
 moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>',
 spark:'<path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2Z"/>',
 compare:'<path d="M8 3v18M16 3v18M3 8l5-5 5 5M11 16l5 5 5-5"/>',
 settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
 check:'<path d="m5 12 4 4L20 5"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
 drop:'<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z"/>'
};
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]||ICONS.spark}</svg>`;
const btn=(text,action,extra='',cls='')=>`<button class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;
const numberField=(name,label,value,min,max)=>`<label class="field">${label}<input type="number" name="${name}" value="${esc(value)}" min="${min}" max="${max}" step="any"></label>`;
const selectField=(name,label,options,selected)=>`<label class="field">${label}<select name="${name}">${options.map(o=>`<option ${o===String(selected)?'selected':''} value="${esc(o)}">${esc(o||'Não informar')}</option>`).join('')}</select></label>`;

const Toast={
 timer:null,
 show(msg,{undo}={}){const el=$('#toast');el.innerHTML=`<span>${esc(msg)}${Store.available?'':' (só nesta sessão)'}</span>${undo?'<button data-toast-undo>Desfazer</button>':''}`;el.classList.add('show');this.undo=undo||null;clearTimeout(this.timer);this.timer=setTimeout(()=>this.hide(),3400);},
 hide(){$('#toast').classList.remove('show');this.undo=null;}
};
const toast=(msg,opts)=>Toast.show(msg,opts);
document.addEventListener('click',e=>{if(e.target.closest('[data-toast-undo]')&&Toast.undo){Toast.undo();Toast.hide();}});

/* Reduz uma imagem escolhida pelo usuário a um JPEG leve. */
async function readImage(file,{max=1400,square=false,limit=20}={}){
 if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>limit*1024*1024)throw new Error(`Escolha JPG, PNG ou WebP de até ${limit} MB.`);
 const img=await createImageBitmap(file),c=document.createElement('canvas'),ctx=c.getContext('2d');
 if(square){const side=Math.min(img.width,img.height);c.width=c.height=max;ctx.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,max,max);}
 else{const s=Math.min(1,max/Math.max(img.width,img.height));c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);ctx.drawImage(img,0,0,c.width,c.height);}
 img.close();return c.toDataURL('image/jpeg',.85);
}
