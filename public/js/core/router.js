// Tab router with persistent screens, sliding tab indicator and hash deep links.
import { icon } from '../ui/icons.js';
import { haptic } from './telegram.js';
import { t } from '../i18n.js';
import { esc } from './dom.js';

export const TABS = [
  { id: 'wallet', icon: 'wallet', label: 'tab.wallet' },
  { id: 'markets', icon: 'markets', label: 'tab.markets' },
  { id: 'swap', icon: 'swap', label: 'tab.swap' },
  { id: 'activity', icon: 'activity', label: 'tab.activity' },
  { id: 'settings', icon: 'settings', label: 'tab.settings' },
];

const screens = new Map(); // id -> { el, def, mounted }
let current = null;
let tabbar, host;

export const router = {
  get current() { return current; },

  register(id, def) {
    const el = document.createElement('section');
    el.className = 'screen';
    el.dataset.screen = id;
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('aria-label', t(TABS.find((x) => x.id === id).label));
    el.addEventListener('scroll', () => el.classList.toggle('is-scrolled', el.scrollTop > 6), { passive: true });
    host.appendChild(el);
    screens.set(id, { el, def, mounted: false });
  },

  /** (Re)build chrome. Call after language change. */
  renderTabbar() {
    tabbar.innerHTML = `<span class="tabbar-thumb" aria-hidden="true"></span>${TABS.map((x) => `
      <button class="tab" data-tab="${x.id}" aria-label="${esc(t(x.label))}">${icon(x.icon, 24)}<span>${esc(t(x.label))}</span></button>`).join('')}`;
    tabbar.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => router.go(b.dataset.tab)));
    if (current) this.markActive(current);
  },

  markActive(id) {
    const idx = TABS.findIndex((x) => x.id === id);
    tabbar.style.setProperty('--i', idx);
    tabbar.classList.remove('moving');
    void tabbar.offsetWidth;
    tabbar.classList.add('moving');
    tabbar.querySelectorAll('.tab').forEach((b) => {
      const on = b.dataset.tab === id;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  },

  init(tabbarEl, hostEl) { tabbar = tabbarEl; host = hostEl; },

  go(id, params = {}, { silent = false } = {}) {
    const next = screens.get(id);
    if (!next) return;
    if (id === current) {
      next.el.scrollTo({ top: 0, behavior: 'smooth' });
      next.def.onShow?.(params, next.el);
      return;
    }
    if (!silent) haptic.select();
    const prev = current && screens.get(current);
    const dir = prev ? Math.sign(TABS.findIndex((x) => x.id === id) - TABS.findIndex((x) => x.id === current)) || 1 : 0;
    next.el.style.transition = 'none';
    next.el.style.setProperty('--fx', `${dir * 34}px`);
    void next.el.offsetWidth;
    next.el.style.transition = '';
    if (prev) { prev.el.style.setProperty('--fx', `${-dir * 34}px`); prev.el.classList.remove('is-active'); prev.el.setAttribute('aria-hidden', 'true'); prev.def.onHide?.(); }
    current = id;
    if (!next.mounted) {
      next.def.mount(next.el, params);
      next.mounted = true;
      next.el.classList.add('is-entering');
      setTimeout(() => next.el.classList.remove('is-entering'), 1500);
    }
    next.el.classList.add('is-active');
    next.el.removeAttribute('aria-hidden');
    this.markActive(id);
    next.def.onShow?.(params, next.el);
    if (location.hash !== `#/${id}`) history.replaceState(null, '', `#/${id}`);
  },

  /** Rebuild every mounted screen (language / currency change). */
  refreshAll() {
    screens.forEach((s, id) => {
      s.el.setAttribute('aria-label', t(TABS.find((x) => x.id === id).label));
      if (s.mounted) { s.def.mount(s.el, {}); s.def.onShow?.({}, s.el); }
    });
  },

  screen(id) { return screens.get(id)?.el; },
};

export const go = (id, params) => router.go(id, params);
