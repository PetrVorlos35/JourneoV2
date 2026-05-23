import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('journeo_theme') || 'dark';
  });

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    const resolvedDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', resolvedDark);
    localStorage.setItem('journeo_theme', theme);
  }, [theme]);

  // Listen for system preference changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  // Sync theme with backend (fire-and-forget)
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    // Try to persist to backend, but don't block on it
    const token = localStorage.getItem('journeo_token');
    if (token) {
      api.settings.update({ theme: newTheme }).catch(() => {
        // Silently fail – localStorage is the fallback
      });
    }
  }, []);

  // Load theme from backend on mount (if logged in)
  useEffect(() => {
    const token = localStorage.getItem('journeo_token');
    if (token) {
      api.settings.get()
        .then(data => {
          if (data?.settings?.theme) {
            setThemeState(data.settings.theme);
          }
        })
        .catch(() => {
          // Silently fail – use localStorage value
        });
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
