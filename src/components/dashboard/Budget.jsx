import { useState } from 'react';
import { Plus, Trash2, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import toast from 'react-hot-toast';
import { useDialog } from '../ui/DialogModal';
import { useCurrency } from '../../contexts/CurrencyContext';

const formatCurrency = (amount, currency) => {
  const symbols = { CZK: 'Kč', EUR: '€', USD: '$', GBP: '£' };
  const symbol = symbols[currency] || 'Kč';
  return `${amount.toLocaleString('cs-CZ')} ${symbol}`;
};

// ── Kategorie výdajů ──────────────────────────────────────────────
const CATEGORIES = [
  { id: 'transport', label: 'Doprava', color: 'bg-blue-500', light: 'bg-blue-100 text-blue-700' },
  { id: 'accommodation', label: 'Ubytování', color: 'bg-purple-500', light: 'bg-purple-100 text-purple-700' },
  { id: 'food', label: 'Jídlo & Pití', color: 'bg-green-500', light: 'bg-green-100 text-green-700' },
  { id: 'activities', label: 'Aktivity', color: 'bg-orange-500', light: 'bg-orange-100 text-orange-700' },
  { id: 'other', label: 'Ostatní', color: 'bg-gray-400', light: 'bg-gray-100 text-gray-700' },
];

const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[4];

// ── Přidání výdaje ────────────────────────────────────────────────
const AddExpenseForm = ({ onAdd, currency, tripRange }) => {
  const [form, setForm] = useState({ 
    description: '', 
    amount: '', 
    category: 'transport', 
    date: new Date().toISOString().split('T')[0] 
  });
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const tripStart = tripRange?.start ? new Date(tripRange.start) : null;
  const tripEnd = tripRange?.end ? new Date(tripRange.end) : null;

  // Modifikátory pro zvýraznění výletu
  const modifiers = {
    trip: (date) => tripStart && tripEnd && date >= tripStart && date <= tripEnd
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description || !form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Vyplňte prosím popis a částku.');
      return;
    }
    onAdd({ ...form, amount: parseFloat(form.amount), id: Date.now().toString() });
    setForm({ description: '', amount: '', category: 'transport', date: new Date().toISOString().split('T')[0] });
    setOpen(false);
    toast.success('Výdaj byl přidán!');
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-colors">
        <Plus size={18} /> Přidat výdaj
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-gray-900 dark:text-white mb-2">Nový výdaj</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Popis</label>
          <input
            type="text"
            required
            placeholder="např. Letenka Praha → Londýn"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Částka ({currency})</label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            placeholder="0"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Kategorie</label>
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div className="relative">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Datum</label>
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className="w-full flex items-center justify-between bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left"
          >
            <span className="truncate">
              {format(new Date(form.date), 'dd. MM. yyyy', { locale: cs })}
            </span>
            <Calendar className="text-gray-400 shrink-0" size={18} />
          </button>
          
          {showCalendar && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl p-2 animate-in fade-in zoom-in duration-200">
              <DayPicker
                mode="single"
                selected={new Date(form.date)}
                onSelect={(date) => {
                  if (date) {
                    setForm({ ...form, date: format(date, 'yyyy-MM-dd') });
                    setShowCalendar(false);
                  }
                }}
                locale={cs}
                modifiers={modifiers}
                modifiersClassNames={{
                  trip: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold"
                }}
                className="premium-calendar"
              />
              <div className="p-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-blue-500/70">
                <div className="w-3 h-3 bg-blue-100 dark:bg-blue-500/20 rounded-full" />
                Doba trvání výletu
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-colors">
          Přidat
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-5 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          Zrušit
        </button>
      </div>
    </form>
  );
};

// ── Pruh kategorií ────────────────────────────────────────────────
const CategoryBar = ({ expenses, currency }) => {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  if (total === 0) return null;

  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    amount: expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.amount > 0);

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {byCategory.map(c => (
          <div
            key={c.id}
            className={`${c.color} transition-all`}
            style={{ width: `${(c.amount / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {byCategory.map(c => (
          <div key={c.id} className="flex items-center gap-1.5 text-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
            <span className="text-gray-500 dark:text-gray-400">{c.label}</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(c.amount, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Hlavní Budget stránka ────────────────────────────────────────
const Budget = ({ trips, onUpdateTrip }) => {
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id || null);
  const trip = trips.find(t => t.id === selectedTripId);
  const expenses = trip?.expenses || [];
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const { confirmDialog, ModalPortal } = useDialog();
  const { currency } = useCurrency();

  const handleAddExpense = (expense) => {
    onUpdateTrip({ ...trip, expenses: [...expenses, expense] });
  };

  const handleDeleteExpense = async (id) => {
    const ok = await confirmDialog({
      title: 'Smazat výdaj?',
      message: 'Opravdu chcete smazat tento výdaj? Tato akce nelze vrátit zpět.',
      variant: 'danger',
      confirmLabel: 'Smazat'
    });
    if (!ok) return;
    
    onUpdateTrip({ ...trip, expenses: expenses.filter(e => e.id !== id) });
    toast.success('Výdaj smazán');
  };

  return (
    <div className="space-y-6 w-full">
      {ModalPortal}
      {/* Header */}
      <div className="flex flex-col gap-6 border-b border-gray-200 dark:border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Výdaje a rozpočet</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Vyberte konkrétní výlet a spravujte jeho útraty.</p>
          
          {/* Prominent Trip selector */}
          {trips.length > 0 && (
            <div className="inline-flex items-center gap-3 bg-white dark:bg-black/40 border border-gray-300 dark:border-white/10 p-2 pl-4 rounded-2xl shadow-sm w-full sm:w-auto">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Zvolený výlet:</span>
              <select
                value={selectedTripId || ''}
                onChange={e => setSelectedTripId(e.target.value)}
                className="bg-transparent text-lg font-bold text-blue-600 dark:text-blue-400 focus:outline-none cursor-pointer max-w-[200px] sm:max-w-xs truncate pr-4"
              >
                {trips.map(t => <option key={t.id} value={t.id} className="text-black dark:text-white">{t.title}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
          <DollarSign size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nejprve si vytvořte výlet a pak sem přidejte výdaje.</p>
        </div>
      ) : trip ? (
        <>
          {/* Souhrn */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-2 sm:col-span-1 bg-blue-600 text-white rounded-2xl p-5">
              <p className="text-sm font-medium text-blue-100 mb-1">Celkové výdaje</p>
              <p className="text-3xl font-bold">{formatCurrency(total, currency)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Počet položek</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{expenses.length}</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Průměr / položka</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {expenses.length > 0 ? formatCurrency(Math.round(total / expenses.length), currency) : formatCurrency(0, currency)}
              </p>
            </div>
          </div>

          {/* Kategoriový pruh */}
          {expenses.length > 0 && (
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp size={18} /> Rozložení výdajů
              </h3>
              <CategoryBar expenses={expenses} currency={currency} />
            </div>
          )}

          {/* Formulář + seznam */}
          <div className="space-y-4">
            <AddExpenseForm 
              onAdd={handleAddExpense} 
              currency={currency} 
              tripRange={{ start: trip.startDate, end: trip.endDate }} 
            />

            {expenses.length > 0 ? (
              <div className="space-y-2">
                {[...expenses].reverse().map(expense => {
                  const cat = catInfo(expense.category);
                  return (
                    <div key={expense.id} className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg ${cat.light} dark:bg-white/10 dark:text-white`}>
                          {cat.label}
                        </span>
                        <span className="text-gray-800 dark:text-gray-100 font-medium truncate">{expense.description}</span>
                        {expense.date && (
                          <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 shrink-0">
                            {format(new Date(expense.date), 'dd. MM. yyyy', { locale: cs })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(expense.amount, currency)}</span>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                <p className="text-gray-400 dark:text-gray-500">Zatím žádné výdaje. Přidejte první kliknutím výše.</p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Budget;
