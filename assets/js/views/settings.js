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


/* ---------- Perfis de teste: quem está usando? (rota accounts, tela cheia) ---------- */
Settings.acc={draft:{name:'',photo:'',vibe:''},editing:false};
Settings.accFam=a=>{if(a.cloud)return 'Conta na nuvem'+(a.email?' · '+a.email:'');const p=Accounts.PRESETS.find(x=>x.id===a.id);if(!p)return a.preset?'':'Perfil criado neste aparelho';
 const L={amadeirado:'Amadeirado',especiado:'Especiado',couro:'Couro',aquatico:'Aquático',citrico:'Cítrico',floral:'Floral',frutado:'Frutado',verde:'Verde',aromatico:'Aromático',herbal:'Herbal',gourmand:'Gourmand',ambar:'Âmbar'};
 return p.love.slice(0,2).map(f=>L[f]||f).join(' · ');};
Settings.accAvatar=a=>{const v=a.vibe&&PROFILE_RULES.covers[a.vibe];
 let photo='';if(a.id===Accounts.active()&&state.profile.photo)photo=state.profile.photo;
 return `<span class="acc-av">${photo?`<img src="${esc(photo)}" alt="">`:v?`<img src="${esc(v.src800)}" alt="">`:`<span class="acc-ini">${esc(UI.initials(a.name))}</span>`}</span>`;};
Settings.accountsView=id=>{
 if(id==='new')return Settings.accountsNew();
 if(id==='login')return Settings.accountsLogin();
 const list=Accounts.list().sort((a,b)=>(b.lastAt||0)-(a.lastAt||0)||(a.preset===b.preset?0:a.preset?1:-1));const ed=Settings.acc.editing;
 const cards=list.map((a,i)=>`<div class="acc-card" style="--i:${Math.min(i,8)}"><button type="button" class="acc-pick pressable" data-action="account-use" data-id="${esc(a.id)}">${Settings.accAvatar(a)}
  <span class="acc-name">${esc(a.name)}</span><span class="acc-sub">${esc(Settings.accFam(a)||'@'+a.handle)}</span></button>
  ${ed&&!a.preset?`<button type="button" class="acc-del pressable" data-action="account-remove" data-id="${esc(a.id)}" aria-label="Remover ${esc(a.name)}">${icon('close','icon--20')}</button>`:''}</div>`).join('');
 const custom=list.some(a=>!a.preset);
 return `<section class="v-accounts" data-view="accounts"><div class="acc-head"><p class="t-eyebrow muted">ELIXIR · perfis de teste</p><h1 class="t-display">Quem está usando?</h1>
  <p class="muted acc-lead">Escolha um perfil para ver o app do jeito dele, ou crie o seu em um minuto.</p></div>
  <div class="acc-grid stagger">${cards}<div class="acc-card" style="--i:${Math.min(list.length,8)}"><a class="acc-pick acc-new pressable" href="#accounts/new"><span class="acc-av acc-plus">${icon('plus')}</span><span class="acc-name">Criar novo login</span><span class="acc-sub">Nome, foto e o que você gosta</span></a></div></div>
  ${Cloud.enabled()?`<div class="acc-cloud">${Cloud.active()?`<p class="t-sm muted">Conectado como <b>${esc((Cloud.session()||{}).email||'')}</b>. Seu perfil sincroniza entre aparelhos.</p>${UI.btn('Sair da conta',{variant:'secondary',size:'sm',action:'cloud-logout'})}`:`${UI.btn('Entrar com e-mail',{variant:'secondary',href:'#accounts/login',icon:'arrow-up-right'})}<p class="t-sm muted">Com conta, seu perfil acompanha você em qualquer aparelho.</p>`}</div>`:''}
  <p class="acc-note">${icon('lock','icon--20')}<span>${Cloud.enabled()?'Perfis de teste ficam só neste aparelho, sem senha. Contas com e-mail sincronizam pelo servidor do ELIXIR.':'Perfis de teste salvos só neste aparelho, sem senha. Não é uma conta: nada vai para servidor.'}</span></p>
  ${custom?`<div class="acc-tools">${UI.btn(ed?'Pronto':'Gerenciar perfis',{variant:'tertiary',action:'account-edit'})}</div>`:''}</section>`;};
Settings.accountsNew=()=>{const d=Settings.acc.draft,covers=Object.values(PROFILE_RULES.covers).filter(c=>c.id!=='jazz');
 const prev=d.photo?`<img src="${esc(d.photo)}" alt="">`:d.vibe?`<img src="${esc(PROFILE_RULES.covers[d.vibe].src800)}" alt="">`:`<span class="acc-ini">${esc(UI.initials(d.name||'?'))}</span>`;
 return `<section class="v-accounts acc-form" data-view="accounts-new">${Guide.chrome({back:'account-back',step:1,total:5})}
  <h1 class="t-display q-title" id="q-title" tabindex="-1">Como você se chama?</h1><p class="q-sub muted">Seu nome e uma foto. A foto pode ser sua ou um lugar que tenha a sua vibe.</p>
  <div class="acc-preview"><span class="acc-av acc-av--lg" id="acc-prev">${prev}</span></div>
  <label class="field"><span>Nome</span><input id="acc-name" type="text" maxlength="32" autocomplete="given-name" placeholder="Ex.: Vinicius" value="${esc(d.name)}" data-input="account-name"></label>
  <div class="acc-photo"><label class="btn btn--secondary btn--sm pressable">${icon('camera','icon--20')}<span>Usar uma foto minha</span><input type="file" accept="image/jpeg,image/png,image/webp" hidden data-change="account-photo"></label></div>
  <p class="t-eyebrow muted acc-vibe-t">Ou escolha a sua vibe</p>
  <div class="acc-vibes">${covers.map(c=>`<button type="button" class="acc-vibe pressable" aria-pressed="${d.vibe===c.id&&!d.photo}" data-action="account-vibe" data-id="${esc(c.id)}"><img src="${esc(c.src800)}" alt="" loading="lazy"><span>${esc(c.label)}</span></button>`).join('')}</div>
  <div class="q-foot">${UI.btn('Continuar',{size:'block',action:'account-create',attrs:d.name.trim().length<2?'disabled':''})}</div></section>`;};
Settings.accRefreshPrev=()=>{const d=Settings.acc.draft,el=document.getElementById('acc-prev');if(!el)return;
 el.innerHTML=d.photo?`<img src="${esc(d.photo)}" alt="">`:d.vibe?`<img src="${esc(PROFILE_RULES.covers[d.vibe].src800)}" alt="">`:`<span class="acc-ini">${esc(UI.initials(d.name||'?'))}</span>`;
 const b=document.querySelector('[data-action=account-create]');if(b)b.disabled=d.name.trim().length<2;};
Router.add('accounts',{view:id=>Settings.accountsView(id),title:id=>id==='new'?'Criar novo login':'Perfis',layout:'full',nav:'none',
 after:id=>{if(id==='new'){const i=document.getElementById('acc-name');if(i&&!Motion.touch())try{i.focus({preventScroll:true});}catch(e){}}}});
Actions.add({
 'account-use':el=>{const id=el.dataset.id;if(!Accounts.use(id))return;Settings.acc.editing=false;
  if(typeof Discovery!=='undefined')Discovery.sel=null;const a=Accounts.get(id);
  Router.go(state.onboarded?'home':'welcome',state.onboarded?'':'2',{replace:true});toast(`Olá, ${a?a.name.split(' ')[0]:''}.`);},
 'account-edit':()=>{Settings.acc.editing=!Settings.acc.editing;App.render();},
 'account-remove':el=>{const a=Accounts.get(el.dataset.id);if(!a)return;Accounts.remove(a.id);toast(`${a.name} removido deste aparelho.`);App.render();},
 'account-back':()=>Router.go('accounts','',{replace:true}),
 'account-vibe':el=>{const d=Settings.acc.draft;d.vibe=el.dataset.id;d.photo='';for(const b of document.querySelectorAll('.acc-vibe'))b.setAttribute('aria-pressed',b===el);Settings.accRefreshPrev();},
 'account-create':()=>{const d=Settings.acc.draft;const id=Accounts.create({name:d.name,photo:d.photo,vibe:d.vibe});if(!id){toast('Escreva um nome com pelo menos 2 letras.');return;}
  Settings.acc.draft={name:'',photo:'',vibe:''};if(typeof Discovery!=='undefined')Discovery.sel=null;Router.go('welcome','2',{replace:true});}
});
Actions.input('account-name',t=>{Settings.acc.draft.name=t.value;Settings.accRefreshPrev();});
Actions.change('account-photo',async el=>{const f=el.files&&el.files[0];if(!f)return;
 try{const url=await readImage(f,{max:360,square:true,quality:.8});if(url.length>200*1024*1.37){toast('Foto grande demais. Tente outra.');return;}
  Settings.acc.draft.photo=url;Settings.acc.draft.vibe='';for(const b of document.querySelectorAll('.acc-vibe'))b.setAttribute('aria-pressed','false');Settings.accRefreshPrev();}
 catch(e){toast(e.message||'Não foi possível ler a foto.');}});

Settings.cloudMode='login';
Settings.accountsLogin=()=>{const reg=Settings.cloudMode==='register';
 return `<section class="v-accounts acc-form" data-view="accounts-login">${Guide.chrome({back:'account-back'})}
  <h1 class="t-display q-title" id="q-title" tabindex="-1">${reg?'Criar conta':'Entrar'}</h1><p class="q-sub muted">${reg?'Seu perfil fica salvo no servidor do ELIXIR e acompanha você em qualquer aparelho.':'Use o e-mail e a senha da sua conta ELIXIR.'}</p>
  ${UI.seg([{id:'login',label:'Entrar'},{id:'register',label:'Criar conta'}],Settings.cloudMode,'cloud-mode',{variant:'quiet',name:'cloud-mode',label:'Entrar ou criar conta',block:true})}
  <form class="acc-login" data-submit="cloud-auth">
   ${reg?`<label class="field"><span>Nome</span><input name="name" type="text" maxlength="32" autocomplete="name" required></label>`:''}
   <label class="field"><span>E-mail</span><input name="email" type="email" maxlength="254" autocomplete="email" inputmode="email" required></label>
   <label class="field"><span>Senha</span><input name="password" type="password" minlength="8" autocomplete="${reg?'new-password':'current-password'}" required></label>
   <p class="acc-err t-sm" role="alert" hidden></p>
   <div class="q-foot">${UI.btn(reg?'Criar conta':'Entrar',{size:'block',attrs:'type="submit"'}).replace('type="button" ','')}</div>
  </form></section>`;};
Actions.add({
 'cloud-mode':el=>{Settings.cloudMode=el.dataset.id;App.render();},
 'cloud-logout':async()=>{await Cloud.logout();Accounts.use('gabriel');toast('Você saiu da conta. Os dados continuam salvos no servidor.');Router.go('accounts','',{replace:true});App.render();}
});
Actions.submit&&Actions.submit('cloud-auth',async form=>{const f=new FormData(form),errEl=form.querySelector('.acc-err'),btn=form.querySelector('[type=submit]');
 if(errEl){errEl.hidden=true;errEl.textContent='';}if(btn)btn.disabled=true;
 try{const u=await Cloud.auth(Settings.cloudMode,{email:String(f.get('email')||''),password:String(f.get('password')||''),name:String(f.get('name')||'')});
  toast(`Olá, ${u.name.split(' ')[0]}. Seu perfil agora sincroniza.`);Router.go(state.onboarded?'home':'welcome',state.onboarded?'':'2',{replace:true});}
 catch(e){if(errEl){errEl.textContent=e.message;errEl.hidden=false;}}finally{if(btn)btn.disabled=false;}});
