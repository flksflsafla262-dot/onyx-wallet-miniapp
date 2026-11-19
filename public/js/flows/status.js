// Final "processing → success / failure" pane shared by Send, Swap and Buy.
import { esc, delegate, sleep } from '../core/dom.js';
import { haptic } from '../core/telegram.js';
import { bus } from '../core/state.js';
import { t } from '../i18n.js';
import { statusScroll, statusControl, errorText } from './common.js';
import { openTx } from './txDetail.js';
import { burst } from '../ui/fx.js';

/**
 * sheet     – the open sheet (its panes are replaced)
 * task      – Promise resolving to the created Tx
 * success   – (tx) => { title, text, extra? }
 */
export async function runWithStatus(sheet, { title, text, task, success }) {
  let ctl = null;
  let foot = null;
  let txId = null;
  const spec = {
    title: '',
    noClose: true,
    scroll: statusScroll({ title, text }),
    foot: `<button class="btn btn-primary" data-act="done" disabled>${esc(t('common.done'))}</button>
           <button class="btn btn-secondary" data-act="details" hidden>${esc(t('tx.details'))}</button>`,
    setup(root, ctx) {
      ctl = statusControl(root);
      foot = ctx.foot;
      delegate(root, {
        done() { haptic.light(); ctx.close(); },
        details() { if (txId) openTx(txId); },
      }, { signal: ctx.signal });
    },
  };
  sheet.replaceAll(spec);
  try {
    const tx = await task;
    await sleep(700);
    txId = tx?.id || null;
    const s = success(tx);
    ctl.success(s.title, s.text);
    if (s.extra) ctl.extra(s.extra);
    const ring = document.querySelector('.sheet [data-ring]');
    if (ring) setTimeout(() => burst(ring), 350);
    haptic.success();
    bus.emit('data');
    if (txId) foot.querySelector('[data-act="details"]').hidden = false;
  } catch (e) {
    await sleep(500);
    ctl.fail(t('err.title'), errorText(e));
    haptic.error();
  }
  foot.querySelector('[data-act="done"]').disabled = false;
}
