// Transaction details sheet (live-updates while pending).
import { state, bus } from '../core/state.js';
import { esc, delegate } from '../core/dom.js';
import { icon, coin } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { toast } from '../ui/toast.js';
import { NETWORKS } from '../data/assets.js';
import { fmtAmount, fmtFiat, shortAddr, dateTimeLabel } from '../core/format.js';
import { copyText, openLink, haptic } from '../core/telegram.js';
import { t } from '../i18n.js';
import { kvRows, txTitle } from './common.js';

const statusTag = (s) => `<span class="tag ${s === 'confirmed' ? 'pos' : s === 'pending' ? 'warn' : ''}">${esc(t(`tx.status.${s}`))}</span>`;

export function openTx(id) {
  const tx = state.txs.find((x) => x.id === id);
  if (!tx) return null;
  const a = state.byId[tx.assetId];
  const to = tx.toAssetId ? state.byId[tx.toAssetId] : null;
  const net = NETWORKS[tx.network];

  const body = (x) => {
    const incoming = x.type === 'receive' || x.type === 'buy';
    const main = x.type === 'swap' ? { a: to, n: x.toAmount, s: '+' } : { a, n: x.amount, s: incoming ? '+' : '−' };
    const fa = state.byId[x.feeAssetId];
    const rows = [
      [t('tx.statusLabel'), statusTag(x.status)],
      [t('tx.date'), esc(dateTimeLabel(x.ts))],
    ];
    if (x.type === 'send' || x.type === 'receive') rows.push([x.type === 'send' ? t('tx.to') : t('tx.from'), `<span class="mono copyable" style="font-size:13px" data-act="copy" data-v="${esc(x.address)}">${esc(shortAddr(x.address, 10, 8))}</span>`]);
    if (x.type === 'swap') {
      rows.push([t('tx.paid'), `<span class="num">${esc(fmtAmount(x.amount, a.decimals))} ${esc(a.symbol)}</span>`]);
      rows.push([t('tx.rate'), `<span class="num">1 ${esc(a.symbol)} ≈ ${esc(fmtAmount(x.toAmount / x.amount, 6))} ${esc(to.symbol)}</span>`]);
    }
    if (x.type === 'buy') rows.push([t('buy.youPay'), `<span class="num">${esc(fmtFiat(x.fiatUsd))}</span>`]);
    if (net) rows.push([t('common.network'), esc(net.name)]);
    if (x.fee) rows.push([t('send.fee'), `<span class="num">${esc(fmtAmount(x.fee, 8))} ${esc(fa?.symbol || '')}</span>`]);
    rows.push([t('tx.confirmations'), `<span class="num">${x.confirmations}</span>`]);
    rows.push([t('tx.hash'), `<span class="mono copyable" style="font-size:13px" data-act="copy" data-v="${esc(x.hash)}">${esc(shortAddr(x.hash, 8, 8))}</span>`]);
    return `
      <div class="review-top">
        ${coin(main.a, 64)}
        <div class="big num ${incoming || x.type === 'swap' ? 'pos' : ''}">${main.s}${esc(fmtAmount(main.n, main.a.decimals))} ${esc(main.a.symbol)}</div>
        <div class="sub num">${esc(fmtFiat(main.n * main.a.price))}</div>
      </div>${kvRows(rows)}`;
  };

  return openSheet({
    size: 'auto',
    pane: {
      title: txTitle(tx),
      scroll: body(tx),
      foot: `${net ? `<button class="btn btn-secondary" data-act="explorer">${icon('external', 20)}<span>${esc(t('tx.explorer'))}</span></button>` : ''}`,
      setup(root, ctx) {
        const scroller = ctx.scroller;
        delegate(root, {
          async copy(el) { haptic.light(); if (await copyText(el.dataset.v)) toast(t('common.copied')); },
          explorer() { if (net) openLink(net.explorer + tx.hash); },
        }, { signal: ctx.signal });
        const off = bus.on('txupdate', (u) => { if (u.id === tx.id) scroller.innerHTML = body(u); });
        ctx.signal.addEventListener('abort', off);
      },
    },
  });
}
