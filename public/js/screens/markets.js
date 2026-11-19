// Markets: search, filters, favourites, sparklines.
import { state, toggleFavorite, bus } from '../core/state.js';
import { esc, delegate, $, $$ } from '../core/dom.js';
import { icon, coin } from '../ui/icons.js';
import { sparkline } from '../ui/chart.js';
import { provider } from '../services/provider.js';
import { trendClass } from '../core/format.js';
import { applyBindings } from '../core/bindings.js';
import { haptic } from '../core/telegram.js';
import { t } from '../i18n.js';
import { openAsset } from '../flows/assetDetail.js';

let root;
let filter = 'all';
let query = '';

const FILTERS = ['all', 'fav', 'up', 'down'];

function list() {
  const k = query.trim().toLowerCase();
  let items = state.assets.filter((a) => !k || a.name.toLowerCase().includes(k) || a.symbol.toLowerCase().includes(k));
  if (filter === 'fav') items = items.filter((a) => state.favorites.includes(a.id));
  if (filter === 'up') items = items.filter((a) => a.change24h > 0).sort((a, b) => b.change24h - a.change24h);
  if (filter === 'down') items = items.filter((a) => a.change24h < 0).sort((a, b) => a.change24h - b.change24h);
  return items;
}

function row(a) {
  const fav = state.favorites.includes(a.id);
  return `
    <div class="row mk-row press-soft" role="button" tabindex="0" data-act="asset" data-id="${a.id}" aria-label="${esc(a.name)}">
      ${coin(a, 42)}
      <span class="row-body"><span class="row-title">${esc(a.name)}</span><span class="row-sub">${esc(a.symbol)}</span></span>
      ${sparkline(provider.sparkline(a.id), { up: a.change24h >= 0 })}
      <span class="row-end"><span class="row-title num" data-bind="price:${a.id}"></span><span class="row-sub num ${trendClass(a.change24h)}" data-bind="chg:${a.id}"></span></span>
      <button class="fav ${fav ? 'on' : ''}" data-act="fav" data-id="${a.id}" aria-pressed="${fav}" aria-label="${esc(t('asset.favorite'))}">${icon('star', 20)}</button>
    </div>`;
}

function renderList() {
  const items = list();
  const host = $('[data-list]', root);
  if (!items.length) {
    host.innerHTML = `<div class="empty"><div class="empty-ic">${icon(filter === 'fav' ? 'star' : 'search', 30)}</div><h3>${esc(filter === 'fav' ? t('markets.noFav') : t('common.nothingFound'))}</h3><p>${esc(filter === 'fav' ? t('markets.noFavSub') : t('common.tryAnother'))}</p></div>`;
    return;
  }
  host.innerHTML = `<div class="list">${items.map(row).join('')}</div>`;
  applyBindings(host);
}

function render() {
  root.innerHTML = `
    <div class="inner">
      <header class="navbar"><span class="nav-title">${esc(t('tab.markets'))}</span></header>
      <h1 class="large-title reveal" style="--i:0">${esc(t('tab.markets'))}</h1>
      <div class="mk-head reveal" style="--i:1">
        <label class="search">${icon('search', 20)}<input type="search" data-q placeholder="${esc(t('common.search'))}" value="${esc(query)}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${esc(t('common.search'))}" /></label>
        <div class="chips" role="tablist">${FILTERS.map((f) => `<button class="chip ${f === filter ? 'is-on' : ''}" role="tab" aria-selected="${f === filter}" data-act="filter" data-f="${f}">${esc(t(`markets.f.${f}`))}</button>`).join('')}</div>
      </div>
      <div class="reveal" style="--i:2" data-list></div>
    </div>`;
  renderList();
}

export const marketsScreen = {
  mount(el) {
    const first = !root;
    root = el;
    render();
    if (!first) return;
    delegate(root, {
      asset(b) { openAsset(b.dataset.id); },
      fav(b, e) {
        e.stopPropagation();
        const on = toggleFavorite(b.dataset.id);
        haptic.light();
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
        if (filter === 'fav') renderList();
      },
      filter(b) {
        haptic.select();
        filter = b.dataset.f;
        $$('.chips .chip', root).forEach((c) => { const on = c === b; c.classList.toggle('is-on', on); c.setAttribute('aria-selected', String(on)); });
        renderList();
      },
    });
    root.addEventListener('input', (e) => { if (e.target.matches('[data-q]')) { query = e.target.value; renderList(); } });
    root.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
    });
    provider.onPrices(() => { if (root.classList.contains('is-active')) applyBindings(root); });
    bus.on('favorites', () => { if (!root.classList.contains('is-active')) renderList(); });
  },
  onShow() { applyBindings(root); },
};
