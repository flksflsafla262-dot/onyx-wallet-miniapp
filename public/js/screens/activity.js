// Activity: filter chips + transactions grouped by day.
import { state, bus } from '../core/state.js';
import { esc, delegate, $, $$ } from '../core/dom.js';
import { icon } from '../ui/icons.js';
import { dayLabel } from '../core/format.js';
import { haptic } from '../core/telegram.js';
import { t } from '../i18n.js';
import { txRow } from '../flows/common.js';
import { openTx } from '../flows/txDetail.js';

let root;
let filter = 'all';
const FILTERS = ['all', 'send', 'receive', 'swap', 'buy'];

function renderList() {
  const items = [...state.txs].filter((x) => filter === 'all' || x.type === filter).sort((a, b) => b.ts - a.ts);
  const host = $('[data-list]', root);
  if (!items.length) {
    host.innerHTML = `<div class="empty"><div class="empty-ic">${icon('activity', 32)}</div><h3>${esc(t('activity.empty'))}</h3><p>${esc(t('activity.emptySub'))}</p></div>`;
    return;
  }
  const groups = [];
  for (const tx of items) {
    const label = dayLabel(tx.ts);
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.items.push(tx); else groups.push({ label, items: [tx] });
  }
  host.innerHTML = groups.map((g) => `<div class="day-label">${esc(g.label)}</div><div class="list">${g.items.map(txRow).join('')}</div>`).join('');
}

function render() {
  root.innerHTML = `
    <div class="inner">
      <header class="navbar"><span class="nav-title">${esc(t('tab.activity'))}</span></header>
      <h1 class="large-title reveal" style="--i:0">${esc(t('tab.activity'))}</h1>
      <div class="chips reveal" style="--i:1" role="tablist">${FILTERS.map((f) => `<button class="chip ${f === filter ? 'is-on' : ''}" role="tab" aria-selected="${f === filter}" data-act="filter" data-f="${f}">${esc(t(`activity.f.${f}`))}</button>`).join('')}</div>
      <div class="reveal" style="--i:2" data-list></div>
    </div>`;
  renderList();
}

export const activityScreen = {
  mount(el) {
    const first = !root;
    root = el;
    render();
    if (!first) return;
    delegate(root, {
      tx(b) { openTx(b.dataset.id); },
      filter(b) {
        haptic.select();
        filter = b.dataset.f;
        $$('.chips .chip', root).forEach((c) => { const on = c === b; c.classList.toggle('is-on', on); c.setAttribute('aria-selected', String(on)); });
        renderList();
      },
    });
    bus.on('data', renderList);
    bus.on('txupdate', renderList);
  },
  onShow() { renderList(); },
};
