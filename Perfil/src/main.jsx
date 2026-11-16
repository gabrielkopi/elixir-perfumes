import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Check, Circle,
  Crop, Droplet, Flower2, ImagePlus, LayoutPanelLeft, Maximize,
  Minus, Monitor, Moon, Orbit, Palette, Plus, RectangleHorizontal, RectangleVertical,
  RotateCcw, ScanLine, Share, Smartphone, Sparkles, Square, Sun, Upload, User, X,
} from 'lucide-react';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '@fontsource/instrument-serif/latin-ext-400.css';
import '@fontsource/instrument-serif/latin-ext-400-italic.css';
import { createProfile, demos, families, familyUses, getPalette, getTopNotes, notes, palettes } from './data';
import { readElixirIdentity, subscribeElixirNotes } from './elixir';
import { preparePhoto, removePhotoBackground } from './photo';
import PhotoMaskEditor from './PhotoMaskEditor';
import ProfileCard from './ProfileCard';
import { loadDraft, saveDraft } from './storage';
import './style.css';

const formats = [
  ['landscape', 'Horizontal', RectangleHorizontal],
  ['square', 'Quadrado', Square],
  ['portrait', 'Vertical', RectangleVertical],
];
const sideOptions = [['left', 'Esquerda', LayoutPanelLeft], ['right', 'Direita', LayoutPanelLeft]];
const treatments = [['frame', 'Moldura', Square], ['circle', 'Círculo', Circle], ['cutout', 'Recorte', ScanLine], ['bleed', 'Foto inteira', Maximize]];
const motifs = [['botanical', 'Botânico', Flower2], ['orbit', 'Órbita', Orbit], ['stars', 'Estrelas', Sparkles], ['none', 'Nenhum', X]];
const filters = [['original', 'Original'], ['mono', 'P&B'], ['warm', 'Quente']];
const fonts = [['serif', 'Clássica'], ['sans', 'Moderna'], ['mono', 'Mono']];
const tabs = [['profile', 'Perfil', User], ['style', 'Estilo', Palette], ['notes', 'Notas', Flower2]];
const devices = [['desktop', 'Computador', Monitor], ['ios', 'iOS', Smartphone]];
const params = new URLSearchParams(location.search);
const baseLink = new URL(import.meta.env.DEV ? 'https://gabrielkopi.github.io/elixir-perfumes/' : '../../', document.baseURI);
baseLink.hash = 'profile';
if (params.has('sandbox')) baseLink.searchParams.set('sandbox', '');

function initialProfile() {
  const profile = createProfile();
  if (params.get('origem') !== 'perfil') return profile;
  return { ...profile, ...readElixirIdentity(baseLink), noteSource: 'elixir' };
}

function Mark({ size = 28 }) {
  return <svg viewBox="0 0 32 34" width={size} height={size} fill="none" aria-hidden="true">
    <path d="M16 1C15 12 7 16 7 24a9 9 0 0 0 18 0c0-8-8-12-9-23Z" stroke="currentColor" strokeWidth="1.25"/>
    <path d="M16 12c0 7-4 10-10 11 6 1 10 4 10 10 0-6 4-9 10-10-6-1-10-4-10-11Z" stroke="currentColor" strokeWidth="1.1"/>
  </svg>;
}

function Choice({ items, value, onChange, label, className = '' }) {
  return <div className={'choice ' + className} role="group" aria-label={label}>
    {items.map(([id, name, Icon]) => <button key={id} type="button" title={name} aria-label={name} aria-pressed={value === id}
      onClick={() => onChange(id)} className={value === id ? 'chosen' : ''}>
      {Icon && <Icon className={label === 'Lado do retrato' && id === 'right' ? 'mirror' : ''} size={16} strokeWidth={1.6}/>}
      <span>{name}</span>
    </button>)}
  </div>;
}

function Toggle({ checked, onChange, label, icon: Icon }) {
  return <button type="button" role="switch" aria-checked={checked} className="toggle-row" onClick={() => onChange(!checked)}>
    <span>{Icon && <Icon size={16} strokeWidth={1.7} />} {label}</span>
    <span className="toggle-track" aria-hidden="true"><i/></span>
  </button>;
}

function Range({ label, value, min, max, step = 1, onChange, display = value }) {
  return <label className="range-line">
    <span>{label}<output>{display}</output></span>
    <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))}/>
  </label>;
}

function PhotoEditor({ profile, update, chooseFile, autoRemove, editMask, busy }) {
  return <>
    <div className="section-head"><h2>Retrato</h2></div>
    <div className="portrait-control">
      {profile.photo ? <img src={profile.photo} alt="" /> : <ImagePlus size={20}/>}
      <div><strong>{profile.exampleId ? 'Retrato de exemplo' : 'Seu retrato'}</strong><small>{profile.transparent ? 'Com transparência' : profile.photo ? 'Imagem original' : 'Nenhuma foto'}</small></div>
      <button className="button small secondary" type="button" onClick={chooseFile}><Upload size={14}/> {profile.photo ? 'Trocar' : 'Enviar'}</button>
    </div>
    <div className="photo-actions">
      <button className="button secondary" type="button" disabled={busy || !profile.originalPhoto} onClick={autoRemove}><Sparkles size={15}/>{busy ? 'Recortando…' : 'Remover fundo'}</button>
      <button className="button secondary" type="button" disabled={busy || !profile.originalPhoto} onClick={editMask}><Crop size={15}/> Ajustar recorte</button>
    </div>
    <details className="photo-details">
      <summary>Enquadramento e filtro</summary>
      <div className="details-body">
        <Choice items={treatments} value={profile.treatment} label="Tratamento da foto" onChange={(treatment) => update({ treatment })} />
        <Choice items={filters} value={profile.filter} label="Filtro" onChange={(filter) => update({ filter })} />
        <Range label="Zoom" value={profile.zoom} min={1} max={2.8} step={0.01} display={Math.round(profile.zoom * 100) + '%'} onChange={(zoom) => update({ zoom })}/>
        <Range label="Posição horizontal" value={profile.offsetX} min={-45} max={45} onChange={(offsetX) => update({ offsetX })}/>
        <Range label="Posição vertical" value={profile.offsetY} min={-45} max={45} onChange={(offsetY) => update({ offsetY })}/>
        <button className="text-button" type="button" disabled={busy} onClick={() => update({
          photo: profile.originalPhoto, transparent: profile.originalTransparent ?? false,
          treatment: profile.originalTransparent ? 'cutout' : 'frame', filter: 'original', zoom: 1, offsetX: 0, offsetY: 0,
        })}><RotateCcw size={14}/> Restaurar foto original</button>
      </div>
    </details>
  </>;
}

function IdentityEditor({ profile, update, ...photoEditor }) {
  return <>
    <div className="section-head"><h2>Identidade</h2></div>
    <div className="fields">
      <label>Nome<input autoComplete="off" maxLength={42} value={profile.name} onChange={(event) => update({ name: event.target.value })}/></label>
      <label>Usuário<span className="handle-field"><span>@</span><input autoComplete="off" autoCapitalize="none" spellCheck="false" maxLength={32} value={profile.handle} onChange={(event) => update({ handle: event.target.value.replace(/[\s@]/g, '') })}/></span></label>
      <label>Bio<textarea rows={2} maxLength={128} value={profile.bio} onChange={(event) => update({ bio: event.target.value })} /></label>
    </div>
    <Toggle checked={profile.verified} onChange={(verified) => update({ verified })} label="Selo de verificado" icon={BadgeCheck}/>
    <div className="panel-divider"/>
    <PhotoEditor profile={profile} update={update} {...photoEditor}/>
  </>;
}

function StyleEditor({ profile, update, palette }) {
  return <>
    <div className="section-head"><h2>Composição</h2></div>
    <div className="field-stack">
      <span>Posição do retrato</span><Choice items={sideOptions} value={profile.side} onChange={(side) => update({ side })} label="Lado do retrato"/>
      <span>Forma do retrato</span><Choice items={treatments} value={profile.treatment} onChange={(treatment) => update({ treatment })} label="Forma do retrato"/>
      <span>Tipografia</span><Choice items={fonts} value={profile.type} onChange={(type) => update({ type })} label="Tipografia"/>
    </div>
    <div className="panel-divider"/>
    <div className="section-head"><h2>Cor e textura</h2></div>
    <div className="swatches" role="group" aria-label="Paleta do card">
      <button type="button" title="Paleta da família olfativa" aria-label="Paleta da família olfativa" aria-pressed={profile.paletteId === 'auto'} onClick={() => update({ paletteId: 'auto' })}><Sparkles size={15}/></button>
      {Object.entries(palettes).map(([id, palette]) => <button type="button" key={id} title={palette.name} aria-label={palette.name} aria-pressed={profile.paletteId === id}
        style={{ background: palette.paper, color: palette.text }} onClick={() => update({ paletteId: id })}>{profile.paletteId === id && <Check size={15}/>}</button>)}
      <label className="custom-swatch" title="Cor personalizada"><Droplet size={15}/><input type="color" aria-label="Cor personalizada" value={profile.customColor} onChange={(event) => update({ paletteId: 'custom', customColor: event.target.value })}/></label>
    </div>
    <div className="field-stack motif-picker">
      <span>Arte de fundo</span><Choice items={motifs} value={profile.motif} onChange={(motif) => update({ motif })} label="Arte de fundo"/>
    </div>
    <div className="portrait-color-row">
      <label>Cor atrás do retrato<input type="color" value={palette.photoBg} onChange={(event) => update({ photoColor: event.target.value })}/></label>
      {profile.photoColor && <button type="button" className="text-button" onClick={() => update({ photoColor: '' })}>Usar paleta</button>}
    </div>
    <Toggle checked={profile.grain} onChange={(grain) => update({ grain })} label="Textura de papel" icon={ScanLine}/>
  </>;
}

function NotesEditor({ profile, update, topNotes, elixirNotes }) {
  function count(id, amount) {
    update((current) => ({ uses: { ...current.uses, [id]: Math.min(999, Math.max(0, (current.uses[id] || 0) + amount)) } }));
  }

  return <>
    <div className="section-head"><h2>Assinatura olfativa</h2></div>
    <Choice items={[['studio', 'Neste ateliê'], ['elixir', 'Meu Elixir']]} value={profile.noteSource} onChange={(noteSource) => update({ noteSource })} label="Origem das notas"/>
    {profile.noteSource === 'elixir' && <p className="hint">{elixirNotes.length ? 'O card acompanha suas notas do Elixir.' : 'Assim que houver notas no seu Elixir, elas aparecem aqui. Por enquanto, o card usa as notas do ateliê.'}</p>}
    {(profile.noteSource === 'studio' || !elixirNotes.length) && <>
      <label className="family-field">Família olfativa<select value={profile.family} onChange={(event) => {
        const family = event.target.value;
        update({ family, uses: familyUses(family), paletteId: 'auto' });
      }}>{families.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}</select></label>
      <p className="hint">Registre os usos por nota. As três com mais usos aparecem no card.</p>
    </>}
    <div className="note-list">
      {(profile.noteSource === 'elixir' && elixirNotes.length ? topNotes : notes).map((note) => {
        const live = profile.noteSource === 'elixir' && elixirNotes.length > 0;
        const rank = topNotes.findIndex(({ id }) => id === note.id);
        const uses = live ? note.uses : profile.uses[note.id] || 0;
        return <div className="note-line" key={note.id}>
          <span className="note-thumb" style={{ background: note.paper }}><img src={note.art} alt=""/></span>
          <span className="note-name">{note.name}{rank >= 0 && <small>{rank + 1}º no card</small>}</span>
          {!live && <div className="counter"><button type="button" aria-label={'Retirar uso de ' + note.name} disabled={!uses} onClick={() => count(note.id, -1)}><Minus size={14}/></button>
            <span aria-label={uses + ' usos'}>{uses}</span><button type="button" aria-label={'Registrar uso de ' + note.name} disabled={uses >= 999} onClick={() => count(note.id, 1)}><Plus size={14}/></button></div>}
        </div>;
      })}
    </div>
  </>;
}

function Gallery({ active, onSelect }) {
  const scroller = useRef(null);
  function scroll(direction) {
    scroller.current.scrollBy({ left: direction * scroller.current.clientWidth * 0.65, behavior: 'smooth' });
  }
  return <section className="gallery" aria-labelledby="gallery-title">
    <div className="gallery-head">
      <div><h2 id="gallery-title">Retratos de exemplo</h2><p>Experimente uma assinatura diferente.</p></div>
      <div className="gallery-nav">
        <button type="button" className="icon-button" aria-label="Retratos anteriores" onClick={() => scroll(-1)}><ArrowLeft size={15}/></button>
        <button type="button" className="icon-button" aria-label="Próximos retratos" onClick={() => scroll(1)}><ArrowRight size={15}/></button>
      </div>
    </div>
    <div ref={scroller} className="gallery-grid">
      {demos.map((demo) => <button className="gallery-card" key={demo.id} type="button" onClick={() => onSelect(demo)} aria-pressed={demo.id === active}>
        <div className="gallery-photo"><img src={demo.photo} alt="" loading="lazy"/><span>{demo.id === active ? <Check size={15}/> : <ArrowUpRight size={15}/>}</span></div>
        <strong>{demo.name}</strong><small>{families.find(({ id }) => id === demo.family).name}</small>
      </button>)}
    </div>
  </section>;
}

function App() {
  const [profile, setProfile] = useState(initialProfile);
  const [tab, setTab] = useState('profile');
  const [device, setDevice] = useState('desktop');
  const [theme, setTheme] = useState('light');
  const [elixirNotes, setElixirNotes] = useState([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [mask, setMask] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [shareFile, setShareFile] = useState(null);
  const card = useRef(null);
  const fileInput = useRef(null);
  const revision = useRef(0);
  const photoJob = useRef(0);
  const shareDialog = useRef(null);
  const notesForCard = getTopNotes(profile, elixirNotes);
  const palette = getPalette(profile, notesForCard);

  useEffect(() => {
    let mounted = true;
    loadDraft().then((draft) => {
      if (!mounted || revision.current || !draft?.profile) return;
      setProfile({ ...createProfile(), ...draft.profile });
      setTheme(draft.theme === 'dark' ? 'dark' : 'light');
      if (draft.device === 'ios') setDevice('ios');
    }).catch(() => {}).finally(() => mounted && setReady(true));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveDraft({ profile, theme, device }).catch(() => setNotice('O navegador não conseguiu salvar este rascunho.'));
  }, [profile, theme, device, ready]);

  useEffect(() => {
    if (profile.noteSource !== 'elixir') return;
    return subscribeElixirNotes(setElixirNotes);
  }, [profile.noteSource]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4200);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#1b1b18' : '#f7f6f2';
  }, [theme]);

  useEffect(() => {
    if (shareFile) shareDialog.current.showModal();
  }, [shareFile]);

  function update(patch) {
    revision.current++;
    setProfile((current) => ({ ...current, ...(typeof patch === 'function' ? patch(current) : patch) }));
  }

  function selectExample(example) {
    photoJob.current++;
    setBusy(false);
    setMask(false);
    update(createProfile(example));
    setNotice('Retrato de ' + example.name + ' carregado.');
  }

  async function upload(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const job = ++photoJob.current;
    setBusy(false);
    try {
      const prepared = await preparePhoto(file);
      if (job !== photoJob.current) return;
      update({ photo: prepared.source, originalPhoto: prepared.source, exampleId: null, transparent: prepared.transparent,
        originalTransparent: prepared.transparent, treatment: prepared.transparent ? 'cutout' : 'frame', zoom: 1, offsetX: 0, offsetY: 0, filter: 'original' });
      setNotice('Retrato carregado.');
    } catch (error) {
      if (job === photoJob.current) setNotice(error.message || 'Não foi possível abrir a imagem.');
    }
  }

  async function autoRemove() {
    const job = ++photoJob.current;
    setBusy(true);
    try {
      const photo = await removePhotoBackground(profile.originalPhoto);
      if (job !== photoJob.current) return;
      update({ photo, transparent: true, treatment: 'cutout' });
      setNotice('Fundo removido. Você pode refinar o recorte.');
    } catch (error) {
      if (job === photoJob.current) setNotice(error.message || 'O recorte automático falhou. Experimente o ajuste manual.');
    } finally {
      if (job === photoJob.current) setBusy(false);
    }
  }

  function download(file) {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function exportPng() {
    const node = card.current;
    if (!node) return;
    setExportBusy(true);
    try {
      const { exportCard } = await import('./export');
      const file = await exportCard(node, profile.handle || profile.name);
      if (device === 'ios' || navigator.maxTouchPoints > 1 && /iPhone|iPad|Macintosh/.test(navigator.userAgent)) {
        setShareFile(file);
      } else {
        download(file);
        setNotice('Seu card foi exportado em PNG.');
      }
    } catch (error) {
      console.error(error);
      setNotice('Não foi possível exportar o card. Tente novamente.');
    } finally {
      setExportBusy(false);
    }
  }

  return <>
    <header className="app-header">
      <div className="header-inner">
        <a href={baseLink.href} className="brand" aria-label="Voltar ao Elixir"><Mark size={27}/><span>elixir.</span></a>
        <div className="header-separator"/>
        <span className="header-context">Ateliê de perfil</span>
        <div className="header-actions">
          <button type="button" className="icon-button theme-button" aria-label={theme === 'dark' ? 'Usar modo claro' : 'Usar modo escuro'}
            onClick={() => { revision.current++; setTheme(theme === 'dark' ? 'light' : 'dark'); }}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>
          <button type="button" className="button primary export-button" disabled={exportBusy} onClick={exportPng}><ArrowDownToLine size={17}/> {exportBusy ? 'Exportando…' : 'Exportar PNG'}</button>
        </div>
      </div>
    </header>

    <main className="workspace">
      <div className="page-head">
        <div><h1>Ateliê de perfil<span>.</span></h1><p>Um retrato em três notas.</p></div>
        <a className="back-link" href={baseLink.href}>Voltar ao Elixir <ArrowUpRight size={15}/></a>
      </div>
      <div className="workspace-grid">
        <section className="canvas-column" aria-label="Prévia do perfil">
          <div className="canvas-panel">
            <div className="canvas-toolbar">
              <div className="live-label"><span/> Prévia ao vivo</div>
              <Choice items={devices} value={device} onChange={(next) => { revision.current++; setDevice(next); }} label="Dispositivo de prévia" className="device-choice"/>
            </div>
            <div className={'artboard ' + (device === 'ios' ? 'artboard-ios' : '')}>
              <div className="artboard-frame">
                <div className="phone-bar" aria-hidden="true"><i/></div>
                <div className={'card-host card-host-' + profile.format}>
                  <ProfileCard ref={card} profile={profile} notes={notesForCard} palette={palette}/>
                </div>
                <div className="phone-home" aria-hidden="true"><i/></div>
              </div>
            </div>
            <div className="canvas-footer">
              <div className="format-label">Formato</div>
              <Choice items={formats} value={profile.format} onChange={(format) => update({ format })} label="Formato do card" className="format-choice"/>
            </div>
          </div>
          <Gallery active={profile.exampleId} onSelect={selectExample}/>
        </section>

        <aside className="inspector" aria-label="Ferramentas do ateliê">
          <div className="inspector-tabs"><Choice items={tabs} value={tab} onChange={setTab} label="Ferramentas"/></div>
          <div key={tab} className="inspector-content">
            {tab === 'profile' && <IdentityEditor profile={profile} update={update} chooseFile={() => fileInput.current.click()} autoRemove={autoRemove} editMask={() => setMask(true)} busy={busy}/>}
            {tab === 'style' && <StyleEditor profile={profile} update={update} palette={palette}/>}
            {tab === 'notes' && <NotesEditor profile={profile} update={update} topNotes={notesForCard} elixirNotes={elixirNotes}/>}
          </div>
        </aside>
      </div>
    </main>

    <input className="visually-hidden" tabIndex={-1} ref={fileInput} type="file" accept="image/*,.heic,.heif" onChange={upload} aria-label="Enviar retrato"/>
    <div className={'toast ' + (notice ? 'toast-visible' : '')} role="status" aria-live="polite">{notice}</div>

    {mask && <PhotoMaskEditor original={profile.originalPhoto} current={profile.photo} onClose={() => setMask(false)} onApply={(photo) => {
      update({ photo, transparent: true, treatment: 'cutout' }); setMask(false); setNotice('Recorte atualizado.');
    }}/>}

    <dialog ref={shareDialog} className="export-dialog" onClose={() => setShareFile(null)}>
      <div className="dialog-head"><h2>Seu card está pronto.</h2><button type="button" className="icon-button" aria-label="Fechar" onClick={() => shareDialog.current.close()}><X size={17}/></button></div>
      <div className="dialog-actions">
        <button type="button" className="button primary" onClick={() => { download(shareFile); shareDialog.current.close(); }}><ArrowDownToLine size={16}/> Baixar PNG</button>
        {shareFile && navigator.canShare?.({ files: [shareFile] }) && <button type="button" className="button secondary" onClick={async () => {
          try { await navigator.share({ files: [shareFile], title: 'Meu perfil Elixir' }); shareDialog.current.close(); }
          catch (error) { if (error.name !== 'AbortError') setNotice('Não foi possível abrir o compartilhamento.'); }
        }}><Share size={16}/> Compartilhar</button>}
      </div>
    </dialog>
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
