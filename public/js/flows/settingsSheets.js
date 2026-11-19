// Small settings-related sheets and shared switch-row helpers.
import { state, setSettings, addContact, removeContact, bus } from '../core/state.js';
import { FIAT, LANGS } from '../config.js';
import { esc, delegate, $ } from '../core/dom.js';
import { icon } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { pickSheet, confirmSheet } from '../ui/dialogs.js';
import { toast } from '../ui/toast.js';
import { NETWORKS, validateAddress } from '../data/assets.js';
import { shortAddr } from '../core/format.js';
import { haptic } from '../core/telegram.js';
import { t, setLang, getLang } from '../i18n.js';

/* ---------- switch rows ---------- */
export function switchRow({ title, sub = '', iconName, key, on, disabled = false }) {
  return `<div class="row press-soft" role="switch" tabindex="0" aria-checked="${on}" ${disabled ? 'aria-disabled="true"' : ''} data-act="sw" data-k="${esc(key)}">
    ${iconName ? `<span class="row-icon">${icon(iconName, 20)}</span>` : ''}
    <span class="row-body"><span class="row-title">${esc(title)}</span>${sub ? `<span class="row-sub">${esc(sub)}</span>` : ''}</span>
    <span class="switch" aria-checked="${on}"></span>
  </div>`;
}
export function flipSwitch(row, on) {
  row.setAttribute('aria-checked', String(on));
  row.querySelector('.switch').setAttribute('aria-checked', String(on));
}
export function bindSwitchKeys(root, signal) {
  root.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="switch"]')) { e.preventDefault(); e.target.click(); }
  }, { signal });
}

/* ---------- pickers ---------- */
export async function pickCurrency() {
  const id = await pickSheet({
    title: t('settings.currency'), selected: state.settings.currency,
    items: Object.entries(FIAT).map(([code, m]) => ({ id: code, title: `${code} — ${m.name}`, sub: m.symbol })),
  });
  if (id && id !== state.settings.currency) setSettings({ currency: id });
}

export async function pickLanguage() {
  const id = await pickSheet({ title: t('settings.language'), selected: getLang(), items: LANGS.map((l) => ({ id: l.id, title: l.label })) });
  if (id && id !== getLang()) { setLang(id); setSettings({ lang: id }); bus.emit('lang'); }
}

export async function pickAutoLock() {
  const id = await pickSheet({
    title: t('settings.autoLock'), selected: state.settings.autoLock,
    items: ['immediate', '1m', '5m', 'never'].map((k) => ({ id: k, title: t(`lock.auto.${k}`) })),
  });
  if (id) setSettings({ autoLock: id });
}

/* ---------- notifications ---------- */
export function openNotifications() {
  return openSheet({
    size: 'auto',
    pane: {
      title: t('settings.notifications'),
      scroll: `<div class="list settings" data-sw>
        ${switchRow({ key: 'tx', iconName: 'activity', title: t('notify.tx'), sub: t('notify.txSub'), on: state.settings.notify.tx })}
        ${switchRow({ key: 'price', iconName: 'markets', title: t('notify.price'), sub: t('notify.priceSub'), on: state.settings.notify.price })}
        ${switchRow({ key: 'news', iconName: 'sparkle', title: t('notify.news'), sub: t('notify.newsSub'), on: state.settings.notify.news })}
      </div><p class="group-foot">${esc(t('notify.foot'))}</p>`,
      setup(root, ctx) {
        bindSwitchKeys(root, ctx.signal);
        delegate(root, {
          sw(row) {
            haptic.select();
            const k = row.dataset.k;
            const on = row.getAttribute('aria-checked') !== 'true';
            flipSwitch(row, on);
            setSettings({ notify: { ...state.settings.notify, [k]: on } });
          },
        }, { signal: ctx.signal });
      },
    },
  });
}

/* ---------- address book ---------- */
export function openAddressBook() {
  const listHTML = () => state.contacts.length
    ? `<div class="list">${state.contacts.map((c) => `
        <div class="row">
          <span class="contact-av">${esc((c.name || '?').trim().charAt(0).toUpperCase())}</span>
          <span class="row-body"><span class="row-title">${esc(c.name)}</span><span class="row-sub mono">${esc(shortAddr(c.address, 8, 6))} · ${esc(NETWORKS[c.network]?.tag || '')}</span></span>
          <button class="icon-btn plain sm" data-act="del" data-addr="${esc(c.address)}" aria-label="${esc(t('common.delete'))}">${icon('trash', 20)}</button>
        </div>`).join('')}</div>`
    : `<div class="empty"><div class="empty-ic">${icon('book', 30)}</div><h3>${esc(t('book.empty'))}</h3><p>${esc(t('book.emptySub'))}</p></div>`;

  const addPane = () => {
    let net = 'ethereum';
    return {
      title: t('book.add'),
      scroll: `
        <label class="field-label" for="c-name">${esc(t('book.name'))}</label>
        <div class="field"><input id="c-name" data-name maxlength="32" autocomplete="off" placeholder="${esc(t('book.namePh'))}" /></div>
        <div style="height:18px"></div>
        <div class="group-label">${esc(t('common.network'))}</div>
        <div class="chips" data-nets>${Object.values(NETWORKS).map((n) => `<button class="chip ${n.id === net ? 'is-on' : ''}" data-act="net" data-net="${n.id}">${esc(n.name)}</button>`).join('')}</div>
        <div style="height:14px"></div>
        <label class="field-label" for="c-addr">${esc(t('send.address'))}</label>
        <div class="field" data-field><input id="c-addr" data-addr class="mono" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(t('send.addressPh', { net: NETWORKS[net].name }))}" /></div>
        <div class="field-hint" data-hint></div>`,
      foot: `<button class="btn btn-primary" data-act="save" disabled>${esc(t('common.save'))}</button>`,
      setup(root, ctx) {
        const name = $('[data-name]', root), addr = $('[data-addr]', root), field = $('[data-field]', root), hint = $('[data-hint]', root), save = $('[data-act="save"]', root);
        const check = () => {
          const r = validateAddress(net, addr.value);
          field.classList.toggle('is-error', !r.valid && !r.empty);
          hint.className = `field-hint ${r.valid ? 'ok' : !r.empty ? 'err' : ''}`;
          hint.textContent = r.valid ? t('send.addrOk') : !r.empty ? t('send.addrBad', { net: NETWORKS[net].name }) : '';
          save.disabled = !(r.valid && name.value.trim());
        };
        name.addEventListener('input', check, { signal: ctx.signal });
        addr.addEventListener('input', check, { signal: ctx.signal });
        delegate(root, {
          net(b) {
            haptic.select();
            net = b.dataset.net;
            root.querySelectorAll('[data-nets] .chip').forEach((c) => c.classList.toggle('is-on', c === b));
            addr.placeholder = t('send.addressPh', { net: NETWORKS[net].name });
            check();
          },
          save() {
            const r = validateAddress(net, addr.value);
            if (!r.valid || !name.value.trim()) return;
            addContact({ name: name.value.trim(), address: r.addr, network: net });
            toast(t('book.saved'));
            ctx.pop();
          },
        }, { signal: ctx.signal });
      },
    };
  };

  return openSheet({
    pane: {
      title: t('settings.book'),
      right: `<button class="icon-btn plain" data-act="add" aria-label="${esc(t('book.add'))}">${icon('plus', 24)}</button>`,
      scroll: `<div data-list>${listHTML()}</div><p class="group-foot">${esc(t('book.foot'))}</p>`,
      setup(root, ctx) {
        const refresh = () => { $('[data-list]', root).innerHTML = listHTML(); };
        const off = bus.on('contacts', refresh);
        ctx.signal.addEventListener('abort', off);
        delegate(root, {
          async del(b) {
            if (await confirmSheet({ title: t('book.delete'), message: t('book.deleteSub'), confirm: t('common.delete'), danger: true })) removeContact(b.dataset.addr);
          },
        }, { signal: ctx.signal });
        delegate(ctx.head, { add() { ctx.push(addPane()); } }, { signal: ctx.signal });
      },
    },
  });
}
