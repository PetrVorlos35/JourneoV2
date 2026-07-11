import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import JourneoLogo from '../assets/Journeo_whitelogo.png';
import JourneoLogoDark from '../assets/Journeo_blacklogo.png';
import LandingLanguageSwitcher from './LandingLanguageSwitcher';

const Navbar = ({ variant = 'dark' }) => {
  const { t } = useTranslation();
  const isLight = variant === 'light';

  return (
    <nav
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-3xl rounded-full backdrop-blur-[40px] saturate-[1.8] border px-2 py-2 ${
        isLight
          ? 'bg-white/70 border-gray-200/70 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
          : 'bg-[#1d1d1f]/70 border-white/10 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 pl-4 group">
          <img
            src={isLight ? JourneoLogoDark : JourneoLogo}
            alt="Journeo Logo"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <span className={`font-semibold text-lg tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Journeo
          </span>
        </Link>
        <div className="pr-1 flex items-center gap-2 sm:gap-3">
          <LandingLanguageSwitcher isDark={!isLight} />
          {isLight ? (
            <>
              <Link
                to="/auth"
                className="hidden sm:inline-block text-[13px] font-semibold text-gray-600 hover:text-gray-900 px-3 py-2.5 rounded-full transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/auth"
                state={{ mode: 'register' }}
                className="inline-block text-[13px] font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 active:scale-[0.97] transition-all duration-300 shadow-md shadow-blue-600/25"
              >
                {t('nav.getStarted')}
              </Link>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-block text-[13px] font-medium bg-white text-black px-5 py-2.5 rounded-full hover:scale-105 transition-transform duration-300 shadow-lg"
            >
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
