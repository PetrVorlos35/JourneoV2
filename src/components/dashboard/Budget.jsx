import { useState } from 'react';
import { Plus, Trash2, DollarSign, TrendingUp, Calendar, Car, Home, Utensils, Palmtree, MoreHorizontal, ChevronRight, Wallet, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  { id: 'transport', label: 'Doprava', icon: Car },
  { id: 'accommodation', label: 'Ubytování', icon: Home },
  { id: 'food', label: 'Jídlo & Pití', icon: Utensils },
  { id: 'activities', label: 'Aktivity', icon: Palmtree },
  { id: 'other', label: 'Ostatní', icon: MoreHorizontal },
];

const catInfo = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[4];

// ── Modal pro přidání výdaje ──────────────────────────────────────
const AddExpenseModal = ({ isOpen, onClose, onAdd, currency, tripRange }) => {
  const [form, setForm] = useState({ 
    description: '', 
    amount: '', 
    category: 'transport', 
    date: new Date().toISOString().split('T')[0] 
  });
  const [showCalendar, setShowCalendar] = useState(false);

  const tripStart = tripRange?.start ? new Date(tripRange.start) : null;
  const tripEnd = tripRange?.end ? new Date(tripRange.end) : null;

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
    onClose();
    toast.success('Výdaj byl přidán!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative bg-journeo-surface border border-journeo-border-strong rounded-sm p-10 shadow-2xl w-full max-w-lg overflow-visible"
          >
            <div className="flex justify-between items-center mb-10 border-b border-journeo-border-strong pb-6">
              <h3 className="font-serif text-3xl text-journeo-text">Nový výdaj</h3>
              <button 
                onClick={onClose}
                className="text-journeo-text-subtle hover:text-journeo-text transition-colors"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 gap-8">
                <div>
                  <label className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-2 block">Popis výdaje</label>
                  <input
                    type="text"
                    required
                    placeholder="např. Letenka Praha → Londýn"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-transparent border-b border-journeo-border-strong focus:border-journeo-accent px-0 py-3 text-journeo-text placeholder-journeo-text-subtle/30 focus:outline-none transition-colors duration-300 font-serif text-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-2 block">Částka ({currency})</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      className="w-full bg-transparent border-b border-journeo-border-strong focus:border-journeo-accent px-0 py-3 text-journeo-text placeholder-journeo-text-subtle/30 focus:outline-none transition-colors duration-300 font-serif text-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-2 block">Kategorie</label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-transparent border-b border-journeo-border-strong focus:border-journeo-accent px-0 py-3 text-journeo-text focus:outline-none transition-colors duration-300 appearance-none cursor-pointer font-serif text-xl"
                      >
                        {CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-journeo-surface text-journeo-text">{c.label}</option>)}
                      </select>
                      <ChevronRight size={16} className="absolute right-0 top-1/2 -translate-y-1/2 rotate-90 text-journeo-text-subtle pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <label className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-2 block">Datum výdaje</label>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full flex items-center justify-between bg-transparent border-b border-journeo-border-strong hover:border-journeo-accent px-0 py-3 text-journeo-text focus:outline-none transition-colors duration-300 text-left font-serif text-xl"
                  >
                    <span>
                      {format(new Date(form.date), 'dd. MM. yyyy', { locale: cs })}
                    </span>
                    <Calendar className="text-journeo-accent shrink-0" size={20} strokeWidth={1.5} />
                  </button>
                  
                  {showCalendar && (
                    <div className="absolute bottom-full left-0 mb-4 z-[200] bg-journeo-surface border border-journeo-border shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                          trip: "bg-journeo-accent/10 text-journeo-accent font-medium border border-journeo-accent/20"
                        }}
                        className="premium-calendar"
                      />
                    </div>
                  )}
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-4 bg-journeo-accent text-journeo-dark rounded-sm font-medium hover:bg-journeo-accent-hover transition-colors duration-300 mt-8"
              >
                Přidat výdaj
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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

  // We are using a monochrome/editorial palette now, so we compute opacity based on index
  return (
    <div className="space-y-6">
      <div className="flex h-2 w-full gap-1">
        {byCategory.map((c, i) => (
          <div
            key={c.id}
            className="bg-journeo-accent transition-all"
            style={{ width: `${(c.amount / total) * 100}%`, opacity: 1 - (i * 0.15) }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
        {byCategory.map((c, i) => (
          <div key={c.id} className="flex items-center justify-between border-b border-journeo-border-strong pb-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-journeo-accent rounded-full" style={{ opacity: 1 - (i * 0.15) }} />
              <span className="text-[12px] text-journeo-text-subtle uppercase tracking-widest font-medium">{c.label}</span>
            </div>
            <span className="font-serif text-lg text-journeo-text">{formatCurrency(c.amount, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Hlavní Budget stránka ────────────────────────────────────────
const Budget = ({ trips, onUpdateTrip }) => {
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    <div className="space-y-12 w-full">
      {ModalPortal}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-2">
          <p className="text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium">Rozpočet</p>
          <h1 className="font-serif text-4xl text-journeo-text tracking-tight">Výdaje a rozpočet</h1>
        </div>

        {/* Action area */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Trip selector */}
          {trips.length > 0 && (
            <div className="relative group w-full sm:w-64">
              <select
                value={selectedTripId || ''}
                onChange={e => setSelectedTripId(e.target.value)}
                className="w-full bg-transparent border-b border-journeo-border-strong px-0 py-3 text-journeo-text focus:outline-none focus:border-journeo-accent transition-colors appearance-none cursor-pointer font-serif text-xl"
              >
                {trips.map(t => <option key={t.id} value={t.id} className="bg-journeo-surface text-journeo-text">{t.title}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none text-journeo-text-subtle">
                 <ChevronRight size={18} className="rotate-90" />
              </div>
            </div>
          )}

          {/* Add Button */}
          {trip && (
            <button 
              onClick={() => setIsAddModalOpen(true)} 
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-journeo-accent text-journeo-dark rounded-sm font-medium hover:bg-journeo-accent-hover transition-colors duration-300 shrink-0"
            >
              <Plus size={18} strokeWidth={2} />
              Nová útrata
            </button>
          )}
        </div>
      </div>

      <AddExpenseModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddExpense} 
        currency={currency} 
        tripRange={{ start: trip?.startDate, end: trip?.endDate }} 
      />

      {trips.length === 0 ? (
        <div className="text-center py-20 border border-journeo-border rounded-sm bg-journeo-surface flex flex-col items-center justify-center space-y-4">
          <p className="font-serif text-2xl text-journeo-text">Žádný výlet</p>
          <p className="text-[14px] text-journeo-text-muted max-w-md">Nejprve si vytvořte výlet v plánovači a pak sem můžete přidat první výdaje.</p>
        </div>
      ) : trip ? (
        <>
          {/* Souhrn */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-transparent border border-journeo-border p-8 rounded-sm lg:col-span-1 flex flex-col justify-center">
              <p className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-4">Celkové výdaje</p>
              <p className="text-5xl lg:text-6xl font-serif text-journeo-text">{formatCurrency(total, currency)}</p>
            </div>
            
            <div className="grid grid-cols-2 lg:col-span-2 gap-6">
              <div className="bg-journeo-surface border border-journeo-border p-8 rounded-sm">
                <p className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-4">Počet transakcí</p>
                <p className="text-4xl font-serif text-journeo-text">{expenses.length}</p>
              </div>
              <div className="bg-journeo-surface border border-journeo-border p-8 rounded-sm">
                <p className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-4">Průměrný výdaj</p>
                <p className="text-4xl font-serif text-journeo-text">
                  {expenses.length > 0 ? formatCurrency(Math.round(total / expenses.length), currency) : formatCurrency(0, currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Kategoriový pruh */}
          {expenses.length > 0 && (
            <div className="bg-journeo-surface border border-journeo-border p-8 rounded-sm pt-10">
              <h3 className="font-medium text-journeo-text-subtle text-[11px] uppercase tracking-widest mb-8 flex items-center gap-3">
                <TrendingUp size={16} className="text-journeo-accent" /> Rozložení podle kategorií
              </h3>
              <CategoryBar expenses={expenses} currency={currency} />
            </div>
          )}

          {/* Seznam výdajů */}
          <div className="space-y-6 pt-6">
            <div className="flex items-center justify-between border-b border-journeo-border pb-4">
              <h3 className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest">Historie výdajů</h3>
              <span className="text-[11px] font-medium text-journeo-text-subtle">{expenses.length} položek</span>
            </div>

            {expenses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {[...expenses].reverse().map(expense => {
                  const cat = catInfo(expense.category);
                  const Icon = cat.icon;
                  return (
                    <motion.div 
                      key={expense.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-6 bg-transparent border border-journeo-border hover:border-journeo-border-strong rounded-sm group transition-colors duration-300"
                    >
                      <div className="flex items-center gap-6 min-w-0">
                        <div className={`shrink-0 text-journeo-accent opacity-80 group-hover:opacity-100 transition-opacity`}>
                          <Icon size={24} strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-1 leading-none">{cat.label}</p>
                          <p className="text-xl font-serif text-journeo-text truncate leading-tight mb-2">{expense.description}</p>
                          {expense.date && (
                            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-journeo-text-muted">
                              <Calendar size={12} strokeWidth={1.5} />
                              {format(new Date(expense.date), 'd. MMMM yyyy', { locale: cs })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0 text-right">
                        <div className="flex flex-col items-end">
                           <span className="font-serif text-2xl text-journeo-text mb-1">{formatCurrency(expense.amount, currency)}</span>
                           <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-[10px] font-medium text-journeo-text-subtle hover:text-red-400 uppercase tracking-widest opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                          >
                            Smazat
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 border border-journeo-border rounded-sm bg-journeo-surface">
                <Wallet className="mx-auto text-journeo-text-subtle mb-4" size={32} strokeWidth={1} />
                <p className="text-journeo-text-muted text-[14px]">Zatím žádné výdaje. Přidejte první!</p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Budget;
