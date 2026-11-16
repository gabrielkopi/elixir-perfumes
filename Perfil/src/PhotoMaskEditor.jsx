import { useEffect, useRef, useState } from 'react';
import { loadPhoto, makeCanvas } from './photo';
import './photo-mask.css';

function buildMask(original, current) {
  const { naturalWidth: width, naturalHeight: height } = original;
  const mask = makeCanvas(width, height);
  const context = mask.getContext('2d', { willReadFrequently: true });

  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  if (!current) return mask;

  const source = makeCanvas(width, height).getContext('2d', { willReadFrequently: true });
  source.drawImage(original, 0, 0);
  const originalPixels = source.getImageData(0, 0, width, height);
  source.clearRect(0, 0, width, height);
  source.drawImage(current, 0, 0, width, height);
  const currentPixels = source.getImageData(0, 0, width, height);
  const maskPixels = context.getImageData(0, 0, width, height);

  for (let index = 3; index < maskPixels.data.length; index += 4) {
    const alpha = originalPixels.data[index];
    if (alpha) maskPixels.data[index] = Math.min(255, currentPixels.data[index] * 255 / alpha);
  }

  context.putImageData(maskPixels, 0, 0);
  return mask;
}

function renderPhoto(canvas, image, mask, showOriginal = false) {
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  if (!showOriginal) {
    context.save();
    context.globalCompositeOperation = 'destination-in';
    context.drawImage(mask, 0, 0);
    context.restore();
  }
}

export default function PhotoMaskEditor({ original, current, onApply, onClose }) {
  const dialogRef = useRef(null);
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const editRef = useRef(null);
  const strokeRef = useRef(null);
  const frameRef = useRef(0);
  const [brushMode, setBrushMode] = useState('erase');
  const [brushSize, setBrushSize] = useState(8);
  const [showOriginal, setShowOriginal] = useState(false);
  const [ratio, setRatio] = useState(1);
  const [ready, setReady] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  useEffect(() => {
    let active = true;
    setReady(false);
    setCanUndo(false);
    setShowOriginal(false);
    setError('');
    Promise.all([loadPhoto(original), current && current !== original ? loadPhoto(current) : null])
      .then(([image, edited]) => {
        if (!active) return;
        const mask = buildMask(image, edited);
        editRef.current = { image, mask, history: [] };
        const canvas = canvasRef.current;
        canvas.width = mask.width;
        canvas.height = mask.height;
        setRatio(mask.width / mask.height);
        renderPhoto(canvas, image, mask);
        setReady(true);
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      });

    return () => {
      active = false;
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      editRef.current = null;
      strokeRef.current = null;
    };
  }, [original, current]);

  function drawPreview(originalOnly = showOriginal) {
    const edit = editRef.current;
    if (edit) renderPhoto(canvasRef.current, edit.image, edit.mask, originalOnly);
  }

  function queuePreview() {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      drawPreview(false);
    });
  }

  function paint(event, start) {
    const { mask } = editRef.current;
    const context = mask.getContext('2d');
    const stroke = strokeRef.current;
    const x = (event.clientX - stroke.bounds.left) * mask.width / stroke.bounds.width;
    const y = (event.clientY - stroke.bounds.top) * mask.height / stroke.bounds.height;
    const diameter = Math.min(mask.width, mask.height) * stroke.size / 100;

    context.save();
    context.globalCompositeOperation = stroke.mode === 'erase' ? 'destination-out' : 'source-over';
    context.fillStyle = '#fff';
    context.strokeStyle = '#fff';
    context.beginPath();
    if (start) {
      context.arc(x, y, diameter / 2, 0, Math.PI * 2);
      context.fill();
    } else {
      context.lineWidth = diameter;
      context.lineCap = 'round';
      context.moveTo(stroke.x, stroke.y);
      context.lineTo(x, y);
      context.stroke();
    }
    context.restore();

    stroke.x = x;
    stroke.y = y;
    queuePreview();
  }

  function startStroke(event) {
    if (!ready || showOriginal || event.button !== 0 || strokeRef.current) return;
    const { mask, history } = editRef.current;
    const context = mask.getContext('2d');
    const maxHistory = Math.max(2, Math.min(8, Math.floor(24_000_000 / (4 * mask.width * mask.height))));
    if (history.length === maxHistory) history.shift();
    history.push(context.getImageData(0, 0, mask.width, mask.height));
    setCanUndo(true);

    event.currentTarget.setPointerCapture(event.pointerId);
    strokeRef.current = {
      id: event.pointerId,
      bounds: event.currentTarget.getBoundingClientRect(),
      mode: brushMode,
      size: brushSize,
    };
    paint(event, true);
  }

  function movePointer(event) {
    const cursor = cursorRef.current;
    if (!showOriginal && event.pointerType === 'mouse') {
      const bounds = event.currentTarget.getBoundingClientRect();
      const diameter = Math.min(bounds.width, bounds.height) * brushSize / 100;
      cursor.style.width = `${diameter}px`;
      cursor.style.height = `${diameter}px`;
      cursor.style.left = `${event.clientX - bounds.left}px`;
      cursor.style.top = `${event.clientY - bounds.top}px`;
      cursor.hidden = false;
    }
    if (strokeRef.current?.id === event.pointerId) paint(event, false);
  }

  function finishStroke(event) {
    if (strokeRef.current?.id === event.pointerId) strokeRef.current = null;
  }

  function undo() {
    const { history, mask } = editRef.current;
    const previous = history.pop();
    if (previous) mask.getContext('2d').putImageData(previous, 0, 0);
    setCanUndo(Boolean(history.length));
    drawPreview();
  }

  function toggleOriginal() {
    const next = !showOriginal;
    cursorRef.current.hidden = true;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    setShowOriginal(next);
    drawPreview(next);
  }

  function apply() {
    drawPreview(false);
    onApply(canvasRef.current.toDataURL('image/png'));
  }

  return (
    <dialog
      ref={dialogRef}
      className="mask-dialog"
      aria-labelledby="mask-heading"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="mask-panel">
        <header className="mask-header">
          <div>
            <h2 id="mask-heading">Refinar recorte</h2>
            <p>Passe o pincel sobre a foto para apagar ou recuperar partes da imagem.</p>
          </div>
          <button className="mask-close" type="button" aria-label="Fechar recorte" onClick={onClose}>×</button>
        </header>

        {error && <p className="mask-status" role="alert">{error}</p>}
        {!ready && !error && <p className="mask-status" role="status">Abrindo imagem…</p>}

        <div className="mask-preview" hidden={!ready}>
          <div className="mask-canvas-wrap" style={{ '--mask-image-ratio': ratio }}>
            <canvas
              ref={canvasRef}
              className="mask-canvas"
              aria-label="Foto para ajuste com pincel"
              data-original={showOriginal}
              onPointerDown={startStroke}
              onPointerMove={movePointer}
              onPointerLeave={() => { cursorRef.current.hidden = true; }}
              onPointerUp={finishStroke}
              onPointerCancel={finishStroke}
              onLostPointerCapture={finishStroke}
            />
            <span ref={cursorRef} className="mask-cursor" hidden aria-hidden="true" />
          </div>
        </div>

        <div className="mask-controls">
          <div className="mask-brushes" role="group" aria-label="Tipo de pincel">
            <button type="button" aria-pressed={brushMode === 'erase'} onClick={() => setBrushMode('erase')}>Apagar</button>
            <button type="button" aria-pressed={brushMode === 'restore'} onClick={() => setBrushMode('restore')}>Restaurar</button>
          </div>
          <label className="mask-size">
            Tamanho
            <input type="range" min="1" max="28" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} />
          </label>
          <button type="button" disabled={!canUndo} onClick={undo}>Desfazer</button>
        </div>

        <footer className="mask-footer">
          <button className="mask-compare" type="button" disabled={!ready} aria-pressed={showOriginal} onClick={toggleOriginal}>Ver original</button>
          <button className="mask-apply" type="button" disabled={!ready} onClick={apply}>Aplicar recorte</button>
        </footer>
      </div>
    </dialog>
  );
}
