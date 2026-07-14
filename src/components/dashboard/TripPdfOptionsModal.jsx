import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileDown, Layout, PackageOpen, Link as LinkIcon, Wallet, Check } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const SECTION_META = [
  { id: 'itinerary', Icon: Layout },
  { id: 'packing', Icon: PackageOpen },
  { id: 'documents', Icon: LinkIcon },
  { id: 'budget', Icon: Wallet },
];

// Lets the user pick which sections to include before TripPdfExport renders
// the print sheet. Sections with no content aren't offered at all.
const TripPdfOptionsModal = ({ isOpen, onClose, availability, counts, onConfirm }) => {
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const [selected, setSelected] = useState({});

  const availableSections = SECTION_META.filter((s) => availability[s.id]);

  useEffect(() => {
    if (isOpen) {
      setSelected(Object.fromEntries(availableSections.map((s) => [s.id, true])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const toggle = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const anySelected = Object.values(selected).some(Boolean);

  const handleGenerate = () => {
    onConfirm(selected);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-options-title"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: '100%' }}
            transition={shouldReduceMotion ? { duration: 0.2 } : { ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
            className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/10 rounded-t-[2rem] sm:rounded-[2rem] max-h-[85dvh] overflow-y-auto custom-scrollbar p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8 shadow-2xl z-10"
          >
            <div className="flex justify-between items-start gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                  <FileDown size={17} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 id="pdf-options-title" className="font-bold text-xl sm:text-2xl tracking-tight text-gray-900 dark:text-white truncate">
                    {t('pdf.selectTitle')}
                  </h3>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                    {t('pdf.selectSubtitle')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label={t('common.close')}
                className="w-10 h-10 sm:w-9 sm:h-9 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={18} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2 mb-7">
              {availableSections.map(({ id, Icon }) => {
                const isChecked = !!selected[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    aria-pressed={isChecked}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${
                      isChecked
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10'
                        : 'border-transparent bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                      isChecked
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-white/10 text-gray-400 dark:text-gray-500'
                    }`}>
                      <Icon size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[14px] text-gray-900 dark:text-white leading-tight">
                        {t(`pdf.${id}`)}
                      </p>
                      <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                        {counts[id]}
                      </p>
                    </div>
                    <span className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!anySelected}
              className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-colors duration-300 shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FileDown size={18} strokeWidth={2.5} /> {t('pdf.generate')}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default TripPdfOptionsModal;
