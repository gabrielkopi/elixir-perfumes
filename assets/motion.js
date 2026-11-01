/* Short, interruptible motion. Navigation stays mounted and typing stays immediate. */
const Motion = {
  reduced: matchMedia('(prefers-reduced-motion: reduce)'),
  key: null, routeKey: null, flowStep: null,
  active: new Map(), closing: null,
  ease: 'cubic-bezier(.2,.8,.2,1)',
  duration: { feedback: 160, update: 180, enter: 240, exit: 140 },

  animate(el, frames, options = {}) {
    if (!el) return null;
    this.active.get(el)?.cancel();
    this.active.delete(el);
    if (this.reduced.matches || typeof el.animate !== 'function') return null;
    const animation = el.animate(frames, { duration: this.duration.enter, easing: this.ease, ...options });
    this.active.set(el, animation);
    const release = () => { if (this.active.get(el) === animation) this.active.delete(el); };
    animation.finished.then(release, release);
    return animation;
  },

  cancelContent() {
    for (const [el, animation] of this.active) {
      if (el.id !== 'modal') { animation.cancel(); this.active.delete(el); }
    }
  },

  reveal(el, options = {}) {
    return this.animate(el, [{ opacity: .55, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], options);
  },

  replace(el, html, { animate = false } = {}) {
    if (!el || el.innerHTML === html) return false;
    el.innerHTML = html;
    if (animate) this.reveal(el, { duration: this.duration.update });
    return true;
  },

  captureFocus(root) {
    const el = root?.contains(document.activeElement) ? document.activeElement : null;
    if (!el) return null;
    const attributes = [...el.attributes].filter(a => ['id', 'name', 'href', 'type'].includes(a.name) || a.name.startsWith('data-')).map(a => [a.name, a.value]);
    // Labels such as “Adicionar/Remover dos favoritos” change with the state.
    if (!attributes.length && el.hasAttribute('aria-label')) attributes.push(['aria-label', el.getAttribute('aria-label')]);
    return {
      tag: el.tagName, form: el.form?.id,
      attributes,
      start: el.selectionStart, end: el.selectionEnd
    };
  },

  restoreFocus(root, saved) {
    if (!root || !saved?.attributes.length) return;
    const target = [...root.querySelectorAll(saved.tag)].find(el => (!saved.form || el.form?.id === saved.form) && saved.attributes.every(([name, value]) => el.getAttribute(name) === value));
    target?.focus({ preventScroll: true });
    if (target && typeof saved.start === 'number' && typeof target.setSelectionRange === 'function') target.setSelectionRange(saved.start, saved.end);
  },

  focusHeading(root) {
    const heading = root?.querySelector('h1');
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    const focus = () => { if (heading.isConnected) heading.focus({ preventScroll: true }); };
    const dialog = document.querySelector('#modal');
    if (dialog?.open) dialog.addEventListener('close', focus, { once: true });
    else focus();
  },

  paint(html) {
    const key = [route.page, route.id || '', route.name || '', Social.tab, Social.feed, Families.mode || '', Minimal.profileTab].join('|');
    const routeKey = [route.page, route.id || '', route.name || ''].join('|');
    const first = this.key === null, changed = this.key !== key;
    const navigated = !first && this.routeKey !== routeKey;
    this.key = key; this.routeKey = routeKey; this.flowStep = null;
    const mounted = document.querySelector('.floating-app'), template = document.createElement('template');
    template.innerHTML = html;
    const next = template.content.querySelector('#main'), current = document.querySelector('#main');
    const focused = this.captureFocus(current);
    this.cancelContent();
    if (mounted && current && next) {
      current.replaceChildren(...next.childNodes);
      const head = document.querySelector('.floating-topbar'), nextHead = template.content.querySelector('.floating-topbar');
      if (head && nextHead && head.innerHTML !== nextHead.innerHTML) head.innerHTML = nextHead.innerHTML;
      const nextNav = template.content.querySelectorAll('.floating-dock>button');
      document.querySelectorAll('.floating-dock>button').forEach((button, i) => {
        const nextButton = nextNav[i]; if (!nextButton) return;
        button.className = nextButton.className;
        if (nextButton.hasAttribute('aria-current')) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
        button.querySelector('i')?.remove();
        if (nextButton.querySelector('i')) button.append(nextButton.querySelector('i').cloneNode(true));
      });
      const tray = document.querySelector('.compare-tray'), nextTray = template.content.querySelector('.compare-tray');
      if (tray?.outerHTML !== nextTray?.outerHTML) { tray?.remove(); if (nextTray) mounted.append(nextTray); }
    } else document.querySelector('#app').innerHTML = html;
    document.querySelectorAll('.studio-shortcuts a').forEach(a => {
      if (a.getAttribute('href') === '#' + route.page) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const main = document.querySelector('#main');
    if (navigated) scrollTo({ top: 0, behavior: 'instant' });
    if (!first && changed) this.reveal(main);
    if (navigated) this.focusHeading(main);
    else this.restoreFocus(main, focused);
  },

  paintFlow(html, step) {
    const app = document.querySelector('#app'), current = app.querySelector('.discovery-flow');
    const saved = this.captureFocus(current), changed = this.flowStep !== step;
    this.cancelContent();
    if (current) {
      const template = document.createElement('template'); template.innerHTML = html;
      for (const selector of ['.flow-top', '.flow-progress', '.flow-content', '.flow-footer']) {
        const oldPart = current.querySelector(selector), newPart = template.content.querySelector(selector);
        if (oldPart && newPart && oldPart.outerHTML !== newPart.outerHTML) oldPart.replaceWith(newPart);
      }
    } else app.innerHTML = html;
    this.flowStep = step;
    if (changed) { this.reveal(app.querySelector('.flow-content')); this.focusHeading(app); }
    else this.restoreFocus(app, saved);
  },

  open() {
    this.closing?.cancel(); this.closing = null;
    this.animate(document.querySelector('#modal'), [{ opacity: .4, transform: 'translateY(10px) scale(.99)' }, { opacity: 1, transform: 'none' }]);
  },

  close() {
    const dialog = document.querySelector('#modal');
    if (!dialog?.open || this.closing) return;
    const animation = this.animate(dialog, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(6px) scale(.99)' }], { duration: this.duration.exit });
    if (!animation) { this.dismissNow(); return; }
    this.closing = animation;
    animation.finished.then(() => {
      // A previous close must never close a newer sheet.
      if (this.closing !== animation) return;
      this.closing = null;
      if (dialog.open) dialog.close();
    }, () => {});
  },

  dismissNow() {
    const dialog = document.querySelector('#modal');
    this.closing?.cancel(); this.closing = null;
    this.active.get(dialog)?.cancel(); this.active.delete(dialog);
    if (dialog?.open) dialog.close();
  }
};

Motion.reduced.addEventListener('change', event => {
  if (!event.matches) return;
  if (Motion.closing) Motion.dismissNow();
  for (const animation of Motion.active.values()) animation.cancel();
  Motion.active.clear();
});

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || Motion.reduced.matches || button.disabled) return;
  const { action, id, social } = button.dataset;
  if (['like', 'favorite', 'save-post', 'follow'].includes(action) || social === 'shelf') queueMicrotask(() => {
    const target = button.isConnected ? button : [...document.querySelectorAll('button')].find(el => el.dataset.id === id && (action ? el.dataset.action === action : el.dataset.social === social));
    Motion.animate(target?.querySelector('.icon') || target, [{ transform: 'scale(.88)' }, { transform: 'scale(1)' }], { duration: Motion.duration.feedback });
  });
}, true);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.querySelector('#modal')?.open) { event.preventDefault(); Motion.close(); }
});
