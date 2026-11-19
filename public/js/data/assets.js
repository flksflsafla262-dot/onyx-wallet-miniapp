// Static asset catalogue: identity, networks, address formats.
// Prices/balances/history come from the provider (services/), never from here.

const BASE58 = '[1-9A-HJ-NP-Za-km-z]';

export const NETWORKS = {
  bitcoin:  { id: 'bitcoin',  name: 'Bitcoin',          tag: 'BTC',   rx: /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/, eta: 600, explorer: 'https://mempool.space/tx/' },
  ethereum: { id: 'ethereum', name: 'Ethereum',         tag: 'ERC20', rx: /^0x[a-fA-F0-9]{40}$/, eta: 60,  explorer: 'https://etherscan.io/tx/' },
  bsc:      { id: 'bsc',      name: 'BNB Smart Chain',  tag: 'BEP20', rx: /^0x[a-fA-F0-9]{40}$/, eta: 15, explorer: 'https://bscscan.com/tx/' },
  tron:     { id: 'tron',     name: 'TRON',             tag: 'TRC20', rx: new RegExp(`^T${BASE58}{33}$`), eta: 60, explorer: 'https://tronscan.org/#/transaction/' },
  ton:      { id: 'ton',      name: 'TON',              tag: 'TON',   rx: /^(UQ|EQ|kQ|0Q)[A-Za-z0-9_-]{46}$/, eta: 10, explorer: 'https://tonviewer.com/transaction/' },
  solana:   { id: 'solana',   name: 'Solana',           tag: 'SOL',   rx: new RegExp(`^${BASE58}{32,44}$`), eta: 5, explorer: 'https://solscan.io/tx/' },
  xrp:      { id: 'xrp',      name: 'XRP Ledger',       tag: 'XRP',   rx: new RegExp(`^r${BASE58}{24,34}$`), eta: 5, explorer: 'https://xrpscan.com/tx/' },
  dogecoin: { id: 'dogecoin', name: 'Dogecoin',         tag: 'DOGE',  rx: new RegExp(`^D${BASE58}{33}$`), eta: 60, explorer: 'https://dogechain.info/tx/' },
  litecoin: { id: 'litecoin', name: 'Litecoin',         tag: 'LTC',   rx: /^(ltc1[a-z0-9]{20,62}|[LM][a-km-zA-HJ-NP-Z1-9]{26,33})$/, eta: 180, explorer: 'https://litecoinspace.org/tx/' },
};

// seed: deterministic history; base: reference USD price; memo: network needs memo/tag (none here)
export const CATALOG = [
  { id: 'BTC',  name: 'Bitcoin',   color: '#f7931a', decimals: 8, networks: ['bitcoin'],                       base: 94350,  change: 1.84,  mcap: 1.87e12, vol: 31.2e9, supply: 19.8e6, ath: 108400, about: 'btc' },
  { id: 'ETH',  name: 'Ethereum',  color: '#8a92b2', decimals: 8, networks: ['ethereum'],                      base: 3182,   change: -0.62, mcap: 383e9,   vol: 14.8e9, supply: 120.4e6, ath: 4891,  about: 'eth' },
  { id: 'USDT', name: 'Tether',    color: '#26a17b', decimals: 6, networks: ['tron', 'ethereum', 'ton'],       base: 1,      change: 0.01,  mcap: 141e9,   vol: 62.4e9, supply: 141e9,  ath: 1.32,  about: 'usdt', stable: true },
  { id: 'BNB',  name: 'BNB',       color: '#f3ba2f', decimals: 8, networks: ['bsc'],                           base: 612.4,  change: 0.94,  mcap: 89e9,    vol: 1.9e9,  supply: 145.9e6, ath: 793,   about: 'bnb' },
  { id: 'SOL',  name: 'Solana',    color: '#9945ff', decimals: 8, networks: ['solana'],                        base: 168.2,  change: 3.41,  mcap: 80e9,    vol: 3.4e9,  supply: 476e6,  ath: 294,   about: 'sol' },
  { id: 'USDC', name: 'USD Coin',  color: '#2775ca', decimals: 6, networks: ['ethereum', 'solana'],            base: 1,      change: -0.01, mcap: 43e9,    vol: 6.1e9,  supply: 43e9,   ath: 1.17,  about: 'usdc', stable: true },
  { id: 'XRP',  name: 'XRP',       color: '#9aa0a6', decimals: 6, networks: ['xrp'],                           base: 2.31,   change: -1.27, mcap: 132e9,   vol: 4.2e9,  supply: 57e9,   ath: 3.84,  about: 'xrp' },
  { id: 'TON',  name: 'Toncoin',   color: '#0098ea', decimals: 9, networks: ['ton'],                           base: 5.74,   change: 2.18,  mcap: 14.4e9,  vol: 412e6,  supply: 2.5e9,  ath: 8.25,  about: 'ton' },
  { id: 'DOGE', name: 'Dogecoin',  color: '#c2a633', decimals: 8, networks: ['dogecoin'],                      base: 0.182,  change: 4.72,  mcap: 27e9,    vol: 1.6e9,  supply: 148e9,  ath: 0.74,  about: 'doge' },
  { id: 'TRX',  name: 'TRON',      color: '#e50915', decimals: 6, networks: ['tron'],                          base: 0.246,  change: 0.38,  mcap: 21e9,    vol: 690e6,  supply: 86e9,   ath: 0.43,  about: 'trx' },
  { id: 'LTC',  name: 'Litecoin',  color: '#a6a9aa', decimals: 8, networks: ['litecoin'],                      base: 98.4,   change: -2.05, mcap: 7.4e9,   vol: 380e6,  supply: 75.3e6, ath: 410,   about: 'ltc' },
  { id: 'LINK', name: 'Chainlink', color: '#2a5ada', decimals: 8, networks: ['ethereum'],                      base: 16.2,   change: 1.12,  mcap: 10.2e9,  vol: 520e6,  supply: 626e6,  ath: 52.7,  about: 'link' },
];

export const NETWORK_LIST = NETWORKS;
export const networkOf = (id) => NETWORKS[id];

/** Strip URI schemes / query: "bitcoin:bc1q…?amount=1" → "bc1q…" */
export function parseAddress(raw = '') {
  let v = String(raw).trim();
  v = v.replace(/^[a-z]+:(\/\/)?/i, '');
  v = v.split(/[?@/#]/)[0];
  return v.trim();
}

export function validateAddress(networkId, raw) {
  const addr = parseAddress(raw);
  const net = NETWORKS[networkId];
  if (!addr) return { valid: false, empty: true, addr };
  if (!net) return { valid: false, addr };
  return { valid: net.rx.test(addr), addr };
}
