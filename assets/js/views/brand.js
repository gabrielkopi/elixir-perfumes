'use strict';
/* Marcas (A–Z e página da marca) e Edições (lista editorial e página da edição). */
const Brands={
 LIMIT:24,
 letter(name){const c=String(name||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().charAt(0).toUpperCase();return /[A-Z]/.test(c)?c:'#';},
 meta(b){const t=Explore.tierLabel(b.tier);return [UI.plural(b.count,'perfume','perfumes'),t,b.national?'Nacional':''].filter(Boolean).join(' · ');},
 ranked(items){const ids=new Set(items.map(p=>p.id));return (typeof Select!=='undefined'?Select.ranked().map(x=>x.p):items).filter(p=>ids.has(p.id));},
 /* ---------- Marcas ---------- */
 view(){const all=Catalog.brands(),groups=new Map();for(const b of all){const L=this.letter(b.name);if(!groups.has(L))groups.set(L,[]);groups.get(L).push(b);}
  const letters=[...groups.keys()].sort((a,b)=>a==='#'?1:b==='#'?-1:a.localeCompare(b));
  return `<section class="v-explore v-brand" data-view="brands">${Explore.head('brands')}
<p class="t-sm muted br-count">${UI.plural(all.length,'marca','marcas')} de A a Z</p>
<div class="br-az">${letters.map(L=>`<section class="br-letter" aria-labelledby="br-l-${esc(L)}"><h2 class="t-eyebrow br-lh" id="br-l-${esc(L)}">${esc(L)}</h2><ul class="list-hair br-list">${groups.get(L).map(b=>`<li><a class="br-row pressable" href="#brand/${esc(b.slug)}"><span class="grow"><b>${esc(b.name)}</b><span>${esc(this.meta(b))}</span></span>${icon('chevron-right','icon--20')}</a></li>`).join('')}</ul></section>`).join('')}</div></section>`;},
 notFound(kind){const t={brand:'Não encontramos esta marca',edit:'Não encontramos esta edição'}[kind];return `<section class="v-brand" data-view="${kind}">${UI.empty({icon:'search',title:t,text:'Talvez o endereço tenha mudado.',cta:{label:'Ir para Descobrir',href:'#explore'}})}</section>`;},
 /* ---------- Página da marca ---------- */
 detail(slug){const b=Catalog.brand(slug);if(!b||!b.items.length)return this.notFound('brand');
  const list=this.ranked(b.items),fams=new Map();for(const p of list){const f=Catalog.familyOf(p);if(f)fams.set(f.name,(fams.get(f.name)||0)+1);}
  const bars=[...fams.entries()].sort((a,b)=>b[1]-a[1]).map(([label,n])=>({label,value:Math.round(n/list.length*100),text:UI.plural(n,'perfume','perfumes')}));
  const name=b.name.length<=12?`<h1 class="t-display br-name" data-fit>${esc(b.name)}</h1>`:`<h1 class="t-display br-name br-name--long">${esc(b.name)}</h1>`;
  const grid=`<div class="grid-z stagger">${list.slice(0,this.LIMIT).map((p,i)=>UI.tile(p,{i})).join('')}</div>${list.length>this.LIMIT?`<div class="br-all">${UI.btn(`Ver os ${UI.count(list.length)} em Descobrir`,{action:'brand-explore',variant:'secondary',attrs:`data-id="${esc(b.slug)}"`})}</div>`:''}`;
  return `<section class="v-brand" data-view="brand"><header class="br-hero"><p class="t-eyebrow muted">${esc(this.meta(b))}</p>${name}<i data-sentinel aria-hidden="true"></i></header>
${bars.length>1?UI.section({title:'Famílias da casa',body:`<div class="br-bars">${UI.bars(bars,5)}</div>`}):''}
${UI.section({title:'Perfumes',body:grid})}</section>`;},
 /* ---------- Edições ---------- */
 edits(){const eds=typeof Editions!=='undefined'?Editions.rail():[],m=new Date().getMonth()+1;
  const body=eds.length?`<div class="eds-list">${eds.map((e,i)=>UI.cover({image:e.cover,eyebrow:[e.months.length<12&&e.months.includes(m)?'Agora':'Edição',UI.plural(Editions.items(e.id).length,'perfume','perfumes')],title:e.title,text:e.thesis,ratio:'',href:'#edit/'+e.id,eager:i===0,cls:'full eds-cover'})).join('')}</div>`
   :UI.empty({title:'Nenhuma edição por enquanto',text:'Volte em breve para novas seleções.'});
  return `<section class="v-explore v-brand" data-view="edits">${Explore.head('edits')}${body}</section>`;},
 edit(id){const e=typeof Editions!=='undefined'?Editions.get(id):null;if(!e)return this.notFound('edit');const list=Editions.items(e.id);
  const share=UI.iconBtn('share',{action:'share',label:'Compartilhar edição',attrs:`data-kind="edition" data-id="${esc(e.id)}"`});
  const body=list.length?UI.section({title:'Selecionados para você',body:`<div class="grid-z stagger">${list.map((p,i)=>UI.tile(p,{i})).join('')}</div>`})
   :UI.empty({title:'Esta edição ainda não tem perfumes',text:'O catálogo cresce sempre. Veja as outras seleções.',cta:{label:'Ver todas as edições',href:'#edits'}});
  return `<section class="v-brand" data-view="edit">${UI.cover({image:e.cover,eyebrow:['Edição',UI.plural(list.length,'perfume','perfumes')],title:e.title,ratio:'',mega:true,eager:true,cls:'full eds-hero'})}<i data-sentinel aria-hidden="true"></i>
<div class="eds-intro"><p class="eds-thesis">${esc(e.thesis)}</p>${share}</div>${body}</section>`;}
};
Actions.add({
 'brand-explore':el=>{const vs=Explore.state();vs.filters=Explore.blank();vs.filters.brands=[el.dataset.id];vs.q='';vs.batches=1;Explore.save();Router.go('explore');}
});
Router.add('brands',{view:()=>Brands.view(),title:'Marcas'});
Router.add('brand',{view:id=>Brands.detail(id),title:id=>(Catalog.brand(id)||{}).name||'Marca'});
Router.add('edits',{view:()=>Brands.edits(),title:'Edições'});
Router.add('edit',{view:id=>Brands.edit(id),title:id=>((typeof Editions!=='undefined'&&Editions.get(id))||{}).title||'Edição'});
