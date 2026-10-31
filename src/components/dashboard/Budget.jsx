import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Trash2, TrendingUp, TrendingDown, Calendar, Car, Home, Utensils,
  Palmtree, MoreHorizontal, ChevronRight, Wallet, X, Search, Pencil, Check, Target,
  Scale, ArrowRight, Split, HandCoins, Copy, CheckCircle2, } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { format, differenceInDays, differenceInCalendarDays, isToday, isYesterday, parseISO, startOfDay, subDays } from 'date-fns';
import { cs } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import toast from 'react-hot-toast';
import { pushUndo, clearUndo } from '../../hooks/undoStack';
import { showUndoToast } from '../ui/undoToast';
import CharCount from '../ui/CharCount';
import { useTranslation } from 'react-i18next';
import { useDialog } from '../ui/DialogModal';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import UserAvatar from '../ui/UserAvatar';
import { formatCurrency, formatRate, currencySymbol } from '../../utils/currency';
import { CurrencyList, TripCurrencyControl, getRecentCurrencies, rememberCurrency } from './CurrencyPicker';
import { PlanFirstTripButton } from './EmptyShowcase';
import { track } from '../../utils/analytics';
import Skeleton from '../ui/Skeleton';

const CATEGORIES = [
  { id: 'transport',      icon: Car,          colorClass: 'bg-blue-500',    lightBgClass: 'bg-active',     textClass: 'text-accent' },
  { id: 'accommodation',  icon: Home,         colorClass: 'bg-purple-500',  lightBgClass: 'bg-purple-50 dark:bg-purple-500/10', textClass: 'text-purple-600 dark:text-purple-400' },
  { id: 'food',           icon: Utensils,     colorClass: 'bg-orange-500',  lightBgClass: 'bg-orange-50 dark:bg-orange-500/10', textClass: 'text-orange-600 dark:text-orange-400' },
  { id: 'activities',     icon: Palmtree,     colorClass: 'bg-emerald-500', lightBgClass: 'bg-success-wash', textClass: 'text-success' },
  { id: 'other',          icon: MoreHorizontal, colorClass: 'bg-gray-500', lightBgClass: 'bg-gray-100 dark:bg-gray-500/10',    textClass: 'text-gray-600 dark:text-gray-400' },
];

const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[4];

/* ─── Member helpers (expense splitting) ─── */
const getMemberName = (m) => {
  if (!m) return '—';
  const name = [m.firstName, m.lastName].filter(Boolean).join(' ').trim();
  return name || m.email || '—';
};

// Map a balances-endpoint member (camelCase) to the shape UserAvatar expects,
// so trip members render the real avatar each user picked.
const toAvatarUser = (m) => ({
  first_name: m?.firstName,
  last_name: m?.lastName,
  email: m?.email,
  avatar_url: m?.avatarUrl,
});

// Display label: "You" for the current user, otherwise the member's name.
const memberLabel = (m, currentUserId, t) =>
  Number(m?.id) === Number(currentUserId) ? t('budget.balances.you') : getMemberName(m);

// Splits an amount equally across participants, distributing rounding
// remainder by the cent so the shares always sum back to the total.
const computeEqualSplits = (participantIds, totalAmount) => {
  const n = participantIds.length;
  if (n === 0) return [];
  const totalCents = Math.round((Number(totalAmount) || 0) * 100);
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  return participantIds.map((userId, i) => ({
    userId,
    amount: (base + (i < remainder ? 1 : 0)) / 100,
  }));
};

/* ─── Settle Up Modal ─── */
const SettleUpModal = ({ isOpen, onClose, creditor, amount, currency, locale, tripId, onSettled, t }) => {
  const shouldReduceMotion = useReducedMotion();
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const bankAccount = creditor?.bankAccount || null;
  const name = getMemberName(creditor);
  const amountLabel = formatCurrency(amount, currency, locale);

  useEffect(() => {
    if (!isOpen) return;
    setCopied(false);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    if (!bankAccount) return;
    try {
      await navigator.clipboard.writeText(bankAccount);
      setCopied(true);
      toast.success(t('budget.settle.accountCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const handleMarkPaid = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.trips.settle(tripId, { toUserId: creditor.id, amount, currency, locale });
      toast.success(t('budget.settle.settleSuccess'));
      onClose();
      onSettled?.();
    } catch (err) {
      toast.error(err?.message || t('budget.settle.settleError'));
    } finally {
      setSubmitting(false);
    }
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
            aria-labelledby="settle-title"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: '100%' }}
            transition={shouldReduceMotion ? { duration: 0.2 } : { ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
            className="relative w-full max-w-md bg-page border border-subtle rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8 shadow-2xl z-10 max-h-[85dvh] overflow-y-auto overscroll-contain"
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-default">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-success-wash text-success rounded-xl flex items-center justify-center shrink-0">
                  <HandCoins size={17} strokeWidth={2} />
                </div>
                <h3 id="settle-title" className="font-bold text-xl sm:text-2xl tracking-tight text-primary truncate">
                  {t('budget.settle.title')}
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label={t('budget.addModal.close')}
                className="w-10 h-10 sm:w-9 sm:h-9 bg-subtle rounded-full flex items-center justify-center text-muted hover:text-primary transition-colors cursor-pointer shrink-0"
              >
                <X size={18} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>

            {/* You owe X to Y */}
            <div className="flex items-center gap-3 mb-5">
              <UserAvatar user={toAvatarUser(creditor)} size="md" />
              <p className="text-[15px] text-gray-700 dark:text-gray-200 leading-snug">
                {t('budget.settle.youOweAmount', { amount: amountLabel, name })}
              </p>
            </div>

            {/* Send money to */}
            {bankAccount ? (
              <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-subtle p-4 mb-7">
                <p className="text-[13px] font-semibold text-muted mb-2">{t('budget.settle.sendMoneyTo')}</p>
                <div className="flex items-center gap-3">
                  <span className="flex-1 font-mono text-[15px] sm:text-[16px] font-semibold text-primary tracking-tight break-all select-all">
                    {bankAccount}
                  </span>
                  <button
                    onClick={handleCopy}
                    aria-label={t('budget.settle.copyAccount')}
                    className="shrink-0 w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-subtle hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500 dark:text-white/70 hover:text-primary transition-all cursor-pointer"
                  >
                    {copied ? <Check size={15} strokeWidth={2.5} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={15} strokeWidth={2} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 p-4 mb-7">
                <p className="text-[13px] font-medium text-amber-700 dark:text-amber-400">
                  {t('budget.settle.noBankAccount', { name })}
                </p>
              </div>
            )}

            <button
              onClick={handleMarkPaid}
              disabled={submitting}
              className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-colors duration-300 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                t('budget.settle.settling')
              ) : (
                <>
                  <Check size={18} strokeWidth={2.5} /> {t('budget.settle.markAsPaid')}
                </>
              )}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/* ─── Balances Overview ─── */
const Balances = ({ balanceData, currency, locale, currentUserId, tripId, hasSharedExpenses, onSettled, t, embedded = false }) => {
  const [settleTarget, setSettleTarget] = useState(null);
  const members = balanceData?.members || [];
  if (members.length <= 1) return null;

  const memberById = (id) => members.find((m) => Number(m.id) === Number(id));
  const balances = balanceData?.balances || [];
  const settlements = balanceData?.settlements || [];

  return (
    <div className={embedded ? 'pt-10' : 'glass-card p-6 sm:p-8'}>
      {embedded ? (
        <div>
          <h3 className="text-[18px] font-bold tracking-tight text-primary">{t('budget.balances.title')}</h3>
          <p className="text-[13px] text-muted font-medium mt-0.5">{t('budget.balances.subtitle')}</p>
        </div>
      ) : (
      <div className="flex items-center gap-3 mb-1.5">
        <div className="w-9 h-9 bg-success-wash text-success rounded-xl flex items-center justify-center shrink-0">
          <Scale size={16} strokeWidth={2} />
        </div>
        <div>
          <h3 className="font-bold text-primary text-[15px] sm:text-lg leading-tight">{t('budget.balances.title')}</h3>
          <p className="text-[11px] sm:text-[12px] text-muted font-medium">{t('budget.balances.subtitle')}</p>
        </div>
      </div>
      )}

      {!hasSharedExpenses ? (
        <div className="mt-5 flex flex-col items-center justify-center text-center py-6">
          <p className="text-[14px] font-semibold text-muted">{t('budget.balances.empty')}</p>
        </div>
      ) : (
        <>
          {/* Per-member net chips */}
          <div className={embedded ? 'mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8' : 'grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5'}>
            {balances.map((b) => {
              const m = memberById(b.userId);
              const isMe = Number(b.userId) === Number(currentUserId);
              const net = b.net;
              const settled = Math.round(net * 100) === 0;
              const positive = net > 0;
              const label = settled
                ? t('budget.balances.settledUp')
                : positive
                  ? (isMe ? t('budget.balances.youGetBack') : t('budget.balances.getsBack'))
                  : (isMe ? t('budget.balances.youOwe') : t('budget.balances.owes'));
              const amountClass = settled
                ? 'text-gray-400 dark:text-gray-500'
                : positive
                  ? 'text-success'
                  : 'text-danger';
              return (
                <div
                  key={b.userId}
                  className={embedded
                    ? 'flex items-center gap-3 py-3 border-b border-gray-100 dark:border-white/[0.06]'
                    : 'flex items-center gap-3 p-3 rounded-xl bg-gray-50/70 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]'}
                >
                  <UserAvatar user={toAvatarUser(m)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-primary truncate leading-tight">
                      {isMe ? t('budget.balances.you') : getMemberName(m)}
                    </p>
                    <p className="text-[12px] font-medium text-muted leading-tight mt-0.5">{label}</p>
                  </div>
                  <span className={`font-bold text-[14px] tracking-tight tabular-nums shrink-0 ${amountClass}`}>
                    {settled ? '—' : formatCurrency(Math.abs(net), currency, locale)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Suggested settlements — or an "all settled" confirmation */}
          {settlements.length === 0 ? (
            <div className="mt-5 flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-success-wash border border-emerald-200/60 dark:border-emerald-500/20">
              <CheckCircle2 size={18} strokeWidth={2.5} className="text-success shrink-0" />
              <span className="text-[14px] font-bold text-emerald-700 dark:text-emerald-300">{t('budget.balances.allSettled')}</span>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-[13px] font-semibold text-muted mb-3">{t('budget.balances.toSettle')}</p>
              <div className={embedded ? '' : 'space-y-2'}>
                {settlements.map((s, i) => {
                  const from = memberById(s.from);
                  const to = memberById(s.to);
                  const fromMe = Number(s.from) === Number(currentUserId);
                  const toMe = Number(s.to) === Number(currentUserId);
                  return (
                    <div
                      key={i}
                      className={embedded
                        ? 'flex flex-wrap items-center gap-x-3 gap-y-2 py-3 border-b border-gray-100 dark:border-white/[0.06] last:border-b-0'
                        : 'flex flex-wrap items-center gap-x-3 gap-y-2 p-3 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]'}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar user={toAvatarUser(from)} size="sm" />
                        <span className={`text-[13px] font-semibold truncate ${fromMe ? 'text-primary' : 'text-secondary'}`}>
                          {fromMe ? t('budget.balances.you') : getMemberName(from)}
                        </span>
                      </div>
                      <ArrowRight size={15} strokeWidth={2.5} className="text-gray-300 dark:text-gray-600 shrink-0" />
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar user={toAvatarUser(to)} size="sm" />
                        <span className={`text-[13px] font-semibold truncate ${toMe ? 'text-primary' : 'text-secondary'}`}>
                          {toMe ? t('budget.balances.you') : getMemberName(to)}
                        </span>
                      </div>
                      <div className="ml-auto flex items-center gap-2 shrink-0">
                        <span className="font-bold text-[14px] tracking-tight tabular-nums text-primary">
                          {formatCurrency(s.amount, currency, locale)}
                        </span>
                        {fromMe && (
                          <button
                            type="button"
                            onClick={() => setSettleTarget({ creditor: to, amount: s.amount })}
                            aria-label={t('budget.settle.settleUp')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-lg bg-emerald-600 text-white text-[12px] font-bold hover:bg-emerald-500 transition-colors active:scale-95 cursor-pointer shadow-sm shadow-emerald-500/20"
                          >
                            <HandCoins size={13} strokeWidth={2.5} />
                            <span className="hidden sm:inline">{t('budget.settle.settleUp')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <SettleUpModal
        isOpen={!!settleTarget}
        onClose={() => setSettleTarget(null)}
        creditor={settleTarget?.creditor}
        amount={settleTarget?.amount || 0}
        currency={currency}
        locale={locale}
        tripId={tripId}
        onSettled={onSettled}
        t={t}
      />
    </div>
  );
};

/* ─── Expense Row ─── */
const ExpenseRow = ({ expense, compact = false, flush = false, currency, locale, isViewer, shouldReduceMotion, t, dateLocale, onEdit, onDelete }) => {
  const cat = catInfo(expense.category);
  const Icon = cat.icon;
  // Výdaj zadaný v cizí měně ukáže i původní částku a kurz (v tooltipu).
  const original = expense.originalCurrency && expense.originalCurrency !== currency ? {
    label: formatCurrency(expense.originalAmount, expense.originalCurrency, locale),
    title: formatRate(expense.exchangeRate, expense.originalCurrency, currency, locale),
  } : null;

  if (compact) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={!isViewer ? (e) => { if (!e.target.closest('button')) onEdit(expense); } : undefined}
        className={`flex items-center gap-3 sm:gap-4 ${flush ? 'px-0' : 'px-4 sm:px-5'} ${isViewer ? '' : 'cursor-pointer md:cursor-default'} py-3.5 border-b border-gray-100/70 dark:border-white/[0.05] last:border-0 ${flush ? '' : 'hover:bg-gray-50/60 dark:hover:bg-white/[0.02]'} transition-colors group`}
      >
        <div className={`w-8 h-8 sm:w-9 sm:h-9 ${cat.lightBgClass} ${cat.textClass} rounded-[0.65rem] flex items-center justify-center shrink-0`}>
          <Icon size={14} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-muted mb-0.5 leading-none">{t('budget.categories.' + expense.category)}</p>
          <p className={`text-[14px] font-semibold text-primary leading-tight line-clamp-2 break-words md:line-clamp-1`}>{expense.description}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="text-right">
            <p className="font-bold text-[15px] tracking-tight tabular-nums text-primary">
              {formatCurrency(expense.amount, currency, locale)}
            </p>
            {original && (
              <p className="text-[12px] font-medium tabular-nums text-muted leading-tight" title={original.title}>{original.label}</p>
            )}
          </div>
          {!isViewer && (
            <div className={`flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${flush ? 'md:order-first' : ''}`}>
              <button
                onClick={() => onEdit(expense)}
                aria-label={t('budget.expenseEdit')}
                className={`hidden md:flex w-10 h-10 md:w-7 md:h-7 items-center justify-center text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-active cursor-pointer`}
              >
                <Pencil size={13} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => onDelete(expense.id)}
                aria-label={t('budget.expenseDelete')}
                className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center text-gray-400 hover:text-danger dark:text-gray-500 transition-colors rounded-lg hover:bg-danger-wash cursor-pointer"
              >
                <Trash2 size={13} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 glass-card shadow-sm hover:shadow-md hover:-translate-y-0.5 group transition-all duration-300 gap-4 sm:gap-6"
    >
      <div className="flex items-center gap-4 sm:gap-5 min-w-0">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${cat.lightBgClass} ${cat.textClass} rounded-[1rem] flex items-center justify-center shrink-0`}>
          <Icon size={20} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1.5 leading-none">{t('budget.categories.' + expense.category)}</p>
          <p className="text-lg sm:text-xl font-bold text-primary truncate tracking-tight leading-tight mb-1.5">{expense.description}</p>
          {expense.date && (
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
              <Calendar size={13} strokeWidth={2} />
              {format(parseISO(expense.date), 'd. MMMM yyyy', { locale: dateLocale })}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center sm:items-end justify-between sm:flex-col shrink-0 gap-2 border-t sm:border-t-0 border-gray-100 dark:border-white/5 pt-4 sm:pt-0">
        <span className="sm:text-right">
          <span className="block font-bold text-2xl tracking-tight tabular-nums text-primary">{formatCurrency(expense.amount, currency, locale)}</span>
          {original && <span className="block text-[13px] font-medium tabular-nums text-muted" title={original.title}>{original.label}</span>}
        </span>
        {!isViewer && (
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onEdit(expense)}
              aria-label={t('budget.expenseEdit')}
              className="flex items-center gap-1.5 text-[12px] sm:text-[11px] font-medium text-muted hover:text-blue-500 dark:hover:text-blue-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all px-3.5 py-2.5 sm:px-0 sm:py-0 rounded-full sm:rounded-none bg-gray-100/70 dark:bg-white/[0.06] sm:bg-transparent dark:sm:bg-transparent cursor-pointer"
            >
              <Pencil size={13} strokeWidth={2} aria-hidden="true" />
              <span className="sm:hidden">{t('budget.expenseEdit')}</span>
            </button>
            <button
              onClick={() => onDelete(expense.id)}
              className="flex items-center gap-1.5 text-[12px] sm:text-[11px] font-medium text-muted hover:text-danger opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all px-3.5 py-2.5 sm:px-0 sm:py-0 rounded-full sm:rounded-none bg-gray-100/70 dark:bg-white/[0.06] sm:bg-transparent dark:sm:bg-transparent cursor-pointer"
            >
              <Trash2 size={13} strokeWidth={2} aria-hidden="true" /> {t('budget.expenseDelete')}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ─── Category Bar ─── */
const CategoryBar = ({ expenses, currency, locale, onCategoryClick, activeCategory }) => {
  const { t } = useTranslation();
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  if (total === 0) return null;

  const byCategory = CATEGORIES
    .map(cat => ({
      ...cat,
      amount: expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
    }))
    .map(c => ({ ...c, percent: total > 0 ? (c.amount / total) * 100 : 0 }))
    .filter(c => c.amount > 0);

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex h-3 w-full gap-0.5 rounded-full overflow-hidden">
        {byCategory.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${c.colorClass} transition-opacity hover:opacity-80 cursor-pointer ${
              activeCategory !== 'all' && activeCategory !== c.id ? 'opacity-30' : 'opacity-100'
            }`}
            style={{ width: `${c.percent}%` }}
            onClick={() => onCategoryClick(c.id === activeCategory ? 'all' : c.id)}
            title={t('budget.categories.' + c.id)}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5 sm:gap-2">
        {byCategory.map((c) => {
          const isActive = activeCategory === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onCategoryClick(c.id === activeCategory ? 'all' : c.id)}
              className={`flex items-center justify-between px-3 py-2 sm:p-3 min-h-[44px] rounded-xl text-left transition-all cursor-pointer ${
                isActive
                  ? `${c.lightBgClass} ring-1 ring-current ${c.textClass}`
                  : 'hover:bg-field'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-2.5 h-2.5 ${c.colorClass} rounded-full shrink-0`} />
                <span className="text-[12px] text-muted font-medium truncate">
                  {t('budget.categories.' + c.id)}
                </span>
              </div>
              <div className="text-right shrink-0 ml-2 flex items-baseline gap-2 sm:block">
                <p className="font-bold text-[13px] tracking-tight tabular-nums text-primary">
                  {formatCurrency(c.amount, currency, locale)}
                </p>
                <p className="text-[11px] sm:text-[10px] text-gray-400 dark:text-gray-500 tabular-nums w-8 sm:w-auto">{c.percent.toFixed(0)}%</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Měna výdaje ─── */
const round2 = (v) => Math.round(v * 100) / 100;
// Slabé měny (Ft, ¥) se čtou líp po stovkách: „100 Ft = 6,52 Kč“.
const rateUnitFor = (rate) => (rate < 0.1 ? 100 : 1);

// Kurzy ECB se v rámci relace neměnní, tak se stejný dotaz neposílá dvakrát
// (třeba při „Uložit a přidat další“).
const ecbRateCache = new Map();
const fetchEcbRate = (from, to, date) => {
  const key = `${from}:${to}:${date}`;
  if (!ecbRateCache.has(key)) {
    ecbRateCache.set(key, api.settings.getExchangeRate(from, to, date).catch((err) => {
      ecbRateCache.delete(key);
      throw err;
    }));
  }
  return ecbRateCache.get(key);
};

// Podíly zadané v cizí měně převede kurzem a zaokrouhlovací rozdíl přičte
// největšímu, aby součet seděl s převedenou částkou výdaje.
const convertSplits = (entries, rate, total) => {
  const converted = entries.map((s) => ({ ...s, amount: round2(s.amount * rate) }));
  const drift = round2(total - converted.reduce((sum, s) => sum + s.amount, 0));
  if (drift !== 0 && converted.length > 0) {
    const largest = converted.reduce((a, b) => (b.amount > a.amount ? b : a));
    largest.amount = round2(largest.amount + drift);
  }
  return converted.filter((s) => s.amount > 0);
};

// Poslední měna výdaje ve výletu — kdo je v Maďarsku, zadává dál ve forintech.
const expenseCurrencyKey = (tripId) => `journeo_expense_currency:${tripId}`;
const lastExpenseCurrency = (tripId) => {
  try { return tripId ? localStorage.getItem(expenseCurrencyKey(tripId)) : null; } catch { return null; }
};
const rememberExpenseCurrency = (tripId, code, isForeign) => {
  if (isForeign) rememberCurrency(code);
  try { if (tripId) localStorage.setItem(expenseCurrencyKey(tripId), code); } catch { /* jen pohodlí */ }
};

/* ─── Add / Edit Expense Modal ─── */
const AddExpenseModal = ({ isOpen, onClose, onAdd, currency: tripCurrency, tripId, tripRange, initialExpense = null, initialCategory = null, members = [], currentUserId = null }) => {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;
  const modalRef = useRef(null);
  const isEditing = !!initialExpense;
  const canSplit = members.length > 1;
  const { currency: mainCurrency } = useCurrency();

  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'transport',
    date: new Date().toISOString().split('T')[0],
    paidBy: currentUserId,
    isPersonal: false,
    splitMode: 'equal',
    participants: {},
    customAmounts: {},
    currency: tripCurrency,
    rateSource: 'ecb',
    rateInput: '',
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [showCurrencies, setShowCurrencies] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  // Stav kurzu před „Upravit kurz“, ať ho Esc vrátí.
  const rateSnapshotRef = useRef(null);
  const currencyButtonRef = useRef(null);
  const currencyPopoverRef = useRef(null);
  const scrollRef = useRef(null);
  const [popoverBox, setPopoverBox] = useState(null);
  // Kurz ECB pro aktuální měnu a den výdaje ({ key, rate, date }).
  const [ecbRate, setEcbRate] = useState(null);
  const [rateStatus, setRateStatus] = useState('idle');
  const amountRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setShowCalendar(false);
    setShowSplit(false);
    setShowCurrencies(false);
    setEditingRate(false);
    setRateStatus('idle');

    const allParticipants = {};
    members.forEach((m) => { allParticipants[m.id] = true; });

    if (initialExpense) {
      const hasSplit = initialExpense.paidBy != null && (initialExpense.splits?.length > 0);
      const participants = {};
      const customAmounts = {};
      members.forEach((m) => { participants[m.id] = false; customAmounts[m.id] = ''; });
      // Výdaj v cizí měně se upravuje v ní; podíly jsou uložené v měně
      // výletu, tak se pro úpravu převedou zpět jeho kurzem.
      const foreign = !!initialExpense.originalCurrency;
      const rate = foreign ? initialExpense.exchangeRate : 1;
      (initialExpense.splits || []).forEach((s) => {
        participants[s.userId] = true;
        customAmounts[s.userId] = String(foreign ? Math.round((s.amount / rate) * 100) / 100 : s.amount);
      });
      const manual = foreign && initialExpense.rateSource === 'manual';
      setEcbRate(foreign && !manual
        ? { key: `${initialExpense.originalCurrency}:${initialExpense.date}`, rate, date: initialExpense.rateDate }
        : null);
      // Detect whether the saved split was an even share or custom amounts.
      const partIds = (initialExpense.splits || []).map((s) => s.userId);
      const even = computeEqualSplits(partIds, parseFloat(initialExpense.amount));
      const isEqual = partIds.length > 0 && even.every((e) => {
        const match = (initialExpense.splits || []).find((s) => Number(s.userId) === Number(e.userId));
        return match && Math.abs(match.amount - e.amount) < 0.01;
      });
      setForm({
        description: initialExpense.description,
        amount: String(foreign ? initialExpense.originalAmount : initialExpense.amount),
        category: initialExpense.category,
        date: initialExpense.date,
        paidBy: initialExpense.paidBy ?? currentUserId,
        isPersonal: !hasSplit,
        splitMode: isEqual ? 'equal' : 'custom',
        participants: hasSplit ? participants : allParticipants,
        customAmounts,
        currency: foreign ? initialExpense.originalCurrency : tripCurrency,
        rateSource: manual ? 'manual' : 'ecb',
        rateInput: manual ? String(rate * rateUnitFor(rate)) : '',
      });
    } else {
      setForm({
        description: '',
        amount: '',
        category: initialCategory || 'transport',
        date: new Date().toISOString().split('T')[0],
        paidBy: currentUserId,
        isPersonal: false,
        splitMode: 'equal',
        participants: allParticipants,
        customAmounts: {},
        // Kdo platí v cizině, zadává většinou pořád ve stejné měně.
        currency: lastExpenseCurrency(tripId) || tripCurrency,
        rateSource: 'ecb',
        rateInput: '',
      });
    }
  }, [isOpen, initialExpense, members, currentUserId]);

  // ── Měna a kurz ──
  // Kurz ECB ke dni výdaje se stáhne jen pro nový výdaj nebo při změně měny
  // či dne; uložený výdaj si svůj kurz drží.
  const isForeign = form.currency !== tripCurrency;
  const rateKey = `${form.currency}:${form.date}`;
  useEffect(() => {
    if (!isOpen || !isForeign || form.rateSource === 'manual' || ecbRate?.key === rateKey) return;
    let cancelled = false;
    setRateStatus('loading');
    fetchEcbRate(form.currency, tripCurrency, form.date)
      .then(({ rate, date }) => {
        if (cancelled) return;
        setEcbRate({ key: rateKey, rate, date });
        setRateStatus('idle');
      })
      .catch(() => {
        if (cancelled) return;
        setRateStatus('error');
        rateSnapshotRef.current = { rateSource: 'ecb', rateInput: '' };
        setEditingRate(true);
      });
    return () => { cancelled = true; };
  }, [isOpen, isForeign, rateKey, form.rateSource, tripCurrency, ecbRate?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentEcb = ecbRate?.key === rateKey ? ecbRate : null;
  const rateUnit = rateUnitFor(currentEcb?.rate ?? initialExpense?.exchangeRate ?? 1);
  const manualRate = parseFloat(String(form.rateInput).replace(/\s/g, '').replace(',', '.')) / rateUnit;
  const rate = !isForeign ? 1
    : form.rateSource === 'manual' ? (manualRate > 0 ? manualRate : null)
    : currentEcb?.rate ?? null;

  const pickCurrency = (code) => {
    setForm((f) => ({ ...f, currency: code, rateSource: 'ecb', rateInput: '' }));
    setShowCurrencies(false);
    setEditingRate(false);
    setRateStatus('idle');
    requestAnimationFrame(() => amountRef.current?.focus());
  };

  const startRateEdit = () => {
    rateSnapshotRef.current = { rateSource: form.rateSource, rateInput: form.rateInput };
    setForm((f) => ({
      ...f,
      rateInput: f.rateInput || (rate * rateUnit).toLocaleString(i18n.language, { useGrouping: false, maximumFractionDigits: 4 }),
    }));
    setEditingRate(true);
  };

  // Esc: vrátí kurz, jaký byl před úpravou.
  const cancelRateEdit = () => {
    const snapshot = rateSnapshotRef.current;
    if (snapshot) setForm((f) => ({ ...f, ...snapshot }));
    rateSnapshotRef.current = null;
    setEditingRate(false);
  };

  // Enter: potvrdí ruční kurz (jen platný), formulář se tím neodešle.
  const confirmRateEdit = () => {
    if (form.rateSource === 'manual' && !(manualRate > 0)) return;
    rateSnapshotRef.current = null;
    setEditingRate(false);
  };

  useEffect(() => {
    // Esc zavírá postupně: nejdřív otevřený výběr (měna, kurz, kalendář),
    // až pak celý formulář.
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape' || !isOpen) return;
      if (showCurrencies) {
        setShowCurrencies(false);
        currencyButtonRef.current?.focus();
      } else if (editingRate) {
        cancelRateEdit();
      } else if (showCalendar) {
        setShowCalendar(false);
      } else {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showCurrencies, editingRate, showCalendar]); // eslint-disable-line react-hooks/exhaustive-deps

  // Výběr měny visí pod tlačítkem měny, ale je ukotvený k celému modalu,
  // aby ho neusekla posuvná část a mohl překrýt i patičku.
  useLayoutEffect(() => {
    if (!showCurrencies) { setPopoverBox(null); return; }
    const modal = modalRef.current?.getBoundingClientRect();
    const button = currencyButtonRef.current?.getBoundingClientRect();
    if (!modal || !button) return;
    const top = button.bottom - modal.top + 8;
    setPopoverBox({ top, maxHeight: Math.max(modal.height - top - 16, 180) });
  }, [showCurrencies]);

  // Výběr měny je vrstva nad formulářem; klik mimo ni nebo posun obsahu ji zavře.
  useEffect(() => {
    if (!showCurrencies) return;
    const onPointerDown = (e) => {
      if (currencyPopoverRef.current?.contains(e.target) || currencyButtonRef.current?.contains(e.target)) return;
      setShowCurrencies(false);
    };
    const onScroll = () => setShowCurrencies(false);
    const scroller = scrollRef.current;
    document.addEventListener('pointerdown', onPointerDown);
    scroller?.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      scroller?.removeEventListener('scroll', onScroll);
    };
  }, [showCurrencies]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const modal = modalRef.current;
    const focusable = modal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    // Částka je první, co člověk zná — kurzor rovnou do ní (na mobilu tím
    // naskočí číselná klávesnice).
    (modal.querySelector('[data-autofocus]') || first)?.focus();
    const trapFocus = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    modal.addEventListener('keydown', trapFocus);
    return () => modal.removeEventListener('keydown', trapFocus);
  }, [isOpen]);

  const tripStart = tripRange?.start ? new Date(tripRange.start) : null;
  const tripEnd = tripRange?.end ? new Date(tripRange.end) : null;
  const modifiers = {
    trip: (date) => tripStart && tripEnd && date >= tripStart && date <= tripEnd,
  };

  // Live preview of equal shares for the currently selected participants.
  const selectedIds = members.filter((m) => form.participants[m.id]).map((m) => m.id);
  const amountNum = parseFloat(String(form.amount).replace(/\s/g, '').replace(',', '.')) || 0;
  const equalSplits = computeEqualSplits(selectedIds, amountNum);
  const equalShareFor = (id) => equalSplits.find((s) => Number(s.userId) === Number(id))?.amount ?? 0;
  const customSum = selectedIds.reduce((sum, id) => sum + (parseFloat(form.customAmounts[id]) || 0), 0);

  const toggleParticipant = (id) =>
    setForm((f) => ({ ...f, participants: { ...f.participants, [id]: !f.participants[id] } }));

  const parseAmount = (value) => parseFloat(String(value).replace(/\s/g, '').replace(',', '.'));

  const handleSubmit = (e, { addAnother = false } = {}) => {
    e?.preventDefault();
    const entered = parseAmount(form.amount);
    if (!entered || entered <= 0) {
      toast.error(t('budget.addModal.amountError'));
      amountRef.current?.focus();
      return;
    }
    if (isForeign && !rate) {
      toast.error(t('budget.addModal.rateMissing'));
      setEditingRate(true);
      return;
    }
    // Do rozpočtu jde částka v měně výletu; zadaná zůstane jako původní.
    const amount = isForeign ? round2(entered * rate) : entered;

    let paidBy = null;
    let splits = [];

    if (canSplit && !form.isPersonal) {
      const participantIds = members.filter((m) => form.participants[m.id]).map((m) => m.id);
      if (participantIds.length === 0) {
        setShowSplit(true);
        toast.error(t('budget.addModal.splitError'));
        return;
      }
      if (form.splitMode === 'equal') {
        splits = computeEqualSplits(participantIds, amount);
      } else {
        // Vlastní podíly se zadávají v měně výdaje a kontrolují proti
        // zadané částce; převod je pak srovná na haléř s převedenou.
        const entries = participantIds.map((id) => ({ userId: id, amount: parseFloat(form.customAmounts[id]) || 0 }));
        const sum = entries.reduce((s, x) => s + x.amount, 0);
        if (Math.abs(sum - entered) > 0.01) {
          setShowSplit(true);
          toast.error(t('budget.addModal.splitSumError', { amount: formatCurrency(entered, form.currency, i18n.language) }));
          return;
        }
        splits = isForeign ? convertSplits(entries, rate, amount) : entries;
      }
      paidBy = form.paidBy != null ? parseInt(form.paidBy) : currentUserId;
    }

    onAdd({
      id: initialExpense?.id || Date.now().toString(),
      // Popis je nepovinný — bez něj stačí název kategorie, ať zápis
      // „kafe za 80“ nezdržuje vymýšlením textu.
      description: form.description.trim() || t('budget.categories.' + form.category),
      amount,
      category: form.category,
      date: form.date,
      paidBy,
      splits,
      ...(isForeign ? {
        originalAmount: entered,
        originalCurrency: form.currency,
        exchangeRate: rate,
        rateDate: form.rateSource === 'manual' ? null : currentEcb?.date,
        rateSource: form.rateSource,
      } : {}),
    });
    rememberExpenseCurrency(tripId, form.currency, isForeign);
    if (!isEditing) track('expense_added', { category: form.category, foreign: isForeign, split: splits.length > 0 });
    toast.success(isEditing ? t('budget.addModal.editSuccess') : t('budget.addModal.success'));

    if (addAnother) {
      // Další výdaj: stejný den, plátce i dělení, jen čistá částka a popis.
      setForm((f) => ({ ...f, description: '', amount: '', customAmounts: {} }));
      setShowCalendar(false);
      requestAnimationFrame(() => amountRef.current?.focus());
      return;
    }
    onClose();
  };

  // ── Datum: rychlé volby místo kalendáře ──
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const yesterdayIso = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const isOtherDate = form.date !== todayIso && form.date !== yesterdayIso;
  const selectedDate = parseISO(form.date);
  const tripDayNumber = tripStart && tripEnd && selectedDate >= startOfDay(tripStart) && selectedDate <= tripEnd
    ? differenceInCalendarDays(selectedDate, tripStart) + 1
    : null;
  const pickDate = (iso) => {
    setForm((f) => ({ ...f, date: iso }));
    setShowCalendar(false);
  };

  // ── Dělení: jedna souhrnná věta, detail až na požádání ──
  const payer = members.find((m) => Number(m.id) === Number(form.paidBy));
  // „Platí Vy“ by zní špatně — pro sebe vlastní tvar věty.
  const payerKey = Number(form.paidBy) === Number(currentUserId) ? 'You' : '';
  const splitSummary = form.isPersonal
    ? t('budget.addModal.personalExpense')
    : form.splitMode === 'custom'
      ? t(`budget.addModal.splitSummaryCustom${payerKey}`, { name: getMemberName(payer) })
      : t(`budget.addModal.splitSummary${payerKey}`, { name: getMemberName(payer), count: selectedIds.length });

  const chip = (active) =>
    `inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-full text-[13px] font-semibold border transition-colors active:scale-[0.97] cursor-pointer ${
      active
        ? 'bg-active text-active border-blue-200 dark:border-blue-400/30'
        : 'bg-page border-gray-200/80 dark:border-white/10 text-soft hover:bg-field hover:text-primary'
    }`;

  const handleKeyDown = (e) => {
    // ⌘/Ctrl+Enter = uložit a rovnou zapsat další.
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isEditing) {
      e.preventDefault();
      handleSubmit(null, { addAnother: true });
    }
  };

  const amountLabel = amountNum > 0 ? formatCurrency(amountNum, form.currency, i18n.language) : null;
  const convertedNum = isForeign && rate && amountNum > 0 ? round2(amountNum * rate) : null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm cursor-pointer"
          />
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-expense-title"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: '100%' }}
            transition={shouldReduceMotion ? { duration: 0.2 } : { ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
            className="relative w-full sm:max-w-[480px] bg-page border border-subtle rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-h-[92dvh] sm:max-h-[88dvh] flex flex-col z-10"
          >
            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col min-h-0">
              {/* Výběr měny: vrstva přes formulář, modal se při otevření nezvětší */}
              {showCurrencies && popoverBox && (
                <div
                  ref={currencyPopoverRef}
                  style={{ top: popoverBox.top }}
                  className="absolute inset-x-5 sm:inset-x-6 z-20 rounded-2xl shadow-[0_24px_48px_-16px_rgba(17,24,39,0.28)]"
                >
                  <CurrencyList
                    value={form.currency}
                    pinned={[tripCurrency, mainCurrency, ...getRecentCurrencies()]}
                    onSelect={pickCurrency}
                    listMaxHeight={popoverBox.maxHeight - 70}
                  />
                </div>
              )}
              {/* Hlavička */}
              <div className="flex items-center justify-between gap-3 px-5 sm:px-6 pt-4 sm:pt-5">
                <h3 id="add-expense-title" className="text-[17px] font-bold tracking-tight text-primary">
                  {isEditing ? t('budget.addModal.editTitle') : t('budget.addModal.title')}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t('budget.addModal.close')}
                  className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-subtle transition-colors cursor-pointer"
                >
                  <X size={20} strokeWidth={2.5} aria-hidden="true" />
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 pb-4">
                {/* Částka — hlavní věc formuláře, měna hned vedle */}
                <div className="pt-2 pb-4 text-center">
                  <div className="flex items-baseline justify-center gap-1.5">
                    <label htmlFor="expense-amount" className="sr-only">{t('budget.addModal.amountLabel')} ({form.currency})</label>
                    <input
                      id="expense-amount"
                      ref={amountRef}
                      data-autofocus
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d.,\s]/g, '') })}
                      style={{ width: `${Math.max(String(form.amount).length, 1) + 0.3}ch` }}
                      className="min-w-[2ch] max-w-full bg-transparent text-center text-[48px] sm:text-[52px] leading-none font-bold tracking-tight tabular-nums text-primary placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none"
                    />
                    <button
                      ref={currencyButtonRef}
                      type="button"
                      onClick={() => setShowCurrencies((v) => !v)}
                      aria-expanded={showCurrencies}
                      aria-label={t('currencyPicker.change', { currency: form.currency })}
                      className={`inline-flex items-center gap-0.5 px-2 -mr-2 rounded-xl text-[22px] font-bold transition-colors cursor-pointer ${
                        isForeign ? 'text-accent' : 'text-muted hover:text-primary'
                      } hover:bg-field`}
                    >
                      {currencySymbol(form.currency)}
                      <ChevronRight size={16} strokeWidth={2.75} className={`transition-transform ${showCurrencies ? '-rotate-90' : 'rotate-90'}`} aria-hidden="true" />
                    </button>
                  </div>

                  {/* Převod do měny výletu: kurz ECB ke dni výdaje, nebo ruční */}
                  {isForeign && (
                    <div className="mt-2 text-[13px] font-medium text-muted" aria-live="polite">
                      {convertedNum !== null && (
                        <p className="text-[15px] font-semibold text-secondary tabular-nums">
                          ≈ {formatCurrency(convertedNum, tripCurrency, i18n.language)}
                        </p>
                      )}
                      {rateStatus === 'loading' && !rate ? (
                        <p role="status" aria-label={t('budget.addModal.rateLoading')} className="flex justify-center">
                          <Skeleton className="h-4 w-44" rounded="rounded-full" />
                        </p>
                      ) : rateStatus === 'error' && form.rateSource !== 'manual' ? (
                        <p className="text-danger">{t('budget.addModal.rateError')}</p>
                      ) : rate ? (
                        <p className="flex flex-wrap items-center justify-center gap-x-1.5">
                          <span className="tabular-nums">{formatRate(rate, form.currency, tripCurrency, i18n.language)}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {form.rateSource === 'manual'
                              ? t('budget.addModal.rateManual')
                              : t('budget.addModal.rateEcb', { date: currentEcb?.date ? format(parseISO(currentEcb.date), 'd. M.', { locale: dateLocale }) : '' })}
                          </span>
                          {!editingRate && (
                            <>
                              <span aria-hidden="true">·</span>
                              <button
                                type="button"
                                onClick={startRateEdit}
                                className="min-h-[32px] font-semibold text-accent hover:underline underline-offset-2 cursor-pointer"
                              >
                                {t('budget.addModal.rateEdit')}
                              </button>
                            </>
                          )}
                        </p>
                      ) : null}

                      {editingRate && (
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                          <label htmlFor="expense-rate" className="tabular-nums font-semibold text-secondary">
                            {rateUnit} {currencySymbol(form.currency)} =
                          </label>
                          <input
                            id="expense-rate"
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            autoFocus={rateStatus !== 'error'}
                            value={form.rateInput}
                            placeholder="0"
                            onChange={(e) => setForm((f) => ({ ...f, rateInput: e.target.value.replace(/[^\d.,]/g, ''), rateSource: 'manual' }))}
                            onKeyDown={(e) => {
                              if (e.key !== 'Enter') return;
                              e.preventDefault();
                              confirmRateEdit();
                            }}
                            className="w-28 h-10 px-3 rounded-xl bg-field border border-transparent focus:bg-page focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-base sm:text-[14px] font-semibold text-right tabular-nums text-primary"
                          />
                          <span className="font-semibold text-secondary">{currencySymbol(tripCurrency)}</span>
                          {form.rateSource === 'manual' && (
                            <button
                              type="button"
                              onClick={() => {
                                setForm((f) => ({ ...f, rateSource: 'ecb', rateInput: '' }));
                                setEditingRate(false);
                                setRateStatus('idle');
                              }}
                              className="min-h-[40px] px-1 font-semibold text-accent hover:underline underline-offset-2 cursor-pointer"
                            >
                              {t('budget.addModal.rateUseEcb')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Za co */}
                <input
                  type="text"
                  maxLength={255}
                  aria-label={t('budget.addModal.descriptionLabel')}
                  placeholder={t('budget.addModal.forWhatPlaceholder')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full h-12 px-4 rounded-2xl bg-field border border-transparent focus:bg-page focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/15 focus:outline-none text-base sm:text-[15px] font-medium text-primary placeholder:text-placeholder transition-colors"
                />
                {form.description.length > 200 && (
                  <div className="flex justify-end mt-1.5 pr-1">
                    <CharCount value={form.description} max={255} />
                  </div>
                )}

                {/* Kategorie */}
                <fieldset className="mt-5">
                  <legend className="sr-only">{t('budget.addModal.categoryLabel')}</legend>
                  <div className="grid grid-cols-5 gap-1.5">
                    {CATEGORIES.map((c) => {
                      const Icon = c.icon;
                      const active = form.category === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setForm({ ...form, category: c.id })}
                          aria-pressed={active}
                          className="flex flex-col items-center gap-1.5 py-1 rounded-2xl cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                        >
                          <span className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                            active
                              ? `${c.lightBgClass} ${c.textClass} ring-2 ring-current scale-105`
                              : `bg-field ${c.textClass} opacity-70 group-hover:opacity-100`
                          }`}>
                            <Icon size={20} strokeWidth={2.25} aria-hidden="true" />
                          </span>
                          <span className={`text-[11px] font-semibold leading-tight text-center ${active ? 'text-primary' : 'text-muted'}`}>
                            {t('budget.categories.' + c.id)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Kdy */}
                <fieldset className="mt-5">
                  <legend className="sr-only">{t('budget.addModal.dateLabel')}</legend>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => pickDate(todayIso)} aria-pressed={form.date === todayIso} className={chip(form.date === todayIso)}>
                      {t('budget.addModal.today')}
                    </button>
                    <button type="button" onClick={() => pickDate(yesterdayIso)} aria-pressed={form.date === yesterdayIso} className={chip(form.date === yesterdayIso)}>
                      {t('budget.addModal.yesterday')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCalendar((v) => !v)}
                      aria-expanded={showCalendar}
                      aria-pressed={isOtherDate}
                      className={chip(isOtherDate)}
                    >
                      <Calendar size={14} strokeWidth={2.5} aria-hidden="true" />
                      {isOtherDate
                        ? format(selectedDate, 'EEEEEE d. M.', { locale: dateLocale })
                        : t('budget.addModal.otherDay')}
                    </button>
                  </div>
                  {tripDayNumber && (
                    <p className="mt-2 text-[12px] font-medium text-muted">
                      {t('budget.addModal.tripDay', { day: tripDayNumber })}
                    </p>
                  )}
                  {showCalendar && (
                    <div className="mt-3 glass-card p-3 sm:p-4 overflow-x-auto">
                      <DayPicker
                        mode="single"
                        selected={selectedDate}
                        defaultMonth={selectedDate}
                        onSelect={(date) => { if (date) pickDate(format(date, 'yyyy-MM-dd')); }}
                        locale={dateLocale}
                        modifiers={modifiers}
                        modifiersClassNames={{ trip: 'bg-blue-500/10 text-accent font-bold border border-blue-500/20' }}
                        className="premium-calendar"
                      />
                    </div>
                  )}
                </fieldset>

                {/* Dělení — jen ve sdílených výletech, sbalené do jedné věty */}
                {canSplit && (
                  <div className="mt-5 rounded-2xl border border-default">
                    <button
                      type="button"
                      onClick={() => setShowSplit((v) => !v)}
                      aria-expanded={showSplit}
                      className="w-full flex items-center gap-3 px-4 min-h-[52px] text-left cursor-pointer"
                    >
                      <span className="w-8 h-8 rounded-xl bg-success-wash text-success flex items-center justify-center shrink-0">
                        <Split size={15} strokeWidth={2} aria-hidden="true" />
                      </span>
                      <span className="flex-1 min-w-0 text-[14px] font-semibold text-primary truncate">{splitSummary}</span>
                      <ChevronRight size={16} strokeWidth={2.5} className={`shrink-0 text-gray-400 transition-transform ${showSplit ? 'rotate-90' : ''}`} aria-hidden="true" />
                    </button>

                    {showSplit && (
                      <div className="px-4 pb-4 space-y-3 border-t border-default pt-3">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[13px] font-semibold text-primary">{t('budget.addModal.splitLabel')}</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!form.isPersonal}
                            aria-label={t('budget.addModal.splitLabel')}
                            onClick={() => setForm((f) => ({ ...f, isPersonal: !f.isPersonal }))}
                            className="shrink-0 cursor-pointer p-2.5 -m-2.5"
                          >
                            <span className={`relative block w-11 h-6 rounded-full transition-colors ${form.isPersonal ? 'bg-gray-300 dark:bg-white/15' : 'bg-blue-600'}`}>
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isPersonal ? '' : 'translate-x-5'}`} />
                            </span>
                          </button>
                        </div>

                        {!form.isPersonal && (
                          <>
                            <div className="flex items-center gap-3">
                              <label htmlFor="expense-paid-by" className="text-[12px] font-medium text-muted shrink-0">{t('budget.addModal.paidByLabel')}</label>
                              <div className="relative flex-1 min-w-0">
                                <select
                                  id="expense-paid-by"
                                  value={form.paidBy ?? ''}
                                  onChange={(e) => setForm({ ...form, paidBy: parseInt(e.target.value) })}
                                  className="w-full appearance-none cursor-pointer pl-3 pr-9 py-2.5 bg-field border border-transparent rounded-xl text-base sm:text-[13px] font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:bg-[#1C1C1E]"
                                >
                                  {members.map((m) => (
                                    <option key={m.id} value={m.id} className="text-primary dark:bg-[#1C1C1E]">
                                      {memberLabel(m, currentUserId, t)}
                                    </option>
                                  ))}
                                </select>
                                <ChevronRight size={15} strokeWidth={2.5} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                              </div>
                            </div>

                            <div className="flex p-0.5 bg-field rounded-xl">
                              {[
                                { id: 'equal', label: t('budget.addModal.splitEqually') },
                                { id: 'custom', label: t('budget.addModal.splitCustom') },
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => setForm({ ...form, splitMode: opt.id })}
                                  className={`flex-1 min-h-[40px] rounded-[0.6rem] text-[13px] font-bold transition-all cursor-pointer ${
                                    form.splitMode === opt.id
                                      ? 'bg-white dark:bg-white/10 text-primary shadow-sm'
                                      : 'text-muted hover:text-gray-700 dark:hover:text-gray-200'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>

                            <div className="space-y-0.5">
                              {members.map((m) => {
                                const checked = !!form.participants[m.id];
                                return (
                                  <div key={m.id} className={`flex items-center gap-2.5 px-1 rounded-lg transition-opacity ${checked ? '' : 'opacity-45'}`}>
                                    <button
                                      type="button"
                                      onClick={() => toggleParticipant(m.id)}
                                      aria-pressed={checked}
                                      aria-label={getMemberName(m)}
                                      className="flex items-center gap-2.5 flex-1 min-w-0 min-h-[44px] text-left cursor-pointer"
                                    >
                                      <span
                                        aria-hidden="true"
                                        className={`w-[18px] h-[18px] rounded-md flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-accent text-white' : 'bg-gray-200 dark:bg-white/10'}`}
                                      >
                                        {checked && <Check size={12} strokeWidth={3} />}
                                      </span>
                                      <UserAvatar user={toAvatarUser(m)} size="sm" />
                                      <span className="text-[13px] font-semibold text-primary truncate flex-1 min-w-0">
                                        {memberLabel(m, currentUserId, t)}
                                      </span>
                                    </button>
                                    {checked && (
                                      form.splitMode === 'equal' ? (
                                        <span className="text-[13px] font-bold text-muted tabular-nums shrink-0">
                                          {formatCurrency(equalShareFor(m.id), form.currency, i18n.language)}
                                        </span>
                                      ) : (
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder="0"
                                          aria-label={getMemberName(m)}
                                          value={form.customAmounts[m.id] ?? ''}
                                          onChange={(e) => setForm((f) => ({ ...f, customAmounts: { ...f.customAmounts, [m.id]: e.target.value.replace(/[^\d.,]/g, '').replace(',', '.') } }))}
                                          className="w-24 px-3 py-2 bg-page border border-default rounded-lg text-base sm:text-[13px] font-semibold text-right text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 tabular-nums shrink-0"
                                        />
                                      )
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {form.splitMode === 'custom' && amountNum > 0 && (
                              <div className={`flex items-center justify-between text-[12px] font-semibold px-1 ${Math.abs(customSum - amountNum) > 0.01 ? 'text-danger' : 'text-success'}`}>
                                <span>{formatCurrency(customSum, form.currency, i18n.language)} / {formatCurrency(amountNum, form.currency, i18n.language)}</span>
                                {Math.abs(customSum - amountNum) <= 0.01 && <Check size={14} strokeWidth={2.5} />}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Patička drží akce vždy na dosah palce, i když se obsah posouvá */}
              <div className="px-5 sm:px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-5 border-t border-subtle bg-page rounded-b-none sm:rounded-b-[2rem]">
                <button
                  type="submit"
                  className="w-full min-h-[52px] bg-accent text-white rounded-2xl text-[16px] font-bold hover:bg-accent-hover transition-colors shadow-md shadow-blue-500/20 active:scale-[0.98] cursor-pointer"
                >
                  {isEditing
                    ? t('budget.addModal.editSubmit')
                    : amountLabel
                      ? t('budget.addModal.submitAmount', { amount: amountLabel })
                      : t('budget.addModal.submit')}
                </button>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => handleSubmit(null, { addAnother: true })}
                    className="w-full min-h-[44px] mt-1 inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-accent hover:text-blue-500 transition-colors cursor-pointer"
                  >
                    {t('budget.addModal.saveAndAddAnother')}
                    <kbd className="hidden md:inline text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-subtle text-secondary">⌘↵</kbd>
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/* ─── Budget ─── */
// Ukázkové výdaje do náhledu prázdného rozpočtu. Částky jsou v Kč, pro
// ostatní měny se přepočtou zhruba kurzem, ať ukázka nepůsobí absurdně.
const SAMPLE_EXPENSES = [
  { id: 'stay', category: 'accommodation', amount: 9600, split: 4 },
  { id: 'train', category: 'transport', amount: 2480, split: 4 },
  { id: 'dinner', category: 'food', amount: 1650, split: 3 },
];
const SAMPLE_SCALE = { CZK: 1, EUR: 1 / 25, USD: 1 / 23, GBP: 1 / 29 };

/**
 * Prázdný rozpočet: místo nul a pomlček vysvětlí, co rozpočet umí, ukáže
 * to na náhledu a nabídne první výdaj rovnou podle kategorie. Sdílí ho
 * rozpočet ve výletu (embedded, bez karty) i stránka Výdaje.
 */
const BudgetEmptyState = ({
  embedded, isViewer, noTrips = false, onAdd, currency, locale, t,
  budgetTarget, editingTarget, targetInput, setTargetInput, onEditTarget, onSaveTarget, onCancelTarget,
  currencyControl = null,
}) => {
  const scale = SAMPLE_SCALE[currency] ?? 1;
  const amount = (czk) => formatCurrency(Math.round(czk * scale), currency, locale);
  const sampleTotal = SAMPLE_EXPENSES.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className={embedded ? 'pt-2' : 'glass-card p-6 sm:p-10'}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-10 lg:gap-14 items-center">
        <div className="max-w-lg">
          <h2 className="text-[24px] sm:text-[30px] font-bold tracking-tight text-primary leading-tight" style={{ textWrap: 'balance' }}>
            {t(noTrips ? 'budget.empty.noTripsTitle' : isViewer ? 'budget.empty.viewerTitle' : 'budget.empty.title')}
          </h2>
          <p className="mt-3 text-[15px] font-medium text-muted leading-relaxed" style={{ textWrap: 'pretty' }}>
            {t(noTrips ? 'budget.empty.noTripsLead' : 'budget.empty.lead')}
          </p>

          {noTrips && (
            <div className="mt-7"><PlanFirstTripButton /></div>
          )}

          {!isViewer && !noTrips && (
            <>
              <p className="mt-7 text-[13px] font-semibold text-muted">{t('budget.empty.quickStart')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const CatIcon = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onAdd(c.id)}
                      className="inline-flex items-center gap-2 rounded-2xl px-3.5 min-h-[44px] bg-page border border-gray-200/80 dark:border-white/10 text-[14px] font-semibold text-soft hover:bg-field hover:text-primary active:scale-[0.97] transition-all cursor-pointer"
                    >
                      <CatIcon size={16} strokeWidth={2.25} className={c.textClass} aria-hidden="true" />
                      {t('budget.categories.' + c.id)}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <button
                  type="button"
                  onClick={() => onAdd(null)}
                  className="inline-flex items-center gap-2 px-5 min-h-[44px] bg-accent text-white rounded-2xl text-[14px] font-semibold hover:bg-accent-hover shadow-[0_6px_16px_-8px_rgba(37,99,235,0.7)] active:scale-95 transition-all cursor-pointer"
                >
                  <Plus size={17} strokeWidth={2.5} /> {t('budget.addExpense')}
                </button>

                {editingTarget ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); onSaveTarget(); }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      autoFocus
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') onCancelTarget(); }}
                      placeholder={t('budget.target.placeholder')}
                      aria-label={t('budget.target.set')}
                      className="w-36 h-11 px-3 rounded-xl bg-field border border-default text-[16px] sm:text-[14px] font-semibold tabular-nums text-primary focus:outline-none focus:bg-page focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button type="submit" className="h-11 px-4 rounded-xl bg-ink text-white dark:text-gray-900 text-[14px] font-semibold cursor-pointer">
                      {t('budget.target.save')}
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={onEditTarget}
                    className="inline-flex items-center gap-1.5 min-h-[44px] text-[14px] font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    <Target size={16} strokeWidth={2.25} />
                    {budgetTarget
                      ? t('budget.empty.limitSet', { amount: formatCurrency(budgetTarget, currency, locale) })
                      : t('budget.empty.setLimit')}
                  </button>
                )}
              </div>
              {currencyControl && <div className="mt-2">{currencyControl}</div>}
            </>
          )}
        </div>

        {/* Náhled: jak rozpočet vypadá s daty */}
        <div className="relative" aria-hidden="true">
          <div className="absolute inset-x-5 -bottom-2.5 top-5 rounded-[1.5rem] bg-page/70 border border-gray-200/70 dark:border-white/5 rotate-[1.5deg]" />
          <div className="relative rounded-[1.5rem] bg-page border border-gray-200/80 dark:border-white/10 shadow-[0_1px_2px_rgba(17,24,39,0.04),0_24px_48px_-24px_rgba(17,24,39,0.18)] p-5 sm:p-6">
            <p className="text-[12px] font-semibold text-muted">{t('budget.empty.sample')}</p>
            <p className="mt-1 text-[15px] font-medium text-secondary">
              {t('tripDetail.notebook.spent')}{' '}
              <span className="text-[22px] font-bold text-primary tabular-nums">{amount(sampleTotal)}</span>
            </p>
            <div className="mt-3 h-2 rounded-full bg-subtle overflow-hidden flex">
              {SAMPLE_EXPENSES.map((e) => (
                <span key={e.id} className={`h-full ${catInfo(e.category).colorClass}`} style={{ width: `${(e.amount / sampleTotal) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-4 divide-y divide-gray-100 dark:divide-white/5">
              {SAMPLE_EXPENSES.map((e) => {
                const info = catInfo(e.category);
                const CatIcon = info.icon;
                return (
                  <li key={e.id} className="flex items-center gap-3 py-2.5">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${info.lightBgClass} ${info.textClass}`}>
                      <CatIcon size={15} strokeWidth={2.25} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-semibold text-primary truncate">{t(`budget.empty.samples.${e.id}.title`)}</span>
                      <span className="block text-[12px] font-medium text-muted truncate">
                        {t(`budget.empty.samples.${e.id}.paidBy`)} · {t('budget.empty.splitWays', { count: e.split })}
                      </span>
                    </span>
                    <span className="text-[14px] font-semibold tabular-nums text-primary whitespace-nowrap">{amount(e.amount)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-2 text-[13px] font-medium text-secondary">
              <HandCoins size={15} strokeWidth={2.25} className="text-success shrink-0" />
              <span className="truncate">{t('budget.empty.sampleSettle', { amount: amount(1840) })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Budget = ({ trips, onUpdateTrip, onChangeCurrency, hideHeader = false, addRequest = 0 }) => {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;

  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addCategory, setAddCategory] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [sortBy, setSortBy] = useState('date-desc');
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const trip = trips.find(tr => tr.id === selectedTripId);
  const expenses = trip?.expenses || [];
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const isViewer = trip?.role === 'viewer';
  const { confirmDialog, ModalPortal } = useDialog();
  // Všechny částky výletu jsou v jeho měně; hlavní měna jen u výletu bez ní.
  const { currency: mainCurrency } = useCurrency();
  const currency = trip?.currency || mainCurrency;
  const [currencyBusy, setCurrencyBusy] = useState(false);
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  // Trip members + simplified balances come from the backend balances endpoint.
  // Re-fetched whenever the selected trip or its expenses/splits change.
  const [balanceData, setBalanceData] = useState(null);
  // Bumped after a settlement to force a balances re-fetch (settling doesn't
  // change expenses, so the expenses signature alone wouldn't trigger it).
  const [settleVersion, setSettleVersion] = useState(0);
  const expensesSignature = JSON.stringify(
    expenses.map((e) => ({ a: e.amount, p: e.paidBy, s: e.splits }))
  );

  // Výdaje se mění optimisticky dřív, než je server uloží; vyrovnání se
  // proto načte znovu i s novou verzí výletu (po potvrzení uložení).
  useEffect(() => {
    if (!selectedTripId) { setBalanceData(null); return; }
    let cancelled = false;
    api.trips.getBalances(selectedTripId)
      .then((data) => { if (!cancelled) setBalanceData(data); })
      .catch(() => { /* keep previous data on transient errors */ });
    return () => { cancelled = true; };
  }, [selectedTripId, expensesSignature, settleVersion, trip?.version]);

  const refreshBalances = () => setSettleVersion((v) => v + 1);
  const members = balanceData?.members || [];
  // True once any expense is actually split among members — used to tell a
  // freshly settled trip ("all settled 🎉") apart from one with no shared spend.
  const hasSharedExpenses = expenses.some((e) => e.paidBy != null && (e.splits?.length > 0));

  const budgetTarget = trip?.budgetTarget || null;
  const remaining = budgetTarget !== null ? budgetTarget - total : null;
  const progress = budgetTarget ? Math.min((total / budgetTarget) * 100, 100) : 0;
  const progressColor = progress >= 100 ? 'bg-red-500' : progress >= 75 ? 'bg-amber-500' : 'bg-blue-500';

  const tripDays = trip
    ? Math.max(differenceInDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1, 1)
    : 1;
  const avgPerDay = total > 0 ? total / tripDays : 0;

  // Pacing
  const today = new Date();
  const tripEndDate = trip?.endDate ? parseISO(trip.endDate) : null;
  const tripStartDate = trip?.startDate ? parseISO(trip.startDate) : null;
  const elapsedDays = tripStartDate ? Math.max(differenceInDays(today, tripStartDate) + 1, 0) : 0;
  const clampedElapsed = Math.min(elapsedDays, tripDays);
  const daysRemaining = Math.max(tripDays - clampedElapsed, 0);
  const isTripComplete = tripEndDate ? today > tripEndDate : false;
  const projectedTotal = clampedElapsed > 0 && total > 0
    ? Math.round((total / clampedElapsed) * tripDays)
    : null;
  const paceStatus = budgetTarget && !isTripComplete && clampedElapsed > 0 && projectedTotal !== null
    ? (projectedTotal <= budgetTarget ? 'on-track' : 'over-pace')
    : null;

  // Filtering & sorting
  const filteredExpenses = expenses.filter(expense => {
    if (searchQuery && !expense.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;
    return true;
  });

  const isDateSort = sortBy === 'date-desc' || sortBy === 'date-asc';

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':    return new Date(a.date) - new Date(b.date);
      case 'amount-desc': return b.amount - a.amount;
      case 'amount-asc':  return a.amount - b.amount;
      default:            return new Date(b.date) - new Date(a.date);
    }
  });

  const dateGroupData = isDateSort ? (() => {
    const groups = {};
    sortedExpenses.forEach(expense => {
      const d = expense.date;
      if (!groups[d]) groups[d] = [];
      groups[d].push(expense);
    });
    const keys = Object.keys(groups).sort((a, b) =>
      sortBy === 'date-asc' ? a.localeCompare(b) : b.localeCompare(a)
    );
    return { groups, keys };
  })() : null;

  const formatGroupDate = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return t('budget.groupDate.today');
    if (isYesterday(date)) return t('budget.groupDate.yesterday');
    return format(date, 'EEEE, d MMMM', { locale: dateLocale });
  };

  // Handlers
  const handleAddExpense = (expense) => {
    onUpdateTrip({ ...trip, expenses: [...expenses, expense] });
  };

  const handleEditExpense = (updatedExpense) => {
    onUpdateTrip({
      ...trip,
      expenses: expenses.map(e => e.id === editingExpense.id ? { ...updatedExpense, id: editingExpense.id } : e),
    });
    setEditingExpense(null);
  };

  // Mazání bez potvrzování, stejně jako u výletů: výdaj hned zmizí a toast
  // (nebo Cmd/Ctrl+Z) ho vrátí i s dělením a původní měnou. Koš výdaje nemají.
  const handleDeleteExpense = (id) => {
    const expense = expenses.find(e => e.id === id);
    if (!trip || !expense) return;
    const tripId = trip.id;
    let toastId;

    const undoAction = {
      undo: async () => {
        clearUndo(undoAction);
        toast.dismiss(toastId);
        const saved = await deleteRequest;
        if (!saved) return;
        // Vrací se do aktuálního stavu výletu (mezitím mohly přibýt další
        // změny), ne do snímku z chvíle mazání.
        const fromProps = tripsRef.current.find(tr => tr.id === tripId);
        const latest = fromProps && (fromProps.version ?? 0) >= (saved.version ?? 0) ? fromProps : saved;
        try {
          await onUpdateTrip({ ...latest, expenses: [...(latest.expenses || []), expense] });
          toast.success(t('budget.delete.restored'));
        } catch {
          // chybu ukázal DashboardHome
        }
      },
    };

    // Uložený výlet po smazání, nebo null, když se smazání nepovedlo (pak
    // výdaj zůstal a vrácení nemá smysl).
    const deleteRequest = Promise.resolve(onUpdateTrip({ ...trip, expenses: expenses.filter(e => e.id !== id) }))
      .then((savedTrip) => savedTrip || { ...trip, expenses: expenses.filter(e => e.id !== id) })
      .catch(() => {
        clearUndo(undoAction);
        toast.dismiss(toastId);
        return null;
      });

    pushUndo(undoAction);
    toastId = showUndoToast({
      title: expense.description,
      message: t('budget.delete.deleted', { amount: formatCurrency(expense.amount, currency, i18n.language) }),
      undoLabel: t('dashboardHome.undo'),
      onUndo: () => undoAction.undo(),
    });
  };

  // Změna měny výletu: s výdaji nebo limitem se zeptá, jestli částky
  // přepočítat kurzem ECB, nebo jen opravit špatně zvolenou měnu.
  const handleChangeCurrency = async (next) => {
    if (!trip || !onChangeCurrency) return;
    let convert = false;
    if (expenses.length > 0 || budgetTarget) {
      const result = await confirmDialog({
        title: t('budget.currency.changeTitle', { currency: next }),
        message: t('budget.currency.changeMessage', { from: currency, to: next }),
        confirmLabel: t('budget.currency.convert'),
        cancelLabel: t('budget.currency.relabel'),
      });
      if (result === null) return;
      convert = result === true;
    }
    setCurrencyBusy(true);
    try {
      await onChangeCurrency(trip, next, convert);
      toast.success(t(convert ? 'budget.currency.converted' : 'budget.currency.changed', { currency: next }));
    } catch {
      // chybu ukázal DashboardHome
    } finally {
      setCurrencyBusy(false);
    }
  };
  const currencyControl = !isViewer && onChangeCurrency ? (
    <TripCurrencyControl
      currency={currency}
      mainCurrency={mainCurrency}
      onChange={handleChangeCurrency}
      busy={currencyBusy}
    />
  ) : null;

  const tripsRef = useRef(trips);
  tripsRef.current = trips;

  const handleSaveTarget = () => {
    const value = parseFloat(targetInput);
    if (targetInput === '') {
      onUpdateTrip({ ...trip, budgetTarget: null });
    } else if (!isNaN(value) && value > 0) {
      onUpdateTrip({ ...trip, budgetTarget: value });
    }
    setEditingTarget(false);
  };

  // Detail výletu otevírá přidání výdaje zvenku (rychlé „+ Výdaj“ na mobilu):
  // každé zvýšení čítače = jedno otevření formuláře.
  useEffect(() => {
    if (addRequest > 0 && !isViewer) setIsAddModalOpen(true);
  }, [addRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  const modalOpen = isAddModalOpen || !!editingExpense;
  const closeModal = () => { setIsAddModalOpen(false); setEditingExpense(null); setAddCategory(null); };
  const openAdd = (category = null) => { setAddCategory(category); setIsAddModalOpen(true); };

  const rowProps = {
    currency,
    locale: i18n.language,
    isViewer,
    shouldReduceMotion,
    t,
    dateLocale,
    onEdit: setEditingExpense,
    onDelete: handleDeleteExpense,
  };

  // ── Vložený rozpočet (stránka výletu): jedna stránka s oddíly, žádné karty ──
  const categoryRows = CATEGORIES
    .map(c => ({ ...c, amount: expenses.filter(e => e.category === c.id).reduce((sum, e) => sum + e.amount, 0) }))
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const maxCategory = categoryRows[0]?.amount || 1;
  const dayNumberOf = (dateStr) => {
    if (!trip?.startDate) return null;
    const n = differenceInDays(parseISO(dateStr), parseISO(trip.startDate)) + 1;
    return n >= 1 && n <= tripDays ? n : null;
  };
  const sectionTitle = 'text-[18px] font-bold tracking-tight text-primary';
  const ledgerControl = 'h-10 bg-field border border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-colors font-medium text-base sm:text-[14px] text-primary';

  const embeddedSections = (
    <>
      {categoryRows.length > 0 && (
        <section className="pt-10">
          <h3 className={sectionTitle}>{t('budget.breakdown')}</h3>
          <ul className="mt-3">
            {categoryRows.map((c) => {
              const CatIcon = c.icon;
              const isActive = categoryFilter === c.id;
              const isDimmed = categoryFilter !== 'all' && !isActive;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setCategoryFilter(isActive ? 'all' : c.id)}
                    className={`w-full grid grid-cols-[minmax(0,8.5rem)_1fr_auto] sm:grid-cols-[11rem_1fr_7.5rem_3rem] items-center gap-3 sm:gap-5 py-2.5 px-3 -mx-3 rounded-xl text-left transition-[background-color,opacity] cursor-pointer ${
                      isActive ? 'bg-subtle' : 'hover:bg-field'
                    } ${isDimmed ? 'opacity-45' : ''}`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0 text-[14px] font-medium text-gray-700 dark:text-gray-200">
                      <CatIcon size={16} strokeWidth={2.25} className={`shrink-0 ${c.textClass}`} aria-hidden="true" />
                      <span className="truncate">{t('budget.categories.' + c.id)}</span>
                    </span>
                    <span className="h-2 rounded-full bg-subtle overflow-hidden" aria-hidden="true">
                      <span className={`block h-full rounded-full ${c.colorClass}`} style={{ width: `${(c.amount / maxCategory) * 100}%` }} />
                    </span>
                    <span className="text-right text-[14px] font-semibold tabular-nums text-primary whitespace-nowrap">
                      {formatCurrency(c.amount, currency, i18n.language)}
                    </span>
                    <span className="hidden sm:block text-right text-[13px] font-medium tabular-nums text-muted">
                      {Math.round((c.amount / total) * 100)} %
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Balances
        balanceData={balanceData}
        currency={currency}
        locale={i18n.language}
        currentUserId={currentUserId}
        tripId={selectedTripId}
        hasSharedExpenses={hasSharedExpenses}
        onSettled={refreshBalances}
        t={t}
        embedded
      />

      <section className="pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className={sectionTitle}>
            {t('budget.history')}
            {filteredExpenses.length > 0 && <span className="ml-2 text-muted font-medium tabular-nums">· {filteredExpenses.length}</span>}
          </h3>
          {expenses.length > 0 && (
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
                <input
                  type="text"
                  aria-label={t('budget.search.placeholder')}
                  placeholder={t('tripDetail.notebook.searchExpenses')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${ledgerControl} w-full pl-9 pr-3 placeholder:text-gray-500`}
                />
              </div>
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label={t('budget.sort.dateDesc')}
                  className={`${ledgerControl} pl-3 pr-9 appearance-none cursor-pointer dark:bg-[#1C1C1E]`}
                >
                  <option value="date-desc">{t('budget.sort.dateDesc')}</option>
                  <option value="date-asc">{t('budget.sort.dateAsc')}</option>
                  <option value="amount-desc">{t('budget.sort.amountDesc')}</option>
                  <option value="amount-asc">{t('budget.sort.amountAsc')}</option>
                </select>
                <ChevronRight size={14} strokeWidth={2.5} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-500 pointer-events-none" aria-hidden="true" />
              </div>
            </div>
          )}
        </div>

        {(categoryFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}
            className="mt-3 inline-flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-full bg-subtle text-[13px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/15 transition-colors cursor-pointer"
          >
            {categoryFilter !== 'all' ? t('budget.categories.' + categoryFilter) : `„${searchQuery}“`}
            <X size={14} strokeWidth={2.5} aria-label={t('budget.filter.reset')} />
          </button>
        )}

        {sortedExpenses.length > 0 ? (
          isDateSort && dateGroupData ? (
            <div className="mt-4 space-y-7">
              {dateGroupData.keys.map(dateKey => {
                const dayExpenses = dateGroupData.groups[dateKey];
                const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
                const dayNo = dayNumberOf(dateKey);
                return (
                  <div key={dateKey}>
                    <div className="flex items-baseline justify-between gap-3 pb-2 border-b border-default">
                      <span className="text-[14px] font-semibold text-primary first-letter:uppercase">
                        {formatGroupDate(dateKey)}
                        {dayNo && <span className="ml-2 font-medium text-muted">· {t('tripDetail.notebook.dayTitlePlaceholder', { n: dayNo })}</span>}
                      </span>
                      <span className="text-[14px] font-semibold tabular-nums text-soft whitespace-nowrap">
                        {formatCurrency(dayTotal, currency, i18n.language)}
                      </span>
                    </div>
                    {dayExpenses.map(expense => (
                      <ExpenseRow key={expense.id} expense={expense} compact flush {...rowProps} />
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 border-t border-default">
              {sortedExpenses.map(expense => (
                <ExpenseRow key={expense.id} expense={expense} compact flush {...rowProps} />
              ))}
            </div>
          )
        ) : expenses.length > 0 ? (
          <p className="py-10 text-center text-[15px] font-medium text-muted">{t('budget.empty.noResults')}</p>
        ) : (
          <div className="py-10 text-center">
            <p className="text-[16px] font-semibold text-primary">{t('budget.empty.noExpenses')}</p>
            <p className="mt-1 text-[14px] text-muted max-w-xs mx-auto">{t('budget.empty.noExpensesDesc')}</p>
          </div>
        )}
      </section>
    </>
  );

  return (
    <div className={`w-full ${hideHeader ? 'budget-embedded' : 'space-y-5 sm:space-y-6 pb-10'}`}>
      {ModalPortal}

      <AddExpenseModal
        isOpen={modalOpen}
        onClose={closeModal}
        onAdd={editingExpense ? handleEditExpense : handleAddExpense}
        currency={currency}
        tripId={trip?.id}
        tripRange={{ start: trip?.startDate, end: trip?.endDate }}
        initialExpense={editingExpense}
        initialCategory={addCategory}
        members={members}
        currentUserId={currentUserId}
      />

      {/* Standalone page header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-8 mb-2">
          <div className="space-y-1">
            <p className="text-[11px] sm:text-[12px] text-muted font-medium">{t('budget.subtitle')}</p>
            <h1 className="text-3xl sm:text-4xl text-primary tracking-tight font-bold">{t('budget.title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            {trips.length > 1 && (
              <div className="relative flex-1 sm:flex-none min-w-0">
                <select
                  value={selectedTripId || ''}
                  onChange={e => setSelectedTripId(e.target.value)}
                  className="glass-input cursor-pointer appearance-none pr-12"
                >
                  {trips.map(tr => (
                    <option key={tr.id} value={tr.id} className="text-primary dark:bg-[#1C1C1E]">
                      {tr.title}
                    </option>
                  ))}
                </select>
                <ChevronRight size={18} strokeWidth={2.5} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
              </div>
            )}
            {trip && !isViewer && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-6 py-3.5 bg-accent text-white rounded-2xl font-bold hover:bg-accent-hover transition-colors shrink-0 shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer text-[14px]"
              >
                <Plus size={18} strokeWidth={2.5} /> {t('budget.addExpense')}
              </button>
            )}
          </div>
        </div>
      )}

      {trips.length === 0 ? (
        <BudgetEmptyState noTrips embedded={hideHeader} currency={currency} locale={i18n.language} t={t} />
      ) : trip && expenses.length === 0 ? (
        <BudgetEmptyState
          embedded={hideHeader}
          isViewer={isViewer}
          onAdd={openAdd}
          currency={currency}
          locale={i18n.language}
          t={t}
          budgetTarget={budgetTarget}
          editingTarget={editingTarget}
          targetInput={targetInput}
          setTargetInput={setTargetInput}
          onEditTarget={() => { setTargetInput(budgetTarget ? String(budgetTarget) : ''); setEditingTarget(true); }}
          onSaveTarget={handleSaveTarget}
          onCancelTarget={() => setEditingTarget(false)}
          currencyControl={currencyControl}
        />
      ) : trip ? (
        <>
          {/* ── Shrnutí (vložené do stránky výletu): věta, ne metrikový panel ── */}
          {hideHeader ? (
            <div className="pb-2">
              <p className="text-[18px] sm:text-[22px] font-medium text-secondary leading-snug">
                {t('tripDetail.notebook.spent')}{' '}
                <span className="font-bold text-primary tabular-nums whitespace-nowrap">{formatCurrency(total, currency, i18n.language)}</span>
                {budgetTarget && (
                  <> {t('tripDetail.notebook.of')} <span className="tabular-nums whitespace-nowrap">{formatCurrency(budgetTarget, currency, i18n.language)}</span></>
                )}
              </p>
              {budgetTarget && (
                <div className="mt-3 max-w-xl">
                  <div className="h-2 bg-subtle rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${progressColor} transition-[width] duration-700 ease-out`} style={{ width: `${progress}%` }} />
                  </div>
                  <p className={`mt-2 text-[13px] font-medium ${remaining !== null && remaining < 0 ? 'text-danger' : 'text-gray-600 dark:text-gray-400'}`}>
                    {Math.round(progress)} % · {remaining !== null && remaining >= 0
                      ? t('budget.summary.remainingAmount', { amount: formatCurrency(remaining, currency, i18n.language) })
                      : t('budget.target.over')}
                  </p>
                </div>
              )}
              <dl className="mt-5 grid grid-cols-3 gap-x-3 sm:flex sm:flex-wrap sm:gap-x-8 gap-y-3 text-[13px] sm:text-[14px]">
                <div>
                  <dt className="text-muted">{t('budget.summary.avgPerDay')}</dt>
                  <dd className="font-semibold text-primary tabular-nums">{avgPerDay > 0 ? formatCurrency(Math.round(avgPerDay), currency, i18n.language) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted">{t('budget.summary.daysLeft')}</dt>
                  <dd className="font-semibold text-primary tabular-nums">{daysRemaining}</dd>
                </div>
                {projectedTotal !== null && budgetTarget && (
                  <div>
                    <dt className="text-muted">{t('budget.summary.projected')}</dt>
                    <dd className={`font-semibold tabular-nums ${projectedTotal > budgetTarget ? 'text-danger' : 'text-success'}`}>{formatCurrency(projectedTotal, currency, i18n.language)}</dd>
                  </div>
                )}
              </dl>
              {!isViewer && (
                editingTarget ? (
                  <div className="flex items-center gap-2 mt-4 max-w-sm">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={targetInput}
                      onChange={e => setTargetInput(e.target.value)}
                      placeholder={t('budget.target.placeholder')}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveTarget(); if (e.key === 'Escape') setEditingTarget(false); }}
                      className="flex-1 min-w-0 glass-input py-2.5 text-base sm:text-sm"
                      autoFocus
                    />
                    <button onClick={handleSaveTarget} aria-label={t('budget.target.save')} className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center hover:bg-accent-hover transition-colors cursor-pointer shrink-0">
                      <Check size={15} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => setEditingTarget(false)} aria-label={t('budget.addModal.close')} className="w-10 h-10 bg-subtle text-gray-600 dark:text-gray-400 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors cursor-pointer shrink-0">
                      <X size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setTargetInput(budgetTarget ? String(budgetTarget) : ''); setEditingTarget(true); }}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-600 dark:text-gray-400 hover:text-accent transition-colors cursor-pointer mt-4 min-h-[40px] sm:min-h-0"
                  >
                    <Target size={14} strokeWidth={2} />
                    {budgetTarget ? t('budget.target.edit') : t('budget.target.set')}
                  </button>
                )
              )}
              {currencyControl}
            </div>
          ) : (
          <div className="glass-card p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

              {/* Left: total + progress + target */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
                  <p className="text-[13px] font-semibold text-muted mt-0.5">
                    {t('budget.summary.total')}
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                    <AnimatePresence>
                      {paceStatus === 'on-track' && (
                        <motion.span
                          key="on-track"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-success bg-success-wash px-3 py-1.5 rounded-full shrink-0"
                        >
                          <TrendingUp size={11} strokeWidth={2.5} /> {t('budget.pacing.onTrack')}
                        </motion.span>
                      )}
                      {paceStatus === 'over-pace' && (
                        <motion.span
                          key="over-pace"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-danger bg-danger-wash px-3 py-1.5 rounded-full shrink-0"
                        >
                          <TrendingDown size={11} strokeWidth={2.5} /> {t('budget.pacing.overPace')}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-baseline gap-3 mb-4 sm:mb-5 flex-wrap">
                  <p className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-primary leading-none">
                    {formatCurrency(total, currency, i18n.language)}
                  </p>
                  {budgetTarget && (
                    <p className="text-lg sm:text-xl font-semibold text-gray-400 dark:text-gray-500">
                      / {formatCurrency(budgetTarget, currency, i18n.language)}
                    </p>
                  )}
                </div>

                {budgetTarget && (
                  <div className="space-y-2 mb-4 sm:mb-5">
                    <div className="h-2 bg-subtle rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${progressColor}`}
                        initial={shouldReduceMotion ? false : { width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <div className="flex justify-between text-[12px] font-medium">
                      <span className="text-gray-400 dark:text-gray-500">
                        {Math.round(progress)}% {t('budget.summary.used')}
                      </span>
                      <span className={remaining !== null && remaining < 0 ? 'text-red-500 font-bold' : 'text-muted'}>
                        {remaining !== null && remaining >= 0
                          ? t('budget.summary.remainingAmount', { amount: formatCurrency(remaining, currency, i18n.language) })
                          : t('budget.target.over')
                        }
                      </span>
                    </div>
                  </div>
                )}

                {!isViewer && (
                  editingTarget ? (
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={targetInput}
                        onChange={e => setTargetInput(e.target.value)}
                        placeholder={t('budget.target.placeholder')}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveTarget(); if (e.key === 'Escape') setEditingTarget(false); }}
                        className="flex-1 min-w-0 glass-input py-2.5 text-base sm:text-sm"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveTarget}
                        aria-label={t('budget.target.save')}
                        className="w-10 h-10 sm:w-9 sm:h-9 bg-accent text-white rounded-xl flex items-center justify-center hover:bg-accent-hover transition-colors cursor-pointer shrink-0"
                      >
                        <Check size={15} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => setEditingTarget(false)}
                        aria-label={t('budget.addModal.close')}
                        className="w-10 h-10 sm:w-9 sm:h-9 bg-subtle text-muted rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors cursor-pointer shrink-0"
                      >
                        <X size={15} strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setTargetInput(budgetTarget ? String(budgetTarget) : ''); setEditingTarget(true); }}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer mt-2 min-h-[40px] sm:min-h-0"
                    >
                      <Target size={13} strokeWidth={2} />
                      {budgetTarget ? t('budget.target.edit') : t('budget.target.set')}
                    </button>
                  )
                )}
                {currencyControl}
              </div>

              {/* Right: stats */}
              <div className="flex flex-row lg:flex-col gap-6 sm:gap-8 border-t lg:border-t-0 lg:border-l border-subtle pt-5 lg:pt-0 lg:pl-10 flex-wrap sm:flex-nowrap lg:shrink-0">
                <div>
                  <p className="text-[12px] text-muted font-medium mb-1">
                    {t('budget.summary.avgPerDay')}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
                    {avgPerDay > 0 ? formatCurrency(Math.round(avgPerDay), currency, i18n.language) : '—'}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {t('budget.summary.overDays', { count: tripDays })}
                  </p>
                </div>

                <div>
                  <p className="text-[12px] text-muted font-medium mb-1">
                    {t('budget.summary.daysLeft')}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
                    {daysRemaining}
                  </p>
                </div>

                {projectedTotal !== null && budgetTarget && (
                  <div>
                    <p className="text-[12px] text-muted font-medium mb-1">
                      {t('budget.summary.projected')}
                    </p>
                    <p className={`text-xl sm:text-2xl font-bold tracking-tight ${projectedTotal > budgetTarget ? 'text-danger' : 'text-success'}`}>
                      {formatCurrency(projectedTotal, currency, i18n.language)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {hideHeader ? embeddedSections : (
          <>
          {/* ── Balances (shared expense splitting) ── */}
          <Balances
            balanceData={balanceData}
            currency={currency}
            locale={i18n.language}
            currentUserId={currentUserId}
            tripId={selectedTripId}
            hasSharedExpenses={hasSharedExpenses}
            onSettled={refreshBalances}
            t={t}
          />

          {/* ── Category Breakdown ── */}
          {expenses.length > 0 && (
            <div className="glass-card p-5 sm:p-8">
              <h3 className="font-bold text-primary text-[15px] sm:text-lg mb-4 sm:mb-6 flex items-center gap-3">
                <div className="w-9 h-9 bg-active text-accent rounded-xl flex items-center justify-center shrink-0">
                  <TrendingUp size={16} strokeWidth={2} />
                </div>
                {t('budget.breakdown')}
              </h3>
              <CategoryBar
                expenses={expenses}
                currency={currency}
                locale={i18n.language}
                onCategoryClick={setCategoryFilter}
                activeCategory={categoryFilter}
              />
            </div>
          )}

          {/* ── Expense List ── */}
          <div className="space-y-3 sm:space-y-4">
            {expenses.length > 0 && (
              <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={t('budget.search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-base sm:text-[14px] text-primary"
                  />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full sm:w-auto pl-3 pr-9 py-2.5 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-base sm:text-[14px] appearance-none cursor-pointer text-primary dark:bg-[#1C1C1E]"
                    >
                      <option value="all">{t('budget.categories.all')}</option>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{t('budget.categories.' + c.id)}</option>)}
                    </select>
                    <ChevronRight size={14} strokeWidth={2.5} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full sm:w-auto pl-3 pr-9 py-2.5 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-base sm:text-[14px] appearance-none cursor-pointer text-primary dark:bg-[#1C1C1E]"
                    >
                      <option value="date-desc">{t('budget.sort.dateDesc')}</option>
                      <option value="date-asc">{t('budget.sort.dateAsc')}</option>
                      <option value="amount-desc">{t('budget.sort.amountDesc')}</option>
                      <option value="amount-asc">{t('budget.sort.amountAsc')}</option>
                    </select>
                    <ChevronRight size={14} strokeWidth={2.5} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                  </div>
                  {(searchQuery || categoryFilter !== 'all') && (
                    <button
                      onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}
                      aria-label={t('budget.filter.reset')}
                      className="flex items-center gap-1 text-[13px] font-bold text-muted hover:text-primary hover:bg-subtle rounded-xl px-3 py-2.5 transition-all shrink-0 cursor-pointer"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pb-1">
              <h3 className="text-[12px] font-semibold text-muted">{t('budget.history')}</h3>
              {filteredExpenses.length > 0 && (
                <span className="px-2.5 py-1 bg-subtle rounded-full text-[11px] font-bold text-muted">
                  {filteredExpenses.length} {t('budget.items')}
                </span>
              )}
            </div>

            {sortedExpenses.length > 0 ? (
              isDateSort && dateGroupData ? (
                /* Date-grouped view */
                <div className="space-y-3">
                  {dateGroupData.keys.map(dateKey => {
                    const dayExpenses = dateGroupData.groups[dateKey];
                    const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
                    return (
                      <div key={dateKey} className="glass-card overflow-hidden">
                        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100/70 dark:border-white/[0.06]">
                          <span className="text-[13px] font-bold text-primary">{formatGroupDate(dateKey)}</span>
                          <span className="text-[13px] font-semibold tabular-nums text-secondary">
                            {formatCurrency(dayTotal, currency, i18n.language)}
                          </span>
                        </div>
                        <div>
                          {dayExpenses.map(expense => (
                            <ExpenseRow key={expense.id} expense={expense} compact {...rowProps} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Flat list (amount sort) */
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {sortedExpenses.map(expense => (
                    <ExpenseRow key={expense.id} expense={expense} {...rowProps} />
                  ))}
                </div>
              )
            ) : expenses.length > 0 ? (
              <div className="text-center py-10 glass-card">
                <p className="font-bold text-xl text-primary tracking-tight mb-2">{t('budget.empty.noResults')}</p>
                <p className="text-[14px] text-muted">{t('budget.empty.noResultsDesc')}</p>
              </div>
            ) : (
              <div className="glass-card p-10 sm:p-14 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-active rounded-2xl flex items-center justify-center mb-4">
                  <Wallet className="text-blue-500 dark:text-blue-400" size={26} strokeWidth={1.5} />
                </div>
                <p className="font-bold text-xl text-primary tracking-tight mb-2">{t('budget.empty.noExpenses')}</p>
                <p className="text-[14px] text-muted max-w-xs mb-6">{t('budget.empty.noExpensesDesc')}</p>
                {!isViewer && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-bold hover:bg-accent-hover transition-colors shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer text-[14px]"
                  >
                    <Plus size={18} strokeWidth={2.5} /> {t('budget.addExpense')}
                  </button>
                )}
              </div>
            )}
          </div>
          </>
          )}
        </>
      ) : null}

      {/* Standalone mobile FAB */}
      {!hideHeader && trip && !isViewer && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          aria-label={t('budget.addExpense')}
          className="sm:hidden fixed bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+5rem)] right-4 z-[100] w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(37,99,235,0.4)] active:scale-90 transition-transform cursor-pointer"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default Budget;
