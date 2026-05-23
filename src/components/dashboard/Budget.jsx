import { useState } from 'react';
import { createPortal } from 'react-dom';
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
  { 
    id: 'transport', label: 'Doprava', icon: Car,
    colorClass: 'bg-blue-500', shadowClass: 'shadow-blue-500/30',
    lightBgClass: 'bg-blue-50 dark:bg-blue-500/10', textClass: 'text-blue-600 dark:text-blue-400'
  },
  { 
    id: 'accommodation', label: 'Ubytování', icon: Home,
    colorClass: 'bg-purple-500', shadowClass: 'shadow-purple-500/30',
    lightBgClass: 'bg-purple-50 dark:bg-purple-500/10', textClass: 'text-purple-600 dark:text-purple-400'
  },
  { 
    id: 'food', label: 'Jídlo & Pití', icon: Utensils,
    colorClass: 'bg-orange-500', shadowClass: 'shadow-orange-500/30',
    lightBgClass: 'bg-orange-50 dark:bg-orange-500/10', textClass: 'text-orange-600 dark:text-orange-400'
  },
  { 
    id: 'activities', label: 'Aktivity', icon: Palmtree,
    colorClass: 'bg-emerald-500', shadowClass: 'shadow-emerald-500/30',
    lightBgClass: 'bg-emerald-50 dark:bg-emerald-500/10', textClass: 'text-emerald-600 dark:text-emerald-400'
  },
  { 
    id: 'other', label: 'Ostatní', icon: MoreHorizontal,
    colorClass: 'bg-gray-500', shadowClass: 'shadow-gray-500/30',
    lightBgClass: 'bg-gray-100 dark:bg-gray-500/10', textClass: 'text-gray-600 dark:text-gray-400'
  },
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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/10 rounded-[2rem] w-full max-w-lg p-8 sm:p-10 shadow-2xl overflow-visible"
          >
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200 dark:border-white/10">
              <h3 className="font-bold text-3xl tracking-tight text-gray-900 dark:text-white">Nový výdaj</h3>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Popis výdaje</label>
                  <input
                    type="text"
                    required
                    placeholder="např. Letenka Praha → Londýn"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="glass-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Částka ({currency})</label>
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
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Kategorie</label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="glass-input appearance-none cursor-pointer pr-10"
                      >
                        {CATEGORIES.map(c => <option key={c.id} value={c.id} className="text-gray-900 dark:bg-[#1C1C1E] dark:text-white">{c.label}</option>)}
                      </select>
                      <ChevronRight size={16} strokeWidth={2.5} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Datum výdaje</label>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="glass-input flex items-center justify-between text-left cursor-pointer"
                  >
                    <span>
                      {format(new Date(form.date), 'dd. MM. yyyy', { locale: cs })}
                    </span>
                    <Calendar className="text-blue-500 shrink-0" size={20} strokeWidth={2} />
                  </button>
                  
                  {showCalendar && (
                    <div className="absolute bottom-full left-0 mb-4 z-[200] glass-card p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                          trip: "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20"
                        }}
                        className="premium-calendar"
                      />
                    </div>
                  )}
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-colors duration-300 mt-8 shadow-md shadow-blue-500/20 active:scale-95"
              >
                Přidat výdaj
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
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
    <div className="space-y-8">
      <div className="flex h-3 w-full gap-1 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5">
        {byCategory.map((c, i) => (
          <div
            key={c.id}
            className={`${c.colorClass} transition-all`}
            style={{ width: `${(c.amount / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-y-6 gap-x-8">
        {byCategory.map((c, i) => (
          <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3 gap-2">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 ${c.colorClass} rounded-full shadow-sm ${c.shadowClass}`} />
              <span className="text-[12px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">{c.label}</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">{formatCurrency(c.amount, currency)}</span>
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
    <div className="space-y-12 w-full pb-10">
      {ModalPortal}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-2">
          <p className="text-[12px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">Rozpočet</p>
          <h1 className="text-4xl text-gray-900 dark:text-white tracking-tight font-bold">Výdaje a rozpočet</h1>
        </div>

        {/* Action area */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-8 sm:mt-0">
          
          {/* Desktop sketch hint (to the left) */}
          {trips.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 pointer-events-none opacity-90 text-red-500 z-10">
              <div className="flex flex-col items-center">
                <motion.span 
                  initial={{ clipPath: "inset(0 100% 0 0)" }}
                  animate={{ clipPath: "inset(0 0 0 0)" }}
                  transition={{ duration: 1.2, ease: "linear" }}
                  className="font-['Caveat'] text-3xl font-bold whitespace-nowrap pt-1"
                >
                  Tady si vyber výlet
                </motion.span>
                <svg width="160" height="15" viewBox="0 0 160 15" fill="none" className="-mt-1">
                  <motion.path 
                    d="M 5 8 Q 80 0 155 10" 
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round" 
                    initial={{ pathLength: 0, opacity: 0 }} 
                    animate={{ pathLength: 1, opacity: 1 }} 
                    transition={{ duration: 0.4, delay: 1.2, ease: "easeOut" }}
                  />
                </svg>
              </div>
              <svg width="60" height="35" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-1">
                <motion.path d="M 10 40 Q 50 5 90 25" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 1.6, ease: "easeOut" }}/>
                <motion.path d="M 70 10 L 90 25 L 70 40" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.3, delay: 2.2, ease: "easeOut" }}/>
              </svg>
            </div>
          )}

          {/* Trip selector */}
          {trips.length > 0 && (
            <div className="relative group w-full sm:w-64">
              
              {/* Mobile sketch hint (absolute) */}
              <div className="sm:hidden absolute -top-14 left-4 flex flex-col items-center -rotate-[10deg] pointer-events-none opacity-90 text-red-500 z-10">
                <div className="flex flex-col items-center">
                  <motion.span 
                    initial={{ clipPath: "inset(0 100% 0 0)" }}
                    animate={{ clipPath: "inset(0 0 0 0)" }}
                    transition={{ duration: 1.2, ease: "linear" }}
                    className="font-['Caveat'] text-2xl font-bold whitespace-nowrap"
                  >
                    Tady si vyber výlet
                  </motion.span>
                  <svg width="120" height="10" viewBox="0 0 120 10" fill="none" className="mt-0">
                    <motion.path 
                      d="M 5 5 Q 60 0 115 8" 
                      stroke="currentColor" strokeWidth="3" strokeLinecap="round" 
                      initial={{ pathLength: 0, opacity: 0 }} 
                      animate={{ pathLength: 1, opacity: 1 }} 
                      transition={{ duration: 0.4, delay: 1.2, ease: "easeOut" }}
                    />
                  </svg>
                </div>
                <svg width="50" height="30" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-8 transform rotate-[40deg] mt-1">
                  <motion.path d="M 10 40 Q 50 5 90 25" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 1.6, ease: "easeOut" }}/>
                  <motion.path d="M 70 10 L 90 25 L 70 40" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.3, delay: 2.2, ease: "easeOut" }}/>
                </svg>
              </div>

              <select
                value={selectedTripId || ''}
                onChange={e => setSelectedTripId(e.target.value)}
                className="glass-input cursor-pointer appearance-none pr-12"
              >
                {trips.map(t => <option key={t.id} value={t.id} className="text-gray-900 dark:bg-[#1C1C1E] dark:text-white">{t.title}</option>)}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                 <ChevronRight size={18} strokeWidth={2.5} className="rotate-90" />
              </div>
            </div>
          )}

          {/* Add Button */}
          {trip && (
            <button 
              onClick={() => setIsAddModalOpen(true)} 
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-colors duration-300 shrink-0 shadow-md shadow-blue-500/20 active:scale-95"
            >
              <Plus size={20} strokeWidth={2.5} />
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
        <div className="text-center py-20 glass-card flex flex-col items-center justify-center space-y-4">
          <p className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">Žádný výlet</p>
          <p className="text-[15px] font-medium text-gray-500 dark:text-gray-400 max-w-md">Nejprve si vytvořte výlet v plánovači a pak sem můžete přidat první výdaje.</p>
        </div>
      ) : trip ? (
        <>
          {/* Souhrn */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-8 sm:p-10 lg:col-span-1 flex flex-col justify-center border-blue-500/30 dark:border-blue-500/20 shadow-blue-500/10">
              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">Celkové výdaje</p>
              <p className="text-5xl lg:text-6xl font-bold tracking-tighter text-gray-900 dark:text-white leading-none">{formatCurrency(total, currency)}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:col-span-2 gap-6">
              <div className="glass-card p-8 sm:p-10 flex flex-col justify-center">
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Počet transakcí</p>
                <p className="text-4xl lg:text-5xl font-bold tracking-tighter text-gray-900 dark:text-white">{expenses.length}</p>
              </div>
              <div className="glass-card p-8 sm:p-10 flex flex-col justify-center">
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Termín výletu</p>
                <div className="space-y-1">
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tighter text-gray-900 dark:text-white">
                    {format(new Date(trip.startDate), 'd. M. yyyy')}
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tighter text-gray-400 dark:text-gray-500">
                    — {format(new Date(trip.endDate), 'd. M. yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kategoriový pruh */}
          {expenses.length > 0 && (
            <div className="glass-card p-8 sm:p-10 pt-12">
              <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                  <TrendingUp size={20} strokeWidth={2} /> 
                </div>
                Rozložení podle kategorií
              </h3>
              <CategoryBar expenses={expenses} currency={currency} />
            </div>
          )}

          {/* Seznam výdajů */}
          <div className="space-y-6 pt-6">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4">
              <h3 className="text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Historie výdajů</h3>
              <span className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-[11px] font-bold text-gray-500 dark:text-gray-400">{expenses.length} položek</span>
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-6 glass-card shadow-sm hover:shadow-md hover:-translate-y-0.5 group transition-all duration-300 gap-4 sm:gap-6"
                    >
                      <div className="flex items-center gap-6 min-w-0">
                        <div className={`w-12 h-12 ${cat.lightBgClass} ${cat.textClass} rounded-[1rem] flex items-center justify-center shrink-0`}>
                          <Icon size={24} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 leading-none">{cat.label}</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white truncate tracking-tight leading-tight mb-2">{expense.description}</p>
                          {expense.date && (
                            <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 dark:text-gray-400">
                              <Calendar size={14} strokeWidth={2} />
                              {format(new Date(expense.date), 'd. MMMM yyyy', { locale: cs })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center sm:items-end justify-between sm:flex-col shrink-0 gap-2 border-t sm:border-t-0 border-gray-100 dark:border-white/5 pt-4 sm:pt-0">
                        <span className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white">{formatCurrency(expense.amount, currency)}</span>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 uppercase tracking-widest opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all bg-gray-100 dark:bg-white/5 sm:bg-transparent px-3 py-1.5 sm:px-0 sm:py-0 rounded-full sm:rounded-none"
                        >
                          <Trash2 size={14} strokeWidth={2} /> Smazat
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 glass-card">
                <Wallet className="mx-auto text-gray-300 dark:text-gray-600 mb-6" size={48} strokeWidth={1.5} />
                <p className="text-gray-500 dark:text-gray-400 font-medium text-[15px]">Zatím žádné výdaje. Přidejte první!</p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Budget;
