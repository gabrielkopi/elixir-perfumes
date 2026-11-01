/* ELIXIR Studio v3. Explicit local choices; no account, stock or server claims. */
'use strict';
window.ElixirStudio = (() => {
  const h = esc;
  const uid = prefix => prefix + '-' + crypto.randomUUID();
  const clean = (v, length = 600) => String(v ?? '').trim().slice(0, length);
  const ids = values => [...new Set(Array.isArray(values) ? values.filter(id => typeof id === 'string' && byId(id)) : [])];
  const avatarImage = (name, color = '#dfe6d7') => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" rx="120" fill="${/^#[a-f0-9]{6}$/i.test(color) ? color : '#dfe6d7'}"/><text x="120" y="143" text-anchor="middle" font-family="Georgia,serif" font-size="64" fill="#384238">${h(name.split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase())}</text></svg>`);
  const extras = [
    ['iris', 'Íris', 'Floral, atalcada e com nuances terrosas. A referência da perfumaria está ligada ao rizoma, não apenas à flor.', 1],
    ['figo', 'Figo', 'Uma referência frutada e verde, que pode ganhar facetas leitosas na composição.', 8],
    ['coco', 'Coco', 'Uma nota cremosa e lactônica, frequentemente usada para sugerir conforto e uma atmosfera solar.', 8],
    ['cafe', 'Café', 'Uma referência torrada e gourmand. Pode lembrar grãos, uma bebida ou um acorde construído.', 5],
    ['cha-verde', 'Chá verde', 'Uma referência fresca, vegetal e delicada. O efeito de chá pode ser construído como acorde.', 8],
    ['musgo-de-carvalho', 'Musgo de carvalho', 'Uma referência verde, terrosa e musgosa. A imagem é uma interpretação visual, não identificação botânica.', 6],
    ['pera', 'Pera', 'Uma nota frutada, fresca e suculenta, que pode ter diferentes interpretações na fragrância.', 8],
    ['cassis', 'Cassis', 'Uma referência de fruta escura com nuances verdes. Fruto e folha podem sugerir efeitos diferentes.', 8]
  ];
  IngredientLibrary.families.push('Frutadas e de chá');
  for (const [id, name, description, family] of extras) {
    if (!INGREDIENTS.some(n => n.id === id)) INGREDIENTS.push({ id, name, description, family, image: `assets/ingredients/${id}-v3.webp`, studio: true });
    if (!NOTE_CHOICES.includes(name)) NOTE_CHOICES.push(name);
  }
  const existingVector = NoteModel.vector.bind(NoteModel);
  NoteModel.vector = name => { const v = existingVector(name); if (NoteModel.normalize(name) === 'chaverde') { v[1] = .9; v[19] = .7; } return v; };
  const educationalSource = 'https://perfumesociety.org/discover-perfume/an-introduction/ingredients/';
  const statuses = [['own', 'Possuo', 'Minha coleção'], ['tried', 'Experimentei', 'Já experimentei'], ['want', 'Quero experimentar', 'Quero experimentar'], ['past', 'Já tive', 'Já tive'], ['favorite', 'Favorito', 'Favoritos']];
  const seedRows = [
    ['lia', 'Lia Monteiro', 'Florais luminosos e pequenos rituais.', ['neroli', 'rosa', 'pera'], ['oud'], ['chance', 'chanel5', 'philosykos'], '#eadfe4'],
    ['rafael', 'Rafael Azevedo', 'O lado verde das cidades.', ['vetiver', 'cedro', 'musgo-de-carvalho'], ['caramelo'], ['vetiver', 'polo', 'arbo'], '#dce6dc'],
    ['ines', 'Inês Duarte', 'Baunilha, livros e uma tarde tranquila.', ['baunilha', 'cafe', 'coco'], ['grapefruit'], ['blackorchid', 'coffee', 'santal'], '#e9dfcf'],
    ['davi', 'Davi Nunes', 'Brisa do mar e novidades na pele.', ['bergamota', 'cha-verde', 'figo'], ['tabaco'], ['coolwater', 'arbo', 'clash'], '#dce7eb'],
    ['alice', 'Alice Moreira', 'Flores, textura e um jeito leve de sentir.', ['iris', 'jasmim', 'cassis'], ['canela'], ['chanel5', 'chance', 'philosykos'], '#e5dfee'],
    ['enzo', 'Enzo Carvalho', 'Madeira, resinas e um novo caminho.', ['sandalo', 'olibano', 'cardamomo'], ['mel'], ['santal', 'hwyl', 'terre'], '#e4e2d7'],
    ['joana', 'Joana Reis', 'Figos, luz e perfumes que deixam espaço.', ['figo', 'coco', 'neroli'], ['oud'], ['philosykos', 'chance', 'coolwater'], '#e1e7d4'],
    ['bruno', 'Bruno Lima', 'Especiarias sem pressa.', ['noz-moscada', 'tabaco', 'baunilha'], ['laranja-doce'], ['terre', 'blackorchid', 'santal'], '#e8dcd2']
  ];
  const seedPeople = seedRows.map(([id, name, bio, liked, disliked, favorites, color], i) => ({
    id: 'studio-' + id, name, handle: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.'), image: avatarImage(name, color), role: 'Perfil de teste · fictício', bio, followers: 120 + i * 87, following: 40 + i * 11,
    family: ['Floral', 'Amadeirada', 'Ambarada', 'Aquática', 'Floral', 'Amadeirada', 'Verde', 'Ambarada'][i], nuance: ['Cítrica · suave', 'Verde · terrosa', 'Gourmand · cremosa', 'Cítrica · verde', 'Atalcada · frutada', 'Resinosa · aromática', 'Frutada · cremosa', 'Especiada · quente'][i], liked, disliked, fashion: 'Em descoberta', fashionDetail: 'Preferência ilustrativa', music: 'Uma trilha para descobrir', artists: 'Seleção pessoal simulada', signature: bio,
    ratings: Object.fromEntries(favorites.filter(byId).map((p, k) => [p, 10 - k])), studio: true
  }));
  Social.people.push(...seedPeople.filter(p => !Social.person(p.id)));
  const S = {
    h, uid, clean, ids, avatarImage, statuses, seedPeople,
    ui: { shelfFilter: 'Todas', shelfQuery: '', personQuery: '', selected: new Set(), level: 'Todos', picker: null, circleDraft: null, personDraft: null, today: { occasion: 'Cotidiano', time: 'Dia', intensity: 'Equilibrada' }, connectRole: 'cliente' },
    undoState: null,
    empty() { return { version: 3, shelf: {}, circle: [], people: [], diary: [], activity: [], feedback: [], connect: null }; },
    ensure() {
      if (!state.lab || typeof state.lab !== 'object' || Array.isArray(state.lab)) state.lab = this.empty();
      const d = this.empty();
      for (const key of ['circle', 'people', 'diary', 'activity', 'feedback']) if (!Array.isArray(state.lab[key])) state.lab[key] = d[key];
      if (!state.lab.shelf || typeof state.lab.shelf !== 'object' || Array.isArray(state.lab.shelf)) state.lab.shelf = {};
      for (const [, , name] of statuses) if (!Array.isArray(state.lists[name])) state.lists[name] = [];
      return state.lab;
    },
    snapshot() { return JSON.parse(JSON.stringify(state)); },
    commit(label, change, repaint = true) {
      this.ensure(); this.undoState = this.snapshot(); change(); this.ensure();
      state.lab.activity.unshift({ id: uid('activity'), label: clean(label, 120), at: new Date().toISOString() });
      state.lab.activity = state.lab.activity.slice(0, 60);
      persist(); if (repaint) render();
    },
    flags(id) { this.ensure(); return Object.fromEntries(statuses.map(([key, , list]) => [key, key === 'favorite' ? state.favorites.includes(id) : state.lists[list].includes(id)])); },
    mark(id, key, force) {
      if (!byId(id)) return; const def = statuses.find(s => s[0] === key); if (!def) return;
      const on = force === undefined ? !this.flags(id)[key] : !!force;
      const list = def[2]; state.lists[list] = state.lists[list].filter(x => x !== id); if (on) state.lists[list].push(id);
      if (key === 'favorite') state.favorites = [...state.lists.Favoritos];
    },
    shelfIds() { this.ensure(); return ids([...Object.values(state.lists).flat(), ...Object.keys(state.lab.shelf)]); },
    heading(eyebrow, title, description, actions = '') { return `<header class="studio-heading"><div><p class="micro-label">${h(eyebrow)}</p><h1>${title}</h1><p>${description}</p></div>${actions ? `<div class="studio-heading-actions">${actions}</div>` : ''}</header>`; },
    button(label, action, extra = '', style = '') { return `<button type="button" class="studio-button ${style}" data-lab="${action}" ${extra}>${label}</button>`; },
    emptyView(title, description, action = '') { return `<div class="studio-empty"><span aria-hidden="true">✧</span><h2>${title}</h2><p>${description}</p>${action}</div>`; },
    badge(text) { return `<span class="studio-badge">${h(text)}</span>`; },
    menu() {
      const links = [['lab', 'Laboratório'], ['today', 'Usar hoje'], ['discovery', 'Fora da bolha'], ['circle', 'Meu círculo'], ['connect', 'Connect']];
      return `<nav class="studio-shortcuts" aria-label="Mais experiências">${links.map(([page, label]) => `<a href="#${page}" ${route.page === page ? 'aria-current="page"' : ''}>${label}${page === 'lab' ? '<span>NOVO</span>' : ''}</a>`).join('')}</nav>`;
    },
    hub() {
      this.ensure(); const tiles = [
        ['collection', 'collection', 'Sua prateleira', 'Marque o que possui, provou e quer experimentar.'], ['people', 'user', 'Pessoas e afinidades', 'Escolha quem seguir ou crie perfis para testar.'], ['circle', 'heart', 'Meu círculo', 'Guarde gostos de pessoas próximas em um espaço privado.'], ['discovery', 'spark', 'Fora da bolha', 'Escolha quanto explorar e conte o que surpreendeu.'], ['today', 'sun', 'Qual perfume usar?', 'Sugestões da sua coleção para o contexto escolhido.'], ['diary', 'bookmark', 'Diário olfativo', 'Registre o perfume, o momento e a sua impressão.'], ['connect', 'share', 'ELIXIR Connect', 'Teste consentimento, catálogo e revogação neste aparelho.'], ['ingredients', 'spark', 'Matérias-primas', `${INGREDIENTS.length} notas e acordes, com novas ilustrações.`]
      ];
      return `<div class="studio-page">${this.heading('ELIXIR / EDIÇÃO EXPERIMENTAL', 'Mais jeitos de <em>descobrir.</em>', 'Um laboratório para experimentar o produto. Você escolhe o que adicionar e quais cenários carregar.')}
      <div class="studio-notice"><div><strong>Seu espaço continua seu.</strong><p>Tudo fica neste navegador. Perfis de teste e atendimentos são simulados; nenhuma mensagem é enviada a outras pessoas.</p></div><a href="#profile" class="text-button">Meu perfil ↗</a></div>
      <div class="studio-feature-grid">${tiles.map(([page, ic, title, desc], i) => `<a class="studio-feature" href="#${page}"><span class="studio-feature-icon">${icon(ic)}</span><small>0${i + 1}</small><h2>${title}</h2><p>${desc}</p><span class="studio-feature-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>
      <section class="studio-scenarios"><div><p class="micro-label">TESTAR COM EXEMPLOS</p><h2>Entre em outro universo.</h2><p>Carregue uma prateleira, preferências, pessoas no círculo e um diário fictício. Seu estado anterior será guardado antes da troca.</p></div><div class="studio-scenario-grid">${[['fresh', 'Fresco & verde', 'Verdes, aquáticos e dias ao ar livre.', 'green'], ['floral', 'Flores & leveza', 'Florais, cítricos e novas nuances.', 'floral'], ['warm', 'Madeiras & calor', 'Madeiras, resinas e momentos tranquilos.', 'woody']].map(([id, name, desc, img]) => `<button data-lab="scenario" data-id="${id}"><img src="assets/families/${img}.png" alt=""><strong>${name}</strong><small>${desc}</small></button>`).join('')}</div></section>
      <section class="studio-data-tools"><div><h2>Seus dados, suas escolhas.</h2><p>Exporte uma cópia pessoal, importe um arquivo do ELIXIR ou restaure o estado anterior ao último cenário. O arquivo exportado pode conter dados privados do seu círculo.</p></div><div class="studio-tool-buttons">${this.button('Exportar meus dados', 'export')}${this.button('Importar cópia', 'import')}${this.button('Restaurar antes do cenário', 'restore', '', 'subtle')}${this.undoState ? this.button('Desfazer última ação', 'undo', '', 'subtle') : ''}</div><input type="file" id="studio-import" accept="application/json,.json" hidden></section>
      <section class="studio-history"><h2>O que você testou.</h2>${state.lab.activity.length ? `<ol>${state.lab.activity.slice(0, 8).map(a => `<li><span>${h(a.label)}</span><time>${h(new Date(a.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }))}</time></li>`).join('')}</ol>` : '<p>Suas próximas interações aparecem aqui.</p>'}</section></div>`;
    },
    shelfCard(id) {
      const p = byId(id), flags = this.flags(id), detail = state.lab.shelf[id] || {}, chosen = this.ui.selected.has(id);
      return `<article class="studio-bottle ${chosen ? 'selected' : ''}"><label class="studio-select"><input type="checkbox" data-studio-select="${id}" ${chosen ? 'checked' : ''}><span>Selecionar ${h(p.name)}</span></label><button class="studio-bottle-image" data-action="perfume" data-id="${id}" aria-label="Conhecer ${h(p.name)}">${photo(p)}</button><div class="studio-bottle-copy"><small>${h(p.brand)}</small><h2>${h(p.name)}</h2><div class="studio-bottle-tags">${statuses.filter(([key]) => flags[key]).map(([, name]) => `<span>${h(name)}</span>`).join('') || '<span>Em uma prateleira</span>'}</div>${detail.remaining !== undefined && detail.remaining !== '' ? `<div class="studio-fill" role="img" aria-label="Cerca de ${Number(detail.remaining)} por cento do seu frasco"><i style="width:${Number(detail.remaining)}%"></i></div>` : ''}${this.button('Organizar', 'shelf-item', `data-id="${id}"`, 'subtle')}</div></article>`;
    },
    shelfGrid() {
      const q = NoteModel.normalize(this.ui.shelfQuery), filter = this.ui.shelfFilter;
      const filtered = this.shelfIds().filter(id => (filter === 'Todas' || (state.lists[filter] || []).includes(id)) && NoteModel.normalize(byId(id).name + ' ' + byId(id).brand).includes(q));
      return filtered.length ? `<div class="studio-shelf-grid">${filtered.map(id => this.shelfCard(id)).join('')}</div>` : this.emptyView('Uma prateleira em descoberta.', 'Adicione perfumes do catálogo ou escolha um cenário no laboratório.', this.button('Adicionar perfumes', 'add-perfumes') + '<a class="text-button" href="#lab">Testar com exemplos ↗</a>');
    },
    collection() {
      this.ensure(); const names = Object.keys(state.lists), selected = this.ui.selected.size;
      return `<div class="studio-page">${this.heading('COLEÇÃO PESSOAL', 'Sua prateleira.<br><em>Suas histórias.</em>', 'Possuir, gostar e ter curiosidade são escolhas diferentes. Organize cada uma do seu jeito.', this.button('Adicionar perfumes', 'add-perfumes') + this.button('Nova prateleira', 'list-new', '', 'subtle'))}
      <div class="studio-stats"><span><strong>${state.lists['Minha coleção'].length}</strong> possuo</span><span><strong>${state.lists['Já experimentei'].length}</strong> experimentei</span><span><strong>${state.lists['Quero experimentar'].length}</strong> quero testar</span><span><strong>${state.favorites.length}</strong> favoritos</span></div>
      <label class="searchbox">${icon('search')}<input id="studio-shelf-search" type="search" placeholder="Encontre algo na sua prateleira" aria-label="Buscar na prateleira" value="${h(this.ui.shelfQuery)}"></label>
      <nav class="studio-pills" aria-label="Prateleiras">${['Todas', ...names].map(name => `<button data-lab="shelf-filter" data-value="${h(name)}" aria-pressed="${name === this.ui.shelfFilter}">${h(name)} <span>${name === 'Todas' ? this.shelfIds().length : state.lists[name].length}</span></button>`).join('')}</nav>
      <div class="studio-collection-tools"><span>${h(this.ui.shelfFilter)}</span>${this.ui.shelfFilter !== 'Todas' && !LIST_NAMES.includes(this.ui.shelfFilter) && this.ui.shelfFilter !== 'Já tive' ? this.button('Editar prateleira', 'list-edit', `data-name="${h(this.ui.shelfFilter)}"`, 'subtle') : ''}<button class="text-button" data-lab="bulk-open">Organizar seleção <span id="studio-selected-count">(${selected})</span></button></div>
      <div id="studio-shelf-grid">${this.shelfGrid()}</div>${Social.shelf()}<p class="studio-footnote">Notas, quantidade restante e tamanho de frasco são informações que você registra. Não são dados oficiais da marca.</p></div>`;
    },
    noteChoices(values = [], avoided = false) { return `<div class="studio-note-checks">${INGREDIENTS.map(n => `<label><input type="checkbox" name="${avoided ? 'avoid' : 'notes'}" value="${h(n.name)}" ${values.includes(n.name) ? 'checked' : ''}><span>${h(n.name)}</span></label>`).join('')}</div>`; },
    syncPeople() {
      this.ensure(); Social.people = Social.people.filter(p => !p.studioCustom);
      for (const p of state.lab.people) Social.people.push({ ...p, image: avatarImage(p.name, p.color), studio: true, studioCustom: true, verified: false, followers: 0, following: 0, role: 'Perfil de teste criado neste navegador', fashion: 'Em descoberta', fashionDetail: 'Preferência ilustrativa', music: 'Em descoberta', artists: 'Sem seleção', signature: p.bio || 'Uma nova afinidade para explorar.', family: Engine.identity(p.ratings, {}).family, nuance: 'Preferências escolhidas', handle: p.handle || p.id, disliked: p.disliked || [], liked: p.liked || [] });
    },
    peopleGrid() {
      this.syncPeople(); const q = NoteModel.normalize(this.ui.personQuery);
      const people = Social.people.filter(p => NoteModel.normalize(p.name + ' ' + p.family + ' ' + p.bio).includes(q));
      return people.length ? people.map(p => { const affinity = Engine.compatibility(state.ratings, p); return `<article class="studio-person"><a href="#person/${p.id}"><img src="${p.image}" alt="Avatar de ${h(p.name)}"><span>${h(p.name)}</span><small>${h(p.family)} · perfil fictício</small></a><p>${h(p.bio)}</p><small class="studio-affinity">${affinity.count ? `${affinity.count} ${affinity.count===1?'fragrância avaliada':'fragrâncias avaliadas'} em comum · afinidade estimada ${affinity.score}/100` : 'Avalie perfumes em comum para conhecer afinidades.'}</small><div class="studio-person-actions"><button data-action="follow" data-id="${p.id}" aria-pressed="${state.following.includes(p.id)}">${state.following.includes(p.id) ? 'Seguindo' : '+ Seguir'}</button>${this.button('Meu círculo', 'circle-from', `data-id="${p.id}"`, 'subtle')}${p.studioCustom ? this.button('Editar', 'person-edit', `data-id="${p.id}"`, 'subtle') : ''}</div></article>`; }).join('') : this.emptyView('Nenhuma pessoa com esse nome.', 'Tente uma família olfativa ou crie um perfil de teste.');
    },
    people() { return `<div class="studio-page">${this.heading('PESSOAS / SIMULAÇÃO', 'Encontre novas<br><em>afinidades.</em>', 'Siga, visite e crie perfis fictícios. Nenhuma conta real será criada ou convidada.', this.button('Criar pessoa de teste', 'person-new'))}<label class="searchbox">${icon('search')}<input id="studio-person-search" type="search" aria-label="Buscar pessoas" placeholder="Nome, família ou jeito de sentir"></label><div class="studio-people-grid" id="studio-people-grid">${this.peopleGrid()}</div><p class="studio-footnote">Avatares com iniciais são ilustrações. Os números e as preferências dos perfis de exemplo são fictícios.</p></div>`; },
    circle() {
      this.ensure(); return `<div class="studio-page">${this.heading('UM ESPAÇO PRIVADO', 'Quem faz parte<br>do seu <em>círculo?</em>', 'Guarde preferências, lembranças e ideias de presentes. Essas informações não entram no ELIXIR Connect.', this.button('Adicionar pessoa', 'circle-new'))}
      ${state.lab.circle.length ? `<div class="studio-circle-grid">${state.lab.circle.map(p => `<article class="studio-contact"><img src="${avatarImage(p.name)}" alt=""><div><small>${h(p.relation || 'Pessoa próxima')}</small><h2>${h(p.name)}</h2>${p.birthday ? `<p>Aniversário: ${h(p.birthday.slice(5).split('-').reverse().join('/'))}</p>` : ''}<div class="studio-tags">${p.notes.slice(0, 3).map(n => this.badge(n)).join('')}</div><p>${p.favorites.length} perfumes de referência${p.budget ? ` · orçamento anotado: R$ ${h(p.budget)}` : ''}</p><div class="studio-contact-actions">${this.button('Ideias de presente', 'gift', `data-id="${p.id}"`)}${this.button('Editar', 'circle-edit', `data-id="${p.id}"`, 'subtle')}${this.button('Remover', 'delete', `data-kind="circle" data-id="${p.id}"`, 'subtle')}</div></div></article>`).join('')}</div>` : this.emptyView('Um lugar para lembrar do que importa.', 'Adicione alguém manualmente ou copie um perfil fictício da área Pessoas.', this.button('Adicionar pessoa', 'circle-new') + '<a class="text-button" href="#people">Escolher um exemplo ↗</a>')}
      <div class="studio-notice"><div><strong>Privado neste navegador.</strong><p>Não há publicação, convite, envio de aniversário ou compartilhamento automático. Use apelidos se preferir.</p></div></div></div>`;
    },
    rankedFor(ratings = state.ratings, preferences = state.preferences, pool = PERFUMES, context = state.context) {
      return pool.map(p => ({ p, ...Engine.recommend(p, ratings, context, preferences) })).sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name));
    },
    suggestion(row, label = '', reason = '') {
      const p = row.p, feedback = state.lab.feedback.find(f => f.perfume === p.id);
      return `<article class="studio-suggestion"><button class="studio-suggestion-image" data-action="perfume" data-id="${p.id}" aria-label="Conhecer ${h(p.name)}">${photo(p)}</button><div>${label ? this.badge(label) : ''}<small>${h(p.brand)}</small><h2>${h(p.name)}</h2><p>${h(reason || row.reason)}</p>${row.risk ? `<p class="studio-risk">${h(row.risk)}</p>` : ''}<div class="studio-feedback" aria-label="Seu feedback sobre ${h(p.name)}">${[['like', 'Gostei'], ['dislike', 'Não gostei'], ['surprise', 'Me surpreendeu'], ['want', 'Quero testar']].map(([value, text]) => `<button data-lab="feedback" data-id="${p.id}" data-value="${value}" aria-pressed="${value === 'want' ? this.flags(p.id).want : feedback?.value === value}">${text}</button>`).join('')}</div>${this.button('Organizar na prateleira', 'shelf-item', `data-id="${p.id}"`, 'subtle')}</div></article>`;
    },
    discovery() {
      this.ensure(); const signals = Engine.identity(state.ratings, state.preferences).signals;
      const profile = Engine.profile(state.ratings, state.preferences).map(v => v / 100), known = new Set(Object.keys(state.ratings));
      const candidates = this.rankedFor().filter(r => !known.has(r.p.id) && !state.lab.feedback.some(f => f.perfume === r.p.id && f.value === 'dislike')).map(row => ({ ...row, similarity: Engine.cosine(profile, row.p.vector) }));
      const familiar = [...candidates].sort((a, b) => b.score - a.score), transition = [...candidates].sort((a, b) => (b.score + (1 - b.similarity) * 22) - (a.score + (1 - a.similarity) * 22)), explore = [...candidates].sort((a, b) => (b.score * .45 + (1 - b.similarity) * 75) - (a.score * .45 + (1 - a.similarity) * 75));
      const seen = new Set(), rows = [];
      for (const [label, list, explanation] of [['Familiar', familiar, 'Uma opção próxima dos sinais que você já compartilhou.'], ['Transição', transition, 'Preserva possíveis pontos de conexão e abre espaço para outras nuances.'], ['Fora da bolha', explore, 'Tem descritores diferentes do seu perfil atual. É um convite para experimentar, sem garantia de que você gostará.']]) {
        for (const row of list) { if (seen.has(row.p.id)) continue; seen.add(row.p.id); rows.push({ row, label, explanation }); if (rows.filter(x => x.label === label).length === 3) break; }
      }
      return `<div class="studio-page">${this.heading('DESCOBERTA PROGRESSIVA', 'Um passo além<br>do <em>familiar.</em>', 'Você escolhe o ritmo. O feedback é um sinal explícito; apenas abrir uma fragrância não significa gostar.')}
      ${!signals ? `<div class="studio-notice"><div><strong>Vamos conhecer seu gosto primeiro?</strong><p>Sem preferências, a seleção abaixo é editorial. Faça a descoberta ou carregue um cenário para testar a personalização.</p></div><a class="studio-button" href="elixir.html?discover=1#profile">Descobrir meu gosto</a></div>` : ''}
      <nav class="studio-pills" aria-label="Nível de descoberta">${['Todos', 'Familiar', 'Transição', 'Fora da bolha'].map(label => `<button data-lab="discovery-level" data-value="${label}" aria-pressed="${this.ui.level === label}">${label}</button>`).join('')}</nav>
      <div class="studio-suggestion-grid">${rows.filter(x => this.ui.level === 'Todos' || x.label === this.ui.level).map(x => this.suggestion(x.row, signals ? x.label : 'Seleção editorial', x.explanation + ' ' + x.row.reason)).join('')}</div><details class="studio-method"><summary>Como essas descobertas são selecionadas?</summary><p>O motor editorial considera avaliações e notas explícitas. A seleção familiar ordena a afinidade estimada; transição acrescenta diversidade; fora da bolha dá mais peso à distância entre descritores. Os grupos evitam repetir perfumes. Seu feedback negativo retira a fragrância da lista. Nenhuma pontuação representa probabilidade científica de satisfação.</p></details></div>`;
    },
    today() {
      this.ensure(); const pool = ids(state.lists['Minha coleção']).map(byId), recent = new Set(state.lab.diary.slice(0, 3).map(x => x.perfume));
      const context = { ...state.context, occasion: this.ui.today.occasion, time: this.ui.today.time };
      const rows = this.rankedFor(state.ratings, { ...state.preferences, intensity: this.ui.today.intensity }, pool, context).sort((a, b) => (b.score - (recent.has(b.p.id) ? 4 : 0)) - (a.score - (recent.has(a.p.id) ? 4 : 0))).slice(0, 3);
      return `<div class="studio-page">${this.heading('SEU MOMENTO', 'O que combina<br>com <em>hoje?</em>', 'Sugestões entre os perfumes que você marcou como “Possuo”. Escolha as condições manualmente, sem localização.')}
      <form id="studio-today" class="studio-context-form"><label>Ocasião<select name="occasion">${['Cotidiano', 'Trabalho', 'Jantar', 'Praia', 'Festa', 'Viagem'].map(v => `<option ${v === this.ui.today.occasion ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label>Horário<select name="time">${['Dia', 'Noite'].map(v => `<option ${v === this.ui.today.time ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label>Presença<select name="intensity">${['Discreta', 'Equilibrada', 'Marcante'].map(v => `<option ${v === this.ui.today.intensity ? 'selected' : ''}>${v}</option>`).join('')}</select></label><button class="studio-button" type="submit">Atualizar sugestões</button></form>
      ${rows.length ? `<div class="studio-today-grid">${rows.map(row => `<article><button data-action="perfume" data-id="${row.p.id}" class="studio-today-image">${photo(row.p)}</button><p class="micro-label">${h(row.p.brand)}</p><h2>${h(row.p.name)}</h2><p>${h(row.reason)}</p>${recent.has(row.p.id) ? '<small>Você registrou uso recente no diário.</small>' : ''}${this.button('Usei hoje', 'diary-new', `data-id="${row.p.id}"`)}</article>`).join('')}</div>` : this.emptyView('Sua coleção ainda está em branco.', 'Marque os perfumes que você possui para receber sugestões da sua própria prateleira.', this.button('Adicionar perfumes', 'add-perfumes'))}
      <p class="studio-footnote">O contexto usa apenas relatos demonstrativos quando disponíveis; não consulta clima real nem inventa desempenho. Ocasiões são sugestões, não regras de uso.</p></div>`;
    },
    diary() {
      this.ensure(); return `<div class="studio-page">${this.heading('MEMÓRIA OLFATIVA', 'Cada uso.<br>Uma <em>lembrança.</em>', 'Registre o que usou, como se sentiu e o que vale experimentar de novo.', this.button('Registrar um uso', 'diary-new'))}
      ${state.lab.diary.length ? `<div class="studio-diary-list">${[...state.lab.diary].sort((a, b) => b.date.localeCompare(a.date)).map(e => `<article><img src="${byId(e.perfume)?.image || 'assets/products/forest.jpg'}" alt=""><div><time>${h(e.date.split('-').reverse().join('/'))}</time><h2>${h(byId(e.perfume)?.name || 'Fragrância')}</h2><small>${h(e.occasion)} · ${h(e.time)}${e.mood ? ' · ' + h(e.mood) : ''}</small><p>${h(e.note)}</p>${this.button('Editar', 'diary-edit', `data-id="${e.id}"`, 'subtle')}${this.button('Remover', 'delete', `data-kind="diary" data-id="${e.id}"`, 'subtle')}</div></article>`).join('')}</div>` : this.emptyView('Sua próxima memória começa aqui.', 'Um registro de uso não é uma avaliação automática. O que você gostou continua sendo uma escolha separada.', this.button('Registrar um uso', 'diary-new'))}</div>`;
    },
    shared(session = this.ensure().connect, now = Date.now()) {
      if (!session || session.status !== 'active' || session.expires <= now) return null;
      const payload = {};
      if (session.scopes.includes('liked')) payload.likedNotes = [...state.preferences.likedNotes];
      if (session.scopes.includes('avoid')) payload.dislikedNotes = [...state.preferences.dislikedNotes];
      if (session.scopes.includes('favorites')) payload.favorites = state.favorites.map(id => ({ id, name: byId(id)?.name })).filter(p => p.name);
      return payload;
    },
    connect() {
      this.ensure(); const session = state.lab.connect, expired = session && ['waiting', 'active'].includes(session.status) && session.expires <= Date.now(), shared = this.shared(), staff = this.ui.connectRole === 'atendente';
      let body = '';
      if (!session || session.status === 'revoked' || expired) body = `<div class="studio-connect-start"><span aria-hidden="true">${icon('share')}</span><h2>${expired ? 'A sessão expirou.' : session?.status === 'revoked' ? 'Compartilhamento encerrado.' : 'O atendimento começa com você.'}</h2><p>Gere um código demonstrativo, escolha um catálogo e autorize apenas as informações que quer mostrar. O acesso dura cinco minutos e pode ser revogado.</p>${this.button('Iniciar sessão de teste', 'connect-start')}</div>`;
      else if (session.status === 'waiting') body = `<div class="studio-consent"><div><p class="micro-label">CÓDIGO DEMONSTRATIVO</p><strong class="studio-code">${h(session.code)}</strong><p>Válido por <span data-session-clock>${Math.max(0, Math.ceil((session.expires - Date.now()) / 60000))} min</span>. Não é um QR Code nem um token de acesso real.</p></div>${staff ? '<div class="studio-notice"><strong>Aguardando autorização do cliente. Nenhuma preferência está disponível.</strong></div>' : `<form id="studio-consent"><label>Catálogo da loja<select name="store"><option>O Boticário</option><option>Natura</option><option>Multimarcas</option></select></label><fieldset><legend>O que deseja compartilhar nesta simulação?</legend><label><input type="checkbox" name="scope" value="liked" checked> Notas que gosto de sentir</label><label><input type="checkbox" name="scope" value="avoid"> Notas que prefiro evitar</label><label><input type="checkbox" name="scope" value="favorites"> Perfumes favoritos</label></fieldset><p>Seu círculo, diário, anotações, nome e fotos permanecem fora desta visão.</p><label class="studio-explicit-consent"><input type="checkbox" name="consent" required> Autorizo esta visão limitada no atendimento simulado deste aparelho.</label><button class="studio-button" type="submit">Autorizar e ver atendimento</button></form>`}${this.button('Cancelar sessão', 'connect-revoke', '', 'subtle')}</div>`;
      else if (shared) {
        const preferences = { likedNotes: shared.likedNotes || [], dislikedNotes: shared.dislikedNotes || [], styles: [] }, ratings = Object.fromEntries((shared.favorites || []).map(p => [p.id, 9]));
        const pool = PERFUMES.filter(p => session.store === 'Multimarcas' || p.brand === session.store), rows = this.rankedFor(ratings, preferences, pool, {}).slice(0, 3);
        body = `<div class="studio-connect-active"><div class="studio-session-heading"><div>${this.badge('Sessão autorizada')}<h2>Recomendações no catálogo ${h(session.store)}.</h2><p>Compartilhamento termina em <span data-session-clock></span>.</p></div>${this.button('Encerrar agora', 'connect-revoke')}</div><section class="studio-shared"><h3>Somente o que foi autorizado</h3>${Object.hasOwn(shared, 'likedNotes') ? `<p><strong>Notas favoritas:</strong> ${h(shared.likedNotes.join(' · ') || 'Nenhuma informada')}</p>` : ''}${Object.hasOwn(shared, 'dislikedNotes') ? `<p><strong>Notas evitadas:</strong> ${h(shared.dislikedNotes.join(' · ') || 'Nenhuma informada')}</p>` : ''}${Object.hasOwn(shared, 'favorites') ? `<p><strong>Favoritos:</strong> ${h(shared.favorites.map(p => p.name).join(' · ') || 'Nenhum informado')}</p>` : ''}</section><div class="studio-suggestion-grid">${rows.map(row => `<article class="studio-store-card">${photo(row.p)}<small>${h(row.p.brand)}</small><h3>${h(row.p.name)}</h3><p>${h(row.reason)}</p>${this.badge('Estoque e tester não verificados')}${staff ? '<small>O feedback pertence ao cliente. Troque para a visão Cliente para registrar uma escolha.</small>' : this.button('Quero experimentar', 'feedback', `data-id="${row.p.id}" data-value="want"`)}</article>`).join('')}</div></div>`;
      }
      return `<div class="studio-page">${this.heading('ELIXIR CONNECT / DEMONSTRAÇÃO', 'Uma conversa.<br>Novas <em>possibilidades.</em>', 'Simulação local do fluxo de atendimento. As duas visões funcionam neste mesmo aparelho, sem integração com lojas ou contas profissionais.')}
      <div class="studio-role-switch" aria-label="Visão da simulação">${['cliente', 'atendente'].map(role => `<button data-lab="connect-role" data-value="${role}" aria-pressed="${this.ui.connectRole === role}">${role === 'cliente' ? 'Cliente' : 'Atendente'}</button>`).join('')}</div>${body}<p class="studio-footnote">Esta demonstração não oferece segurança de compartilhamento entre contas. Autorização real, QR Code e controle no servidor são etapas futuras. Os catálogos não indicam parceria oficial, disponibilidade física ou tester.</p></div>`;
    }
  };
  return S;
})();
