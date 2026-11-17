import library from './note-library.json' with { type: 'json' };

export const noteGroups = library.groups;
export const noteIllustrations = library.illustrations;

const normalize = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const byExactId = new Map(noteIllustrations.map((note) => [note.id, note]));
const byId = new Map(noteIllustrations.map((note) => [normalize(note.id), note]));
const byName = new Map();
const byAlias = new Map();

for (const note of noteIllustrations) {
  const name = normalize(note.name);
  if (!byName.has(name)) byName.set(name, note);
  for (const alias of note.aliases) {
    const key = normalize(alias);
    if (key && !byAlias.has(key)) byAlias.set(key, note);
  }
}

export const notes = [...byName.values()];

const translated = new Map(Object.entries(library.translations)
  .map(([name, translation]) => [normalize(name), normalize(translation)]));

// These names keep their published wording. The shared artwork illustrates the related note or accord.
const visualAliases = {
  'acordes-criativos': ['Acorde Cachoeira Salto Morato', 'Laurissilva Forest', 'Acorde Ice Wine', 'Acorde Código Secreto', 'Acorde Profundo Uvas Nerello'],
  'hd-aquaticaccord': ['Notas aquosas', 'Headspace Queda d’Água', 'Notas ozônicas'],
  'hd-acordecitrico': ['Notas cítricas'],
  'hd-notasamadeiradas': ['Complexo amadeirado', 'Madeiras brancas', 'Madeiras claras', 'Madeiras secas', 'Madeira de teca', 'Georgywood', 'Ébano', 'Amyris'],
  'hd-notasfrutadas': ['Frutas secas', 'Acorde de frutas secas'],
  'hd-notasdoces': ['Acorde gourmand', 'Nota gourmand', 'Macaron'],
  'hd-aromatico': ['Notas aromáticas', 'Notas herbais'],
  'hd-notasflorais': ['Acorde flor orvalhada', 'Acorde Crystal Flower'],
  'hd-notasespeciadas': ['Blend de especiarias (cravo, canela, pimenta, noz-moscada)'],
  'hd-notasverdes': ['Grama cortada', 'Folhas úmidas de orvalho', 'Verde folha'],
  'hd-bambu': ['Acorde Bambu', 'Folhas de bambu'],
  'hd-carnation': ['Cravo (flor)'],
  'hd-lilac': ['Lilás', 'Lilás negra'],
  'hd-bay': ['Louro'],
  'hd-immortelle': ['Sempre-viva'],
  'hd-chamomile': ['Camomila'],
  'hd-tarragon': ['Estragão'],
  'hd-mushroom': ['Cogumelo'],
  'hd-mahogany': ['Mogno'],
  'hd-pinheiro': ['Agulha de pinheiro'],
  'hd-heliotrope': ['Heliotrópio'],
  'hd-hawthorn': ['Espinheiro-alvar'],
  'hd-redcurrant': ['Groselha vermelha'],
  'hd-ladano': ['Resinoide de ládano'],
  'hd-orquidea': ['Orquídea chocolate'],
  'hd-chapreto': ['Chá preto do Ceilão'],
  'hd-rum': ['Absoluto de rum', 'Acorde de rum'],
  'hd-folhasdecedro': ['Folha de cedro'],
  'resinas-balsamos': ['Resina de estoraque', 'Resinas balsâmicas'],
  'terroso': ['Cipriol'],
  'amendoa': ['Amêndoas'],
  'pera': ['Pera portuguesa'],
  'couro': ['Couro de madeira'],
  'limao-siciliano': ['Limão Primofiore'],
  'lavanda': ['Lavanda francesa'],
  'rosa': ['Rosa turca', 'Rosa centifolia'],
  'vetiver': ['Vetiver de Java'],
  'petitgrain': ['Folha de laranjeira', 'Folhas de laranjeira'],
  'tabaco': ['Absoluto de folha de tabaco', 'Folha de tabaco'],
  'whiskey': ['Acorde de whisky', 'Acorde de whiskey'],
  'caramelo': ['Caramelo toffee'],
  'acucar': ['Açúcar mascavo'],
  'baunilha': ['Baunilha CO₂', 'Creme de baunilha'],
};
const byVisualAlias = new Map(Object.entries(visualAliases).flatMap(([id, labels]) =>
  labels.map((label) => [normalize(label), byId.get(normalize(id))])));

export function findNote(value) {
  const key = normalize(value);
  const translation = translated.get(key);
  return byExactId.get(value) ?? byName.get(key) ?? byId.get(key) ?? byVisualAlias.get(key) ?? byAlias.get(key)
    ?? byName.get(translation) ?? byId.get(translation) ?? byAlias.get(translation);
}
