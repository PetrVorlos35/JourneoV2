import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CHANGELOG } from '../../config/changelog';

const formatDate = (iso, lng) => {
  try {
    return new Date(iso).toLocaleDateString(lng, { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
};

const ChangelogModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-md cursor-pointer"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="relative w-full max-w-md z-10 flex flex-col bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/10 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden max-h-[85dvh] sm:max-h-[88dvh]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <Sparkles size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-gray-900 dark:text-white font-bold text-lg leading-tight tracking-tight">
                    {t('changelog.title')}
                  </h2>
                  <p className="text-gray-500 dark:text-white/40 text-[12px] font-medium mt-0.5">
                    {t('changelog.subtitle')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/15 transition-all cursor-pointer"
                aria-label={t('common.close')}
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 space-y-8">
              {CHANGELOG.length === 0 && (
                <p className="text-gray-500 dark:text-white/40 text-sm font-medium text-center py-8">
                  {t('changelog.empty')}
                </p>
              )}

              {CHANGELOG.map((release, index) => {
                const base = `changelog.releases.${release.key}`;
                const highlights = t(`${base}.highlights`, { returnObjects: true });
                const isLatest = index === 0;
                return (
                  <div key={release.version} className="relative">
                    {/* Version meta */}
                    <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                      <span className="text-[12px] font-bold tracking-wide px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200/70 dark:border-indigo-400/20 text-indigo-700 dark:text-indigo-200">
                        v{release.version}
                      </span>
                      {isLatest && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                          {t('changelog.current')}
                        </span>
                      )}
                      <span className="text-gray-400 dark:text-white/30 text-[12px] font-medium ml-auto">
                        {formatDate(release.date, i18n.language)}
                      </span>
                    </div>

                    {/* Title + summary */}
                    <h3 className="text-gray-900 dark:text-white font-bold text-[15px] tracking-tight mb-1.5">
                      {t(`${base}.title`)}
                    </h3>
                    <p className="text-gray-500 dark:text-white/45 text-[13px] leading-relaxed mb-4">
                      {t(`${base}.summary`)}
                    </p>

                    {/* Highlights */}
                    {Array.isArray(highlights) && (
                      <ul className="space-y-2.5">
                        {highlights.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                              <Check size={10} strokeWidth={3} />
                            </span>
                            <span className="text-gray-700 dark:text-white/70 text-[13px] leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ChangelogModal;
