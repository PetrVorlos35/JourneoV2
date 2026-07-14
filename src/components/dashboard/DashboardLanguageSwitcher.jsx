import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LANGS = [
  { code: 'cs', labelKey: 'settings.language.cs' },
  { code: 'en', labelKey: 'settings.language.en' },
];

const DashboardLanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.slice(0, 2) || 'cs';

  const handleSwitch = async (code) => {
    if (code === current) return;
    i18n.changeLanguage(code);
    localStorage.setItem('journeo_lang', code);
    try {
      await api.settings.update({ language: code });
    } catch {
      // Language is already changed locally; DB sync is best-effort
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {LANGS.map(({ code, labelKey }) => (
        <button
          key={code}
          onClick={() => handleSwitch(code)}
          className={`flex items-center justify-center min-h-[44px] py-3 sm:py-4 px-2 rounded-2xl border-2 font-bold transition-colors duration-300 uppercase tracking-widest text-[11px] sm:text-[12px] ${
            current === code
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'
          } cursor-pointer disabled:cursor-not-allowed`}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
};

export default DashboardLanguageSwitcher;
