const ACCOUNTS_KEY = 'elixir-accounts-v1';
const SANDBOX_KEY = 'elixir-presentation-sandbox-v1';
const PRESET_ACCOUNTS = ['gabriel', 'vinicius', 'amanda', 'helo', 'theo'];

// Reuse the Elixir catalog and its note ranking when Perfil runs within Elixir.
const CATALOG_SCRIPTS = [
  'data/data.js',
  'data/catalog-100.js',
  'data/notes.js',
  'data/catalog-br.js',
  'data/ingredients.js',
  'data/catalog-studio.js',
  'engine/engine.js',
  'engine/taste-engine.js',
  'engine/olfactory-map.js',
];

const VECTOR_FAMILIES = [
  'citrus', 'fresh', 'fresh', 'woody', 'woody', 'floral', 'fresh', 'gourmand',
  'fresh', 'amber', 'amber', 'amber', 'amber', 'amber', 'amber', 'fresh',
  'floral', 'gourmand', 'amber', 'fresh', 'woody', 'gourmand', 'fresh', 'amber',
];

let catalogLoad;
let ingredientIndex;

function array(value) {
  return Array.isArray(value) ? value : [];
}

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalize(name) {
  return String(name ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');
}

function activeStorageKey(storage) {
  if (new URLSearchParams(location.search).has('sandbox')) return SANDBOX_KEY;

  let registry;
  try {
    registry = JSON.parse(storage.getItem(ACCOUNTS_KEY));
  } catch {
    registry = null;
  }
  const active = registry?.active;
  const registered = PRESET_ACCOUNTS.includes(active) || array(registry?.list).some(account => account?.id === active);
  const valid = registered && /^[a-z0-9-]{2,24}$/.test(active);
  return valid && active !== 'gabriel' ? `elixir-acct-${active}` : 'elixir-demo-v1';
}

function readState() {
  try {
    const storage = window.localStorage;
    return object(JSON.parse(storage.getItem(activeStorageKey(storage))));
  } catch {
    return {};
  }
}

export function readElixirIdentity(base) {
  const { profile } = readState();
  if (typeof profile?.name !== 'string' || !profile.name.trim()) return null;
  const name = profile.name.trim().slice(0, 42);
  const handle = typeof profile.handle === 'string' ? profile.handle.replace(/[\s@]/g, '').slice(0, 32) : '';
  const bio = typeof profile.bio === 'string' ? profile.bio.slice(0, 128) : '';
  let photo = '';
  if (typeof profile.photo === 'string' && profile.photo) {
    try {
      const url = new URL(profile.photo, base);
      if (url.origin === location.origin || /^data:image\/(?:png|jpe?g|webp);base64,/i.test(profile.photo)) photo = url.href;
    } catch { /* An invalid portrait can be replaced from the editor. */ }
  }
  return { name, handle, bio, photo, originalPhoto: photo, exampleId: null, verified: false, filter: profile.photoBW ? 'mono' : 'original' };
}

function catalogReady() {
  return typeof OMap !== 'undefined' && typeof byId === 'function' && typeof Engine !== 'undefined';
}

function ensureCatalog() {
  if (catalogLoad) return catalogLoad;
  if (catalogReady()) return Promise.resolve(true);

  const match = window.location.pathname.match(/^(.*)\/Perfil\/(?:dist\/)?(?:index\.html)?$/i);
  if (!match || !/^https?:$/.test(window.location.protocol)) return Promise.resolve(false);
  const base = new URL(window.location.origin);
  base.pathname = `${match[1]}/assets/js/`;

  // Classic scripts with async=false download in parallel and execute in insertion order.
  catalogLoad = Promise.all(CATALOG_SCRIPTS.map(filename => new Promise(resolve => {
    const script = document.createElement('script');
    script.async = false;
    script.src = new URL(filename, base).href;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.append(script);
  }))).then(results => results.every(Boolean) && catalogReady());

  return catalogLoad;
}

function canonicalName(input) {
  const name = typeof input === 'string' ? input.trim() : '';
  if (!name || typeof INGREDIENTS === 'undefined') return name;
  if (!ingredientIndex) {
    ingredientIndex = new Map();
    for (const ingredient of INGREDIENTS) {
      ingredientIndex.set(normalize(ingredient.name), ingredient.name);
      ingredientIndex.set(normalize(ingredient.id), ingredient.name);
    }
    if (typeof INGREDIENT_ALIASES !== 'undefined') {
      for (const [id, aliases] of Object.entries(INGREDIENT_ALIASES)) {
        const canonical = ingredientIndex.get(normalize(id));
        if (!canonical) continue;
        for (const alias of aliases) {
          const key = normalize(alias);
          if (!ingredientIndex.has(key)) ingredientIndex.set(key, canonical);
        }
      }
    }
  }
  return ingredientIndex.get(normalize(name)) ?? name;
}

function noteFamily(name) {
  if (typeof NoteModel === 'undefined') return undefined;
  const vector = NoteModel.vector(name);
  const strength = Math.max(...vector);
  return strength > 0 ? VECTOR_FAMILIES[vector.indexOf(strength)] : undefined;
}

function noteEntry(input, uses) {
  const name = canonicalName(input);
  const family = name && noteFamily(name);
  return family ? { name, uses, family } : { name, uses };
}

function countNotes(records) {
  const tally = new Map();
  for (const notes of records) {
    const unique = new Map();
    for (const { name: label, weight = 1 } of notes) {
      const name = canonicalName(label);
      const key = normalize(name);
      if (key && (!unique.has(key) || unique.get(key).weight < weight)) unique.set(key, { name, weight });
    }
    for (const [key, { name, weight }] of unique) {
      const match = tally.get(key) ?? { name, uses: 0, weight: 0 };
      match.uses += 1;
      match.weight += weight;
      tally.set(key, match);
    }
  }
  return [...tally.values()]
    .sort((first, second) => second.uses - first.uses || second.weight - first.weight || first.name.localeCompare(second.name, 'pt-BR'))
    .map(({ name, uses }) => ({ name, uses }));
}

function wornNotes(state) {
  const days = new Set();
  const records = [];
  for (const entry of array(state.sotd)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry?.date) || typeof entry?.id !== 'string' || days.has(entry.date)) continue;
    const perfume = byId(entry.id);
    const notes = array(perfume?.noteWeights);
    if (!notes.length) continue;
    days.add(entry.date);
    records.push(notes);
  }
  return countNotes(records);
}

function firstThree(notes) {
  const ranked = new Map();
  for (const note of notes) {
    const key = normalize(note.name);
    if (key && !ranked.has(key)) ranked.set(key, note);
    if (ranked.size === 3) break;
  }
  return [...ranked.values()].map(({ name, uses }) => noteEntry(name, uses));
}

export async function readElixirNotes() {
  if (typeof window === 'undefined') return [];

  let state = readState();
  const hasEvidence = array(state.sotd).length || Object.keys(object(state.ratings)).length ||
    array(state.profile?.pinned).length || Object.values(object(state.shelf)).includes('have');

  let fromDiary = [];
  let inferred = [];
  let favorites = [];
  if (hasEvidence && await ensureCatalog()) {
    // The active account may have changed while the catalog was downloading.
    state = readState();
    fromDiary = wornNotes(state).slice(0, 3);
    if (fromDiary.length < 3) {
      inferred = OMap.notes({ ...state, pinned: array(state.profile?.pinned) }).notes
        .map(note => ({ name: canonicalName(note.name), uses: note.n }));
      favorites = Engine.favoriteNotes(object(state.ratings), {
        likedNotes: array(state.preferences?.likedNotes),
        dislikedNotes: array(state.preferences?.dislikedNotes),
      }).map(note => ({ name: canonicalName(note), uses: 0 }));
    }
  }

  const perceptions = countNotes(Object.values(object(state.reviews)).map(review =>
    array(review?.perceived).map(name => ({ name }))));
  const preferences = array(state.preferences?.likedNotes).map(note => ({ name: canonicalName(note), uses: 0 }));
  return firstThree([...fromDiary, ...inferred, ...perceptions, ...preferences, ...favorites]);
}

export function subscribeElixirNotes(onUpdate) {
  if (typeof window === 'undefined') return () => {};

  let request = 0;
  let lastResult;
  const refresh = async () => {
    const currentRequest = ++request;
    const notes = await readElixirNotes().catch(() => []);
    const result = JSON.stringify(notes);
    if (currentRequest !== request || result === lastResult) return;
    lastResult = result;
    onUpdate(notes);
  };

  const refreshStoredNotes = event => {
    if (event.key === null || event.key === ACCOUNTS_KEY || event.key === SANDBOX_KEY ||
        event.key === 'elixir-demo-v1' || event.key.startsWith('elixir-acct-')) refresh();
  };
  const refreshWhenVisible = () => {
    if (document.visibilityState === 'visible') refresh();
  };

  window.addEventListener('storage', refreshStoredNotes);
  window.addEventListener('focus', refresh);
  window.addEventListener('pageshow', refresh);
  document.addEventListener('visibilitychange', refreshWhenVisible);
  refresh();

  return () => {
    request += 1;
    window.removeEventListener('storage', refreshStoredNotes);
    window.removeEventListener('focus', refresh);
    window.removeEventListener('pageshow', refresh);
    document.removeEventListener('visibilitychange', refreshWhenVisible);
  };
}
