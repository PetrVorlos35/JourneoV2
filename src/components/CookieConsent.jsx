import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isTrackingEnabled, setTrackingEnabled } from '../utils/analytics';
import {
  getConsent,
  saveConsent,
  loadMarketingScripts,
  OPEN_SETTINGS_EVENT,
} from '../utils/consent';

const Toggle = ({ checked, onChange, disabled, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange?.(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
      checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-[22px]' : 'translate-x-0.5'
      }`}
    />
  </button>
);

const CookieConsent = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(() => getConsent() === null);
  const [showSettings, setShowSettings] = useState(false);
  const [marketing, setMarketing] = useState(() => getConsent()?.marketing ?? false);
  // Měření je bez cookies a bez souhlasu (oprávněný zájem), jde ale vypnout.
  const [measurement, setMeasurement] = useState(isTrackingEnabled);

  // Souhlas z minulé návštěvy → načíst skripty hned.
  useEffect(() => {
    if (getConsent()?.marketing) loadMarketingScripts();
  }, []);

  // Odkaz „Nastavení cookies“ (patička, zásady) lištu znovu otevře.
  useEffect(() => {
    const handler = () => {
      setMarketing(getConsent()?.marketing ?? false);
      setMeasurement(isTrackingEnabled());
      setShowSettings(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, handler);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, handler);
  }, []);

  const commit = (allowMarketing) => {
    const hadMarketing = getConsent()?.marketing ?? false;
    saveConsent({ marketing: allowMarketing });
    setTrackingEnabled(measurement);
    setOpen(false);
    setShowSettings(false);
    if (allowMarketing) {
      loadMarketingScripts();
    } else if (hadMarketing) {
      // Už načtený skript nejde „odnačíst“ — odvolání souhlasu = reload.
      window.location.reload();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed z-[9000] inset-x-3 bottom-3 sm:inset-x-auto sm:left-6 sm:bottom-6 sm:w-[420px] pb-[env(safe-area-inset-bottom)]"
        >
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl shadow-2xl shadow-black/10 p-5 text-gray-900 dark:text-white">
            <div className="flex items-center gap-2.5 mb-2">
              <Cookie size={18} className="text-blue-600" strokeWidth={2.25} />
              <h2 id="cookie-consent-title" className="font-semibold text-[15px]">
                {t('cookies.title')}
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('cookies.text')}{' '}
              <Link to="/privacy" className="text-blue-600 hover:underline font-medium">
                {t('cookies.policyLink')}
              </Link>
            </p>

            {showSettings && (
              <div className="mt-4 space-y-3">
                <div className="flex items-start justify-between gap-4 rounded-xl bg-gray-50 dark:bg-white/5 p-3">
                  <div>
                    <p className="text-sm font-medium">{t('cookies.necessary.title')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {t('cookies.necessary.desc')}
                    </p>
                  </div>
                  <Toggle checked disabled label={t('cookies.necessary.title')} />
                </div>
                <div className="flex items-start justify-between gap-4 rounded-xl bg-gray-50 dark:bg-white/5 p-3">
                  <div>
                    <p className="text-sm font-medium">{t('cookies.measurement.title')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {t('cookies.measurement.desc')}
                    </p>
                  </div>
                  <Toggle checked={measurement} onChange={setMeasurement} label={t('cookies.measurement.title')} />
                </div>
                <div className="flex items-start justify-between gap-4 rounded-xl bg-gray-50 dark:bg-white/5 p-3">
                  <div>
                    <p className="text-sm font-medium">{t('cookies.marketing.title')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {t('cookies.marketing.desc')}
                    </p>
                  </div>
                  <Toggle checked={marketing} onChange={setMarketing} label={t('cookies.marketing.title')} />
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              {showSettings ? (
                <>
                  <button
                    type="button"
                    onClick={() => commit(false)}
                    className="h-10 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 transition-colors"
                  >
                    {t('cookies.rejectAll')}
                  </button>
                  <button
                    type="button"
                    onClick={() => commit(marketing)}
                    className="h-10 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    {t('cookies.save')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => commit(false)}
                    className="h-10 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 transition-colors"
                  >
                    {t('cookies.rejectAll')}
                  </button>
                  <button
                    type="button"
                    onClick={() => commit(true)}
                    className="h-10 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    {t('cookies.acceptAll')}
                  </button>
                </>
              )}
            </div>
            {!showSettings && (
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="mt-2 w-full text-center text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors py-1"
              >
                {t('cookies.customize')}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CookieConsent;
