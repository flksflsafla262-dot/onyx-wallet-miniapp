import { state } from '../core/state.js';
import { esc, delegate, $ } from '../core/dom.js';
import { icon, coin } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { fmtAmount, fmtFiat } from '../core/format.js';
import { haptic } from '../core/telegram.js';
import { t } from '../i18n.js';

/** Reusable asset list pane (search + rows). onPick(id, ctx) */
export function assetListPane({ title, holdingsOnly = false, exclude = [], selected, onPick }) {
  const items = () => state.assets.filter((a) => !exclude.includes(a.id) && (!holdingsOnly || (state.balances[a.id] || 0) > 0));
  const rows = (q) => {
    const k = q.trim().toLowerCase();
    const list = items().filter((a) => !k || a.name.toLowerCase().includes(k) || a.symbol.toLowerCase().includes(k));
    if (!list.length) return `<div class="empty"><div class="empty-ic">${icon('search', 30)}</div><h3>${esc(t('common.nothingFound'))}</h3><p>${esc(t('common.tryAnother'))}</p></div>`;
    const sorted = [...list].sort((a, b) => (state.balances[b.id] || 0) * b.price - (state.balances[a.id] || 0) * a.price);
    return `<div class="list asset-pick">${sorted.map((a) => {
      const bal = state.balances[a.id] || 0;
      return `<button class="row press-soft" data-act="pick" data-id="${a.id}" ${a.id === selected ? 'aria-current="true"' : ''}>
        ${coin(a, 44)}
        <span class="row-body"><span class="row-title">${esc(a.name)}</span><span class="row-sub">${esc(a.symbol)}</span></span>
        <span class="row-end">${bal > 0 ? `<span class="row-title num">${esc(fmtAmount(bal, a.decimals))}</span><span class="row-sub num">${esc(fmtFiat(bal * a.price, { hide: state.settings.hideBalance }))}</span>` : (a.id === selected ? icon('check', 20) : '')}</span>
      </button>`;
    }).join('')}</div>`;
  };
  return {
    title,
    scroll: `
      <div class="search" style="margin-bottom:14px">${icon('search', 20)}<input type="search" data-q placeholder="${esc(t('common.search'))}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${esc(t('common.search'))}" /></div>
      <div data-list>${rows('')}</div>`,
    setup(root, ctx) {
      const list = $('[data-list]', root);
      $('[data-q]', root).addEventListener('input', (e) => { list.innerHTML = rows(e.target.value); }, { signal: ctx.signal });
      delegate(root, { pick(b) { haptic.select(); onPick(b.dataset.id, ctx); } }, { signal: ctx.signal });
    },
  };
}

/** Standalone sheet → Promise<assetId|null> */
export function pickAsset(opts = {}) {
  return new Promise((resolve) => {
    let picked = null;
    openSheet({
      pane: assetListPane({ ...opts, title: opts.title || t('pick.asset'), onPick: (id, ctx) => { picked = id; ctx.close(); } }),
      onClose: () => resolve(picked),
    });
  });
}
