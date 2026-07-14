import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Trash2, TrendingUp, TrendingDown, Calendar, Car, Home, Utensils,
  Palmtree, MoreHorizontal, ChevronRight, Wallet, X, Search, Pencil, Check, Target,
  Scale, ArrowRight, Split, HandCoins, Copy, CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { format, differenceInDays, isToday, isYesterday, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import toast from 'react-hot-toast';
import CharCount from '../ui/CharCount';
import { useTranslation } from 'react-i18next';
import { useDialog } from '../ui/DialogModal';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import UserAvatar from '../ui/UserAvatar';

const formatCurrency = (amount, currency, locale = 'en') => {
  const symbols = { CZK: 'Kč', EUR: '€', USD: '$', GBP: '£' };
  const symbol = symbols[currency] || currency;
  return `${amount.toLocaleString(locale)} ${symbol}`;
};

const CATEGORIES = [
  { id: 'transport',      icon: Car,          colorClass: 'bg-blue-500',    lightBgClass: 'bg-blue-50 dark:bg-blue-500/10',     textClass: 'text-blue-600 dark:text-blue-400' },
  { id: 'accommodation',  icon: Home,         colorClass: 'bg-purple-500',  lightBgClass: 'bg-purple-50 dark:bg-purple-500/10', textClass: 'text-purple-600 dark:text-purple-400' },
  { id: 'food',           icon: Utensils,     colorClass: 'bg-orange-500',  lightBgClass: 'bg-orange-50 dark:bg-orange-500/10', textClass: 'text-orange-600 dark:text-orange-400' },
  { id: 'activities',     icon: Palmtree,     colorClass: 'bg-emerald-500', lightBgClass: 'bg-emerald-50 dark:bg-emerald-500/10', textClass: 'text-emerald-600 dark:text-emerald-400' },
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
            className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8 shadow-2xl z-10 max-h-[85dvh] overflow-y-auto overscroll-contain"
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                  <HandCoins size={17} strokeWidth={2} />
                </div>
                <h3 id="settle-title" className="font-bold text-xl sm:text-2xl tracking-tight text-gray-900 dark:text-white truncate">
                  {t('budget.settle.title')}
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label={t('budget.addModal.close')}
                className="w-10 h-10 sm:w-9 sm:h-9 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
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
              <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/10 p-4 mb-7">
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('budget.settle.sendMoneyTo')}</p>
                <div className="flex items-center gap-3">
                  <span className="flex-1 font-mono text-[15px] sm:text-[16px] font-semibold text-gray-900 dark:text-white tracking-tight break-all select-all">
                    {bankAccount}
                  </span>
                  <button
                    onClick={handleCopy}
                    aria-label={t('budget.settle.copyAccount')}
                    className="shrink-0 w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
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
const Balances = ({ balanceData, currency, locale, currentUserId, tripId, hasSharedExpenses, onSettled, t }) => {
  const [settleTarget, setSettleTarget] = useState(null);
  const members = balanceData?.members || [];
  if (members.length <= 1) return null;

  const memberById = (id) => members.find((m) => Number(m.id) === Number(id));
  const balances = balanceData?.balances || [];
  const settlements = balanceData?.settlements || [];

  return (
    <div className="glass-card p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-1.5">
        <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
          <Scale size={16} strokeWidth={2} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-[15px] sm:text-lg leading-tight">{t('budget.balances.title')}</h3>
          <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400 font-medium">{t('budget.balances.subtitle')}</p>
        </div>
      </div>

      {!hasSharedExpenses ? (
        <div className="mt-5 flex flex-col items-center justify-center text-center py-6">
          <p className="text-[14px] font-semibold text-gray-500 dark:text-gray-400">{t('budget.balances.empty')}</p>
        </div>
      ) : (
        <>
          {/* Per-member net chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5">
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
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-500 dark:text-red-400';
              return (
                <div
                  key={b.userId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/70 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
                >
                  <UserAvatar user={toAvatarUser(m)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate leading-tight">
                      {isMe ? t('budget.balances.you') : getMemberName(m)}
                    </p>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-tight mt-0.5">{label}</p>
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
            <div className="mt-5 flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20">
              <CheckCircle2 size={18} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[14px] font-bold text-emerald-700 dark:text-emerald-300">{t('budget.balances.allSettled')}</span>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{t('budget.balances.toSettle')}</p>
              <div className="space-y-2">
                {settlements.map((s, i) => {
                  const from = memberById(s.from);
                  const to = memberById(s.to);
                  const fromMe = Number(s.from) === Number(currentUserId);
                  const toMe = Number(s.to) === Number(currentUserId);
                  return (
                    <div
                      key={i}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar user={toAvatarUser(from)} size="sm" />
                        <span className={`text-[13px] font-semibold truncate ${fromMe ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                          {fromMe ? t('budget.balances.you') : getMemberName(from)}
                        </span>
                      </div>
                      <ArrowRight size={15} strokeWidth={2.5} className="text-gray-300 dark:text-gray-600 shrink-0" />
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar user={toAvatarUser(to)} size="sm" />
                        <span className={`text-[13px] font-semibold truncate ${toMe ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                          {toMe ? t('budget.balances.you') : getMemberName(to)}
                        </span>
                      </div>
                      <div className="ml-auto flex items-center gap-2 shrink-0">
                        <span className="font-bold text-[14px] tracking-tight tabular-nums text-gray-900 dark:text-white">
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
const ExpenseRow = ({ expense, compact = false, currency, locale, isViewer, shouldReduceMotion, t, dateLocale, onEdit, onDelete }) => {
  const cat = catInfo(expense.category);
  const Icon = cat.icon;

  if (compact) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 border-b border-gray-100/70 dark:border-white/[0.05] last:border-0 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors group"
      >
        <div className={`w-8 h-8 sm:w-9 sm:h-9 ${cat.lightBgClass} ${cat.textClass} rounded-[0.65rem] flex items-center justify-center shrink-0`}>
          <Icon size={14} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-0.5 leading-none">{t('budget.categories.' + expense.category)}</p>
          <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate leading-tight">{expense.description}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <p className="font-bold text-[15px] tracking-tight tabular-nums text-gray-900 dark:text-white">
            {formatCurrency(expense.amount, currency, locale)}
          </p>
          {!isViewer && (
            <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(expense)}
                aria-label={t('budget.expenseEdit')}
                className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer"
              >
                <Pencil size={13} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => onDelete(expense.id)}
                aria-label={t('budget.expenseDelete')}
                className="w-10 h-10 md:w-7 md:h-7 flex items-center justify-center text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
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
          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate tracking-tight leading-tight mb-1.5">{expense.description}</p>
          {expense.date && (
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 dark:text-gray-400">
              <Calendar size={13} strokeWidth={2} />
              {format(parseISO(expense.date), 'd. MMMM yyyy', { locale: dateLocale })}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center sm:items-end justify-between sm:flex-col shrink-0 gap-2 border-t sm:border-t-0 border-gray-100 dark:border-white/5 pt-4 sm:pt-0">
        <span className="font-bold text-2xl tracking-tight tabular-nums text-gray-900 dark:text-white">{formatCurrency(expense.amount, currency, locale)}</span>
        {!isViewer && (
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onEdit(expense)}
              aria-label={t('budget.expenseEdit')}
              className="flex items-center gap-1.5 text-[12px] sm:text-[11px] font-medium text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all px-3.5 py-2.5 sm:px-0 sm:py-0 rounded-full sm:rounded-none bg-gray-100/70 dark:bg-white/[0.06] sm:bg-transparent dark:sm:bg-transparent cursor-pointer"
            >
              <Pencil size={13} strokeWidth={2} aria-hidden="true" />
              <span className="sm:hidden">{t('budget.expenseEdit')}</span>
            </button>
            <button
              onClick={() => onDelete(expense.id)}
              className="flex items-center gap-1.5 text-[12px] sm:text-[11px] font-medium text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all px-3.5 py-2.5 sm:px-0 sm:py-0 rounded-full sm:rounded-none bg-gray-100/70 dark:bg-white/[0.06] sm:bg-transparent dark:sm:bg-transparent cursor-pointer"
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
    <div className="space-y-5 sm:space-y-6">
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
              className={`flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                isActive
                  ? `${c.lightBgClass} ring-1 ring-current ${c.textClass}`
                  : 'hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-2.5 h-2.5 ${c.colorClass} rounded-full shrink-0`} />
                <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium truncate">
                  {t('budget.categories.' + c.id)}
                </span>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="font-bold text-[13px] tracking-tight tabular-nums text-gray-900 dark:text-white">
                  {formatCurrency(c.amount, currency, locale)}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{c.percent.toFixed(0)}%</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Add / Edit Expense Modal ─── */
const AddExpenseModal = ({ isOpen, onClose, onAdd, currency, tripRange, initialExpense = null, members = [], currentUserId = null }) => {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;
  const modalRef = useRef(null);
  const isEditing = !!initialExpense;
  const canSplit = members.length > 1;

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
  });
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setShowCalendar(false);

    const allParticipants = {};
    members.forEach((m) => { allParticipants[m.id] = true; });

    if (initialExpense) {
      const hasSplit = initialExpense.paidBy != null && (initialExpense.splits?.length > 0);
      const participants = {};
      const customAmounts = {};
      members.forEach((m) => { participants[m.id] = false; customAmounts[m.id] = ''; });
      (initialExpense.splits || []).forEach((s) => {
        participants[s.userId] = true;
        customAmounts[s.userId] = String(s.amount);
      });
      // Detect whether the saved split was an even share or custom amounts.
      const partIds = (initialExpense.splits || []).map((s) => s.userId);
      const even = computeEqualSplits(partIds, parseFloat(initialExpense.amount));
      const isEqual = partIds.length > 0 && even.every((e) => {
        const match = (initialExpense.splits || []).find((s) => Number(s.userId) === Number(e.userId));
        return match && Math.abs(match.amount - e.amount) < 0.01;
      });
      setForm({
        description: initialExpense.description,
        amount: String(initialExpense.amount),
        category: initialExpense.category,
        date: initialExpense.date,
        paidBy: initialExpense.paidBy ?? currentUserId,
        isPersonal: !hasSplit,
        splitMode: isEqual ? 'equal' : 'custom',
        participants: hasSplit ? participants : allParticipants,
        customAmounts,
      });
    } else {
      setForm({
        description: '',
        amount: '',
        category: 'transport',
        date: new Date().toISOString().split('T')[0],
        paidBy: currentUserId,
        isPersonal: false,
        splitMode: 'equal',
        participants: allParticipants,
        customAmounts: {},
      });
    }
  }, [isOpen, initialExpense, members, currentUserId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const modal = modalRef.current;
    const focusable = modal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
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
  const amountNum = parseFloat(form.amount) || 0;
  const equalSplits = computeEqualSplits(selectedIds, amountNum);
  const equalShareFor = (id) => equalSplits.find((s) => Number(s.userId) === Number(id))?.amount ?? 0;
  const customSum = selectedIds.reduce((sum, id) => sum + (parseFloat(form.customAmounts[id]) || 0), 0);

  const toggleParticipant = (id) =>
    setForm((f) => ({ ...f, participants: { ...f.participants, [id]: !f.participants[id] } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description || !form.amount || parseFloat(form.amount) <= 0) {
      toast.error(t('budget.addModal.error'));
      return;
    }

    const amount = parseFloat(form.amount);
    let paidBy = null;
    let splits = [];

    if (canSplit && !form.isPersonal) {
      const participantIds = members.filter((m) => form.participants[m.id]).map((m) => m.id);
      if (participantIds.length === 0) {
        toast.error(t('budget.addModal.splitError'));
        return;
      }
      if (form.splitMode === 'equal') {
        splits = computeEqualSplits(participantIds, amount);
      } else {
        splits = participantIds.map((id) => ({ userId: id, amount: parseFloat(form.customAmounts[id]) || 0 }));
        const sum = splits.reduce((s, x) => s + x.amount, 0);
        if (Math.abs(sum - amount) > 0.01) {
          toast.error(t('budget.addModal.splitSumError', { amount: formatCurrency(amount, currency, i18n.language) }));
          return;
        }
      }
      paidBy = form.paidBy != null ? parseInt(form.paidBy) : currentUserId;
    }

    onAdd({
      id: initialExpense?.id || Date.now().toString(),
      description: form.description,
      amount,
      category: form.category,
      date: form.date,
      paidBy,
      splits,
    });
    onClose();
    toast.success(isEditing ? t('budget.addModal.editSuccess') : t('budget.addModal.success'));
  };

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
            className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8 shadow-2xl max-h-[85dvh] overflow-y-auto overscroll-contain sm:max-h-none sm:overflow-visible z-10"
          >
            <div className="flex justify-between items-center mb-5 sm:mb-6 pb-4 sm:pb-5 border-b border-gray-200 dark:border-white/10">
              <h3 id="add-expense-title" className="font-bold text-2xl sm:text-3xl tracking-tight text-gray-900 dark:text-white">
                {isEditing ? t('budget.addModal.editTitle') : t('budget.addModal.title')}
              </h3>
              <button
                onClick={onClose}
                aria-label={t('budget.addModal.close')}
                className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2 block">{t('budget.addModal.descriptionLabel')}</label>
                  <input
                    type="text"
                    required
                    maxLength={255}
                    placeholder={t('budget.addModal.descriptionPlaceholder')}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="glass-input"
                  />
                  <div className="flex justify-end mt-1.5 pr-1">
                    <CharCount value={form.description} max={255} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2 block">{t('budget.addModal.amountLabel')} ({currency})</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2 block">{t('budget.addModal.categoryLabel')}</label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="glass-input appearance-none cursor-pointer pr-10"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.id} value={c.id} className="text-gray-900 dark:bg-[#1C1C1E] dark:text-white">
                            {t('budget.categories.' + c.id)}
                          </option>
                        ))}
                      </select>
                      <ChevronRight size={16} strokeWidth={2.5} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2 block">{t('budget.addModal.dateLabel')}</label>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="glass-input flex items-center justify-between text-left cursor-pointer"
                  >
                    <span>{format(parseISO(form.date), 'dd. MM. yyyy', { locale: dateLocale })}</span>
                    <Calendar className="text-blue-500 shrink-0" size={20} strokeWidth={2} />
                  </button>
                  {showCalendar && (
                    <div className="static mt-3 max-w-full overflow-x-auto sm:mt-0 sm:max-w-none sm:overflow-visible sm:absolute sm:bottom-full sm:left-0 sm:mb-4 z-[200] glass-card p-3 sm:p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <DayPicker
                        mode="single"
                        selected={parseISO(form.date)}
                        onSelect={(date) => {
                          if (date) {
                            setForm({ ...form, date: format(date, 'yyyy-MM-dd') });
                            setShowCalendar(false);
                          }
                        }}
                        locale={dateLocale}
                        modifiers={modifiers}
                        modifiersClassNames={{ trip: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20' }}
                        className="premium-calendar"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ── Splitting section (shared trips only) ── */}
              {canSplit && (
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                        <Split size={14} strokeWidth={2} />
                      </div>
                      <span className="text-[14px] font-bold text-gray-900 dark:text-white">{t('budget.addModal.splitLabel')}</span>
                    </div>
                    {/* Toggle: ON = split among members · OFF = personal expense */}
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

                  {form.isPersonal ? (
                    <p className="text-[12px] text-gray-400 dark:text-gray-500 font-medium pl-[2.375rem]">
                      {t('budget.addModal.personalExpense')}
                    </p>
                  ) : (
                    <>
                      {/* Who paid — inline label + select */}
                      <div className="flex items-center gap-3">
                        <label className="text-[12px] font-medium text-gray-500 dark:text-gray-400 shrink-0">{t('budget.addModal.paidByLabel')}</label>
                        <div className="relative flex-1 min-w-0">
                          <select
                            value={form.paidBy ?? ''}
                            onChange={(e) => setForm({ ...form, paidBy: parseInt(e.target.value) })}
                            className="w-full appearance-none cursor-pointer pl-3 pr-9 py-2.5 bg-gray-100/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-xl text-base sm:text-[13px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:bg-[#1C1C1E]"
                          >
                            {members.map((m) => (
                              <option key={m.id} value={m.id} className="text-gray-900 dark:bg-[#1C1C1E] dark:text-white">
                                {memberLabel(m, currentUserId, t)}
                              </option>
                            ))}
                          </select>
                          <ChevronRight size={15} strokeWidth={2.5} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Split mode segmented control (thin) */}
                      <div className="flex p-0.5 bg-gray-100 dark:bg-white/5 rounded-lg">
                        {[
                          { id: 'equal', label: t('budget.addModal.splitEqually') },
                          { id: 'custom', label: t('budget.addModal.splitCustom') },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setForm({ ...form, splitMode: opt.id })}
                            className={`flex-1 py-2.5 sm:py-1.5 rounded-md text-[13px] sm:text-[12px] font-bold transition-all cursor-pointer ${
                              form.splitMode === opt.id
                                ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Participants — compact rows */}
                      <div className="space-y-0.5">
                        {members.map((m) => {
                          const checked = !!form.participants[m.id];
                          return (
                            <div
                              key={m.id}
                              className={`flex items-center gap-2.5 py-1 px-1.5 rounded-lg transition-colors ${
                                checked ? '' : 'opacity-45'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleParticipant(m.id)}
                                aria-pressed={checked}
                                aria-label={getMemberName(m)}
                                className="flex items-center gap-2.5 flex-1 min-w-0 py-1.5 text-left cursor-pointer"
                              >
                                <span
                                  aria-hidden="true"
                                  className={`w-[18px] h-[18px] rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                    checked ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-white/10'
                                  }`}
                                >
                                  {checked && <Check size={12} strokeWidth={3} />}
                                </span>
                                <UserAvatar user={toAvatarUser(m)} size="sm" />
                                <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate flex-1 min-w-0">
                                  {memberLabel(m, currentUserId, t)}
                                </span>
                              </button>
                              {checked && (
                                form.splitMode === 'equal' ? (
                                  <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
                                    {formatCurrency(equalShareFor(m.id), currency, i18n.language)}
                                  </span>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={form.customAmounts[m.id] ?? ''}
                                    onChange={(e) => setForm((f) => ({ ...f, customAmounts: { ...f.customAmounts, [m.id]: e.target.value } }))}
                                    className="w-24 px-3 py-2 sm:py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-base sm:text-[13px] font-semibold text-right text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 tabular-nums shrink-0"
                                  />
                                )
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Custom-mode running total vs target */}
                      {form.splitMode === 'custom' && amountNum > 0 && (
                        <div className={`flex items-center justify-between text-[12px] font-semibold px-1 ${
                          Math.abs(customSum - amountNum) > 0.01 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          <span>{formatCurrency(customSum, currency, i18n.language)} / {formatCurrency(amountNum, currency, i18n.language)}</span>
                          {Math.abs(customSum - amountNum) <= 0.01 && <Check size={14} strokeWidth={2.5} />}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-colors duration-300 shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
              >
                {isEditing ? t('budget.addModal.editSubmit') : t('budget.addModal.submit')}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/* ─── Budget ─── */
const Budget = ({ trips, onUpdateTrip, hideHeader = false }) => {
  const { t, i18n } = useTranslation();
  const shouldReduceMotion = useReducedMotion();
  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;

  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
  const { currency } = useCurrency();
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

  useEffect(() => {
    if (!selectedTripId) { setBalanceData(null); return; }
    let cancelled = false;
    api.trips.getBalances(selectedTripId)
      .then((data) => { if (!cancelled) setBalanceData(data); })
      .catch(() => { /* keep previous data on transient errors */ });
    return () => { cancelled = true; };
  }, [selectedTripId, expensesSignature, settleVersion]);

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

  const handleDeleteExpense = async (id) => {
    const ok = await confirmDialog({
      title: t('budget.delete.title'),
      message: t('budget.delete.message'),
      variant: 'danger',
      confirmLabel: t('budget.delete.confirm'),
    });
    if (!ok) return;
    onUpdateTrip({ ...trip, expenses: expenses.filter(e => e.id !== id) });
    toast.success(t('budget.delete.success'));
  };

  const handleSaveTarget = () => {
    const value = parseFloat(targetInput);
    if (targetInput === '') {
      onUpdateTrip({ ...trip, budgetTarget: null });
    } else if (!isNaN(value) && value > 0) {
      onUpdateTrip({ ...trip, budgetTarget: value });
    }
    setEditingTarget(false);
  };

  const modalOpen = isAddModalOpen || !!editingExpense;
  const closeModal = () => { setIsAddModalOpen(false); setEditingExpense(null); };

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

  return (
    <div className={`space-y-5 sm:space-y-6 w-full ${hideHeader ? '' : 'pb-10'}`}>
      {ModalPortal}

      <AddExpenseModal
        isOpen={modalOpen}
        onClose={closeModal}
        onAdd={editingExpense ? handleEditExpense : handleAddExpense}
        currency={currency}
        tripRange={{ start: trip?.startDate, end: trip?.endDate }}
        initialExpense={editingExpense}
        members={members}
        currentUserId={currentUserId}
      />

      {/* Standalone page header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-8 mb-2">
          <div className="space-y-1">
            <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400 font-medium">{t('budget.subtitle')}</p>
            <h1 className="text-3xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold">{t('budget.title')}</h1>
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
                    <option key={tr.id} value={tr.id} className="text-gray-900 dark:bg-[#1C1C1E] dark:text-white">
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
                className="hidden sm:flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-colors shrink-0 shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer text-[14px]"
              >
                <Plus size={18} strokeWidth={2.5} /> {t('budget.addExpense')}
              </button>
            )}
          </div>
        </div>
      )}

      {trips.length === 0 ? (
        <div className="text-center py-20 glass-card flex flex-col items-center justify-center space-y-4">
          <p className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">{t('budget.empty.noTrips')}</p>
          <p className="text-[15px] font-medium text-gray-500 dark:text-gray-400 max-w-md">{t('budget.empty.noTripsDesc')}</p>
        </div>
      ) : trip ? (
        <>
          {/* ── Budget Hero Card ── */}
          <div className="glass-card p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

              {/* Left: total + progress + target */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
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
                          className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full shrink-0"
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
                          className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-full shrink-0"
                        >
                          <TrendingDown size={11} strokeWidth={2.5} /> {t('budget.pacing.overPace')}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {hideHeader && trip && !isViewer && (
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer text-[12px] shrink-0"
                      >
                        <Plus size={14} strokeWidth={2.5} /> {t('budget.addExpense')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline gap-3 mb-4 sm:mb-5 flex-wrap">
                  <p className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-gray-900 dark:text-white leading-none">
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
                    <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
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
                      <span className={remaining !== null && remaining < 0 ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-gray-400'}>
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
                        className="w-10 h-10 sm:w-9 sm:h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-500 transition-colors cursor-pointer shrink-0"
                      >
                        <Check size={15} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => setEditingTarget(false)}
                        aria-label={t('budget.addModal.close')}
                        className="w-10 h-10 sm:w-9 sm:h-9 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors cursor-pointer shrink-0"
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
              </div>

              {/* Right: stats */}
              <div className="flex flex-row lg:flex-col gap-6 sm:gap-8 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-white/10 pt-5 lg:pt-0 lg:pl-10 flex-wrap sm:flex-nowrap lg:shrink-0">
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-1 uppercase tracking-wide">
                    {t('budget.summary.avgPerDay')}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {avgPerDay > 0 ? formatCurrency(Math.round(avgPerDay), currency, i18n.language) : '—'}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {t('budget.summary.overDays', { count: tripDays })}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-1 uppercase tracking-wide">
                    {t('budget.summary.daysLeft')}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {daysRemaining}
                  </p>
                </div>

                {projectedTotal !== null && budgetTarget && (
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-1 uppercase tracking-wide">
                      {t('budget.summary.projected')}
                    </p>
                    <p className={`text-xl sm:text-2xl font-bold tracking-tight ${projectedTotal > budgetTarget ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatCurrency(projectedTotal, currency, i18n.language)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

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
            <div className="glass-card p-6 sm:p-8">
              <h3 className="font-bold text-gray-900 dark:text-white text-[15px] sm:text-lg mb-5 sm:mb-6 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
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
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-base sm:text-[14px] text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full sm:w-auto pl-3 pr-9 py-2.5 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-base sm:text-[14px] appearance-none cursor-pointer text-gray-900 dark:text-white dark:bg-[#1C1C1E]"
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
                      className="w-full sm:w-auto pl-3 pr-9 py-2.5 bg-gray-100/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-base sm:text-[14px] appearance-none cursor-pointer text-gray-900 dark:text-white dark:bg-[#1C1C1E]"
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
                      className="flex items-center gap-1 text-[13px] font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl px-3 py-2.5 transition-all shrink-0 cursor-pointer"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pb-1">
              <h3 className="text-[12px] font-semibold text-gray-500 dark:text-gray-400">{t('budget.history')}</h3>
              {filteredExpenses.length > 0 && (
                <span className="px-2.5 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-[11px] font-bold text-gray-500 dark:text-gray-400">
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
                          <span className="text-[13px] font-bold text-gray-900 dark:text-white">{formatGroupDate(dateKey)}</span>
                          <span className="text-[13px] font-semibold tabular-nums text-gray-600 dark:text-gray-300">
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
                <p className="font-bold text-xl text-gray-900 dark:text-white tracking-tight mb-2">{t('budget.empty.noResults')}</p>
                <p className="text-[14px] text-gray-500 dark:text-gray-400">{t('budget.empty.noResultsDesc')}</p>
              </div>
            ) : (
              <div className="glass-card p-10 sm:p-14 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <Wallet className="text-blue-500 dark:text-blue-400" size={26} strokeWidth={1.5} />
                </div>
                <p className="font-bold text-xl text-gray-900 dark:text-white tracking-tight mb-2">{t('budget.empty.noExpenses')}</p>
                <p className="text-[14px] text-gray-500 dark:text-gray-400 max-w-xs mb-6">{t('budget.empty.noExpensesDesc')}</p>
                {!isViewer && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer text-[14px]"
                  >
                    <Plus size={18} strokeWidth={2.5} /> {t('budget.addExpense')}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Standalone mobile FAB */}
      {!hideHeader && trip && !isViewer && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          aria-label={t('budget.addExpense')}
          className="sm:hidden fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-6 z-[100] w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(37,99,235,0.4)] active:scale-90 transition-transform cursor-pointer"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default Budget;
