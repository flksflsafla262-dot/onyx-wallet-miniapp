// Receive flow: (asset) → QR + address.
import { state } from '../core/state.js';
import { esc, delegate, $ } from '../core/dom.js';
import { icon, coin } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { toast } from '../ui/toast.js';
import { qrSvg } from '../ui/qr.js';
import { provider } from '../services/provider.js';
import { NETWORKS } from '../data/assets.js';
import { haptic, copyText, shareText } from '../core/telegram.js';
import { t } from '../i18n.js';
import { assetListPane } from './pickers.js';
import { netChips } from './common.js';

export function openReceive({ assetId } = {}) {
  const pane = (a) => {
    let net = a.networks[0];
    let addr = '';
    return {
      title: t('receive.title', { sym: a.symbol }),
      scroll: `
        <div data-nets>${a.networks.length > 1 ? `<div class="group-label">${esc(t('common.network'))}</div>${netChips(a, net)}` : ''}</div>
        <div class="card qr-card sheen" data-tilt>
          <div class="qr-box" data-qr aria-label="${esc(t('receive.qr'))}"></div>
          <div class="addr-box selectable" data-addr></div>
          <p class="muted" style="font-size:14px;line-height:1.45;text-align:center;max-width:300px" data-warn></p>
        </div>`,
      foot: `<div class="btn-row">
        <button class="btn btn-secondary" data-act="copy" disabled>${icon('copy', 20)}<span>${esc(t('common.copy'))}</span></button>
        <button class="btn btn-primary" data-act="share" disabled>${icon('share', 20)}<span>${esc(t('common.share'))}</span></button>
      </div>`,
      setup(root, ctx) {
        const qr = $('[data-qr]', root);
        const addrEl = $('[data-addr]', root);
        const warn = $('[data-warn]', root);
        const btns = root.querySelectorAll('.btn-row .btn');
        async function load() {
          btns.forEach((b) => { b.disabled = true; });
          qr.innerHTML = '<span class="sk" style="display:block;width:100%;height:100%;border-radius:12px;background-color:#e6e6e8"></span>';
          addrEl.innerHTML = '<span class="sk" style="display:inline-block;width:80%;height:14px"></span>';
          warn.textContent = t('receive.warn', { sym: a.symbol, net: NETWORKS[net].name });
          const mine = net;
          const v = await provider.getAddress(a.id, net);
          if (ctx.signal.aborted || mine !== net) return;
          addr = v;
          qr.style.animation = 'none'; void qr.offsetWidth; qr.style.animation = '';
          qr.innerHTML = `${qrSvg(addr)}<span class="qr-logo">${coin(a, 40)}</span>`;
          addrEl.textContent = addr;
          btns.forEach((b) => { b.disabled = false; });
        }
        load();
        delegate(root, {
          net(b) {
            haptic.select();
            net = b.dataset.net;
            $('[data-nets]', root).innerHTML = `<div class="group-label">${esc(t('common.network'))}</div>${netChips(a, net)}`;
            load();
          },
          async copy() {
            if (!addr) return;
            if (await copyText(addr)) { toast(t('common.copied')); } else toast(t('common.copyFailed'), { type: 'err' });
          },
          share() {
            if (!addr) return;
            haptic.light();
            shareText(`${a.name} (${NETWORKS[net].name})\n${addr}`);
          },
        }, { signal: ctx.signal });
        addrEl.addEventListener('click', async () => { if (addr && (await copyText(addr))) toast(t('common.copied')); }, { signal: ctx.signal });
      },
    };
  };

  if (assetId && state.byId[assetId]) return openSheet({ pane: pane(state.byId[assetId]) });
  return openSheet({
    pane: assetListPane({ title: t('receive.pick'), onPick: (id, ctx) => ctx.push(pane(state.byId[id])) }),
  });
}
