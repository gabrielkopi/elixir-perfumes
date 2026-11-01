const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = __dirname, errors = [], animations = [], mediaListeners = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => errors.push(error.message));
const html = fs.readFileSync(path.join(root, 'elixir.html'), 'utf8');
const dom = new JSDOM(html, { url: 'https://elixir.test/elixir.html#explore', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole });
const win = dom.window, doc = win.document, ctx = dom.getInternalVMContext();
Object.defineProperty(win, 'crypto', { value: require('node:crypto').webcrypto });
win.scrollTo = () => {};
const motionMedia = { matches: false, addEventListener(type, listener) { mediaListeners.push(listener); } };
win.matchMedia = media => media.includes('reduced-motion') ? motionMedia : { matches: false, addEventListener() {} };
win.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
win.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new win.Event('close')); };
win.Element.prototype.animate = function (frames, options) {
  let resolve, reject;
  const animation = {
    target: this, frames, options, cancelled: false,
    finished: new Promise((yes, no) => { resolve = yes; reject = no; }),
    cancel() { this.cancelled = true; reject(new Error('cancelled')); },
    finish() { resolve(); }
  };
  animations.push(animation); return animation;
};
const run = source => vm.runInContext(source, ctx);
for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) run(fs.readFileSync(path.join(root, src.split('?')[0]), 'utf8'));
const wait = () => new Promise(resolve => setTimeout(resolve, 12));
const query = selector => { const el = doc.querySelector(selector); assert(el, selector); return el; };
const page = name => run('route={page:' + JSON.stringify(name) + '};render();');
const click = async selector => { query(selector).click(); await wait(); };
const results = [];
async function check(name, test) { await test(); results.push(name); }

(async () => {
  await wait();
  await check('Search renders its results once per input and keeps focus and caret', async () => {
    page('explore');
    run('globalThis.savedCatalog=catalog;globalThis.catalogCalls=0;catalog=()=>{globalThis.catalogCalls++;return globalThis.savedCatalog();};');
    const input = query('#catalog-search'); input.focus(); input.value = 'wepink figo'; input.setSelectionRange(6, 6);
    input.dispatchEvent(new win.Event('input', { bubbles: true }));
    assert.equal(run('globalThis.catalogCalls'), 1); assert.equal(doc.activeElement, input); assert.equal(input.selectionStart, 6);
    assert(query('#catalog-grid').textContent.includes('Heaven Santal & Fig'));
    input.value='Vibrato';input.dispatchEvent(new win.Event('input',{bubbles:true}));
    assert.equal(run('globalThis.catalogCalls'),2);assert.equal(query('.scent-results').textContent,'1 perfume encontrado');
    input.value='wepink figo';input.dispatchEvent(new win.Event('input',{bubbles:true}));
    run('catalog=globalThis.savedCatalog;');
  });
  await check('Theme changes preserve the page, input, result nodes and focused control', async () => {
    const grid = query('#catalog-grid'), input = query('#catalog-search'), main = query('#main'), button = query('[data-v5=theme]');
    const previous = doc.documentElement.dataset.theme; button.focus();
    await click('[data-v5=theme]');
    assert.equal(query('#main'), main); assert.equal(query('#catalog-grid'), grid); assert.equal(query('#catalog-search'), input);
    assert.equal(input.value, 'wepink figo'); assert.equal(doc.activeElement, button); assert.notEqual(doc.documentElement.dataset.theme, previous);
  });
  await check('Catalog filter disclosure keeps search outside and preserves its open state across filters', async () => {
    run('ElixirCatalog.filtersOpen=false;'); page('explore');
    assert(!query('.scent-filter-panel').open); assert.equal(query('#catalog-search').closest('details'), null);
    const panel = query('.scent-filter-panel'); panel.open = true; panel.dispatchEvent(new win.Event('toggle'));
    await click('[data-scent=brand][data-value=WePink]');
    assert(query('.scent-filter-panel').open); assert(query('.scent-filter-panel>summary').textContent.includes('WePink'));
  });
  await check('Alchemy updates selections and results without remounting notes or search', async () => {
    const V = win.ElixirAtelier; V.search = 'Gengibre'; V.selected.clear(); V.excluded.clear(); V.mode = 'all'; page('alchemy');
    const input = query('#v5-note-search'), picker = query('#v5-note-picker'), note = query('.v5-note-pick'); note.focus();
    await click('.v5-note-pick');
    assert.equal(query('#v5-note-search'), input); assert.equal(query('#v5-note-picker'), picker); assert.equal(query('.v5-note-pick'), note);
    assert.equal(doc.activeElement, note); assert.equal(note.getAttribute('aria-pressed'), 'true'); assert(V.selected.has('Gengibre'));
    assert(query('#v5-mix-results').textContent.includes('Vibrato'));
    const chip = query('.v5-mix-chips button'); chip.focus(); await click('.v5-mix-chips button');
    assert.equal(doc.activeElement, note); assert.equal(note.getAttribute('aria-pressed'), 'false'); assert.equal(V.selected.size, 0);
  });
  await check('Alchemy exclusion and any/all controls retain identity and valid matching', async () => {
    const V = win.ElixirAtelier; V.selected = new Set(['Gengibre', 'Alecrim']); V.updateMix();
    const select = query('#v5-exclude'); select.value = 'Bergamota'; select.dispatchEvent(new win.Event('change', { bubbles: true }));
    assert.equal(query('#v5-exclude'), select); assert.equal(select.value, ''); assert(V.excluded.has('Bergamota'));
    assert(!V.results().some(p => p.id === 'sospiro-vibrato'));
    const remove = query('.v5-excluded button'); remove.focus(); await click('.v5-excluded button'); assert.equal(doc.activeElement, select);
    assert(V.results().some(p => p.id === 'sospiro-vibrato'));
    const any = query('[data-v5=mode][data-value=any]'); any.focus(); await click('[data-v5=mode][data-value=any]');
    assert.equal(query('[data-v5=mode][data-value=any]'), any); assert.equal(doc.activeElement, any); assert.equal(any.getAttribute('aria-pressed'), 'true');
  });
  await check('A newer animation cancels an older one on the same element', async () => {
    const first = run("Motion.reveal(document.querySelector('#v5-mix-results'))");
    const second = run("Motion.reveal(document.querySelector('#v5-mix-results'))");
    assert(first.cancelled); assert(!second.cancelled); second.finish(); await wait();
    assert(!run("Motion.active.has(document.querySelector('#v5-mix-results'))"));
  });
  await check('Reopening a closing dialog cannot dismiss the new content; close restores focus', async () => {
    const trigger = query('[data-v5=theme]'); trigger.focus(); run("openModal('Primeira janela','<p>Primeiro conteúdo</p>');Motion.close();");
    const oldClose = run('Motion.closing'); run("openModal('Segunda janela','<p>Conteúdo atual</p>');"); oldClose.finish(); await wait();
    assert(oldClose.cancelled); assert(query('#modal').open); assert.equal(query('#modal-title').textContent, 'Segunda janela');
    assert.equal(query('#modal').getAttribute('aria-labelledby'), 'modal-title');
    run('Motion.close();'); run('Motion.closing').finish(); await wait(); assert(!query('#modal').open); assert.equal(doc.activeElement, trigger);
  });
  await check('Reduced motion cancels active effects and safely completes a pending close', async () => {
    run("openModal('Janela','<p>Conteúdo</p>');Motion.close();");
    motionMedia.matches = true; mediaListeners.forEach(listener => listener({ matches: true })); await wait();
    assert(!query('#modal').open); assert.equal(run('Motion.active.size'), 0);
    const count = animations.length; run("openModal('Sem movimento','<p>Conteúdo</p>');Motion.close();");
    assert.equal(animations.length, count); assert(!query('#modal').open);
  });
  await check('Navigation keeps the dock mounted and restores the next heading focus', async () => {
    const dock = query('.floating-dock'); page('ingredients'); assert.equal(query('.floating-dock'), dock); assert.equal(doc.activeElement, query('#main h1'));
    page('explore'); const button = query('#catalog-grid [data-action=favorite]'), id = button.dataset.id; button.focus();
    await click('#catalog-grid [data-action=favorite]'); assert.equal(doc.activeElement.dataset.action, 'favorite'); assert.equal(doc.activeElement.dataset.id, id);
  });
  await check('Discovery choices preserve their shell and focus; step changes focus the heading', async () => {
    run('state=defaults();Minimal.begin();'); const flow = query('.discovery-flow'), header = query('.flow-top'), footer = query('.flow-footer');
    const choice = query('[data-action=discovery-style][data-id=citrus]'); choice.focus(); await click('[data-action=discovery-style][data-id=citrus]');
    assert.equal(query('.discovery-flow'), flow); assert.equal(query('.flow-top'), header); assert.equal(query('.flow-footer'), footer);
    assert.equal(doc.activeElement.dataset.id, 'citrus'); assert.equal(doc.activeElement.getAttribute('aria-pressed'), 'true');
    await click('[data-action=discovery-next]'); assert.equal(doc.activeElement, query('.flow-content h1')); assert.equal(errors.length, 0, errors.join('\n'));
  });
  await check('A discovery rating returns focus to its fragrance after updating the flow', async () => {
    await click('[data-action=discovery-next]');
    const trigger=query('[data-action=discovery-perfume]'), id=trigger.dataset.id;trigger.focus();trigger.click();await wait();
    await click('[data-action=discovery-rating][data-value="8"]');
    assert(!query('#modal').open);assert.equal(doc.activeElement.dataset.action,'discovery-perfume');assert.equal(doc.activeElement.dataset.id,id);
  });
  process.stdout.write(JSON.stringify({ passed: results.length, checks: results, runtimeErrors: errors }, null, 2) + '\n');
  dom.window.close();
})().catch(error => { process.stderr.write(error.stack + '\n'); dom.window.close(); process.exitCode = 1; });
