// Minimal Telegram bot (zero dependencies, Node 18+) that opens the Mini App.
//
//   BOT_TOKEN=123:abc WEBAPP_URL=https://your-domain.tld node bot/bot.mjs
//   (or put both in a .env file in the project root)
//
// What it does:
//   • /start        -> message with an "Open wallet" Web App button
//   • /start <deep> -> same, but opens the app on a specific screen (deep link)
//   • sets the bot's chat menu button to open the Mini App
//
// Deep links understood by the app: send, receive, buy, swap, markets, activity,
// settings, asset_BTC, tx_<id>.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadEnv() {
  try {
    const raw = await readFile(path.join(root, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* no .env */ }
}
await loadEnv();

const TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
if (!TOKEN || !WEBAPP_URL) {
  console.error('Set BOT_TOKEN and WEBAPP_URL (see .env.example).');
  process.exit(1);
}
if (!/^https:\/\//.test(WEBAPP_URL)) {
  console.error('WEBAPP_URL must be an https:// URL (Telegram requirement).');
  process.exit(1);
}

const api = async (method, body) => {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data.result;
};

const appUrl = (deep) => (deep ? `${WEBAPP_URL}${WEBAPP_URL.includes('?') ? '&' : '?'}startapp=${encodeURIComponent(deep)}` : WEBAPP_URL);

async function onMessage(msg) {
  const text = msg.text || '';
  if (!text.startsWith('/start')) return;
  const deep = text.split(/\s+/)[1] || '';
  const ru = (msg.from?.language_code || '').startsWith('ru');
  await api('sendMessage', {
    chat_id: msg.chat.id,
    text: ru ? 'Добро пожаловать в Onyx — ваш кошелёк прямо в Telegram.' : 'Welcome to Onyx — your wallet, right inside Telegram.',
    reply_markup: { inline_keyboard: [[{ text: ru ? 'Открыть кошелёк' : 'Open wallet', web_app: { url: appUrl(deep) } }]] },
  });
}

async function main() {
  const me = await api('getMe');
  await api('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Onyx', web_app: { url: WEBAPP_URL } } });
  console.log(`Bot @${me.username} is running. Menu button -> ${WEBAPP_URL}`);
  let offset = 0;
  for (;;) {
    try {
      const updates = await api('getUpdates', { offset, timeout: 30, allowed_updates: ['message'] });
      for (const u of updates) {
        offset = u.update_id + 1;
        if (u.message) onMessage(u.message).catch((e) => console.error(e.message));
      }
    } catch (e) {
      console.error('poll error:', e.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}
main();
