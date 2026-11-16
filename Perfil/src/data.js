export const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

export const families = [
  { id: 'woody', name: 'Amadeirada', palette: 'santal', notes: ['bergamot', 'cedar', 'amber'] },
  { id: 'floral', name: 'Floral', palette: 'blush', notes: ['jasmine', 'iris', 'bergamot'] },
  { id: 'amber', name: 'Ambarada', palette: 'noir', notes: ['amber', 'vanilla', 'sandalwood'] },
  { id: 'fresh', name: 'Verde', palette: 'herbal', notes: ['tea', 'fig', 'bergamot'] },
  { id: 'citrus', name: 'Cítrica', palette: 'salt', notes: ['bergamot', 'tea', 'jasmine'] },
  { id: 'gourmand', name: 'Gourmand', palette: 'blush', notes: ['vanilla', 'amber', 'fig'] },
];

export const palettes = {
  santal: { name: 'Sândalo', paper: '#f3e6bd', text: '#352319', muted: '#675442', accent: '#8e4c35', photoBg: '#bc9566', line: '#cdbb95' },
  blush: { name: 'Íris', paper: '#e9d8d1', text: '#452a31', muted: '#73535b', accent: '#925262', photoBg: '#ba8b92', line: '#c8b0af' },
  herbal: { name: 'Folha', paper: '#e1e5ce', text: '#253624', muted: '#4c6246', accent: '#496530', photoBg: '#98a784', line: '#aeb796' },
  noir: { name: 'Resina', paper: '#30221f', text: '#f7e6c7', muted: '#d1b8aa', accent: '#ffc57e', photoBg: '#725148', line: '#776059' },
  salt: { name: 'Névoa', paper: '#e3e8eb', text: '#22323a', muted: '#46606a', accent: '#375d6d', photoBg: '#9daebd', line: '#a9bdc1' },
  ink: { name: 'Carvão', paper: '#222221', text: '#f2eee5', muted: '#c6c1b8', accent: '#d2caa7', photoBg: '#686764', line: '#64605a' },
};

function note(id, name, family, paper, ink) {
  return { id, name, family, paper, ink, art: asset(`notes/${id}.png`) };
}

export const notes = [
  note('bergamot', 'Bergamota', 'citrus', '#eddfa4', '#504314'),
  note('cedar', 'Cedro', 'woody', '#dfd8b2', '#39452c'),
  note('amber', 'Âmbar', 'amber', '#e9c292', '#674026'),
  note('jasmine', 'Jasmim', 'floral', '#ebddd0', '#785041'),
  note('iris', 'Íris', 'floral', '#ded3e3', '#684c70'),
  note('vanilla', 'Baunilha', 'gourmand', '#ebd6ad', '#76532a'),
  note('sandalwood', 'Sândalo', 'woody', '#dfc4a6', '#704633'),
  note('fig', 'Figo', 'fresh', '#e0ced6', '#673953'),
  note('tea', 'Chá verde', 'fresh', '#d5dfbc', '#455835'),
];

const noteById = new Map(notes.map((item) => [item.id, item]));
const familyArt = { woody: 'cedar', floral: 'jasmine', amber: 'amber', fresh: 'tea', citrus: 'bergamot', gourmand: 'vanilla' };
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function resolveNote(record) {
  if (noteById.has(record.id)) return { ...noteById.get(record.id), uses: record.uses };
  const identity = normalize(record.name);
  const match = notes.find((item) => normalize(item.name) === identity);
  if (match) return { ...match, uses: record.uses };
  const fallback = noteById.get(familyArt[record.family]) || noteById.get('cedar');
  return { ...fallback, id: `elixir-${identity}`, name: record.name, uses: record.uses };
}

const demo = (id, name, handle, family, bio, extras = {}) => ({ id, name, handle, family, bio, photo: asset(`photos/${id}.jpg`), ...extras });

export const demos = [
  demo('isabelly', 'Isabelly', 'isabelly', 'woody', 'Entre a luz baixa e a pele.\nGosto de madeiras que ficam.', { filter: 'mono', verified: true, tone: 'P&B' }),
  demo('jayha', 'Jayha', 'jayha', 'fresh', 'Entre o verde e o silêncio.', { filter: 'original', tone: 'Verde' }),
  demo('miguel', 'Miguel', 'miguel', 'amber', 'Resinas, especiarias e um pouco de noite.', { filter: 'warm', tone: 'Âmbar' }),
  demo('flavia', 'Flávia', 'flavia', 'floral', 'Janelas abertas, jasmim no ar.', { filter: 'original', tone: 'Floral' }),
  demo('gabriel', 'Gabriel', 'gabrielkopi', 'citrus', 'Um dia de cada vez, uma nota de cada vez.', { filter: 'mono', tone: 'Cítrico' }),
  demo('saulo', 'Saulo', 'saulo', 'gourmand', 'Baunilha seca e memória de fim de tarde.', { filter: 'mono', tone: 'Gourmand' }),
];

export function familyUses(id) {
  const family = families.find((entry) => entry.id === id) || families[0];
  return Object.fromEntries(family.notes.map((noteId, index) => [noteId, [12, 9, 6][index]]));
}

export function createProfile(example = demos[0]) {
  const family = families.find(({ id }) => id === example.family);
  return {
    name: example.name, handle: example.handle, bio: example.bio, verified: !!example.verified,
    photo: example.photo, originalPhoto: example.photo, transparent: false, originalTransparent: false, exampleId: example.id,
    family: family.id, uses: familyUses(family.id), noteSource: 'studio', paletteId: 'auto', customColor: '#f3e6bd', photoColor: '',
    format: 'landscape', side: 'right', treatment: 'frame', motif: 'botanical', filter: example.filter,
    zoom: 1, offsetX: 0, offsetY: 0, type: 'serif', grain: true,
  };
}

export function getTopNotes(profile, elixirNotes) {
  if (profile.noteSource === 'elixir' && elixirNotes.length) return elixirNotes.slice(0, 3).map(resolveNote);
  const used = notes.filter(({ id }) => profile.uses[id] > 0);
  used.sort((a, b) => profile.uses[b.id] - profile.uses[a.id]);
  return used.slice(0, 3).map((item) => ({ ...item, uses: profile.uses[item.id] }));
}

export function getPalette(profile, topNotes) {
  const currentFamily = profile.noteSource === 'elixir' ? topNotes[0]?.family : profile.family;
  const family = families.find(({ id }) => id === currentFamily) || families[0];
  let palette = palettes[profile.paletteId] || palettes[family.palette];
  if (profile.paletteId === 'custom') {
    const channels = profile.customColor.match(/[\da-f]{2}/gi).map((value) => Number.parseInt(value, 16));
    const luma = (channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722) / 255;
    const base = luma > 0.55 ? palettes.santal : palettes.ink;
    palette = { ...base, paper: profile.customColor };
  }
  return profile.photoColor ? { ...palette, photoBg: profile.photoColor } : palette;
}
