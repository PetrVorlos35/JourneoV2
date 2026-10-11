import { useTranslation } from 'react-i18next';

// Přepínač ukazuje jen budoucí stav: na české stránce „en“, na anglické „cs“.
// Popisek je v cílovém jazyce, aby mu rozuměl ten, kdo přepnout chce.
const TARGETS = {
  cs: { code: 'en', label: 'Switch to English' },
  en: { code: 'cs', label: 'Přepnout do češtiny' },
};

const LandingLanguageSwitcher = ({ isDark = true }) => {
  const { i18n } = useTranslation();
  const current = i18n.language?.slice(0, 2) === 'en' ? 'en' : 'cs';
  const target = TARGETS[current];

  const handleSwitch = () => {
    i18n.changeLanguage(target.code);
    localStorage.setItem('journeo_lang', target.code);
  };

  const colorClass = isDark ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-900';

  return (
    <button
      type="button"
      onClick={handleSwitch}
      lang={target.code}
      aria-label={target.label}
      title={target.label}
      className={`min-w-11 min-h-11 px-2 inline-flex items-center justify-center rounded-lg text-[11px] font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${colorClass}`}
    >
      {target.code}
    </button>
  );
};

export default LandingLanguageSwitcher;
