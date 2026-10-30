import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CurrencyContext = createContext();

// `currency` je hlavní měna uživatele: v ní se zakládají nové výlety a počítají
// souhrny napříč výlety. Částky jednotlivých výletů jsou v měně výletu.
export const CurrencyProvider = ({ children }) => {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('journeo_currency') || 'CZK';
  });

  // Load currency from API whenever a user signs in
  useEffect(() => {
    if (user?.id) {
      api.settings.get()
        .then(data => {
          if (data.settings?.currency) {
            setCurrencyState(data.settings.currency);
            localStorage.setItem('journeo_currency', data.settings.currency);
          }
        })
        .catch(() => {
          // Fallback to localStorage value silently
        });
    }
  }, [user?.id]);

  const setCurrency = (newCurrency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('journeo_currency', newCurrency);

    // Persist to API if logged in
    const token = localStorage.getItem('journeo_token');
    if (token) {
      api.settings.update({ currency: newCurrency }).catch(() => {});
    }
  };

  // Kurzy pro souhrny se stahují jen tehdy, když má někdo výlet v jiné
  // měně, a jednou za relaci (server je navíc drží hodinu v paměti).
  const [rates, setRates] = useState(null);
  const requestedRef = useRef(null);
  const loadRates = useCallback(() => {
    if (requestedRef.current === currency) return;
    requestedRef.current = currency;
    api.settings.getExchangeRates(currency)
      .then((data) => setRates({ base: data.base, rates: data.rates }))
      .catch(() => { requestedRef.current = null; });
  }, [currency]);

  /** Částka v hlavní měně; null, dokud kurz není (souhrn ji pak vynechá). */
  const toMain = useCallback((amount, from) => {
    if (!from || from === currency) return amount;
    if (rates?.base !== currency) return null;
    const rate = rates.rates?.[from];
    return rate ? amount / rate : null;
  }, [currency, rates]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, toMain, loadRates }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

/**
 * Hlavní měna + převodník pro souhrny přes výlety v různých měnách.
 * Kurzy si vyžádá, jen když některá z `currencies` není hlavní.
 */
export const useMainCurrency = (currencies = []) => {
  const ctx = useContext(CurrencyContext);
  const needsRates = currencies.some((c) => c && c !== ctx.currency);
  const { loadRates } = ctx;
  useEffect(() => {
    if (needsRates) loadRates();
  }, [needsRates, loadRates]);
  return ctx;
};

/** Součet útraty výletů v hlavní měně (výlety bez kurzu se vynechají). */
export const sumInMain = (trips, toMain, spendOf) =>
  trips.reduce((sum, trip) => sum + (toMain(spendOf(trip), trip.currency) ?? 0), 0);
