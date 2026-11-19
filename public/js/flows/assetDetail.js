// Asset detail sheet: live price, interactive chart, holdings, stats, history.
import { state, toggleFavorite } from '../core/state.js';
import { esc, delegate, $, $$ } from '../core/dom.js';
import { icon, coin } from '../ui/icons.js';
import { openSheet, closeAllSheets } from '../ui/sheet.js';
import { mountChart } from '../ui/chart.js';
import { provider } from '../services/provider.js';
import { RANGES } from '../config.js';
import { fmtFiat, fmtAmount, fmtPct, fmtCompact, trendClass, chartTimeLabel } from '../core/format.js';
import { applyBindings } from '../core/bindings.js';
import { haptic } from '../core/telegram.js';
import { router } from '../core/router.js';
import { t } from '../i18n.js';
import { txRow } from './common.js';
import { openSend } from './send.js';
import { openReceive } from './receive.js';
import { openBuy } from './buy.js';
import { openTx } from './txDetail.js';

export function openAsset(id) {
  const a = state.byId[id];
  if (!a) return null;
  let range = '1D';
  let chart = null;
  let series = null;

  const holdings = () => {
    const bal = state.balances[id] || 0;
    if (bal <= 0) return '';
    return `<div class="card hold sheen" data-tilt>
      <div class="hold-top"><div><h3>${esc(t('asset.yourBalance'))}</h3><div class="big num" data-bind="value:${id}"></div><div class="muted num" style="font-size:14px;margin-top:2px" data-bind="bal:${id}"></div></div>${coin(a, 48)}</div>
    </div>`;
  };

  const stat = (k, v) => `<div class="stat"><small>${esc(t(k))}</small><b class="num">${v}</b></div>`;
  const txs = () => state.txs.filter((x) => x.assetId === id || x.toAssetId === id).slice(0, 5);

  const scroll = () => `
    <div class="ad-top">
      <div class="ad-price num" data-price data-bind="price:${id}"></div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:6px"><span class="delta" data-delta></span><span class="muted" style="font-size:14px" data-rlabel></span></div>
    </div>
    <div class="ad-chart" data-chart><span class="sk" style="position:absolute;inset:20px 0;border-radius:16px"></span></div>
    <div class="range-chips" role="tablist" aria-label="${esc(t('asset.range'))}">${RANGES.map((r) => `<button role="tab" class="${r === range ? 'is-on' : ''}" aria-selected="${r === range}" data-act="range" data-r="${r}">${esc(t(`range.s.${r}`))}</button>`).join('')}</div>
    <div class="actions" style="margin-top:20px">
      <button class="qa press" data-act="send" ${(state.balances[id] || 0) > 0 ? '' : 'disabled style="opacity:.4"'}><span class="qa-btn">${icon('send', 26)}</span>${esc(t('act.send'))}</button>
      <button class="qa press" data-act="receive"><span class="qa-btn">${icon('receive', 26)}</span>${esc(t('act.receive'))}</button>
      <button class="qa press" data-act="swap"><span class="qa-btn">${icon('swap', 26)}</span>${esc(t('act.swap'))}</button>
      <button class="qa press" data-act="buy"><span class="qa-btn">${icon('plus', 26)}</span>${esc(t('act.buy'))}</button>
    </div>
    ${holdings()}
    <div class="section"><div class="section-head"><h2>${esc(t('asset.stats'))}</h2></div>
      <div class="stats">
        ${stat('asset.mcap', esc(fmtFiat(a.mcap, { compact: true })))}
        ${stat('asset.volume', esc(fmtFiat(a.vol, { compact: true })))}
        ${stat('asset.supply', `${esc(fmtCompact(a.supply))} ${esc(a.symbol)}`)}
        ${stat('asset.ath', esc(fmtFiat(a.ath)))}
      </div>
    </div>
    <div class="section"><div class="section-head"><h2>${esc(t('asset.about', { name: a.name }))}</h2></div><p class="about-text">${esc(t(`about.${a.id}`))}</p></div>
    ${txs().length ? `<div class="section"><div class="section-head"><h2>${esc(t('asset.history'))}</h2></div><div class="list">${txs().map(txRow).join('')}</div></div>` : ''}
    <div style="height:12px"></div>`;

  return openSheet({
    pane: {
      title: `${a.name}`,
      right: `<button class="icon-btn plain ${state.favorites.includes(id) ? 'on' : ''}" data-act="fav" aria-pressed="${state.favorites.includes(id)}" aria-label="${esc(t('asset.favorite'))}">${icon('star', 22)}</button>`,
      scroll: scroll(),
      setup(root, ctx) {
        const priceEl = $('[data-price]', root);
        const deltaEl = $('[data-delta]', root);
        const rlabel = $('[data-rlabel]', root);
        const chartEl = $('[data-chart]', root);
        applyBindings(root);

        const paintDelta = (pct) => {
          deltaEl.className = `delta ${trendClass(pct)}`;
          deltaEl.innerHTML = `${pct > 0.005 ? icon('arrowUp', 12) : pct < -0.005 ? icon('arrowDown', 12) : ''}${esc(fmtPct(pct, { sign: false }))}`;
        };
        const paintRange = () => { rlabel.textContent = t(`range.l.${range}`); };

        async function load() {
          paintRange();
          series = await provider.getHistory(id, range);
          if (ctx.signal.aborted) return;
          paintDelta((series[series.length - 1].p / series[0].p - 1) * 100);
          if (!chart) {
            chartEl.innerHTML = '';
            chart = mountChart(chartEl, series, {
              label: (pt) => chartTimeLabel(pt.t, range),
              aria: t('asset.chartAria', { name: a.name }),
              onScrub(pt) {
                if (pt) {
                  priceEl.removeAttribute('data-bind');
                  priceEl.textContent = fmtFiat(pt.p);
                  paintDelta((pt.p / series[0].p - 1) * 100);
                } else {
                  priceEl.setAttribute('data-bind', `price:${id}`);
                  applyBindings(root);
                  paintDelta((series[series.length - 1].p / series[0].p - 1) * 100);
                }
              },
            });
          } else chart.update(series);
        }
        load();
        ctx.signal.addEventListener('abort', () => chart?.destroy());

        const live = () => { if (!priceEl.hasAttribute('data-bind')) return; applyBindings(root); };
        const unsub = provider.onPrices(live);
        ctx.signal.addEventListener('abort', unsub);

        delegate(ctx.head, {
          fav(b) {
            const on = toggleFavorite(id);
            haptic.light();
            b.classList.toggle('on', on);
            b.setAttribute('aria-pressed', String(on));
          },
        }, { signal: ctx.signal });

        delegate(root, {
          range(b) {
            if (b.dataset.r === range) return;
            haptic.select();
            range = b.dataset.r;
            $$('.range-chips button', root).forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); });
            load();
          },
          send() { openSend({ assetId: id }); },
          receive() { openReceive({ assetId: id }); },
          swap() { closeAllSheets(); router.go('swap', { from: id }); },
          buy() { openBuy({ assetId: id }); },
          tx(b) { openTx(b.dataset.id); },
        }, { signal: ctx.signal });
      },
    },
  });
}
