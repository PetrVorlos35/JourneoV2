import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

const LANGS = ['cs', 'en'];

const LandingLanguageSwitcher = ({ isDark = true }) => {
  const { i18n } = useTranslation();
  const current = i18n.language?.slice(0, 2) || 'cs';

  const handleSwitch = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('journeo_lang', code);
  };

  const activeClass   = isDark ? 'text-white'                        : 'text-gray-900';
  const inactiveClass = isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800';
  const sepClass      = isDark ? 'text-white/20'                     : 'text-gray-300';

  return (
    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
      {LANGS.map((code, i) => (
        <Fragment key={code}>
          {i > 0 && <span className={`${sepClass} select-none`}>|</span>}
          <button
            onClick={() => handleSwitch(code)}
            className={`transition-colors duration-200 cursor-pointer ${
              current === code ? activeClass : inactiveClass
            }`}
          >
            {code}
          </button>
        </Fragment>
      ))}
    </div>
  );
};

export default LandingLanguageSwitcher;
