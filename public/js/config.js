// App-wide constants. Change here, not in components.
export const APP = {
  name: 'Onyx',
  version: '1.0.0',
  supportUrl: 'https://t.me/telegram',
  termsUrl: 'https://telegram.org/tos',
  privacyUrl: 'https://telegram.org/privacy',
  botUsername: '', // e.g. 'OnyxWalletBot' — used for share links
};

export const FIAT = {
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US', digits: 2 },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE', digits: 2 },
  RUB: { symbol: '₽', name: 'Российский рубль', locale: 'ru-RU', digits: 0 },
};

export const LANGS = [
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];

export const RANGES = ['1D', '1W', '1M', '3M', '1Y'];
export const PIN_LENGTH = 4;
