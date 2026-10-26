import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

/**
 * Prázdný stav stránky, která ožije až s prvním výletem: vlevo co tu
 * uživatel uvidí a jedna akce, vpravo ukázka stránky s daty. Ukázka je
 * vždy označená jako „Ukázka“, aby nepůsobila jako cizí data v účtu.
 */
const EmptyShowcase = ({ title, lead, actions, preview, card = true }) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className={card ? 'glass-card p-6 sm:p-10 rounded-[2rem]' : ''}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] gap-10 lg:gap-14 items-center">
        <div className="max-w-lg">
          <h2 className="text-[24px] sm:text-[30px] font-bold tracking-tight text-primary leading-tight" style={{ textWrap: 'balance' }}>
            {title}
          </h2>
          <p className="mt-3 text-[15px] font-medium text-muted leading-relaxed" style={{ textWrap: 'pretty' }}>
            {lead}
          </p>
          {actions && <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">{actions}</div>}
        </div>
        {preview && <div aria-hidden="true">{preview}</div>}
      </div>
    </motion.div>
  );
};

/** List papíru s druhým listem pod sebou, rámeček pro ukázky. */
export const PreviewPaper = ({ children }) => {
  const { t } = useTranslation();
  return (
    <div className="relative">
      <div className="absolute inset-x-5 -bottom-2.5 top-5 rounded-[1.5rem] bg-page/70 border border-gray-200/70 dark:border-white/5 rotate-[1.5deg]" />
      <div className="relative rounded-[1.5rem] bg-page border border-gray-200/80 dark:border-white/10 shadow-[0_1px_2px_rgba(17,24,39,0.04),0_24px_48px_-24px_rgba(17,24,39,0.18)] p-5 sm:p-6">
        <p className="text-[12px] font-semibold text-muted">{t('emptyStates.sample')}</p>
        {children}
      </div>
    </div>
  );
};

/** Hlavní akce prázdných stavů bez výletu: vede na onboarding na přehledu. */
export const PlanFirstTripButton = () => {
  const { t } = useTranslation();
  return (
    <Link
      to="/dashboard"
      className="group inline-flex items-center gap-2 px-5 min-h-[44px] bg-accent text-white rounded-2xl text-[14px] font-semibold hover:bg-accent-hover shadow-[0_6px_16px_-8px_rgba(37,99,235,0.7)] active:scale-95 transition-all"
    >
      {t('emptyStates.planFirst')}
      <ArrowRight size={16} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
};

export default EmptyShowcase;
