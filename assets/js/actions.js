'use strict';
/* Ações globais do core (§4.5). As views registram as delas com prefixos próprios. Nenhum nome global novo aqui. */
Actions.add({
 nav:el=>Router.go(el.dataset.page||'home',el.dataset.id||''),
 back:()=>{const n=Router.navOf();Router.back([['home','explore','guide','collection','profile'].includes(n)?n:'home','']);},
 close:()=>Sheet.close(),
 skip:()=>{const m=document.getElementById('main');if(m)m.focus();},
 perfume:el=>{const id=el.dataset.id;if(!id)return;const plate=el.querySelector('.plate')||(el.closest('.tile,.row')&&el.closest('.tile,.row').querySelector('.plate'));if(plate)Motion.hero(plate);Router.go('perfume',id);},
 person:el=>{if(el.dataset.id)Router.go('person',el.dataset.id);},
 search:()=>{if(typeof Search!=='undefined'&&Search.open)Search.open();else toast('A busca chega em breve.');},
 activity:()=>{if(typeof Activity!=='undefined'&&Activity.open)Activity.open();else toast('A atividade chega em breve.');},
 settings:()=>Settings.open(),
 'theme-set':(el,e)=>{const v=el.dataset.id;UI.segSet(el.closest('.seg'),v);const r=el.getBoundingClientRect();Theme.set(v,{x:e&&e.clientX?e.clientX:r.left+r.width/2,y:e&&e.clientY?e.clientY:r.top+r.height/2});},
 /* Seguir: atualiza no lugar todos os botões da pessoa, com desfazer. */
 follow:el=>{const id=el.dataset.id;if(!id)return;const on=!state.following.includes(id);
  const apply=v=>{Store.update(s=>{s.following=v?[...new Set([...s.following,id])]:s.following.filter(x=>x!==id);},{silent:true});
   for(const b of document.querySelectorAll(`[data-follow="${CSS.escape(id)}"]`)){b.setAttribute('aria-pressed',v);b.classList.toggle('btn--secondary',v);const t=b.querySelector('span')||b;t.textContent=v?'Seguindo':'Seguir';}};
  apply(on);const u=typeof People!=='undefined'&&People.all?People.all().find(p=>p.id===id):null,name=u?u.name.split(' ')[0]:'';
  toast(on?`Seguindo ${name}`.trim():`Você deixou de seguir ${name}`.trim(),{undo:()=>apply(!on)});},
 /* Estante: o mesmo status de novo limpa; patch em [data-shelf]; toast com desfazer. */
 'shelf-set':el=>{const id=el.dataset.id,status=el.dataset.status,p=byId(id);if(!p||!SHELF.some(x=>x.id===status))return;
  const prev=Select.shelf(p.id),prevAt=state.shelfAt[p.id],next=prev===status?null:status;
  const apply=(st,at)=>{Store.update(s=>{if(st){s.shelf[p.id]=st;s.shelfAt[p.id]=at||Date.now();}else{delete s.shelf[p.id];delete s.shelfAt[p.id];}},{silent:true});
   for(const g of document.querySelectorAll(`[data-shelf="${CSS.escape(p.id)}"]`))UI.segSet(g,st||'');};
  apply(next);const label=x=>SHELF.find(s=>s.id===x).label;
  toast(next?(prev?`Movido para ${label(next)}`:`Adicionado a ${label(next)}`):`Removido de ${label(prev)}`,{undo:()=>apply(prev,prevAt)});},
 /* Exportar meus dados (REQ §21). */
 export:()=>{try{const blob=new Blob([Store.exportJSON()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='elixir-meus-dados-'+Select.todayKey()+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Arquivo pronto');}
  catch(e){console.warn(e);toast('Não foi possível gerar o arquivo agora.');}},
 /* Apagar meus dados: confirmação, tudo some deste aparelho, volta ao começo. */
 wipe:async()=>{const ok=await Sheet.confirm({title:'Apagar seus dados?',text:'Tudo o que está salvo neste aparelho será apagado: avaliações, coleção, mapa, círculo e localização. Não dá para desfazer.',ok:'Apagar',danger:true});
  if(!ok)return;try{if(typeof Weather!=='undefined'&&Weather.forget)Weather.forget();}catch(e){}
  Store.wipe();Theme.apply();Motion.syncMotion();Router.go('welcome','1',{replace:true});toast('Seus dados foram apagados.');},
 /* "Acertou?": o mesmo valor de novo limpa; silencioso, com desfazer. */
 'intel-feedback':el=>{const p=byId(el.dataset.id);if(!p)return;const id=p.id,v=Number(el.dataset.v),src=el.dataset.src||'perfume';if(![1,-1].includes(v))return;
  const prev=state.feedback[id]?{...state.feedback[id]}:null,next=prev&&prev.v===v?null:{v,src:['perfume','guide','today','bubble','gift'].includes(src)?src:'perfume',at:Date.now()};
  if(next&&next.src==='today'&&typeof Today!=='undefined'&&Today.ctx){try{const c=Today.ctx();next.ctx={tempBand:Math.round(Number(c.temp)/5)*5,occasion:c.occasion||'',period:c.period||''};}catch(e){}}
  const apply=f=>{Store.update(s=>{if(f)s.feedback[id]=f;else delete s.feedback[id];},{silent:true});
   for(const g of document.querySelectorAll(`[data-feedback="${CSS.escape(id)}"]`))for(const b of g.querySelectorAll('[data-v]'))b.setAttribute('aria-pressed',!!f&&Number(b.dataset.v)===f.v);};
  apply(next);if(next)toast('Obrigado. Isso ajusta o seu mapa.',{undo:()=>apply(prev)});},
 demo:async()=>{const ok=await Sheet.confirm({title:'Carregar demonstração?',text:'Seus dados atuais serão substituídos pelo perfil de exemplo.',ok:'Carregar'});
  if(!ok)return;Store.demo();Theme.apply();Motion.syncMotion();Router.go('home');toast('Demonstração carregada');},
 'tray-clear':()=>{const prev=[...state.compare];Store.update(s=>{s.compare=[];});toast('Comparação limpa',{undo:()=>Store.update(s=>{s.compare=prev;})});},
 story:el=>{if(typeof Stories!=='undefined'&&Stories.open)Stories.open(el.dataset.id);},
 sotd:el=>{if(typeof Compose!=='undefined'&&Compose.sotd)Compose.sotd(el.dataset.id||undefined);else toast('O registro do dia chega em breve.');},
 rate:el=>{if(typeof Rating!=='undefined'&&Rating.open)Rating.open(el.dataset.id);else toast('A avaliação chega em breve.');},
 'compare-add':el=>{if(typeof Compare!=='undefined'&&Compare.toggle)Compare.toggle(el.dataset.id);},
 'list-add':el=>{if(typeof Lists!=='undefined'&&Lists.pick)Lists.pick(el.dataset.id);},
 share:el=>{if(typeof Compose!=='undefined'&&Compose.share)Compose.share(el.dataset.kind||'perfume',el.dataset.id||'');},
 context:()=>{if(typeof Context!=='undefined'&&Context.open)Context.open();else toast('O contexto do dia chega em breve.');},
 'rail-prev':el=>{const r=document.querySelector(`[data-rail="${CSS.escape(el.dataset.id||'')}"]`);if(r)r.scrollBy({left:-r.clientWidth*.8,behavior:Motion.reduced()?'auto':'smooth'});},
 'rail-next':el=>{const r=document.querySelector(`[data-rail="${CSS.escape(el.dataset.id||'')}"]`);if(r)r.scrollBy({left:r.clientWidth*.8,behavior:Motion.reduced()?'auto':'smooth'});}
});
Actions.change('motion-set',el=>{Store.update(s=>{s.settings.reduceMotion=el.checked?'on':'system';},{silent:true});Motion.syncMotion();});
Actions.key('/',()=>{if(typeof Search!=='undefined'&&Search.open)Search.open();});
Actions.key('mod+k',()=>{if(typeof Search!=='undefined'&&Search.open)Search.open();});
Actions.key('n',()=>{if(typeof Compose!=='undefined'&&Compose.sotd)Compose.sotd();});
