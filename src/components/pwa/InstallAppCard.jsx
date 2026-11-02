import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ArrowRight } from 'lucide-react';
import usePwaInstall from '../../hooks/usePwaInstall';
import { dismissCard, isCardDismissed, isMobileDevice, startInstall, visitCount } from '../../utils/pwaInstall';
import { track } from '../../utils/analytics';
import { useAuth } from '../../contexts/AuthContext';

// Nabídka „Přidej si Journeo na plochu“ na přehledu. Jen na telefonu, až když
// má člověk výlet nebo se vrací (ne hned po příchodu), a po zavření 14 dní ne.
const InstallAppCard = ({ hasTrips }) => {
  const { t } = useTranslation();
  const mode = usePwaInstall();
  const { isGuest } = useAuth();
  const shownRef = useRef(false);

  const visible =
    !isGuest &&
    isMobileDevice() &&
    ['prompt', 'ios', 'android', 'inapp'].includes(mode) &&
    !isCardDismissed() &&
    (hasTrips || visitCount() >= 2);

  useEffect(() => {
    if (visible && !shownRef.current) {
      shownRef.current = true;
      track('pwa_prompt_shown', { mode, placement: 'overview' });
    }
  }, [visible, mode]);

  if (!visible) return null;

  return (
    <section
      aria-labelledby="install-card-title"
      className="relative flex items-center gap-4 p-4 sm:p-5 pr-12 rounded-[1.5rem] bg-page border border-gray-200/80 dark:border-white/10 shadow-card"
    >
      <img src="/icons/apple-touch-icon.png" alt="" className="w-12 h-12 shrink-0 rounded-[0.9rem]" />
      <div className="min-w-0 flex-1">
        <h2 id="install-card-title" className="text-[15px] font-bold text-primary">{t('pwa.card.title')}</h2>
        <p className="mt-0.5 text-[13px] font-medium text-muted">{t('pwa.card.text')}</p>
        <button
          type="button"
          onClick={() => startInstall('overview')}
          className="mt-2.5 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold transition-colors cursor-pointer"
        >
          {mode === 'inapp' ? t('pwa.card.ctaInApp') : t('pwa.card.cta')}
          <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        onClick={dismissCard}
        aria-label={t('pwa.card.dismiss')}
        className="absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-subtle transition-colors cursor-pointer"
      >
        <X size={17} strokeWidth={2.25} />
      </button>
    </section>
  );
};

export default InstallAppCard;
