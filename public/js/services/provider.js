/* ==========================================================================
   Wallet data provider — the ONLY module the UI talks to for money/data.

   Contract (all methods return Promises unless noted):

     init()                              -> { assets, balances, txs, fx }
     getHistory(assetId, range)          -> [{ t, p }]               range: 1D|1W|1M|3M|1Y
     sparkline(assetId)                  -> number[]                 (sync, cached)
     getTransactions()                   -> Tx[]
     getAddress(assetId, networkId)      -> string
     validateAddress(networkId, address) -> { valid, addr }          (sync)
     estimateFee(assetId, networkId, amount) -> { fee, feeAssetId, feeUsd, eta }
     send({ assetId, networkId, to, amount, memo }) -> Tx
     quoteSwap({ from, to, amount })     -> Quote
     swap(quote)                         -> Tx
     buyMethods()                        -> Method[]
     quoteBuy({ assetId, fiatUsd, method }) -> { amount, feeUsd, rate }
     buy({ assetId, fiatUsd, method })   -> Tx
     onPrices(cb)                        -> unsubscribe
     onTx(cb)                            -> unsubscribe

   This file ships a local, self-contained implementation so the UI is fully
   interactive. To connect a real backend, keep this same shape and replace the
   bodies with fetch()/WebSocket calls (see README → "Going live").
   ========================================================================== */
import { CATALOG, NETWORKS, validateAddress as validate } from '../data/assets.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- deterministic randomness ---------- */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());

const CHARS = {
  base58: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  bech32: 'qpzry9x8gf2tvdw0s3jn54khce6mua7l',
  hex: '0123456789abcdef',
  b64url: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-',
};
function pick(r, set, n) { let s = ''; for (let i = 0; i < n; i++) s += set[Math.floor(r() * set.length)]; return s; }

function makeAddress(networkId, seed) {
  const r = rng(hash(`${networkId}:${seed}`));
  switch (networkId) {
    case 'bitcoin': return 'bc1q' + pick(r, CHARS.bech32, 38);
    case 'litecoin': return 'ltc1q' + pick(r, CHARS.bech32, 38);
    case 'ethereum': case 'bsc': return '0x' + pick(r, CHARS.hex, 40);
    case 'tron': return 'T' + pick(r, CHARS.base58, 33);
    case 'ton': return 'UQ' + pick(r, CHARS.b64url, 46);
    case 'solana': return pick(r, CHARS.base58, 44);
    case 'xrp': return 'r' + pick(r, CHARS.base58, 28);
    case 'dogecoin': return 'D' + pick(r, CHARS.base58, 33);
    default: return pick(r, CHARS.base58, 40);
  }
}
const makeHash = (seed) => pick(rng(hash(seed)), CHARS.hex, 64);

/* ---------- market model ---------- */
const NATIVE = { bitcoin: 'BTC', ethereum: 'ETH', bsc: 'BNB', tron: 'TRX', ton: 'TON', solana: 'SOL', xrp: 'XRP', dogecoin: 'DOGE', litecoin: 'LTC' };
const FEE_USD = { bitcoin: 1.9, ethereum: 2.6, bsc: 0.09, tron: 1.1, ton: 0.014, solana: 0.004, xrp: 0.003, dogecoin: 0.05, litecoin: 0.02 };
const RANGE_SPEC = {
  '1D': { n: 96, span: 864e5, vol: 0.012 },
  '1W': { n: 112, span: 6048e5, vol: 0.03 },
  '1M': { n: 120, span: 2592e6, vol: 0.075 },
  '3M': { n: 120, span: 7776e6, vol: 0.13 },
  '1Y': { n: 150, span: 31536e6, vol: 0.28 },
};

const assets = CATALOG.map((c, i) => ({
  ...c,
  symbol: c.id,
  rank: i + 1,
  price: c.base,
  ref24: c.base / (1 + c.change / 100),
  change24h: c.change,
  vm: 0.8 + (hash(c.id) % 70) / 100,
}));
const byId = Object.fromEntries(assets.map((a) => [a.id, a]));

const balances = { BTC: 0.0421, ETH: 1.284, USDT: 2450.5, TON: 842.3, SOL: 12.6, BNB: 3.2, USDC: 640, TRX: 5200 };

const seriesCache = new Map();
function buildSeries(id, range) {
  const key = `${id}:${range}`;
  if (seriesCache.has(key)) return seriesCache.get(key);
  const a = byId[id];
  const spec = RANGE_SPEC[range];
  const r = rng(hash(key));
  const sigma = (a.stable ? 0.0012 : spec.vol) * a.vm;
  const n = spec.n;
  // brownian bridge + linear log-trend ending at the current price
  const inc = Array.from({ length: n }, () => gauss(r) * (sigma / Math.sqrt(n)));
  const W = [0];
  for (let i = 1; i < n; i++) W[i] = W[i - 1] + inc[i];
  const endLn = Math.log(a.price);
  let pct;
  if (range === '1D') pct = a.change24h;
  else pct = (r() - 0.42) * 2 * sigma * 100 * 1.6;
  if (a.stable) pct = (r() - 0.5) * 0.06;
  const startLn = endLn - Math.log(1 + pct / 100);
  const now = Date.now();
  const out = [];
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const bridge = W[i] - k * W[n - 1];
    out.push({ t: now - spec.span * (1 - k), p: Math.exp(startLn + (endLn - startLn) * k + bridge) });
  }
  out[n - 1].p = a.price;
  seriesCache.set(key, out);
  return out;
}

/* ---------- transactions ---------- */
const MIN = 6e4, HR = 36e5, DAY = 864e5;
const txs = [];
function seedTxs() {
  const now = Date.now();
  const mk = (n, o) => ({ id: `tx_${n}`, status: 'confirmed', confirmations: 24, memo: '', ...o, hash: makeHash(`tx${n}`) });
  const A = (net, s) => makeAddress(net, s);
  txs.push(
    mk(1, { type: 'receive', assetId: 'USDT', amount: 500, network: 'tron', address: A('tron', 'ext1'), ts: now - 2 * MIN, status: 'pending', confirmations: 0, fee: 0, feeAssetId: 'TRX' }),
    mk(2, { type: 'swap', assetId: 'ETH', amount: 0.35, toAssetId: 'SOL', toAmount: 6.41, ts: now - 3 * HR, fee: 0.0021, feeAssetId: 'ETH', network: 'ethereum' }),
    mk(3, { type: 'send', assetId: 'TON', amount: 120, network: 'ton', address: A('ton', 'ext2'), ts: now - 7 * HR, fee: 0.0143, feeAssetId: 'TON', memo: '' }),
    mk(4, { type: 'receive', assetId: 'BTC', amount: 0.0125, network: 'bitcoin', address: A('bitcoin', 'ext3'), ts: now - 1 * DAY - 2 * HR, fee: 0, feeAssetId: 'BTC' }),
    mk(5, { type: 'buy', assetId: 'TON', amount: 250, network: 'ton', ts: now - 1 * DAY - 5 * HR, fee: 0, feeAssetId: 'TON', fiatUsd: 1435 }),
    mk(6, { type: 'send', assetId: 'USDT', amount: 300, network: 'tron', address: A('tron', 'ext4'), ts: now - 2 * DAY - 3 * HR, fee: 1.1, feeAssetId: 'TRX' }),
    mk(7, { type: 'swap', assetId: 'USDC', amount: 400, toAssetId: 'BNB', toAmount: 0.649, ts: now - 3 * DAY - HR, fee: 1.2, feeAssetId: 'USDC', network: 'ethereum' }),
    mk(8, { type: 'receive', assetId: 'ETH', amount: 0.8, network: 'ethereum', address: A('ethereum', 'ext5'), ts: now - 4 * DAY - 6 * HR, fee: 0, feeAssetId: 'ETH' }),
    mk(9, { type: 'send', assetId: 'SOL', amount: 2.5, network: 'solana', address: A('solana', 'ext6'), ts: now - 6 * DAY - 2 * HR, fee: 0.00002, feeAssetId: 'SOL' }),
    mk(10, { type: 'receive', assetId: 'USDC', amount: 1040, network: 'ethereum', address: A('ethereum', 'ext7'), ts: now - 9 * DAY - 4 * HR, fee: 0, feeAssetId: 'USDC' }),
    mk(11, { type: 'buy', assetId: 'BTC', amount: 0.03, network: 'bitcoin', ts: now - 12 * DAY, fee: 0, feeAssetId: 'BTC', fiatUsd: 2790 }),
  );
}
seedTxs();

/* ---------- live price ticks ---------- */
const priceSubs = new Set();
const txSubs = new Set();
let tickTimer = null;
function startTicks() {
  if (tickTimer) return;
  tickTimer = setInterval(() => {
    const r = Math.random;
    for (const a of assets) {
      const vol = a.stable ? 0.00003 : 0.00055 * a.vm;
      a.price = Math.max(1e-6, a.price * (1 + gauss(r) * vol));
      a.change24h = (a.price / a.ref24 - 1) * 100;
    }
    priceSubs.forEach((cb) => cb());
  }, 3200);
}

const emitTx = (tx) => txSubs.forEach((cb) => cb(tx));
function settle(tx, ms = 6500) {
  setTimeout(() => {
    tx.status = 'confirmed';
    tx.confirmations = 12;
    if (tx.type === 'receive' && !tx._credited) { balances[tx.assetId] = (balances[tx.assetId] || 0) + tx.amount; tx._credited = true; }
    if (tx.type === 'buy' && !tx._credited) { balances[tx.assetId] = (balances[tx.assetId] || 0) + tx.amount; tx._credited = true; }
    emitTx(tx);
  }, ms);
}

const fail = (code, message) => Object.assign(new Error(message || code), { code });

/* ========================================================================== */
export const provider = {
  async init() {
    await sleep(380);
    startTicks();
    const pending = txs.find((t) => t.status === 'pending');
    if (pending) settle(pending, 9000);
    return { assets, byId, balances, txs, fx: { USD: 1, EUR: 0.92, RUB: 96.4 } };
  },

  async getHistory(id, range = '1D') {
    await sleep(160);
    return buildSeries(id, range);
  },
  sparkline(id) {
    return buildSeries(id, '1W').filter((_, i) => i % 3 === 0).map((x) => x.p);
  },

  async getTransactions() { return txs; },

  async getAddress(assetId, networkId) {
    await sleep(120);
    return makeAddress(networkId, 'me');
  },
  validateAddress(networkId, address) { return validate(networkId, address); },

  async estimateFee(assetId, networkId) {
    await sleep(220);
    const feeAssetId = NATIVE[networkId] || assetId;
    const feeUsd = FEE_USD[networkId] ?? 1;
    const fee = feeUsd / byId[feeAssetId].price;
    return { fee, feeAssetId, feeUsd, eta: NETWORKS[networkId]?.eta || 60 };
  },

  async send({ assetId, networkId, to, amount, memo = '' }) {
    await sleep(1100);
    const v = validate(networkId, to);
    if (!v.valid) throw fail('BAD_ADDRESS');
    const est = await provider.estimateFee(assetId, networkId);
    const need = assetId === est.feeAssetId ? amount + est.fee : amount;
    if ((balances[assetId] || 0) < need - 1e-12) throw fail('INSUFFICIENT');
    if (assetId !== est.feeAssetId && (balances[est.feeAssetId] || 0) < est.fee) throw fail('FEE');
    balances[assetId] -= amount;
    balances[est.feeAssetId] -= est.fee;
    const tx = { id: `tx_${Date.now()}`, type: 'send', assetId, amount, network: networkId, address: v.addr, memo, status: 'pending', confirmations: 0, ts: Date.now(), fee: est.fee, feeAssetId: est.feeAssetId, hash: makeHash(`s${Date.now()}${to}`) };
    txs.unshift(tx);
    settle(tx);
    emitTx(tx);
    return tx;
  },

  async quoteSwap({ from, to, amount }) {
    await sleep(380);
    const a = byId[from], b = byId[to];
    const usd = amount * a.price;
    const feePct = 0.003;
    const rate = (a.price / b.price) * (1 - feePct);
    const toAmount = amount * rate;
    const impact = Math.min(5, (usd / 4e6) * 100);
    return {
      from, to, amount, rate, toAmount,
      feeUsd: usd * feePct, feePct,
      slippage: 0.5, minReceived: toAmount * (1 - 0.005),
      impact, route: [a.id, byId.USDT.id === a.id || byId.USDT.id === b.id ? null : 'USDT', b.id].filter(Boolean),
      expiresAt: Date.now() + 20000,
    };
  },

  async swap(q) {
    await sleep(1300);
    if ((balances[q.from] || 0) < q.amount - 1e-12) throw fail('INSUFFICIENT');
    if (Date.now() > q.expiresAt + 8000) throw fail('EXPIRED');
    balances[q.from] -= q.amount;
    balances[q.to] = (balances[q.to] || 0) + q.toAmount;
    const tx = { id: `tx_${Date.now()}`, type: 'swap', assetId: q.from, amount: q.amount, toAssetId: q.to, toAmount: q.toAmount, status: 'confirmed', confirmations: 1, ts: Date.now(), fee: q.feeUsd / byId[q.from].price, feeAssetId: q.from, network: byId[q.from].networks[0], hash: makeHash(`w${Date.now()}`) };
    txs.unshift(tx);
    emitTx(tx);
    return tx;
  },

  buyMethods() {
    return [
      { id: 'card', feePct: 0.0299, min: 20, max: 10000 },
      { id: 'bank', feePct: 0.009, min: 50, max: 50000 },
    ];
  },
  async quoteBuy({ assetId, fiatUsd, method }) {
    await sleep(260);
    const m = provider.buyMethods().find((x) => x.id === method) || provider.buyMethods()[0];
    const feeUsd = fiatUsd * m.feePct;
    const price = byId[assetId].price;
    return { amount: (fiatUsd - feeUsd) / price, feeUsd, rate: price, min: m.min, max: m.max };
  },
  async buy({ assetId, fiatUsd, method }) {
    await sleep(1200);
    const q = await provider.quoteBuy({ assetId, fiatUsd, method });
    const tx = { id: `tx_${Date.now()}`, type: 'buy', assetId, amount: q.amount, fiatUsd, network: byId[assetId].networks[0], status: 'pending', confirmations: 0, ts: Date.now(), fee: 0, feeAssetId: assetId, hash: makeHash(`b${Date.now()}`) };
    txs.unshift(tx);
    settle(tx, 8000);
    emitTx(tx);
    return tx;
  },

  onPrices(cb) { priceSubs.add(cb); return () => priceSubs.delete(cb); },
  onTx(cb) { txSubs.add(cb); return () => txSubs.delete(cb); },
};

export const feeAssetFor = (networkId) => NATIVE[networkId];
