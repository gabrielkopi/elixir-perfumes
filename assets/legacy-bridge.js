(() => {
  'use strict';

  const root = document.documentElement;
  const app = document.getElementById('app');
  const frame = root.dataset.studio === '1' ? window.frameElement : null;
  const query = new URLSearchParams(location.search);
  const validTheme = (value) => value === 'light' || value === 'dark';
  let shellTheme = validTheme(query.get('theme')) ? query.get('theme') : null;

  const applyTheme = Theme.apply.bind(Theme);
  Theme.apply = (preference) => {
    if (!frame && preference !== undefined) shellTheme = null;
    const theme = shellTheme || preference || Theme.get();
    applyTheme(theme);
    const dark = Theme.isDark(theme);
    root.dataset.legacyLook = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111310' : '#f6f5f0');
  };
  Theme.apply();

  if (!frame) return;

  const host = window.parent;
  const origin = window.location.origin;
  const send = (type, data) => host.postMessage({ type, ...data }, origin);
  const fallbackHash = '#home';
  const accountsHash = /^#accounts(?:\/|$)/;
  let pendingHash = location.hash === fallbackHash || accountsHash.test(location.hash) ? '' : location.hash;
  let lastHash;
  let lastHeight;
  let frameRequest = 0;

  function navigate(hash) {
    if (typeof hash !== 'string' || !hash.startsWith('#') || hash === location.hash) return;
    const page = hash.slice(1).split('/', 1)[0];
    if (!Router.has(page)) return;
    if (!SANDBOX && !Accounts.chosen() && !accountsHash.test(hash)) {
      pendingHash = hash === fallbackHash ? '' : hash;
      if (route.page === 'accounts') return;
    }
    const target = Router.parse(hash);
    Router.go(target.page, target.id, { replace: true });
  }

  function reportRoute() {
    const hash = location.hash || fallbackHash;
    if (pendingHash && hash === fallbackHash && Accounts.chosen()) {
      const destination = pendingHash;
      pendingHash = '';
      navigate(destination);
      return;
    }
    if (hash === pendingHash && (SANDBOX || Accounts.chosen())) pendingHash = '';
    if (hash === lastHash) return;
    lastHash = hash;
    send('elixir:route', { hash });
  }

  function setPixels(property, value) {
    const next = `${Math.round(value)}px`;
    if (root.style.getPropertyValue(property) !== next) root.style.setProperty(property, next);
  }

  function measure() {
    frameRequest = 0;
    const frameTop = frame.getBoundingClientRect().top;
    const header = host.document.querySelector('.site-header');
    const navigation = host.document.querySelector('.mobile-nav');
    const top = Math.max(0, header?.getBoundingClientRect().bottom || 0);
    const bottom = navigation?.getClientRects().length
      ? Math.min(host.innerHeight, navigation.getBoundingClientRect().top)
      : host.innerHeight;
    const visibleTop = Math.min(window.innerHeight, Math.max(0, top - frameTop));
    const visibleBottom = Math.min(window.innerHeight, Math.max(visibleTop, bottom - frameTop));
    setPixels('--studio-visible-top', visibleTop);
    setPixels('--studio-hidden-bottom', window.innerHeight - visibleBottom);
    setPixels('--studio-visible-height', visibleBottom - visibleTop);
    setPixels('--studio-layout-height', Math.max(160, bottom - top));

    const height = Math.ceil(app.getBoundingClientRect().height);
    if (height > 0 && height !== lastHeight) {
      lastHeight = height;
      send('elixir:frame-size', { height });
    }
    reportRoute();
  }

  function scheduleMeasure() {
    if (!frameRequest) frameRequest = window.requestAnimationFrame(measure);
  }

  function handleMessage(event) {
    if (event.source !== host || event.origin !== origin || !event.data) return;
    const { type, theme, hash } = event.data;
    if (type === 'elixir:theme' && validTheme(theme)) {
      shellTheme = theme;
      Theme.apply();
    }
    if (type === 'elixir:navigate') navigate(hash);
  }

  const activity = new MutationObserver(scheduleMeasure);
  activity.observe(app, { childList: true, subtree: true });
  const resize = 'ResizeObserver' in window ? new ResizeObserver(scheduleMeasure) : null;
  resize?.observe(app);
  resize?.observe(frame);
  host.addEventListener('scroll', scheduleMeasure, { passive: true });
  host.addEventListener('resize', scheduleMeasure, { passive: true });
  window.addEventListener('message', handleMessage);
  window.addEventListener('hashchange', scheduleMeasure);
  window.addEventListener('popstate', scheduleMeasure);
  window.addEventListener('pageshow', scheduleMeasure);
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    activity.disconnect();
    resize?.disconnect();
    host.removeEventListener('scroll', scheduleMeasure);
    host.removeEventListener('resize', scheduleMeasure);
    window.cancelAnimationFrame(frameRequest);
  });
  scheduleMeasure();
})();
