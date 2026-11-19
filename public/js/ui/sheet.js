// Bottom sheets with multi-pane navigation, spring animation, drag-to-dismiss,
// Telegram BackButton integration and focus management.
import { backButton, haptic } from '../core/telegram.js';
import { icon } from './icons.js';
import { el, esc } from '../core/dom.js';
import { t } from '../i18n.js';

const stack = [];
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const dur = (ms) => ms; // motion always on (see base.css note)

function sync() {
  if (stack.length) backButton.show(() => stack[stack.length - 1]?.back());
  else backButton.hide();
  stack.forEach((s, i) => {
    s.el.classList.toggle('is-under', i < stack.length - 1);
    s.wrap.inert = i < stack.length - 1;
  });
  const open = stack.length > 0;
  const scr = document.getElementById('screens');
  const tab = document.getElementById('tabbar');
  if (scr) scr.inert = open;
  if (tab) tab.inert = open;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && stack.length) { e.preventDefault(); stack[stack.length - 1].back(); }
});

export const topSheet = () => stack[stack.length - 1] || null;
export const hasSheets = () => stack.length > 0;
export function closeAllSheets() { [...stack].reverse().forEach((s) => s.close(true)); }

/**
 * pane spec: { title, scroll: html, foot?: html, right?: html, setup?(paneEl, ctx), onDestroy?() , noClose?: bool }
 */
export function openSheet({ size = 'full', pane, onClose, label } = {}) {
  const wrap = el(`
    <div class="sheet-wrap">
      <div class="sheet-backdrop"></div>
      <section class="sheet ${size === 'full' ? 'is-full' : 'is-auto'}" role="dialog" aria-modal="true" aria-label="${esc(label || pane.title || '')}" tabindex="-1">
        <div class="sheet-grab"></div>
        <header class="sheet-head">
          <div class="slot start"></div>
          <h2 class="sheet-title"></h2>
          <div class="slot end"></div>
        </header>
        <div class="sheet-body"></div>
      </section>
    </div>`);
  const sheetEl = wrap.querySelector('.sheet');
  const backdrop = wrap.querySelector('.sheet-backdrop');
  const startSlot = wrap.querySelector('.slot.start');
  const endSlot = wrap.querySelector('.slot.end');
  const titleEl = wrap.querySelector('.sheet-title');
  const body = wrap.querySelector('.sheet-body');
  const head = wrap.querySelector('.sheet-head');
  const grab = wrap.querySelector('.sheet-grab');
  const prevFocus = document.activeElement;

  const panes = [];
  let closed = false;
  let busy = false;

  const api = {
    el: sheetEl, wrap, head, panes,
    get top() { return panes[panes.length - 1]; },
    push, pop, replaceAll, close, back, setTitle,
  };

  function setTitle(text, animate = true) {
    titleEl.textContent = text || '';
    if (animate) { titleEl.classList.remove('swap'); void titleEl.offsetWidth; titleEl.classList.add('swap'); }
    sheetEl.setAttribute('aria-label', text || '');
    if (api.top) api.top.spec.title = text;
  }

  function renderHeader() {
    const p = api.top;
    const canBack = panes.length > 1;
    startSlot.innerHTML = canBack ? `<button class="icon-btn plain" data-act="back" aria-label="${esc(t('common.back'))}">${icon('chevL', 24)}</button>` : '';
    endSlot.innerHTML = (p.spec.right ?? '') + (p.spec.noClose ? '' : `<button class="icon-btn plain" data-act="close" aria-label="${esc(t('common.close'))}">${icon('x', 22)}</button>`);
    setTitle(p.spec.title);
  }

  head.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'back') { haptic.light(); back(); }
    if (b.dataset.act === 'close') { haptic.light(); close(); }
  });

  function buildPane(spec) {
    const ac = new AbortController();
    const node = el(`<div class="pane"><div class="pane-scroll">${spec.scroll ?? ''}</div>${spec.foot != null ? `<div class="pane-foot">${spec.foot}</div>` : ''}</div>`);
    const p = { spec, el: node, scroller: node.querySelector('.pane-scroll'), foot: node.querySelector('.pane-foot'), ac };
    const ctx = { sheet: api, signal: ac.signal, scroller: p.scroller, foot: p.foot, head, push, pop, replaceAll, close, back, setTitle };
    p.ctx = ctx;
    return p;
  }

  function runSetup(p) { p.spec.setup?.(p.el, p.ctx); }
  function destroyPane(p) { p.ac.abort(); p.spec.onDestroy?.(); p.el.remove(); }

  function anim(node, frames, ms, easing = EASE) {
    return node.animate(frames, { duration: dur(ms), easing, fill: 'both' });
  }

  async function push(spec) {
    if (busy || closed) return;
    busy = true;
    const prev = api.top;
    const p = buildPane(spec);
    panes.push(p);
    body.appendChild(p.el);
    renderHeader();
    runSetup(p);
    if (prev) {
      prev.el.inert = true;
      anim(prev.el, [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(-26%)', opacity: 0.4 }], 460);
      await anim(p.el, [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], 460).finished.catch(() => {});
      prev.el.style.visibility = 'hidden';
      p.el.getAnimations().forEach((a) => a.cancel());
    }
    busy = false;
    sheetEl.focus({ preventScroll: true });
  }

  async function pop() {
    if (busy || panes.length < 2) return;
    busy = true;
    const cur = panes.pop();
    const prev = api.top;
    prev.el.style.visibility = '';
    prev.el.inert = false;
    renderHeader();
    anim(prev.el, [{ transform: 'translateX(-26%)', opacity: 0.4 }, { transform: 'translateX(0)', opacity: 1 }], 440);
    await anim(cur.el, [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], 440).finished.catch(() => {});
    prev.el.getAnimations().forEach((a) => a.cancel());
    destroyPane(cur);
    busy = false;
  }

  /** Swap to a fresh root pane (used for final status screens: Back then closes the sheet). */
  async function replaceAll(spec) {
    if (closed) return;
    busy = true;
    const old = [...panes];
    const p = buildPane(spec);
    panes.length = 0;
    panes.push(p);
    body.appendChild(p.el);
    renderHeader();
    runSetup(p);
    old.forEach((o) => { o.el.inert = true; });
    anim(old[old.length - 1].el, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.96)' }], 300);
    await anim(p.el, [{ opacity: 0, transform: 'translateY(24px) scale(.98)' }, { opacity: 1, transform: 'none' }], 520).finished.catch(() => {});
    p.el.getAnimations().forEach((a) => a.cancel());
    old.forEach(destroyPane);
    busy = false;
  }

  function back() {
    if (panes.length > 1) pop(); else close();
  }

  async function close(immediate = false) {
    if (closed) return;
    closed = true;
    const i = stack.indexOf(api);
    if (i > -1) stack.splice(i, 1);
    sync();
    if (!immediate) {
      const from = getComputedStyle(sheetEl).transform;
      anim(backdrop, [{ opacity: parseFloat(getComputedStyle(backdrop).opacity) || 1 }, { opacity: 0 }], 320, 'ease-out');
      await anim(sheetEl, [{ transform: from === 'none' ? 'translateY(0)' : from }, { transform: 'translateY(105%)' }], 380, 'cubic-bezier(0.4, 0, 0.9, 0.4)').finished.catch(() => {});
    }
    panes.forEach(destroyPane);
    wrap.remove();
    try { prevFocus?.focus?.({ preventScroll: true }); } catch { /* ignore */ }
    onClose?.();
  }

  /* ----- drag to dismiss (grabber + header) ----- */
  let drag = null;
  const onDown = (e) => {
    if (e.target.closest('button') || busy) return;
    drag = { y: e.clientY, t: performance.now(), dy: 0, h: sheetEl.offsetHeight };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    sheetEl.getAnimations().forEach((a) => a.cancel());
  };
  const onMove = (e) => {
    if (!drag) return;
    drag.dy = Math.max(0, e.clientY - drag.y);
    // rubber-band feel: resist slightly
    const y = drag.dy < 0 ? 0 : drag.dy;
    sheetEl.style.transform = `translateY(${y}px)`;
    backdrop.style.opacity = String(Math.max(0, 1 - y / drag.h));
  };
  const onUp = () => {
    if (!drag) return;
    const v = drag.dy / Math.max(1, performance.now() - drag.t);
    const shouldClose = drag.dy > 130 || (v > 0.65 && drag.dy > 30);
    const from = drag.dy;
    drag = null;
    if (shouldClose) {
      haptic.light();
      close();
    } else {
      sheetEl.style.transform = '';
      backdrop.style.opacity = '1';
      sheetEl.animate([{ transform: `translateY(${from}px)` }, { transform: 'translateY(0)' }], { duration: dur(420), easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' });
    }
  };
  [grab, head].forEach((h) => {
    h.addEventListener('pointerdown', onDown);
    h.addEventListener('pointermove', onMove);
    h.addEventListener('pointerup', onUp);
    h.addEventListener('pointercancel', onUp);
  });

  backdrop.addEventListener('click', () => { if (stack[stack.length - 1] === api) close(); });

  /* ----- mount ----- */
  stack.push(api);
  document.getElementById('sheets').appendChild(wrap);
  const first = buildPane(pane);
  panes.push(first);
  body.appendChild(first.el);
  renderHeader();
  runSetup(first);
  sync();
  backdrop.style.opacity = '1';
  backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur(360), easing: 'ease-out' });
  sheetEl.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: dur(560), easing: EASE });
  sheetEl.focus({ preventScroll: true });
  haptic.light();

  return api;
}
