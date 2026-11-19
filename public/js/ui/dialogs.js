// Small reusable sheets: option picker and confirmation.
import { openSheet } from './sheet.js';
import { icon } from './icons.js';
import { esc, delegate } from '../core/dom.js';
import { haptic } from '../core/telegram.js';
import { t } from '../i18n.js';

/**
 * items: [{ id, title, sub?, leading?: html, trailing?: html }]
 * Resolves with the picked id (or null if dismissed).
 */
export function pickSheet({ title, items, selected, size = 'auto' }) {
  return new Promise((resolve) => {
    let picked = null;
    const rows = items.map((it) => `
      <button class="opt press-soft ${it.id === selected ? 'is-on' : ''}" data-act="pick" data-id="${esc(it.id)}">
        ${it.leading || ''}
        <span class="l"><b>${esc(it.title)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span>
        ${it.trailing || ''}
        <span class="check">${icon('check', 20)}</span>
      </button>`).join('');
    openSheet({
      size,
      onClose: () => resolve(picked),
      pane: {
        title,
        scroll: `<div class="list no-icon" style="--inset:16px">${rows}</div>`,
        setup(root, ctx) {
          delegate(root, {
            pick(b) {
              haptic.select();
              picked = b.dataset.id;
              setTimeout(() => ctx.close(), 140);
            },
          }, { signal: ctx.signal });
        },
      },
    });
  });
}

/** Resolves true / false. */
export function confirmSheet({ title, message, confirm, cancel = t('common.cancel'), danger = false }) {
  return new Promise((resolve) => {
    let result = false;
    openSheet({
      size: 'auto',
      onClose: () => resolve(result),
      pane: {
        title,
        scroll: `<p class="muted" style="font-size:16px;line-height:1.45;padding:4px 4px 8px;text-align:center">${esc(message)}</p>`,
        foot: `<button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="ok">${esc(confirm)}</button><button class="btn btn-ghost" data-act="no">${esc(cancel)}</button>`,
        setup(root, ctx) {
          delegate(root, {
            ok() { result = true; ctx.close(); },
            no() { ctx.close(); },
          }, { signal: ctx.signal });
        },
      },
    });
  });
}
