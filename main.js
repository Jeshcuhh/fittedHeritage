/* Second Seam: quiet entrances.
   Sections fade up once as they scroll into view. When a list re-renders, only items
   that weren't there before cascade in, so re-ranking and filtering never replay it. */
(() => {
  if (!('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

  // once an element has arrived, drop the classes so FLIP and hover transforms are free again
  document.addEventListener('transitionend', (e) => {
    const el = e.target;
    if (e.propertyName !== 'opacity' || !el.classList || !el.classList.contains('is-in')) return;
    el.classList.remove('reveal', 'is-in');
    el.style.removeProperty('--index');
  });

  const watch = (el, i = 0) => {
    el.classList.add('reveal');
    el.style.setProperty('--index', Math.min(i, 8));
    io.observe(el);
  };

  // static sections
  document.querySelectorAll('.folio, .screen > .block, .paper-sec')
    .forEach((el) => watch(el));

  // rendered lists: cascade new items only
  const LISTS = ['#cards', '#goal-cards', '#tailor-list', '#uw-recs', '.saved-list', '#style-tiles', '.how'];
  const keyOf = (el) => el.dataset.key || el.dataset.tailor || el.dataset.nudge
    || el.getAttribute('aria-labelledby') || el.id
    || (el.querySelector('h2, h3, .tile-name') || el).textContent.trim().slice(0, 60);
  const seen = new WeakMap();

  const cascade = (list) => {
    const keys = seen.get(list) || new Set();
    seen.set(list, keys);
    let i = 0;
    [...list.children].forEach((child) => {
      const k = keyOf(child);
      if (keys.has(k)) return;
      keys.add(k);
      watch(child, i++);
    });
  };

  const hook = (list) => {
    cascade(list);
    new MutationObserver(() => cascade(list)).observe(list, { childList: true });
  };

  const start = () => LISTS.forEach((sel) => document.querySelectorAll(sel).forEach(hook));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
