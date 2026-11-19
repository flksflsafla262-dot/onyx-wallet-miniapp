// Swap: two token cards, live quote, review sheet, status.
import { state } from '../core/state.js';
import { esc, delegate, $, debounce } from '../core/dom.js';
import { icon, coin } from '../ui/icons.js';
import { provider } from '../services/provider.js';
import { fmtAmount, fmtFiat, fmtPct, fmtPlain } from '../core/format.js';
import { haptic } from '../core/telegram.js';
import { openSheet } from '../ui/sheet.js';
import { t } from '../i18n.js';
import { pickAsset } from '../flows/pickers.js';
import { kvRows } from '../flows/common.js';
import { requirePin } from '../flows/security.js';
import { runWithStatus } from '../flows/status.js';

let root;
let from = 'ETH';
let to = 'USDT';
let amountStr = '';
let quote = null;
let seq = 0;
let timer = null;

const A = (id) => state.byId[id];
const amt = () => (amountStr && amountStr !== '.' ? parseFloat(amountStr) || 0 : 0);
const bal = (id) => state.balances[id] || 0;

function render() {
  root.innerHTML = `
    <div class="inner">
      <header class="navbar"><span class="nav-title">${esc(t('tab.swap'))}</span></header>
      <h1 class="large-title reveal" style="--i:0">${esc(t('tab.swap'))}</h1>

      <div class="swap-stack reveal" style="--i:1">
        <div class="swap-card">
          <div class="swap-top"><span>${esc(t('swap.pay'))}</span><button data-act="max" data-bal aria-label="${esc(t('send.max'))}"></button></div>
          <div class="swap-mid">
            <input data-in inputmode="decimal" autocomplete="off" placeholder="0" aria-label="${esc(t('swap.pay'))}" value="${esc(amountStr)}" />
            <button class="token-btn press" data-act="pickFrom" data-tok="from"></button>
          </div>
          <div class="swap-bot"><span class="num" data-fiat-in></span></div>
        </div>
        <button class="swap-flip" data-act="flip" aria-label="${esc(t('swap.flip'))}">${icon('updown', 22)}</button>
        <div class="swap-card">
          <div class="swap-top"><span>${esc(t('swap.receive'))}</span><span class="num" data-bal-to></span></div>
          <div class="swap-mid">
            <div class="out is-empty num" data-out aria-live="polite">0</div>
            <button class="token-btn press" data-act="pickTo" data-tok="to"></button>
          </div>
          <div class="swap-bot"><span class="num" data-fiat-out></span><span data-impact></span></div>
        </div>
      </div>

      <div class="pcts reveal" style="--i:2">${[25, 50, 75, 100].map((p) => `<button data-act="pct" data-p="${p}">${p === 100 ? esc(t('send.max')) : `${p}%`}</button>`).join('')}</div>

      <div class="card quote quote-fade reveal" style="--i:3" data-quote hidden></div>

      <div class="swap-cta reveal" style="--i:4"><button class="btn btn-primary" data-act="review" disabled><span class="btn-label" data-cta></span></button></div>
    </div>`;
  paintStatic();
  paint();
}

function paintStatic() {
  const a = A(from), b = A(to);
  $('[data-tok="from"]', root).innerHTML = `${coin(a, 32)}<span>${esc(a.symbol)}</span>${icon('chevD', 16)}`;
  $('[data-tok="to"]', root).innerHTML = `${coin(b, 32)}<span>${esc(b.symbol)}</span>${icon('chevD', 16)}`;
  $('[data-bal]', root).textContent = `${t('send.available')}: ${state.settings.hideBalance ? '••••' : fmtAmount(bal(from), a.decimals)}`;
  $('[data-bal-to]', root).textContent = bal(to) > 0 && !state.settings.hideBalance ? `${t('send.available')}: ${fmtAmount(bal(to), b.decimals)}` : '';
}

function paint() {
  const a = A(from), b = A(to);
  const v = amt();
  $('[data-fiat-in]', root).textContent = v > 0 ? `≈ ${fmtFiat(v * a.price)}` : '';
  const out = $('[data-out]', root);
  const q = quote && quote.from === from && quote.to === to && Math.abs(quote.amount - v) < 1e-12 ? quote : null;
  if (q) {
    out.textContent = fmtAmount(q.toAmount, b.decimals);
    out.classList.remove('is-empty');
    $('[data-fiat-out]', root).textContent = `≈ ${fmtFiat(q.toAmount * b.price)}`;
    $('[data-impact]', root).innerHTML = q.impact > 1 ? `<span class="tag warn">${esc(t('swap.impact', { v: fmtPct(q.impact, { sign: false }) }))}</span>` : '';
  } else {
    out.textContent = '0'; out.classList.add('is-empty');
    $('[data-fiat-out]', root).textContent = '';
    $('[data-impact]', root).innerHTML = '';
  }
  const box = $('[data-quote]', root);
  box.hidden = !(v > 0);
  if (v > 0) {
    box.classList.toggle('is-stale', !q);
    const src = q || quote;
    if (src) {
      box.innerHTML = `
        <div class="kv"><span>${esc(t('swap.rate'))}</span><span class="num">1 ${esc(a.symbol)} ≈ ${esc(fmtAmount(src.rate, 6))} ${esc(b.symbol)}</span></div>
        <div class="kv"><span>${esc(t('send.fee'))}</span><span class="num">${esc(fmtFiat(src.feeUsd))} <span class="faint">(${esc(fmtPct(src.feePct * 100, { sign: false }))})</span></span></div>
        <div class="kv"><span>${esc(t('swap.slippage'))}</span><span class="num">${esc(fmtPlain(src.slippage, 1))}%</span></div>
        <div class="kv"><span>${esc(t('swap.minReceived'))}</span><span class="num">${esc(fmtAmount(src.minReceived, b.decimals))} ${esc(b.symbol)}</span></div>
        <div class="kv"><span>${esc(t('swap.route'))}</span><span>${esc(src.route.join(' → '))}</span></div>`;
    } else box.innerHTML = '<div class="kv"><span class="sk" style="width:100%;height:18px"></span></div>'.repeat(3);
  }
  const cta = $('[data-cta]', root);
  const btn = $('[data-act="review"]', root);
  let label = t('swap.review'), ok = !!q;
  if (!(v > 0)) { label = t('swap.enter'); ok = false; }
  else if (v > bal(from) + 1e-12) { label = t('swap.insufficient', { sym: a.symbol }); ok = false; }
  else if (!q) { label = t('swap.fetching'); ok = false; }
  cta.textContent = label;
  btn.disabled = !ok;
}

const requote = debounce(async () => {
  const v = amt();
  if (!(v > 0) || v > bal(from) + 1e-12) { paint(); return; }
  const mine = ++seq;
  const q = await provider.quoteSwap({ from, to, amount: v });
  if (mine !== seq) return;
  quote = q;
  paint();
}, 320);

function onAmountChange() {
  paint();
  requote();
}

function setAmount(str) {
  amountStr = str;
  const input = $('[data-in]', root);
  if (input.value !== str) input.value = str;
  onAmountChange();
}

async function pick(which) {
  const other = which === 'from' ? to : from;
  const id = await pickAsset({ title: t('pick.asset'), exclude: [other] });
  if (!id) return;
  if (which === 'from') from = id; else to = id;
  quote = null;
  paintStatic();
  if (amountStr) amountStr = trimDecimals(amountStr);
  setAmount(amountStr);
}

const trimDecimals = (s) => { const d = A(from).decimals; const i = s.indexOf('.'); return i > -1 ? s.slice(0, i + 1 + d) : s; };

function reviewSheet() {
  const q = quote;
  const a = A(q.from), b = A(q.to);
  const sheet = openSheet({
    pane: {
      title: t('swap.confirm'),
      scroll: `
        <div class="review-top">
          <div class="swap-pair">${coin(a, 56)}<span class="arrow">${icon('arrowRight', 18)}</span>${coin(b, 56)}</div>
          <div class="big num">${esc(fmtAmount(q.toAmount, b.decimals))} ${esc(b.symbol)}</div>
          <div class="sub num">${esc(t('swap.for', { v: `${fmtAmount(q.amount, a.decimals)} ${a.symbol}` }))}</div>
        </div>
        ${kvRows([
          [t('swap.rate'), `<span class="num">1 ${esc(a.symbol)} ≈ ${esc(fmtAmount(q.rate, 6))} ${esc(b.symbol)}</span>`],
          [t('send.fee'), `<span class="num">${esc(fmtFiat(q.feeUsd))}</span>`],
          [t('swap.slippage'), `<span class="num">${esc(fmtPlain(q.slippage, 1))}%</span>`],
          [t('swap.minReceived'), `<span class="num">${esc(fmtAmount(q.minReceived, b.decimals))} ${esc(b.symbol)}</span>`],
          [t('swap.route'), esc(q.route.join(' → '))],
        ])}`,
      foot: `<button class="btn btn-primary" data-act="go">${esc(t('swap.exchange'))}</button>`,
      setup(rootEl, ctx) {
        delegate(rootEl, {
          async go() {
            haptic.medium();
            if (!(await requirePin(t('send.pinTitle')))) return;
            const fresh = Date.now() > q.expiresAt ? await provider.quoteSwap({ from: q.from, to: q.to, amount: q.amount }) : q;
            const task = provider.swap(fresh);
            task.catch(() => {});
            runWithStatus(sheet, {
              title: t('swap.processing'), text: t('swap.processingSub'), task,
              success: (tx) => {
                setAmount('');
                quote = null;
                paintStatic();
                return { title: t('swap.done'), text: t('swap.doneSub', { a: `${fmtAmount(tx.amount, a.decimals)} ${a.symbol}`, b: `${fmtAmount(tx.toAmount, b.decimals)} ${b.symbol}` }) };
              },
            });
          },
        }, { signal: ctx.signal });
      },
    },
  });
}

export const swapScreen = {
  mount(el, params = {}) {
    const first = !root;
    root = el;
    render();
    if (!first) return;
    delegate(root, {
      pickFrom() { pick('from'); },
      pickTo() { pick('to'); },
      flip(b) {
        haptic.medium();
        b.classList.toggle('spin');
        const outAmt = quote && quote.from === from ? quote.toAmount : 0;
        [from, to] = [to, from];
        quote = null;
        paintStatic();
        setAmount(outAmt > 0 ? trimDecimals(String(+outAmt.toFixed(A(from).decimals))) : '');
      },
      max() { haptic.light(); if (bal(from) > 0) setAmount(String(+bal(from).toFixed(A(from).decimals))); },
      pct(b) { haptic.select(); const v = bal(from) * (Number(b.dataset.p) / 100); if (v > 0) setAmount(String(+v.toFixed(A(from).decimals))); },
      review() { if (quote) reviewSheet(); },
    });
    root.addEventListener('input', (e) => {
      if (!e.target.matches('[data-in]')) return;
      let v = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
      const i = v.indexOf('.');
      if (i > -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '');
      v = trimDecimals(v);
      if (v.length > 16) v = v.slice(0, 16);
      e.target.value = v;
      amountStr = v;
      onAmountChange();
    });
    // keep quotes fresh while the tab is visible
    timer = setInterval(() => { if (root.classList.contains('is-active') && amt() > 0 && !document.hidden && !document.querySelector('.sheet-wrap')) requote(); }, 15000);
  },
  onShow(params = {}) {
    if (params.from && A(params.from)) {
      from = params.from;
      if (to === from) to = from === 'USDT' ? 'BTC' : 'USDT';
      quote = null;
      amountStr = '';
      render();
    } else paintStatic();
  },
};
