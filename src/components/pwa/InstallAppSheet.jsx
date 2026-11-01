import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Share, SquarePlus, Check, EllipsisVertical, Copy, Compass } from 'lucide-react';
import toast from 'react-hot-toast';
import { OPEN_INSTALL_EVENT, getInstallMode, inAppBrowser, isIOS } from '../../utils/pwaInstall';

// Návod „Přidat na plochu“ pro zařízení, kde prohlížeč neumí systémový
// dialog: iPhone (přes Sdílet), Android bez dialogu (přes menu) a vestavěné
// prohlížeče sociálních sítí (nejdřív otevřít v Safari / Chrome).

// eslint-disable-next-line no-unused-vars
const Step = ({ n, icon: Icon, title, hint }) => (
  <li className="flex items-start gap-4">
    <span className="shrink-0 w-11 h-11 rounded-2xl bg-subtle flex items-center justify-center text-primary">
      <Icon size={20} strokeWidth={2} aria-hidden="true" />
    </span>
    <span className="min-w-0 pt-0.5">
      <span className="block text-[15px] font-semibold text-primary">
        <span className="tabular-nums text-muted mr-1.5">{n}.</span>{title}
      </span>
      {hint && <span className="block mt-0.5 text-[13px] font-medium text-muted">{hint}</span>}
    </span>
  </li>
);

const InstallAppSheet = () => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('ios');

  useEffect(() => {
    const handler = () => { setMode(getInstallMode()); setOpen(true); };
    window.addEventListener(OPEN_INSTALL_EVENT, handler);
    return () => window.removeEventListener(OPEN_INSTALL_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const app = inAppBrowser();
  const browser = isIOS() ? 'Safari' : 'Chrome';
  const appUrl = `${window.location.origin}/dashboard`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      toast.success(t('pwa.sheet.inapp.copied', { browser }));
    } catch {
      toast.error(t('pwa.sheet.inapp.copyError'));
    }
  };

  const steps = mode === 'android'
    ? [
        { icon: EllipsisVertical, title: t('pwa.sheet.android.step1'), hint: t('pwa.sheet.android.step1Hint') },
        { icon: SquarePlus, title: t('pwa.sheet.android.step2'), hint: t('pwa.sheet.android.step2Hint') },
        { icon: Check, title: t('pwa.sheet.android.step3'), hint: t('pwa.sheet.android.step3Hint') },
      ]
    : mode === 'inapp'
      ? [
          { icon: EllipsisVertical, title: t('pwa.sheet.inapp.step1'), hint: t('pwa.sheet.inapp.step1Hint') },
          { icon: Compass, title: t('pwa.sheet.inapp.step2', { browser }), hint: t('pwa.sheet.inapp.step2Hint') },
          { icon: SquarePlus, title: t('pwa.sheet.inapp.step3'), hint: t('pwa.sheet.inapp.step3Hint') },
        ]
      : [
          { icon: Share, title: t('pwa.sheet.ios.step1'), hint: t('pwa.sheet.ios.step1Hint') },
          { icon: SquarePlus, title: t('pwa.sheet.ios.step2'), hint: t('pwa.sheet.ios.step2Hint') },
          { icon: Check, title: t('pwa.sheet.ios.step3'), hint: t('pwa.sheet.ios.step3Hint') },
        ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-md cursor-pointer"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-sheet-title"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="relative z-10 w-full max-w-md max-h-[90dvh] overflow-y-auto bg-page border border-subtle rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('common.close')}
              className="absolute top-4 right-4 w-10 h-10 bg-subtle rounded-full flex items-center justify-center text-muted hover:text-primary transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            <img src="/icons/apple-touch-icon.png" alt="" className="w-16 h-16 rounded-[1.1rem] shadow-[0_8px_24px_-8px_rgba(21,93,252,0.5)]" />
            <h2 id="install-sheet-title" className="mt-5 text-[22px] font-bold tracking-tight text-primary pr-10">
              {mode === 'inapp' ? t('pwa.sheet.inapp.title', { app: app || t('pwa.sheet.inapp.thisApp') }) : t('pwa.sheet.title')}
            </h2>
            <p className="mt-1.5 text-[15px] font-medium text-secondary">
              {mode === 'inapp' ? t('pwa.sheet.inapp.subtitle', { browser }) : t('pwa.sheet.subtitle')}
            </p>

            <ol className="mt-6 space-y-4">
              {steps.map((s, i) => <Step key={i} n={i + 1} {...s} />)}
            </ol>

            {mode === 'inapp' && (
              <button
                type="button"
                onClick={copyLink}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold transition-colors cursor-pointer"
              >
                <Copy size={16} strokeWidth={2.5} aria-hidden="true" />
                {t('pwa.sheet.inapp.copy')}
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InstallAppSheet;
