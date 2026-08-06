export const CURRENCY_SYMBOLS = { CZK: 'Kč', EUR: '€', USD: '$', GBP: '£' };

export const currencySymbol = (currency) => CURRENCY_SYMBOLS[currency] || currency;

/** "1 240 Kč" — grouped by the active locale, symbol after the number. */
export const formatCurrency = (amount, currency, locale = 'en') =>
  `${Number(amount || 0).toLocaleString(locale)} ${currencySymbol(currency)}`;

/**
 * Same, but rounded to whole units — for tiles where the exact halalas of a
 * cross-trip total are noise and the width is tight.
 */
export const formatCurrencyShort = (amount, currency, locale = 'en') =>
  `${Math.round(Number(amount || 0)).toLocaleString(locale)} ${currencySymbol(currency)}`;

export default formatCurrency;
