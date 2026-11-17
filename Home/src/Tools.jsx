import { ArrowLeft, ArrowUpRight, Blend, BookOpen, Compass, Fingerprint, Map, Plus, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const legacyPattern = /^(?:accounts|brand|brands|bubble|circle|collection|compare|connect|edit|edits|explore|family|guide|home|ingredient|ingredients|list|map|perfume|person|profile|refine|today|welcome)(?:\/[^?#]*)?$/;
const tools = [
  { route: 'profile', title: 'Meu perfil', description: 'Edite sua foto, sua bio e suas preferências.', Icon: UserRound },
  { route: 'refine', title: 'Descoberta olfativa', description: 'Encontre fragrâncias de acordo com o seu gosto.', Icon: Compass },
  { route: 'map', title: 'Assinatura olfativa', description: 'Veja como suas afinidades se distribuem entre as famílias.', Icon: Fingerprint },
  { route: 'compare', title: 'Comparar perfumes', description: 'Veja famílias, notas e acordes lado a lado.', Icon: Blend },
  { route: 'collection', title: 'Minhas listas', description: 'Organize sua estante e as listas do app completo.', Icon: BookOpen },
  { route: 'today', title: 'Indicações para hoje', description: 'Explore recomendações para a sua ocasião.', Icon: Map },
];

function EmbeddedTool({ route, theme, sandbox, onRoute }) {
  const [height, setHeight] = useState(640);
  const [loaded, setLoaded] = useState(false);
  const [source] = useState(() => `./elixir.html?studio=1&theme=${theme}${sandbox ? '&sandbox=1' : ''}#${route}`);
  const frame = useRef(null);
  const latestRoute = useRef(onRoute);

  useEffect(() => { latestRoute.current = onRoute; }, [onRoute]);

  useEffect(() => {
    function receive(event) {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      const payload = event.data;
      if (payload?.type === 'elixir:frame-size' && Number.isFinite(payload.height)) {
        setHeight(Math.max(260, Math.ceil(payload.height)));
      }
      if (payload?.type === 'elixir:route' && typeof payload.hash === 'string') {
        const hash = payload.hash.replace(/^#/, '');
        if (legacyPattern.test(hash)) latestRoute.current(hash);
      }
    }

    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    frame.current?.contentWindow?.postMessage({ type: 'elixir:theme', theme }, location.origin);
  }, [loaded, theme]);

  useEffect(() => {
    if (!loaded) return;
    frame.current?.contentWindow?.postMessage({ type: 'elixir:navigate', hash: `#${route}` }, location.origin);
  }, [loaded, route]);

  return (
    <div className="embedded-tool" aria-busy={!loaded}>
      <iframe ref={frame} src={source} title="Ferramenta do elixir" height={height} onLoad={() => setLoaded(true)} />
    </div>
  );
}

export default function Tools({ route, theme, navigate, onRoute, sandbox }) {
  const detail = legacyPattern.test(route || '') ? route : '';

  return (
    <section className={`container page-section tools-page${detail ? ' with-embedded-tool' : ''}`}>
      {detail ? (
        <>
          <button className="text-button tools-back" onClick={() => navigate('ferramentas')}><ArrowLeft size={17} /> Ferramentas</button>
          <EmbeddedTool route={detail} theme={theme} sandbox={sandbox} onRoute={onRoute} />
        </>
      ) : (
        <>
          <header className="page-heading">
            <p className="eyebrow">ELIXIR</p><h1>Ferramentas</h1>
            <p>Descubra sua assinatura, compare perfumes e organize sua estante.</p>
          </header>
          <div className="tools-grid">
            {tools.map(({ route: value, title, description, Icon }) => (
              <button className="tool-tile reveal" key={value} onClick={() => navigate('ferramentas', value)}>
                <Icon size={21} strokeWidth={1.45} />
                <span><strong>{title}</strong><small>{description}</small></span>
                <ArrowUpRight size={17} strokeWidth={1.6} />
              </button>
            ))}
          </div>
          <div className="chips tools-extras">
            <button className="chip" onClick={() => navigate('ferramentas', 'explore')}><Plus size={15} /> Exploração avançada</button>
            <button className="chip" onClick={() => navigate('ferramentas', 'circle')}>Meu círculo</button>
            <button className="chip" onClick={() => navigate('ferramentas', 'bubble')}>Fora da bolha</button>
            <button className="chip" onClick={() => navigate('ferramentas', 'guide')}>Guia de perfumaria</button>
            <button className="chip" onClick={() => navigate('ferramentas', 'connect')}>Elixir Connect</button>
          </div>
        </>
      )}
    </section>
  );
}
