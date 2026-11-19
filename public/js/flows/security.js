// Passcode, biometrics and the lock screen.
// NOTE: the PIN hash lives in localStorage for now. When you connect a backend,
// move verification server-side / to Telegram SecureStorage (see README → Going live).
import { state, setSettings, setPinHash, storage } from '../core/state.js';
import { PIN_LENGTH } from '../config.js';
import { esc, el, sleep } from '../core/dom.js';
import { icon } from '../ui/icons.js';
import { keypadHTML, bindKeypad } from '../ui/keypad.js';
import { haptic, biometric } from '../core/telegram.js';
import { t } from '../i18n.js';

const layer = () => document.getElementById('lock-layer');

async function sha256(text) {
  const salt = 'onyx.v1:';
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 5381; for (const c of salt + text) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
    return `x${h.toString(16)}`;
  }
}

/* ---------- attempts / cooldown ---------- */
let fails = 0;
const lockedUntil = () => storage.get('lockUntil', 0);
function registerFail() {
  fails += 1;
  if (fails >= 5) { storage.set('lockUntil', Date.now() + 30000); fails = 0; }
}

/**
 * Low-level PIN pad. Calls onComplete(pin, ctl) when PIN_LENGTH digits are entered.
 */
function pinPad({ title, subtitle = '', cancelable = false, bio = false, opaque = false, onComplete, onCancel, bioLabel }) {
  const node = el(`
    <div class="lock ${opaque ? 'opaque' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="lock-top">
        <div class="lock-ic">${icon('lock', 28)}</div>
        <h2 data-title>${esc(title)}</h2>
        <p data-sub aria-live="polite">${esc(subtitle)}</p>
        <div class="pin-dots" data-dots aria-hidden="true">${'<i></i>'.repeat(PIN_LENGTH)}</div>
      </div>
      ${keypadHTML({ decimal: false, label: t('lock.keypad') })}
      <div class="lock-foot">
        <span>${cancelable ? `<button data-cancel>${esc(t('common.cancel'))}</button>` : ''}</span>
        <span>${bio ? `<button data-bio aria-label="${esc(bioLabel || t('lock.biometric'))}">${icon(biometric.type === 'face' ? 'faceid' : 'fingerprint', 28)}</button>` : ''}</span>
      </div>
    </div>`);
  layer().appendChild(node);
  const dots = [...node.querySelectorAll('.pin-dots i')];
  const dotsWrap = node.querySelector('[data-dots]');
  const sub = node.querySelector('[data-sub]');
  const ac = new AbortController();
  let pin = '';
  let busy = false;

  const paint = () => dots.forEach((d, i) => d.classList.toggle('on', i < pin.length));
  const ctl = {
    el: node,
    setTitle: (s) => { node.querySelector('[data-title]').textContent = s; },
    setSubtitle: (s) => { sub.textContent = s; },
    reset() { pin = ''; paint(); },
    async error(msg) {
      haptic.error();
      sub.textContent = msg || '';
      dotsWrap.classList.remove('shake'); void dotsWrap.offsetWidth; dotsWrap.classList.add('shake');
      await sleep(520);
      dotsWrap.classList.remove('shake');
      pin = ''; paint(); busy = false;
    },
    async close() {
      ac.abort();
      node.classList.add('is-out');
      await sleep(430);
      node.remove();
    },
  };

  bindKeypad(node, async (k) => {
    if (busy) return;
    if (k === 'back') pin = pin.slice(0, -1);
    else if (/\d/.test(k) && pin.length < PIN_LENGTH) pin += k;
    paint();
    if (pin.length === PIN_LENGTH) {
      busy = true;
      await sleep(120);
      await onComplete(pin, ctl);
      busy = false;
    }
  }, { signal: ac.signal });

  node.querySelector('[data-cancel]')?.addEventListener('click', () => { ctl.close(); onCancel?.(); });
  node.querySelector('[data-bio]')?.addEventListener('click', () => ctl.onBio?.());
  return ctl;
}

async function verifyEntered(pin, ctl) {
  const wait = lockedUntil() - Date.now();
  if (wait > 0) { await ctl.error(t('lock.locked', { s: Math.ceil(wait / 1000) })); return false; }
  if ((await sha256(pin)) === state.pinHash) { fails = 0; return true; }
  registerFail();
  await ctl.error(t('lock.wrong'));
  return false;
}

/* ---------- public flows ---------- */
let unlocking = null;

/** Full-screen unlock (app start / return from background). */
export function unlock() {
  if (!state.settings.passcode || !state.pinHash) return Promise.resolve(true);
  if (unlocking) return unlocking;
  unlocking = new Promise(async (resolve) => {
    const useBio = state.settings.biometric && (await biometric.init());
    const ctl = pinPad({
      title: t('lock.enter'), subtitle: '', opaque: true, bio: useBio,
      async onComplete(pin, c) {
        if (await verifyEntered(pin, c)) { haptic.success(); await c.close(); unlocking = null; resolve(true); }
      },
    });
    ctl.onBio = async () => {
      if (await biometric.request(t('lock.reason'))) { haptic.success(); await ctl.close(); unlocking = null; resolve(true); }
    };
    if (useBio) setTimeout(() => ctl.onBio(), 450);
  });
  return unlocking;
}

/** Ask for PIN before a sensitive action. Resolves true/false. */
export function requirePin(title = t('lock.confirm')) {
  if (!state.settings.passcode || !state.pinHash) return Promise.resolve(true);
  return new Promise(async (resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const useBio = state.settings.biometric && (await biometric.init());
    const ctl = pinPad({
      title, cancelable: true, bio: useBio, onCancel: () => finish(false),
      async onComplete(pin, c) { if (await verifyEntered(pin, c)) { await c.close(); finish(true); } },
    });
    ctl.onBio = async () => { if (await biometric.request(t('lock.reason'))) { await ctl.close(); finish(true); } };
  });
}

/** Create (and confirm) a new passcode. Resolves true when saved. */
export function createPasscode() {
  return new Promise((resolve) => {
    let first = null;
    pinPad({
      title: t('lock.create'), subtitle: t('lock.createSub'), cancelable: true, opaque: true,
      onCancel: () => resolve(false),
      async onComplete(pin, c) {
        if (!first) { first = pin; c.reset(); c.setTitle(t('lock.repeat')); c.setSubtitle(''); haptic.light(); return; }
        if (pin !== first) { first = null; c.setTitle(t('lock.create')); await c.error(t('lock.mismatch')); c.setSubtitle(t('lock.createSub')); return; }
        setPinHash(await sha256(pin));
        setSettings({ passcode: true });
        haptic.success();
        await c.close();
        resolve(true);
      },
    });
  });
}

export async function removePasscode() {
  const ok = await requirePin(t('lock.confirm'));
  if (!ok) return false;
  setPinHash(null);
  setSettings({ passcode: false, biometric: false });
  return true;
}

/* ---------- auto-lock when returning to the app ---------- */
export function initAutoLock() {
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (!state.settings.passcode) return;
    const mode = state.settings.autoLock;
    const limit = mode === 'immediate' ? 3000 : mode === '1m' ? 60000 : mode === '5m' ? 300000 : Infinity;
    if (hiddenAt && Date.now() - hiddenAt > limit) unlock();
  });
}
