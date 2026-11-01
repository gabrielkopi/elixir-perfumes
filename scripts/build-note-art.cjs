const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const art = JSON.parse(fs.readFileSync(path.join(root, 'assets/notes-hd/manifest.json'), 'utf8'));
const responsivePath = path.join(root, 'assets/notes-hd/responsive.json');
const responsive = fs.existsSync(responsivePath) ? JSON.parse(fs.readFileSync(responsivePath, 'utf8')) : {};
for (const [name, file] of Object.entries(art)) {
  if (!file.startsWith('assets/notes-hd/') || !fs.existsSync(path.join(root, file))) {
    throw new Error(`Missing artwork for ${name}: ${file}`);
  }
}
for (const variants of Object.values(responsive)) {
  for (const variant of variants) {
    if (!fs.existsSync(path.join(root, variant.src))) throw new Error(`Missing responsive image: ${variant.src}`);
  }
}
const code = `/* Generated from assets/notes-hd/manifest.json. */
(() => {
  const art = ${JSON.stringify(art, null, 2)};
  Object.assign(ElixirAtelier.art, art);
  ElixirAtelier.responsive = ${JSON.stringify(responsive, null, 2)};
  const family = IngredientLibrary.families.length;
  IngredientLibrary.families.push('Notas do atelier');
  for (const [name, image] of Object.entries(art)) {
    const existing = INGREDIENTS.find(i => ElixirAtelier.key(i.name) === ElixirAtelier.key(name));
    if (existing) existing.image = image;
    else INGREDIENTS.push({
      id: 'hd-' + NoteModel.normalize(name), name, image, family, studio: true,
      description: 'Ilustração da nota ou acorde ' + name + '. Uma referência visual, sem comprovar matéria-prima natural ou intensidade no perfume.'
    });
  }
  ElixirAtelier.refreshImages();
  render();
})();
`;
const target = path.join(root, 'assets/atelier-art.js');
fs.writeFileSync(target + '.tmp', code);
fs.renameSync(target + '.tmp', target);
process.stdout.write(`${Object.keys(art).length} note illustrations registered.\n`);
