"""Build responsive note assets from preserved originals; requires Pillow.

Usage: python scripts/build-note-variants.py SOURCE_INDEX INSTALL_RECORDS [--complete]
Source files remain untouched. The website does not require Python at runtime.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import os
import sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
sources = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
records = json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))
sources.update({name: item['source'] for name, item in records.items()})
manifest = json.loads((root / 'assets/notes-hd/manifest.json').read_text(encoding='utf-8'))
output = root / 'assets/notes-hd/responsive.json'
previous = json.loads(output.read_text(encoding='utf-8')) if output.exists() else {}
missing = [name for name in manifest if name not in sources]
if '--complete' in sys.argv:
    assert not missing, f'Missing originals: {missing}'

def convert(item):
    name, file = item
    if name not in sources:
        return None
    if file in previous and all((root / v['src']).is_file() for v in previous[file]):
        return file, previous[file]
    original = Image.open(sources[name]).convert('RGBA')
    original.load()
    assert min(original.size) >= 640, name
    assert original.getchannel('A').getextrema()[0] == 0, name
    variants = []
    for folder, size, quality in [('thumbs', 256, 92), ('retina', 1280, 96)]:
        image = original.copy()
        image.thumbnail((size, size), Image.Resampling.LANCZOS)
        target = root / 'assets/notes-hd' / folder / Path(file).name
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = target.with_suffix('.tmp')
        image.save(temporary, 'WEBP', quality=quality, method=4)
        check = Image.open(temporary)
        check.load()
        assert check.mode == 'RGBA' and check.size == image.size, name
        os.replace(temporary, target)
        variants.append({'src': target.relative_to(root).as_posix(), 'width': image.width})
    variants.insert(1, {'src': file, 'width': Image.open(root / file).width})
    return file, variants

with ThreadPoolExecutor(max_workers=4) as pool:
    responsive = dict(item for item in pool.map(convert, manifest.items()) if item)
temporary = output.with_suffix('.tmp')
temporary.write_text(json.dumps(responsive, ensure_ascii=False, indent=2), encoding='utf-8')
os.replace(temporary, output)
print(json.dumps({'responsive': len(responsive), 'missing_originals': missing}))
