// Verifies every t('key') used in the code exists in both RU and EN dictionaries.
//   node scripts/check-i18n.mjs
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'js');
const { LANG_KEYS } = await import(pathToFileURL(path.join(root, 'i18n.js')).href);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

const ru = new Set(LANG_KEYS.ru);
const en = new Set(LANG_KEYS.en);
const used = new Set();
const missing = [];

for (const f of await walk(root)) {
  if (f.endsWith('i18n.js')) continue;
  const src = await readFile(f, 'utf8');
  for (const m of src.matchAll(/\bt\(\s*'([\w.]+)'/g)) used.add(m[1]);
  for (const m of src.matchAll(/\bt\(\s*`([\w.]+)\$\{[^}]+\}`/g)) used.add(`${m[1]}*`);
}

// dynamic key families
const families = {
  'tx.': ['send', 'receive', 'swap', 'buy'],
  'tx.status.': ['confirmed', 'pending', 'failed'],
  'range.s.': ['1D', '1W', '1M', '3M', '1Y'],
  'range.l.': ['1D', '1W', '1M', '3M', '1Y'],
  'about.': ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'XRP', 'TON', 'DOGE', 'TRX', 'LTC', 'LINK'],
  'lock.auto.': ['immediate', '1m', '5m', 'never'],
  'markets.f.': ['all', 'fav', 'up', 'down'],
  'activity.f.': ['all', 'send', 'receive', 'swap', 'buy'],
  'buy.': ['card', 'bank'],
};
for (const k of [...used]) {
  if (!k.endsWith('*')) continue;
  used.delete(k);
  const fam = families[k.slice(0, -1)];
  if (!fam) { missing.push(`(no family declared for ${k})`); continue; }
  fam.forEach((s) => used.add(k.slice(0, -1) + s));
}

for (const k of used) {
  if (!ru.has(k)) missing.push(`RU missing: ${k}`);
  if (!en.has(k)) missing.push(`EN missing: ${k}`);
}
for (const k of ru) if (!en.has(k)) missing.push(`EN lacks (present in RU): ${k}`);
for (const k of en) if (!ru.has(k)) missing.push(`RU lacks (present in EN): ${k}`);
const unused = [...ru].filter((k) => !used.has(k));

console.log(`keys: ru=${ru.size} en=${en.size}, used=${used.size}`);
if (unused.length) console.log('unused (info):', unused.join(', '));
if (missing.length) { console.error('\nPROBLEMS:\n' + missing.join('\n')); process.exit(1); }
console.log('i18n OK');

