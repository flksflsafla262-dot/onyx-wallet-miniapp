// Send flow: asset → recipient → amount → review → status.
import { state } from '../core/state.js';
import { esc, delegate, $ } from '../core/dom.js';
import { icon, coin } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { toast } from '../ui/toast.js';
import { keypadHTML, bindKeypad, applyAmountKey, parseAmount } from '../ui/keypad.js';
import { provider } from '../services/provider.js';
import { NETWORKS } from '../data/assets.js';
import { fmtAmount, fmtFiat, fromFiat, toFiat, shortAddr, curr, fmtEta } from '../core/format.js';
import { haptic, readClipboard, scanQr, inTelegram } from '../core/telegram.js';
import { t } from '../i18n.js';
import { assetListPane } from './pickers.js';
import { netChips, kvRows } from './common.js';
import { requirePin } from './security.js';
import { runWithStatus } from './status.js';

const trimNum = (n, d) => String(+n.toFixed(d));

export function openSend({ assetId, address } = {}) {
  const S = { asset: null, net: null, addr: address || '', fee: null, amount: 0 };
  let sheet;

  const choose = (id) => { S.asset = state.byId[id]; S.net = S.asset.networks[0]; };

  /* ---------- 2. recipient ---------- */
  function recipientPane() {
    const contactsFor = () => {
      const saved = state.contacts.filter((c) => c.network === S.net);
      const seen = new Set(saved.map((c) => c.address));
      const recent = state.txs.filter((x) => x.type === 'send' && x.network === S.net && x.address && !seen.has(x.address))
        .filter((x, i, arr) => arr.findIndex((y) => y.address === x.address) === i).slice(0, 3)
        .map((x) => ({ name: t('send.recent'), address: x.address, recent: true }));
      return [...saved, ...recent];
    };
    const contactsHTML = () => {
      const list = contactsFor();
      if (!list.length) return '';
      return `<div class="section"><div class="group-label">${esc(t('send.saved'))}</div><div class="list">${list.map((c) => `
        <button class="row press-soft" data-act="contact" data-addr="${esc(c.address)}">
          <span class="contact-av">${esc((c.name || '?').trim().charAt(0).toUpperCase())}</span>
          <span class="row-body"><span class="row-title">${esc(c.name)}</span><span class="row-sub mono">${esc(shortAddr(c.address, 8, 6))}</span></span>
        </button>`).join('')}</div></div>`;
    };
    return {
      title: t('send.to'),
      scroll: `
        <div class="row" style="padding:0 4px 14px;min-height:0">${coin(S.asset, 36)}<span class="row-body"><span class="row-title">${esc(S.asset.name)}</span><span class="row-sub num">${esc(t('send.available'))}: ${esc(fmtAmount(state.balances[S.asset.id] || 0, S.asset.decimals))} ${esc(S.asset.symbol)}</span></span></div>
        <div data-nets>${S.asset.networks.length > 1 ? `<div class="group-label">${esc(t('common.network'))}</div>${netChips(S.asset, S.net)}<div style="height:18px"></div>` : ''}</div>
        <label class="field-label" for="addr">${esc(t('send.address'))}</label>
        <div class="recipient-bar">
          <div class="field" data-field><input id="addr" data-addr type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${esc(t('send.addressPh', { net: NETWORKS[S.net].name }))}" value="${esc(S.addr)}" /></div>
          <button class="icon-btn" data-act="paste" aria-label="${esc(t('common.paste'))}">${icon('paste', 22)}</button>
          <button class="icon-btn" data-act="scan" aria-label="${esc(t('send.scan'))}">${icon('scan', 22)}</button>
        </div>
        <div class="field-hint" data-hint aria-live="polite"></div>
        <div data-contacts>${contactsHTML()}</div>`,
      foot: `<button class="btn btn-primary" data-act="next" disabled>${esc(t('common.continue'))}</button>`,
      setup(root, ctx) {
        const input = $('[data-addr]', root);
        const field = $('[data-field]', root);
        const hint = $('[data-hint]', root);
        const next = $('[data-act="next"]', root);
        const validate = () => {
          const r = provider.validateAddress(S.net, input.value);
          S.addr = r.addr;
          field.classList.toggle('is-error', !r.valid && !r.empty);
          hint.className = `field-hint ${r.valid ? 'ok' : !r.empty ? 'err' : ''}`;
          hint.textContent = r.valid ? t('send.addrOk') : !r.empty ? t('send.addrBad', { net: NETWORKS[S.net].name }) : '';
          next.disabled = !r.valid;
        };
        const setValue = (v) => { input.value = v; validate(); };
        input.addEventListener('input', validate, { signal: ctx.signal });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !next.disabled) next.click(); }, { signal: ctx.signal });
        if (S.addr) validate();
        delegate(root, {
          async paste() {
            haptic.light();
            const txt = await readClipboard();
            if (txt) setValue(txt.trim()); else toast(t('send.clipboardEmpty'), { type: 'info' });
          },
          async scan() {
            haptic.light();
            if (!inTelegram) { toast(t('send.scanUnavailable'), { type: 'info' }); return; }
            const data = await scanQr(t('send.scanText'));
            if (data) setValue(data);
          },
          net(b) {
            haptic.select();
            S.net = b.dataset.net;
            $('[data-nets]', root).innerHTML = `<div class="group-label">${esc(t('common.network'))}</div>${netChips(S.asset, S.net)}<div style="height:18px"></div>`;
            input.placeholder = t('send.addressPh', { net: NETWORKS[S.net].name });
            $('[data-contacts]', root).innerHTML = contactsHTML();
            validate();
          },
          contact(b) { haptic.select(); setValue(b.dataset.addr); },
          next() { if (!next.disabled) { input.blur(); ctx.push(amountPane()); } },
        }, { signal: ctx.signal });
      },
    };
  }

  /* ---------- 3. amount ---------- */
  function amountPane() {
    const a = S.asset;
    let str = '';
    let fiat = false;
    S.fee = null;
    return {
      title: t('send.amount'),
      scroll: `
        <div class="amount-wrap">
          <div class="amount-main" data-main><span class="v is-empty" data-v>0</span><span class="u" data-u>${esc(a.symbol)}</span></div>
          <div class="amount-sub"><span data-sub class="num"></span><button data-act="flip" aria-label="${esc(t('send.switchUnit'))}">${icon('updown', 16)}<span data-flip></span></button></div>
        </div>
        <div class="balance-line"><span class="num" data-bal></span><button data-act="max">${esc(t('send.max'))}</button></div>
        <div class="amount-err" data-err role="alert"></div>`,
      foot: `${keypadHTML({ decimal: true, label: t('send.amount') })}<button class="btn btn-primary" data-act="next" disabled>${esc(t('common.review'))}</button>`,
      setup(root, ctx) {
        const el = { v: $('[data-v]', root), u: $('[data-u]', root), sub: $('[data-sub]', root), flip: $('[data-flip]', root), bal: $('[data-bal]', root), err: $('[data-err]', root), next: $('[data-act="next"]', root), main: $('[data-main]', root) };
        const bal = () => state.balances[a.id] || 0;
        const feeInAsset = () => (S.fee && S.fee.feeAssetId === a.id ? S.fee.fee : 0);
        const maxCrypto = () => Math.max(0, bal() - feeInAsset());
        const cryptoVal = () => { const v = parseAmount(str); return fiat ? fromFiat(v) / a.price : v; };
        const dec = () => (fiat ? 2 : a.decimals);

        function render() {
          const c = cryptoVal();
          el.v.textContent = str === '' ? '0' : str;
          el.v.classList.toggle('is-empty', str === '');
          el.v.style.fontSize = str.length > 13 ? '34px' : str.length > 10 ? '42px' : '';
          el.u.textContent = fiat ? curr() : a.symbol;
          el.sub.textContent = fiat ? `≈ ${fmtAmount(c, a.decimals)} ${a.symbol}` : `≈ ${fmtFiat(c * a.price)}`;
          el.flip.textContent = fiat ? a.symbol : curr();
          el.bal.textContent = `${t('send.available')}: ${fmtAmount(bal(), a.decimals)} ${a.symbol}`;
          let err = '';
          if (c > 0) {
            if (c > maxCrypto() + 1e-12) err = t('err.insufficient');
            else if (S.fee && S.fee.feeAssetId !== a.id && (state.balances[S.fee.feeAssetId] || 0) < S.fee.fee) err = t('err.feeNeeded', { sym: S.fee.feeAssetId });
          }
          el.err.textContent = err;
          el.next.disabled = !(c > 0) || !!err || !S.fee;
        }

        provider.estimateFee(a.id, S.net).then((f) => { S.fee = f; if (!ctx.signal.aborted) render(); });

        bindKeypad(root, (k) => {
          const nx = applyAmountKey(str, k, dec());
          if (nx === str && k !== 'back') { haptic.warning(); el.main.classList.remove('shake'); void el.main.offsetWidth; el.main.classList.add('shake'); return; }
          str = nx; render();
        }, { signal: ctx.signal });

        delegate(root, {
          flip() {
            haptic.select();
            const c = cryptoVal();
            fiat = !fiat;
            str = c > 0 ? (fiat ? String(+toFiat(c * a.price).toFixed(2)) : trimNum(c, a.decimals)) : '';
            render();
          },
          max() {
            haptic.medium();
            const m = maxCrypto();
            str = m > 0 ? (fiat ? String(Math.floor(toFiat(m * a.price) * 100) / 100) : trimNum(m, a.decimals)) : '';
            render();
          },
          next() {
            if (el.next.disabled) return;
            S.amount = Math.min(cryptoVal(), maxCrypto());
            ctx.push(reviewPane());
          },
        }, { signal: ctx.signal });
        render();
      },
    };
  }

  /* ---------- 4. review ---------- */
  function reviewPane() {
    const a = S.asset, f = S.fee;
    const feeUsd = f.feeUsd;
    const totalUsd = S.amount * a.price + feeUsd;
    return {
      title: t('send.review'),
      scroll: `
        <div class="review-top">
          ${coin(a, 64)}
          <div class="big num">${esc(fmtAmount(S.amount, a.decimals))} ${esc(a.symbol)}</div>
          <div class="sub num">${esc(fmtFiat(S.amount * a.price))}</div>
        </div>
        ${kvRows([
          [t('send.recipient'), `<span class="mono" style="font-size:13px">${esc(shortAddr(S.addr, 10, 8))}</span>`],
          [t('common.network'), esc(NETWORKS[S.net].name)],
          [t('send.fee'), `<span class="num">${esc(fmtAmount(f.fee, 8))} ${esc(f.feeAssetId)}</span> <span class="faint">· ${esc(fmtFiat(feeUsd))}</span>`],
          [t('send.eta'), esc(fmtEta(f.eta))],
          [t('send.total'), `<b class="num">${esc(fmtFiat(totalUsd))}</b>`],
        ])}
        <div class="notice" style="margin-top:16px">${icon('alert', 20)}<span>${esc(t('send.irreversible'))}</span></div>`,
      foot: `<button class="btn btn-primary" data-act="confirm"><span class="btn-label">${esc(t('send.confirm'))}</span><span class="spinner"></span></button>`,
      setup(root, ctx) {
        delegate(root, {
          async confirm(btn) {
            haptic.medium();
            if (!(await requirePin(t('send.pinTitle')))) return;
            const task = provider.send({ assetId: a.id, networkId: S.net, to: S.addr, amount: S.amount });
            task.catch(() => {});
            runWithStatus(sheet, {
              title: t('send.sending'), text: t('send.sendingSub'), task,
              success: () => ({
                title: t('send.sent'),
                text: t('send.sentSub', { amount: `${fmtAmount(S.amount, a.decimals)} ${a.symbol}`, to: shortAddr(S.addr, 6, 4) }),
                extra: kvRows([
                  [t('send.recipient'), `<span class="mono" style="font-size:13px">${esc(shortAddr(S.addr, 8, 6))}</span>`],
                  [t('common.network'), esc(NETWORKS[S.net].name)],
                  [t('send.fee'), `<span class="num">${esc(fmtFiat(f.feeUsd))}</span>`],
                ]),
              }),
            });
          },
        }, { signal: ctx.signal });
      },
    };
  }

  /* ---------- start ---------- */
  if (assetId && state.byId[assetId]) {
    choose(assetId);
    sheet = openSheet({ pane: recipientPane() });
  } else {
    sheet = openSheet({
      pane: assetListPane({ title: t('send.title'), holdingsOnly: true, onPick: (id, ctx) => { choose(id); ctx.push(recipientPane()); } }),
    });
  }
  return sheet;
}
