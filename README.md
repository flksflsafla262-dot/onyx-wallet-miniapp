# Onyx — Telegram Mini App (крипто-кошелёк)

Чёрно-графитовый кошелёк в стиле Apple для Telegram Mini Apps. Без сборки и зависимостей: чистые ES-модули, один `index.html`.
Работает внутри Telegram (iOS, Android, Desktop, Web) и в обычном браузере (на ПК отображается в «телефонной» рамке).

**Живая версия (GitHub Pages):** https://flksflsafla262-dot.github.io/onyx-wallet-miniapp/
Деплой автоматический: каждый push в `main` публикует папку `public/` (см. `.github/workflows/pages.yml`).

Анимации намеренно **не отключаются** системной настройкой «уменьшить движение» / «показывать анимации» в Windows.

## Запуск

```bash
npm run dev          # http://127.0.0.1:5173
npm run lan          # доступ с телефона по Wi-Fi: http://<IP-ПК>:5173
npm run check        # проверка ключей локализации
node scripts/test-qr.mjs   # самопроверка QR-кодировщика
```

Нужен только Node 18+. Python/npm install не требуются.

## Подключение к боту

Telegram открывает Mini App **только по HTTPS**. Варианты:

1. Для разработки — туннель: `cloudflared tunnel --url http://localhost:5173` (или ngrok) → получите `https://…`.
2. Для продакшена — выложите папку `public/` на любой статический хостинг (Cloudflare Pages, GitHub Pages, Vercel, Netlify).

Дальше:

- **@BotFather → /newapp** (или `/mybots → Bot Settings → Menu Button`) — укажите https-адрес.
- Либо запустите готового бота из `bot/`:
  ```bash
  copy .env.example .env      # впишите BOT_TOKEN и WEBAPP_URL
  npm run bot
  ```
  Бот отвечает на `/start` кнопкой «Открыть кошелёк» и ставит кнопку меню.

### Глубокие ссылки

`https://t.me/<bot>?startapp=<параметр>` или кнопка с `?startapp=` открывает нужный экран:
`send`, `receive`, `buy`, `swap`, `markets`, `activity`, `settings`, `asset_BTC`, `tx_<id>`.

## Структура

```
public/
  index.html            оболочка + Telegram SDK
  css/                  tokens → base → components → screens
  js/
    main.js             запуск, события, deep links
    config.js           название, валюты, языки
    i18n.js             RU / EN
    core/               telegram, state, router, format, bindings, dom
    ui/                 sheet, chart, qr, keypad, toast, icons, dialogs
    screens/            wallet, markets, swap, activity, settings
    flows/              send, receive, buy, assetDetail, txDetail, security, …
    services/provider.js   ← ЕДИНСТВЕННАЯ точка доступа к данным и деньгам
    data/assets.js      каталог активов, сети, форматы адресов
bot/bot.mjs             минимальный бот (без зависимостей)
server.mjs              статический dev-сервер
scripts/                проверки (i18n, QR)
```

## Как сделать кошелёк рабочим

Весь UI общается с деньгами и данными **только** через `public/js/services/provider.js`. Контракт описан в шапке файла
(`init`, `getHistory`, `getAddress`, `estimateFee`, `send`, `quoteSwap`, `swap`, `quoteBuy`, `buy`, `onPrices`, `onTx` …).
Сейчас там локальная реализация, чтобы интерфейс был полностью интерактивным. Чтобы подключить бэкенд:

1. Оставьте тот же экспорт `provider` и ту же форму ответов, замените тела методов на `fetch()` / WebSocket к вашему API.
2. На сервере **обязательно проверяйте `Telegram.WebApp.initData`** (HMAC с токеном бота) — только так можно доверять `user.id`.
3. Подпись транзакций, ключи и лимиты — только на сервере. Клиент ничего не хранит, кроме настроек.
4. Код-пароль сейчас хранится как SHA-256 в `localStorage` (`flows/security.js`). Для продакшена переносите проверку на сервер или в
   Telegram `SecureStorage` / `BiometricManager`.
5. Иконки активов — монограммы (`ui/icons.js → coin()`); замените на официальные логотипы, соблюдая их гайдлайны.

## Дизайн-система

Токены в `css/tokens.css`: поверхности `--bg … --surface-4`, текст `--text / --text-2 / --text-3` (контраст ≥ 4.5:1),
семантика `--pos / --neg / --warn`, радиусы, ритм 4/8, кривые `--ease-sheet` (как у iOS-шторок) и `--ease-spring`.
Анимации учитывают `prefers-reduced-motion`. Safe-area берётся из Telegram (`safeAreaInset`, `contentSafeAreaInset`) с запасным `env()`.

Что учтено под Telegram: `expand()`, `disableVerticalSwipes()`, цвета шапки/фона/нижней панели, нативная кнопка «Назад»
(стек шторок), тактильный отклик, сканер QR, буфер обмена, биометрия, `openLink` / `openTelegramLink`.
