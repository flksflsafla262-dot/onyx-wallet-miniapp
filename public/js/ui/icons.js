// One icon family: 24px grid, 1.8 stroke, round caps. Decorative by default (aria-hidden).
const P = {
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17a2 2 0 0 1 2 2v1"/><path d="M4 7.5V17a2.5 2.5 0 0 0 2.5 2.5h11A2.5 2.5 0 0 0 20 17v-6a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 1 4 7.5z"/><circle cx="16" cy="14" r="1.1" fill="currentColor" stroke="none"/>',
  markets: '<path d="M3 17l5.5-5.5 3.5 3.5L21 6"/><path d="M15 6h6v6"/>',
  swap: '<path d="M7 4L3.5 7.5 7 11"/><path d="M3.5 7.5H17a3.5 3.5 0 0 1 3.5 3.5"/><path d="M17 20l3.5-3.5L17 13"/><path d="M20.5 16.5H7A3.5 3.5 0 0 1 3.5 13"/>',
  activity: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  settings: '<path d="M4 7h8.5M17 7h3M4 17h3M11.5 17H20"/><circle cx="14.75" cy="7" r="2.25"/><circle cx="9.25" cy="17" r="2.25"/>',
  send: '<path d="M7 17L17 7"/><path d="M8.5 7H17v8.5"/>',
  receive: '<path d="M17 7L7 17"/><path d="M15.5 17H7V8.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  qr: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4"/><path d="M13.5 13.5h3v3M20 13.5v.01M13.5 20h.01M16.5 20H20v-3.5"/>',
  scan: '<path d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4H8M16 4h1.5A2.5 2.5 0 0 1 20 6.5V8M20 16v1.5a2.5 2.5 0 0 1-2.5 2.5H16M8 20H6.5A2.5 2.5 0 0 1 4 17.5V16"/><path d="M7.5 12h9"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chevR: '<path d="M9.5 5l7 7-7 7"/>',
  chevL: '<path d="M14.5 5l-7 7 7 7"/>',
  chevD: '<path d="M5 9.5l7 7 7-7"/>',
  updown: '<path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeOff: '<path d="M4 4l16 16"/><path d="M9.9 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.5 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.4 0 2.7-.4 3.8-.9"/><path d="M10 10a2.8 2.8 0 0 0 4 4"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  faceid: '<path d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4H8M16 4h1.5A2.5 2.5 0 0 1 20 6.5V8M20 16v1.5a2.5 2.5 0 0 1-2.5 2.5H16M8 20H6.5A2.5 2.5 0 0 1 4 17.5V16"/><path d="M9 9.5v1.5M15 9.5v1.5M12 9.5v3.5h-1M9 16c1.7 1.4 4.3 1.4 6 0"/>',
  fingerprint: '<path d="M6 11a6 6 0 0 1 12 0v1.5M9 20c-.6-1.8-1-3.4-1-5.5a4 4 0 0 1 8 0c0 1.2.2 2.2.5 3.2M12 12.5v2c0 2 .4 3.7 1.2 5.5M6 15c0 1.6.2 2.9.6 4M18 15.5c0 1.6.2 2.8.6 4"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  currency: '<circle cx="12" cy="12" r="9"/><path d="M14.6 9.3c-.5-.8-1.5-1.3-2.6-1.3-1.5 0-2.6.8-2.6 2 0 2.8 5.2 1.4 5.2 4.2 0 1.2-1.1 2.1-2.6 2.1-1.3 0-2.3-.6-2.8-1.5M12 6.5V8M12 16v1.5"/>',
  user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5"/>',
  shield: '<path d="M12 3l7 2.8v5.4c0 4.4-2.9 8-7 9.8-4.1-1.8-7-5.4-7-9.8V5.8L12 3z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  book: '<path d="M6 4h11a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z"/><circle cx="12.5" cy="10" r="2"/><path d="M8.7 16c.5-1.6 1.8-2.4 3.8-2.4s3.3.8 3.8 2.4"/>',
  external: '<path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18 14v3.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 4 17.5v-9A2.5 2.5 0 0 1 6.5 6H10"/>',
  star: '<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8 6.9 19.5l1-5.7-4.1-4 5.7-.8L12 3.8z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M7 11H6.5A1.5 1.5 0 0 0 5 12.5v5A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-5a1.5 1.5 0 0 0-1.5-1.5H17"/>',
  paste: '<rect x="6" y="5" width="12" height="15" rx="2.5"/><path d="M9.5 5V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5V5"/>',
  backspace: '<path d="M9.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9.5L3 12l6.5-7z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/>',
  bank: '<path d="M3.5 9.5L12 4l8.5 5.5M5.5 10.5v6.5M10 10.5v6.5M14 10.5v6.5M18.5 10.5v6.5M3.5 20h17"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14-4.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.5L20 15M20 20v-5h-5"/>',
  trash: '<path d="M4.5 7h15M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9.6a2.4 2.4 0 0 1 4.6.8c0 1.6-2.3 2-2.3 3.4M12 17h.01"/>',
  doc: '<path d="M7 3.5h6.5L19 9v10a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5z"/><path d="M13 3.5V9h6"/>',
  alert: '<path d="M12 4l9 15.5H3L12 4z"/><path d="M12 10v4M12 17h.01"/>',
  network: '<circle cx="12" cy="5.5" r="2"/><circle cx="5.5" cy="18" r="2"/><circle cx="18.5" cy="18" r="2"/><path d="M11 7.3L6.5 16.2M13 7.3l4.5 8.9M7.5 18h9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  plane: '<path d="M20.5 4L3.5 10.8l6.2 2.3 2.3 6.2L20.5 4z"/><path d="M9.7 13.1L20.5 4"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8L18 16z"/>',
  bitcoin: '<path d="M8 5h5.5a3 3 0 0 1 0 6H8zM8 11h6.5a3 3 0 0 1 0 6H8zM8 5v12M10.5 3v2M13.5 3v2M10.5 17v2M13.5 17v2"/>',
  dots: '<circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18" cy="12" r="1.3" fill="currentColor"/>',
};

export function icon(name, size = 22, extra = '') {
  const body = P[name];
  if (!body) return '';
  return `<svg class="i ${extra}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

// Original, simplified glyphs (white on a tinted glass disc). Swap for official artwork when you have it.
const S = 'fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
const GLYPH = {
  BTC: `<g ${S}><path d="M9 6.5h4.2a2.4 2.4 0 0 1 0 4.8H9h4.8a2.6 2.6 0 0 1 0 5.2H9M9 6.5v10M11 4.5v2M14 4.5v2M11 16.5v2M14 16.5v2"/></g>`,
  ETH: '<path d="M12 3.5 6.6 12.2 12 15.4l5.4-3.2z" fill="#fff"/><path d="M12 16.8 6.6 13.6 12 20.5l5.4-6.9z" fill="#fff" fill-opacity=".66"/>',
  USDT: `<g ${S}><path d="M7 7h10M12 7v10.5"/><ellipse cx="12" cy="11.6" rx="6.2" ry="2" stroke-width="1.5"/></g>`,
  BNB: '<path fill="#fff" d="M12 4.3l2.3 2.3L12 8.9 9.7 6.6zM12 15.1l2.3 2.3-2.3 2.3-2.3-2.3zM6.6 9.7l2.3 2.3-2.3 2.3L4.3 12zM17.4 9.7l2.3 2.3-2.3 2.3-2.3-2.3zM12 10.3l1.7 1.7-1.7 1.7-1.7-1.7z"/>',
  SOL: '<path fill="#fff" d="M7.4 6.6h11.2l-2 2.2H5.4zM5.4 10.9h11.2l2 2.2H7.4zM7.4 15.2h11.2l-2 2.2H5.4z"/>',
  USDC: `<g ${S} stroke-width="1.6"><circle cx="12" cy="12" r="7.4"/><path d="M14.3 9.9c-.3-.9-1.1-1.4-2.3-1.4-1.3 0-2.2.7-2.2 1.6 0 2.2 4.6 1.1 4.6 3.3 0 1-.9 1.7-2.4 1.7-1.2 0-2-.5-2.3-1.4M12 6.9v1.5M12 15.6v1.5"/></g>`,
  XRP: `<g ${S}><path d="M6 7.4l3.8 3.7a3.1 3.1 0 0 0 4.4 0L18 7.4M6 16.6l3.8-3.7a3.1 3.1 0 0 1 4.4 0l3.8 3.7"/></g>`,
  TON: `<g ${S}><path d="M5.6 7.6h12.8L12 18.6z"/><path d="M12 7.6v11"/></g>`,
  DOGE: `<g ${S}><path d="M8.2 6.5v11h3.4a5.5 5.5 0 0 0 0-11zM6.4 12h6.4"/></g>`,
  TRX: `<g ${S} stroke-width="1.7"><path d="M5 6.6l14 2.3-7 10.2zM5 6.6l7 5.5 7-3.2M12 12.1v7"/></g>`,
  LTC: `<g ${S}><path d="M10.4 5.5l-2.1 9.4 8.9-.3M6.6 12.2l7.2-2.4"/></g>`,
  LINK: '<path d="M12 4l6.6 3.8v8.4L12 20l-6.6-3.8V7.8z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9l3.1 1.8v3.4L12 16l-3.1-1.8v-3.4z" fill="#fff"/>',
};

/** Coin badge: glass disc tinted with the asset colour + glyph. */
export function coin(asset, size = 40, net = '') {
  const g = GLYPH[asset.symbol];
  const inner = g
    ? `<svg viewBox="0 0 24 24" aria-hidden="true">${g}</svg>`
    : `<b>${asset.symbol.slice(0, 3)}</b>`;
  return `<span class="coin" style="--s:${size}px;--c:${asset.color}" aria-hidden="true">${inner}${net}</span>`;
}

export const logoMark = (size = 56) => `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#6b6b73"/></linearGradient></defs><path d="M32 14 47 32 32 50 17 32Z" fill="url(#lg)"/></svg>`;
