// Kurzy ECB přes frankfurter.dev. Výdaj si kurz uloží při zadání a dál se
// nemění, takže se sem chodí jen při novém výdaji, změně měny výletu
// a pro souhrny napříč výlety. Odpovědi drží krátká paměť v procesu.

// Měny, které ECB denně vyhlašuje (frankfurter.dev/v1/currencies).
export const SUPPORTED_CURRENCIES = [
  'CZK', 'EUR', 'USD', 'GBP', 'PLN', 'HUF', 'CHF', 'RON', 'DKK', 'SEK', 'NOK', 'ISK',
  'TRY', 'ILS', 'JPY', 'CNY', 'HKD', 'KRW', 'SGD', 'THB', 'MYR', 'IDR', 'PHP', 'INR',
  'AUD', 'NZD', 'CAD', 'MXN', 'BRL', 'ZAR',
];

export const isSupportedCurrency = (code) => SUPPORTED_CURRENCIES.includes(code);

const API = 'https://api.frankfurter.dev/v1';
const LATEST_TTL_MS = 60 * 60 * 1000;
const cache = new Map();

const todayIso = () => new Date().toISOString().slice(0, 10);

const fetchJson = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Frankfurter HTTP ${r.status}`);
  return r.json();
};

/**
 * Kurz from → to k danému dni (YYYY-MM-DD). Budoucí nebo chybějící datum
 * bere poslední vyhlášený kurz; o víkendu ECB vrátí poslední pracovní den.
 * @returns {Promise<{rate:number, date:string}>}
 */
export const getRate = async (from, to, date = null) => {
  if (from === to) return { rate: 1, date: date || todayIso() };

  const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && date < todayIso() ? date : 'latest';
  const key = `${from}:${to}:${day}`;
  const cached = cache.get(key);
  // Historický kurz se už nezmění, poslední jen hodinu.
  if (cached && (day !== 'latest' || Date.now() - cached.at < LATEST_TTL_MS)) return cached.value;

  const data = await fetchJson(`${API}/${day}?base=${from}&symbols=${to}`);
  const rate = data?.rates?.[to];
  if (typeof rate !== 'number' || !(rate > 0)) throw new Error('Kurz chybí v odpovědi');
  const value = { rate, date: data.date || todayIso() };
  cache.set(key, { value, at: Date.now() });
  return value;
};

/**
 * Poslední kurzy všech podporovaných měn vůči `base` ({EUR: 0.041, …}),
 * pro přepočet souhrnů napříč výlety do hlavní měny uživatele.
 */
export const getLatestRates = async (base) => {
  const key = `all:${base}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < LATEST_TTL_MS) return cached.value;

  const data = await fetchJson(`${API}/latest?base=${base}`);
  const rates = { ...(data?.rates || {}), [base]: 1 };
  cache.set(key, { value: rates, at: Date.now() });
  return rates;
};

/**
 * Převodník částek do `base` pro souhrny. Když kurzy nejdou načíst, vrátí
 * null u cizích měn — volající je ze souhrnu vynechá, místo aby sčítal
 * koruny s eury.
 */
export const makeConverter = async (base, currencies) => {
  const foreign = [...new Set(currencies)].filter((c) => c && c !== base);
  if (foreign.length === 0) return (amount) => amount;
  let rates = null;
  try {
    rates = await getLatestRates(base);
  } catch (err) {
    console.error('Latest rates fetch error:', err);
  }
  return (amount, currency) => {
    if (!currency || currency === base) return amount;
    const r = rates?.[currency];
    return r ? amount / r : null;
  };
};

/** Hlavní měna uživatele z nastavení (výchozí měna nových výletů a souhrnů). */
export const getUserCurrency = async (db, userId) => {
  const [[row]] = await db.query('SELECT currency FROM user_settings WHERE user_id = ?', [userId]);
  return isSupportedCurrency(row?.currency) ? row.currency : 'CZK';
};
