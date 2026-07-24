import { useEffect, useState } from 'react';

// Sleduje skutečně vykreslený motiv, ne nastavení uživatele. ThemeContext
// umí 'system' i dočasný light-lock (useForceLightTheme), takže jediná
// spolehlivá pravda je třída `dark` na <html>.
const isDarkNow = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

export default function useIsDark() {
  const [isDark, setIsDark] = useState(isDarkNow);

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(isDarkNow()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDark(isDarkNow());
    return () => observer.disconnect();
  }, []);

  return isDark;
}
