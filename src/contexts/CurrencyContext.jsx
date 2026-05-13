import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('journeo_currency') || 'CZK';
  });

  // Load currency from API when user is logged in
  useEffect(() => {
    const token = localStorage.getItem('journeo_token');
    if (token) {
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
  }, []);

  const setCurrency = (newCurrency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('journeo_currency', newCurrency);

    // Persist to API if logged in
    const token = localStorage.getItem('journeo_token');
    if (token) {
      api.settings.update({ currency: newCurrency }).catch(() => {});
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
