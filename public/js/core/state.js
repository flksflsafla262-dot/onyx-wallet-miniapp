// Global state, persistence and a tiny event bus.
const PREFIX = 'onyx:';

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  },
  remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
  },
};

const defaults = {
  currency: 'USD',
  lang: null, // resolved on boot from Telegram / browser
  hideBalance: false,
  haptics: true,
  biometric: false,
  passcode: false,
  autoLock: 'immediate', // immediate | 1m | 5m | never
  notify: { tx: true, price: false, news: false },
};

export const bus = (() => {
  const map = new Map();
  return {
    on(evt, fn) {
      if (!map.has(evt)) map.set(evt, new Set());
      map.get(evt).add(fn);
      return () => map.get(evt)?.delete(fn);
    },
    emit(evt, payload) { map.get(evt)?.forEach((fn) => fn(payload)); },
  };
})();

export const state = {
  settings: { ...defaults, ...storage.get('settings', {}) },
  favorites: storage.get('favorites', ['BTC', 'ETH', 'TON']),
  contacts: storage.get('contacts', []),
  pinHash: storage.get('pin', null),

  // Runtime data (filled by the provider)
  assets: [],
  byId: {},
  balances: {},
  txs: [],
  fx: { USD: 1 },
  ready: false,
};

export function setSettings(patch) {
  Object.assign(state.settings, patch);
  storage.set('settings', state.settings);
  bus.emit('settings', patch);
}

export function toggleFavorite(id) {
  const i = state.favorites.indexOf(id);
  if (i > -1) state.favorites.splice(i, 1); else state.favorites.push(id);
  storage.set('favorites', state.favorites);
  bus.emit('favorites', id);
  return i === -1;
}

export function addContact(c) {
  state.contacts = [c, ...state.contacts.filter((x) => x.address !== c.address)];
  storage.set('contacts', state.contacts);
  bus.emit('contacts');
}
export function removeContact(address) {
  state.contacts = state.contacts.filter((x) => x.address !== address);
  storage.set('contacts', state.contacts);
  bus.emit('contacts');
}

export function setPinHash(hash) {
  state.pinHash = hash;
  if (hash) storage.set('pin', hash); else storage.remove('pin');
}

/** Portfolio computed from balances × live prices. */
export function portfolio() {
  const rows = [];
  let total = 0;
  let prev = 0;
  for (const a of state.assets) {
    const bal = state.balances[a.id] || 0;
    if (bal <= 0) continue;
    const value = bal * a.price;
    const prevValue = bal * (a.price / (1 + a.change24h / 100));
    total += value;
    prev += prevValue;
    rows.push({ asset: a, balance: bal, value });
  }
  rows.sort((x, y) => y.value - x.value);
  return { rows, total, change: total - prev, changePct: prev ? ((total - prev) / prev) * 100 : 0 };
}
