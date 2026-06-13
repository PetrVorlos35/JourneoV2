import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, PackageOpen, Link as LinkIcon, ExternalLink, Image as ImageIcon, Layout, Briefcase, Info } from 'lucide-react';
import { format, eachDayOfInterval } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LikeButton from '../ui/LikeButton';
import UserAvatar from '../ui/UserAvatar';

const ReadOnlyTripView = () => {
  const { userId, tripId } = useParams();
  const { t } = useTranslation();
  const [trip, setTrip] = useState(null);
  const [owner, setOwner] = useState(null);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(0);
  const [mobileTab, setMobileTab] = useState('itinerary');

  useEffect(() => {
    const fetchTrip = async () => {
      setLoading(true);
      try {
        const data = await api.profile.getTrip(userId, tripId);
        setTrip(data.trip);
        setOwner(data.owner);
        setLikes(data.likes);
        setIsLiked(data.isLiked);
      } catch (err) {
        console.error('Failed to load trip:', err);
        toast.error(err.message || t('readOnlyTrip.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [userId, tripId]);

  if (loading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-bold text-xl">
        {t('readOnlyTrip.notFound')}
        <br />
        <Link to={`/dashboard/profile/${userId}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors mt-4 inline-block text-[13px] uppercase tracking-widest font-bold">
          {t('readOnlyTrip.backToProfile')}
        </Link>
      </div>
    );
  }

  const dailyPlans = (() => {
    try {
      const days = eachDayOfInterval({
        start: new Date(trip.startDate),
        end: new Date(trip.endDate),
      });
      return days.map((date, index) => {
        const existing = trip.activities?.[index];
        return {
          date,
          title: existing?.title || `Den ${index + 1}`,
          plan: existing?.plan || '',
          location: existing?.location || '',
        };
      });
    } catch {
      return [];
    }
  })();

  const packingList = trip.packingList || [];
  const documents = trip.documents || [];

  const ownerName = owner
    ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || t('friends.defaultName')
    : t('friends.defaultName');

  return (
    <div className="w-full h-full flex flex-col min-h-0 pb-10">
      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 flex justify-center pointer-events-none">
        <div className="glass-panel w-full max-w-sm rounded-[2rem] flex justify-around items-center px-2 py-3 pointer-events-auto border border-gray-200 dark:border-white/10 shadow-2xl">
          <button
            onClick={() => setMobileTab('itinerary')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${mobileTab === 'itinerary' ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-500 dark:text-gray-400'} cursor-pointer`}
          >
            <Layout size={20} strokeWidth={mobileTab === 'itinerary' ? 2.5 : 2} />
            {mobileTab === 'itinerary' && <span className="text-[9px] font-bold uppercase tracking-widest">{t('readOnlyTrip.tabs.itinerary')}</span>}
          </button>
          <button
            onClick={() => setMobileTab('tools')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${mobileTab === 'tools' ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-500 dark:text-gray-400'} cursor-pointer`}
          >
            <Briefcase size={20} strokeWidth={mobileTab === 'tools' ? 2.5 : 2} />
            {mobileTab === 'tools' && <span className="text-[9px] font-bold uppercase tracking-widest">{t('readOnlyTrip.tabs.tools')}</span>}
          </button>
          <button
            onClick={() => setMobileTab('info')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 ${mobileTab === 'info' ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-500 dark:text-gray-400'} cursor-pointer`}
          >
            <Info size={20} strokeWidth={mobileTab === 'info' ? 2.5 : 2} />
            {mobileTab === 'info' && <span className="text-[9px] font-bold uppercase tracking-widest">{t('readOnlyTrip.tabs.details')}</span>}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <Link
            to={`/dashboard/profile/${userId}`}
            className="inline-flex items-center text-[12px] uppercase tracking-widest font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors duration-300"
          >
            <ArrowLeft size={16} className="mr-2" strokeWidth={2.5} /> {t('readOnlyTrip.backToProfile')} {ownerName}
          </Link>

          <div className="flex items-center gap-4 mb-3">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
              {trip.title}
            </h1>
            {/* Read-only badge */}
            <span className="px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-full shrink-0">
              {t('readOnlyTrip.readOnly')}
            </span>
          </div>

          <p className="text-gray-500 flex items-center gap-2 text-[13px] font-bold tracking-widest uppercase">
            <Calendar size={16} strokeWidth={2.5} />
            {format(new Date(trip.startDate), 'dd.MM.yyyy')} — {format(new Date(trip.endDate), 'dd.MM.yyyy')}
          </p>
        </div>

        {/* Vote Button in header */}
        <div className="shrink-0 self-start md:self-auto">
          <LikeButton 
            tripId={parseInt(tripId)} 
            initialLikes={likes} 
            initialIsLiked={isLiked} 
            onLikeChange={(newLikes, newIsLiked) => {
              setLikes(newLikes);
              setIsLiked(newIsLiked);
            }} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:col-span-3 flex-col space-y-6 h-full min-h-0">

          <div className="glass-card p-6 space-y-2">
            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[11px] mb-4 ml-2">{t('readOnlyTrip.tabs.tools')}</h3>

            <button
              onClick={() => setActiveView('packing')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-xl transition-all duration-300 font-bold cursor-pointer ${
                activeView === 'packing'
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <PackageOpen size={18} strokeWidth={2.5} /> {t('readOnlyTrip.tools.packing')}
            </button>

            <button
              onClick={() => setActiveView('documents')}
              className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-xl transition-all duration-300 font-bold cursor-pointer ${
                activeView === 'documents'
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <LinkIcon size={18} strokeWidth={2.5} /> {t('readOnlyTrip.tools.documents')}
            </button>
          </div>

          <div className="glass-card p-6 space-y-2 flex-1 flex flex-col min-h-0">
            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-[11px] mb-4 ml-2">{t('readOnlyTrip.tabs.itinerary')}</h3>
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {dailyPlans.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setActiveView(index)}
                  className={`w-full flex items-center justify-between text-left px-4 py-4 rounded-xl transition-all duration-300 cursor-pointer ${
                    activeView === index
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
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

        {/* Main Content */}
        <div className="lg:col-span-9 h-full flex flex-col min-h-0">

          {/* Mobile Info View */}
          <div className={`${mobileTab === 'info' ? 'block' : 'hidden'} md:hidden space-y-6 animate-in fade-in duration-300`}>
            <div className="glass-card p-6 sm:p-8">
              <h2 className="font-bold text-2xl mb-8 flex items-center gap-3 text-gray-900 dark:text-white tracking-tight">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <Info size={20} strokeWidth={2.5} />
                </div>
                {t('readOnlyTrip.info.title')}
              </h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/10">
                  <span className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">{t('readOnlyTrip.info.author')}</span>
                  <div className="flex items-center gap-2">
                    <UserAvatar user={owner} size="sm" className="w-6 h-6 md:w-6 md:h-6 text-[9px]" />
                    <span className="font-bold text-gray-900 dark:text-white text-[15px]">{ownerName}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/10">
                  <span className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">{t('readOnlyTrip.info.date')}</span>
                  <span className="font-bold text-gray-900 dark:text-white text-[15px]">
                    {format(new Date(trip.startDate), 'd. M. yyyy')} — {format(new Date(trip.endDate), 'd. M. yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/10">
                  <span className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">{t('readOnlyTrip.info.days')}</span>
                  <span className="font-bold text-gray-900 dark:text-white text-[15px]">{dailyPlans.length} {t('readOnlyTrip.info.daysValue')}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">{t('readOnlyTrip.info.mode')}</span>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-full">{t('readOnlyTrip.readOnly')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Tools View */}
          <div className={`${mobileTab === 'tools' ? 'block' : 'hidden'} md:hidden animate-in fade-in duration-300`}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setActiveView('packing')}
                className={`flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 text-left cursor-pointer ${
                  activeView === 'packing'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-transparent glass-card text-gray-500 hover:text-gray-900'
                }`}
              >
                <PackageOpen size={28} strokeWidth={2} className="mb-4" />
                <span className="font-bold text-[15px] block mb-1 text-gray-900 dark:text-white leading-tight">{t('tripDetail.mobile.packing')}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {packingList.length} {t('tripDetail.mobile.items')}
                </span>
              </button>
              <button
                onClick={() => setActiveView('documents')}
                className={`flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 text-left cursor-pointer ${
                  activeView === 'documents'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-transparent glass-card text-gray-500 hover:text-gray-900'
                }`}
              >
                <LinkIcon size={28} strokeWidth={2} className="mb-4" />
                <span className="font-bold text-[15px] block mb-1 text-gray-900 dark:text-white leading-tight">{t('tripDetail.mobile.links')}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {documents.length} {t('tripDetail.mobile.records')}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Itinerary Navigation */}
          <div className={`${mobileTab === 'itinerary' && typeof activeView === 'number' ? 'block' : 'hidden'} md:block shrink-0`}>
            <div className="flex gap-4 overflow-x-auto pb-4 mb-8 no-scrollbar -mx-4 sm:-mx-8 px-4 sm:px-8 md:hidden">
              {dailyPlans.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setActiveView(index)}
                  className={`flex-shrink-0 w-[120px] text-left p-4 rounded-3xl transition-all duration-300 border-2 cursor-pointer ${
                    activeView === index
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-md shadow-blue-500/10'
                      : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1">
                    {format(new Date(day.date), 'EEE', { locale: cs })}
                  </div>
                  <div className="text-3xl font-bold tracking-tighter leading-none mb-2">{format(new Date(day.date), 'd.')}</div>
                  <div className="text-[11px] w-full truncate opacity-70 font-medium">{day.location || t('readOnlyTrip.noLocation')}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Packing List (Read-Only) ── */}
          <div className={`${activeView === 'packing' ? 'flex' : 'hidden'} ${mobileTab === 'tools' || mobileTab === 'itinerary' ? '' : 'max-md:hidden'} flex-col flex-1 lg:h-full lg:min-h-0`}>
            <div className="glass-card flex flex-col flex-1 lg:h-full lg:min-h-0 mb-6 lg:mb-0">
              <div className="p-5 sm:p-10 border-b border-gray-100 dark:border-white/10 shrink-0">
                <h2 className="font-bold text-3xl tracking-tight text-gray-900 dark:text-white flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                    <PackageOpen size={24} strokeWidth={2} />
                  </div>
                  {t('readOnlyTrip.packing.title')}
                </h2>
              </div>

              <div className="p-5 sm:p-10 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  {packingList.length === 0 ? (
                    <p className="text-gray-500 font-bold text-center py-12">{t('readOnlyTrip.packing.noItems')}</p>
                  ) : (
                    packingList.map(item => (
                      <div key={item.id} className="flex items-center gap-4 py-4 px-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                        <div className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center ${
                          item.checked
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {item.checked && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className={`flex-1 min-w-0 break-words text-[15px] font-bold transition-colors ${
                          item.checked ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'
                        }`}>
                          {item.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Documents (Read-Only) ── */}
          <div className={`${activeView === 'documents' ? 'flex' : 'hidden'} ${mobileTab === 'tools' || mobileTab === 'itinerary' ? '' : 'max-md:hidden'} flex-col flex-1 lg:h-full lg:min-h-0`}>
            <div className="glass-card flex flex-col flex-1 lg:h-full lg:min-h-0 mb-6 lg:mb-0">
              <div className="p-5 sm:p-10 border-b border-gray-100 dark:border-white/10 shrink-0">
                <h2 className="font-bold text-3xl tracking-tight text-gray-900 dark:text-white flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                    <LinkIcon size={24} strokeWidth={2} />
                  </div>
                  {t('readOnlyTrip.documents.title')}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-5 sm:p-10 gap-4">
                {documents.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 font-bold border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
                    {t('readOnlyTrip.documents.empty')}
                  </div>
                ) : (
                  documents.map(doc => {
                    const isUrl = doc.content.startsWith('http://') || doc.content.startsWith('https://');
                    return (
                      <div key={doc.id} className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-3xl">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-3 tracking-tight">{doc.title}</h4>
                        {isUrl ? (
                          <a href={doc.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-black text-[13px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors break-all rounded-xl shadow-sm border border-gray-100 dark:border-white/5 cursor-pointer">
                            <ExternalLink size={16} strokeWidth={2} /> {t('readOnlyTrip.documents.open')}
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

          {/* ── Itinerary (Read-Only) ── */}
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

                    {day.location && (
                      <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                        <MapPin size={18} strokeWidth={2.5} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="font-bold text-gray-900 dark:text-white text-base">{day.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 sm:p-10 flex-1 flex flex-col min-h-[300px] lg:min-h-0">
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 sm:mb-4 uppercase tracking-widest">
                      {t('readOnlyTrip.dayPlan')}
                    </label>
                    {day.plan ? (
                      <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-5 sm:p-6 overflow-y-auto custom-scrollbar">
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-medium text-[15px] leading-relaxed">
                          {day.plan}
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10">
                        <p className="text-gray-400 dark:text-gray-500 font-bold text-[15px]">{t('readOnlyTrip.noDayNotes')}</p>
                      </div>
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

export default ReadOnlyTripView;
