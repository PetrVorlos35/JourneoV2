import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION_LABEL } from '../../config/version';
import ChangelogModal from './ChangelogModal';

// Clickable version pill that opens the changelog / "what's new" modal.
// Pass `className` to style the trigger for its surrounding context.
const VersionBadge = ({ className = '' }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('changelog.open')}
        title={t('changelog.open')}
        className={`cursor-pointer ${className}`}
      >
        {APP_VERSION_LABEL}
      </button>
      <ChangelogModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default VersionBadge;
