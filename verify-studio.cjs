const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'elixir.html'), 'utf8');
const errors = [];
const console = new VirtualConsole();
console.on('jsdomError', e => errors.push(e.message));
const dom = new JSDOM(html, { url: 'https://elixir.test/elixir.html#lab', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: console });
const win = dom.window, ctx = dom.getInternalVMContext();
Object.defineProperty(win, 'crypto', { value: require('node:crypto').webcrypto });
win.scrollTo = () => {};
win.matchMedia = media => ({ media, matches: true, addEventListener() {}, removeEventListener() {} });
win.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
win.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
win.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new win.Event('close')); };
const run = source => vm.runInContext(source, ctx);
for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) {
  const file = src.split('?')[0];
  run(fs.readFileSync(path.join(root, file), 'utf8'));
}
const S = win.ElixirStudio, doc = win.document;
const query = selector => { const el = doc.querySelector(selector); assert(el, 'Missing element: ' + selector); return el; };
const wait = () => new Promise(resolve => setTimeout(resolve, 12));
const click = async selector => { query(selector).click(); await wait(); };
const submit = async id => { query('#' + id).dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true })); await wait(); };
const state = () => run('state');
const page = name => { run(`route={page:${JSON.stringify(name)}};render();`); };
const results = [];
async function check(name, test) { await test(); results.push(name); }

(async () => {
  await wait();
  await check('Fresh installation: expanded notes, 24 people and no invented personal taste', async () => {
    assert(run('INGREDIENTS.length') >= 44); assert.equal(run('Social.people.length'), 24);
    assert.equal(Object.keys(state().ratings).length, 0); assert.equal(state().favorites.length, 0);
    assert(doc.body.textContent.includes('Mais jeitos de'));
    assert(doc.querySelector('.floating-dock [data-page=lab]'));
    assert(doc.querySelector('.studio-shortcuts a[href="#circle"]'));
  });
  await check('Shelf statuses and taste remain independent; private note survives toggles', async () => {
    S.quickShelf('arbo'); query('#studio-shelf-form [name=note]').value = '<img src=x onerror=alert(1)> A private memory';
    await click('[data-lab="shelf-status"][data-value="own"]');
    assert(state().lists['Minha coleção'].includes('arbo')); assert.equal(Object.keys(state().ratings).length, 0);
    await click('[data-lab="taste"][data-value="2"]');
    assert(state().lists['Minha coleção'].includes('arbo')); assert.equal(state().ratings.arbo, 2);
    assert(!state().lists['Já experimentei'].includes('arbo')); assert(!state().favorites.includes('arbo'));
    query('#studio-shelf-form [name=remaining]').value = '33'; await submit('studio-shelf-form');
    assert.equal(state().lab.shelf.arbo.remaining, 33); assert(state().lab.shelf.arbo.note.includes('private memory'));
    assert.equal(doc.querySelectorAll('img[onerror]').length, 0);
  });
  await check('Shelf creation and real multi-selection add multiple fragrances', async () => {
    S.listDialog(); query('#studio-list-form [name=name]').value = 'Memórias de verão'; await submit('studio-list-form');
    assert(Array.isArray(state().lists['Memórias de verão']));
    S.pick('Add test', [], chosen => { S.ui.selected = new Set(chosen); S.bulk(chosen); });
    await click('[data-studio-picker=arbo]'); await click('[data-studio-picker=coolwater]'); await click('[data-lab=picker-done]');
    query('#studio-bulk [name=list]').value = 'Memórias de verão'; await submit('studio-bulk');
    assert.equal(state().lists['Memórias de verão'].length, 2);
  });
  await check('Custom people can be created and followed; text remains escaped', async () => {
    S.personForm(); query('#studio-person-form [name=name]').value = 'Pessoa <script>teste</script>';
    query('#studio-person-form [name=bio]').value = 'Uma pessoa fictícia'; S.ui.personDraft.favorites = ['arbo', 'coolwater'];
    await submit('studio-person-form'); S.syncPeople();
    assert.equal(state().lab.people.length, 1); const person = state().lab.people[0];
    assert.equal(run('Social.people.length'), 25); page('people');
    await click(`[data-action=follow][data-id="${person.id}"]`);
    assert(state().following.includes(person.id)); assert.equal(doc.querySelectorAll('script').length, html.match(/<script/g).length);
  });
  await check('Private circle CRUD and gift ideas are separate from public people', async () => {
    S.circleForm(); query('#studio-circle-form [name=name]').value = 'Pessoa privada';
    query('#studio-circle-form [name=note]').value = 'DO NOT SHARE CIRCLE SECRET';
    S.ui.circleDraft.favorites = ['arbo']; await submit('studio-circle-form');
    assert.equal(state().lab.circle.length, 1); assert(!run('Social.people').some(p => p.name === 'Pessoa privada'));
    const contact = state().lab.circle[0]; S.gift(contact.id); const gift = query('[data-lab=gift-save]'); gift.click(); await wait();
    assert.equal(state().lab.circle[0].gifts.length, 1);
  });
  await check('Diary use marks tried, without changing ownership or score', async () => {
    const previous = state().ratings.coolwater; S.diaryForm('coolwater'); query('#studio-diary-form [name=note]').value = 'A memory'; await submit('studio-diary-form');
    assert.equal(state().lab.diary.length, 1); assert(state().lists['Já experimentei'].includes('coolwater'));
    assert(!state().lists['Minha coleção'].includes('coolwater')); assert.equal(state().ratings.coolwater, previous);
  });
  await check('Connect requires explicit consent, respects scope, filters stores, expires and revokes', async () => {
    state().preferences.likedNotes = ['Bergamota']; page('connect'); assert.equal(S.shared(), null);
    await click('[data-lab=connect-start]'); assert.equal(S.shared(), null);
    await click('[data-lab=connect-role][data-value=atendente]'); assert(doc.body.textContent.includes('Aguardando autorização')); assert(!doc.body.textContent.includes('DO NOT SHARE CIRCLE SECRET'));
    await click('[data-lab=connect-role][data-value=cliente]');
    query('#studio-consent [name=store]').value = 'Natura'; query('#studio-consent [name=consent]').checked = true; await submit('studio-consent');
    const shared = S.shared(); assert.deepEqual(Object.keys(shared), ['likedNotes']); assert.equal(shared.likedNotes[0], 'Bergamota');
    assert(!JSON.stringify(shared).includes('Pessoa privada')); assert(!JSON.stringify(shared).includes('CIRCLE SECRET'));
    assert([...doc.querySelectorAll('.studio-store-card>small:first-of-type')].every(el => el.textContent === 'Natura'));
    assert.equal(S.shared(state().lab.connect, state().lab.connect.expires + 1), null);
    await click('[data-lab=connect-revoke]'); assert.equal(S.shared(), null); assert(doc.body.textContent.includes('Compartilhamento encerrado.'));
  });
  await check('Negative discovery feedback updates taste and excludes the rejected fragrance', async () => {
    page('discovery'); const button = query('[data-lab=feedback][data-value=dislike]'), id = button.dataset.id;
    button.click(); await wait(); assert.equal(state().ratings[id], 2); assert(state().lab.feedback.some(f => f.perfume === id && f.value === 'dislike'));
    assert(!doc.querySelector(`.studio-suggestion [data-lab=feedback][data-id="${id}"]`));
  });
  await check('Scenarios require opt-in, save backup and restore the full prior state', async () => {
    const before = S.snapshot(); S.scenarioDialog('fresh'); assert.equal(state().lab.circle.length, before.lab.circle.length);
    await click('[data-lab=scenario-apply]'); assert.equal(state().name, 'Seu perfil de teste'); assert.equal(state().lab.circle.length, 3); assert.equal(state().lab.diary.length, 3);
    page('lab'); await click('[data-lab=restore]'); await click('[data-lab=restore-confirm]');
    assert.equal(state().name, before.name); assert.equal(state().lab.circle[0].name, 'Pessoa privada'); assert.equal(state().lab.people.length, 1);
  });
  await check('Import rejects unsafe list keys, invalid perfumes and imported authorization', async () => {
    const raw = JSON.parse('{"product":"ELIXIR","version":3,"state":{"name":"Teste","ratings":{"arbo":99,"unknown":9},"lists":{"__proto__":["arbo"],"Favoritos":["unknown"],"Verão":["arbo"]},"lab":{"connect":{"status":"active","scopes":["liked"],"expires":9999999999999}}}}');
    const imported = S.validateImport(raw); assert.equal(Object.keys(imported.ratings).length, 0); assert(!Object.hasOwn(imported.lists, '__proto__')); assert.equal(imported.lists['Verão'][0], 'arbo'); assert.equal(imported.lab.connect, null);
    assert.throws(() => S.validateImport({ product: 'Other' }));
  });
  await check('Import round trip preserves custom people, following, shelf and circle', async () => {
    const before = S.snapshot(), imported = S.validateImport({ product: 'ELIXIR', version: 3, state: before });
    assert.equal(imported.lab.people[0].id, before.lab.people[0].id);
    assert(imported.following.includes(before.lab.people[0].id));
    assert.equal(imported.lab.circle[0].note, before.lab.circle[0].note);
    assert.equal(imported.lab.shelf.arbo.note, before.lab.shelf.arbo.note);
  });
  await check('Want-to-try is independent of liking; current shortcut follows the page', async () => {
    page('discovery'); const id = doc.querySelector('[data-lab=feedback][data-value=like]').dataset.id;
    S.feedback(id, 'like'); const rating = state().ratings[id]; S.feedback(id, 'want');
    assert.equal(state().ratings[id], rating); assert(S.flags(id).want); assert(!S.flags(id).own);
    S.feedback(id, 'want'); assert.equal(state().ratings[id], rating); assert(!S.flags(id).want);
    page('circle'); assert(doc.querySelector('.studio-shortcuts a[href="#circle"][aria-current=page]'));
  });
  await check('All added views render without runtime errors', async () => {
    for (const route of ['lab', 'collection', 'people', 'circle', 'discovery', 'today', 'diary', 'connect', 'ingredients']) { page(route); assert(doc.querySelector('main')); }
    run("route={page:'ingredient',id:'iris'};render();"); assert(doc.body.textContent.includes('Como essa nota conversa com você?'));
    await click('[data-lab=ingredient-like][data-value=like]'); assert(state().preferences.likedNotes.includes('Íris'));
    await click('[data-lab=ingredient-like][data-value=avoid]'); assert(!state().preferences.likedNotes.includes('Íris')); assert(state().preferences.dislikedNotes.includes('Íris'));
    assert.equal(errors.length, 0, errors.join('\n'));
  });
  await check('Expanded catalogue has unique products, real note references and local image files', async () => {
    const perfumes=run('PERFUMES');assert.equal(perfumes.length,280);assert.equal(new Set(perfumes.map(p=>p.id)).size,280);
    const expanded=run('CATALOG_EXPANDED.products');assert.equal(expanded.length,179);
    assert.equal(expanded.filter(p=>p.brand==='WePink').length,106);
    for(const p of expanded){assert.match(p.source,/^https:\/\//);assert(Object.values(p.notes).some(a=>a.length),p.id);if(p.image)assert(fs.existsSync(path.join(root,p.image)),p.image);}
    const v=perfumes.find(p=>p.id==='sospiro-vibrato');assert.equal(v.notes.top.join('|'),'Toranja|Bergamota|Mandarina|Gengibre|Alecrim');assert.equal(v.notes.base.length,6);
    const lovely=expanded.find(p=>p.name==='Obsessed Lovely');assert(lovely.notes.top.includes('Figo Leitoso'));assert.equal(lovely.family,'Frutado Floral');
  });
  await check('Brand, note search, sorting and pagination work across the expanded catalogue', async () => {
    page('explore');await click('[data-scent=brand][data-value=WePink]');assert.equal(run('Minimal.catalogItems().length'),106);assert.equal(doc.querySelectorAll('#catalog-grid .product-card').length,24);
    await click('[data-scent=more]');assert.equal(doc.querySelectorAll('#catalog-grid .product-card').length,48);
    const input=query('#catalog-search');input.value='Obsessed Lovely';input.dispatchEvent(new win.Event('input',{bubbles:true}));assert.equal(doc.querySelectorAll('#catalog-grid .product-card').length,1);assert(doc.querySelector('.scent-results').textContent.startsWith('1 '));
    await click('[data-scent=clear]');assert.equal(run('Minimal.catalogItems().length'),280);run("query='paco rabanne';");assert.equal(run('Minimal.catalogItems().length'),22);run("query='';");
  });
  await check('Perfume details switch layers and graphs without changing the route', async () => {
    run("route={page:'perfume',id:'sospiro-vibrato'};render();");assert.equal(doc.querySelectorAll('.scent-note-tier').length,3);assert(query('.scent-family').textContent.includes('Não declarada'));
    await click('[data-scent=stage][data-value=base]');assert.equal(doc.querySelectorAll('.scent-note-tier').length,1);assert(query('#scent-note-content').textContent.includes('Fava tonka'));assert(!query('#scent-note-content').textContent.includes('Toranja'));
    await click('[data-scent=chart][data-value=radar]');assert(query('.scent-radar').getAttribute('aria-label').includes('editorial'));assert.equal(run('route.id'),'sospiro-vibrato');assert(doc.body.textContent.includes('Não representa porcentagem'));
  });
  await check('Personal perceptions persist independently of the reference, rating and ownership', async () => {
    const rating=state().ratings['sospiro-vibrato'],oldNotes=JSON.stringify(run("byId('sospiro-vibrato').notes"));
    query('#scent-perception [name="0"]').value='5';query('#scent-perception [name="7"]').value='0';await submit('scent-perception');
    assert.equal(state().lab.perceptions['sospiro-vibrato'][0],5);assert.equal(state().lab.perceptions['sospiro-vibrato'][7],0);assert.equal(state().lab.perceptions['sospiro-vibrato'][3],undefined);assert(query('.scent-personal-bars').textContent.includes('sua percepção'));
    run('render();');assert.equal(query('#scent-perception [name="0"]').value,'5');assert.equal(state().ratings['sospiro-vibrato'],rating);assert.equal(JSON.stringify(run("byId('sospiro-vibrato').notes")),oldNotes);
    const imported=S.validateImport({product:'ELIXIR',version:3,state:S.snapshot()});assert.equal(imported.lab.perceptions['sospiro-vibrato'][7],0);
  });
  await check('Every perfume detail renders in reduced motion without runtime errors', async () => {
    for(const p of run('PERFUMES')){run(`route={page:'perfume',id:${JSON.stringify(p.id)}};render();`);assert(query('.scent-hero-copy h1').textContent.length);}
    assert.equal(errors.length,0,errors.join('\n'));
  });
  await check('Alchemy matches declared notes, supports exclusions and any/all modes',async()=>{ const V=win.ElixirAtelier;V.selected=new Set(['Gengibre','Alecrim']);V.mode='all';assert(V.results().some(p=>p.id==='sospiro-vibrato'));V.excluded.add('Bergamota');assert(!V.results().some(p=>p.id==='sospiro-vibrato'));V.excluded.clear();V.mode='any';assert(V.results().length>=1);run("route={page:'alchemy'};render();");assert(query('#v5-note-picker'));V.selected.clear();});
  await check('Notes open referenced perfumes and add choices to alchemy',async()=>{run("route={page:'perfume',id:'sospiro-vibrato'};render();");assert(doc.querySelector('[data-v5=note]'));win.ElixirAtelier.note('Gengibre');assert(query('.v5-note-perfumes').textContent.includes('Vibrato'));await click('[data-v5=note-to-mix]');assert(win.ElixirAtelier.selected.has('Gengibre'));});
  await check('Theme toggles and fictitious posts remain navigable',async()=>{win.ElixirAtelier.theme='system';page('home');await click('[data-v5=theme]');assert.equal(doc.documentElement.dataset.theme,'dark');assert.equal(win.localStorage.getItem('elixir-theme-v5'),'dark');assert.equal(run("Social.posts.filter(p=>p.id.startsWith('v5-post-')).length"),24);assert(query('.community-post'));assert.equal(errors.length,0,errors.join('\n'));});
  await check('Alchemy exposes all matches through pagination, including exclusions alone',async()=>{
    const V=win.ElixirAtelier;V.selected.clear();V.excluded=new Set(['Tabaco']);V.resultLimit=24;page('alchemy');assert(query('.v5-result-count'));assert.equal(doc.querySelectorAll('#v5-mix-results .product-card').length,24);await click('[data-v5=more-results]');assert.equal(doc.querySelectorAll('#v5-mix-results .product-card').length,48);
    while(doc.querySelector('[data-v5=more-results]'))await click('[data-v5=more-results]');assert.equal(doc.querySelectorAll('#v5-mix-results .product-card').length,V.results().length);
  });
  await check('Choosing an excluded note removes the contradictory exclusion',async()=>{
    const V=win.ElixirAtelier;V.selected.clear();V.excluded=new Set(['Alecrim']);V.search='Alecrim';page('alchemy');await click('[data-v5=mix][data-note=Alecrim]');assert(V.selected.has('Alecrim'));assert(!V.excluded.has('Alecrim'));assert(V.results().some(p=>p.id==='sospiro-vibrato'));
    V.excluded.add('Bergamota');V.note('Bergamota');await click('[data-v5=note-to-mix]');assert(!V.excluded.has('Bergamota'));V.search='';
  });
  await check('Note modal can reveal every referenced perfume, not just the initial 24',async()=>{
    const V=win.ElixirAtelier;V.note('Bergamota');assert.equal(doc.querySelectorAll('.v5-note-perfumes>button').length,24);await click('[data-v5=more-note-results]');assert.equal(doc.querySelectorAll('.v5-note-perfumes>button').length,48);while(doc.querySelector('[data-v5=more-note-results]'))await click('[data-v5=more-note-results]');const expected=run("PERFUMES.filter(p=>p.noteWeights.some(n=>ElixirAtelier.key(n.name).startsWith('bergamota'))).length");assert.equal(doc.querySelectorAll('.v5-note-perfumes>button').length,expected);run('closeModal();');
  });
  await check('Every available product has both detail and thumbnail cutouts; ingredient images exist',async()=>{
    const cutouts=JSON.parse(fs.readFileSync(path.join(root,'assets/cutouts.json'),'utf8'));assert.equal(Object.keys(cutouts).length,267);for(const file of Object.values(cutouts)){assert(fs.existsSync(path.join(root,file)),file);assert(fs.existsSync(path.join(root,file.replace('/cutouts/','/cutouts-small/'))),file);}
    for(const n of run('INGREDIENTS'))assert(fs.existsSync(path.join(root,n.image)),n.image);
  });
  await check('Every local route renders with one toolbar and labelled form controls',async()=>{
    for(const name of ['home','explore','collection','people','circle','discovery','today','diary','connect','alchemy','ingredients','profile']){page(name);assert.equal(doc.querySelectorAll('.v5-action-bar[aria-label]').length,1,name);assert(doc.querySelector('#main'));}
    assert.equal(errors.length,0,errors.join('\n'));
  });
  await check('Fresh discovery blocks continuation until three experiences, then saves taste independently of ownership',async()=>{
    run('state=defaults();Minimal.begin();');await click('[data-action=discovery-style][data-id=citrus]');await click('[data-action=discovery-next]');await click('[data-action=discovery-note][data-value=Bergamota]');await click('[data-action=discovery-next]');assert(query('[data-action=discovery-next]').disabled);
    for(const [id,rating] of [['vetiver',10],['polo',8],['arbo',2]]){await click('[data-action=discovery-perfume][data-id='+id+']');await click('[data-action=discovery-rating][data-value="'+rating+'"]');}
    assert(!query('[data-action=discovery-next]').disabled);await click('[data-action=discovery-next]');await click('[data-action=discovery-intensity][data-value=Discreta]');await click('[data-action=discovery-next]');await click('[data-action=discovery-done]');assert.equal(state().preferences.intensity,'Discreta');assert(state().preferences.likedNotes.includes('Bergamota'));assert.equal(state().ratings.arbo,2);assert(state().lists['Não compraria novamente'].includes('arbo'));assert.equal(state().lists['Minha coleção'].length,0);assert.equal(errors.length,0,errors.join('\n'));
  });
  await check('WePink fig fragrance is found by brand/note words in either order',async()=>{
    for(const text of ['fig da wepink','wepink figo','santal fig','figo wepink']){run('query='+JSON.stringify(text)+';ElixirCatalog.brand="Todas";filter="Todos";');assert(run('Minimal.catalogItems().some(x=>x.p.id==="wepink-2000052400")'),text);}
    run('query="";');
  });
  await check('Figo also finds the declared Figo Cremoso and Figo Leitoso variants',async()=>{
    const V=win.ElixirAtelier;V.selected=new Set(['Figo']);V.excluded.clear();assert(V.results().some(p=>p.id==='wepink-2000052400'));assert(V.results().some(p=>p.id==='wepink-2000052176'));V.note('Figo');assert(query('.v5-note-perfumes').textContent.includes('Heaven Santal & Fig'));run('closeModal();');
  });
  await check('Specific note artwork wins over generic prefixes and unrelated botanical names',async()=>{
    const V=win.ElixirAtelier;
    assert.equal(V.image('Absoluto de Jasmim Sambac'),'assets/notes-hd/v7-absoluto-de-jasmim-sambac.webp');
    assert.equal(V.image('Acorde âmbar amadeirado'),'assets/notes-hd/v7-acorde-ambar-amadeirado.webp');
    assert.equal(V.image('Jasmim-manga'),'assets/notes-hd/v7-flor-de-plumeria.webp');assert.equal(V.image('Âmbar cinzento'),'assets/notes-hd/v7-ambergris.webp');
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/notes-hd/manifest.json'),'utf8'));
    for(const [name,file] of Object.entries(manifest)){assert.equal(V.image(name),file,name);assert(fs.existsSync(path.join(root,file)),file);}
  });
  await check('Every declared catalogue note has a real local image in its clickable illustration',async()=>{
    const V=win.ElixirAtelier;
    assert.equal(V.image('Flor de Maçã'),'assets/notes-hd/v7-apple-blossom.webp');assert.equal(V.image('Folhas de Violeta'),'assets/notes-hd/v7-folha-de-violeta.webp');
    const names=[...new Set(run('PERFUMES').flatMap(p=>p.noteWeights.map(n=>n.name)))];
    for(const name of names){const file=V.image(name);assert(file,'Missing note image: '+name);assert(fs.existsSync(path.join(root,file)),name);assert(win.ElixirCatalog.noteIcon(name).includes('<img'),name);}
    assert.equal(V.names.filter(name=>!V.image(name)).length,0);
    for(const name of V.names){V.note(name);assert(doc.querySelector('.v5-note-perfumes>button'),'No referenced perfumes for '+name);assert.equal(query('.v5-note-detail>.scent-note-art img').getAttribute('src'),V.image(name),name);}
    run('closeModal();');
    V.search='';page('alchemy');V.limit=1000;query('#v5-note-picker').innerHTML=V.picker();assert.equal(doc.querySelectorAll('#v5-note-picker .scent-note-art img').length,V.names.length);
  });
  await check('Responsive note illustrations keep real dimensions and all variant paths available',async()=>{
    const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/notes-hd/manifest.json'),'utf8'));
    const responsive=JSON.parse(fs.readFileSync(path.join(root,'assets/notes-hd/responsive.json'),'utf8'));
    for(const file of Object.values(manifest)){
      const variants=responsive[file];assert(variants,file);assert.equal(variants.length,3);assert(variants[0].width<variants[1].width&&variants[1].width<variants[2].width,file);
      for(const variant of variants)assert(fs.existsSync(path.join(root,variant.src)),variant.src);
    }
    assert(win.ElixirCatalog.noteIcon('Gengibre').includes('srcset='));
    assert(run('IngredientLibrary.cards()').includes('srcset='));
    assert(run("IngredientLibrary.detail('hd-gengibre')").includes('srcset='));
  });
  await check('Note picker offers more only while hidden matching notes remain',async()=>{
    const V=win.ElixirAtelier;V.search='';V.limit=48;page('alchemy');
    const search=query('#v5-note-search');search.value='Gengibre';search.dispatchEvent(new win.Event('input',{bubbles:true}));assert(query('[data-v5=more-notes]').hidden);assert.equal(doc.querySelectorAll('#v5-note-picker>button').length,1);
    search.value='';search.dispatchEvent(new win.Event('input',{bubbles:true}));assert(!query('[data-v5=more-notes]').hidden);
    while(!query('[data-v5=more-notes]').hidden)await click('[data-v5=more-notes]');
    assert.equal(doc.querySelectorAll('#v5-note-picker>button').length,V.names.length);assert.equal(errors.length,0,errors.join('\n'));
  });
  await check('Notes library starts with search and exposes families in a native disclosure',async()=>{
    run("IngredientLibrary.query='';IngredientLibrary.family='Todas';");page('ingredients');
    const html=query('#main').innerHTML;assert(html.indexOf('id="ingredient-search"')<html.indexOf('class="family-explorer"'));assert(!query('.family-explorer').open);assert.equal(doc.querySelectorAll('.family-explorer a[href^="#family/"]').length,7);
  });
  await check('Empty note searches explain the state and clear only search or filters',async()=>{
    const V=win.ElixirAtelier;V.search='not-a-real-note-qa';V.selected=new Set(['Gengibre']);page('alchemy');assert(query('.v5-note-empty'));assert(query('#v5-note-count').textContent.includes('0 notas'));await click('[data-v5=reset-search]');assert.equal(V.search,'');assert(V.selected.has('Gengibre'));assert.equal(doc.activeElement.id,'v5-note-search');
    run("IngredientLibrary.query='not-a-real-note-qa';IngredientLibrary.family='1';");page('ingredients');await click('[data-ingredient-clear]');assert.equal(run('IngredientLibrary.query'),'');assert.equal(run('IngredientLibrary.family'),'Todas');assert.equal(doc.activeElement.id,'ingredient-search');
  });
  await check('Notes radar uses actual asset paths and communicates its selected mode',async()=>{
    const html=run("Families.radar({ratings:{'sospiro-vibrato':9}},true)");const images=[...html.matchAll(/<image href="([^"]+)"/g)].map(m=>m[1]);assert(images.length>=3);assert(html.includes('data-v5="note"'));for(const file of images)assert(fs.existsSync(path.join(root,file)),file);assert(images.some(file=>file.includes('notes-hd/')));assert(!html.includes('/hd-gengibre.png'));
    run("Families.mode='notes';");assert(run("Families.profileCard({ratings:{'sospiro-vibrato':9}})").includes('data-radar="notes" aria-pressed="true"'));run("Families.mode='families';");
  });
  await check('Alchemy clears stale shortcut selection and route changes focus the heading',async()=>{
    page('connect');assert(query('.studio-shortcuts [aria-current=page]'));page('alchemy');assert.equal(doc.querySelector('.studio-shortcuts [aria-current=page]'),null);assert.equal(doc.activeElement,query('#main h1'));
  });
  await check('Keyboard focus survives same-page theme and favorite updates',async()=>{
    const theme=query('[data-v5=theme]');theme.focus();await click('[data-v5=theme]');assert.equal(doc.activeElement.dataset.v5,'theme');
    page('explore');const button=query('#catalog-grid [data-action=favorite]');const id=button.dataset.id;button.focus();await click('#catalog-grid [data-action=favorite]');assert.equal(doc.activeElement.dataset.action,'favorite');assert.equal(doc.activeElement.dataset.id,id);
  });
  process.stdout.write(JSON.stringify({ passed: results.length, checks: results, runtimeErrors: errors }, null, 2) + '\n');
  dom.window.close();
})().catch(error => { process.stderr.write(error.stack + '\n'); dom.window.close(); process.exitCode = 1; });
