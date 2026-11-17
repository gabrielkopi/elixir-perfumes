import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const home = new URL('../', import.meta.url);
const root = new URL('../', home);
const legacy = createContext({
  console,
  document: { documentElement: { dataset: { brand: 'elixir' } }, addEventListener() {} },
});

// Load the existing catalog in the order used by the Elixir application.
for (const name of [
  'brand', 'data', 'catalog-100', 'notes', 'catalog-br', 'image-credits', 'catalog-photos',
  'colors', 'ingredients', 'brand-tiers', 'catalog-studio', 'editions', 'community',
]) {
  const path = new URL(`assets/js/data/${name}.js`, root);
  runInContext(readFileSync(path, 'utf8'), legacy, { filename: path.pathname });
}
const { perfumes, dimensions, imageCredits, illustrations, noteGroups, noteAliases, translations, studioIngredients } = runInContext(
  `({
    perfumes: PERFUMES, dimensions: DIMENSIONS, imageCredits: IMAGE_CREDITS,
    illustrations: INGREDIENTS, noteGroups: NOTE_GROUPS, noteAliases: INGREDIENT_ALIASES,
    translations: NoteModel.dictionary, studioIngredients: CATALOG_STUDIO.ingredients,
  })`,
  legacy,
);
const originalImages = JSON.parse(readFileSync(new URL('assets/products/catalog-images.json', root), 'utf8'));
const curated = JSON.parse(readFileSync(new URL('src/data/catalog-curation.json', home), 'utf8'));

const unique = (values) => [...new Set(values.filter((value) => typeof value === 'string' && value.trim()))];
const pyramidKeys = ['top', 'heart', 'base'];

function sourceType(source, label = '') {
  if (/scento\.com/i.test(source) || /catálogo de referência|revendedor/i.test(label)) return 'catálogo';
  if (/marca|fonte oficial|camadas publicadas/i.test(label)) return 'marca';
  return source ? 'referência' : undefined;
}

function toHomeRecord(perfume) {
  const { id, name, brand, concentration, family, image, scene } = perfume;
  const noteData = perfume.notes ?? {};
  const pyramid = Object.fromEntries(pyramidKeys.map((key) => [key, unique(noteData[key] ?? [])]));
  const notes = unique([...pyramidKeys.flatMap((key) => pyramid[key]), ...(noteData.highlights ?? [])]);
  const accords = notes.length ? (perfume.vector ?? [])
    .map((strength, index) => ({ strength, name: dimensions[index] }))
    .filter(({ strength, name }) => strength >= 0.35 && name)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 4)
    .map(({ name }) => name) : [];
  const source = /^https?:\/\//i.test(noteData.source ?? '') ? noteData.source : undefined;
  const legacyImage = image?.startsWith('assets/') && existsSync(new URL(image, root)) ? image : undefined;
  const credit = originalImages[id]?.source;
  return {
    id, name, brand, concentration, family, notes,
    ...(pyramidKeys.some((key) => pyramid[key].length) && { pyramid }),
    ...(accords.length && { accords, accordSource: 'editorial' }),
    source,
    sourceType: sourceType(source ?? '', [noteData.sourceLabel, noteData.reliability].filter(Boolean).join(' ')),
    sourceLabel: noteData.sourceLabel || undefined,
    scene,
    legacyImage,
    imageSource: imageCredits[id]?.page || (/^https?:\/\//i.test(credit ?? '') ? credit : undefined),
  };
}

const catalog = new Map(perfumes.map((perfume) => [perfume.id, toHomeRecord(perfume)]));
for (const item of curated) {
  const base = catalog.get(item.id);
  const record = { ...base, ...item };
  if (item.notes && !item.pyramid) delete record.pyramid;
  if (item.pyramid) record.notes = unique([...pyramidKeys.flatMap((key) => item.pyramid[key] ?? []), ...(item.notes ?? [])]);
  if (item.accords) record.accordSource = 'editorial';
  if (item.source) {
    record.sourceType = item.sourceType ?? 'marca';
    record.sourceLabel = item.sourceLabel ?? 'Marca · página oficial';
  }
  for (const image of [record.image, record.editorialImage].filter(Boolean)) {
    if (!existsSync(new URL(`public/${image}`, home))) {
      throw new Error(`Imagem local do catálogo não encontrada: ${image}`);
    }
  }
  if (!record.id || !record.name || !record.brand || !Array.isArray(record.notes)) {
    throw new Error(`Ficha incompleta: ${item.id}`);
  }
  catalog.set(item.id, record);
}

const items = [...catalog.values()];
const output = `[\n${items.map((item) => `  ${JSON.stringify(item)}`).join(',\n')}\n]\n`;
writeFileSync(new URL('src/data/catalog.json', home), output);
console.log(`${items.length} fragrâncias, ${items.filter(({ brand }) => brand === 'O Boticário').length} do Boticário.`);

// Studio ingredients were grouped by model dimension. Convert those dimensions to library groups.
const groupsByDimension = [0, 0, 0, 2, 6, 1, 8, 3, 7, 4, 4, 7, 5, 4, 3, 3, 7, 3, 3, 0, 7, 3, 7, 7];
const studioIds = new Set(studioIngredients.map(({ id }) => id));
const noteRecords = illustrations.map(({ id, name, description, family: originalFamily, image }) => {
  if (!existsSync(new URL(image, root))) throw new Error(`Ilustração de nota não encontrada: ${image}`);
  const family = studioIds.has(id) ? groupsByDimension[originalFamily] : originalFamily;
  if (!noteGroups[family]) throw new Error(`Grupo de notas inválido: ${id}`);
  return { id, name, description, family, group: noteGroups[family], image, aliases: unique(noteAliases[id] ?? []) };
});
const library = { groups: noteGroups, illustrations: noteRecords, translations };
const libraryOutput = `{
  "groups": ${JSON.stringify(library.groups)},
  "illustrations": [\n${library.illustrations.map((item) => `    ${JSON.stringify(item)}`).join(',\n')}\n  ],
  "translations": ${JSON.stringify(library.translations)}
}\n`;
writeFileSync(new URL('src/data/note-library.json', home), libraryOutput);
console.log(`${noteRecords.length} ilustrações olfativas em ${noteGroups.length} grupos.`);
