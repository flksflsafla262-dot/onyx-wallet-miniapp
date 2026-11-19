// Self-check for the QR encoder: re-reads the matrix we generate and verifies
// format info, de-masks, de-interleaves and checks Reed-Solomon syndromes + payload.
//   node scripts/test-qr.mjs
import { qrMatrix } from '../public/js/ui/qr.js';

const ECC = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28];
const NB = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49];

function mul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z; }
const polyEval = (cw, x) => cw.reduce((r, c) => mul(r, x) ^ c, 0);
function rawModules(ver) {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) { const n = Math.floor(ver / 7) + 2; r -= (25 * n - 10) * n - 55; if (ver >= 7) r -= 36; }
  return r;
}

function check(text) {
  const m = qrMatrix(text);
  const size = m.length;
  const ver = (size - 17) / 4;

  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const mark = (x, y) => { if (x >= 0 && y >= 0 && x < size && y < size) fn[y][x] = true; };
  for (let i = 0; i < size; i++) { mark(6, i); mark(i, 6); }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) mark(cx + dx, cy + dy);
  if (ver > 1) {
    const n = Math.floor(ver / 7) + 2;
    const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
    const pos = [6]; for (let p = size - 7; pos.length < n; p -= step) pos.splice(1, 0, p);
    pos.forEach((a, i) => pos.forEach((b, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) mark(a + dx, b + dy);
    }));
  }
  for (let i = 0; i < 9; i++) { mark(8, i); mark(i, 8); }
  for (let i = 0; i < 8; i++) { mark(size - 1 - i, 8); mark(8, size - 1 - i); }
  if (ver >= 7) for (let i = 0; i < 18; i++) { mark(size - 11 + (i % 3), Math.floor(i / 3)); mark(Math.floor(i / 3), size - 11 + (i % 3)); }

  // format bits (first copy) -> ECC level + mask
  let bits = 0;
  const g = (x, y) => (m[y][x] ? 1 : 0);
  for (let i = 0; i <= 5; i++) bits |= g(8, i) << i;
  bits |= g(8, 7) << 6; bits |= g(8, 8) << 7; bits |= g(7, 8) << 8;
  for (let i = 9; i < 15; i++) bits |= g(14 - i, 8) << i;
  const data5 = (bits ^ 0x5412) >> 10;
  const mask = data5 & 7, ecl = data5 >> 3;
  if (ecl !== 0) throw new Error(`ECC level bits ${ecl} (expected 0 = M)`);

  // second format copy must agree with the first
  let bits2 = 0;
  for (let i = 0; i < 8; i++) bits2 |= g(size - 1 - i, 8) << i;
  for (let i = 8; i < 15; i++) bits2 |= g(8, size - 15 + i) << i;
  if (bits2 !== bits) throw new Error('format copies disagree');

  const maskFn = [
    (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ][mask];
  const stream = [];
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, upward = ((right + 1) & 2) === 0, y = upward ? size - 1 - vert : vert;
      if (!fn[y][x]) stream.push(m[y][x] !== maskFn(x, y));
    }
  }
  const total = Math.floor(rawModules(ver) / 8);
  const cw = [];
  for (let i = 0; i < total; i++) { let b = 0; for (let k = 0; k < 8; k++) b = (b << 1) | (stream[i * 8 + k] ? 1 : 0); cw.push(b); }

  // de-interleave (short blocks are padded by one slot at index shortLen-ecc)
  const nb = NB[ver], ecc = ECC[ver], nShort = nb - (total % nb), shortLen = Math.floor(total / nb);
  const blocks = Array.from({ length: nb }, () => []);
  let k = 0;
  for (let i = 0; i <= shortLen; i++) for (let j = 0; j < nb; j++) {
    if (i === shortLen - ecc && j < nShort) continue;
    if (i === shortLen && false) continue;
    if (k < total) blocks[j].push(cw[k++]);
  }
  // every block must be a valid RS codeword: first syndromes vanish (roots 2^0 .. 2^9)
  const roots = [1, 2, 4, 8, 16, 32, 64, 128, 29, 58];
  blocks.forEach((blk, bi) => roots.forEach((root, r) => {
    if (polyEval(blk, root) !== 0) throw new Error(`block ${bi} syndrome ${r} != 0`);
  }));

  const dataBytes = blocks.flatMap((b) => b.slice(0, b.length - ecc));
  let p = 0;
  const rd = (n) => { let v = 0; for (let i = 0; i < n; i++) { v = (v << 1) | ((dataBytes[p >> 3] >> (7 - (p & 7))) & 1); p++; } return v; };
  const mode = rd(4), len = rd(ver <= 9 ? 8 : 16);
  const out = []; for (let i = 0; i < len; i++) out.push(rd(8));
  const decoded = new TextDecoder().decode(Uint8Array.from(out));
  if (mode !== 4) throw new Error('mode != byte');
  if (decoded !== text) throw new Error(`payload mismatch: ${decoded}`);
  return { ver, mask, size };
}

const samples = [
  'hello',
  'bc1qqpzry9x8gf2tvdw0s3jn54khce6mua7lqpzry9',
  '0xa1b2c3d4e5a1b2c3d4e5a1b2c3d4e5a1b2c3d4e5',
  'TAbCdEfGhJkLmNpQrStUvWxYz123456789',
  'UQA-b_C0d1E2f3G4h5I6j7K8l9M0n1O2p3Q4r5S6t7U8v9',
  'x'.repeat(120),
  'x'.repeat(250),
  'Привет мир',
];
let fail = 0;
for (const s of samples) {
  try { const r = check(s); console.log(`ok   v${r.ver} mask${r.mask} ${r.size}x${r.size}  len=${s.length}`); }
  catch (e) { fail++; console.error(`FAIL len=${s.length}: ${e.message}`); }
}
process.exit(fail ? 1 : 0);
