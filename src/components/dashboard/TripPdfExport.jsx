import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import JourneoLogo from '../../assets/Journeo_blacklogo.png';

const CURRENCY_SYMBOLS = { CZK: 'Kč', EUR: '€', USD: '$', GBP: '£' };

const CATEGORY_COLORS = {
  transport: '#3b82f6',
  accommodation: '#a855f7',
  food: '#f97316',
  activities: '#10b981',
  other: '#6b7280',
};

const memberName = (m) => {
  if (!m) return '—';
  const name = [m.firstName, m.lastName].filter(Boolean).join(' ').trim();
  return name || m.email || '—';
};

// Print-only snapshot of the whole trip (itinerary, packing, links, budget).
// Mounted on demand: fetches balances for member names, waits for fonts,
// opens the browser print dialog, and unmounts itself once printing is done.
// The visual layer lives in index.css under "Trip PDF Export".
const TripPdfExport = ({ trip, dailyPlans, packingList, documents, sections, onDone }) => {
  const { t, i18n } = useTranslation();
  const { currency } = useCurrency();
  const { user } = useAuth();
  const [balanceData, setBalanceData] = useState(null);
  const [ready, setReady] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;
  const currSymbol = CURRENCY_SYMBOLS[currency] || currency;
  const money = (amount) => `${(amount ?? 0).toLocaleString(i18n.language)} ${currSymbol}`;

  useEffect(() => {
    if (!sections.budget) { setReady(true); return; }
    let cancelled = false;
    api.trips.getBalances(trip.id)
      .then((data) => { if (!cancelled) setBalanceData(data); })
      .catch(() => { /* balances are optional in the PDF */ })
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [trip.id, sections.budget]);

  useEffect(() => {
    if (!ready) return;
    document.body.classList.add('printing-trip');
    const handleAfterPrint = () => onDoneRef.current?.();
    window.addEventListener('afterprint', handleAfterPrint);
    // Give the portal a paint and wait for webfonts so the first page is crisp.
    const timer = setTimeout(() => {
      (document.fonts?.ready || Promise.resolve()).then(() => window.print());
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('printing-trip');
    };
  }, [ready]);

  if (!ready) return null;

  const showItinerary = sections.itinerary && dailyPlans.length > 0;
  const showPacking = sections.packing && packingList.length > 0;
  const showDocuments = sections.documents && documents.length > 0;

  const expenses = [...(trip.expenses || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const target = trip.budgetTarget || 0;
  const showBudget = sections.budget && (expenses.length > 0 || target > 0);
  const stops = [...new Set(dailyPlans.map((d) => d.location?.trim()).filter(Boolean))];
  const packedCount = packingList.filter((i) => i.checked).length;

  const members = balanceData?.members || [];
  const balances = balanceData?.balances || [];
  const settlements = balanceData?.settlements || [];
  const memberById = (id) => members.find((m) => Number(m.id) === Number(id));
  const label = (id) =>
    Number(id) === Number(user?.id) ? t('budget.balances.you') : memberName(memberById(id));
  const hasShared = expenses.some((e) => (e.splits || []).length > 0);
  const showBalances = members.length > 1 && hasShared && balances.length > 0;
  const showPaidBy = members.length > 1;

  const byCategory = Object.keys(CATEGORY_COLORS)
    .map((id) => ({
      id,
      amount: expenses.filter((e) => e.category === id).reduce((s, e) => s + e.amount, 0),
      count: expenses.filter((e) => e.category === id).length,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.amount - a.amount);

  // Section numbers computed up front (a mutating counter inside a child
  // component would double-increment under StrictMode).
  const sectionNum = {};
  let n = 0;
  if (showItinerary) sectionNum.itinerary = ++n;
  if (showPacking) sectionNum.packing = ++n;
  if (showDocuments) sectionNum.documents = ++n;
  if (showBudget) sectionNum.budget = ++n;

  const SectionHead = ({ num, title }) => (
    <div className="pp-section-head">
      <span className="pp-section-num">{String(num).padStart(2, '0')}</span>
      <h2 className="pp-section-title">{title}</h2>
      <span className="pp-section-line" />
    </div>
  );

  return createPortal(
    <div className="trip-print-sheet">

      {/* Brand row */}
      <div className="pp-brand">
        <img src={JourneoLogo} alt="" className="pp-brand-logo" />
        <span className="pp-brand-name">Journeo</span>
        <span className="pp-brand-tag">{t('pdf.travelPlan')}</span>
      </div>

      {/* Hero */}
      <div className="pp-hero">
        <span className="pp-hero-script">{t('pdf.signOff')}</span>
        <h1 className="pp-title">{trip.title}</h1>
        <p className="pp-dates">
          {format(new Date(trip.startDate), 'd. M. yyyy')} — {format(new Date(trip.endDate), 'd. M. yyyy')}
        </p>
        <div className="pp-chips">
          <span className="pp-chip"><strong>{dailyPlans.length}</strong> {t('pdf.days')}</span>
          {showItinerary && stops.length > 0 && (
            <span className="pp-chip"><strong>{stops.length}</strong> {t('pdf.stops')}</span>
          )}
          {showBudget && (totalSpent > 0 || target > 0) && (
            <span className="pp-chip pp-chip-blue">
              <strong>{money(totalSpent)}</strong>{target > 0 ? ` / ${money(target)}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Itinerary */}
      {showItinerary && (
        <section className="pp-section">
          <SectionHead num={sectionNum.itinerary} title={t('pdf.itinerary')} />
          {dailyPlans.map((day, i) => (
            <div key={i} className="pp-day">
              <div className="pp-day-rail">
                <span className="pp-day-num">{i + 1}</span>
                <span className="pp-day-dow">{format(new Date(day.date), 'EEE', { locale: dateLocale })}</span>
              </div>
              <div className="pp-day-body">
                <div className="pp-day-head">
                  <span className="pp-day-title">{day.title}</span>
                  <span className="pp-day-date">{format(new Date(day.date), 'd. M. yyyy', { locale: dateLocale })}</span>
                </div>
                {day.location && (
                  <p className="pp-day-loc">
                    <MapPin size={11} strokeWidth={2.5} /> {day.location}
                  </p>
                )}
                {day.plan
                  ? <p className="pp-day-plan">{day.plan}</p>
                  : <p className="pp-day-plan pp-muted-italic">{t('pdf.emptyDay')}</p>}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Packing list */}
      {showPacking && (
        <section className="pp-section">
          <SectionHead num={sectionNum.packing} title={t('pdf.packing')} />
          <p className="pp-subnote">{t('pdf.packed', { done: packedCount, total: packingList.length })}</p>
          <div className="pp-pack-grid">
            {packingList.map((item) => (
              <div key={item.id} className="pp-pack-item">
                <span className={`pp-checkbox${item.checked ? ' pp-checkbox-checked' : ''}`}>
                  {item.checked ? '✓' : ''}
                </span>
                <span className={item.checked ? 'pp-pack-done' : ''}>{item.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Links & notes */}
      {showDocuments && (
        <section className="pp-section">
          <SectionHead num={sectionNum.documents} title={t('pdf.documents')} />
          {documents.map((doc) => {
            const isUrl = doc.content.startsWith('http://') || doc.content.startsWith('https://');
            return (
              <div key={doc.id} className="pp-doc">
                <p className="pp-doc-title">{doc.title}</p>
                {isUrl
                  ? <p className="pp-doc-url">{doc.content}</p>
                  : <p className="pp-doc-note">{doc.content}</p>}
              </div>
            );
          })}
        </section>
      )}

      {/* Budget */}
      {showBudget && (
        <section className="pp-section">
          <SectionHead num={sectionNum.budget} title={t('pdf.budget')} />

          <div className="pp-budget-summary">
            <div>
              <p className="pp-budget-label">{t('pdf.spent')}</p>
              <p className="pp-budget-total">{money(totalSpent)}</p>
              {target > 0 && <p className="pp-budget-target">{t('pdf.target', { amount: money(target) })}</p>}
            </div>
            {target > 0 && (
              <div className={`pp-progress${totalSpent > target ? ' pp-progress-over' : ''}`}>
                <div
                  className="pp-progress-fill"
                  style={{ width: `${Math.min((totalSpent / target) * 100, 100)}%` }}
                >
                  {byCategory.map((c) => (
                    <span
                      key={c.id}
                      className="pp-progress-seg"
                      style={{ flexGrow: c.amount, backgroundColor: CATEGORY_COLORS[c.id] }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {byCategory.length > 0 && (
            <div className="pp-cats">
              {byCategory.map((c) => (
                <div key={c.id} className="pp-cat-row">
                  <span className="pp-cat-dot" style={{ backgroundColor: CATEGORY_COLORS[c.id] }} />
                  <span className="pp-cat-name">{t(`budget.categories.${c.id}`)}</span>
                  <span className="pp-cat-count">×{c.count}</span>
                  <span className="pp-cat-amount">{money(c.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {expenses.length > 0 && (
            <table className="pp-table">
              <thead>
                <tr>
                  <th>{t('pdf.colDate')}</th>
                  <th>{t('pdf.colDescription')}</th>
                  <th>{t('pdf.colCategory')}</th>
                  {showPaidBy && <th>{t('pdf.colPaidBy')}</th>}
                  <th className="pp-right">{t('pdf.colAmount')}</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="pp-nowrap">{e.date ? format(parseISO(e.date), 'd. M. yyyy') : '—'}</td>
                    <td className="pp-strong">{e.description}</td>
                    <td>
                      <span className="pp-cat-dot pp-cat-dot-sm" style={{ backgroundColor: CATEGORY_COLORS[e.category] || CATEGORY_COLORS.other }} />
                      {t(`budget.categories.${e.category}`)}
                    </td>
                    {showPaidBy && <td>{e.paidBy ? label(e.paidBy) : '—'}</td>}
                    <td className="pp-right pp-strong pp-nowrap">{money(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={showPaidBy ? 4 : 3}>{t('pdf.total')}</td>
                  <td className="pp-right pp-nowrap">{money(totalSpent)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          {showBalances && (
            <div className="pp-balances">
              <p className="pp-subhead">{t('pdf.balances')}</p>
              {balances.map((b) => {
                const settled = Math.round(b.net * 100) === 0;
                const positive = b.net > 0;
                return (
                  <div key={b.userId} className="pp-balance-row">
                    <span className="pp-strong">{label(b.userId)}</span>
                    <span className="pp-balance-label">
                      {settled
                        ? t('budget.balances.settledUp')
                        : positive ? t('budget.balances.getsBack') : t('budget.balances.owes')}
                    </span>
                    <span className={`pp-balance-amount ${settled ? 'pp-muted' : positive ? 'pp-green' : 'pp-red'}`}>
                      {settled ? '—' : money(Math.abs(b.net))}
                    </span>
                  </div>
                );
              })}
              {settlements.length > 0 && (
                <>
                  <p className="pp-subhead">{t('pdf.toSettle')}</p>
                  {settlements.map((s, i) => (
                    <div key={i} className="pp-settle-row">
                      <span>{label(s.from)}</span>
                      <span className="pp-settle-arrow">→</span>
                      <span>{label(s.to)}</span>
                      <span className="pp-settle-amount">{money(s.amount)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <div className="pp-footer">
        <span className="pp-footer-script">{t('pdf.signOff')}</span>
        <div className="pp-footer-meta">
          <span>{t('pdf.generatedWith')} · journeo.vorlos.eu</span>
          <span>{t('pdf.generatedOn', { date: format(new Date(), 'd. M. yyyy') })}</span>
        </div>
      </div>

    </div>,
    document.body
  );
};

export default TripPdfExport;
