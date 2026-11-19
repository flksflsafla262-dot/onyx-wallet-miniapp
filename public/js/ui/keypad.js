// Numeric keypad (touch + hardware keyboard) and amount-string helpers.
import { icon } from './icons.js';
import { haptic } from '../core/telegram.js';

export function keypadHTML({ decimal = true, label = 'Keypad' } = {}) {
  const k = (v, content, cls = '') => `<button type="button" class="key ${cls}" data-k="${v}" aria-label="${v === 'back' ? 'Delete' : v === '.' ? 'Decimal point' : v}">${content}</button>`;
  return `<div class="keypad" role="group" aria-label="${label}">
    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => k(n, n)).join('')}
    ${decimal ? k('.', '<span style="font-size:36px;line-height:1;font-weight:700">.</span>', 'fn') : '<button type="button" class="key" disabled aria-hidden="true" tabindex="-1"></button>'}
    ${k(0, 0)}
    ${k('back', icon('backspace', 28), 'fn')}
  </div>`;
}

/**
 * Wire a keypad. onKey receives '0'..'9', '.', 'back'.
 * Hardware keyboard works too (digits, ., ,, Backspace).
 */
export function bindKeypad(root, onKey, { signal, keyboard = true } = {}) {
  let holdT, holdI;
  const stop = () => { clearTimeout(holdT); clearInterval(holdI); };
  root.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.key[data-k]');
    if (!b || b.disabled) return;
    const k = b.dataset.k;
    haptic.select();
    onKey(k);
    b._fired = true;
    if (k === 'back') {
      holdT = setTimeout(() => { holdI = setInterval(() => { haptic.select(); onKey('back'); }, 70); }, 380);
    }
  }, { signal });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => root.addEventListener(ev, stop, { signal }));
  // keyboard activation of focused key buttons (Enter/Space → click with detail 0)
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.key[data-k]');
    if (!b) return;
    if (b._fired) { b._fired = false; return; }
    onKey(b.dataset.k);
  }, { signal });

  if (keyboard) {
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest?.('input, textarea')) return;
      if (/^[0-9]$/.test(e.key)) onKey(e.key);
      else if (e.key === '.' || e.key === ',') onKey('.');
      else if (e.key === 'Backspace') onKey('back');
      else return;
      e.preventDefault();
    }, { signal });
  }
  signal?.addEventListener('abort', stop);
}

/** Apply a keypress to an amount string. */
export function applyAmountKey(str, key, maxDecimals = 8, maxLen = 14) {
  if (key === 'back') return str.slice(0, -1);
  if (key === '.') {
    if (maxDecimals === 0 || str.includes('.')) return str;
    return str === '' ? '0.' : `${str}.`;
  }
  if (str.length >= maxLen) return str;
  if (str === '0') return key;
  const dot = str.indexOf('.');
  if (dot > -1 && str.length - dot - 1 >= maxDecimals) return str;
  return str + key;
}

export const parseAmount = (s) => (s && s !== '.' ? parseFloat(s) || 0 : 0);
