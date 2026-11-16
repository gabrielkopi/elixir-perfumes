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
    },
  });
  const png = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG indisponível.')), 'image/png');
  });
  const filename = String(name || 'perfil').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'perfil';
  return new File([png], 'elixir-' + filename + '.png', { type: 'image/png' });
}
