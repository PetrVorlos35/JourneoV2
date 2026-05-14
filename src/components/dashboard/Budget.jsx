import { useState } from 'react';
import { Plus, Trash2, DollarSign, TrendingUp, Calendar, Car, Home, Utensils, Palmtree, MoreHorizontal, ChevronRight, Wallet } from 'lucide-react';
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
  { id: 'transport', label: 'Doprava', color: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: Car },
  { id: 'accommodation', label: 'Ubytování', color: 'bg-purple-500', light: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: Home },
  { id: 'food', label: 'Jídlo & Pití', color: 'bg-green-500', light: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400', icon: Utensils },
  { id: 'activities', label: 'Aktivity', color: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', icon: Palmtree },
  { id: 'other', label: 'Ostatní', color: 'bg-gray-400', light: 'bg-gray-50 dark:bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', icon: MoreHorizontal },
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
      <button 
        onClick={() => setOpen(true)} 
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
      >
        <Plus size={20} /> Přidat nový výdaj
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-xl shadow-black/5 animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-xl text-gray-900 dark:text-white">Nový výdaj</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
          Zrušit
        </button>
      </div>
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
      <div className="flex gap-4 pt-4 border-t border-gray-50 dark:border-white/5">
        <button type="submit" className="flex-1 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
          Uložit výdaj
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight">Výdaje a rozpočet</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Spravujte své útraty a hlídejte si budget.</p>
        </div>

        {/* Trip selector */}
        {trips.length > 0 && (
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-blue-600 dark:text-blue-400">
              <Wallet size={18} />
            </div>
            <select
              value={selectedTripId || ''}
              onChange={e => setSelectedTripId(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-4 pl-12 rounded-2xl shadow-sm text-lg font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
            >
              {trips.map(t => <option key={t.id} value={t.id} className="text-black dark:text-white">{t.title}</option>)}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
               <ChevronRight size={18} className="rotate-90" />
            </div>
          </div>
        )}
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
          <DollarSign size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nejprve si vytvořte výlet a pak sem přidejte výdaje.</p>
        </div>
      ) : trip ? (
        <>
          {/* Souhrn */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-xl shadow-blue-500/20">
              <p className="text-xs font-bold text-blue-100/70 uppercase tracking-widest mb-1">Celkové výdaje</p>
              <p className="text-4xl font-black">{formatCurrency(total, currency)}</p>
            </div>
            <div className="grid grid-cols-2 sm:contents gap-4">
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Položek</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{expenses.length}</p>
              </div>
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Průměr</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {expenses.length > 0 ? formatCurrency(Math.round(total / expenses.length), currency) : formatCurrency(0, currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Kategoriový pruh */}
          {expenses.length > 0 && (
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" /> Rozložení výdajů
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
              <div className="space-y-3">
                {[...expenses].reverse().map(expense => {
                  const cat = catInfo(expense.category);
                  const Icon = cat.icon;
                  return (
                    <div key={expense.id} className="flex items-center justify-between gap-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-4 group transition-all hover:border-blue-500/30">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${cat.light} ${cat.text} transition-transform group-hover:scale-110`}>
                          <Icon size={24} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{cat.label}</p>
                          <p className="text-gray-900 dark:text-white font-black truncate leading-tight">{expense.description}</p>
                          {expense.date && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                              {format(new Date(expense.date), 'd. M. yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div className="flex flex-col items-end">
                           <span className="font-black text-gray-900 dark:text-white text-lg">{formatCurrency(expense.amount, currency)}</span>
                           <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Smazat
                          </button>
                        </div>
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
