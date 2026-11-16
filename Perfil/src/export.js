import html2canvas from 'html2canvas-pro';

export async function exportCard(node, name) {
  await document.fonts.ready;
  await Promise.all(Array.from(node.querySelectorAll('img'), (image) => image.decode()));
  const canvas = await html2canvas(node, {
    scale: 1800 / node.getBoundingClientRect().width,
    backgroundColor: null,
    logging: false,
    useCORS: true,
    onclone(document) {
      const style = document.createElement('style');
      style.textContent = '.elx-profile-card, .elx-profile-card * { transition: none !important; animation: none !important; }';
      document.head.append(style);
      const portrait = document.querySelector('.elx-profile-card__portrait');
      if (portrait) {
        const box = portrait.getBoundingClientRect();
        const parent = portrait.parentElement.getBoundingClientRect();
        Object.assign(portrait.style, {
          inset: 'auto', left: `${box.left - parent.left}px`, top: `${box.top - parent.top}px`,
          width: `${box.width}px`, height: `${box.height}px`, transform: 'none',
        });
      }
    },
  });
  const png = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG indisponível.')), 'image/png');
  });
  const filename = String(name || 'perfil').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'perfil';
  return new File([png], 'elixir-' + filename + '.png', { type: 'image/png' });
}
