import { state } from './state.js';
import { FIAT } from '../config.js';
import { getLang, t } from '../i18n.js';

const nfCache = new Map();
function nf(locale, opts) {
  const k = locale + JSON.stringify(opts);
  if (!nfCache.has(k)) nfCache.set(k, new Intl.NumberFormat(locale, opts));
  return nfCache.get(k);
}
const loc = () => (getLang() === 'ru' ? 'ru-RU' : 'en-US');

export const MASK = '••••••';

export const curr = () => state.settings.currency;
export const fiatRate = () => state.fx[curr()] ?? 1;
export const toFiat = (usd) => usd * fiatRate();
export const fromFiat = (v) => v / fiatRate();

/** Format a USD value in the user's currency. */
export function fmtFiat(usd, { sign = false, hide = false, compact = false, digits } = {}) {
  if (hide) return MASK;
  const c = curr();
  const meta = FIAT[c];
  const v = toFiat(usd);
  const abs = Math.abs(v);
  let d = digits ?? (abs >= 1000 ? meta.digits : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6);
  if (c === 'RUB' && digits == null) d = abs >= 100 ? 0 : abs >= 1 ? 2 : 4;
  const opts = compact && abs >= 1e5
    ? { notation: 'compact', maximumFractionDigits: 2 }
    : { minimumFractionDigits: abs >= 1000 && d === 0 ? 0 : Math.min(2, d), maximumFractionDigits: d };
  const body = nf(loc(), opts).format(abs);
  const s = v < 0 ? '−' : sign && v > 0 ? '+' : '';
  return c === 'RUB' ? `${s}${body} ${meta.symbol}` : `${s}${meta.symbol}${body}`;
}

/** Split fiat into [integer part, fraction] for the hero (cents dimmed). */
export function fmtFiatParts(usd, hide) {
  if (hide) return [MASK, ''];
  const c = curr();
  const meta = FIAT[c];
  const v = toFiat(usd);
  const body = nf(loc(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));
  const dec = nf(loc(), { minimumFractionDigits: 1 }).format(1.1).charAt(1);
  const [i, f] = body.split(dec);
  const pre = c === 'RUB' ? '' : meta.symbol;
  const post = c === 'RUB' ? ` ${meta.symbol}` : '';
  return [`${v < 0 ? '−' : ''}${pre}${i}`, `${dec}${f}${post}`];
}

/** Crypto amount: sensible decimals by magnitude, trailing zeros trimmed. */
export function fmtAmount(n, maxDec = 8) {
  if (!isFinite(n)) return '0';
  const abs = Math.abs(n);
  let d = abs >= 1000 ? 2 : abs >= 1 ? 4 : abs >= 0.01 ? 6 : maxDec;
  d = Math.min(d, maxDec);
  return nf(loc(), { minimumFractionDigits: 0, maximumFractionDigits: d }).format(n);
}
export const fmtAsset = (n, symbol, maxDec) => `${fmtAmount(n, maxDec)} ${symbol}`;

export function fmtPct(p, { sign = true } = {}) {
  if (!isFinite(p)) return '0%';
  const s = p > 0 && sign ? '+' : p < 0 ? '−' : '';
  return `${s}${nf(loc(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(p))}%`;
}
export const trendClass = (p) => (p > 0.005 ? 'pos' : p < -0.005 ? 'neg' : 'flat');

export function fmtCompact(n) {
  return nf(loc(), { notation: 'compact', maximumFractionDigits: 2 }).format(n);
}
export const fmtPlain = (n, d = 2) => nf(loc(), { minimumFractionDigits: 0, maximumFractionDigits: d }).format(n);

export function shortAddr(a = '', head = 6, tail = 5) {
  return a.length > head + tail + 1 ? `${a.slice(0, head)}…${a.slice(-tail)}` : a;
}

/* ---------- dates ---------- */
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
export function dayLabel(ts) {
  const today = startOfDay(new Date());
  const day = startOfDay(new Date(ts));
  const diff = Math.round((today - day) / 864e5);
  if (diff === 0) return t('date.today');
  if (diff === 1) return t('date.yesterday');
  return new Intl.DateTimeFormat(loc(), { day: 'numeric', month: 'long', year: new Date(ts).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }).format(ts);
}
export const timeLabel = (ts) => new Intl.DateTimeFormat(loc(), { hour: '2-digit', minute: '2-digit' }).format(ts);
export const dateTimeLabel = (ts) => new Intl.DateTimeFormat(loc(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(ts);
export function chartTimeLabel(ts, range) {
  const o = range === '1D' ? { hour: '2-digit', minute: '2-digit' } : range === '1Y' ? { day: 'numeric', month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
  return new Intl.DateTimeFormat(loc(), o).format(ts);
}

export function fmtEta(sec) {
  return sec < 60 ? t('eta.sec', { n: sec }) : t('eta.min', { n: Math.round(sec / 60) });
}

export function greeting() {
  const h = new Date().getHours();
  return t(h < 5 ? 'greet.night' : h < 12 ? 'greet.morning' : h < 18 ? 'greet.day' : 'greet.evening');
}
