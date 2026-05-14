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

  // Handle mobile tab switching logic
  useEffect(() => {
    if (window.innerWidth < 768) {
      if (mobileTab === 'itinerary' && typeof activeView !== 'number') {
        setActiveView(0);
      }
    }
  }, [mobileTab]);

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
      <div className="text-center py-20 text-gray-500 dark:text-gray-400">
        Výlet nebyl nalezen.
        <br />
        <Link to="/dashboard" className="text-blue-600 dark:text-blue-500 hover:underline mt-4 inline-block">Zpět na přehled</Link>
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
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 flex justify-around items-center px-2 py-3 z-50 md:hidden">
      <button 
        onClick={() => setMobileTab('itinerary')}
        className={`flex flex-col items-center gap-1 flex-1 transition-colors ${mobileTab === 'itinerary' ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400'}`}
      >
        <Layout size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Itinerář</span>
      </button>
      <button 
        onClick={() => setMobileTab('tools')}
        className={`flex flex-col items-center gap-1 flex-1 transition-colors ${mobileTab === 'tools' ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400'}`}
      >
        <Briefcase size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Nástroje</span>
      </button>
      <button 
        onClick={() => setMobileTab('info')}
        className={`flex flex-col items-center gap-1 flex-1 transition-colors ${mobileTab === 'info' ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400'}`}
      >
        <Info size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Detaily</span>
      </button>
      <button 
        onClick={handleSave}
        className={`flex flex-col items-center gap-1 flex-1 transition-colors ${hasUnsavedChanges ? 'text-orange-500 animate-pulse' : 'text-gray-400'}`}
      >
        <Save size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Uložit</span>
      </button>
    </div>
  );

  const DayPicker = () => (
    <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar -mx-4 px-4 md:hidden">
      {dailyPlans.map((day, index) => (
        <button
          key={index}
          onClick={() => setActiveView(index)}
          className={`flex-shrink-0 min-w-[100px] p-3 rounded-2xl transition-all border ${
            activeView === index
              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
              : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
          }`}
        >
          <div className="text-[10px] font-bold uppercase opacity-70 mb-1">
            {format(new Date(day.date), 'EEE', { locale: cs })}
          </div>
          <div className="text-lg font-black leading-none">{format(new Date(day.date), 'd.')}</div>
          <div className="text-[10px] mt-1 truncate max-w-[80px]">{day.location || 'Bez místa'}</div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-0">
      {ModalPortal}
      <MobileBottomNav />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button onClick={handleBack} className="inline-flex items-center text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 mb-4 font-medium transition-colors md:mb-6">
            <ArrowLeft size={16} className="mr-2" /> <span className="hidden md:inline">Zpět na přehled</span><span className="md:hidden">Zpět</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            {editingTitle ? (
              <div className="flex items-center gap-2 w-full max-w-md">
                <input
                  ref={titleInputRef}
                  value={tripTitle}
                  onChange={e => {
                    setTripTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); }}
                  className="text-2xl md:text-4xl font-bold bg-transparent border-b-2 border-blue-500 text-gray-900 dark:text-white focus:outline-none w-full"
                  autoFocus
                />
                <button onClick={() => setEditingTitle(false)} className="text-green-600 dark:text-green-400 p-2">
                  <Check size={24} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group">
                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">{tripTitle}</h1>
                <button onClick={() => setEditingTitle(true)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="Přejmenovat">
                  <Pencil size={18} />
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm md:text-base">
            <Calendar size={16} />
            {format(new Date(trip.startDate), 'dd.MM.yyyy')} - {format(new Date(trip.endDate), 'dd.MM.yyyy')}
          </p>
        </div>

        <button
          onClick={handleSave}
          className="hidden md:flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/25 shrink-0"
        >
          <Save size={18} /> Uložit plán
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop sidebar */}
        <div className="hidden lg:block lg:col-span-1 space-y-4">
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-sm mb-3 px-2">Nástroje</h3>
            
            <button
              onClick={() => setActiveView('packing')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl transition-all font-medium ${
                activeView === 'packing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              <PackageOpen size={18} /> Balící seznam
            </button>
            
            <button
              onClick={() => setActiveView('documents')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl transition-all font-medium ${
                activeView === 'documents'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              <LinkIcon size={18} /> Odkazy a poznámky
            </button>
            <button
              onClick={() => setActiveView('diary')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl transition-all font-medium ${
                activeView === 'diary'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              <ImageIcon size={18} /> Deník a Galerie
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-white/10">
            <h3 className="font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-sm mb-3 px-2">Itinerář</h3>
            {dailyPlans.map((day, index) => (
              <button
                key={index}
                onClick={() => setActiveView(index)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  activeView === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                <div className="font-bold">{day.title}</div>
                <div className="text-xs opacity-70 mt-1 capitalize">
                  {format(new Date(day.date), 'EEEE, dd.MM.yyyy', { locale: cs })}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor / Main Content */}
        <div className="lg:col-span-3 print:col-span-1 print:block">
          
          {/* Mobile Info View */}
          <div className={`${mobileTab === 'info' ? 'block' : 'hidden'} md:hidden space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300`}>
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Info size={18} className="text-blue-500" /> Přehled výletu
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                  <span className="text-gray-500 text-sm">Datum</span>
                  <span className="font-medium text-sm">
                    {format(new Date(trip.startDate), 'd. M. yyyy')} - {format(new Date(trip.endDate), 'd. M. yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                  <span className="text-gray-500 text-sm">Počet dní</span>
                  <span className="font-medium text-sm">{dailyPlans.length} dní</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 text-sm">Status</span>
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase rounded-full">Naplánováno</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setActiveView('diary')}
              className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <ImageIcon size={20} /> Otevřít deník
            </button>
          </div>

          {/* Mobile Tools View Selection */}
          <div className={`${mobileTab === 'tools' ? 'block' : 'hidden'} md:hidden animate-in fade-in slide-in-from-bottom-4 duration-300`}>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setActiveView('packing')}
                className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                  activeView === 'packing' 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
                }`}
              >
                <PackageOpen size={32} />
                <span className="font-bold text-sm text-center">Balící seznam</span>
              </button>
              <button
                onClick={() => setActiveView('documents')}
                className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                  activeView === 'documents' 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
                }`}
              >
                <LinkIcon size={32} />
                <span className="font-bold text-sm text-center">Odkazy</span>
              </button>
            </div>

            {/* Render actual tool content below if selected on mobile */}
            <div className="mt-8">
              {activeView === 'packing' && (
                <div className="animate-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-bold mb-4 px-2">Položky k zabalení</h3>
                  {/* The actual packing content is below in the editor section */}
                </div>
              )}
              {activeView === 'documents' && (
                <div className="animate-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-bold mb-4 px-2">Odkazy a poznámky</h3>
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
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 print:bg-white print:border-none p-6 md:p-8 rounded-2xl print:p-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white print:text-black mb-6 border-b border-gray-200 dark:border-white/10 print:border-black pb-4 flex items-center gap-3">
                <PackageOpen className="text-blue-500 print:text-black" /> Balící seznam
              </h2>
              
              <div className="space-y-4">
                <div className="relative print:hidden">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Plus size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    onKeyDown={addPackingItem}
                    placeholder="Přidat položku (stiskněte Enter)"
                    className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2 mt-6 print:mt-0 print:grid print:grid-cols-2 print:gap-x-8">
                  {packingList.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 print:hidden">Zatím tu nic není. Přidejte první věc do batohu!</p>
                  ) : (
                    packingList.map(item => (
                      <div key={item.id} className="group flex items-center gap-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/5 px-4 py-3 rounded-xl transition-all hover:border-gray-300 dark:hover:border-white/10 print:border-none print:p-1 print:bg-transparent">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => togglePackingItem(item.id)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer print:text-black print:border-black"
                        />
                        <span className={`flex-1 font-medium transition-all print:text-black ${item.checked ? 'text-gray-400 line-through print:line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                          {item.text}
                        </span>
                        <button
                          onClick={() => deletePackingItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 print:hidden"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`${activeView === 'documents' ? 'block' : 'hidden'} ${mobileTab === 'tools' ? '' : 'max-md:hidden'} mb-8 print:mb-12`}>
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 print:bg-white print:border-none p-6 md:p-8 rounded-2xl print:p-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white print:text-black mb-6 border-b border-gray-200 dark:border-white/10 print:border-black pb-4 flex items-center gap-3">
                <LinkIcon className="text-blue-500 print:text-black" /> Odkazy a poznámky
              </h2>
              
              <form onSubmit={addDocument} className="print:hidden bg-white dark:bg-black/20 border border-gray-200 dark:border-white/5 p-5 rounded-xl space-y-4 mb-8">
                <div>
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="Název (např. Letenky, Airbnb)"
                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <textarea
                    name="content"
                    required
                    placeholder="Vložte URL odkaz nebo libovolnou textovou poznámku..."
                    rows="2"
                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all resize-y"
                  ></textarea>
                </div>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors">
                  Uložit
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1 print:gap-2">
                {documents.length === 0 ? (
                  <div className="col-span-full text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl print:hidden">
                    Žádné uložené odkazy.
                  </div>
                ) : (
                  documents.map(doc => {
                    const isUrl = doc.content.startsWith('http://') || doc.content.startsWith('https://');
                    return (
                      <div key={doc.id} className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 print:border-none p-5 rounded-xl group relative pr-12 print:p-2 print:pr-0 print:bg-transparent">
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                        >
                          <Trash2 size={16} />
                        </button>
                        <h4 className="font-bold text-gray-900 dark:text-white print:text-black mb-2 pr-4 print:pr-0">{doc.title}</h4>
                        {isUrl ? (
                          <a href={doc.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline break-all print:text-black print:no-underline">
                            <ExternalLink size={14} className="print:hidden" /> {doc.content}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-400 print:text-black whitespace-pre-wrap">{doc.content}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className={`${activeView === 'diary' ? 'block' : 'hidden'} ${mobileTab === 'info' ? '' : 'max-md:hidden'} print:hidden`}>
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 md:p-8 rounded-2xl flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
                <ImageIcon size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Deník a Fotogalerie</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Tato funkce se momentálně připravuje! Brzy si zde budete moci zapisovat vzpomínky z cest, hodnotit výlety a vytvářet krásné fotogalerie. 
              </p>
              <span className="inline-flex px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-medium rounded-full text-sm">
                Připravujeme (Coming soon)
              </span>
            </div>
          </div>

          <div className={`${typeof activeView === 'number' ? 'block' : 'hidden'} ${mobileTab === 'itinerary' ? '' : 'max-md:hidden'} print:break-before-page`}>
            <h2 className="hidden print:flex text-2xl font-bold text-black mb-6 border-b border-black pb-4 items-center gap-3">
              <Calendar className="text-black" /> Itinerář výletu
            </h2>
            {dailyPlans.map((day, idx) => {
              if (typeof activeView === 'number' && activeView !== idx) return null; // In screen mode, show only active. In print mode, wait, map will show all if we override css.
              return (
                <div key={idx} className={`${typeof activeView === 'number' && activeView !== idx ? 'hidden print:block' : 'block'} mb-8 print:mb-10 print:break-inside-avoid`}>
                  <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 print:bg-white print:border-none p-6 md:p-8 rounded-2xl print:p-0">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white print:text-black mb-6 border-b border-gray-200 dark:border-white/10 print:border-black pb-4 flex items-baseline gap-3">
                      <span>Plán pro {day.title}</span>
                      <span className="text-sm font-normal text-gray-400 dark:text-gray-500 print:text-gray-600 capitalize">
                        ({format(new Date(day.date), 'EEEE, dd.MM.yyyy', { locale: cs })})
                      </span>
                    </h2>

                    <div className="space-y-6">
                      <div className={typeof activeView === 'number' ? 'block' : 'hidden print:block'}>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 print:text-black mb-2">
                          <MapPin size={16} /> Lokace (Město, Místo)
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
                          className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 print:border-none print:p-0 print:bg-transparent rounded-xl px-4 py-3 text-gray-900 dark:text-white print:text-black placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div className={typeof activeView === 'number' ? 'block' : 'hidden print:block'}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 print:text-black mb-2">
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
                          rows={8}
                          className="w-full bg-white dark:bg-black/50 border border-gray-300 dark:border-white/10 print:border-none print:p-0 print:bg-transparent rounded-xl px-4 py-3 text-gray-900 dark:text-white print:text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all resize-y print:min-h-0"
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
