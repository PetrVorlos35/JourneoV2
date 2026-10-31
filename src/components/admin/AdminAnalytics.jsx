import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { AdminAnalyticsSkeleton, AdminRowsSkeleton } from '../ui/Skeletons';
import api from '../../services/api';
import UserAvatar from '../ui/UserAvatar';
import { avatarUser, displayName } from './adminUi';
import { BarList, Card, Segmented, eventLabel, relativeTime } from './analyticsUi';

// Analytika z vlastních událostí (analytics_events). Barvy grafu stejné
// jako ověřená paleta přehledu: modrá = návštěvníci, jantarová = přihlášení.
const SERIES = [
  { key: 'visitors', bar: 'bg-blue-600 dark:bg-blue-500' },
  { key: 'activeUsers', bar: 'bg-amber-600' },
];

// „mobile · PWA“ → „Mobil · PWA“
const deviceLabel = (t, label) =>
  label.replace(/^(mobile|tablet|desktop)/, (d) => t(`admin.analytics.device.${d}`));

const Delta = ({ current, previous }) => {
  if (!previous) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (!pct) return null;
  return (
    <span className={`ml-2 text-[12px] font-semibold tracking-normal ${pct > 0 ? 'text-success' : 'text-danger'}`}>
      {pct > 0 ? '+' : ''}{pct} %
    </span>
  );
};

const DailyChart = ({ days, t, locale }) => {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...days.flatMap((d) => SERIES.map((s) => d[s.key])));
  const label = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'numeric' });
  const every = Math.ceil(days.length / 8);

  return (
    <div>
      <div className="flex items-center gap-5 text-[13px] font-medium text-secondary">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-sm ${s.bar}`} aria-hidden="true" />
            {t(`admin.analytics.series.${s.key}`)}
          </span>
        ))}
      </div>
      <div className="relative mt-5" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-default" />
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-gray-100 dark:border-white/[0.06]" />
        <span className="absolute -top-2.5 right-0 bg-page pl-1.5 text-[11px] font-medium tabular-nums text-gray-500">{max}</span>
        <div className={`relative h-44 flex items-end ${days.length > 40 ? 'gap-px' : 'gap-1'} border-b border-default`}>
          {days.map((d, i) => (
            <div
              key={d.day}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={`relative flex-1 h-full flex items-end justify-center gap-[2px] rounded-t-md transition-colors ${hover === i ? 'bg-gray-50 dark:bg-white/[0.04]' : ''}`}
            >
              {SERIES.map((s) => (
                <span
                  key={s.key}
                  className={`w-full max-w-[12px] rounded-t-[4px] ${s.bar}`}
                  style={{ height: `${(d[s.key] / max) * 100}%`, minHeight: d[s.key] > 0 ? 3 : 0 }}
                />
              ))}
              {hover === i && (
                <div className={`absolute bottom-full mb-2 z-10 w-max px-3 py-2 rounded-xl bg-ink text-white dark:text-gray-900 text-[12px] shadow-lg pointer-events-none ${
                  i < days.length / 3 ? 'left-0' : i > (days.length * 2) / 3 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                }`}>
                  <p className="font-semibold">{label(d.day)}</p>
                  {[...SERIES.map((s) => s.key), 'pageviews', 'signups'].map((key) => (
                    <p key={key} className="mt-0.5 tabular-nums">
                      {t(`admin.analytics.series.${key}`)}: <span className="font-semibold">{d[key]}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex mt-2">
          {days.map((d, i) => (
            <span key={d.day} className="flex-1 text-center text-[11px] font-medium tabular-nums text-muted whitespace-nowrap">
              {i % every === 0 ? label(d.day) : ''}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{t('admin.analytics.chartTitle')}</caption>
        <thead><tr><th>{t('admin.analytics.day')}</th>{SERIES.map((s) => <th key={s.key}>{t(`admin.analytics.series.${s.key}`)}</th>)}</tr></thead>
        <tbody>{days.map((d) => <tr key={d.day}><td>{label(d.day)}</td>{SERIES.map((s) => <td key={s.key}>{d[s.key]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
};

// Funnel: každý krok jako pruh a podíl vůči prvnímu kroku. Kroky na sebe
// nemusí přesně navazovat (vrátit se může i ten, kdo nikoho nepozval),
// takže podíl z předchozího kroku by mohl přelézt 100 %.
const Funnel = ({ steps, t, group }) => {
  const first = steps[0]?.value || 0;
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const share = i > 0 && first ? Math.round((s.value / first) * 100) : null;
        return (
          <li key={s.key}>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="font-medium text-primary">{t(`admin.analytics.funnel.${group}.${s.key}`)}</span>
              <span className="shrink-0 tabular-nums">
                <span className="font-bold text-primary">{s.value.toLocaleString()}</span>
                {share != null && <span className="ml-2 text-[12px] font-semibold text-muted">{share} %</span>}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                style={{ width: `${first ? Math.max(s.value ? 2 : 0, (s.value / first) * 100) : 0}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
};

const LiveFeed = ({ t, locale }) => {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    api.admin.analyticsLive()
      .then((r) => setEvents(r.events))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <Card
      title={t('admin.analytics.liveTitle')}
      aside={
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-active hover:underline underline-offset-2 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={13} strokeWidth={2.5} aria-hidden="true" />
          {t('admin.analytics.refresh')}
        </button>
      }
    >
      {!events ? (
        <AdminRowsSkeleton rows={8} />
      ) : events.length === 0 ? (
        <p className="py-3 text-[14px] font-medium text-muted">{t('admin.analytics.noEvents')}</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {events.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2.5">
              {e.user ? (
                <Link to={`/dashboard/admin/users?user=${e.user.id}`} className="shrink-0" title={displayName(e.user, e.user.email)}>
                  <UserAvatar user={avatarUser(e.user)} size="sm" />
                </Link>
              ) : (
                <span className="shrink-0 w-8 h-8 rounded-full bg-subtle" title={t('admin.analytics.anonymous')} aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1">
                <span className={`block text-[14px] truncate ${e.name === 'pageview' ? 'font-medium text-secondary' : 'font-semibold text-primary'}`}>
                  {eventLabel(t, e)}
                </span>
                <span className="block text-[12px] font-medium text-muted truncate">
                  {e.user ? displayName(e.user, e.user.email) : t('admin.analytics.anonymous')}
                  {e.device && ` · ${deviceLabel(t, e.device)}${e.standalone ? ' · PWA' : ''}`}
                  {e.country && ` · ${e.country}`}
                  {e.referrer && ` · ${e.referrer}`}
                </span>
              </span>
              <span className="shrink-0 text-[12px] font-medium tabular-nums text-muted">{relativeTime(e.createdAt, locale)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

const AdminAnalytics = () => {
  const { t, i18n } = useTranslation();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    api.admin.analytics(days)
      .then((r) => { if (alive) setData(r.analytics); })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [days]);

  const n = (v) => (v ?? 0).toLocaleString(i18n.language);
  const s = data?.summary;
  const kpis = s ? [
    { key: 'visitors', ...s.visitors },
    { key: 'pageviews', ...s.pageviews },
    { key: 'activeUsers', ...s.activeUsers },
    { key: 'signups', ...s.signups },
    { key: 'trips', ...s.trips },
  ] : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-muted max-w-[60ch]">{t('admin.analytics.intro')}</p>
        <Segmented
          label={t('admin.analytics.range')}
          value={days}
          onChange={setDays}
          options={[7, 30, 90].map((d) => ({ value: d, label: t('admin.analytics.days', { count: d }) }))}
        />
      </div>

      {loading && !data ? (
        <AdminAnalyticsSkeleton />
      ) : error || !data ? (
        <p className="py-20 text-center text-muted">{t('admin.dashboard.loadError')}</p>
      ) : (
        <div className={`space-y-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <Card>
            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-5">
              {kpis.map((k) => (
                <div key={k.key} className="min-w-0 flex flex-col">
                  <dt className="order-last mt-1 text-[13px] font-medium text-secondary">{t(`admin.analytics.kpi.${k.key}`)}</dt>
                  <dd className="text-[26px] font-bold leading-none tracking-tight tabular-nums text-primary">
                    {n(k.current)}
                    <Delta current={k.current} previous={k.previous} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-[12px] font-medium text-muted">{t('admin.analytics.kpiNote')}</p>
          </Card>

          <Card title={t('admin.analytics.chartTitle')} aside={t('admin.analytics.days', { count: days })}>
            <DailyChart days={data.daily} t={t} locale={i18n.language} />
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card title={t('admin.analytics.funnel.visitorsTitle')} aside={t('admin.analytics.funnel.visitorsHint')}>
              <Funnel steps={data.funnel.visitors} t={t} group="visitors" />
            </Card>
            <Card title={t('admin.analytics.funnel.newUsersTitle')} aside={t('admin.analytics.funnel.newUsersHint')}>
              <Funnel steps={data.funnel.newUsers} t={t} group="newUsers" />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card title={t('admin.analytics.featuresTitle')} aside={t('admin.analytics.featuresHint')}>
              {data.events.length === 0 ? (
                <p className="py-3 text-[14px] font-medium text-muted">{t('admin.analytics.noEvents')}</p>
              ) : (
                <table className="w-full text-[14px]">
                  <thead>
                    <tr className="text-left text-[12px] font-semibold text-muted">
                      <th className="pb-2 font-semibold">{t('admin.analytics.action')}</th>
                      <th className="pb-2 font-semibold text-right">{t('admin.analytics.count')}</th>
                      <th className="pb-2 font-semibold text-right">{t('admin.analytics.users')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {data.events.map((e) => (
                      <tr key={e.name}>
                        <td className="py-2 font-medium text-primary">{eventLabel(t, e)}</td>
                        <td className="py-2 text-right tabular-nums font-semibold text-primary">{n(e.count)}</td>
                        <td className="py-2 text-right tabular-nums text-secondary">{n(e.users)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <Card title={t('admin.analytics.pagesTitle')} aside={t('admin.analytics.byVisitors')}>
              <BarList rows={data.pages} empty={t('admin.analytics.noData')} />
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <Card title={t('admin.analytics.referrersTitle')}><BarList rows={data.referrers} empty={t('admin.analytics.noReferrers')} /></Card>
            <Card title={t('admin.analytics.utmTitle')}><BarList rows={data.utm} empty={t('admin.analytics.noData')} /></Card>
            <Card title={t('admin.analytics.devicesTitle')}><BarList rows={data.devices.map((r) => ({ ...r, label: deviceLabel(t, r.label) }))} empty={t('admin.analytics.noData')} /></Card>
            <Card title={t('admin.analytics.countriesTitle')}><BarList rows={data.countries} empty={t('admin.analytics.noData')} /></Card>
          </div>

          <LiveFeed t={t} locale={i18n.language} />
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
