import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const home = fileURLToPath(new URL('..', import.meta.url));
const source = resolve(home, 'dist');
const pages = resolve(home, '..');
const bundle = resolve(pages, 'studio', 'bundle');

await mkdir(bundle, { recursive: true });
await cp(resolve(source, 'studio'), resolve(pages, 'studio'), { recursive: true });
const index = await readFile(resolve(source, 'index.html'), 'utf8');
await writeFile(resolve(pages, 'index.html'), index.trimEnd() + '\n');

const current = new Set(await readdir(resolve(source, 'studio', 'bundle')));
for (const file of await readdir(bundle, { withFileTypes: true })) {
  if (file.isFile() && !current.has(file.name) && /^(index|catalog)-[\w-]+\.(js|css)$/.test(file.name)) {
    await rm(resolve(bundle, file.name));
  }
}
