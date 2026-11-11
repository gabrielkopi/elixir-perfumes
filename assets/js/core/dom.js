'use strict';
/* Utilitários de DOM e de marcação. Sem dependências. */
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const compact=n=>new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1}).format(n);
const toggle=(arr,id)=>arr.includes(id)?arr.filter(x=>x!==id):[...arr,id];
const plural=(n,one,many)=>`${n} ${n===1?one:many}`;

/* Ícones v3: grade 24, traço 1,5. As variantes -fill marcam a aba ativa. Views nunca desenham SVG próprio. */
const ICONS={
 home:'<path d="M4 10.5 12 4l8 6.5V20H4Z"/><path d="M10 20v-5h4v5"/>',
 'home-fill':'<path d="M4 10.5 12 4l8 6.5V20h-6v-5h-4v5H4Z" fill="currentColor"/>',
 search:'<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 minus:'<path d="M5 12h14"/>',
 user:'<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
 people:'<circle cx="9" cy="9" r="3"/><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><path d="M15 6.2a3 3 0 0 1 0 5.6M17 14.6c2 .5 3.2 2 3.5 4.4"/>',
 heart:'<path d="M12 19.5s-7.5-4.4-7.5-9.8A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.4c0 5.4-7.5 9.8-7.5 9.8Z"/>',
 'heart-fill':'<path d="M12 19.5s-7.5-4.4-7.5-9.8A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.4c0 5.4-7.5 9.8-7.5 9.8Z" fill="currentColor"/>',
 comment:'<path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4.5 19.5l1.3-4.2A7.5 7.5 0 1 1 20 11.5Z"/>',
 bookmark:'<path d="M6.5 4h11v16l-5.5-4-5.5 4Z"/>',
 'bookmark-fill':'<path d="M6.5 4h11v16l-5.5-4-5.5 4Z" fill="currentColor"/>',
 share:'<path d="M12 15V4m-4 4 4-4 4 4"/><path d="M7 11H5.5v9h13v-9H17"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 back:'<path d="M19 12H5m5-5-5 5 5 5"/>',
 'arrow-up':'<path d="M12 19V5m-5 5 5-5 5 5"/>',
 'arrow-down':'<path d="M12 5v14m-5-5 5 5 5-5"/>',
 'arrow-up-right':'<path d="M7 17 17 7M9 7h8v8"/>',
 close:'<path d="m6.5 6.5 11 11m0-11-11 11"/>',
 chevron:'<path d="m9.5 6 6 6-6 6"/>',
 'chevron-right':'<path d="m9.5 6 6 6-6 6"/>',
 'chevron-left':'<path d="m14.5 6-6 6 6 6"/>',
 'chevron-down':'<path d="m6 9.5 6 6 6-6"/>',
 'chevron-up':'<path d="m6 14.5 6-6 6 6"/>',
 more:'<circle cx="6" cy="12" r=".9" fill="currentColor"/><circle cx="12" cy="12" r=".9" fill="currentColor"/><circle cx="18" cy="12" r=".9" fill="currentColor"/>',
 filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
 sliders:'<path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2m0 12.6v2.2M3.5 12h2.2m12.6 0h2.2M6 6l1.6 1.6m8.8 8.8L18 18M6 18l1.6-1.6m8.8-8.8L18 6"/>',
 bell:'<path d="M6 16.5h12l-1.4-2.2V10a4.6 4.6 0 0 0-9.2 0v4.3Z"/><path d="M10.2 19.5h3.6"/>',
 sun:'<circle cx="12" cy="12" r="3.8"/><path d="M12 3v1.8m0 14.4V21M3 12h1.8m14.4 0H21M5.6 5.6l1.3 1.3m10.2 10.2 1.3 1.3M5.6 18.4l1.3-1.3M17.1 6.9l1.3-1.3"/>',
 moon:'<path d="M19.5 14.2A7.5 7.5 0 0 1 9.8 4.5a7.5 7.5 0 1 0 9.7 9.7Z"/>',
 cloud:'<path d="M7.5 18.5h9.2a3.8 3.8 0 0 0 .4-7.6 5.3 5.3 0 0 0-10.2 1.5A3.1 3.1 0 0 0 7.5 18.5Z"/>',
 drop:'<path d="M12 3.8s5.5 6 5.5 10.2a5.5 5.5 0 0 1-11 0C6.5 9.8 12 3.8 12 3.8Z"/>',
 spark:'<path d="M12 4.5 13.8 10l5.7 2-5.7 2L12 19.5 10.2 14l-5.7-2 5.7-2Z"/>',
 sparkle:'<path d="M12 3.5c.6 4.6 3.9 7.9 8.5 8.5-4.6.6-7.9 3.9-8.5 8.5-.6-4.6-3.9-7.9-8.5-8.5 4.6-.6 7.9-3.9 8.5-8.5Z"/>',
 wand:'<path d="m4.5 19.5 10-10m-1.5-1.5 3 3"/><path d="M17.5 3.5v3m-1.5-1.5h3M20 9.5v2m-1-1h2"/>',
 star:'<path d="m12 4 2.4 5 5.4.7-4 3.8 1 5.4L12 16.3 7.2 18.9l1-5.4-4-3.8 5.4-.7Z"/>',
 compare:'<path d="M8 4v16M16 4v16"/><path d="M4 8h4m8 8h4"/>',
 scale:'<path d="M12 4v16M8 20h8M5 7h14"/><path d="m5 7-2.5 6a2.8 2.8 0 0 0 5 0Zm14 0-2.5 6a2.8 2.8 0 0 0 5 0Z"/>',
 check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
 grid:'<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>',
 list:'<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r=".8" fill="currentColor"/><circle cx="4.8" cy="12" r=".8" fill="currentColor"/><circle cx="4.8" cy="17.5" r=".8" fill="currentColor"/>',
 gift:'<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3.5 9h17M12 9v11"/><path d="M12 9c-1.5-3.5-5.5-4-5.5-1.7S10 9 12 9Zm0 0c1.5-3.5 5.5-4 5.5-1.7S14 9 12 9Z"/>',
 calendar:'<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4m7-4v4"/>',
 clock:'<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
 camera:'<path d="M4 8.5h3.2L9 6h6l1.8 2.5H20V19H4Z"/><circle cx="12" cy="13.3" r="3.3"/>',
 trash:'<path d="M5 7h14M10 4h4M7 7l.8 13h8.4L17 7"/><path d="M10.2 10.5v6m3.6-6v6"/>',
 edit:'<path d="m14.5 5.5 4 4L9 19H5v-4Z"/>',
 info:'<circle cx="12" cy="12" r="8"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".8" fill="currentColor"/>',
 link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2"/>',
 lock:'<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
 download:'<path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5"/><path d="M5 19.5h14"/>',
 pin:'<path d="M12 20.5s6-5.6 6-10.5a6 6 0 0 0-12 0c0 4.9 6 10.5 6 10.5Z"/><circle cx="12" cy="10" r="2.2"/>',
 compass:'<circle cx="12" cy="12" r="8"/><path d="m15 9-2 4-4 2 2-4Z"/>',
 qr:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2.5v2.5H14ZM18 18h2v2h-2ZM18 14h2M14 19.5h1.5"/>',
 pause:'<path d="M9 6v12M15 6v12"/>',
 play:'<path d="M8 5.5v13l10-6.5Z"/>',
 eye:'<path d="M3 12s3.3-6 9-6 9 6 9 6-3.3 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.6"/>'
};
const icon=(name,cls='')=>{
 if(!ICONS[name])console.warn('Ícone desconhecido: '+name);
 return `<svg class="icon${cls?' '+cls:''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]||ICONS.sparkle}</svg>`;
};

/* Toast: pílula sólida, um por vez. Com desfazer, dura 6 s e pausa com o ponteiro ou o foco. */
const Toast={
 el:null,timer:null,undo:null,left:0,started:0,
 show(text,{undo=null,ms=4000}={}){
  const host=document.getElementById('toasts');if(!host)return;
  this.clear(true);
  const ttl=undo?Math.max(ms,6000):ms;
  const el=document.createElement('div');el.className='toast';el.setAttribute('role','status');
  el.innerHTML=`<span>${esc(text)}</span>${undo?'<button type="button" class="btn btn--sm" data-toast-undo>Desfazer</button>':''}`;
  host.append(el);this.el=el;this.undo=undo;this.left=ttl;this.resume();
  el.addEventListener('mouseenter',()=>this.pause());el.addEventListener('mouseleave',()=>this.resume());
  el.addEventListener('focusin',()=>this.pause());el.addEventListener('focusout',()=>this.resume());
  el.querySelector('[data-toast-undo]')?.addEventListener('click',()=>{const fn=this.undo;this.undo=null;this.hide();try{fn&&fn();}catch(e){console.warn(e);}});
 },
 pause(){if(!this.timer)return;clearTimeout(this.timer);this.timer=null;this.left-=Date.now()-this.started;},
 resume(){if(this.timer||!this.el)return;this.started=Date.now();this.timer=setTimeout(()=>this.hide(),Math.max(800,this.left));},
 /* Remove o toast atual; o desfazer dele é descartado, nunca executado. */
 clear(){clearTimeout(this.timer);this.timer=null;this.undo=null;if(this.el){this.el.remove();this.el=null;}},
 hide(){const el=this.el;if(!el)return;clearTimeout(this.timer);this.timer=null;this.undo=null;this.el=null;
  el.classList.add('out');let gone=false;const rm=()=>{if(!gone){gone=true;el.remove();}};el.addEventListener('animationend',rm,{once:true});setTimeout(rm,320);}
};
const toast=(text,opts)=>Toast.show(text,opts);

/* Reduz uma imagem escolhida pelo usuário a um JPEG leve (perfil: 320 q.82; publicação: 720 q.72). */
async function readImage(file,{max=1400,square=false,limit=20,quality=.85}={}){
 if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>limit*1024*1024)throw new Error(`Escolha JPG, PNG ou WebP de até ${limit} MB.`);
 const img=await createImageBitmap(file),c=document.createElement('canvas'),ctx=c.getContext('2d');
 if(square){const side=Math.min(img.width,img.height);c.width=c.height=Math.min(max,side);ctx.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,c.width,c.height);}
 else{const s=Math.min(1,max/Math.max(img.width,img.height));c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);ctx.drawImage(img,0,0,c.width,c.height);}
 img.close?.();return c.toDataURL('image/jpeg',quality);
}
