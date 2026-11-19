// Wallet home: balance hero with scrubbable chart, quick actions, assets, recent activity.
import { state, portfolio, setSettings, bus } from '../core/state.js';
import { APP, RANGES } from '../config.js';
import { esc, delegate, $, $$, tween } from '../core/dom.js';
import { icon } from '../ui/icons.js';
import { mountChart, sparkline } from '../ui/chart.js';
import { provider } from '../services/provider.js';
import { fmtFiat, fmtFiatParts, fmtPct, trendClass, greeting, chartTimeLabel, MASK } from '../core/format.js';
import { applyBindings } from '../core/bindings.js';
import { haptic, tgUser, scanQr, inTelegram } from '../core/telegram.js';
import { router } from '../core/router.js';
import { toast } from '../ui/toast.js';
import { t } from '../i18n.js';
import { assetRow, txRow } from '../flows/common.js';
import { openAsset } from '../flows/assetDetail.js';
import { openSend } from '../flows/send.js';
import { openReceive } from '../flows/receive.js';
import { openBuy } from '../flows/buy.js';
import { openTx } from '../flows/txDetail.js';
import { createPasscode } from '../flows/security.js';
import { openNotifications } from '../flows/settingsSheets.js';

let root;
let range = '1D';
let chart = null;
let combined = null;
let scrubbing = false;
let shownTotal = 0;
let stopTween = () => {};

const hidden = () => state.settings.hideBalance;

function paintTotal(usd, animate = false) {
  const el = $('[data-total]', root);
  if (!el) return;
  const write = (v) => {
    const [i, f] = fmtFiatParts(v, hidden());
    el.innerHTML = `${esc(i)}<span class="cents">${esc(f)}</span>`;
  };
  stopTween();
  if (animate && !hidden()) stopTween = tween(0, usd, { duration: 1100, onUpdate: write });
  else write(usd);
  shownTotal = usd;
}

function paintDelta(first, last) {
  const pct = (last / first - 1) * 100;
  const abs = last - first;
  const cls = trendClass(pct);
  const el = $('[data-hdelta]', root);
  el.className = `delta ${cls}`;
  el.innerHTML = `${pct > 0.005 ? icon('arrowUp', 12) : pct < -0.005 ? icon('arrowDown', 12) : ''}${esc(fmtPct(pct, { sign: false }))}`;
  const absEl = $('[data-habs]', root);
  absEl.className = `num ${cls === 'flat' ? 'muted' : cls}`;
  absEl.textContent = hidden() ? '' : fmtFiat(abs, { sign: true });
}

async function loadChart(animateTotal = false) {
  const pf = portfolio();
  $('[data-hrange]', root).textContent = t(`range.l.${range}`);
  if (!pf.rows.length) { $('[data-chart]', root).innerHTML = ''; paintTotal(0); return; }
  const mine = range;
  const hs = await Promise.all(pf.rows.map((r) => provider.getHistory(r.asset.id, range)));
  if (mine !== range) return;
  combined = hs[0].map((pt, i) => ({ t: pt.t, p: pf.rows.reduce((s, r, k) => s + r.balance * hs[k][i].p, 0) }));
  paintDelta(combined[0].p, combined[combined.length - 1].p);
  if (animateTotal) paintTotal(pf.total, true);
  const host = $('[data-chart]', root);
  if (!chart) {
    host.innerHTML = '';
    chart = mountChart(host, combined, {
      aria: t('wallet.chartAria'),
      label: (pt) => chartTimeLabel(pt.t, range),
      onScrub(pt) {
        if (pt) {
          scrubbing = true;
          paintTotal(pt.p);
          paintDelta(combined[0].p, pt.p);
        } else {
          scrubbing = false;
          paintTotal(portfolio().total);
          paintDelta(combined[0].p, combined[combined.length - 1].p);
        }
      },
    });
  } else chart.update(combined);
}

function renderLists() {
  const pf = portfolio();
  const assets = $('[data-assets]', root);
  assets.innerHTML = pf.rows.length
    ? `<div class="list">${pf.rows.map((r) => assetRow(r.asset, { extra: sparkline(provider.sparkline(r.asset.id), { up: r.asset.change24h >= 0 }) })).join('')}</div>`
    : `<div class="card empty"><div class="empty-ic">${icon('wallet', 30)}</div><h3>${esc(t('wallet.empty'))}</h3><p>${esc(t('wallet.emptySub'))}</p><button class="btn btn-primary btn-sm" data-act="receive" style="margin-top:8px">${esc(t('act.receive'))}</button></div>`;
  const recent = state.txs.slice(0, 3);
  $('[data-recent]', root).innerHTML = recent.length ? `<div class="list">${recent.map(txRow).join('')}</div>` : '';
  $('[data-recent-sec]', root).hidden = !recent.length;
  applyBindings(root);
}

function render() {
  const user = tgUser();
  const name = user?.first || '';
  const initial = (name || APP.name).charAt(0).toUpperCase();
  root.innerHTML = `
    <div class="inner">
      <header class="navbar">
        <div class="who">
          <button class="avatar press" data-act="profile" aria-label="${esc(t('tab.settings'))}">${user?.photo ? `<img src="${esc(user.photo)}" alt="" referrerpolicy="no-referrer" />` : esc(initial)}</button>
          <div class="who-text"><small>${esc(greeting())}</small><b>${esc(name || APP.name)}</b></div>
        </div>
        <div class="nav-actions">
          <button class="icon-btn press" data-act="scan" aria-label="${esc(t('wallet.scan'))}">${icon('scan', 22)}</button>
          <button class="icon-btn press" data-act="notify" aria-label="${esc(t('settings.notifications'))}">${icon('bell', 22)}</button>
        </div>
      </header>

      <section class="hero reveal" style="--i:0">
        <div class="hero-label"><span>${esc(t('wallet.total'))}</span><button data-act="hide" aria-pressed="${hidden()}" aria-label="${esc(t('wallet.toggleHide'))}">${icon(hidden() ? 'eyeOff' : 'eye', 18)}</button></div>
        <div class="hero-balance" data-total aria-live="polite"></div>
        <div class="hero-delta"><span class="delta flat" data-hdelta></span><span data-habs></span><span class="muted" data-hrange></span></div>
        <div class="hero-chart" data-chart><span class="sk" style="position:absolute;inset:14px 24px;border-radius:18px"></span></div>
        <div class="range-chips" role="tablist" aria-label="${esc(t('asset.range'))}">${RANGES.map((r) => `<button role="tab" class="${r === range ? 'is-on' : ''}" aria-selected="${r === range}" data-act="range" data-r="${r}">${esc(t(`range.s.${r}`))}</button>`).join('')}</div>
      </section>

      <section class="actions reveal" style="--i:1">
        <button class="qa press" data-act="send"><span class="qa-btn">${icon('send', 26)}</span>${esc(t('act.send'))}</button>
        <button class="qa press" data-act="receive"><span class="qa-btn">${icon('receive', 26)}</span>${esc(t('act.receive'))}</button>
        <button class="qa press" data-act="swap"><span class="qa-btn">${icon('swap', 26)}</span>${esc(t('act.swap'))}</button>
        <button class="qa press" data-act="buy"><span class="qa-btn">${icon('plus', 26)}</span>${esc(t('act.buy'))}</button>
      </section>

      ${state.settings.passcode ? '' : `
      <button class="card sheen promo press reveal" style="--i:2" data-act="secure">
        <span class="row-icon">${icon('shield', 22)}</span>
        <span style="flex:1"><b>${esc(t('wallet.secure'))}</b><span>${esc(t('wallet.secureSub'))}</span></span>
        <span class="row-chev">${icon('chevR', 18)}</span>
      </button>`}

      <section class="section reveal" style="--i:3">
        <div class="section-head"><h2>${esc(t('wallet.assets'))}</h2><button data-act="markets">${esc(t('wallet.markets'))}</button></div>
        <div data-assets></div>
      </section>

      <section class="section reveal" style="--i:4" data-recent-sec>
        <div class="section-head"><h2>${esc(t('wallet.recent'))}</h2><button data-act="allActivity">${esc(t('common.all'))}</button></div>
        <div data-recent></div>
      </section>
    </div>`;
  paintTotal(portfolio().total, true);
  renderLists();
  chart?.destroy();
  chart = null;
  loadChart(false);
}

function bind() {
  delegate(root, {
    profile() { router.go('settings'); },
    async scan() {
      haptic.light();
      if (!inTelegram) { toast(t('send.scanUnavailable'), { type: 'info' }); return; }
      const data = await scanQr(t('send.scanText'));
      if (data) openSend({ address: data });
    },
    notify() { openNotifications(); },
    hide() {
      haptic.light();
      setSettings({ hideBalance: !hidden() });
    },
    range(b) {
      if (b.dataset.r === range) return;
      haptic.select();
      range = b.dataset.r;
      $$('.range-chips button', root).forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); });
      loadChart();
    },
    send() { openSend(); },
    receive() { openReceive(); },
    swap() { router.go('swap'); },
    buy() { openBuy(); },
    async secure() { if (await createPasscode()) { toast(t('settings.passcodeOn')); render(); } },
    markets() { router.go('markets'); },
    allActivity() { router.go('activity'); },
    asset(b) { openAsset(b.dataset.id); },
    tx(b) { openTx(b.dataset.id); },
  });
}

export const walletScreen = {
  mount(el) {
    const first = !root;
    root = el;
    chart?.destroy(); chart = null;
    render();
    if (first) {
      bind();
      // depth: hero eases back and fades as the page scrolls
      let ticking = false;
      root.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const hero = root.querySelector('.hero');
          if (!hero || root.classList.contains('is-entering')) return;
          const p = Math.min(1, root.scrollTop / 280);
          hero.style.transform = `translate3d(0, ${p * 26}px, 0) scale(${1 - p * 0.06})`;
          hero.style.opacity = String(1 - p * 0.65);
        });
      }, { passive: true });
      provider.onPrices(() => {
        applyBindings(root);
        if (!scrubbing && root.classList.contains('is-active')) paintTotal(portfolio().total);
      });
      bus.on('data', () => { if (!scrubbing) { paintTotal(portfolio().total); renderLists(); loadChart(); } });
      bus.on('settings', (p) => {
        if (!('hideBalance' in p)) return;
        $('[data-act="hide"]', root).innerHTML = icon(hidden() ? 'eyeOff' : 'eye', 18);
        $('[data-act="hide"]', root).setAttribute('aria-pressed', String(hidden()));
        paintTotal(portfolio().total);
        applyBindings(root);
        if (combined) paintDelta(combined[0].p, combined[combined.length - 1].p);
      });
    }
  },
  onShow() { applyBindings(root); },
};
