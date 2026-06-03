import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, Calendar, Pencil, Check, PackageOpen, Link as LinkIcon, Plus, Trash2, ExternalLink, Image as ImageIcon, Printer, Layout, Briefcase, Info } from 'lucide-react';
import { format, eachDayOfInterval } from 'date-fns';
import { cs } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useDialog } from '../ui/DialogModal';
import LocationAutocomplete from '../ui/LocationAutocomplete';
import { useUnsavedChanges } from '../../contexts/UnsavedChangesContext';
import VoteButton from '../ui/VoteButton';

const TripDetail = ({ trips, onUpdateTrip }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get('from');
  const { confirmDialog, ModalPortal } = useDialog();
  const trip = trips.find(t => t.id === id);

  const backHref = fromParam === 'all' ? '/dashboard/all-trips' : '/dashboard';
  const backText = fromParam === 'all' ? 'Zpět na Moje výlety' : 'Zpět na přehled';

  const [activeView, setActiveView] = useState(0); // 0, 1... for days, 'packing', 'documents', 'diary'
  const [mobileTab, setMobileTab] = useState('itinerary'); // 'itinerary', 'tools', 'info'
  const [dailyPlans, setDailyPlans] = useState([]);
  const [packingList, setPackingList] = useState(trip?.packingList || []);
  const [documents, setDocuments] = useState(trip?.documents || []);
  const [newPackingItem, setNewPackingItem] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [tripTitle, setTripTitle] = useState(trip?.title || '');
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();
  const titleInputRef = useRef(null);

  useEffect(() => {
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [setHasUnsavedChanges]);

  useEffect(() => {
    if (trip) setTripTitle(trip.title);
  }, [trip?.id]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      if (mobileTab === 'itinerary' && typeof activeView !== 'number') {
        setActiveView(0);
      }
    }
  }, [mobileTab, activeView]);

  useEffect(() => {
    if (trip) {
      const days = eachDayOfInterval({
        start: new Date(trip.startDate),
        end: new Date(trip.endDate)
      });
      const existingActivities = trip.activities || [];
      const initialPlans = days.map((date, index) => {
        const existing = existingActivities[index];
        return {
          date,
          title: existing?.title || `Den ${index + 1}`,
          plan: existing?.plan || '',
          location: existing?.location || ''
        };
      });
      setDailyPlans(initialPlans);
    }
  }, [trip]);

  if (!trip) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-bold text-xl">
        Výlet nebyl nalezen.
        <br />
        <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors mt-4 inline-block text-[13px] uppercase tracking-widest font-bold">Zpět na přehled</Link>
      </div>
    );
  }

  if (trip.isGenerating) {
    return (
      <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="glass-card p-10 sm:p-14 rounded-[3rem] flex flex-col items-center justify-center max-w-md w-full space-y-8 shadow-2xl relative overflow-hidden border border-white/10 dark:border-white/5">
          {/* Shimmer effect background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 animate-pulse"></div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
            <div className="w-24 h-24 border-4 border-gray-100 dark:border-white/5 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin relative z-10 shadow-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <MapPin className="text-blue-600 dark:text-blue-400 animate-bounce" size={28} strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="text-center space-y-3 relative z-10">
            <h3 className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white">Zakládáme váš výlet...</h3>
            <p className="text-[15px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
              Připravujeme prostor pro váš itinerář, rozpočet a seznamy věcí. Hned budete moci začít s plánováním.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handlePlanChange = (value) => {
    const updated = [...dailyPlans];
    updated[activeView].plan = value;
    setDailyPlans(updated);
    setHasUnsavedChanges(true);
  };

  const handleLocationChange = (value) => {
    const updated = [...dailyPlans];
    updated[activeView].location = value;
    setDailyPlans(updated);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    onUpdateTrip({ 
      ...trip, 
      title: tripTitle, 
      activities: dailyPlans,
      packingList,
      documents
    });
    setHasUnsavedChanges(false);
    toast.success('Změny byly úspěšně uloženy!');
  };

  const currentDay = typeof activeView === 'number' ? dailyPlans[activeView] : null;

  // Packing Logic
  const togglePackingItem = (id) => {
    setPackingList(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    setHasUnsavedChanges(true);
  };
  const deletePackingItem = async (id) => {
    const ok = await confirmDialog({
      title: 'Smazat položku?',
      message: 'Opravdu chcete tuto položku smazat z balícího seznamu?',
      confirmLabel: 'Smazat',
      variant: 'danger'
    });
    if (ok) {
      setPackingList(prev => prev.filter(item => item.id !== id));
      setHasUnsavedChanges(true);
    }
  };
  const addPackingItem = (e) => {
    if (e.key === 'Enter' && newPackingItem.trim()) {
      e.preventDefault();
      setPackingList([...packingList, { id: Date.now().toString(), text: newPackingItem.trim(), checked: false }]);
      setHasUnsavedChanges(true);
      setNewPackingItem('');
    }
  };

  // Documents Logic
  const deleteDocument = async (id) => {
    const ok = await confirmDialog({
      title: 'Smazat odkaz?',
      message: 'Opravdu chcete smazat tento odkaz či poznámku?',
      confirmLabel: 'Smazat',
      variant: 'danger'
    });
    if (ok) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      setHasUnsavedChanges(true);
    }
  };
  const addDocument = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title').trim();
    const content = formData.get('content').trim();
    if (!title || !content) return;
    setDocuments([...documents, { id: Date.now().toString(), title, content }]);
    setHasUnsavedChanges(true);
    e.target.reset();
  };

  const handleBack = async () => {
    if (hasUnsavedChanges) {
      const ok = await confirmDialog({
        title: 'Máte neuložené změny',
        message: 'Opravdu chcete odejít? Vaše změny nebudou uloženy.',
        confirmLabel: 'Odejít bez uložení',
        variant: 'danger'
      });
      if (!ok) return;
    }
    navigate(backHref);
  };



  return (
    <div className="w-full h-full flex flex-col min-h-0 pb-10">
      {ModalPortal}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 flex justify-center pointer-events-none">
        <div className="glass-panel w-full max-w-sm rounded-[2rem] flex justify-around items-center px-2 py-3 pointer-events-auto border border-gray-200 dark:border-white/10 shadow-2xl">
          <button 
            onClick={() => setMobileTab('itinerary')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${mobileTab === 'itinerary' ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} cursor-pointer disabled:cursor-not-allowed`}
          >
            <Layout size={20} strokeWidth={mobileTab === 'itinerary' ? 2.5 : 2} />
            {mobileTab === 'itinerary' && <span className="text-[9px] font-bold uppercase tracking-widest">Itinerář</span>}
          </button>
          <button 
            onClick={() => setMobileTab('tools')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${mobileTab === 'tools' ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} cursor-pointer disabled:cursor-not-allowed`}
          >
            <Briefcase size={20} strokeWidth={mobileTab === 'tools' ? 2.5 : 2} />
            {mobileTab === 'tools' && <span className="text-[9px] font-bold uppercase tracking-widest">Nástroje</span>}
          </button>
          <button 
            onClick={() => setMobileTab('info')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${mobileTab === 'info' ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} cursor-pointer disabled:cursor-not-allowed`}
          >
            <Info size={20} strokeWidth={mobileTab === 'info' ? 2.5 : 2} />
            {mobileTab === 'info' && <span className="text-[9px] font-bold uppercase tracking-widest">Detaily</span>}
          </button>
          <button 
            onClick={handleSave}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${hasUnsavedChanges ? 'text-red-500 scale-110' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} cursor-pointer disabled:cursor-not-allowed`}
          >
            <Save size={20} strokeWidth={hasUnsavedChanges ? 2.5 : 2} />
            {hasUnsavedChanges && <span className="text-[9px] font-bold uppercase tracking-widest">Uložit</span>}
          </button>
        </div>
      </div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex-1">
          <button onClick={handleBack} className="inline-flex items-center text-[12px] uppercase tracking-widest font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed">
            <ArrowLeft size={16} className="mr-2" strokeWidth={2.5} /> {backText}
          </button>

          <div className="flex items-center gap-4 mb-3">
            {editingTitle ? (
              <div className="flex items-center gap-3 w-full max-w-md">
                <input
                  ref={titleInputRef}
                  value={tripTitle}
                  onChange={e => {
                    setTripTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); }}
                  className="text-4xl md:text-5xl font-bold tracking-tight bg-transparent border-b-2 border-blue-600 text-gray-900 dark:text-white focus:outline-none w-full pb-1"
                  autoFocus
                />
                <button onClick={() => setEditingTitle(false)} className="text-gray-400 hover:text-blue-600 transition-colors p-2 bg-gray-100 dark:bg-white/10 rounded-full cursor-pointer disabled:cursor-not-allowed">
                  <Check size={20} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 group">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">{tripTitle}</h1>
                <button onClick={() => setEditingTitle(true)} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-gray-100 dark:bg-white/5 rounded-full hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer disabled:cursor-not-allowed" title="Přejmenovat">
                  <Pencil size={18} strokeWidth={2} />
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-500 flex items-center gap-2 text-[13px] font-bold tracking-widest uppercase">
            <Calendar size={16} strokeWidth={2.5} />
            {format(new Date(trip.startDate), 'dd.MM.yyyy')} — {format(new Date(trip.endDate), 'dd.MM.yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <VoteButton 
            tripId={parseInt(trip.id)} 
            initialUpvotes={trip.upvotes || 0} 
            initialDownvotes={trip.downvotes || 0} 
            initialUserVote={trip.userVote || 0} 
          />
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={`hidden md:flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all duration-300 shrink-0 ${
              hasUnsavedChanges 
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20 active:scale-95 hover:bg-red-600' 
                : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 cursor-default'
            } cursor-pointer disabled:cursor-not-allowed`}
          >
            <Save size={18} strokeWidth={2.5} /> {hasUnsavedChanges ? 'Uložit změny' : 'Uložit plán'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        
        {/* Desktop Sidebar Tools */}
        <div className="hidden lg:flex lg:col-span-3 flex-col space-y-6 h-full min-h-0">
          
          <div className="glass-card p-6 space-y-2">
            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[11px] mb-4 ml-2">Nástroje</h3>
            
            <button
              onClick={() => setActiveView('packing')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-xl transition-all duration-300 font-bold ${
                activeView === 'packing'
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              } cursor-pointer disabled:cursor-not-allowed`}
            >
              <PackageOpen size={18} strokeWidth={2.5} /> Balící seznam
            </button>
            
            <button
              onClick={() => setActiveView('documents')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-xl transition-all duration-300 font-bold ${
                activeView === 'documents'
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              } cursor-pointer disabled:cursor-not-allowed`}
            >
              <LinkIcon size={18} strokeWidth={2.5} /> Odkazy a poznámky
            </button>
            <button
              onClick={() => setActiveView('diary')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-xl transition-all duration-300 font-bold ${
                activeView === 'diary'
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              } cursor-pointer disabled:cursor-not-allowed`}
            >
              <ImageIcon size={18} strokeWidth={2.5} /> Deník a Galerie
            </button>
          </div>

          <div className="glass-card p-6 space-y-2 flex-1 flex flex-col min-h-0">
            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[11px] mb-4 ml-2">Itinerář</h3>
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {dailyPlans.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setActiveView(index)}
                  className={`w-full flex items-center justify-between text-left px-4 py-4 rounded-xl transition-all duration-300 ${
                    activeView === index
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                  } cursor-pointer disabled:cursor-not-allowed`}
                >
                  <div className="min-w-0">
                    <div className="font-bold truncate text-[15px]">{day.title}</div>
                    <div className={`text-[11px] uppercase tracking-widest mt-1 font-bold ${activeView === index ? 'text-blue-200' : 'text-gray-400'}`}>
                      {format(new Date(day.date), 'EEE, dd.MM.', { locale: cs })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor / Main Content */}
        <div className="lg:col-span-9 h-full flex flex-col min-h-0">
          
          {/* Mobile Info View */}
          <div className={`${mobileTab === 'info' ? 'block' : 'hidden'} md:hidden space-y-6 animate-in fade-in duration-300`}>
            <div className="glass-card p-6 sm:p-8">
              <h2 className="font-bold text-2xl mb-8 flex items-center gap-3 text-gray-900 dark:text-white tracking-tight">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <Info size={20} strokeWidth={2.5} /> 
                </div>
                Přehled výletu
              </h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/10">
                  <span className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">Datum</span>
                  <span className="font-bold text-gray-900 dark:text-white text-[15px]">
                    {format(new Date(trip.startDate), 'd. M. yyyy')} — {format(new Date(trip.endDate), 'd. M. yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/10">
                  <span className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">Počet dní</span>
                  <span className="font-bold text-gray-900 dark:text-white text-[15px]">{dailyPlans.length} dní</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">Status</span>
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-full">Naplánováno</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setActiveView('diary')}
              className="w-full glass-card p-6 font-bold flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-300 text-gray-900 dark:text-white cursor-pointer disabled:cursor-not-allowed"
            >
              <ImageIcon size={20} strokeWidth={2.5} /> Otevřít deník
            </button>
          </div>

          {/* Mobile Tools View Selection */}
          <div className={`${mobileTab === 'tools' ? 'block' : 'hidden'} md:hidden animate-in fade-in duration-300`}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setActiveView('packing')}
                className={`flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 text-left ${
                  activeView === 'packing' 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent glass-card text-gray-500 hover:text-gray-900'
                } cursor-pointer disabled:cursor-not-allowed`}
              >
                <PackageOpen size={28} strokeWidth={2} className="mb-4" />
                <span className="font-bold text-[15px] block mb-1 text-gray-900 dark:text-white leading-tight">Batoh</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {packingList.length} položek
                </span>
              </button>

              <button
                onClick={() => setActiveView('documents')}
                className={`flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 text-left ${
                  activeView === 'documents' 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent glass-card text-gray-500 hover:text-gray-900'
                } cursor-pointer disabled:cursor-not-allowed`}
              >
                <LinkIcon size={28} strokeWidth={2} className="mb-4" />
                <span className="font-bold text-[15px] block mb-1 text-gray-900 dark:text-white leading-tight">Odkazy</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {documents.length} záznamů
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Itinerary View Navigation */}
          <div className={`${mobileTab === 'itinerary' && typeof activeView === 'number' ? 'block' : 'hidden'} md:block shrink-0`}>
            <div className="flex gap-4 overflow-x-auto pb-4 mb-8 no-scrollbar -mx-4 sm:-mx-8 px-4 sm:px-8 md:hidden">
              {dailyPlans.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setActiveView(index)}
                  className={`flex-shrink-0 w-[120px] text-left p-4 rounded-3xl transition-all duration-300 border-2 ${
                    activeView === index
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-md shadow-blue-500/10'
                      : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                  } cursor-pointer disabled:cursor-not-allowed`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1">
                    {format(new Date(day.date), 'EEE', { locale: cs })}
                  </div>
                  <div className="text-3xl font-bold tracking-tighter leading-none mb-2">{format(new Date(day.date), 'd.')}</div>
                  <div className="text-[11px] w-full truncate opacity-70 font-medium">{day.location || 'Bez lokace'}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Packing List View ── */}
          <div className={`${activeView === 'packing' ? 'flex' : 'hidden'} ${mobileTab === 'tools' || mobileTab === 'itinerary' ? '' : 'max-md:hidden'} flex-col flex-1 lg:h-full lg:min-h-0`}>
            <div className="glass-card flex flex-col flex-1 lg:h-full lg:min-h-0 mb-6 lg:mb-0">
              <div className="p-5 sm:p-10 border-b border-gray-100 dark:border-white/10 shrink-0">
                <h2 className="font-bold text-3xl tracking-tight text-gray-900 dark:text-white flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                    <PackageOpen size={24} strokeWidth={2} /> 
                  </div>
                  Balící seznam
                </h2>
                <div className="relative">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Plus size={20} className="text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                  </div>
                  <input
                    type="text"
                    value={newPackingItem}
                    onChange={(e) => setNewPackingItem(e.target.value)}
                    onKeyDown={addPackingItem}
                    maxLength={255}
                    placeholder="Přidat položku do batohu (stiskněte Enter)"
                    className="glass-input !py-3 sm:!py-4 !pl-12 sm:!pl-14 text-[15px] sm:text-base w-full"
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-white/40 mt-1.5 text-right font-medium pr-1">
                  {newPackingItem.length} / 255
                </div>
              </div>
              
              <div className="p-5 sm:p-10 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  {packingList.length === 0 ? (
                    <p className="text-gray-500 font-bold text-center py-12">Zatím tu nic není. Přidejte první věc do batohu!</p>
                  ) : (
                    packingList.map(item => (
                      <div key={item.id} className="group flex items-center gap-4 py-4 px-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => togglePackingItem(item.id)}
                          className="w-6 h-6 shrink-0 rounded-md border-2 border-gray-300 dark:border-gray-600 text-blue-600 bg-transparent focus:ring-blue-500 cursor-pointer"
                        />
                        <span className={`flex-1 min-w-0 break-words text-[15px] font-bold transition-colors ${item.checked ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                          {item.text}
                        </span>
                        <button
                          onClick={() => deletePackingItem(item.id)}
                          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-red-100 dark:hover:bg-red-500/20 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Trash2 size={18} strokeWidth={2} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Documents View ── */}
          <div className={`${activeView === 'documents' ? 'flex' : 'hidden'} ${mobileTab === 'tools' || mobileTab === 'itinerary' ? '' : 'max-md:hidden'} flex-col flex-1 lg:h-full lg:min-h-0`}>
            <div className="glass-card flex flex-col flex-1 lg:h-full lg:min-h-0 mb-6 lg:mb-0">
              <div className="p-5 sm:p-10 border-b border-gray-100 dark:border-white/10 shrink-0">
                <h2 className="font-bold text-3xl tracking-tight text-gray-900 dark:text-white flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                    <LinkIcon size={24} strokeWidth={2} /> 
                  </div>
                  Odkazy a poznámky
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-5 sm:p-10 gap-8">
                <form onSubmit={addDocument} className="p-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl space-y-4 shrink-0">
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="Název (např. Letenky, Airbnb)"
                    className="glass-input border-none bg-white dark:bg-black/50 !py-3 sm:!py-4 shadow-sm text-[15px] sm:text-base"
                  />
                  <textarea
                    name="content"
                    required
                    placeholder="Vložte URL odkaz nebo libovolnou textovou poznámku..."
                    rows="2"
                    className="glass-input border-none bg-white dark:bg-black/50 !py-3 sm:!py-4 resize-y shadow-sm text-[15px] sm:text-base min-h-[100px]"
                  ></textarea>
                  <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed">
                    Uložit odkaz
                  </button>
                </form>

                <div className="grid grid-cols-1 gap-4">
                  {documents.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 font-bold border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
                      Zatím žádné uložené odkazy.
                    </div>
                  ) : (
                    documents.map(doc => {
                      const isUrl = doc.content.startsWith('http://') || doc.content.startsWith('https://');
                      return (
                        <div key={doc.id} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-3xl group relative">
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-red-100 dark:hover:bg-red-500/20 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-3 pr-10 tracking-tight">{doc.title}</h4>
                          {isUrl ? (
                            <a href={doc.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-black text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors break-all rounded-xl shadow-sm border border-gray-100 dark:border-white/5 cursor-pointer disabled:cursor-not-allowed">
                              <ExternalLink size={16} strokeWidth={2} /> Otevřít odkaz
                            </a>
                          ) : (
                            <p className="text-[14px] text-gray-500 dark:text-gray-400 whitespace-pre-wrap font-medium">{doc.content}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Diary View ── */}
          <div className={`${activeView === 'diary' ? 'flex' : 'hidden'} ${mobileTab === 'info' || mobileTab === 'itinerary' ? '' : 'max-md:hidden'} flex-col flex-1 lg:h-full lg:min-h-0`}>
            <div className="glass-card flex-1 flex flex-col items-center justify-center p-5 sm:p-8 text-center min-h-[400px] mb-6 lg:mb-0">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-[2rem] flex items-center justify-center mb-8">
                <ImageIcon size={32} strokeWidth={2} />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Deník a Fotogalerie</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 font-medium">
                Tato funkce se momentálně připravuje! Brzy si zde budete moci zapisovat vzpomínky z cest, hodnotit výlety a vytvářet krásné fotogalerie. 
              </p>
              <span className="inline-flex px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-bold rounded-xl text-[11px] uppercase tracking-widest">
                Připravujeme (Coming soon)
              </span>
            </div>
          </div>

          {/* ── Itinerary Editor View ── */}
          <div className={`${typeof activeView === 'number' ? 'flex' : 'hidden'} ${mobileTab === 'itinerary' ? '' : 'max-md:hidden'} flex-col flex-1 lg:h-full lg:min-h-0`}>
            {dailyPlans.map((day, idx) => {
              if (activeView !== idx) return null;
              return (
                <div key={idx} className="glass-card flex flex-col flex-1 lg:h-full lg:min-h-0 mb-6 lg:mb-0">
                  <div className="p-5 sm:p-10 border-b border-gray-100 dark:border-white/10 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-5 sm:mb-8">
                      <h2 className="font-bold text-2xl sm:text-4xl tracking-tight text-gray-900 dark:text-white">{day.title}</h2>
                      <span className="text-[13px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full w-fit">
                        {format(new Date(day.date), 'EEEE, d. M.', { locale: cs })}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        <MapPin size={16} strokeWidth={2.5} /> Lokace (Město, Místo)
                      </label>
                      <LocationAutocomplete
                        value={day.location}
                        onChange={(value) => {
                          const updated = [...dailyPlans];
                          updated[idx].location = value;
                          setDailyPlans(updated);
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Např. Eiffelova věž, Paříž"
                        maxLength={255}
                        className="glass-input !py-3 sm:!py-4 !px-4 sm:!px-5 font-bold text-base sm:text-lg w-full"
                      />
                      <div className="text-xs text-gray-500 dark:text-white/40 mt-1.5 text-right font-medium pr-1">
                        {day.location?.length || 0} / 255
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-10 flex-1 flex flex-col min-h-[300px] lg:min-h-0">
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 sm:mb-4 uppercase tracking-widest">
                      Co máte v plánu?
                    </label>
                    <textarea
                      value={day.plan}
                      onChange={(e) => {
                        const updated = [...dailyPlans];
                        updated[idx].plan = e.target.value;
                        setDailyPlans(updated);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Napište si poznámky, aktivity, časy rezervací..."
                      className="glass-input flex-1 min-h-[250px] lg:min-h-0 resize-y font-medium text-[15px] sm:text-base leading-relaxed"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TripDetail;
