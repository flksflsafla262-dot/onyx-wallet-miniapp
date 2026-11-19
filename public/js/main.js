// App bootstrap.
import { state, bus, setSettings } from './core/state.js';
import { initTelegram, tgUser, startParam, haptic } from './core/telegram.js';
import { detectLang, setLang, t } from './i18n.js';
import { router, TABS } from './core/router.js';
import { applyBindings } from './core/bindings.js';
import { provider } from './services/provider.js';
import { toast } from './ui/toast.js';
import { initMotion } from './ui/motion.js';
import { walletScreen } from './screens/wallet.js';
import { marketsScreen } from './screens/markets.js';
import { swapScreen } from './screens/swap.js';
import { activityScreen } from './screens/activity.js';
import { settingsScreen } from './screens/settings.js';
import { unlock, initAutoLock } from './flows/security.js';
import { openAsset } from './flows/assetDetail.js';
import { openSend } from './flows/send.js';
import { openReceive } from './flows/receive.js';
import { openBuy } from './flows/buy.js';
import { openTx } from './flows/txDetail.js';
import { fmtAmount } from './core/format.js';

const $id = (id) => document.getElementById(id);

function routeFromLink() {
  const param = (startParam() || '').trim();
  const hash = location.hash.replace(/^#\/?/, '');
  const raw = param || hash;
  const [head, arg] = raw.split(/[_:]/);
  if (TABS.some((x) => x.id === head)) return { tab: head };
  if (head === 'asset' && arg) return { tab: 'wallet', open: () => openAsset(arg.toUpperCase()) };
  if (head === 'send') return { tab: 'wallet', open: () => openSend() };
  if (head === 'receive') return { tab: 'wallet', open: () => openReceive() };
  if (head === 'buy') return { tab: 'wallet', open: () => openBuy() };
  if (head === 'tx' && arg) return { tab: 'activity', open: () => openTx(arg) };
  return { tab: 'wallet' };
}

async function boot() {
  initTelegram();
  // A passcode flag without a stored hash can't be verified — reset it instead of trusting it.
  if (state.settings.passcode && !state.pinHash) setSettings({ passcode: false, biometric: false });
  setLang(state.settings.lang || detectLang(tgUser()?.lang));

  const data = await provider.init();
  Object.assign(state, { assets: data.assets, byId: data.byId, balances: data.balances, txs: data.txs, fx: data.fx, ready: true });

  initMotion();
  router.init($id('tabbar'), $id('screens'));
  router.register('wallet', walletScreen);
  router.register('markets', marketsScreen);
  router.register('swap', swapScreen);
  router.register('activity', activityScreen);
  router.register('settings', settingsScreen);
  router.renderTabbar();

  const link = routeFromLink();
  router.go(link.tab, {}, { silent: true });

  // Gate the UI behind the passcode before revealing anything.
  const unlocked = state.settings.passcode ? unlock() : Promise.resolve(true);
  initAutoLock();

  // Reveal
  const splash = $id('splash');
  setTimeout(() => {
    splash.classList.add('is-gone');
    setTimeout(() => splash.remove(), 800);
  }, 350);

  await unlocked;
  if (link.open) setTimeout(link.open, 450);

  /* ----- live events ----- */
  provider.onTx((tx) => {
    bus.emit('txupdate', tx);
    bus.emit('data');
    if (tx.status === 'confirmed' && tx.type === 'receive') {
      const a = state.byId[tx.assetId];
      toast(`${t('tx.receive')}: +${fmtAmount(tx.amount, a.decimals)} ${a.symbol}`);
    }
  });

  bus.on('settings', (patch) => {
    if ('currency' in patch) { router.refreshAll(); }
    applyBindings(document);
  });
  bus.on('lang', () => { router.renderTabbar(); router.refreshAll(); });

  window.addEventListener('hashchange', () => {
    const l = routeFromLink();
    router.go(l.tab);
  });

  // Hide the tab bar while a text field is focused (on-screen keyboard).
  const textual = (el) => el && el.matches?.('input:not([type="checkbox"]):not([type="radio"]), textarea');
  document.addEventListener('focusin', (e) => { if (textual(e.target)) document.body.classList.add('kb-open'); });
  document.addEventListener('focusout', () => setTimeout(() => { if (!textual(document.activeElement)) document.body.classList.remove('kb-open'); }, 60));

  // iOS pinch-zoom / double-tap zoom guards
  ['gesturestart', 'gesturechange'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault()));
  window.__onyx = { router, state, bus, haptic };
}

boot().catch((err) => {
  console.error('Boot failed', err);
  const s = document.getElementById('splash');
  if (s) s.insertAdjacentHTML('beforeend', `<p style="position:absolute;bottom:40px;color:#ff5f57;font:15px sans-serif">${String(err.message || err)}</p>`);
});
