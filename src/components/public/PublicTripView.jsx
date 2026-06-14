import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Calendar, PackageOpen, Link as LinkIcon,
  ExternalLink, Heart, Check, AlertCircle,
  Layout, Briefcase, Info, ArrowRight
} from 'lucide-react';
import { format, eachDayOfInterval } from 'date-fns';
import { cs, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import JourneoLogo from '../../assets/Journeo_whitelogo.png';
import LandingLanguageSwitcher from '../LandingLanguageSwitcher';
import UserAvatar from '../ui/UserAvatar';

const PublicTripView = () => {
  const { token } = useParams();
  const { t, i18n } = useTranslation();
  const [trip, setTrip] = useState(null);
  const [owner, setOwner] = useState(null);
  const [likes, setLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState(0);
  const [mobileTab, setMobileTab] = useState('itinerary');

  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;

  useEffect(() => {
    api.public.getTrip(token)
      .then(data => {
        setTrip(data.trip);
        setOwner(data.owner);
        setLikes(data.likes);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={28} className="text-red-400" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
          {t('publicTrip.notFound.title')}
        </h1>
        <p className="text-white/40 text-[15px] mb-8 max-w-sm leading-relaxed">
          {error || t('publicTrip.notFound.desc')}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors duration-200 text-[14px] cursor-pointer"
        >
          {t('publicTrip.notFound.cta')}
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </div>
    );
  }

  const dailyPlans = (() => {
    try {
      const days = eachDayOfInterval({ start: new Date(trip.startDate), end: new Date(trip.endDate) });
      return days.map((date, index) => {
        const existing = trip.activities?.[index];
        return {
          date,
          title: existing?.title || `${t('publicTrip.day')} ${index + 1}`,
          plan: existing?.plan || '',
          location: existing?.location || '',
        };
      });
    } catch { return []; }
  })();

  const packingList = trip.packingList || [];
  const documents = trip.documents || [];
  const ownerName = owner ? `${owner.first_name || ''} ${owner.last_name || ''}`.trim() : '';

  return (
    <div className="bg-neutral-950 min-h-screen text-white">

      {/* ── Floating navbar ── */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-3xl rounded-full bg-[#1d1d1f]/70 backdrop-blur-[40px] saturate-[1.8] border border-white/10 shadow-sm px-2 py-2">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 pl-4 group cursor-pointer">
            <img
              src={JourneoLogo}
              alt="Journeo"
              className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-semibold text-lg tracking-tight text-white">Journeo</span>
          </Link>
          <div className="pr-1">
            <LandingLanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom nav ── */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 flex justify-center pointer-events-none">
        <div className="glass-panel w-full max-w-sm rounded-[2rem] flex justify-around items-center px-2 py-3 pointer-events-auto border border-white/10 shadow-2xl">
          <button
            onClick={() => setMobileTab('itinerary')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 cursor-pointer ${mobileTab === 'itinerary' ? 'text-blue-400 scale-110' : 'text-white/40 hover:text-white/70'}`}
          >
            <Layout size={20} strokeWidth={mobileTab === 'itinerary' ? 2.5 : 2} />
            {mobileTab === 'itinerary' && <span className="text-[9px] font-bold uppercase tracking-widest">{t('publicTrip.tabs.itinerary')}</span>}
          </button>
          <button
            onClick={() => setMobileTab('tools')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 cursor-pointer ${mobileTab === 'tools' ? 'text-blue-400 scale-110' : 'text-white/40 hover:text-white/70'}`}
          >
            <Briefcase size={20} strokeWidth={mobileTab === 'tools' ? 2.5 : 2} />
            {mobileTab === 'tools' && <span className="text-[9px] font-bold uppercase tracking-widest">{t('tripDetail.tabs.tools')}</span>}
          </button>
          <button
            onClick={() => setMobileTab('info')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all duration-300 cursor-pointer ${mobileTab === 'info' ? 'text-blue-400 scale-110' : 'text-white/40 hover:text-white/70'}`}
          >
            <Info size={20} strokeWidth={mobileTab === 'info' ? 2.5 : 2} />
            {mobileTab === 'info' && <span className="text-[9px] font-bold uppercase tracking-widest">{t('tripDetail.tabs.details')}</span>}
          </button>
        </div>
      </div>

      {/* ── Page wrapper ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-32 pb-28 w-full flex flex-col min-h-screen">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex-1">
            {/* Owner row */}
            {ownerName && (
              <div className="flex items-center gap-2.5 mb-5">
                <UserAvatar user={owner} size="sm" />
                <span className="text-[13px] font-semibold text-white/40">{ownerName}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/30 ml-1">
                  {t('publicTrip.readOnly')}
                </span>
              </div>
            )}

            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-3">
              {trip.title}
            </h1>

            <p className="text-white/40 flex items-center gap-2 text-[13px] font-bold tracking-widest uppercase">
              <Calendar size={16} strokeWidth={2.5} />
              {format(new Date(trip.startDate), 'dd.MM.yyyy')} — {format(new Date(trip.endDate), 'dd.MM.yyyy')}
            </p>
          </div>

          {/* Likes (static, read-only) */}
          <div className="flex items-center gap-1.5 text-white/25 select-none shrink-0">
            <Heart size={16} strokeWidth={2} />
            <span className="text-[13px] font-semibold tabular-nums">{likes}</span>
          </div>
        </div>

        {/* ── 12-col grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">

          {/* ── Desktop Sidebar ── */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 flex flex-col gap-6 max-h-[calc(100vh-7rem)]">

            {/* Tools */}
            <div className="glass-card p-6 space-y-2 shrink-0">
              <h3 className="font-bold text-white/40 uppercase tracking-widest text-[11px] mb-4 ml-2">
                {t('tripDetail.tabs.tools')}
              </h3>
              <button
                onClick={() => setActiveView('packing')}
                className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-xl transition-all duration-300 font-bold cursor-pointer ${
                  activeView === 'packing'
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <PackageOpen size={18} strokeWidth={2.5} /> {t('publicTrip.tabs.packing')}
              </button>
              <button
                onClick={() => setActiveView('documents')}
                className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-xl transition-all duration-300 font-bold cursor-pointer ${
                  activeView === 'documents'
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <LinkIcon size={18} strokeWidth={2.5} /> {t('publicTrip.tabs.documents')}
              </button>
            </div>

            {/* Day list */}
            <div className="glass-card p-6 flex flex-col min-h-0 flex-1 overflow-hidden">
              <h3 className="font-bold text-white/40 uppercase tracking-widest text-[11px] mb-4 ml-2 shrink-0">
                {t('publicTrip.tabs.itinerary')}
              </h3>
              <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {dailyPlans.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveView(index)}
                    className={`w-full flex items-center justify-between text-left px-4 py-4 rounded-xl transition-all duration-300 cursor-pointer ${
                      activeView === index
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-white bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold truncate text-[15px]">{day.title}</div>
                      <div className={`text-[11px] uppercase tracking-widest mt-1 font-bold ${activeView === index ? 'text-blue-200' : 'text-white/30'}`}>
                        {format(new Date(day.date), 'EEE, dd.MM.', { locale: dateLocale })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            </div>{/* end sticky wrapper */}
          </div>

          {/* ── Main content ── */}
          <div className="lg:col-span-9 h-full flex flex-col min-h-0">

            {/* Mobile Info tab */}
            <div className={`${mobileTab === 'info' ? 'block' : 'hidden'} md:hidden space-y-6 animate-in fade-in duration-300`}>
              <div className="glass-card p-6 sm:p-8">
                <h2 className="font-bold text-2xl mb-8 flex items-center gap-3 text-white tracking-tight">
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                    <Info size={20} strokeWidth={2.5} />
                  </div>
                  {t('tripDetail.info.title')}
                </h2>
                <div className="space-y-6">
                  {ownerName && (
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">{t('readOnlyTrip.info.author')}</span>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={owner} size="sm" />
                        <span className="font-bold text-white text-[15px]">{ownerName}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">{t('tripDetail.info.date')}</span>
                    <span className="font-bold text-white text-[15px]">
                      {format(new Date(trip.startDate), 'd. M. yyyy')} — {format(new Date(trip.endDate), 'd. M. yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">{t('tripDetail.info.days')}</span>
                    <span className="font-bold text-white text-[15px]">{dailyPlans.length} {t('tripDetail.info.daysValue')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">{t('tripDetail.info.mode') ?? 'Režim'}</span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {t('publicTrip.readOnly')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Tools tab */}
            <div className={`${mobileTab === 'tools' ? 'block' : 'hidden'} md:hidden animate-in fade-in duration-300`}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setActiveView('packing')}
                  className={`flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 text-left cursor-pointer ${
                    activeView === 'packing'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-transparent glass-card text-white/50 hover:text-white'
                  }`}
                >
                  <PackageOpen size={28} strokeWidth={2} className="mb-4" />
                  <span className="font-bold text-[15px] block mb-1 text-white leading-tight">{t('publicTrip.tabs.packing')}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                    {packingList.length} {t('tripDetail.mobile.items')}
                  </span>
                </button>
                <button
                  onClick={() => setActiveView('documents')}
                  className={`flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 text-left cursor-pointer ${
                    activeView === 'documents'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-transparent glass-card text-white/50 hover:text-white'
                  }`}
                >
                  <LinkIcon size={28} strokeWidth={2} className="mb-4" />
                  <span className="font-bold text-[15px] block mb-1 text-white leading-tight">{t('publicTrip.tabs.documents')}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                    {documents.length} {t('tripDetail.mobile.records')}
                  </span>
                </button>
              </div>
            </div>

            {/* Mobile day scroller */}
            <div className={`${mobileTab === 'itinerary' && typeof activeView === 'number' ? 'block' : 'hidden'} md:block shrink-0`}>
              <div className="flex gap-4 overflow-x-auto pb-4 mb-8 no-scrollbar -mx-4 sm:-mx-8 px-4 sm:px-8 md:hidden">
                {dailyPlans.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveView(index)}
                    className={`flex-shrink-0 w-[120px] text-left p-4 rounded-3xl transition-all duration-300 border-2 cursor-pointer ${
                      activeView === index
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-md shadow-blue-500/10'
                        : 'border-transparent bg-white/5 text-white/40'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1">
                      {format(new Date(day.date), 'EEE', { locale: dateLocale })}
                    </div>
                    <div className="text-3xl font-bold tracking-tighter leading-none mb-2">{format(new Date(day.date), 'd.')}</div>
                    <div className="text-[11px] w-full truncate opacity-70 font-medium">{day.location || '—'}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Packing list ── */}
            <div className={`${activeView === 'packing' ? 'flex' : 'hidden'} ${mobileTab === 'tools' || mobileTab === 'itinerary' ? '' : 'max-md:hidden'} flex-col flex-1 lg:h-full lg:min-h-0`}>
              <div className="glass-card flex flex-col flex-1 lg:h-full lg:min-h-0 mb-6 lg:mb-0">
                <div className="p-5 sm:p-10 border-b border-white/10 shrink-0">
                  <h2 className="font-bold text-3xl tracking-tight text-white flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center">
                      <PackageOpen size={24} strokeWidth={2} />
                    </div>
                    {t('publicTrip.tabs.packing')}
                  </h2>
                </div>
                <div className="p-5 sm:p-10 flex-1 overflow-y-auto custom-scrollbar">
                  {packingList.length === 0 ? (
                    <p className="text-white/30 font-bold text-center py-12">{t('publicTrip.packing.empty')}</p>
                  ) : (
                    <div className="space-y-3">
                      {packingList.map(item => (
                        <div key={item.id} className="flex items-center gap-4 py-4 px-5 bg-white/5 rounded-2xl border border-white/5">
                          <div className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
                            item.checked ? 'border-blue-500 bg-blue-500' : 'border-white/20'
                          }`}>
                            {item.checked && <Check size={12} strokeWidth={2.5} className="text-white" />}
                          </div>
                          <span className={`flex-1 min-w-0 break-words text-[15px] font-bold transition-colors ${
                            item.checked ? 'text-white/30 line-through' : 'text-white'
                          }`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Documents ── */}
            <div className={`${activeView === 'documents' ? 'flex' : 'hidden'} ${mobileTab === 'tools' || mobileTab === 'itinerary' ? '' : 'max-md:hidden'} flex-col flex-1 lg:h-full lg:min-h-0`}>
              <div className="glass-card flex flex-col flex-1 lg:h-full lg:min-h-0 mb-6 lg:mb-0">
                <div className="p-5 sm:p-10 border-b border-white/10 shrink-0">
                  <h2 className="font-bold text-3xl tracking-tight text-white flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center">
                      <LinkIcon size={24} strokeWidth={2} />
                    </div>
                    {t('publicTrip.tabs.documents')}
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-5 sm:p-10 gap-4">
                  {documents.length === 0 ? (
                    <div className="py-12 text-center text-white/30 font-bold border-2 border-dashed border-white/10 rounded-3xl">
                      {t('publicTrip.documents.empty')}
                    </div>
                  ) : (
                    documents.map(doc => {
                      const isUrl = doc.content.startsWith('http://') || doc.content.startsWith('https://');
                      return (
                        <div key={doc.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                          <h4 className="font-bold text-lg text-white mb-3 tracking-tight">{doc.title}</h4>
                          {isUrl ? (
                            <a
                              href={doc.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 text-[13px] font-bold text-blue-400 hover:text-blue-300 transition-colors rounded-xl border border-white/5 cursor-pointer"
                            >
                              <ExternalLink size={16} strokeWidth={2} /> {t('publicTrip.documents.open')}
                            </a>
                          ) : (
                            <p className="text-[14px] text-white/40 whitespace-pre-wrap font-medium">{doc.content}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ── Itinerary day view ── */}
            <div className={`${typeof activeView === 'number' ? 'flex' : 'hidden'} ${mobileTab === 'itinerary' ? '' : 'max-md:hidden'} flex-col flex-1 lg:h-full lg:min-h-0`}>
              {dailyPlans.map((day, idx) => {
                if (activeView !== idx) return null;
                return (
                  <div key={idx} className="glass-card flex flex-col flex-1 lg:h-full lg:min-h-0 mb-6 lg:mb-0">
                    <div className="p-5 sm:p-10 border-b border-white/10 shrink-0">
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-5 sm:mb-8">
                        <h2 className="font-bold text-2xl sm:text-4xl tracking-tight text-white">{day.title}</h2>
                        <span className="text-[13px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full w-fit">
                          {format(new Date(day.date), 'EEEE, d. M.', { locale: dateLocale })}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-white/40 uppercase tracking-widest">
                          <MapPin size={16} strokeWidth={2.5} /> {t('tripDetail.itinerary.locationLabel')}
                        </label>
                        <p className="py-3 sm:py-4 px-4 sm:px-5 font-bold text-base sm:text-lg text-white min-h-[52px]">
                          {day.location || <span className="text-white/25 font-normal italic">{t('tripDetail.itinerary.noLocation')}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 sm:p-10 flex-1 flex flex-col min-h-[300px] lg:min-h-0">
                      <label className="block text-[11px] font-bold text-white/40 mb-2 sm:mb-4 uppercase tracking-widest">
                        {t('readOnlyTrip.dayPlan')}
                      </label>
                      {day.plan ? (
                        <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 p-5 sm:p-6 overflow-y-auto custom-scrollbar">
                          <p className="text-white/80 whitespace-pre-wrap font-medium text-[15px] leading-relaxed">
                            {day.plan}
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                          <p className="text-white/25 font-bold text-[15px]">{t('publicTrip.noDayNotes')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* ── CTA ── */}
        <div className="mt-16 pt-10 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight mb-1">
                {t('publicTrip.cta.title')}
              </h3>
              <p className="text-white/40 text-[14px]">
                {t('publicTrip.cta.desc')}
              </p>
            </div>
            <Link
              to="/auth"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-white/90 active:scale-95 text-black font-bold rounded-2xl transition-all duration-200 text-[14px] cursor-pointer whitespace-nowrap"
            >
              {t('publicTrip.cta.button')}
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
          <p className="text-[11px] text-white/20 font-medium mt-8 text-center sm:text-left">
            © {new Date().getFullYear()} Journeo · {t('publicTrip.footer')}
          </p>
        </div>

      </div>
    </div>
  );
};

export default PublicTripView;
