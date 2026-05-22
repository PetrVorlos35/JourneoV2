import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, Calendar, Pencil, Check, PackageOpen, Link as LinkIcon, Plus, Trash2, ExternalLink, Image as ImageIcon, Printer, Layout, Briefcase, Info } from 'lucide-react';
import { format, eachDayOfInterval } from 'date-fns';
import { cs } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useDialog } from '../ui/DialogModal';

const TripDetail = ({ trips, onUpdateTrip }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirmDialog, ModalPortal } = useDialog();
  const trip = trips.find(t => t.id === id);

  const [activeView, setActiveView] = useState(0); // 0, 1... for days, 'packing', 'documents', 'diary'
  const [mobileTab, setMobileTab] = useState('itinerary'); // 'itinerary', 'tools', 'info'
  const [dailyPlans, setDailyPlans] = useState([]);
  const [packingList, setPackingList] = useState(trip?.packingList || []);
  const [documents, setDocuments] = useState(trip?.documents || []);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tripTitle, setTripTitle] = useState(trip?.title || '');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const titleInputRef = useRef(null);

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
      <div className="text-center py-20 text-journeo-text-subtle font-serif text-xl">
        Výlet nebyl nalezen.
        <br />
        <Link to="/dashboard" className="text-journeo-accent hover:text-journeo-accent-hover transition-colors mt-4 inline-block font-sans text-sm uppercase tracking-widest font-medium">Zpět na přehled</Link>
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
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      setPackingList([...packingList, { id: Date.now().toString(), text: e.target.value.trim(), checked: false }]);
      setHasUnsavedChanges(true);
      e.target.value = '';
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
    navigate('/dashboard');
  };

  // Mobile Components
  const MobileBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-journeo-dark/90 backdrop-blur-md border-t border-journeo-border flex justify-around items-center px-2 py-3 z-50 md:hidden">
      <button 
        onClick={() => setMobileTab('itinerary')}
        className={`flex flex-col items-center gap-1.5 flex-1 transition-colors duration-300 ${mobileTab === 'itinerary' ? 'text-journeo-accent' : 'text-journeo-text-subtle'}`}
      >
        <Layout size={20} strokeWidth={mobileTab === 'itinerary' ? 2 : 1.5} />
        <span className="text-[9px] font-medium uppercase tracking-widest">Itinerář</span>
      </button>
      <button 
        onClick={() => setMobileTab('tools')}
        className={`flex flex-col items-center gap-1.5 flex-1 transition-colors duration-300 ${mobileTab === 'tools' ? 'text-journeo-accent' : 'text-journeo-text-subtle'}`}
      >
        <Briefcase size={20} strokeWidth={mobileTab === 'tools' ? 2 : 1.5} />
        <span className="text-[9px] font-medium uppercase tracking-widest">Nástroje</span>
      </button>
      <button 
        onClick={() => setMobileTab('info')}
        className={`flex flex-col items-center gap-1.5 flex-1 transition-colors duration-300 ${mobileTab === 'info' ? 'text-journeo-accent' : 'text-journeo-text-subtle'}`}
      >
        <Info size={20} strokeWidth={mobileTab === 'info' ? 2 : 1.5} />
        <span className="text-[9px] font-medium uppercase tracking-widest">Detaily</span>
      </button>
      <button 
        onClick={handleSave}
        className={`flex flex-col items-center gap-1.5 flex-1 transition-colors duration-300 ${hasUnsavedChanges ? 'text-amber-500' : 'text-journeo-text-subtle'}`}
      >
        <Save size={20} strokeWidth={1.5} />
        <span className="text-[9px] font-medium uppercase tracking-widest">Uložit</span>
      </button>
    </div>
  );

  const DayPicker = () => (
    <div className="flex gap-4 overflow-x-auto pb-4 mb-8 no-scrollbar -mx-4 sm:-mx-6 px-6 md:hidden">
      {dailyPlans.map((day, index) => (
        <button
          key={index}
          onClick={() => setActiveView(index)}
          className={`flex-shrink-0 min-w-[110px] p-4 rounded-sm transition-all duration-300 border ${
            activeView === index
              ? 'bg-journeo-surface border-journeo-accent text-journeo-text'
              : 'bg-transparent border-journeo-border text-journeo-text-subtle'
          }`}
        >
          <div className={`text-[10px] font-medium uppercase tracking-widest mb-2 ${activeView === index ? 'text-journeo-accent' : ''}`}>
            {format(new Date(day.date), 'EEE', { locale: cs })}
          </div>
          <div className="text-3xl font-serif leading-none mb-2">{format(new Date(day.date), 'd.')}</div>
          <div className="text-[11px] truncate opacity-70 italic">{day.location || 'Bez lokace'}</div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {ModalPortal}
      <MobileBottomNav />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 -mx-4 sm:-mx-6 px-6 md:mx-0 md:px-0">
        <div>
          <button onClick={handleBack} className="inline-flex items-center text-[12px] uppercase tracking-widest font-medium text-journeo-text-subtle hover:text-journeo-text mb-6 transition-colors duration-300">
            <ArrowLeft size={16} className="mr-2" strokeWidth={1.5} /> <span className="hidden md:inline">Zpět na přehled</span><span className="md:hidden">Zpět</span>
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
                  className="text-4xl md:text-5xl font-serif bg-transparent border-b border-journeo-accent text-journeo-text focus:outline-none w-full pb-1"
                  autoFocus
                />
                <button onClick={() => setEditingTitle(false)} className="text-journeo-text-subtle hover:text-journeo-accent transition-colors p-2">
                  <Check size={24} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 group">
                <h1 className="text-4xl md:text-5xl font-serif text-journeo-text leading-tight tracking-tight">{tripTitle}</h1>
                <button onClick={() => setEditingTitle(true)} className="text-journeo-text-subtle opacity-0 group-hover:opacity-100 transition-opacity" title="Přejmenovat">
                  <Pencil size={18} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>

          <p className="text-journeo-text-muted flex items-center gap-2 text-[13px] font-medium tracking-wide">
            <Calendar size={16} strokeWidth={1.5} />
            {format(new Date(trip.startDate), 'dd.MM.yyyy')} — {format(new Date(trip.endDate), 'dd.MM.yyyy')}
          </p>
        </div>

        <button
          onClick={handleSave}
          className={`hidden md:flex items-center justify-center gap-2 px-8 py-3.5 rounded-sm font-medium transition-colors duration-300 shrink-0 ${
            hasUnsavedChanges 
              ? 'bg-amber-600/10 text-amber-500 border border-amber-500/20 hover:bg-amber-600/20' 
              : 'bg-journeo-accent text-journeo-dark hover:bg-journeo-accent-hover'
          }`}
        >
          <Save size={18} strokeWidth={1.5} /> {hasUnsavedChanges ? 'Uložit změny' : 'Uložit plán'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 flex-1 min-h-0 pb-10">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:col-span-3 flex-col space-y-12 h-full min-h-0 border-r border-journeo-border pr-8">
          
          <div className="space-y-4">
            <h3 className="font-medium text-journeo-text-subtle uppercase tracking-widest text-[11px] mb-4">Nástroje</h3>
            
            <button
              onClick={() => setActiveView('packing')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-sm transition-all duration-300 font-medium ${
                activeView === 'packing'
                  ? 'bg-journeo-surface border-l-2 border-journeo-accent text-journeo-accent'
                  : 'text-journeo-text hover:bg-journeo-surface-hover border-l-2 border-transparent'
              }`}
            >
              <PackageOpen size={18} strokeWidth={1.5} /> Balící seznam
            </button>
            
            <button
              onClick={() => setActiveView('documents')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-sm transition-all duration-300 font-medium ${
                activeView === 'documents'
                  ? 'bg-journeo-surface border-l-2 border-journeo-accent text-journeo-accent'
                  : 'text-journeo-text hover:bg-journeo-surface-hover border-l-2 border-transparent'
              }`}
            >
              <LinkIcon size={18} strokeWidth={1.5} /> Odkazy a poznámky
            </button>
            <button
              onClick={() => setActiveView('diary')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-sm transition-all duration-300 font-medium ${
                activeView === 'diary'
                  ? 'bg-journeo-surface border-l-2 border-journeo-accent text-journeo-accent'
                  : 'text-journeo-text hover:bg-journeo-surface-hover border-l-2 border-transparent'
              }`}
            >
              <ImageIcon size={18} strokeWidth={1.5} /> Deník a Galerie
            </button>
          </div>

          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <h3 className="font-medium text-journeo-text-subtle uppercase tracking-widest text-[11px] mb-4">Itinerář</h3>
            <div className="space-y-2 overflow-y-auto pr-2 no-scrollbar flex-1">
              {dailyPlans.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setActiveView(index)}
                  className={`w-full text-left px-4 py-4 rounded-sm transition-all duration-300 ${
                    activeView === index
                      ? 'bg-journeo-surface border-l-2 border-journeo-accent text-journeo-accent'
                      : 'text-journeo-text hover:bg-journeo-surface-hover border-l-2 border-transparent'
                  }`}
                >
                  <div className="font-serif text-lg">{day.title}</div>
                  <div className="text-[11px] opacity-70 mt-1 uppercase tracking-widest">
                    {format(new Date(day.date), 'EEE, dd.MM.yyyy', { locale: cs })}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor / Main Content */}
        <div className="lg:col-span-9 print:col-span-1 print:block h-full overflow-y-auto no-scrollbar lg:pl-4">
          
          {/* Mobile Info View */}
          <div className={`${mobileTab === 'info' ? 'block' : 'hidden'} md:hidden space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300`}>
            <div className="bg-journeo-surface border border-journeo-border -mx-4 sm:-mx-6 px-6 py-8 rounded-sm">
              <h2 className="font-serif text-2xl mb-8 flex items-center gap-3 text-journeo-text">
                <Info size={20} className="text-journeo-accent" /> Přehled výletu
              </h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-journeo-border-strong">
                  <span className="text-journeo-text-subtle text-[11px] font-medium uppercase tracking-widest">Datum</span>
                  <span className="font-serif text-lg">
                    {format(new Date(trip.startDate), 'd. M. yyyy')} — {format(new Date(trip.endDate), 'd. M. yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-journeo-border-strong">
                  <span className="text-journeo-text-subtle text-[11px] font-medium uppercase tracking-widest">Počet dní</span>
                  <span className="font-serif text-lg">{dailyPlans.length} dní</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-journeo-text-subtle text-[11px] font-medium uppercase tracking-widest">Status</span>
                  <span className="px-3 py-1 bg-journeo-accent/10 text-journeo-accent border border-journeo-accent/20 text-[10px] font-medium uppercase tracking-widest rounded-sm">Naplánováno</span>
                </div>
              </div>
            </div>
            
            <div className="-mx-4 sm:-mx-6 px-6">
              <button 
                onClick={() => setActiveView('diary')}
                className="w-full bg-transparent border border-journeo-border text-journeo-text p-4 rounded-sm font-medium flex items-center justify-center gap-3 hover:bg-journeo-surface transition-colors duration-300"
              >
                <ImageIcon size={20} strokeWidth={1.5} /> Otevřít deník
              </button>
            </div>
          </div>

          {/* Mobile Tools View Selection */}
          <div className={`${mobileTab === 'tools' ? 'block' : 'hidden'} md:hidden animate-in fade-in slide-in-from-bottom-4 duration-300`}>
            <div className="space-y-4">
              <button
                onClick={() => setActiveView('packing')}
                className={`w-full flex items-center gap-4 -mx-4 sm:-mx-6 px-6 py-6 border-y border-journeo-border transition-colors duration-300 ${
                  activeView === 'packing' 
                    ? 'bg-journeo-surface border-l-2 border-l-journeo-accent' 
                    : 'bg-transparent text-journeo-text'
                }`}
              >
                <div className={`text-journeo-accent opacity-80`}>
                  <PackageOpen size={24} strokeWidth={1.5} />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-serif text-xl block mb-1">Balící seznam</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-journeo-text-subtle">
                    {packingList.length} položek
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveView('documents')}
                className={`w-full flex items-center gap-4 -mx-4 sm:-mx-6 px-6 py-6 border-b border-journeo-border transition-colors duration-300 ${
                  activeView === 'documents' 
                    ? 'bg-journeo-surface border-l-2 border-l-journeo-accent' 
                    : 'bg-transparent text-journeo-text'
                }`}
              >
                <div className={`text-journeo-accent opacity-80`}>
                  <LinkIcon size={24} strokeWidth={1.5} />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-serif text-xl block mb-1">Odkazy a poznámky</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-journeo-text-subtle">
                    {documents.length} záznamů
                  </span>
                </div>
              </button>
            </div>

            {/* Render actual tool content below if selected on mobile */}
            <div className="mt-8">
              {activeView === 'packing' && (
                <div className="animate-in fade-in duration-300">
                  <h3 className="font-serif text-2xl mb-6 -mx-4 sm:-mx-6 px-6">Položky k zabalení</h3>
                  {/* The actual packing content is below in the editor section */}
                </div>
              )}
              {activeView === 'documents' && (
                <div className="animate-in fade-in duration-300">
                  <h3 className="font-serif text-2xl mb-6 -mx-4 sm:-mx-6 px-6">Odkazy a poznámky</h3>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Itinerary View */}
          <div className={`${mobileTab === 'itinerary' && typeof activeView === 'number' ? 'block' : 'hidden'} md:block`}>
            <DayPicker />
          </div>

          {/* Actual content containers (shared) */}
          <div className={`${activeView === 'packing' ? 'block' : 'hidden'} ${mobileTab === 'tools' ? '' : 'max-md:hidden'} mb-8 print:mb-12`}>
            <div className="bg-transparent border border-journeo-border print:border-none -mx-4 sm:-mx-6 px-6 py-8 md:p-10 md:rounded-sm print:p-0">
              <h2 className="font-serif text-3xl text-journeo-text print:text-black mb-8 border-b border-journeo-border print:border-black pb-6 flex items-center gap-4">
                <PackageOpen className="text-journeo-accent print:text-black" size={28} strokeWidth={1.5} /> Balící seznam
              </h2>
              
              <div className="space-y-8">
                <div className="relative print:hidden">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Plus size={20} className="text-journeo-text-subtle" strokeWidth={1.5} />
                  </div>
                  <input
                    type="text"
                    onKeyDown={addPackingItem}
                    placeholder="Přidat položku (stiskněte Enter)"
                    className="w-full bg-transparent border-b border-journeo-border-strong pl-10 pr-4 py-4 text-journeo-text placeholder-journeo-text-subtle/40 focus:outline-none focus:border-journeo-accent transition-colors duration-300 font-serif text-xl"
                  />
                </div>

                <div className="space-y-4 mt-8 print:mt-0 print:grid print:grid-cols-2 print:gap-x-8">
                  {packingList.length === 0 ? (
                    <p className="text-journeo-text-subtle italic py-8 print:hidden">Zatím tu nic není. Přidejte první věc do batohu!</p>
                  ) : (
                    packingList.map(item => (
                      <div key={item.id} className="group flex items-center gap-4 py-3 border-b border-journeo-border/50 print:border-none print:p-1">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => togglePackingItem(item.id)}
                          className="w-5 h-5 rounded-sm border-journeo-border-strong text-journeo-accent bg-transparent focus:ring-journeo-accent focus:ring-offset-journeo-dark cursor-pointer print:text-black print:border-black"
                        />
                        <span className={`flex-1 text-lg font-serif transition-colors print:text-black ${item.checked ? 'text-journeo-text-subtle line-through print:line-through' : 'text-journeo-text'}`}>
                          {item.text}
                        </span>
                        <button
                          onClick={() => deletePackingItem(item.id)}
                          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-journeo-text-subtle hover:text-red-400 transition-colors p-2 print:hidden"
                        >
                          <Trash2 size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`${activeView === 'documents' ? 'block' : 'hidden'} ${mobileTab === 'tools' ? '' : 'max-md:hidden'} mb-8 print:mb-12`}>
            <div className="bg-transparent border border-journeo-border print:border-none -mx-4 sm:-mx-6 px-6 py-8 md:p-10 md:rounded-sm print:p-0">
              <h2 className="font-serif text-3xl text-journeo-text print:text-black mb-8 border-b border-journeo-border print:border-black pb-6 flex items-center gap-4">
                <LinkIcon className="text-journeo-accent print:text-black" size={28} strokeWidth={1.5} /> Odkazy a poznámky
              </h2>
              
              <form onSubmit={addDocument} className="print:hidden bg-journeo-surface border border-journeo-border p-8 rounded-sm space-y-6 mb-12">
                <div>
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="Název (např. Letenky, Airbnb)"
                    className="w-full bg-transparent border-b border-journeo-border-strong px-0 py-3 text-journeo-text placeholder-journeo-text-subtle/40 focus:outline-none focus:border-journeo-accent transition-colors duration-300 font-serif text-xl"
                  />
                </div>
                <div>
                  <textarea
                    name="content"
                    required
                    placeholder="Vložte URL odkaz nebo libovolnou textovou poznámku..."
                    rows="2"
                    className="w-full bg-transparent border-b border-journeo-border-strong px-0 py-3 text-journeo-text placeholder-journeo-text-subtle/40 focus:outline-none focus:border-journeo-accent transition-colors duration-300 resize-y"
                  ></textarea>
                </div>
                <div className="pt-2">
                  <button type="submit" className="px-8 py-3 bg-journeo-accent text-journeo-dark font-medium rounded-sm hover:bg-journeo-accent-hover transition-colors duration-300">
                    Uložit odkaz
                  </button>
                </div>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-4">
                {documents.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-journeo-text-subtle italic border border-journeo-border rounded-sm print:hidden">
                    Žádné uložené odkazy.
                  </div>
                ) : (
                  documents.map(doc => {
                    const isUrl = doc.content.startsWith('http://') || doc.content.startsWith('https://');
                    return (
                      <div key={doc.id} className="bg-journeo-surface border border-journeo-border print:border-none p-6 rounded-sm group relative pr-12 print:p-2 print:pr-0 print:bg-transparent">
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="absolute top-6 right-6 text-journeo-text-subtle hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity print:hidden"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                        <h4 className="font-serif text-xl text-journeo-text print:text-black mb-3 pr-4 print:pr-0">{doc.title}</h4>
                        {isUrl ? (
                          <a href={doc.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[13px] text-journeo-accent hover:text-journeo-accent-hover transition-colors break-all print:text-black print:no-underline">
                            <ExternalLink size={14} className="print:hidden" strokeWidth={1.5} /> {doc.content}
                          </a>
                        ) : (
                          <p className="text-[14px] text-journeo-text-muted print:text-black whitespace-pre-wrap font-light leading-relaxed">{doc.content}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className={`${activeView === 'diary' ? 'block' : 'hidden'} ${mobileTab === 'info' ? '' : 'max-md:hidden'} print:hidden`}>
            <div className="bg-transparent border border-journeo-border -mx-4 sm:-mx-6 px-6 py-16 md:p-16 md:rounded-sm flex flex-col items-center justify-center min-h-[500px] text-center">
              <div className="w-16 h-16 border border-journeo-accent/30 text-journeo-accent rounded-full flex items-center justify-center mb-6">
                <ImageIcon size={28} strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-serif text-journeo-text mb-4">Deník a Fotogalerie</h2>
              <p className="text-journeo-text-muted max-w-md mx-auto mb-8 font-light leading-relaxed">
                Tato funkce se momentálně připravuje! Brzy si zde budete moci zapisovat vzpomínky z cest, hodnotit výlety a vytvářet krásné fotogalerie. 
              </p>
              <span className="inline-flex px-4 py-1.5 bg-journeo-surface border border-journeo-border text-journeo-text-subtle font-medium rounded-sm text-[11px] uppercase tracking-widest">
                Připravujeme (Coming soon)
              </span>
            </div>
          </div>

          <div className={`${typeof activeView === 'number' ? 'block' : 'hidden'} ${mobileTab === 'itinerary' ? '' : 'max-md:hidden'} print:break-before-page`}>
            <h2 className="hidden print:flex text-3xl font-serif text-black mb-8 border-b border-black pb-6 items-center gap-4">
              <Calendar className="text-black" size={28} /> Itinerář výletu
            </h2>
            {dailyPlans.map((day, idx) => {
              if (typeof activeView === 'number' && activeView !== idx) return null; // In screen mode, show only active.
              return (
                <div key={idx} className={`${typeof activeView === 'number' && activeView !== idx ? 'hidden print:block' : 'block'} mb-12 print:mb-16 print:break-inside-avoid`}>
                  <div className="bg-transparent border-y border-journeo-border md:border-none print:bg-white print:border-none -mx-4 sm:-mx-6 px-6 py-8 md:p-0 print:p-0">
                    <h2 className="font-serif text-3xl md:text-4xl text-journeo-text print:text-black mb-8 border-b border-journeo-border print:border-black pb-6 flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4">
                      <span>{day.title}</span>
                      <span className="text-[12px] md:text-[14px] font-sans font-medium text-journeo-text-subtle print:text-gray-600 uppercase tracking-widest">
                        ({format(new Date(day.date), 'EEEE, d. M.', { locale: cs })})
                      </span>
                    </h2>

                    <div className="space-y-12">
                      <div className={typeof activeView === 'number' ? 'block' : 'hidden print:block'}>
                        <label className="flex items-center gap-3 text-[11px] font-medium text-journeo-text-subtle print:text-black mb-4 uppercase tracking-widest">
                          <MapPin size={16} strokeWidth={1.5} /> Lokace (Město, Místo)
                        </label>
                        <input
                          type="text"
                          value={day.location}
                          onChange={(e) => {
                            const updated = [...dailyPlans];
                            updated[idx].location = e.target.value;
                            setDailyPlans(updated);
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="Např. Eiffelova věž, Paříž"
                          className="w-full bg-transparent border-b border-journeo-border-strong print:border-none print:p-0 print:bg-transparent px-0 py-4 font-serif text-2xl text-journeo-text print:text-black placeholder-journeo-text-subtle/30 focus:outline-none focus:border-journeo-accent transition-colors duration-300"
                        />
                      </div>

                      <div className={typeof activeView === 'number' ? 'block' : 'hidden print:block'}>
                        <label className="block text-[11px] font-medium text-journeo-text-subtle print:text-black mb-4 uppercase tracking-widest">
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
                          rows={12}
                          className="w-full bg-transparent border border-journeo-border print:border-none print:p-0 print:bg-transparent rounded-sm p-6 text-journeo-text print:text-black placeholder-journeo-text-subtle/30 focus:outline-none focus:border-journeo-border-strong transition-colors duration-300 resize-y print:min-h-0 leading-relaxed font-light"
                        />
                      </div>
                    </div>
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
