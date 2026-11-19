// Small DOM helpers (no framework).
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Parse an HTML string into a single element. */
export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/** Delegated click handling via data-act="name". Returns an unbind fn. */
export function delegate(root, handlers, { signal, event = 'click' } = {}) {
  const fn = (e) => {
    const target = e.target.closest('[data-act]');
    if (!target || !root.contains(target)) return;
    const h = handlers[target.dataset.act];
    if (h) h(target, e);
  };
  root.addEventListener(event, fn, { signal });
  return () => root.removeEventListener(event, fn);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const debounce = (fn, ms) => {
  let t;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.cancel = () => clearTimeout(t);
  return d;
};
export const raf = () => new Promise((r) => requestAnimationFrame(() => r()));

/** Tween a number; calls fn(value) every frame. */
export function tween(from, to, { duration = 900, ease = (t) => 1 - Math.pow(1 - t, 4), onUpdate, onDone } = {}) {
  if (from === to) { onUpdate?.(to); onDone?.(); return () => {}; }
  const t0 = performance.now();
  let id;
  const step = (now) => {
    const p = clamp((now - t0) / duration, 0, 1);
    onUpdate?.(from + (to - from) * ease(p));
    if (p < 1) id = requestAnimationFrame(step); else onDone?.();
  };
  id = requestAnimationFrame(step);
  return () => cancelAnimationFrame(id);
}

let uid = 0;
export const nextId = (p = 'id') => `${p}${++uid}`;
