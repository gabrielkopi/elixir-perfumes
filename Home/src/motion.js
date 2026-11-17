import { useEffect, useRef, useState } from 'react';

const revealSelector = '.reveal:not(.in-view)';
const parallaxSelector = '[data-parallax]';
const motionSelector = `${revealSelector}, ${parallaxSelector}`;

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
}

export function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored);
    } catch {
      // Storage may be unavailable, or a previous value may no longer be readable.
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Keep the current session usable even if the browser cannot persist it.
    }
  }, [key, value]);

  return [value, setValue];
}

export function usePageMotion(view) {
  const rootRef = useRef(null);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reveals = !reducedMotion && 'IntersectionObserver' in window
      ? new IntersectionObserver((entries, observer) => {
        for (const { isIntersecting, target } of entries) {
          if (!isIntersecting) continue;
          target.classList.add('in-view');
          observer.unobserve(target);
        }
      })
      : null;

    let parallax = [];
    let scrollProgress = -1;
    let position = Math.min(460, Math.max(0, window.scrollY));
    let frame = 0;
    let previousTime = 0;

    function render(now) {
      frame = 0;
      const scroll = Math.max(0, window.scrollY);
      const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollRange > 0 ? Math.min(1, scroll / scrollRange) : 0;
      if (progress !== scrollProgress) {
        root.style.setProperty('--scroll-progress', progress.toFixed(4));
        scrollProgress = progress;
      }

      if (!parallax.length) return;
      const target = Math.min(460, scroll);
      const elapsed = previousTime ? Math.min(48, now - previousTime) : 16;
      previousTime = now;
      position += (target - position) * (1 - Math.exp(-elapsed / 100));
      const moving = Math.abs(target - position) >= 0.2;
      if (!moving) {
        position = target;
        previousTime = 0;
      }
      for (const { element, rate } of parallax) {
        element.style.setProperty('--parallax-y', `${(position * rate).toFixed(2)}px`);
      }
      if (moving) scheduleFrame();
    }

    function scheduleFrame() {
      if (!frame) frame = window.requestAnimationFrame(render);
    }

    function observeContent() {
      for (const element of root.querySelectorAll(revealSelector)) {
        if (reveals) reveals.observe(element);
        else element.classList.add('in-view');
      }
      parallax = reducedMotion ? [] : Array.from(root.querySelectorAll(parallaxSelector), element => {
        const rate = Number.parseFloat(element.dataset.parallax);
        return { element, rate: Number.isFinite(rate) ? rate : 0.14 };
      });
      scheduleFrame();
    }

    const content = new MutationObserver(records => {
      const changed = records.some(({ addedNodes, removedNodes }) =>
        [...addedNodes, ...removedNodes].some(node =>
          node instanceof Element && (node.matches(motionSelector) || node.querySelector(motionSelector)),
        ),
      );
      if (changed) observeContent();
    });
    content.observe(root, { childList: true, subtree: true });
    const resize = 'ResizeObserver' in window ? new ResizeObserver(scheduleFrame) : null;
    resize?.observe(root);
    window.addEventListener('scroll', scheduleFrame, { passive: true });
    window.addEventListener('resize', scheduleFrame, { passive: true });
    observeContent();

    return () => {
      reveals?.disconnect();
      content.disconnect();
      resize?.disconnect();
      window.removeEventListener('scroll', scheduleFrame);
      window.removeEventListener('resize', scheduleFrame);
      window.cancelAnimationFrame(frame);
      root.style.removeProperty('--scroll-progress');
      for (const { element } of parallax) element.style.removeProperty('--parallax-y');
    };
  }, [reducedMotion, view]);

  return rootRef;
}
