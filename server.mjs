// Zero-dependency static dev server for the Mini App.
//   node server.mjs                 -> http://127.0.0.1:5173
//   node server.mjs --host 0.0.0.0  -> reachable from phone on the same Wi-Fi
//   PORT=8080 node server.mjs
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const args = process.argv.slice(2);
const hostIdx = args.indexOf('--host');
const HOST = hostIdx > -1 ? args[hostIdx + 1] : process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 5173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    let file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    let info = await stat(file).catch(() => null);
    if (!info || info.isDirectory()) {
      if (path.extname(rel)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
        return;
      }
      file = path.join(ROOT, 'index.html'); // SPA fallback
    }
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Server error');
    console.error(err);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Onyx Mini App  ->  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}\n`);
  if (HOST === '0.0.0.0') console.log('  LAN mode: open http://<your-pc-ip>:' + PORT + ' on your phone.\n');
});
