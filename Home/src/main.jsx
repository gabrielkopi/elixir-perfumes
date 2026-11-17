import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Compass, House, Layers3, LayoutGrid, Moon, ScanEye, Sun, UsersRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { featured as featuredIds, normalize, profiles, tour } from './editorial';
import { useLocalStorageState, usePageMotion } from './motion';
import Tools, { legacyPattern } from './Tools';
import Inbox from './Inbox';
import { findNote } from './data/notes.mjs';
import { Avatar, Collection, Community, Explore, Home, Library, PerfumeDetail, Profile, useNativeDialog } from './views';
import './style.css';
import './theme.css';

const navigation = [
  { id: 'inicio', label: 'Início', icon: House },
  { id: 'explorar', label: 'Explorar', icon: Compass },
  { id: 'comunidade', label: 'Comunidade', icon: UsersRound },
  { id: 'biblioteca', label: 'Biblioteca', icon: Layers3 },
  { id: 'colecao', label: 'Coleção', icon: Bookmark },
  { id: 'perfil', label: 'Perfil', icon: ScanEye },
];

const sandbox = new URLSearchParams(window.location.search).has('sandbox');

function readRoute() {
  const hash = window.location.hash.slice(1);
  const [page, ...parts] = hash.split('/');
  const detail = parts.join('/') || undefined;
  if (navigation.some((item) => item.id === page) || page === 'ferramentas' || page === 'conversas') return { page, detail };
  if (sandbox) return { page: 'ferramentas', detail: legacyPattern.test(hash) ? hash : 'home' };
  if (page === 'home' || page === 'welcome') return { page: 'inicio' };
  if (page === 'explore') return { page: 'explorar' };
  if (page === 'perfume' && detail) return { page: 'explorar', detail };
  if (page === 'ingredients') return { page: 'biblioteca' };
  if (legacyPattern.test(hash)) return { page: 'ferramentas', detail: hash };
  return { page: 'inicio' };
}

function toggleIn(items, id) {
  return items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
}

function Tour({ step, goToStep, dismiss, navigate }) {
  const current = tour[step];
  return (
    <aside className="lower-third" aria-label="Guia de boas-vindas">
      <div className="tour-bars" aria-label={`Etapa ${step + 1} de ${tour.length}`}>{tour.map((item, index) => <span key={item.page} className={index <= step ? 'filled' : ''} />)}</div>
      <button className="icon-button tour-close" onClick={dismiss} aria-label="Fechar boas-vindas"><X size={16} /></button>
      <div className="tour-content" key={step} aria-live="polite">
        <h2>{current.title}</h2>
        <p>{current.text}</p>
      </div>
      <div className="tour-actions">
        {step > 0 ? <button className="text-button" onClick={() => navigate(current.page)}>{current.link} <ArrowUpRight size={14} /></button> : <button className="text-button" onClick={dismiss}>Agora não</button>}
        <div className="tour-buttons">
          {step > 0 && <button className="icon-button" onClick={() => goToStep(step - 1)} aria-label="Etapa anterior"><ArrowLeft size={15} /></button>}
          <button className="button button-dark" onClick={() => step < tour.length - 1 ? goToStep(step + 1) : dismiss()}>{step === 0 ? 'Começar' : step === tour.length - 1 ? 'Concluir' : 'Próximo'} <ArrowRight size={15} /></button>
        </div>
      </div>
    </aside>
  );
}

function App() {
  const [route, setRoute] = useState(readRoute);
  const [catalog, setCatalog] = useState({ items: [], state: 'loading' });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('todos');
  const [activePerfume, setActivePerfume] = useState(null);
  const [tourStep, setTourStep] = useState(null);
  const [tourSeen, setTourSeen] = useLocalStorageState('elixir-home.tourSeen', false);
  const [saved, setSaved] = useLocalStorageState('elixir-home.saved', []);
  const [follows, setFollows] = useLocalStorageState('elixir-home.follows', []);
  const [likes, setLikes] = useLocalStorageState('elixir-home.likes', []);
  const [bookmarks, setBookmarks] = useLocalStorageState('elixir-home.bookmarks', []);
  const [comments, setComments] = useLocalStorageState('elixir-home.comments', {});
  const [conversations, setConversations] = useLocalStorageState('elixir-home.conversations', {});
  const [ratings, setRatings] = useLocalStorageState('elixir-home.ratings', {});
  const [toast, setToast] = useState('');
  const [theme, setTheme] = useLocalStorageState('elixir-home.theme', 'light');
  const toastTimer = useRef(null);
  const dialog = useRef(null);
  const main = useRef(null);
  const root = usePageMotion(route.page);
  const activeProfile = profiles[route.detail] ? route.detail : 'vincenzo';

  useEffect(() => {
    let current = true;
    import('./data/catalog.json').then(({ default: items }) => {
      if (!current) return;
      setCatalog({
        state: 'ready',
        items: items.map((item) => ({
          ...item,
          image: item.image || item.legacyImage,
          searchText: normalize([
            item.name, item.brand, item.family, item.concentration,
            ...item.notes.flatMap((label) => {
              const note = findNote(label);
              return [label, note?.name, ...(note?.aliases || [])];
            }),
            ...(item.accords || []),
          ].join(' ')),
        })),
      });
    }).catch(() => {
      if (current) setCatalog({ state: 'error', items: [] });
    });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    const update = () => {
      setRoute(readRoute());
      setActivePerfume(null);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  useEffect(() => {
    if (tourSeen || route.page !== 'inicio' || tourStep !== null) return;
    const timer = window.setTimeout(() => setTourStep(0), 1250);
    return () => window.clearTimeout(timer);
  }, [tourSeen, route.page, tourStep]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#161815' : '#f6f5f0');
  }, [theme]);

  function navigate(page, detail, { scroll = true } = {}) {
    const hash = page === 'inicio' ? '' : `#${page}${detail ? `/${detail}` : ''}`;
    if (window.location.hash !== hash) window.history.pushState(null, '', hash || window.location.pathname + window.location.search);
    setRoute({ page, detail });
    setActivePerfume(null);
    if (scroll) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      requestAnimationFrame(() => main.current?.focus({ preventScroll: true }));
    }
  }

  function notify(message) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2450);
  }

  function toggleSave(id) {
    setSaved((items) => toggleIn(items, id));
    notify(saved.includes(id) ? 'Perfume removido da coleção.' : 'Perfume salvo na coleção.');
  }

  function searchFor(value) {
    setQuery(value);
    setFilter('todos');
    navigate('explorar');
  }

  function readToolRoute(hash) {
    if (hash === route.detail) return;
    window.history.replaceState(null, '', `#ferramentas/${hash}`);
    setRoute({ page: 'ferramentas', detail: hash });
  }

  function closePerfume() {
    if (route.page === 'explorar' && route.detail) {
      window.history.replaceState(null, '', '#explorar');
      setRoute({ page: 'explorar' });
    }
    setActivePerfume(null);
  }

  function dismissTour() {
    setTourSeen(true);
    setTourStep(null);
  }

  const byId = new Map(catalog.items.map((item) => [item.id, item]));
  const getPerfumes = (ids) => ids.map((id) => byId.get(id)).filter(Boolean);
  const featured = getPerfumes(featuredIds);
  const perfume = byId.get(activePerfume || (route.page === 'explorar' ? route.detail : null));
  const dialogProps = useNativeDialog(dialog, Boolean(perfume), closePerfume);
  const options = { saved, onSave: toggleSave, onOpen: setActivePerfume };

  let screen;
  switch (route.page) {
    case 'explorar':
      screen = <Explore items={catalog.items} pending={catalog.state === 'loading'} failed={catalog.state === 'error'} featured={featured} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} options={options} />;
      break;
    case 'comunidade':
      screen = <Community navigate={navigate} follows={follows} likes={likes} toggleLike={(id) => setLikes((items) => toggleIn(items, id))} bookmarks={bookmarks} toggleBookmark={(id) => setBookmarks((items) => toggleIn(items, id))} comments={comments} addComment={(id, text) => setComments((items) => ({ ...items, [id]: [...(items[id] || []), text] }))} onOpen={setActivePerfume} />;
      break;
    case 'conversas':
      screen = <Inbox personId={route.detail} conversations={conversations} append={(id, message) => setConversations((items) => ({ ...items, [id]: [...(items[id] || []), message] }))} navigate={navigate} getPerfumes={getPerfumes} options={options} />;
      break;
    case 'biblioteca':
      screen = <Library familyId={route.detail} navigate={navigate} searchFor={searchFor} />;
      break;
    case 'colecao':
      screen = <Collection items={getPerfumes(saved)} options={options} navigate={navigate} />;
      break;
    case 'perfil':
      screen = <Profile person={profiles[activeProfile]} personId={activeProfile} isFollowing={follows.includes(activeProfile)} toggleFollow={(id) => setFollows((items) => toggleIn(items, id))} notify={notify} picks={getPerfumes(profiles[activeProfile].picks)} options={options} searchFor={searchFor} navigate={navigate} />;
      break;
    case 'ferramentas':
      screen = <Tools route={route.detail} theme={theme} navigate={navigate} onRoute={readToolRoute} sandbox={sandbox} />;
      break;
    default:
      screen = <Home options={options} featured={featured} navigate={navigate} startTour={() => setTourStep(0)} />;
  }

  function navLinks(compact) {
    return navigation.map(({ id, label, icon: Icon }) => (
      <button key={id} aria-current={route.page === id || (route.page === 'conversas' && id === 'comunidade') ? 'page' : undefined} onClick={() => navigate(id)}>
        {compact && <Icon size={19} strokeWidth={1.65} />}
        <span>{label}</span>
      </button>
    ));
  }

  return (
    <div className="app" ref={root} data-theme={theme}>
      <a className="skip-link" href="#conteudo" onClick={(event) => { event.preventDefault(); main.current?.focus(); }}>Pular para o conteúdo</a>
      <div className="progress" aria-hidden="true"><span /></div>
      <header className="site-header">
        <div className="header-inner">
          <a href="#" className="wordmark" onClick={(event) => { event.preventDefault(); navigate('inicio'); }}>elixir</a>
          <nav className="desktop-nav" aria-label="Navegação principal">{navLinks(false)}</nav>
          <div className="header-actions">
            <button className="header-guide text-button" onClick={() => setTourStep(0)}>Guia rápido <ArrowUpRight size={15} /></button>
            <button className="icon-button tools-switch" aria-label="Ferramentas" aria-pressed={route.page === 'ferramentas'} title="Ferramentas" onClick={() => navigate('ferramentas')}><LayoutGrid size={17} strokeWidth={1.65} /></button>
            <button className="icon-button theme-switch" aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={18} strokeWidth={1.65} /> : <Moon size={17} strokeWidth={1.65} />}
            </button>
            <button className="header-avatar" aria-label="Abrir perfil demonstrativo" onClick={() => navigate('perfil', 'vincenzo')}><Avatar person={profiles.vincenzo} /></button>
          </div>
        </div>
      </header>
      <main id="conteudo" className="route-content" ref={main} tabIndex={-1} key={route.page}>{screen}</main>
      <footer className="container site-footer">
        <span className="wordmark" aria-label="elixir">elixir</span>
        <div>
          <button className="text-button" onClick={() => setTourStep(0)}>Guia rápido</button>
          <button className="text-button" onClick={() => navigate('ferramentas')}>Ferramentas <ArrowUpRight size={15} /></button>
        </div>
      </footer>
      <nav className="mobile-nav" aria-label="Navegação principal">{navLinks(true)}</nav>
      {tourStep !== null && <Tour step={tourStep} goToStep={setTourStep} dismiss={dismissTour} navigate={navigate} />}
      <div className={`toast${toast ? ' visible' : ''}`} role="status">{toast}</div>
      <dialog ref={dialog} className="perfume-dialog" aria-labelledby="perfume-title" {...dialogProps}>
        <button className="icon-button dialog-close" onClick={closePerfume} aria-label="Fechar ficha"><X size={20} /></button>
        {perfume && <PerfumeDetail key={perfume.id} perfume={perfume} saved={saved.includes(perfume.id)} toggleSave={toggleSave} searchFor={searchFor} rating={ratings[perfume.id]} setRating={(id, value) => setRatings((items) => ({ ...items, [id]: value }))} />}
      </dialog>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
