/* Interactions and validation for the local ELIXIR Studio. */
'use strict';
(() => {
  const S = window.ElixirStudio, h = S.h, ids = S.ids, text = S.clean;
  const dateToday = () => { const now = new Date(); return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-'); };
  const input = (name, label, value = '', type = 'text', attrs = '') => `<label class="studio-field">${label}<input name="${name}" type="${type}" value="${h(value)}" ${attrs}></label>`;
  const options = (values, selected) => values.map(v => `<option ${v === selected ? 'selected' : ''}>${h(v)}</option>`).join('');
  const forms = id => document.getElementById(id);
  const data = form => Object.fromEntries(new FormData(form));
  const finite = (value, min, max, fallback = 0) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
  const validName = name => name.length > 0 && !['__proto__', 'constructor', 'prototype'].includes(name);
  const notesFrom = (values, avoided = false) => [...new Set((Array.isArray(values) ? values : []).map(v => text(v, 60)).filter(v => INGREDIENTS.some(n => n.name === v) || NOTE_CHOICES.includes(v)))];
  const ingredientIds = values => values.map(name => INGREDIENTS.find(n => n.name === name)?.id).filter(Boolean);
  S.ensure();

  S.pickerGrid = function () {
    const picker = this.ui.picker, q = NoteModel.normalize(picker.query || '');
    const pool = PERFUMES.filter(p => NoteModel.normalize(p.name + ' ' + p.brand).includes(q));
    return pool.slice(0, q ? 100 : 30).map(p => `<label class="studio-picker-item"><input type="checkbox" data-studio-picker="${p.id}" ${picker.selected.has(p.id) ? 'checked' : ''}><img src="${p.image}" alt="" loading="lazy"><span><strong>${h(p.name)}</strong><small>${h(p.brand)}</small></span></label>`).join('') || '<p class="studio-empty-result">Nenhuma fragrância com esse nome.</p>';
  };
  S.pick = function (title, initial, done) {
    this.ui.picker = { selected: new Set(ids(initial)), query: '', done };
    openModal(h(title), `<label class="searchbox">${icon('search')}<input id="studio-picker-search" type="search" placeholder="Buscar entre os perfumes do catálogo" aria-label="Buscar perfumes para selecionar"></label><div id="studio-picker-grid" class="studio-picker-grid">${this.pickerGrid()}</div><div class="studio-picker-footer"><span id="studio-picker-count">${this.ui.picker.selected.size} selecionados</span>${this.button('Concluir seleção', 'picker-done')}</div><p class="studio-footnote">Os primeiros 30 aparecem ao abrir. Busque por nome ou marca para encontrar todo o catálogo.</p>`);
  };
  S.quickShelf = function (id) {
    const p = byId(id); if (!p) return; this.ensure(); const flags = this.flags(id), d = state.lab.shelf[id] || {};
    openModal('Um lugar para ' + h(p.name), `<div class="studio-shelf-modal"><img src="${p.image}" alt="${h(p.name)}"><div><p class="micro-label">${h(p.brand)}</p><h3>${h(p.name)}</h3><p>Marque cada experiência separadamente.</p></div></div><div class="studio-status-grid">${this.statuses.map(([key, label]) => `<button data-lab="shelf-status" data-id="${id}" data-value="${key}" aria-pressed="${flags[key]}">${flags[key] ? '✓' : '+'} ${label}</button>`).join('')}</div><p class="studio-form-label">Minha impressão</p><div class="studio-taste-grid">${[[10, 'Amo'], [8, 'Gosto'], [5, 'Indiferente'], [2, 'Não gostei']].map(([score, label]) => `<button data-lab="taste" data-id="${id}" data-value="${score}" aria-pressed="${state.ratings[id] === score}">${label}</button>`).join('')}</div><form id="studio-shelf-form" data-id="${id}"><div class="studio-form-grid">${input('size', 'Meu frasco (ml, opcional)', d.size || '', 'number', 'min="1" max="2000" placeholder="Ex.: 50"')}${input('remaining', 'Quanto resta? (%, opcional)', d.remaining ?? '', 'number', 'min="0" max="100" placeholder="Estimativa pessoal"')}</div><label class="studio-field">Uma anotação só sua<textarea name="note" maxlength="800" placeholder="Uma memória, um cuidado ou algo para experimentar de novo.">${h(d.note || '')}</textarea></label><button class="studio-button" type="submit">Salvar na prateleira</button>${this.button('Registrar um uso', 'diary-new', `data-id="${id}"`, 'subtle')}</form><p class="studio-footnote">Possuir não significa gostar. Gostar não marca automaticamente “Possuo” ou “Experimentei”.</p>`);
  };
  S.captureShelf = function (id) {
    const form = forms('studio-shelf-form'); if (!form || form.dataset.id !== id) return;
    const f = data(form); state.lab.shelf[id] = { note: text(f.note, 800), size: f.size === '' ? '' : finite(f.size, 1, 2000, 50), remaining: f.remaining === '' ? '' : finite(f.remaining, 0, 100) };
  };
  S.listDialog = function (name = '') {
    openModal(name ? 'Editar prateleira' : 'Uma prateleira só sua', `<form id="studio-list-form" data-name="${h(name)}">${input('name', 'Nome da prateleira', name, 'text', 'required maxlength="60" placeholder="Ex.: Memórias de verão"')}<button class="studio-button" type="submit">${name ? 'Salvar nome' : 'Criar prateleira'}</button>${name ? this.button('Remover esta prateleira', 'delete', `data-kind="list" data-id="${h(name)}"`, 'subtle') : ''}</form>`);
  };
  S.bulk = function (chosen = [...this.ui.selected]) {
    const selected = ids(chosen); if (!selected.length) { toast('Selecione perfumes pelos marcadores da prateleira.'); return; }
    this.ui.bulk = selected;
    openModal('Organizar ' + selected.length + ' fragrâncias', `<form id="studio-bulk"><p>${selected.map(id => h(byId(id).name)).join(' · ')}</p><label class="studio-field">Adicionar à prateleira<select name="list">${Object.keys(state.lists).map(name => `<option value="${h(name)}">${h(name)}</option>`).join('')}</select></label><button class="studio-button" type="submit">Adicionar selecionados</button></form><div class="studio-bulk-actions">${this.statuses.filter(s => s[0] !== 'favorite').map(([key, label]) => this.button('Marcar: ' + label, 'bulk-status', `data-value="${key}"`, 'subtle')).join('')}</div>`);
  };
  S.circleForm = function (draft = null) {
    const d = draft || { id: '', name: '', relation: 'Amizade', birthday: '', notes: [], avoid: [], favorites: [], budget: '', note: '' }; this.ui.circleDraft = { ...d, notes: [...(d.notes || [])], avoid: [...(d.avoid || [])], favorites: [...(d.favorites || [])] };
    openModal(d.id ? 'Editar pessoa do meu círculo' : 'Adicionar ao meu círculo', `<form id="studio-circle-form"><div class="studio-form-grid">${input('name', 'Nome ou apelido', d.name, 'text', 'required maxlength="60"')}<label class="studio-field">Relação<select name="relation">${options(['Amizade', 'Família', 'Parceria', 'Colega', 'Outra'], d.relation)}</select></label>${input('birthday', 'Aniversário (opcional)', d.birthday, 'date')}${input('budget', 'Orçamento para presente (R$, opcional)', d.budget, 'number', 'min="0" max="100000" step="0.01"')}</div><div class="studio-form-label">Perfumes de referência</div><div class="studio-tags">${ids(d.favorites).map(id => this.badge(byId(id).name)).join('') || '<small>Nenhuma referência escolhida.</small>'}</div>${this.button('Escolher perfumes', 'circle-pick', '', 'subtle')}<details class="studio-note-details"><summary>Notas favoritas</summary>${this.noteChoices(d.notes)}</details><details class="studio-note-details"><summary>Notas que prefere evitar</summary>${this.noteChoices(d.avoid, true)}</details><label class="studio-field">Observações privadas<textarea name="note" maxlength="1000">${h(d.note || '')}</textarea></label><p class="studio-footnote">Esses dados ficam neste navegador e não são compartilhados no Connect.</p><button class="studio-button" type="submit">Salvar pessoa</button></form>`);
  };
  S.captureCircle = function () {
    const form = forms('studio-circle-form'); if (!form) return this.ui.circleDraft;
    const f = new FormData(form); this.ui.circleDraft = { ...this.ui.circleDraft, ...Object.fromEntries(f), notes: f.getAll('notes'), avoid: f.getAll('avoid') }; return this.ui.circleDraft;
  };
  S.personForm = function (draft = null) {
    const d = draft || { id: '', name: '', handle: '', bio: '', notes: [], avoid: [], favorites: [], color: '#dfe6d7' };
    const edit = d.studioCustom || !!state.lab.people.find(p => p.id === d.id);
    this.ui.personDraft = { ...d, notes: d.notes || (d.liked || []).map(id => INGREDIENTS.find(n => n.id === id)?.name).filter(Boolean), avoid: d.avoid || (d.disliked || []).map(id => INGREDIENTS.find(n => n.id === id)?.name).filter(Boolean), favorites: d.favorites || Object.keys(d.ratings || {}).filter(id => d.ratings[id] >= 8) };
    const f = this.ui.personDraft;
    openModal(edit ? 'Editar perfil de teste' : 'Criar uma pessoa de teste', `<form id="studio-person-form"><p class="studio-footnote">Perfil fictício criado somente neste navegador. Não cria conta nem envia convites.</p><div class="studio-form-grid">${input('name', 'Nome fictício', f.name, 'text', 'required maxlength="60"')}${input('handle', 'Identificador', f.handle, 'text', 'maxlength="40" placeholder="exemplo.perfil"')}</div><label class="studio-field">Uma breve apresentação<textarea name="bio" maxlength="240">${h(f.bio)}</textarea></label><div class="studio-form-label">Perfumes que essa pessoa gosta</div><div class="studio-tags">${ids(f.favorites).map(id => this.badge(byId(id).name)).join('') || '<small>Escolha referências para simular afinidades.</small>'}</div>${this.button('Selecionar perfumes', 'person-pick', '', 'subtle')}<details class="studio-note-details"><summary>Notas favoritas</summary>${this.noteChoices(f.notes)}</details><details class="studio-note-details"><summary>Notas evitadas</summary>${this.noteChoices(f.avoid, true)}</details><button class="studio-button" type="submit">Salvar perfil de teste</button>${edit ? this.button('Remover perfil', 'delete', `data-kind="people" data-id="${h(f.id)}"`, 'subtle') : ''}</form>`);
  };
  S.capturePerson = function () { const form = forms('studio-person-form'); if (!form) return this.ui.personDraft; const f = new FormData(form); this.ui.personDraft = { ...this.ui.personDraft, ...Object.fromEntries(f), notes: f.getAll('notes'), avoid: f.getAll('avoid') }; return this.ui.personDraft; };
  S.gift = function (id) {
    const person = state.lab.circle.find(p => p.id === id); if (!person) return;
    const ratings = Object.fromEntries(ids(person.favorites).map(id => [id, 9])), preferences = { styles: [], likedNotes: person.notes, dislikedNotes: person.avoid };
    const rows = this.rankedFor(ratings, preferences).filter(row => !person.favorites.includes(row.p.id)).slice(0, 4);
    openModal('Ideias para ' + h(person.name), `<p class="studio-footnote">Sugestões a partir das preferências que você anotou. Não revelam ou reservam presentes para ninguém.${person.budget ? ` Orçamento anotado: R$ ${h(person.budget)}. O catálogo não tem preços verificados; confirme o valor antes de escolher.` : ''}</p><div class="studio-gift-grid">${rows.map(row => `<article><img src="${row.p.image}" alt="${h(row.p.name)}"><small>${h(row.p.brand)}</small><h3>${h(row.p.name)}</h3><p>${h(row.reason)}</p><small>Preço e disponibilidade não verificados</small>${this.button('Anotar como ideia', 'gift-save', `data-id="${person.id}" data-perfume="${row.p.id}"`, 'subtle')}</article>`).join('')}</div>${person.gifts?.length ? `<h3>Ideias guardadas</h3><p>${person.gifts.map(id => h(byId(id)?.name || '')).join(' · ')}</p>` : ''}`);
  };
  S.diaryForm = function (id = '', entry = null) {
    const d = entry || { id: '', perfume: id || state.lists['Minha coleção'][0] || PERFUMES[0].id, date: dateToday(), occasion: this.ui.today.occasion, time: this.ui.today.time, mood: 'Me fez bem', note: '' };
    openModal(d.id ? 'Editar memória' : 'Uma memória de hoje', `<form id="studio-diary-form" data-id="${h(d.id)}"><label class="studio-field">Perfume<select name="perfume">${PERFUMES.map(p => `<option value="${p.id}" ${p.id === d.perfume ? 'selected' : ''}>${h(p.name)} · ${h(p.brand)}</option>`).join('')}</select></label><div class="studio-form-grid">${input('date', 'Data', d.date, 'date', 'required')}<label class="studio-field">Ocasião<select name="occasion">${options(['Cotidiano', 'Trabalho', 'Jantar', 'Praia', 'Festa', 'Viagem'], d.occasion)}</select></label><label class="studio-field">Horário<select name="time">${options(['Dia', 'Noite'], d.time)}</select></label><label class="studio-field">Como foi?<select name="mood">${options(['Me fez bem', 'Me surpreendeu', 'Quero tentar de novo', 'Não combinou com o momento'], d.mood)}</select></label></div><label class="studio-field">O que você quer lembrar?<textarea name="note" maxlength="1000">${h(d.note)}</textarea></label><button class="studio-button" type="submit">Guardar memória</button><p class="studio-footnote">Registrar o uso marca “Experimentei”, mas não muda sua nota nem significa que você possui o perfume.</p></form>`);
  };
  S.feedback = function (id, value) {
    if (!byId(id) || !['like', 'dislike', 'surprise', 'want'].includes(value)) return;
    this.commit('Feedback: ' + byId(id).name, () => {
      if (value === 'want') this.mark(id, 'want', !this.flags(id).want);
      else {
        state.ratings[id] = value === 'dislike' ? 2 : value === 'surprise' ? 9 : 8;
        if (value === 'dislike') this.mark(id, 'favorite', false);
        state.lab.feedback = [{ perfume: id, value, at: new Date().toISOString() }, ...state.lab.feedback.filter(f => f.perfume !== id)].slice(0, 100);
      }
    }); toast(value === 'want' ? 'Sua lista de experimentação foi atualizada.' : 'Seu feedback atualizou as descobertas.');
  };
  S.confirmDelete = function (kind, id) {
    const label = kind === 'circle' ? state.lab.circle.find(p => p.id === id)?.name : kind === 'people' ? state.lab.people.find(p => p.id === id)?.name : kind === 'list' ? id : 'esta memória';
    if (!label) return;
    openModal('Remover ' + h(label) + '?', `<p>${kind === 'list' ? 'A prateleira será removida. As fragrâncias continuam no catálogo e nas outras listas.' : 'Este registro será removido do seu espaço local.'} Você poderá desfazer a última ação no laboratório, durante esta sessão.</p><div class="studio-confirm-actions">${this.button('Remover registro', 'delete-confirm', `data-kind="${kind}" data-id="${h(id)}"`)}<button class="studio-button subtle" data-action="close">Manter registro</button></div>`);
  };
  S.saveBackup = function () {
    try { localStorage.setItem('elixir-studio-backup-v3', JSON.stringify({ product: 'ELIXIR', version: 3, state: this.snapshot(), savedAt: new Date().toISOString() })); return true; }
    catch { toast('Não foi possível guardar a cópia anterior. Exporte seus dados antes de trocar o cenário.'); return false; }
  };
  S.scenarioDialog = function (kind) {
    const title = { fresh: 'Fresco & verde', floral: 'Flores & leveza', warm: 'Madeiras & calor' }[kind]; if (!title) return;
    openModal('Carregar cenário ' + title + '?', `<p>O cenário substitui o perfil, as prateleiras, o círculo e o diário atuais por exemplos fictícios. Antes da troca, o ELIXIR guarda uma cópia do seu estado atual neste navegador.</p><p>A cópia anterior é substituída a cada novo cenário. Use “Exportar meus dados” para conservar mais de uma versão.</p><div class="studio-confirm-actions">${this.button('Guardar cópia e carregar cenário', 'scenario-apply', `data-id="${kind}"`)}<button class="studio-button subtle" data-action="close">Continuar no meu espaço</button></div>`);
  };
  S.applyScenario = function (kind) {
    const definitions = { fresh: { ids: ['arbo', 'coolwater', 'clash', 'polo', 'vetiver'], notes: ['Bergamota', 'Notas marinhas', 'Vetiver'], avoid: ['Caramelo'], styles: ['aquatic', 'green'] }, floral: { ids: ['chance', 'chanel5', 'philosykos', 'coolwater'], notes: ['Rosa', 'Jasmim', 'Íris'], avoid: ['Tabaco'], styles: ['floral', 'citrus'] }, warm: { ids: ['santal', 'terre', 'hwyl', 'blackorchid', 'coffee'], notes: ['Sândalo', 'Baunilha', 'Cardamomo'], avoid: ['Toranja'], styles: ['woody', 'gourmand'] } };
    const d = definitions[kind]; if (!d || !this.saveBackup()) return false;
    this.undoState = this.snapshot(); state = defaults(); state.lab = this.empty(); state.name = 'Seu perfil de teste'; state.bio = 'Cenário fictício. Todas as escolhas podem ser alteradas.';
    state.preferences = { ...state.preferences, likedNotes: d.notes, dislikedNotes: d.avoid, styles: d.styles, completedDiscovery: true };
    state.ratings = Object.fromEntries(d.ids.filter(byId).map((id, i) => [id, i === 3 ? 4 : 10 - i])); state.favorites = d.ids.slice(0, 2); state.lists.Favoritos = [...state.favorites]; state.lists['Minha coleção'] = d.ids.slice(0, 3); state.lists['Já experimentei'] = [...d.ids]; state.lists['Quero experimentar'] = PERFUMES.filter(p => !d.ids.includes(p.id)).slice(8, 11).map(p => p.id); state.lists['Memórias de viagem'] = d.ids.slice(1, 3);
    d.ids.forEach((id, i) => state.lab.shelf[id] = { remaining: 85 - i * 13, size: 50, note: 'Anotação fictícia do cenário, editável.' });
    state.following = seedRowsForScenario(); state.lab.circle = S.seedPeople.slice(0, 3).map(p => ({ id: S.uid('circle'), name: p.name + ' (exemplo)', relation: 'Amizade', notes: p.liked.map(id => INGREDIENTS.find(n => n.id === id)?.name).filter(Boolean), avoid: [], favorites: Object.keys(p.ratings), birthday: '', budget: '', note: 'Pessoa fictícia adicionada pelo cenário.', gifts: [] }));
    state.lab.diary = d.ids.slice(0, 3).map((id, i) => ({ id: S.uid('diary'), perfume: id, date: new Date(Date.now() - i * 86400000).toLocaleDateString('sv-SE'), occasion: i ? 'Cotidiano' : 'Jantar', time: i ? 'Dia' : 'Noite', mood: 'Me fez bem', note: 'Memória fictícia para testar edição e exclusão.' }));
    state.lab.activity = [{ id: S.uid('activity'), label: 'Cenário de teste carregado por sua escolha', at: new Date().toISOString() }]; this.ui.selected.clear(); this.ui.shelfFilter = 'Todas'; persist(); closeModal(); go('collection'); toast('Cenário carregado. A cópia anterior está no laboratório.'); return true;
  };
  const seedRowsForScenario = () => S.seedPeople.slice(0, 3).map(p => p.id);
  S.exportData = function () {
    const payload = { product: 'ELIXIR', version: 3, exportedAt: new Date().toISOString(), state: this.snapshot() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'elixir-meus-dados-' + dateToday() + '.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Cópia exportada. Guarde o arquivo em um lugar privado.');
  };
  S.validateImport = function (raw) {
    if (!raw || raw.product !== 'ELIXIR' || raw.version !== 3 || !raw.state || typeof raw.state !== 'object') throw new Error('Escolha uma cópia de dados ELIXIR versão 3.');
    const source = raw.state, next = defaults(), sourceLab = source.lab || {};
    const ratingMap = obj => Object.fromEntries(Object.entries(obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {}).filter(([id, v]) => byId(id) && Number.isFinite(v) && v >= 0 && v <= 10));
    next.name = text(source.name, 60) || 'Você'; next.username = text(source.username, 40).replace(/[^a-zA-Z0-9._-]/g, '') || 'meu-perfil'; next.bio = text(source.bio, 600); next.fashion = text(source.fashion, 60); next.music = text(source.music, 60);
    next.ratings = ratingMap(source.ratings); next.favorites = ids(source.favorites);
    next.lists = Object.fromEntries(Object.entries(source.lists && typeof source.lists === 'object' ? source.lists : {}).slice(0, 60).filter(([name]) => validName(name) && name.length <= 60).map(([name, values]) => [name, ids(values)]));
    for (const name of [...LIST_NAMES, 'Já tive']) if (!Array.isArray(next.lists[name])) next.lists[name] = [];
    next.lists.Favoritos = [...next.favorites];
    next.preferences = { ...next.preferences, styles: (Array.isArray(source.preferences?.styles) ? source.preferences.styles : []).filter(v => STYLE_CHOICES.some(s => s.id === v)), likedNotes: notesFrom(source.preferences?.likedNotes), dislikedNotes: notesFrom(source.preferences?.dislikedNotes), intensity: ['Discreta', 'Equilibrada', 'Marcante'].includes(source.preferences?.intensity) ? source.preferences.intensity : 'Equilibrada', completedDiscovery: !!source.preferences?.completedDiscovery };
    next.lab = this.empty();
    next.lab.perceptions = Object.fromEntries(Object.entries(sourceLab.perceptions || {}).slice(0, 500).filter(([id, value]) => byId(id) && value && typeof value === 'object' && !Array.isArray(value)).map(([id, value]) => [id, Object.fromEntries(Object.entries(value).filter(([key, v]) => ['0','3','5','6','7','10','14','15'].includes(key) && Number.isInteger(v) && v >= 0 && v <= 5))]));
    for (const [id, entry] of Object.entries(sourceLab.shelf || {}).slice(0, 100)) if (byId(id) && entry && typeof entry === 'object') next.lab.shelf[id] = { note: text(entry.note, 800), size: entry.size === '' || entry.size === undefined ? '' : finite(entry.size, 1, 2000, 50), remaining: entry.remaining === '' || entry.remaining === undefined ? '' : finite(entry.remaining, 0, 100) };
    next.lab.circle = (Array.isArray(sourceLab.circle) ? sourceLab.circle : []).slice(0, 100).filter(p => p && typeof p === 'object' && text(p.name, 60)).map(p => ({ id: S.uid('circle'), name: text(p.name, 60), relation: text(p.relation, 40), birthday: /^\d{4}-\d{2}-\d{2}$/.test(p.birthday) ? p.birthday : '', notes: notesFrom(p.notes), avoid: notesFrom(p.avoid), favorites: ids(p.favorites), gifts: ids(p.gifts), budget: p.budget ? finite(p.budget, 0, 100000) : '', note: text(p.note, 1000) }));
    next.lab.people = (Array.isArray(sourceLab.people) ? sourceLab.people : []).slice(0, 50).filter(p => p && typeof p === 'object' && text(p.name, 60)).map(p => ({ id: /^person-[0-9a-f-]{36}$/i.test(p.id) ? p.id : S.uid('person'), name: text(p.name, 60), handle: text(p.handle, 40).replace(/[^a-zA-Z0-9._-]/g, ''), bio: text(p.bio, 240), ratings: ratingMap(p.ratings), liked: (Array.isArray(p.liked) ? p.liked : []).filter(id => INGREDIENTS.some(n => n.id === id)), disliked: (Array.isArray(p.disliked) ? p.disliked : []).filter(id => INGREDIENTS.some(n => n.id === id)), color: /^#[a-fA-F0-9]{6}$/.test(p.color) ? p.color : '#dfe6d7' }));
    next.lab.people = [...new Map(next.lab.people.map(p => [p.id, p])).values()];
    next.lab.diary = (Array.isArray(sourceLab.diary) ? sourceLab.diary : []).slice(0, 1000).filter(e => e && byId(e.perfume) && /^\d{4}-\d{2}-\d{2}$/.test(e.date)).map(e => ({ id: S.uid('diary'), perfume: e.perfume, date: e.date, occasion: text(e.occasion, 40), time: text(e.time, 20), mood: text(e.mood, 60), note: text(e.note, 1000) }));
    next.lab.feedback = (Array.isArray(sourceLab.feedback) ? sourceLab.feedback : []).slice(0, 100).filter(f => f && byId(f.perfume) && ['like', 'dislike', 'surprise'].includes(f.value)).map(f => ({ perfume: f.perfume, value: f.value, at: new Date().toISOString() }));
    // Consent is never restored by importing a file.
    next.lab.connect = null;
    const knownPeople = new Set([...Social.people.filter(p => !p.studioCustom).map(p => p.id), ...next.lab.people.map(p => p.id)]);
    next.following = [...new Set((Array.isArray(source.following) ? source.following : []).filter(id => knownPeople.has(id)))];
    const knownPosts = new Set([...POSTS, ...Social.posts].map(p => p.id));
    next.likes = [...new Set((Array.isArray(source.likes) ? source.likes : []).filter(id => knownPosts.has(id)))];
    next.saved = [...new Set((Array.isArray(source.saved) ? source.saved : []).filter(id => knownPosts.has(id)))];
    next.comments = Object.fromEntries(Object.entries(source.comments || {}).filter(([id, comments]) => knownPosts.has(id) && Array.isArray(comments)).map(([id, comments]) => [id, comments.slice(0, 100).map(v => text(v, 600))]));
    const knownProducts = new Set(Social.allProducts().map(p => p.id));
    next.socialShelf = [...new Set((Array.isArray(source.socialShelf) ? source.socialShelf : []).filter(id => knownProducts.has(id)))];
    if (/^#[a-fA-F0-9]{6}$/.test(source.accent)) next.accent = source.accent;
    next.preferences.density = source.preferences?.density === 'Compacto' ? 'Compacto' : 'Amplo';
    next.preferences.feedMode = source.preferences?.feedMode === 'Feed' ? 'Feed' : 'Galeria';
    if (source.context && typeof source.context === 'object') next.context = { city: text(source.context.city, 60), temp: finite(source.context.temp, -10, 50, 22), occasion: text(source.context.occasion || 'Todas', 40), time: source.context.time === 'Noite' ? 'Noite' : 'Dia', environment: source.context.environment === 'Fechado' ? 'Fechado' : 'Aberto' };
    // Preserve only safe embedded photographs; never import arbitrary external image URLs.
    if (typeof source.photo === 'string' && /^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(source.photo) && source.photo.length < 2_000_000) next.photo = source.photo;
    return next;
  };

  const action = {
    'shelf-filter': b => { S.ui.shelfFilter = b.dataset.value; S.ui.selected.clear(); render(); },
    'shelf-item': b => S.quickShelf(b.dataset.id),
    'shelf-status': b => { S.commit('Experiência de prateleira atualizada', () => { S.captureShelf(b.dataset.id); S.mark(b.dataset.id, b.dataset.value); }); S.quickShelf(b.dataset.id); },
    'taste': b => { if (!byId(b.dataset.id)) return; S.commit('Impressão olfativa registrada', () => { S.captureShelf(b.dataset.id); state.ratings[b.dataset.id] = finite(b.dataset.value, 0, 10); if (Number(b.dataset.value) <= 3) S.mark(b.dataset.id, 'favorite', false); }); S.quickShelf(b.dataset.id); },
    'add-perfumes': () => S.pick('Adicionar perfumes à prateleira', [], chosen => { if (!chosen.length) { toast('Nenhum perfume selecionado.'); closeModal(); return; } S.ui.selected = new Set(chosen); S.bulk(chosen); }),
    'bulk-open': () => S.bulk(),
    'bulk-status': b => { S.commit('Experiências marcadas em lote', () => S.ui.bulk.forEach(id => S.mark(id, b.dataset.value, true))); S.ui.selected.clear(); closeModal(); render(); toast('Seleção atualizada.'); },
    'picker-done': () => { const picker = S.ui.picker; if (picker) { S.ui.picker = null; picker.done([...picker.selected]); } },
    'list-new': () => S.listDialog(),
    'list-edit': b => S.listDialog(b.dataset.name),
    'circle-new': () => S.circleForm(),
    'circle-edit': b => { const p = state.lab.circle.find(p => p.id === b.dataset.id); if (p) S.circleForm(p); },
    'circle-from': b => { const p = Social.person(b.dataset.id); if (!p) return; S.circleForm({ id: '', name: p.name + ' (exemplo)', relation: 'Amizade', notes: p.liked.map(id => INGREDIENTS.find(n => n.id === id)?.name).filter(Boolean), avoid: p.disliked.map(id => INGREDIENTS.find(n => n.id === id)?.name).filter(Boolean), favorites: Object.keys(p.ratings).filter(id => p.ratings[id] >= 8), birthday: '', budget: '', note: 'Copiado de um perfil fictício para testar. Nenhuma pessoa foi convidada.' }); },
    'circle-pick': () => { const d = S.captureCircle(); S.pick('Perfumes de referência', d.favorites, chosen => S.circleForm({ ...d, favorites: chosen })); },
    'person-new': () => S.personForm(),
    'person-edit': b => { const p = Social.person(b.dataset.id); if (p?.studioCustom) S.personForm(p); },
    'person-pick': () => { const d = S.capturePerson(); S.pick('Gostos do perfil de teste', d.favorites, chosen => S.personForm({ ...d, favorites: chosen })); },
    'gift': b => S.gift(b.dataset.id),
    'gift-save': b => { const p = state.lab.circle.find(p => p.id === b.dataset.id); if (!p || !byId(b.dataset.perfume)) return; S.commit('Ideia de presente guardada', () => p.gifts = ids([...(p.gifts || []), b.dataset.perfume])); S.gift(p.id); toast('Ideia guardada no círculo privado.'); },
    'diary-new': b => { if (forms('studio-shelf-form')) S.captureShelf(forms('studio-shelf-form').dataset.id); S.diaryForm(b.dataset.id); },
    'diary-edit': b => { const entry = state.lab.diary.find(e => e.id === b.dataset.id); if (entry) S.diaryForm('', entry); },
    'delete': b => S.confirmDelete(b.dataset.kind, b.dataset.id),
    'delete-confirm': b => { const { kind, id } = b.dataset; S.commit('Registro removido por sua escolha', () => { if (kind === 'circle') state.lab.circle = state.lab.circle.filter(p => p.id !== id); if (kind === 'diary') state.lab.diary = state.lab.diary.filter(p => p.id !== id); if (kind === 'people') { state.lab.people = state.lab.people.filter(p => p.id !== id); state.following = state.following.filter(p => p !== id); } if (kind === 'list' && !LIST_NAMES.includes(id) && id !== 'Já tive') { delete state.lists[id]; S.ui.shelfFilter = 'Todas'; } }); closeModal(); render(); toast('Registro removido. Você pode desfazer no laboratório.'); },
    'feedback': b => S.feedback(b.dataset.id, b.dataset.value),
    'discovery-level': b => { S.ui.level = b.dataset.value; render(); },
    'ingredient-like': b => { const n = INGREDIENTS.find(n => n.id === b.dataset.id); if (!n) return; S.commit('Preferência de nota atualizada', () => { const key = b.dataset.value === 'avoid' ? 'dislikedNotes' : 'likedNotes', other = key === 'likedNotes' ? 'dislikedNotes' : 'likedNotes'; state.preferences[key] = toggle(state.preferences[key] || [], n.name); state.preferences[other] = (state.preferences[other] || []).filter(v => v !== n.name); }); },
    'scenario': b => S.scenarioDialog(b.dataset.id),
    'scenario-apply': b => S.applyScenario(b.dataset.id),
    'restore': () => { let backup; try { backup = JSON.parse(localStorage.getItem('elixir-studio-backup-v3')); } catch {} if (!backup?.state) { toast('Nenhuma cópia anterior a um cenário foi encontrada.'); return; } openModal('Restaurar seu estado anterior?', `<p>O estado guardado antes do último cenário será restaurado. Você pode exportar o cenário atual antes de continuar.</p>${S.button('Restaurar cópia anterior', 'restore-confirm')}`); },
    'restore-confirm': () => { try { const backup = JSON.parse(localStorage.getItem('elixir-studio-backup-v3')); if (!backup?.state) return; S.undoState = S.snapshot(); state = backup.state; S.ensure(); if (state.lab.connect) state.lab.connect = null; persist(); S.ui.selected.clear(); closeModal(); go('lab'); toast('Seu estado anterior foi restaurado.'); } catch { toast('Não foi possível ler a cópia anterior.'); } },
    'undo': () => { if (!S.undoState) return; const previous = S.undoState; S.undoState = S.snapshot(); state = previous; S.ensure(); persist(); S.ui.selected.clear(); render(); toast('Última alteração desfeita.'); },
    'export': () => S.exportData(),
    'import': () => forms('studio-import')?.click(),
    'import-confirm': () => { if (!S.ui.imported || !S.saveBackup()) return; S.undoState = S.snapshot(); state = S.ui.imported; S.ui.imported = null; S.ensure(); persist(); S.ui.selected.clear(); S.ui.shelfFilter = 'Todas'; closeModal(); go('lab'); toast('Cópia importada. A versão anterior ficou guardada.'); },
    'connect-role': b => { S.ui.connectRole = b.dataset.value === 'atendente' ? 'atendente' : 'cliente'; render(); },
    'connect-start': () => { S.commit('Sessão Connect demonstrativa iniciada', () => { const bytes = crypto.getRandomValues(new Uint8Array(4)), code = [...bytes].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase(); state.lab.connect = { status: 'waiting', code: code.slice(0, 4) + '-' + code.slice(4), expires: Date.now() + 5 * 60000, scopes: [], store: '' }; }); },
    'connect-revoke': () => { S.commit('Sessão Connect revogada', () => state.lab.connect = { status: 'revoked', expires: Date.now(), scopes: [], code: '' }); toast('O atendimento não tem mais acesso às preferências.'); }
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-lab]'); if (!b) return; e.preventDefault(); S.ensure(); action[b.dataset.lab]?.(b); }, true);
  document.addEventListener('input', e => {
    if (e.target.id === 'studio-shelf-search') { S.ui.shelfQuery = e.target.value; forms('studio-shelf-grid').innerHTML = S.shelfGrid(); }
    if (e.target.id === 'studio-person-search') { S.ui.personQuery = e.target.value; forms('studio-people-grid').innerHTML = S.peopleGrid(); }
    if (e.target.id === 'studio-picker-search' && S.ui.picker) { S.ui.picker.query = e.target.value; forms('studio-picker-grid').innerHTML = S.pickerGrid(); }
  });
  document.addEventListener('change', async e => {
    const id = e.target.dataset.studioSelect; if (id) { if (e.target.checked) S.ui.selected.add(id); else S.ui.selected.delete(id); const count = forms('studio-selected-count'); if (count) count.textContent = '(' + S.ui.selected.size + ')'; e.target.closest('.studio-bottle')?.classList.toggle('selected', e.target.checked); }
    const pickId = e.target.dataset.studioPicker; if (pickId && S.ui.picker) { if (e.target.checked) S.ui.picker.selected.add(pickId); else S.ui.picker.selected.delete(pickId); forms('studio-picker-count').textContent = S.ui.picker.selected.size + ' selecionados'; }
    if (e.target.id === 'studio-import') {
      const file = e.target.files[0]; if (!file) return;
      if (file.size > 20 * 1024 * 1024) { toast('Escolha uma cópia de até 20 MB.'); return; }
      try { const raw = JSON.parse(await file.text()); S.ui.imported = S.validateImport(raw); openModal('Importar esta cópia?', `<p>Serão importados o perfil, preferências, prateleiras, círculo e diário. Uma cópia do estado atual será guardada antes da troca. Fotos externas, publicações antigas e autorizações Connect não são importadas.</p><p><strong>${S.ui.imported.lab.circle.length}</strong> pessoas no círculo · <strong>${S.ui.imported.lab.diary.length}</strong> memórias</p>${S.button('Guardar estado atual e importar', 'import-confirm')}`); }
      catch (error) { toast(error instanceof SyntaxError ? 'O arquivo não é um JSON válido.' : error.message || 'Não foi possível importar esta cópia.'); }
      e.target.value = '';
    }
  });
  document.addEventListener('submit', e => {
    const form = e.target; if (!form.id.startsWith('studio-')) return; e.preventDefault(); e.stopImmediatePropagation(); S.ensure(); const f = new FormData(form), v = Object.fromEntries(f);
    if (form.id === 'studio-shelf-form') { const id = form.dataset.id; S.commit('Anotação de prateleira salva', () => S.captureShelf(id)); closeModal(); render(); toast('Sua prateleira foi atualizada.'); }
    if (form.id === 'studio-bulk') { if (!Object.hasOwn(state.lists, v.list)) return; S.commit('Perfumes adicionados à prateleira', () => { state.lists[v.list] = ids([...state.lists[v.list], ...S.ui.bulk]); if (v.list === 'Favoritos') state.favorites = [...state.lists.Favoritos]; }); S.ui.selected.clear(); closeModal(); go('collection'); }
    if (form.id === 'studio-list-form') { const name = text(v.name, 60), old = form.dataset.name; if (!validName(name) || (name !== old && Object.hasOwn(state.lists, name))) { toast('Escolha um nome diferente para a prateleira.'); return; } S.commit('Prateleira ' + (old ? 'renomeada' : 'criada'), () => { state.lists[name] = old ? [...(state.lists[old] || [])] : []; if (old && old !== name && !LIST_NAMES.includes(old) && old !== 'Já tive') delete state.lists[old]; S.ui.shelfFilter = name; }); closeModal(); go('collection'); }
    if (form.id === 'studio-circle-form') { const d = S.captureCircle(), name = text(d.name, 60); if (!name) return; const record = { id: d.id || S.uid('circle'), name, relation: text(d.relation, 40), birthday: /^\d{4}-\d{2}-\d{2}$/.test(d.birthday) ? d.birthday : '', notes: notesFrom(d.notes), avoid: notesFrom(d.avoid), favorites: ids(d.favorites), budget: d.budget === '' ? '' : finite(d.budget, 0, 100000), note: text(d.note, 1000), gifts: ids(d.gifts) }; S.commit('Pessoa do círculo salva', () => { state.lab.circle = [record, ...state.lab.circle.filter(p => p.id !== record.id)]; }); S.ui.circleDraft = null; closeModal(); go('circle'); toast('Pessoa salva no círculo privado.'); }
    if (form.id === 'studio-person-form') { const d = S.capturePerson(), name = text(d.name, 60); if (!name) return; const p = { id: d.id || S.uid('person'), name, handle: text(d.handle || name, 40).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '.').toLowerCase(), bio: text(d.bio, 240), color: /^#[a-fA-F0-9]{6}$/.test(d.color) ? d.color : '#dfe6d7', ratings: Object.fromEntries(ids(d.favorites).map(id => [id, 9])), liked: ingredientIds(notesFrom(d.notes)), disliked: ingredientIds(notesFrom(d.avoid)) }; S.commit('Perfil de teste salvo', () => state.lab.people = [p, ...state.lab.people.filter(x => x.id !== p.id)]); S.ui.personDraft = null; closeModal(); go('people'); toast('Pessoa fictícia criada neste navegador.'); }
    if (form.id === 'studio-diary-form') { if (!byId(v.perfume) || !/^\d{4}-\d{2}-\d{2}$/.test(v.date)) return; const entry = { id: form.dataset.id || S.uid('diary'), perfume: v.perfume, date: v.date, occasion: text(v.occasion, 40), time: text(v.time, 20), mood: text(v.mood, 60), note: text(v.note, 1000) }; S.commit('Memória de uso guardada', () => { state.lab.diary = [entry, ...state.lab.diary.filter(x => x.id !== entry.id)]; S.mark(entry.perfume, 'tried', true); }); closeModal(); go('diary'); toast('Memória salva no seu diário.'); }
    if (form.id === 'studio-today') { S.ui.today = { occasion: v.occasion, time: v.time, intensity: v.intensity }; render(); }
    if (form.id === 'studio-consent') { const session = state.lab.connect, scopes = f.getAll('scope').filter(v => ['liked', 'avoid', 'favorites'].includes(v)); if (!session || session.status !== 'waiting' || session.expires <= Date.now()) { render(); toast('A sessão expirou. Inicie uma nova.'); return; } if (!v.consent || !scopes.length) { toast('Escolha ao menos uma informação e autorize explicitamente.'); return; } if (!['O Boticário', 'Natura', 'Multimarcas'].includes(v.store)) return; S.commit('Compartilhamento limitado autorizado pelo cliente', () => { session.status = 'active'; session.scopes = scopes; session.store = v.store; session.consentAt = new Date().toISOString(); }); }
  }, true);

  const originalProducts = Social.profileProducts.bind(Social);
  Social.profileProducts = p => p.studio ? Object.entries(p.ratings).filter(([id, r]) => byId(id) && r >= 8).slice(0, 3).map(([id]) => { const product = byId(id); return { id: 'catalog-' + id, catalog: id, name: product.name, brand: product.brand, image: product.image, family: product.family, notes: product.noteWeights.slice(0, 3).map(n => n.name), reason: 'Referência escolhida para este perfil fictício.', source: product.notes.source || educationalSource }; }) : originalProducts(p);
  // Resolve the education URL here as the view and action files are intentionally separate.
  const educationalSource = 'https://perfumesociety.org/discover-perfume/an-introduction/ingredients/';
  for (const p of S.seedPeople) { const product = Social.profileProducts(p)[0]; if (product) Social.posts.push({ id: 'studio-post-' + p.id, user: p.id, product: product.id, image: product.image, kind: 'product', when: 'Cenário de teste', text: p.bio + ' Uma indicação fictícia para explorar esse universo.', likes: 12, occasion: 'Uma nova afinidade' }); }
  const originalProfile = Social.profile.bind(Social);
  Social.profile = p => originalProfile(p).replace('Pessoa, retrato gerado por IA e preferências fictícios.', p.studio ? 'Pessoa e preferências fictícias; avatar ilustrativo com iniciais.' : 'Pessoa, retrato gerado por IA e preferências fictícios.');
  const originalHome = Social.home.bind(Social);
  Social.home = () => `<div class="studio-community-toolbar"><a class="studio-button subtle" href="#people">Encontrar e adicionar pessoas ↗</a>${S.button('Criar perfil de teste', 'person-new', '', 'subtle')}</div>` + originalHome();
  const originalShell = Social.shell.bind(Social);
  Social.shell = body => {
    const nav = [['home', 'home', 'Pessoas'], ['explore', 'search', 'Explorar'], ['collection', 'collection', 'Prateleira'], ['ingredients', 'spark', 'Notas'], ['lab', 'settings', 'Mais']];
    const dock = `<nav class="floating-dock" aria-label="Navegação principal">${nav.map(([page, ic, label]) => { const active = route.page === page || page === 'home' && ['people', 'person'].includes(route.page) || page === 'ingredients' && ['ingredient', 'family'].includes(route.page) || page === 'lab' && ['today', 'discovery', 'circle', 'diary', 'connect', 'profile'].includes(route.page); return `<button data-action="nav" data-page="${page}" ${active ? 'class="active" aria-current="page"' : ''}>${icon(ic)}<span>${label}</span>${active ? '<i></i>' : ''}</button>`; }).join('')}</nav>`;
    return originalShell(body).replace('</header>', '</header>' + S.menu()).replace(/<nav class="floating-dock"[\s\S]*?<\/nav>/, dock);
  };
  const originalIngredient = IngredientLibrary.detail.bind(IngredientLibrary);
  IngredientLibrary.detail = id => {
    const n = INGREDIENTS.find(n => n.id === id); if (!n) return originalIngredient(id);
    const tools = `<section class="studio-ingredient-preferences"><p>Como essa nota conversa com você?</p><button data-lab="ingredient-like" data-id="${n.id}" data-value="like" aria-pressed="${(state.preferences.likedNotes || []).includes(n.name)}">Gosto de sentir</button><button data-lab="ingredient-like" data-id="${n.id}" data-value="avoid" aria-pressed="${(state.preferences.dislikedNotes || []).includes(n.name)}">Prefiro evitar</button><p>Uma preferência não garante como a nota será percebida em uma composição.</p></section>`;
    let html = originalIngredient(id).replace('<div class="section-title">', tools + '<div class="section-title">');
    if (n.studio) html += `<p class="studio-footnote">Imagem ilustrativa gerada com IA. Nota não é sinônimo de matéria-prima natural nem comprova presença ou intensidade em um perfume. <a href="${educationalSource}" target="_blank" rel="noopener">Referência educativa ↗</a></p>`;
    return html;
  };
  const originalCard = card;
  card = p => originalCard(p).replace('</article>', `<button class="studio-organize-card" data-lab="shelf-item" data-id="${p.id}">Organizar na prateleira ${icon('collection')}</button></article>`);
  const originalRender = render;
  const views = { lab: () => S.hub(), collection: () => S.collection(), people: () => S.people(), circle: () => S.circle(), discovery: () => S.discovery(), today: () => S.today(), diary: () => S.diary(), connect: () => S.connect() };
  render = () => {
    S.ensure(); S.syncPeople(); document.documentElement.dataset.studio = 'true';
    if (!Minimal.flow.active && state.onboarded && views[route.page]) { Premium.palette(); Motion.paint(shell(views[route.page]())); document.title = BRAND.name + ' · ' + ({ lab: 'Laboratório', collection: 'Sua prateleira', people: 'Pessoas', circle: 'Meu círculo', discovery: 'Fora da bolha', today: 'Usar hoje', diary: 'Diário olfativo', connect: 'Connect demonstrativo' }[route.page] || 'Descobrir'); }
    else originalRender();
    document.querySelectorAll('.studio-shortcuts a').forEach(a => { if (a.getAttribute('href') === '#' + route.page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  };
  function updateSessionClock() {
    const session = S.ensure().connect; if (!session || !['active', 'waiting'].includes(session.status)) return;
    const remaining = Math.max(0, session.expires - Date.now());
    document.querySelectorAll('[data-session-clock]').forEach(el => el.textContent = Math.floor(remaining / 60000) + ':' + String(Math.floor(remaining % 60000 / 1000)).padStart(2, '0'));
    if (!remaining && route.page === 'connect' && !document.querySelector('.studio-connect-start')) render();
  }
  setInterval(updateSessionClock, 1000); document.addEventListener('visibilitychange', updateSessionClock);
  // The original renderer keeps its dock mounted. Mount the new shell once so
  // labels, destinations and shortcuts cannot retain the previous edition.
  document.getElementById('app').replaceChildren();
  Motion.key = null;
  readRoute();
})();
