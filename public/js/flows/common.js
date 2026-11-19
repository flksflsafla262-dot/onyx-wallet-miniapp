// Shared view fragments for screens and flows.
import { state } from '../core/state.js';
import { esc } from '../core/dom.js';
import { icon, coin } from '../ui/icons.js';
import { fmtAmount, fmtFiat, fmtPct, trendClass, shortAddr, timeLabel } from '../core/format.js';
import { t } from '../i18n.js';
import { NETWORKS } from '../data/assets.js';

export const asset = (id) => state.byId[id];

/** Holding / market row. */
export function assetRow(a, { act = 'asset', sub = 'bal', extra = '' } = {}) {
  const left = sub === 'bal'
    ? `<span class="row-sub num" data-bind="bal:${a.id}"></span>`
    : `<span class="row-sub">${esc(a.symbol)}</span>`;
  return `
    <button class="row asset-row press-soft" data-act="${act}" data-id="${a.id}">
      ${coin(a, 44)}
      <span class="row-body"><span class="row-title">${esc(a.name)}</span>${left}</span>
      ${extra}
      <span class="row-end">
        <span class="row-title num asset-val" data-bind="value:${a.id}"></span>
        <span class="row-sub num ${trendClass(a.change24h)}" data-bind="chg:${a.id}"></span>
      </span>
    </button>`;
}

export const TX_ICON = { send: 'arrowUp', receive: 'arrowDown', swap: 'swap', buy: 'plus' };

export function txTitle(tx) { return t(`tx.${tx.type}`); }

export function txSubtitle(tx) {
  if (tx.status === 'pending') return `<span class="dot-live"></span> ${esc(t('tx.pending'))}`;
  if (tx.status === 'failed') return esc(t('tx.failed'));
  if (tx.type === 'swap') return `${esc(tx.assetId)} → ${esc(tx.toAssetId)} · ${timeLabel(tx.ts)}`;
  if (tx.type === 'buy') return `${esc(t('tx.card'))} · ${timeLabel(tx.ts)}`;
  const dir = tx.type === 'send' ? t('tx.to') : t('tx.from');
  return `${esc(dir)} ${esc(shortAddr(tx.address, 4, 4))} · ${timeLabel(tx.ts)}`;
}

export function txRow(tx) {
  const a = asset(tx.assetId);
  if (!a) return '';
  const incoming = tx.type === 'receive' || tx.type === 'buy';
  const shown = tx.type === 'swap' ? { a: asset(tx.toAssetId), n: tx.toAmount, sign: '+' } : { a, n: tx.amount, sign: incoming ? '+' : '−' };
  const cls = tx.status === 'failed' ? 'fail' : incoming || tx.type === 'swap' ? 'in' : '';
  return `
    <button class="row press-soft" data-act="tx" data-id="${esc(tx.id)}">
      <span class="tx-ic ${cls} ${tx.status === 'pending' ? 'pending' : ''}">${icon(TX_ICON[tx.type], 22)}</span>
      <span class="row-body"><span class="row-title">${esc(txTitle(tx))}</span><span class="row-sub">${txSubtitle(tx)}</span></span>
      <span class="row-end">
        <span class="row-title num ${incoming || tx.type === 'swap' ? 'pos' : ''}">${shown.sign}${esc(fmtAmount(shown.n, shown.a.decimals))} ${esc(shown.a.symbol)}</span>
        <span class="row-sub num">${esc(fmtFiat(shown.n * shown.a.price))}</span>
      </span>
    </button>`;
}

export const netChips = (assetObj, selected) => assetObj.networks.length < 2 ? '' : `
  <div class="net-chips" role="radiogroup" aria-label="${esc(t('common.network'))}">
    ${assetObj.networks.map((n) => `<button class="chip ${n === selected ? 'is-on' : ''}" role="radio" aria-checked="${n === selected}" data-act="net" data-net="${n}">${esc(NETWORKS[n].name)}${NETWORKS[n].tag !== NETWORKS[n].name ? ` <span style="opacity:.6;font-size:12px">${esc(NETWORKS[n].tag)}</span>` : ''}</button>`).join('')}
  </div>`;

export function deltaPill(pct, extraCls = '') {
  return `<span class="delta ${trendClass(pct)} ${extraCls}">${pct > 0.005 ? icon('arrowUp', 12) : pct < -0.005 ? icon('arrowDown', 12) : ''}${esc(fmtPct(pct, { sign: false }))}</span>`;
}

/** Loading/success/failure hero used at the end of every flow. */
export function statusScroll({ title, text }) {
  return `
    <div class="status-hero">
      <div class="ring" data-ring>
        <svg class="r" viewBox="0 0 108 108" aria-hidden="true"><circle class="r-bg" cx="54" cy="54" r="48" fill="none"/><circle class="r-fg" cx="54" cy="54" r="48" fill="none"/></svg>
        <span class="r-ic" data-ring-ic>${icon('check', 46)}</span>
      </div>
      <h2 data-s-title>${esc(title)}</h2>
      <p data-s-text>${esc(text)}</p>
    </div>
    <div data-s-extra></div>`;
}

export function statusControl(root) {
  const ring = root.querySelector('[data-ring]');
  const ic = root.querySelector('[data-ring-ic]');
  const h = root.querySelector('[data-s-title]');
  const p = root.querySelector('[data-s-text]');
  const extra = root.querySelector('[data-s-extra]');
  const set = (cls, iconName, title, text) => {
    ring.classList.remove('done', 'fail');
    void ring.offsetWidth;
    ring.classList.add(cls);
    ic.innerHTML = icon(iconName, 46);
    h.textContent = title; p.textContent = text;
  };
  return {
    success: (title, text) => set('done', 'check', title, text),
    fail: (title, text) => set('fail', 'x', title, text),
    extra: (html) => { extra.innerHTML = html; },
  };
}

export function kvRows(rows) {
  return `<div class="card">${rows.filter(Boolean).map(([k, v, cls = '']) => `<div class="kv"><span>${esc(k)}</span><span class="${cls}">${v}</span></div>`).join('')}</div>`;
}

export function errorText(e) {
  const code = e?.code;
  if (code === 'INSUFFICIENT') return t('err.insufficient');
  if (code === 'FEE') return t('err.fee');
  if (code === 'BAD_ADDRESS') return t('err.address');
  if (code === 'EXPIRED') return t('err.expired');
  return t('err.generic');
}
