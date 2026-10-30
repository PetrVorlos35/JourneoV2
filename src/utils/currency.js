// Měny, které ECB denně vyhlašuje (stejný seznam jako server/lib/rates.js).
export const CURRENCIES = [
  'CZK', 'EUR', 'USD', 'GBP', 'PLN', 'HUF', 'CHF', 'RON', 'DKK', 'SEK', 'NOK', 'ISK',
  'TRY', 'ILS', 'JPY', 'CNY', 'HKD', 'KRW', 'SGD', 'THB', 'MYR', 'IDR', 'PHP', 'INR',
  'AUD', 'NZD', 'CAD', 'MXN', 'BRL', 'ZAR',
];

// Hlavní měny v Nastavení (výchozí měna nových výletů a souhrnů).
export const MAIN_CURRENCIES = ['CZK', 'EUR', 'USD', 'GBP'];

export const CURRENCY_SYMBOLS = { CZK: 'Kč', EUR: '€', USD: '$', GBP: '£', PLN: 'zł', HUF: 'Ft' };

export const currencySymbol = (currency) => CURRENCY_SYMBOLS[currency] || currency;

/** „Česká koruna“ / „Euro“ v jazyce aplikace; bez Intl.DisplayNames jen kód. */
export const currencyName = (code, locale = 'cs') => {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'currency' }).of(code);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : code;
  } catch {
    return code;
  }
};

/** Měna výletu; starší data bez měny spadnou na hlavní měnu uživatele. */
export const tripCurrency = (trip, fallback = 'CZK') => trip?.currency || fallback;

/** "1 240 Kč" — grouped by the active locale, symbol after the number. */
export const formatCurrency = (amount, currency, locale = 'en') =>
  `${Number(amount || 0).toLocaleString(locale)} ${currencySymbol(currency)}`;

/**
 * Same, but rounded to whole units — for tiles where the exact halalas of a
 * cross-trip total are noise and the width is tight.
 */
export const formatCurrencyShort = (amount, currency, locale = 'en') =>
  `${Math.round(Number(amount || 0)).toLocaleString(locale)} ${currencySymbol(currency)}`;

/** Kurz pro lidi: „1 € = 24,33 Kč“, u slabých měn „100 Ft = 6,52 Kč“. */
export const formatRate = (rate, from, to, locale = 'en') => {
  const unit = rate < 0.1 ? 100 : 1;
  const value = (rate * unit).toLocaleString(locale, { maximumFractionDigits: rate * unit < 10 ? 4 : 2 });
  return `${unit} ${currencySymbol(from)} = ${value} ${currencySymbol(to)}`;
};

export default formatCurrency;
