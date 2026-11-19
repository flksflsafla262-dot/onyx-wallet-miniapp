// Telegram Mini App bridge. Every call is guarded so the app also runs in a plain browser.
import { state } from './state.js';

const tg = window.Telegram?.WebApp ?? null;
export const webApp = tg;
export const inTelegram = !!tg && tg.platform && tg.platform !== 'unknown';
export const platform = inTelegram ? tg.platform : 'web';
export const isMobileTg = inTelegram && /ios|android/i.test(tg.platform);

const safe = (fn) => { try { return fn(); } catch { return undefined; } };
const atLeast = (v) => !!tg && safe(() => tg.isVersionAtLeast(v)) === true;

const root = document.documentElement;

function applyViewport() {
  if (!tg) return;
  const h = tg.viewportHeight || window.innerHeight;
  root.style.setProperty('--app-h', `${h}px`);
}

function applySafeAreas() {
  if (!tg) return;
  const s = tg.safeAreaInset || {};
  const c = tg.contentSafeAreaInset || {};
  const set = (k, v) => root.style.setProperty(k, `${Math.max(0, Math.round(v))}px`);
  set('--tg-safe-top', (s.top || 0) + (c.top || 0));
  set('--tg-safe-bottom', (s.bottom || 0) + (c.bottom || 0));
  set('--tg-safe-left', Math.max(s.left || 0, c.left || 0));
  set('--tg-safe-right', Math.max(s.right || 0, c.right || 0));
}

export function initTelegram() {
  // Desktop browser (not inside Telegram): render inside a phone-sized frame.
  if (!inTelegram && window.matchMedia('(min-width: 700px) and (min-height: 600px)').matches) {
    root.setAttribute('data-frame', '');
  }
  if (!tg) return;
  safe(() => tg.ready());
  safe(() => tg.expand());
  if (atLeast('7.7')) safe(() => tg.disableVerticalSwipes());
  if (atLeast('6.1')) {
    safe(() => tg.setHeaderColor('#000000'));
    safe(() => tg.setBackgroundColor('#000000'));
  }
  if (atLeast('7.10')) safe(() => tg.setBottomBarColor('#000000'));
  applyViewport();
  applySafeAreas();
  tg.onEvent('viewportChanged', applyViewport);
  tg.onEvent('safeAreaChanged', applySafeAreas);
  tg.onEvent('contentSafeAreaChanged', applySafeAreas);
  tg.onEvent('fullscreenChanged', () => { applyViewport(); applySafeAreas(); });
}

/* ---------- user ---------- */
export function tgUser() {
  const u = safe(() => tg?.initDataUnsafe?.user);
  if (!u) return null;
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ');
  return { id: u.id, name, first: u.first_name || name, username: u.username || '', photo: u.photo_url || '', lang: u.language_code || '' };
}
export const startParam = () => safe(() => tg?.initDataUnsafe?.start_param) || new URLSearchParams(location.search).get('startapp') || '';

/* ---------- haptics ---------- */
function buzz(kind, style) {
  if (!state.settings.haptics) return;
  const h = tg?.HapticFeedback;
  if (h && inTelegram) {
    safe(() => (kind === 'impact' ? h.impactOccurred(style) : kind === 'notify' ? h.notificationOccurred(style) : h.selectionChanged()));
    return;
  }
  if (navigator.vibrate && /Android/i.test(navigator.userAgent)) safe(() => navigator.vibrate(style === 'heavy' ? 18 : 8));
}
export const haptic = {
  light: () => buzz('impact', 'light'),
  medium: () => buzz('impact', 'medium'),
  heavy: () => buzz('impact', 'heavy'),
  select: () => buzz('select'),
  success: () => buzz('notify', 'success'),
  warning: () => buzz('notify', 'warning'),
  error: () => buzz('notify', 'error'),
};

/* ---------- native back button ---------- */
let backFn = null;
let backBound = false;
export const backButton = {
  show(fn) {
    backFn = fn;
    const b = tg?.BackButton;
    if (!b || !atLeast('6.1')) return;
    if (!backBound) { b.onClick(() => backFn?.()); backBound = true; }
    b.show();
  },
  hide() {
    backFn = null;
    if (atLeast('6.1')) safe(() => tg.BackButton.hide());
  },
};

/* ---------- clipboard / share / links ---------- */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;left:-999px';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove();
    return ok;
  }
}

export function readClipboard() {
  return new Promise((resolve) => {
    if (inTelegram && atLeast('6.4')) {
      let done = false;
      safe(() => tg.readTextFromClipboard((t) => { done = true; resolve(t || ''); }));
      setTimeout(() => { if (!done) resolve(''); }, 1500);
      return;
    }
    navigator.clipboard?.readText ? navigator.clipboard.readText().then(resolve, () => resolve('')) : resolve('');
  });
}

export function scanQr(text) {
  return new Promise((resolve) => {
    if (!inTelegram || !atLeast('6.4')) { resolve(null); return; }
    safe(() => tg.showScanQrPopup({ text }, (data) => { resolve(data); return true; }));
    const onClose = () => { tg.offEvent('scanQrPopupClosed', onClose); resolve(null); };
    tg.onEvent('scanQrPopupClosed', onClose);
  });
}

export function openLink(url) {
  if (inTelegram && /^https:\/\/t\.me\//i.test(url) && safe(() => tg.openTelegramLink)) return safe(() => tg.openTelegramLink(url));
  if (inTelegram) return safe(() => tg.openLink(url));
  window.open(url, '_blank', 'noopener');
}

export function shareText(text) {
  const url = `https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${encodeURIComponent(text)}`;
  if (inTelegram) return openLink(url);
  if (navigator.share) return navigator.share({ text }).catch(() => {});
  return copyText(text);
}

/* ---------- biometrics ---------- */
export const biometric = {
  get manager() { return atLeast('7.2') ? tg.BiometricManager : null; },
  init() {
    const m = this.manager;
    return new Promise((resolve) => {
      if (!m) return resolve(false);
      if (m.isInited) return resolve(m.isBiometricAvailable);
      safe(() => m.init(() => resolve(!!m.isBiometricAvailable)));
      setTimeout(() => resolve(!!m.isBiometricAvailable), 1500);
    });
  },
  get type() { return this.manager?.biometricType || 'unknown'; },
  request(reason) {
    const m = this.manager;
    return new Promise((resolve) => {
      if (!m || !m.isBiometricAvailable) return resolve(false);
      const go = () => safe(() => m.authenticate({ reason }, (ok) => resolve(!!ok)));
      if (m.isAccessRequested || m.isAccessGranted) go();
      else safe(() => m.requestAccess({ reason }, (granted) => (granted ? go() : resolve(false))));
    });
  },
};

export function closeApp() { safe(() => tg?.close()); }
