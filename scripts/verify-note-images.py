"""Decode every responsive note image and verify real sizes and alpha with Pillow."""
from pathlib import Path
import json
import os
from PIL import Image

root = Path(__file__).resolve().parents[1]
folder = root / 'assets/notes-hd'
manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
responsive = json.loads((folder / 'responsive.json').read_text(encoding='utf-8'))
assert set(responsive) == set(manifest.values()), 'Incomplete responsive image coverage'
files = set()
dimensions = []
for file in manifest.values():
    variants = responsive[file]
    assert len(variants) == 3, file
    widths = [item['width'] for item in variants]
    assert widths[0] < widths[1] < widths[2], file
    for item in variants:
        path = root / item['src']
        if item['src'] in files:
            continue
        image = Image.open(path)
        image.load()
        assert image.format == 'WEBP' and image.mode == 'RGBA', item['src']
        assert image.width == item['width'], item['src']
        low, high = image.getchannel('A').getextrema()
        assert low == 0 and high > 0, item['src']
        files.add(item['src'])
        dimensions.append(image.size)
report = {
    'note_art_entries': len(manifest),
    'unique_main_images': len(set(manifest.values())),
    'decoded_responsive_files': len(files),
    'transparent_files': len(files),
    'smallest_width': min(size[0] for size in dimensions),
    'largest_width': max(size[0] for size in dimensions),
    'total_webp_bytes': sum((root / file).stat().st_size for file in files),
    'errors': []
}
output = root / 'docs/qa-note-images.json'
temporary = output.with_suffix('.tmp')
temporary.write_text(json.dumps(report, indent=2), encoding='utf-8')
os.replace(temporary, output)
print(json.dumps(report))
