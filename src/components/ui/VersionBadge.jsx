import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION_LABEL } from '../../config/version';
import { CHANGELOG } from '../../config/changelog';
import ChangelogModal from './ChangelogModal';

// Poslední vydání, které uživatel v modalu Novinky viděl. Klíčuje se na verzi
// z changelogu, ne na APP_VERSION — tečka má svítit přesně tehdy, když je
// v seznamu záznam, který nikdo neotevřel.
const SEEN_KEY = 'journeo_changelog_seen';
const LATEST = CHANGELOG[0]?.version ?? null;

const readSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
};

// Clickable version pill that opens the changelog / "what's new" modal.
// Pass `className` to style the trigger for its surrounding context.
const VersionBadge = ({ className = '' }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // Prázdné úložiště čteme jako „nic neviděl“, takže se tečka po vydání
  // ukáže i lidem, kteří changelog nikdy neotevřeli.
  const [hasNew, setHasNew] = useState(() => LATEST != null && readSeen() !== LATEST);

  // Otevření se počítá jako přečtení — seznam je celý v modalu, takže není
  // co dál sledovat po jednotlivých záznamech.
  const handleOpen = () => {
    setOpen(true);
    setHasNew(false);
    try {
      if (LATEST != null) localStorage.setItem(SEEN_KEY, LATEST);
    } catch {
      // Soukromý režim bez localStorage: tečka se příště objeví znovu.
    }
  };

  const label = hasNew ? `${t('changelog.open')} — ${t('changelog.newBadge')}` : t('changelog.open');

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={label}
        title={label}
        className={`relative cursor-pointer ${className}`}
      >
        {APP_VERSION_LABEL}
        {hasNew && (
          // Prstenec v barvě podkladu odděluje tečku od pilulky pod ní.
          // Informaci nese aria-label tlačítka, takže tečka sama je dekorace.
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#fbfbfd] dark:ring-black"
          />
        )}
      </button>
      <ChangelogModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default VersionBadge;
