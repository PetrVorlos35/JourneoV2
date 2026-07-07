import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, Calendar, Pencil, Check, PackageOpen, Link as LinkIcon, Plus, Trash2, ExternalLink, Layout, Briefcase, Info, Users, Eye, Heart, Wallet } from 'lucide-react';
import { format, eachDayOfInterval } from 'date-fns';
import { cs } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useDialog } from '../ui/DialogModal';
import LocationAutocomplete from '../ui/LocationAutocomplete';
import CharCount from '../ui/CharCount';
import { useUnsavedChanges } from '../../contexts/UnsavedChangesContext';
import LikeButton from '../ui/LikeButton';
import ShareTripModal from './ShareTripModal';
import Budget from './Budget';
import { useCurrency } from '../../contexts/CurrencyContext';

const TripDetail = ({ trips, onUpdateTrip }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get('from');
  const { confirmDialog, ModalPortal } = useDialog();
  const { t, i18n } = useTranslation();
  const trip = trips.find(tr => tr.id === id);

  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;
  const backHref = fromParam === 'all' ? '/dashboard/all-trips' : '/dashboard';
  const backText = t(fromParam === 'all' ? 'tripDetail.backToAll' : 'tripDetail.backToDashboard');

  const [activeView, setActiveView] = useState(0);
  const [mobileTab, setMobileTab] = useState('itinerary');
  const [dailyPlans, setDailyPlans] = useState([]);
  const [packingList, setPackingList] = useState(trip?.packingList || []);
  const [documents, setDocuments] = useState(trip?.documents || []);
  const [newPackingItem, setNewPackingItem] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [tripTitle, setTripTitle] = useState(trip?.title || '');
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();
  const titleInputRef = useRef(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const { currency } = useCurrency();
  const currSymbols = { CZK: 'Kč', EUR: '€', USD: '$', GBP: '£' };
  const currSymbol = currSymbols[currency] || currency;

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

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIndex = initialPlans.findIndex(day => {
        const d = new Date(day.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
      if (todayIndex !== -1) setActiveView(todayIndex);
    }
  }, [trip?.id]);

  if (!trip) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-bold text-xl">
        {t('tripDetail.notFound')}
        <br />
        <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors mt-4 inline-block text-[13px] font-semibold">
          {t('tripDetail.backToOverview')}
        </Link>
      </div>
    );
  }

  const isViewer = trip.role === 'viewer';

  const handleSave = () => {
    onUpdateTrip({
      ...trip,
      title: tripTitle,
      activities: dailyPlans,
      packingList,
      documents
    });
    setHasUnsavedChanges(false);
    toast.success(t('tripDetail.save.success'));
  };

  const togglePackingItem = (itemId) => {
    setPackingList(prev => prev.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item));
    setHasUnsavedChanges(true);
  };

  const deletePackingItem = async (itemId) => {
    const ok = await confirmDialog({
      title: t('tripDetail.packing.delete.title'),
      message: t('tripDetail.packing.delete.message'),
      confirmLabel: t('tripDetail.packing.delete.confirm'),
      variant: 'danger'
    });
    if (ok) {
      setPackingList(prev => prev.filter(item => item.id !== itemId));
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

  const deleteDocument = async (docId) => {
    const ok = await confirmDialog({
      title: t('tripDetail.documents.delete.title'),
      message: t('tripDetail.documents.delete.message'),
      confirmLabel: t('tripDetail.documents.delete.confirm'),
      variant: 'danger'
    });
    if (ok) {
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
      setHasUnsavedChanges(true);
    }
  };

  const addDocument = (e) => {
    e.preventDefault();
    const title = docTitle.trim();
    const content = docContent.trim();
    if (!title || !content) return;
    setDocuments([...documents, { id: Date.now().toString(), title, content }]);
    setHasUnsavedChanges(true);
    setDocTitle('');
    setDocContent('');
  };

  const handleBack = async () => {
    if (hasUnsavedChanges) {
      const ok = await confirmDialog({
        title: t('tripDetail.unsaved.title'),
        message: t('tripDetail.unsaved.message'),
        confirmLabel: t('tripDetail.unsaved.confirm'),
        variant: 'danger'
      });
      if (!ok) return;
    }
    navigate(backHref);
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 pb-10">
      {ModalPortal}
      <ShareTripModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} trip={trip} />

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50 flex justify-center pointer-events-none">
        <div className="glass-panel w-full max-w-sm rounded-[2rem] flex justify-around items-center px-2 py-3 pointer-events-auto border border-gray-200 dark:border-white/10 shadow-2xl">
          <button
            onClick={() => setMobileTab('itinerary')}
            className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 py-1 ${mobileTab === 'itinerary' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'} cursor-pointer disabled:cursor-not-allowed`}
          >
            <Layout size={20} strokeWidth={mobileTab === 'itinerary' ? 2.5 : 2} aria-hidden="true" />
            <span className="text-[11px] font-semibold">{t('tripDetail.tabs.itinerary')}</span>
          </button>
          <button
            onClick={() => setMobileTab('tools')}
            className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 py-1 ${mobileTab === 'tools' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'} cursor-pointer disabled:cursor-not-allowed`}
          >
            <Briefcase size={20} strokeWidth={mobileTab === 'tools' ? 2.5 : 2} aria-hidden="true" />
            <span className="text-[11px] font-semibold">{t('tripDetail.tabs.tools')}</span>
          </button>
          <button
            onClick={() => setMobileTab('info')}
            className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 py-1 ${mobileTab === 'info' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'} cursor-pointer disabled:cursor-not-allowed`}
          >
            <Info size={20} strokeWidth={mobileTab === 'info' ? 2.5 : 2} aria-hidden="true" />
            <span className="text-[11px] font-semibold">{t('tripDetail.tabs.details')}</span>
          </button>
          {!isViewer && (
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={`flex flex-col items-center gap-1 flex-1 transition-all duration-300 py-1 ${hasUnsavedChanges ? 'text-red-500 cursor-pointer' : 'text-gray-400 dark:text-gray-500 opacity-50 cursor-not-allowed'}`}
            >
              <Save size={20} strokeWidth={hasUnsavedChanges ? 2.5 : 2} aria-hidden="true" />
              <span className="text-[11px] font-semibold">{t('tripDetail.tabs.save')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex-1">
          <button onClick={handleBack} className="inline-flex items-center text-[13px] font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed">
            <ArrowLeft size={16} className="mr-2" strokeWidth={2.5} /> {backText}
          </button>

          <div className="flex items-center gap-4 mb-3">
            {!isViewer && editingTitle ? (
              <div className="flex flex-col gap-1 w-full max-w-md">
                <div className="flex items-center gap-3">
                  <input
                    ref={titleInputRef}
                    value={tripTitle}
                    maxLength={255}
                    aria-label={t('tripDetail.rename')}
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
                <div className="flex justify-end pr-12">
                  <CharCount value={tripTitle} max={255} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 group">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight" style={{ textWrap: 'balance' }}>{tripTitle}</h1>
                {!isViewer && (
                  <button onClick={() => setEditingTitle(true)} className="text-gray-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-2 bg-gray-100 dark:bg-white/5 rounded-full hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer disabled:cursor-not-allowed" title={t('tripDetail.rename')}>
                    <Pencil size={18} strokeWidth={2} />
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="text-gray-500 flex items-center flex-wrap gap-2 text-[13px] font-medium">
            <Calendar size={16} strokeWidth={2.5} />
            {format(new Date(trip.startDate), 'dd.MM.yyyy')} — {format(new Date(trip.endDate), 'dd.MM.yyyy')}
            {(trip.expenses?.length > 0 || trip.budgetTarget) && (
              <button
                onClick={() => { setMobileTab('tools'); setActiveView('budget'); }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer"
              >
                <Wallet size={10} strokeWidth={2.5} />
                {trip.expenses?.length > 0
                  ? `${(trip.expenses.reduce((s, e) => s + e.amount, 0)).toLocaleString(i18n.language)} ${currSymbol}${trip.budgetTarget ? ` / ${trip.budgetTarget.toLocaleString(i18n.language)} ${currSymbol}` : ''}`
                  : t('tripDetail.tools.budget')
                }
              </button>
            )}
            {trip.role && trip.role !== 'owner' && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                isViewer
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                  : 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20'
              }`}>
                {isViewer ? <Eye size={10} strokeWidth={2.5} /> : <Pencil size={10} strokeWidth={2.5} />}
                {t(`tripDetail.roles.${trip.role}`)}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {trip.role === 'owner' ? (
            <div className="flex items-center gap-1.5 text-gray-400 dark:text-white/30 select-none">
              <Heart size={16} strokeWidth={2} />
              <span className="text-[13px] font-semibold tabular-nums">{trip.likes || 0}</span>
            </div>
          ) : (
            <LikeButton
              tripId={trip.id}
              initialLikes={trip.likes || 0}
              initialIsLiked={trip.isLiked || false}
            />
          )}
          {trip.role === 'owner' && (
            <>
              <button
                onClick={() => setShowShareModal(true)}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all duration-300 cursor-pointer shrink-0"
                title={t('shareModal.shareButton')}
              >
                <Users size={18} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="hidden md:flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold transition-all duration-300 shrink-0 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 cursor-pointer"
              >
                <Users size={18} strokeWidth={2.5} /> {t('shareModal.shareButton')}
              </button>
            </>
          )}
          {!isViewer && (
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={`hidden md:flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all duration-300 shrink-0 ${
                hasUnsavedChanges
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20 active:scale-95 hover:bg-red-600'
                  : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 cursor-default'
              } cursor-pointer disabled:cursor-not-allowed`}
            >
              <Save size={18} strokeWidth={2.5} /> {hasUnsavedChanges ? t('tripDetail.save.unsaved') : t('tripDetail.save.saved')}
            </button>
          )}
        </div>
      </div>

      {isViewer && (
        <div className="mb-8 flex items-center gap-3 px-4 sm:px-5 py-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-amber-700 dark:text-amber-400">
          <Eye size={16} strokeWidth={2.5} className="shrink-0" />
          <span className="text-[13px] font-bold">{t('tripDetail.viewerBanner')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:col-span-3 flex-col h-full min-h-0">
          <div className="glass-card p-5 flex flex-col h-full min-h-0">

            {/* Tool strip */}
            <div className="flex gap-2 mb-5 shrink-0">
              {[
                { id: 'packing', Icon: PackageOpen, label: t('tripDetail.tools.packing') },
                { id: 'documents', Icon: LinkIcon, label: t('tripDetail.tools.documents') },
                { id: 'budget', Icon: Wallet, label: t('tripDetail.tools.budget'), badge: trip.expenses?.length || null },
              ].map(({ id, Icon, label, badge }) => (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className={`relative flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-[10px] font-semibold transition-all duration-200 cursor-pointer ${
                    activeView === id
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={18} strokeWidth={2.5} />
                  {label}
                  {badge > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center text-[9px] font-bold rounded-full bg-blue-600 text-white">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 dark:bg-white/10 -mx-5 mb-5 shrink-0" />

            {/* Itinerary days */}
            <p className="text-[11px] font-semibold text-gray-400 mb-3 shrink-0">{t('tripDetail.itinerary.label')}</p>
            <div className="space-y-1.5 overflow-y-auto flex-1 custom-scrollbar pr-1">
              {dailyPlans.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setActiveView(index)}
                  className={`w-full flex items-center justify-between text-left px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    activeView === index
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                  } cursor-pointer`}
                >
                  <div className="min-w-0">
                    <div className="font-bold truncate text-[14px]">{day.title}</div>
                    <div className={`text-[11px] mt-0.5 font-medium ${activeView === index ? 'text-blue-200' : 'text-gray-400'}`}>
                      {format(new Date(day.date), 'EEE, dd.MM.', { locale: dateLocale })}
                    </div>
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 h-full flex flex-col min-h-0">

          {/* Mobile Info View */}
          <div className={`${mobileTab === 'info' ? 'block' : 'hidden'} md:hidden space-y-6 animate-in fade-in duration-300`}>
            <div className="glass-card p-6 sm:p-8">
              <h2 className="font-bold text-2xl mb-8 flex items-center gap-3 text-gray-900 dark:text-white tracking-tight">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <Info size={20} strokeWidth={2.5} />
                </div>
                {t('tripDetail.info.title')}
              </h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/10">
                  <span className="text-gray-600 dark:text-gray-400 text-[13px] font-medium">{t('tripDetail.info.date')}</span>
                  <span className="font-bold text-gray-900 dark:text-white text-[15px]">
                    {format(new Date(trip.startDate), 'd. M. yyyy')} — {format(new Date(trip.endDate), 'd. M. yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/10">
                  <span className="text-gray-600 dark:text-gray-400 text-[13px] font-medium">{t('tripDetail.info.days')}</span>
                  <span className="font-bold text-gray-900 dark:text-white text-[15px]">{dailyPlans.length} {t('tripDetail.info.daysValue')}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-600 dark:text-gray-400 text-[13px] font-medium">{t('tripDetail.info.status')}</span>
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold rounded-full">{t('tripDetail.info.statusValue')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Tools Selection */}
          <div className={`${mobileTab === 'tools' ? 'block' : 'hidden'} md:hidden animate-in fade-in duration-300`}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setActiveView('packing')}
                className={`flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 text-left ${activeView === 'packing' ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'border-transparent glass-card text-gray-500 hover:text-gray-900'} cursor-pointer disabled:cursor-not-allowed`}
              >
                <PackageOpen size={28} strokeWidth={2} className="mb-4" />
                <span className="font-bold text-[15px] block mb-1 text-gray-900 dark:text-white leading-tight">{t('tripDetail.mobile.packing')}</span>
                <span className="text-[11px] font-medium">
                  {packingList.length} {t('tripDetail.mobile.items')}
                </span>
              </button>
              <button
                onClick={() => setActiveView('documents')}
                className={`flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 text-left ${activeView === 'documents' ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'border-transparent glass-card text-gray-500 hover:text-gray-900'} cursor-pointer disabled:cursor-not-allowed`}
              >
                <LinkIcon size={28} strokeWidth={2} className="mb-4" />
                <span className="font-bold text-[15px] block mb-1 text-gray-900 dark:text-white leading-tight">{t('tripDetail.mobile.links')}</span>
                <span className="text-[11px] font-medium">
                  {documents.length} {t('tripDetail.mobile.records')}
                </span>
              </button>
              <button
                onClick={() => setActiveView('budget')}
                className={`col-span-2 flex items-center gap-5 p-5 rounded-3xl border-2 transition-all duration-300 text-left ${activeView === 'budget' ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'border-transparent glass-card text-gray-500 hover:text-gray-900'} cursor-pointer disabled:cursor-not-allowed`}
              >
                <Wallet size={26} strokeWidth={2} className="shrink-0" />
                <div>
                  <span className="font-bold text-[15px] block mb-0.5 text-gray-900 dark:text-white leading-tight">{t('tripDetail.mobile.budget')}</span>
                  <span className="text-[11px] font-medium">
                    {trip.expenses?.length > 0
                      ? `${(trip.expenses.reduce((s, e) => s + e.amount, 0)).toLocaleString(i18n.language)} ${currSymbol}`
                      : t('tripDetail.mobile.budgetEmpty')
                    }
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Itinerary Day Scroller */}
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
                  <div className="text-[10px] font-semibold mb-1">
                    {format(new Date(day.date), 'EEE', { locale: dateLocale })}
                  </div>
                  <div className="text-3xl font-bold tracking-tighter leading-none mb-2">{format(new Date(day.date), 'd.')}</div>
                  <div className="text-[11px] w-full truncate opacity-70 font-medium">{day.location || t('tripDetail.itinerary.noLocation')}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Packing List */}
          <div className={`${activeView === 'packing' ? 'flex' : 'hidden'} ${mobileTab === 'tools' || mobileTab === 'itinerary' ? '' : 'max-md:hidden'} flex-col flex-1 lg:h-full lg:min-h-0`}>
            <div className="glass-card flex flex-col flex-1 lg:h-full lg:min-h-0 mb-6 lg:mb-0">
              <div className="p-5 sm:p-10 border-b border-gray-100 dark:border-white/10 shrink-0">
                <h2 className="font-bold text-3xl tracking-tight text-gray-900 dark:text-white flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                    <PackageOpen size={24} strokeWidth={2} />
                  </div>
                  {t('tripDetail.packing.title')}
                </h2>
                {!isViewer && (
                  <>
                    <div className="relative">
                      <label htmlFor="new-packing-item" className="sr-only">{t('tripDetail.packing.placeholder')}</label>
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Plus size={20} className="text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                      </div>
                      <input
                        id="new-packing-item"
                        type="text"
                        value={newPackingItem}
                        onChange={(e) => setNewPackingItem(e.target.value)}
                        onKeyDown={addPackingItem}
                        maxLength={255}
                        placeholder={t('tripDetail.packing.placeholder')}
                        className="glass-input !py-3 sm:!py-4 !pl-12 sm:!pl-14 text-[15px] sm:text-base w-full"
                      />
                    </div>
                    <div className="flex justify-end mt-1.5 pr-1">
                      <CharCount value={newPackingItem} max={255} />
                    </div>
                  </>
                )}
              </div>
              <div className="p-5 sm:p-10 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  {packingList.length === 0 ? (
                    <p className="text-gray-500 font-bold text-center py-12">{t('tripDetail.packing.empty')}</p>
                  ) : (
                    packingList.map(item => (
                      <div key={item.id} className="group flex items-center gap-4 py-4 px-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                        <input
                          type="checkbox"
                          aria-labelledby={`packing-item-${item.id}`}
                          checked={item.checked}
                          onChange={isViewer ? () => {} : () => togglePackingItem(item.id)}
                          disabled={isViewer}
                          className={`w-6 h-6 shrink-0 rounded-md border-2 border-gray-300 dark:border-gray-600 text-blue-600 bg-transparent focus:ring-blue-500 ${isViewer ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        />
                        <span id={`packing-item-${item.id}`} className={`flex-1 min-w-0 break-words text-[15px] font-bold transition-colors ${item.checked ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                          {item.text}
                        </span>
                        {!isViewer && (
                          <button
                            onClick={() => deletePackingItem(item.id)}
                            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-red-100 dark:hover:bg-red-500/20 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Trash2 size={18} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className={`${activeView === 'documents' ? 'flex' : 'hidden'} ${mobileTab === 'tools' || mobileTab === 'itinerary' ? '' : 'max-md:hidden'} flex-col flex-1 lg:h-full lg:min-h-0`}>
            <div className="glass-card flex flex-col flex-1 lg:h-full lg:min-h-0 mb-6 lg:mb-0">
              <div className="p-5 sm:p-10 border-b border-gray-100 dark:border-white/10 shrink-0">
                <h2 className="font-bold text-3xl tracking-tight text-gray-900 dark:text-white flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                    <LinkIcon size={24} strokeWidth={2} />
                  </div>
                  {t('tripDetail.documents.title')}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-5 sm:p-10 gap-8">
                {!isViewer && (
                  <form onSubmit={addDocument} className="p-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl space-y-4 shrink-0">
                    <div>
                      <label htmlFor="doc-title" className="sr-only">{t('tripDetail.documents.titlePlaceholder')}</label>
                      <input
                        id="doc-title"
                        type="text"
                        required
                        maxLength={255}
                        placeholder={t('tripDetail.documents.titlePlaceholder')}
                        value={docTitle}
                        onChange={e => setDocTitle(e.target.value)}
                        className="glass-input border-none bg-white dark:bg-black/50 !py-3 sm:!py-4 shadow-sm text-[15px] sm:text-base w-full"
                      />
                      <div className="flex justify-end mt-1.5 pr-1">
                        <CharCount value={docTitle} max={255} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="doc-content" className="sr-only">{t('tripDetail.documents.contentPlaceholder')}</label>
                      <textarea
                        id="doc-content"
                        required
                        maxLength={2000}
                        placeholder={t('tripDetail.documents.contentPlaceholder')}
                        rows="2"
                        value={docContent}
                        onChange={e => setDocContent(e.target.value)}
                        className="glass-input border-none bg-white dark:bg-black/50 !py-3 sm:!py-4 resize-y shadow-sm text-[15px] sm:text-base min-h-[100px] w-full"
                      />
                      <div className="flex justify-end mt-1.5 pr-1">
                        <CharCount value={docContent} max={2000} />
                      </div>
                    </div>
                    <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed">
                      {t('tripDetail.documents.save')}
                    </button>
                  </form>
                )}
                <div className="grid grid-cols-1 gap-4">
                  {documents.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 font-bold border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
                      {t('tripDetail.documents.empty')}
                    </div>
                  ) : (
                    documents.map(doc => {
                      const isUrl = doc.content.startsWith('http://') || doc.content.startsWith('https://');
                      return (
                        <div key={doc.id} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-3xl group relative">
                          {!isViewer && (
                            <button
                              onClick={() => deleteDocument(doc.id)}
                              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-red-100 dark:hover:bg-red-500/20 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <Trash2 size={16} strokeWidth={2} />
                            </button>
                          )}
                          <h4 className={`font-bold text-lg text-gray-900 dark:text-white mb-3 tracking-tight ${!isViewer ? 'pr-10' : ''}`}>{doc.title}</h4>
                          {isUrl ? (
                            <a href={doc.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-black text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors break-all rounded-xl shadow-sm border border-gray-100 dark:border-white/5 cursor-pointer disabled:cursor-not-allowed">
                              <ExternalLink size={16} strokeWidth={2} /> {t('tripDetail.documents.open')}
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

          {/* Budget */}
          <div className={`${activeView === 'budget' ? 'block' : 'hidden'} ${mobileTab === 'tools' ? '' : 'max-md:hidden'} mb-6 lg:mb-0`}>
            <Budget trips={[trip]} onUpdateTrip={onUpdateTrip} hideHeader />
          </div>

          {/* Itinerary Editor */}
          <div className={`${typeof activeView === 'number' ? 'flex' : 'hidden'} ${mobileTab === 'itinerary' ? '' : 'max-md:hidden'} flex-col flex-1 lg:h-full lg:min-h-0`}>
            {dailyPlans.map((day, idx) => {
              if (activeView !== idx) return null;
              return (
                <div key={idx} className="glass-card flex flex-col flex-1 lg:h-full lg:min-h-0 mb-6 lg:mb-0">
                  <div className="p-5 sm:p-10 border-b border-gray-100 dark:border-white/10 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-5 sm:mb-8">
                      <h2 className="font-bold text-2xl sm:text-4xl tracking-tight text-gray-900 dark:text-white">{day.title}</h2>
                      <span className="text-[13px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full w-fit">
                        {format(new Date(day.date), 'EEEE, d. M.', { locale: dateLocale })}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        <MapPin size={16} strokeWidth={2.5} /> {t('tripDetail.itinerary.locationLabel')}
                      </label>
                      {isViewer ? (
                        <p className="py-3 sm:py-4 px-4 sm:px-5 font-bold text-base sm:text-lg text-gray-900 dark:text-white min-h-[52px]">
                          {day.location || <span className="text-gray-400 dark:text-gray-500 font-normal italic">{t('tripDetail.itinerary.noLocation')}</span>}
                        </p>
                      ) : (
                        <>
                          <LocationAutocomplete
                            value={day.location}
                            onChange={(value) => {
                              const updated = [...dailyPlans];
                              updated[idx].location = value;
                              setDailyPlans(updated);
                              setHasUnsavedChanges(true);
                            }}
                            placeholder={t('tripDetail.itinerary.locationPlaceholder')}
                            maxLength={255}
                            className="glass-input !py-3 sm:!py-4 !px-4 sm:!px-5 font-bold text-base sm:text-lg w-full"
                          />
                          <div className="flex justify-end mt-1.5 pr-1">
                            <CharCount value={day.location} max={255} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-5 sm:p-10 flex-1 flex flex-col min-h-[300px] lg:min-h-0">
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2 sm:mb-4">
                      {t('tripDetail.itinerary.planLabel')}
                    </label>
                    {isViewer ? (
                      <div className="flex-1 min-h-[250px] lg:min-h-0 py-3 sm:py-4 px-4 sm:px-5 text-[15px] sm:text-base font-medium leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {day.plan || <span className="text-gray-400 dark:text-gray-500 italic">{t('tripDetail.itinerary.planPlaceholder')}</span>}
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={day.plan}
                          maxLength={2000}
                          onChange={(e) => {
                            const updated = [...dailyPlans];
                            updated[idx].plan = e.target.value;
                            setDailyPlans(updated);
                            setHasUnsavedChanges(true);
                          }}
                          placeholder={t('tripDetail.itinerary.planPlaceholder')}
                          className="glass-input flex-1 min-h-[250px] lg:min-h-0 resize-y font-medium text-[15px] sm:text-base leading-relaxed"
                        />
                        <div className="flex justify-end mt-1.5 pr-1">
                          <CharCount value={day.plan} max={2000} />
                        </div>
                      </>
                    )}
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
