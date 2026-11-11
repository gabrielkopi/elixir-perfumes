'use strict';
/* Ajustes (folha .sh-settings): Aparência, Clima e localização, Privacidade e dados, Demonstração. */
const Settings={
 radios(name,items,value,label){const i=items.findIndex(x=>x.id===value);
  return `<div class="seg seg--quiet seg--block" role="radiogroup" aria-label="${esc(label)}" data-radios="${esc(name)}" style="--n:${items.length};--i:${Math.max(0,i)}">${items.map((x,k)=>`<button type="button" role="radio" aria-checked="${x.id===value}" tabindex="${x.id===value?0:-1}" data-action="${esc(name)}" data-id="${esc(x.id)}">${esc(x.label)}</button>`).join('')}</div>`;},
 locationLine(){const L=state.location;let st='';try{st=typeof Weather!=='undefined'&&Weather.status?Weather.status():'';}catch(e){}
  if(L.mode==='city')return {icon:'pin',text:`${L.name||'Cidade'} · cidade escolhida`};
  if(L.mode==='geo')return {icon:'pin',text:'Sua localização · aproximada, cerca de 1 km'};
  return {icon:'cloud',text:st==='denied'?'Sem acesso à localização. Escolha uma cidade.':'Desligado: usamos o clima que você informar'};},
 home(){const s=state.settings,pv=s.privacy,loc=this.locationLine();
  const appearance=`<section class="set-group" aria-labelledby="set-ap"><h3 class="t-eyebrow muted" id="set-ap">Aparência</h3>
   <div class="set-row"><span class="set-label" id="set-theme">Tema</span>${this.radios('theme-set',[{id:'system',label:'Sistema'},{id:'light',label:'Claro'},{id:'dark',label:'Escuro'}],s.theme,'Tema')}</div>
   ${UI.toggle({name:'reduceMotion',label:'Reduzir movimento',on:s.reduceMotion==='on',sub:'Segue o sistema quando desligado',attrs:'data-change="motion-set"'})}</section>`;
  const weather=`<section class="set-group" aria-labelledby="set-wx"><h3 class="t-eyebrow muted" id="set-wx">Clima e localização</h3>
   <div class="set-status"><span class="ico">${icon(loc.icon,'icon--20')}</span><span>${esc(loc.text)}</span></div>
   <div class="list-hair">${UI.linkRow({icon:'search',title:'Escolher cidade',sub:'Para escolher o perfume pelo tempo de agora.',href:'#',attrs:'data-action="settings-city"'})}</div>
   ${state.location.mode!=='none'?`<div class="set-actions">${UI.btn('Parar de usar a localização',{action:'settings-forget',variant:'tertiary'})}</div>`:''}</section>`;
  const privacy=`<section class="set-group" id="settings-privacy" aria-labelledby="set-pv"><h3 class="t-eyebrow muted" id="set-pv">Privacidade e dados</h3>
   <div class="set-row"><span class="set-label">Visibilidade do perfil</span>${this.radios('settings-visibility',[{id:'public',label:'Público'},{id:'circle',label:'Só meu círculo'},{id:'private',label:'Privado'}],pv.profile,'Visibilidade do perfil')}
    <p>Neste protótipo, tudo fica neste aparelho; a escolha controla o que o seu link e o Connect mostram.</p></div>
   ${UI.toggle({name:'shareMap',label:'Compartilhar meu mapa olfativo',on:pv.shareMap,sub:'Aparece no link do perfil e pode ir para o Connect.',attrs:'data-change="settings-share"'})}
   ${UI.toggle({name:'shareCollection',label:'Mostrar minha coleção',on:pv.shareCollection,sub:'Tenho e Quero no link do perfil e no Connect.',attrs:'data-change="settings-share"'})}
   <div class="list-hair">${UI.linkRow({icon:'info',title:'Como o algoritmo usa seus dados',sub:'Em poucas palavras, sem letras miúdas.',href:'#',attrs:'data-action="settings-algorithm"'})}</div>
   <div class="set-row"><div class="set-actions">${UI.btn('Exportar meus dados',{action:'export',variant:'secondary',icon:'download'})}</div><p>Baixa um arquivo JSON com tudo o que está salvo.</p></div>
   <div class="set-row"><div class="set-actions">${UI.btn('Apagar meus dados',{action:'wipe',variant:'danger',icon:'trash'})}</div><p>Apaga avaliações, coleção, mapa, círculo e localização deste aparelho.</p></div></section>`;
  const demo=`<section class="set-group" aria-labelledby="set-dm"><h3 class="t-eyebrow muted" id="set-dm">Demonstração</h3>
   <div class="set-row"><div class="set-actions">${UI.btn('Carregar demonstração',{action:'demo',variant:'secondary'})}</div><p>Substitui seus dados por um perfil de exemplo, para conhecer todas as telas.</p></div></section>`;
  const foot=`<footer class="set-foot"><p>Catálogo base: Scento, CC BY 4.0. Imagens de produtos: páginas das marcas indicadas em cada perfume. Ilustrações de notas geradas para o ELIXIR.</p>
   <p>Dados do tempo: Open-Meteo.com (CC BY 4.0).</p><p>Código QR: qrcode-generator, Kazuhiko Arase, licença MIT.</p><p>${esc(BRAND.name)} · protótipo. Nada é enviado a um servidor do ELIXIR.</p></footer>`;
  return appearance+weather+privacy+demo+foot;},
 algorithm(){const P=(t,b)=>`<section><h3>${t}</h3><p>${b}</p></section>`;
  return `<div class="algo">${[
   P('O que usamos','Suas avaliações, o que está em Tenho, Quero e Testei, seus "Esse sou eu", as respostas "Acertou?" e as escolhas no Fora da Bolha, e as correções que você faz no mapa.'),
   P('Comprovado e hipótese','Uma preferência só vira "comprovada" com pelo menos 3 perfumes que apontam na mesma direção. Antes disso é hipótese, e mostramos assim.'),
   P('Parecido com e chance de gostar','A primeira compara a composição. A segunda estima se você vai gostar, sempre com o nível de confiança.'),
   P('Contexto','O clima real só é buscado se você permitir a localização ou escolher uma cidade. A posição é arredondada (cerca de 1 km) e enviada apenas ao Open-Meteo para saber o tempo. A roupa do dia só ajusta frescor e presença; nunca é regra de estilo ou de gênero.'),
   P('Pessoas','Compatibilidade é por família e por característica, nunca uma nota única. Pessoas com poucos perfumes em comum não contam muito.'),
   P('Sem patrocínio','Nenhuma marca paga por posição ou compatibilidade. Links de compra são buscas orgânicas.'),
   P('Onde ficam os dados','Só neste aparelho. Você pode exportar ou apagar tudo em Privacidade e dados.')].join('')}</div>`;},
 open({section=''}={}){
  if(section==='algorithm'){this.openAlgorithm();return;}
  Sheet.open({title:'Ajustes',body:this.home(),cls:'sh-settings'});
  if(section==='privacy')requestAnimationFrame(()=>{const el=document.getElementById('settings-privacy');if(el)el.scrollIntoView({block:'start',behavior:Motion.reduced()?'auto':'smooth'});});},
 openAlgorithm(){const head=UI.sheetHead('Como o algoritmo usa seus dados',{left:UI.iconBtn('chevron-left',{action:'settings-home',label:'Voltar para Ajustes'})});
  Sheet.open({title:'Como o algoritmo usa seus dados',head,body:this.algorithm(),cls:'sh-settings'});},
 refresh(){if(Sheet.isOpen()&&document.querySelector('#sheet .sh-settings')&&!document.querySelector('#sheet .algo'))Sheet.update(this.home());}
};
Actions.add({
 'settings-home':()=>Settings.open(),
 'settings-algorithm':()=>Settings.openAlgorithm(),
 'settings-city':()=>{if(typeof Context!=='undefined'&&Context.city)Context.city();else toast('A escolha de cidade chega em breve.');},
 'settings-forget':()=>{try{if(typeof Weather!=='undefined'&&Weather.forget)Weather.forget();else Store.update(s=>{s.location={mode:'none',name:'',lat:null,lon:null,consentAt:0};},{silent:true});}catch(e){console.warn(e);}
  toast('Localização removida');Settings.refresh();},
 'settings-visibility':el=>{const v=el.dataset.id;Store.update(s=>{s.settings.privacy.profile=v;},{silent:true});UI.segSet(el.closest('.seg'),v);
  toast(v==='public'?'Perfil público':v==='circle'?'Visível para o seu círculo':'Perfil privado');}
});
Actions.change('settings-share',el=>{const k=el.name;if(!['shareMap','shareCollection'].includes(k))return;const on=el.checked;Store.update(s=>{s.settings.privacy[k]=on;},{silent:true});});
