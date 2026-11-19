import { icon } from './icons.js';
import { esc } from '../core/dom.js';
import { haptic } from '../core/telegram.js';

export function toast(message, { type = 'ok', ms = 2400 } = {}) {
  const layer = document.getElementById('toasts');
  const node = document.createElement('div');
  node.className = `toast ${type === 'ok' ? '' : type}`;
  const ic = type === 'err' ? 'x' : type === 'info' ? 'info' : 'check';
  node.innerHTML = `<span class="t-ic">${icon(ic, 14)}</span><span>${esc(message)}</span>`;
  layer.appendChild(node);
  if (type === 'ok') haptic.success(); else if (type === 'err') haptic.error();
  while (layer.children.length > 2) layer.firstElementChild.remove();
  setTimeout(() => {
    node.classList.add('out');
    node.addEventListener('animationend', () => node.remove(), { once: true });
    setTimeout(() => node.remove(), 600);
  }, ms);
}
