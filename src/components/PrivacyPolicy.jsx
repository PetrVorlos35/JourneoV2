import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import useForceLightTheme from '../hooks/useForceLightTheme';
import { openCookieSettings } from '../utils/consent';

const PrivacyPolicy = () => {
  useForceLightTheme();
  const { t } = useTranslation();

  const sections = [
    t('privacyPolicy.section1', { returnObjects: true }),
    t('privacyPolicy.section2', { returnObjects: true }),
    t('privacyPolicy.section3', { returnObjects: true }),
    t('privacyPolicy.section4', { returnObjects: true }),
    t('privacyPolicy.section5', { returnObjects: true }),
    t('privacyPolicy.section6', { returnObjects: true }),
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-gray-900 font-sans selection:bg-blue-500/30 pb-20">
      <Navbar variant="light" />
      <div className="max-w-3xl mx-auto px-6 pt-32">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> {t('privacyPolicy.back')}
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-gray-900">
          {t('privacyPolicy.title')}
        </h1>
        <div className="space-y-6 text-gray-600 leading-relaxed">
          <p>{t('privacyPolicy.effectiveDate')}</p>
          {sections.map((section, i) => (
            <React.Fragment key={i}>
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{section.title}</h2>
              <p>{section.content}</p>
              {section.cookieSettings && (
                <button
                  type="button"
                  onClick={openCookieSettings}
                  className="inline-flex items-center h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  {t('cookies.openSettings')}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
