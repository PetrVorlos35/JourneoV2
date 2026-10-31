import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check, RotateCcw } from 'lucide-react';
import { AdminErrorsSkeleton } from '../ui/Skeletons';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Badge, displayName } from './adminUi';
import { Card, Segmented, relativeTime } from './analyticsUi';

// Chyby z prohlížeče i ze serveru (app_errors), seskupené podle otisku.
// Vyřešená chyba se sama znovu otevře, když se objeví znovu.
const ErrorRow = ({ err, onToggle, t, locale }) => {
  const [open, setOpen] = useState(false);
  return (
    <li className="py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-start gap-3 text-left cursor-pointer group"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge tone={err.source === 'server' ? 'amber' : 'gray'}>{t(`admin.errors.source.${err.source}`)}</Badge>
            {err.path && <span className="text-[12px] font-medium text-muted truncate">{err.method ? `${err.method} ` : ''}{err.path}</span>}
          </span>
          <span className="mt-1 block text-[14px] font-semibold text-primary break-words group-hover:underline underline-offset-2">{err.message}</span>
          <span className="mt-0.5 block text-[12px] font-medium text-muted tabular-nums">
            {t('admin.errors.occurrences', { count: err.count })}
            {err.usersAffected > 0 && ` · ${t('admin.errors.usersAffected', { count: err.usersAffected })}`}
            {` · ${t('admin.errors.lastSeen', { when: relativeTime(err.lastSeen, locale) })}`}
          </span>
        </span>
        <ChevronDown size={18} className={`shrink-0 mt-1 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
            <div><dt className="inline text-muted">{t('admin.errors.firstSeen')}: </dt><dd className="inline font-medium text-primary">{new Date(err.firstSeen).toLocaleString(locale)}</dd></div>
            <div><dt className="inline text-muted">{t('admin.errors.lastSeenAt')}: </dt><dd className="inline font-medium text-primary">{new Date(err.lastSeen).toLocaleString(locale)}</dd></div>
            {err.lastUser && (
              <div><dt className="inline text-muted">{t('admin.errors.lastUser')}: </dt><dd className="inline">
                <Link to={`/dashboard/admin/users?user=${err.lastUser.id}`} className="font-semibold text-active hover:underline underline-offset-2">
                  {displayName(err.lastUser, err.lastUser.email)}
                </Link>
              </dd></div>
            )}
            {err.userAgent && <div className="sm:col-span-2"><dt className="inline text-muted">{t('admin.errors.browser')}: </dt><dd className="inline font-medium text-secondary break-all">{err.userAgent}</dd></div>}
          </dl>
          {err.stack && (
            <pre className="max-h-72 overflow-auto rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-subtle p-3 text-[12px] leading-relaxed text-secondary whitespace-pre-wrap break-all">{err.stack}</pre>
          )}
          <button
            type="button"
            onClick={() => onToggle(err)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-subtle hover:bg-recess text-[14px] font-semibold text-primary transition-colors cursor-pointer"
          >
            {err.resolvedAt
              ? <><RotateCcw size={15} strokeWidth={2.25} aria-hidden="true" /> {t('admin.errors.reopen')}</>
              : <><Check size={15} strokeWidth={2.5} aria-hidden="true" /> {t('admin.errors.resolve')}</>}
          </button>
        </div>
      )}
    </li>
  );
};

const AdminErrors = () => {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState('open');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.admin.errors(status)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (err) => {
    const resolve = !err.resolvedAt;
    try {
      await api.admin.resolveError(err.id, resolve);
      setData((d) => ({
        ...d,
        open: Math.max(0, d.open + (resolve ? -1 : 1)),
        errors: d.errors.filter((e) => e.id !== err.id),
      }));
      toast.success(resolve ? t('admin.errors.resolved') : t('admin.errors.reopened'));
    } catch {
      toast.error(t('admin.errors.updateError'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-muted max-w-[60ch]">{t('admin.errors.intro')}</p>
        <Segmented
          label={t('admin.errors.title')}
          value={status}
          onChange={setStatus}
          options={[
            { value: 'open', label: t('admin.errors.open') + (data?.open ? ` · ${data.open}` : '') },
            { value: 'resolved', label: t('admin.errors.resolvedTab') },
          ]}
        />
      </div>

      {loading && !data ? <AdminErrorsSkeleton /> : (
      <Card
        title={status === 'open' ? t('admin.errors.openTitle') : t('admin.errors.resolvedTitle')}
        aside={data && status === 'open' ? t('admin.errors.last24h', { count: data.last24h }) : null}
      >
        {!data ? (
          <p className="py-6 text-center text-muted">{t('admin.dashboard.loadError')}</p>
        ) : data.errors.length === 0 ? (
          <p className="py-6 text-[15px] font-medium text-muted">{status === 'open' ? t('admin.errors.emptyOpen') : t('admin.errors.emptyResolved')}</p>
        ) : (
          <ul className={`divide-y divide-gray-100 dark:divide-white/[0.06] ${loading ? 'opacity-60' : ''}`}>
            {data.errors.map((err) => <ErrorRow key={err.id} err={err} onToggle={toggle} t={t} locale={i18n.language} />)}
          </ul>
        )}
      </Card>
      )}
    </div>
  );
};

export default AdminErrors;
