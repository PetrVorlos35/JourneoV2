import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CHANGELOG } from '../../config/changelog';

const formatDate = (iso, lng, opts = { day: 'numeric', month: 'long', year: 'numeric' }) => {
  try {
    return new Date(iso).toLocaleDateString(lng, opts);
  } catch {
    return iso;
  }
};

/**
 * Release notes: the versions as a rail on the left (a strip on mobile),
 * the selected release on the right. Opens on the newest one.
 */
const ChangelogModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState(CHANGELOG[0]?.key);

  useEffect(() => {
    if (isOpen) setSelected(CHANGELOG[0]?.key);
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const release = CHANGELOG.find((r) => r.key === selected) || CHANGELOG[0];
  const isLatest = release && release.key === CHANGELOG[0].key;
  const base = release ? `changelog.releases.${release.key}` : '';
  const highlights = release ? t(`${base}.highlights`, { returnObjects: true }) : [];

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
            role="dialog"
            aria-modal="true"
            aria-labelledby="changelog-title"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="relative w-full max-w-[880px] z-10 flex flex-col bg-page border border-subtle rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden h-[85dvh] sm:h-[min(680px,88dvh)]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-subtle shrink-0">
              <div className="min-w-0">
                <h2 id="changelog-title" className="text-primary font-bold text-[22px] leading-tight tracking-tight">
                  {t('changelog.title')}
                </h2>
                <p className="text-muted text-[14px] font-medium mt-1">{t('changelog.subtitle')}</p>
              </div>
              <button
                onClick={onClose}
                aria-label={t('common.close')}
                className="w-11 h-11 -mr-2 -mt-1 shrink-0 flex items-center justify-center rounded-2xl text-muted hover:text-primary hover:bg-field transition-colors cursor-pointer"
              >
                <X size={20} strokeWidth={2.25} />
              </button>
            </div>

            {CHANGELOG.length === 0 ? (
              <p className="flex-1 flex items-center justify-center text-muted text-sm font-medium">
                {t('changelog.empty')}
              </p>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col md:flex-row">
                {/* Verze: pás na mobilu, sloupec na desktopu */}
                <nav
                  aria-label={t('changelog.versions')}
                  className="shrink-0 md:w-[260px] border-b md:border-b-0 md:border-r border-subtle bg-field/60 overflow-x-auto md:overflow-x-visible md:overflow-y-auto custom-scrollbar"
                >
                  <ul className="flex md:flex-col gap-1.5 md:gap-1 p-3 md:p-4">
                    {CHANGELOG.map((r, index) => {
                      const active = r.key === release.key;
                      return (
                        <li key={r.key} className="shrink-0">
                          <button
                            onClick={() => setSelected(r.key)}
                            aria-current={active ? 'true' : undefined}
                            className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors cursor-pointer ${
                              active ? 'bg-active' : 'hover:bg-subtle'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`text-[14px] font-bold tabular-nums ${active ? 'text-active' : 'text-primary'}`}>v{r.version}</span>
                              {index === 0 && (
                                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-success-wash text-success">
                                  {t('changelog.current')}
                                </span>
                              )}
                            </span>
                            <span className="hidden md:block text-[13px] font-medium text-secondary mt-0.5 line-clamp-2">
                              {t(`changelog.releases.${r.key}.title`)}
                            </span>
                            <span className="block text-[12px] font-medium text-muted mt-0.5 whitespace-nowrap">
                              {formatDate(r.date, i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Detail vybrané verze */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.article
                      key={release.key}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.08 } }}
                      transition={{ duration: 0.25 }}
                      className="px-6 sm:px-8 pt-6 pb-[max(1.75rem,env(safe-area-inset-bottom))]"
                    >
                      <p className="text-[13px] font-semibold text-muted tabular-nums">
                        {t('changelog.version', { version: release.version })} · {formatDate(release.date, i18n.language)}
                        {isLatest && <span className="text-success"> · {t('changelog.current')}</span>}
                      </p>
                      <h3 className="mt-2 text-primary font-bold text-[26px] sm:text-[30px] leading-tight tracking-tight" style={{ textWrap: 'balance' }}>
                        {t(`${base}.title`)}
                      </h3>
                      <p className="mt-3 text-secondary text-[15px] leading-relaxed max-w-prose" style={{ textWrap: 'pretty' }}>
                        {t(`${base}.summary`)}
                      </p>

                      {Array.isArray(highlights) && highlights.length > 0 && (
                        <>
                          <p className="mt-7 text-[13px] font-semibold text-muted">
                            {t('changelog.highlights')} · <span className="tabular-nums">{highlights.length}</span>
                          </p>
                          <ul className="mt-2 divide-y divide-gray-100 dark:divide-white/5">
                            {highlights.map((item, i) => (
                              <li key={i} className="flex items-start gap-3 py-3">
                                <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-success-wash text-success flex items-center justify-center">
                                  <Check size={12} strokeWidth={3} />
                                </span>
                                <span className="text-primary text-[14px] font-medium leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </motion.article>
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ChangelogModal;
