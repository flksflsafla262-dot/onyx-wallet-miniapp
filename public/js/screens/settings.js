// Settings: profile, security, preferences, support.
import { state, setSettings } from '../core/state.js';
import { APP, FIAT, LANGS } from '../config.js';
import { esc, delegate, $ } from '../core/dom.js';
import { icon } from '../ui/icons.js';
import { toast } from '../ui/toast.js';
import { pickSheet } from '../ui/dialogs.js';
import { haptic, tgUser, biometric, openLink, inTelegram, platform } from '../core/telegram.js';
import { t, getLang } from '../i18n.js';
import { createPasscode, removePasscode } from '../flows/security.js';
import { switchRow, flipSwitch, bindSwitchKeys, pickCurrency, pickLanguage, pickAutoLock, openNotifications, openAddressBook } from '../flows/settingsSheets.js';

let root;
let bioAvailable = false;

const nav = (act, iconName, title, value = '') => `
  <button class="row press-soft" data-act="${act}">
    <span class="row-icon">${icon(iconName, 20)}</span>
    <span class="row-body"><span class="row-title">${esc(title)}</span></span>
    ${value ? `<span class="val">${esc(value)}</span>` : ''}
    <span class="row-chev">${icon('chevR', 18)}</span>
  </button>`;

function render() {
  const s = state.settings;
  const user = tgUser();
  const name = user?.name || APP.name;
  const handle = user?.username ? `@${user.username}` : inTelegram ? `ID ${user?.id ?? ''}` : t('settings.browser');
  const langLabel = LANGS.find((l) => l.id === getLang())?.label || '';
  root.innerHTML = `
    <div class="inner">
      <header class="navbar"><span class="nav-title">${esc(t('tab.settings'))}</span></header>
      <h1 class="large-title reveal" style="--i:0">${esc(t('tab.settings'))}</h1>

      <div class="card sheen profile-card reveal" data-tilt style="--i:1">
        <div class="avatar">${user?.photo ? `<img src="${esc(user.photo)}" alt="" referrerpolicy="no-referrer" />` : esc(name.charAt(0).toUpperCase())}</div>
        <div style="min-width:0"><b>${esc(name)}</b><span>${esc(handle)}</span></div>
      </div>

      <div class="section reveal" style="--i:2">
        <div class="group-label">${esc(t('settings.security'))}</div>
        <div class="list settings" data-sw>
          ${nav('passcode', 'lock', t('settings.passcode'), s.passcode ? t('common.on') : t('common.off'))}
          ${s.passcode && bioAvailable ? switchRow({ key: 'biometric', iconName: biometric.type === 'face' ? 'faceid' : 'fingerprint', title: biometric.type === 'face' ? t('settings.faceid') : t('settings.biometric'), on: s.biometric }) : ''}
          ${s.passcode ? nav('autolock', 'clock', t('settings.autoLock'), t(`lock.auto.${s.autoLock}`)) : ''}
          ${switchRow({ key: 'hideBalance', iconName: 'eyeOff', title: t('settings.hideBalance'), on: s.hideBalance })}
        </div>
      </div>

      <div class="section reveal" style="--i:3">
        <div class="group-label">${esc(t('settings.general'))}</div>
        <div class="list settings" data-sw>
          ${nav('currency', 'currency', t('settings.currency'), `${s.currency} ${FIAT[s.currency].symbol}`)}
          ${nav('language', 'globe', t('settings.language'), langLabel)}
          ${nav('book', 'book', t('settings.book'))}
          ${nav('notify', 'bell', t('settings.notifications'))}
          ${switchRow({ key: 'haptics', iconName: 'bolt', title: t('settings.haptics'), on: s.haptics })}
        </div>
      </div>

      <div class="section reveal" style="--i:4">
        <div class="group-label">${esc(t('settings.support'))}</div>
        <div class="list settings">
          ${nav('help', 'help', t('settings.help'))}
          ${nav('terms', 'doc', t('settings.terms'))}
          ${nav('privacy', 'shield', t('settings.privacy'))}
        </div>
      </div>
      <p class="version">${esc(APP.name)} · v${esc(APP.version)}${inTelegram ? ` · ${esc(platform)}` : ''}</p>
    </div>`;
}

export const settingsScreen = {
  mount(el) {
    const first = !root;
    root = el;
    render();
    if (!first) return;
    bindSwitchKeys(root);
    biometric.init().then((ok) => { if (ok !== bioAvailable) { bioAvailable = ok; render(); } });
    delegate(root, {
      async passcode() {
        haptic.light();
        if (!state.settings.passcode) {
          if (await createPasscode()) { toast(t('settings.passcodeOn')); render(); }
          return;
        }
        const id = await pickSheet({ title: t('settings.passcode'), items: [{ id: 'change', title: t('lock.change') }, { id: 'off', title: t('lock.disable') }] });
        if (id === 'off') { if (await removePasscode()) { toast(t('settings.passcodeOff'), { type: 'info' }); render(); } }
        if (id === 'change') { if (await removePasscode() && await createPasscode()) { toast(t('settings.passcodeOn')); } render(); }
      },
      async autolock() { await pickAutoLock(); render(); },
      async currency() { await pickCurrency(); },
      async language() { await pickLanguage(); },
      book() { openAddressBook(); },
      notify() { openNotifications(); },
      help() { openLink(APP.supportUrl); },
      terms() { openLink(APP.termsUrl); },
      privacy() { openLink(APP.privacyUrl); },
      async sw(row) {
        haptic.select();
        const k = row.dataset.k;
        const on = row.getAttribute('aria-checked') !== 'true';
        if (k === 'biometric' && on && !(await biometric.request(t('lock.reason')))) { toast(t('settings.bioFailed'), { type: 'err' }); return; }
        flipSwitch(row, on);
        setSettings({ [k]: on });
      },
    });
  },
};
