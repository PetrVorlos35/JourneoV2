import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import JourneoLogo from '../assets/Journeo_whitelogo.png';
import LandingLanguageSwitcher from './LandingLanguageSwitcher';

const Navbar = () => {
  const { t } = useTranslation();

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-3xl rounded-full bg-[#1d1d1f]/70 backdrop-blur-[40px] saturate-[1.8] border border-white/10 shadow-sm px-2 py-2">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 pl-4 group">
          <img
            src={JourneoLogo}
            alt="Journeo Logo"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-semibold text-lg tracking-tight text-white">Journeo</span>
        </Link>
        <div className="pr-1 flex items-center gap-3">
          <LandingLanguageSwitcher />
          <Link
            to="/auth"
            className="inline-block text-[13px] font-medium bg-white text-black px-5 py-2.5 rounded-full hover:scale-105 transition-transform duration-300 shadow-lg"
          >
            {t('nav.login')}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
