// Minimal i18n: t('key', { var }) with RU + EN dictionaries.
let lang = 'ru';

const ru = {
  'common.back': 'Назад', 'common.close': 'Закрыть', 'common.cancel': 'Отмена', 'common.network': 'Сеть',
  'common.continue': 'Продолжить', 'common.review': 'Проверить', 'common.search': 'Поиск',
  'common.nothingFound': 'Ничего не найдено', 'common.tryAnother': 'Попробуйте изменить запрос',
  'common.copy': 'Копировать', 'common.share': 'Поделиться', 'common.copied': 'Скопировано', 'common.copyFailed': 'Не удалось скопировать',
  'common.paste': 'Вставить', 'common.done': 'Готово', 'common.all': 'Все', 'common.save': 'Сохранить', 'common.delete': 'Удалить',
  'common.on': 'Вкл', 'common.off': 'Выкл',

  'tab.wallet': 'Кошелёк', 'tab.markets': 'Рынки', 'tab.swap': 'Обмен', 'tab.activity': 'История', 'tab.settings': 'Ещё',
  'greet.night': 'Доброй ночи', 'greet.morning': 'Доброе утро', 'greet.day': 'Добрый день', 'greet.evening': 'Добрый вечер',
  'date.today': 'Сегодня', 'date.yesterday': 'Вчера',

  'tx.send': 'Отправка', 'tx.receive': 'Получение', 'tx.swap': 'Обмен', 'tx.buy': 'Покупка',
  'tx.pending': 'В обработке', 'tx.failed': 'Ошибка', 'tx.card': 'Карта', 'tx.to': 'Кому', 'tx.from': 'От',
  'tx.details': 'Детали операции', 'tx.status.confirmed': 'Подтверждено', 'tx.status.pending': 'В обработке', 'tx.status.failed': 'Ошибка',
  'tx.statusLabel': 'Статус', 'tx.date': 'Дата', 'tx.paid': 'Отдано', 'tx.rate': 'Курс', 'tx.confirmations': 'Подтверждения',
  'tx.hash': 'Хэш', 'tx.explorer': 'Открыть в обозревателе',

  'err.insufficient': 'Недостаточно средств', 'err.fee': 'Недостаточно средств для комиссии', 'err.address': 'Неверный адрес получателя',
  'err.expired': 'Котировка устарела, попробуйте ещё раз', 'err.generic': 'Что-то пошло не так. Попробуйте ещё раз.', 'err.title': 'Не удалось выполнить',
  'err.feeNeeded': 'Нужно {sym} для оплаты комиссии',
  'pick.asset': 'Выберите актив',

  'send.title': 'Отправить', 'send.to': 'Получатель', 'send.address': 'Адрес', 'send.addressPh': 'Адрес в сети {net}',
  'send.scan': 'Сканировать QR', 'send.scanText': 'Наведите камеру на QR-код адреса', 'send.scanUnavailable': 'Сканер доступен в приложении Telegram',
  'send.clipboardEmpty': 'Буфер обмена пуст', 'send.addrOk': 'Адрес распознан', 'send.addrBad': 'Это не похоже на адрес в сети {net}',
  'send.available': 'Доступно', 'send.recent': 'Недавний получатель', 'send.saved': 'Адресная книга', 'send.amount': 'Сумма',
  'send.switchUnit': 'Переключить валюту ввода', 'send.max': 'Макс', 'send.review': 'Подтверждение', 'send.recipient': 'Получатель',
  'send.fee': 'Комиссия', 'send.eta': 'Время', 'send.total': 'Итого', 'send.irreversible': 'Транзакции в блокчейне необратимы. Проверьте адрес и сеть перед отправкой.',
  'send.confirm': 'Подтвердить и отправить', 'send.pinTitle': 'Подтвердите отправку', 'send.sending': 'Отправляем…', 'send.sendingSub': 'Подписываем и отправляем транзакцию в сеть',
  'send.sent': 'Отправлено', 'send.sentSub': '{amount} отправлено на {to}',
  'eta.sec': '~{n} сек', 'eta.min': '~{n} мин',

  'receive.title': 'Получить {sym}', 'receive.pick': 'Получить', 'receive.qr': 'QR-код адреса',
  'receive.warn': 'Отправляйте на этот адрес только {sym} в сети {net}. Другие активы могут быть потеряны.',

  'buy.title': 'Купить', 'buy.payWith': 'Способ оплаты', 'buy.card': 'Банковская карта', 'buy.bank': 'Банковский перевод',
  'buy.pickAsset': 'Что купить', 'buy.rate': 'курс', 'buy.min': 'Минимум {v}', 'buy.max': 'Максимум {v}', 'buy.fee': 'Комиссия {v}',
  'buy.review': 'Оплата', 'buy.youGet': 'Вы получите', 'buy.youPay': 'Вы платите', 'buy.method': 'Способ', 'buy.note': 'Средства будут зачислены после подтверждения платежа. Курс может немного измениться.',
  'buy.pay': 'Оплатить {v}', 'buy.processing': 'Создаём заказ…', 'buy.processingSub': 'Это займёт несколько секунд',
  'buy.done': 'Заказ создан', 'buy.doneSub': 'Ожидайте зачисления: {amount}',

  'swap.pay': 'Вы отдаёте', 'swap.receive': 'Вы получаете', 'swap.flip': 'Поменять местами', 'swap.impact': 'Влияние на цену {v}',
  'swap.rate': 'Курс', 'swap.slippage': 'Проскальзывание', 'swap.minReceived': 'Минимум получите', 'swap.route': 'Маршрут',
  'swap.review': 'Проверить обмен', 'swap.enter': 'Введите сумму', 'swap.insufficient': 'Недостаточно {sym}', 'swap.fetching': 'Получаем курс…',
  'swap.confirm': 'Подтверждение обмена', 'swap.for': 'за {v}', 'swap.exchange': 'Обменять', 'swap.processing': 'Выполняем обмен…', 'swap.processingSub': 'Ищем лучший курс',
  'swap.done': 'Обмен выполнен', 'swap.doneSub': '{a} → {b}',

  'act.send': 'Отправить', 'act.receive': 'Получить', 'act.swap': 'Обмен', 'act.buy': 'Купить',

  'asset.yourBalance': 'Ваш баланс', 'asset.range': 'Период', 'asset.stats': 'Статистика', 'asset.mcap': 'Капитализация', 'asset.volume': 'Объём за 24ч',
  'asset.supply': 'В обращении', 'asset.ath': 'Исторический максимум', 'asset.about': 'О {name}', 'asset.history': 'Ваши операции',
  'asset.favorite': 'В избранное', 'asset.chartAria': 'График цены {name}',
  'range.s.1D': '1Д', 'range.s.1W': '1Н', 'range.s.1M': '1М', 'range.s.3M': '3М', 'range.s.1Y': '1Г',
  'range.l.1D': 'за 24 часа', 'range.l.1W': 'за неделю', 'range.l.1M': 'за месяц', 'range.l.3M': 'за 3 месяца', 'range.l.1Y': 'за год',

  'about.BTC': 'Первая и крупнейшая криптовалюта. Децентрализованная сеть с ограниченной эмиссией в 21 млн монет — «цифровое золото».',
  'about.ETH': 'Платформа смарт-контрактов, на которой работают DeFi, NFT и тысячи приложений. Нативная монета — ETH.',
  'about.USDT': 'Стейблкоин, привязанный к доллару США. Удобен для переводов и хранения стоимости без волатильности.',
  'about.BNB': 'Нативный токен экосистемы BNB Chain. Используется для комиссий, стейкинга и сервисов биржи.',
  'about.SOL': 'Высокопроизводительный блокчейн с быстрыми транзакциями и низкими комиссиями.',
  'about.USDC': 'Регулируемый стейблкоин, обеспеченный долларом США и доступный в нескольких блокчейнах.',
  'about.XRP': 'Токен сети XRP Ledger, созданной для быстрых и дешёвых международных платежей.',
  'about.TON': 'Нативная монета блокчейна The Open Network, глубоко интегрированного с Telegram.',
  'about.DOGE': 'Старейшая мем-криптовалюта с активным сообществом. Часто используется для чаевых и платежей.',
  'about.TRX': 'Нативная монета сети TRON. Широко используется для дешёвых переводов USDT.',
  'about.LTC': 'Одна из старейших криптовалют, «серебро к золоту биткоина»: быстрые блоки и низкие комиссии.',
  'about.LINK': 'Децентрализованная сеть оракулов, поставляющая данные из внешнего мира в смарт-контракты.',

  'wallet.total': 'Общий баланс', 'wallet.assets': 'Активы', 'wallet.markets': 'Рынки', 'wallet.recent': 'Последние операции',
  'wallet.empty': 'Здесь пока пусто', 'wallet.emptySub': 'Пополните кошелёк, чтобы увидеть свои активы.',
  'wallet.secure': 'Защитите кошелёк', 'wallet.secureSub': 'Установите код-пароль для входа и подтверждения операций', 'wallet.scan': 'Сканировать QR',
  'wallet.toggleHide': 'Скрыть или показать баланс', 'wallet.chartAria': 'График стоимости портфеля',

  'markets.f.all': 'Все', 'markets.f.fav': 'Избранное', 'markets.f.up': 'Рост', 'markets.f.down': 'Падение',
  'markets.noFav': 'Нет избранных', 'markets.noFavSub': 'Нажмите на звёздочку рядом с активом, чтобы добавить его сюда.',
  'activity.f.all': 'Все', 'activity.f.send': 'Отправка', 'activity.f.receive': 'Получение', 'activity.f.swap': 'Обмен', 'activity.f.buy': 'Покупки',
  'activity.empty': 'Операций пока нет', 'activity.emptySub': 'Здесь появятся отправки, получения и обмены.',

  'settings.security': 'Безопасность', 'settings.passcode': 'Код-пароль', 'settings.faceid': 'Face ID', 'settings.biometric': 'Биометрия',
  'settings.autoLock': 'Автоблокировка', 'settings.hideBalance': 'Скрывать баланс', 'settings.general': 'Основные', 'settings.currency': 'Валюта',
  'settings.language': 'Язык', 'settings.book': 'Адресная книга', 'settings.notifications': 'Уведомления', 'settings.haptics': 'Вибрация',
  'settings.support': 'Поддержка', 'settings.help': 'Помощь', 'settings.terms': 'Условия использования', 'settings.privacy': 'Конфиденциальность',
  'settings.browser': 'Браузер', 'settings.passcodeOn': 'Код-пароль включён', 'settings.passcodeOff': 'Код-пароль выключен', 'settings.bioFailed': 'Не удалось подтвердить биометрию',

  'lock.keypad': 'Цифровая клавиатура', 'lock.biometric': 'Войти по биометрии', 'lock.locked': 'Слишком много попыток. Подождите {s} с', 'lock.wrong': 'Неверный код',
  'lock.enter': 'Введите код-пароль', 'lock.reason': 'Подтвердите личность', 'lock.confirm': 'Введите код-пароль', 'lock.create': 'Придумайте код-пароль',
  'lock.createSub': 'Он защитит вход и все операции', 'lock.repeat': 'Повторите код-пароль', 'lock.mismatch': 'Коды не совпадают',
  'lock.change': 'Изменить код-пароль', 'lock.disable': 'Выключить код-пароль',
  'lock.auto.immediate': 'Сразу', 'lock.auto.1m': 'Через 1 мин', 'lock.auto.5m': 'Через 5 мин', 'lock.auto.never': 'Никогда',

  'notify.tx': 'Операции', 'notify.txSub': 'Отправки, получения и обмены', 'notify.price': 'Цены', 'notify.priceSub': 'Резкие движения избранных активов',
  'notify.news': 'Новости', 'notify.newsSub': 'Обновления и возможности', 'notify.foot': 'Уведомления приходят от бота в Telegram.',

  'book.empty': 'Адресная книга пуста', 'book.emptySub': 'Сохраняйте адреса, чтобы быстро отправлять средства.', 'book.add': 'Новый адрес', 'book.name': 'Имя',
  'book.namePh': 'Например, Алекс', 'book.saved': 'Адрес сохранён', 'book.delete': 'Удалить адрес?', 'book.deleteSub': 'Адрес будет удалён из книги. Это не влияет на ваши средства.',
  'book.foot': 'Адреса хранятся только на этом устройстве.',
};

const en = {
  'common.back': 'Back', 'common.close': 'Close', 'common.cancel': 'Cancel', 'common.network': 'Network',
  'common.continue': 'Continue', 'common.review': 'Review', 'common.search': 'Search',
  'common.nothingFound': 'Nothing found', 'common.tryAnother': 'Try a different search',
  'common.copy': 'Copy', 'common.share': 'Share', 'common.copied': 'Copied', 'common.copyFailed': 'Couldn’t copy',
  'common.paste': 'Paste', 'common.done': 'Done', 'common.all': 'All', 'common.save': 'Save', 'common.delete': 'Delete',
  'common.on': 'On', 'common.off': 'Off',

  'tab.wallet': 'Wallet', 'tab.markets': 'Markets', 'tab.swap': 'Swap', 'tab.activity': 'Activity', 'tab.settings': 'More',
  'greet.night': 'Good night', 'greet.morning': 'Good morning', 'greet.day': 'Good afternoon', 'greet.evening': 'Good evening',
  'date.today': 'Today', 'date.yesterday': 'Yesterday',

  'tx.send': 'Sent', 'tx.receive': 'Received', 'tx.swap': 'Swap', 'tx.buy': 'Purchase',
  'tx.pending': 'Processing', 'tx.failed': 'Failed', 'tx.card': 'Card', 'tx.to': 'To', 'tx.from': 'From',
  'tx.details': 'Transaction details', 'tx.status.confirmed': 'Confirmed', 'tx.status.pending': 'Processing', 'tx.status.failed': 'Failed',
  'tx.statusLabel': 'Status', 'tx.date': 'Date', 'tx.paid': 'Paid', 'tx.rate': 'Rate', 'tx.confirmations': 'Confirmations',
  'tx.hash': 'Hash', 'tx.explorer': 'View in explorer',

  'err.insufficient': 'Insufficient balance', 'err.fee': 'Insufficient balance for the network fee', 'err.address': 'Invalid recipient address',
  'err.expired': 'The quote expired, please try again', 'err.generic': 'Something went wrong. Please try again.', 'err.title': 'Couldn’t complete',
  'err.feeNeeded': 'You need {sym} to pay the network fee',
  'pick.asset': 'Select asset',

  'send.title': 'Send', 'send.to': 'Recipient', 'send.address': 'Address', 'send.addressPh': '{net} address',
  'send.scan': 'Scan QR', 'send.scanText': 'Point the camera at an address QR code', 'send.scanUnavailable': 'The scanner is available in the Telegram app',
  'send.clipboardEmpty': 'Clipboard is empty', 'send.addrOk': 'Address recognised', 'send.addrBad': 'This doesn’t look like a {net} address',
  'send.available': 'Available', 'send.recent': 'Recent recipient', 'send.saved': 'Address book', 'send.amount': 'Amount',
  'send.switchUnit': 'Switch input currency', 'send.max': 'Max', 'send.review': 'Review', 'send.recipient': 'Recipient',
  'send.fee': 'Fee', 'send.eta': 'Time', 'send.total': 'Total', 'send.irreversible': 'Blockchain transactions are irreversible. Double-check the address and network before sending.',
  'send.confirm': 'Confirm and send', 'send.pinTitle': 'Confirm sending', 'send.sending': 'Sending…', 'send.sendingSub': 'Signing and broadcasting your transaction',
  'send.sent': 'Sent', 'send.sentSub': '{amount} sent to {to}',
  'eta.sec': '~{n} sec', 'eta.min': '~{n} min',

  'receive.title': 'Receive {sym}', 'receive.pick': 'Receive', 'receive.qr': 'Address QR code',
  'receive.warn': 'Only send {sym} on the {net} network to this address. Other assets may be lost.',

  'buy.title': 'Buy', 'buy.payWith': 'Payment method', 'buy.card': 'Bank card', 'buy.bank': 'Bank transfer',
  'buy.pickAsset': 'What to buy', 'buy.rate': 'rate', 'buy.min': 'Minimum {v}', 'buy.max': 'Maximum {v}', 'buy.fee': '{v} fee',
  'buy.review': 'Payment', 'buy.youGet': 'You will receive', 'buy.youPay': 'You pay', 'buy.method': 'Method', 'buy.note': 'Funds are credited once the payment is confirmed. The rate may change slightly.',
  'buy.pay': 'Pay {v}', 'buy.processing': 'Creating your order…', 'buy.processingSub': 'This takes a few seconds',
  'buy.done': 'Order created', 'buy.doneSub': 'Expect to receive {amount} shortly',

  'swap.pay': 'You pay', 'swap.receive': 'You receive', 'swap.flip': 'Switch tokens', 'swap.impact': 'Price impact {v}',
  'swap.rate': 'Rate', 'swap.slippage': 'Slippage', 'swap.minReceived': 'Minimum received', 'swap.route': 'Route',
  'swap.review': 'Review swap', 'swap.enter': 'Enter an amount', 'swap.insufficient': 'Insufficient {sym}', 'swap.fetching': 'Fetching rate…',
  'swap.confirm': 'Confirm swap', 'swap.for': 'for {v}', 'swap.exchange': 'Swap', 'swap.processing': 'Swapping…', 'swap.processingSub': 'Finding the best rate',
  'swap.done': 'Swap complete', 'swap.doneSub': '{a} → {b}',

  'act.send': 'Send', 'act.receive': 'Receive', 'act.swap': 'Swap', 'act.buy': 'Buy',

  'asset.yourBalance': 'Your balance', 'asset.range': 'Range', 'asset.stats': 'Statistics', 'asset.mcap': 'Market cap', 'asset.volume': '24h volume',
  'asset.supply': 'Circulating supply', 'asset.ath': 'All-time high', 'asset.about': 'About {name}', 'asset.history': 'Your activity',
  'asset.favorite': 'Favourite', 'asset.chartAria': '{name} price chart',
  'range.s.1D': '1D', 'range.s.1W': '1W', 'range.s.1M': '1M', 'range.s.3M': '3M', 'range.s.1Y': '1Y',
  'range.l.1D': 'past 24 hours', 'range.l.1W': 'past week', 'range.l.1M': 'past month', 'range.l.3M': 'past 3 months', 'range.l.1Y': 'past year',

  'about.BTC': 'The first and largest cryptocurrency. A decentralised network with a fixed supply of 21 million coins — “digital gold”.',
  'about.ETH': 'A smart-contract platform powering DeFi, NFTs and thousands of apps. Its native coin is ETH.',
  'about.USDT': 'A stablecoin pegged to the US dollar, handy for transfers and holding value without volatility.',
  'about.BNB': 'The native token of the BNB Chain ecosystem, used for fees, staking and exchange services.',
  'about.SOL': 'A high-performance blockchain with fast transactions and low fees.',
  'about.USDC': 'A regulated stablecoin backed by US dollars and available on multiple blockchains.',
  'about.XRP': 'The token of the XRP Ledger, built for fast and inexpensive cross-border payments.',
  'about.TON': 'The native coin of The Open Network, a blockchain deeply integrated with Telegram.',
  'about.DOGE': 'The original meme coin with an active community, often used for tipping and payments.',
  'about.TRX': 'The native coin of the TRON network, widely used for low-cost USDT transfers.',
  'about.LTC': 'One of the oldest cryptocurrencies — “silver to Bitcoin’s gold” with fast blocks and low fees.',
  'about.LINK': 'A decentralised oracle network that feeds real-world data into smart contracts.',

  'wallet.total': 'Total balance', 'wallet.assets': 'Assets', 'wallet.markets': 'Markets', 'wallet.recent': 'Recent activity',
  'wallet.empty': 'Nothing here yet', 'wallet.emptySub': 'Top up your wallet to see your assets.',
  'wallet.secure': 'Secure your wallet', 'wallet.secureSub': 'Set a passcode for sign-in and confirmations', 'wallet.scan': 'Scan QR',
  'wallet.toggleHide': 'Hide or show balance', 'wallet.chartAria': 'Portfolio value chart',

  'markets.f.all': 'All', 'markets.f.fav': 'Favourites', 'markets.f.up': 'Gainers', 'markets.f.down': 'Losers',
  'markets.noFav': 'No favourites', 'markets.noFavSub': 'Tap the star next to an asset to add it here.',
  'activity.f.all': 'All', 'activity.f.send': 'Sent', 'activity.f.receive': 'Received', 'activity.f.swap': 'Swaps', 'activity.f.buy': 'Purchases',
  'activity.empty': 'No activity yet', 'activity.emptySub': 'Sends, receives and swaps will show up here.',

  'settings.security': 'Security', 'settings.passcode': 'Passcode', 'settings.faceid': 'Face ID', 'settings.biometric': 'Biometrics',
  'settings.autoLock': 'Auto-lock', 'settings.hideBalance': 'Hide balance', 'settings.general': 'General', 'settings.currency': 'Currency',
  'settings.language': 'Language', 'settings.book': 'Address book', 'settings.notifications': 'Notifications', 'settings.haptics': 'Haptics',
  'settings.support': 'Support', 'settings.help': 'Help', 'settings.terms': 'Terms of Service', 'settings.privacy': 'Privacy',
  'settings.browser': 'Browser', 'settings.passcodeOn': 'Passcode enabled', 'settings.passcodeOff': 'Passcode disabled', 'settings.bioFailed': 'Biometric check failed',

  'lock.keypad': 'Numeric keypad', 'lock.biometric': 'Use biometrics', 'lock.locked': 'Too many attempts. Wait {s}s', 'lock.wrong': 'Wrong passcode',
  'lock.enter': 'Enter passcode', 'lock.reason': 'Confirm your identity', 'lock.confirm': 'Enter passcode', 'lock.create': 'Create a passcode',
  'lock.createSub': 'It protects sign-in and every transaction', 'lock.repeat': 'Repeat the passcode', 'lock.mismatch': 'Passcodes don’t match',
  'lock.change': 'Change passcode', 'lock.disable': 'Turn off passcode',
  'lock.auto.immediate': 'Immediately', 'lock.auto.1m': 'After 1 min', 'lock.auto.5m': 'After 5 min', 'lock.auto.never': 'Never',

  'notify.tx': 'Transactions', 'notify.txSub': 'Sends, receives and swaps', 'notify.price': 'Prices', 'notify.priceSub': 'Big moves in your favourites',
  'notify.news': 'News', 'notify.newsSub': 'Updates and new features', 'notify.foot': 'Notifications are delivered by the bot in Telegram.',

  'book.empty': 'Your address book is empty', 'book.emptySub': 'Save addresses to send funds in a couple of taps.', 'book.add': 'New address', 'book.name': 'Name',
  'book.namePh': 'e.g. Alex', 'book.saved': 'Address saved', 'book.delete': 'Delete address?', 'book.deleteSub': 'The address will be removed from your book. Your funds are not affected.',
  'book.foot': 'Addresses are stored on this device only.',
};

const dict = { ru, en };

export const getLang = () => lang;
export function setLang(l) {
  lang = dict[l] ? l : 'en';
  document.documentElement.lang = lang;
}
export function detectLang(preferred) {
  const cand = (preferred || navigator.language || 'ru').slice(0, 2).toLowerCase();
  return dict[cand] ? cand : cand === 'uk' || cand === 'be' || cand === 'kk' ? 'ru' : 'en';
}

export function t(key, vars) {
  let s = dict[lang][key] ?? dict.en[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
  return s;
}

export const LANG_KEYS = { ru: Object.keys(ru), en: Object.keys(en) };
