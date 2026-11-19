// Buy with fiat: amount → review → status.
import { state } from '../core/state.js';
import { esc, delegate, $, debounce } from '../core/dom.js';
import { icon, coin } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { keypadHTML, bindKeypad, applyAmountKey, parseAmount } from '../ui/keypad.js';
import { provider } from '../services/provider.js';
import { fmtAmount, fmtFiat, fromFiat, curr, fmtPct } from '../core/format.js';
import { FIAT } from '../config.js';
import { haptic } from '../core/telegram.js';
import { t } from '../i18n.js';
import { pickAsset } from './pickers.js';
import { pickSheet } from '../ui/dialogs.js';
import { kvRows } from './common.js';
import { runWithStatus } from './status.js';

export function openBuy({ assetId = 'BTC' } = {}) {
  const S = { asset: state.byId[assetId] || state.byId.BTC, method: 'card', quote: null };
  let sheet;

  const methodLabel = (id) => t(`buy.${id}`);

  function amountPane() {
    let str = '';
    return {
      title: t('buy.title'),
      scroll: `
        <div style="display:grid;justify-items:center;padding-top:4px"><button class="token-btn" data-act="asset"><span data-coin></span><span data-sym></span>${icon('chevD', 18)}</button></div>
        <div class="amount-wrap">
          <div class="amount-main" data-main><span class="u" data-cur></span><span class="v is-empty" data-v>0</span></div>
          <div class="amount-sub"><span class="num quote-fade" data-sub></span></div>
        </div>
        <div class="amount-err" data-err role="alert"></div>
        <div class="list no-icon" style="--inset:16px"><button class="row press-soft" data-act="method" style="min-height:56px"><span class="row-icon" data-micon></span><span class="row-body"><span class="row-title">${esc(t('buy.payWith'))}</span><span class="row-sub" data-mname></span></span><span class="row-chev">${icon('chevR', 18)}</span></button></div>`,
      foot: `${keypadHTML({ decimal: true })}<button class="btn btn-primary" data-act="next" disabled>${esc(t('common.continue'))}</button>`,
      setup(root, ctx) {
        const el = { v: $('[data-v]', root), cur: $('[data-cur]', root), sub: $('[data-sub]', root), err: $('[data-err]', root), next: $('[data-act="next"]', root), main: $('[data-main]', root), coin: $('[data-coin]', root), sym: $('[data-sym]', root), mname: $('[data-mname]', root), micon: $('[data-micon]', root) };
        const sym = FIAT[curr()].symbol;
        const usd = () => fromFiat(parseAmount(str));
        let seq = 0;
        let q = null;

        const paintStatic = () => {
          el.coin.innerHTML = coin(S.asset, 32);
          el.sym.textContent = S.asset.symbol;
          el.cur.textContent = sym;
          el.mname.textContent = methodLabel(S.method);
          el.micon.innerHTML = icon(S.method === 'card' ? 'card' : 'bank', 20);
        };
        const paint = () => {
          el.v.textContent = str === '' ? '0' : str;
          el.v.classList.toggle('is-empty', str === '');
          el.v.style.fontSize = str.length > 11 ? '40px' : '';
          const u = usd();
          let err = '';
          if (q && u > 0) {
            if (u < q.min) err = t('buy.min', { v: fmtFiat(q.min, { digits: 0 }) });
            else if (u > q.max) err = t('buy.max', { v: fmtFiat(q.max, { digits: 0 }) });
          }
          el.err.textContent = err;
          el.sub.textContent = q && u > 0 ? `≈ ${fmtAmount(q.amount, S.asset.decimals)} ${S.asset.symbol}` : `${S.asset.symbol} ${t('buy.rate')} ${fmtFiat(S.asset.price)}`;
          el.next.disabled = !(u > 0) || !!err || !q;
        };
        const requote = debounce(async () => {
          const u = usd();
          if (!(u > 0)) { q = null; el.sub.classList.remove('is-stale'); paint(); return; }
          el.sub.classList.add('is-stale');
          const mine = ++seq;
          const res = await provider.quoteBuy({ assetId: S.asset.id, fiatUsd: u, method: S.method });
          if (mine !== seq || ctx.signal.aborted) return;
          q = res; S.quote = res;
          el.sub.classList.remove('is-stale');
          paint();
        }, 220);

        paintStatic(); paint();
        bindKeypad(root, (k) => {
          const nx = applyAmountKey(str, k, 2, 9);
          if (nx === str && k !== 'back') { haptic.warning(); return; }
          str = nx; q = null; paint(); requote();
        }, { signal: ctx.signal });
        delegate(root, {
          async asset() {
            const id = await pickAsset({ title: t('buy.pickAsset') });
            if (id) { S.asset = state.byId[id]; q = null; paintStatic(); paint(); requote(); }
          },
          async method() {
            const id = await pickSheet({
              title: t('buy.payWith'), selected: S.method,
              items: provider.buyMethods().map((m) => ({ id: m.id, title: methodLabel(m.id), sub: t('buy.fee', { v: fmtPct(m.feePct * 100, { sign: false }) }), leading: `<span class="row-icon">${icon(m.id === 'card' ? 'card' : 'bank', 20)}</span>` })),
            });
            if (id) { S.method = id; q = null; paintStatic(); paint(); requote(); }
          },
          next() { if (!el.next.disabled) ctx.push(reviewPane(usd())); },
        }, { signal: ctx.signal });
      },
    };
  }

  function reviewPane(fiatUsd) {
    const q = S.quote;
    const a = S.asset;
    return {
      title: t('buy.review'),
      scroll: `
        <div class="review-top">${coin(a, 64)}<div class="big num">${esc(fmtAmount(q.amount, a.decimals))} ${esc(a.symbol)}</div><div class="sub">${esc(t('buy.youGet'))}</div></div>
        ${kvRows([
          [t('buy.youPay'), `<b class="num">${esc(fmtFiat(fiatUsd))}</b>`],
          [t('buy.rate'), `<span class="num">1 ${esc(a.symbol)} = ${esc(fmtFiat(q.rate))}</span>`],
          [t('send.fee'), `<span class="num">${esc(fmtFiat(q.feeUsd))}</span>`],
          [t('buy.method'), esc(methodLabel(S.method))],
        ])}
        <div class="notice neutral" style="margin-top:16px">${icon('info', 20)}<span>${esc(t('buy.note'))}</span></div>`,
      foot: `<button class="btn btn-primary" data-act="pay">${esc(t('buy.pay', { v: fmtFiat(fiatUsd) }))}</button>`,
      setup(root, ctx) {
        delegate(root, {
          pay() {
            haptic.medium();
            const task = provider.buy({ assetId: a.id, fiatUsd, method: S.method });
            task.catch(() => {});
            runWithStatus(sheet, {
              title: t('buy.processing'), text: t('buy.processingSub'), task,
              success: (tx) => ({ title: t('buy.done'), text: t('buy.doneSub', { amount: `${fmtAmount(tx.amount, a.decimals)} ${a.symbol}` }) }),
            });
          },
        }, { signal: ctx.signal });
      },
    };
  }

  sheet = openSheet({ pane: amountPane() });
  return sheet;
}
