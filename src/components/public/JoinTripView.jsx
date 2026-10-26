import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Loader2, Link2Off, NotebookText, MapPinned, PackageOpen, Wallet } from 'lucide-react';
import { format, differenceInCalendarDays, startOfDay } from 'date-fns';
import { cs, enUS } from 'date-fns/locale';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import useForceLightTheme from '../../hooks/useForceLightTheme';
import UserAvatar from '../ui/UserAvatar';
import Skeleton from '../ui/Skeleton';
import LandingLanguageSwitcher from '../LandingLanguageSwitcher';
import JourneoLogoBlack from '../../assets/Journeo_blacklogo.png';

const EASE = [0.22, 1, 0.36, 1];

/**
 * Landing page of a trip invite (/join/:token). A friend's link is the most
 * likely first contact with Journeo, so this shows the trip they're being
 * asked into — who's going, how much is already planned — and joining is one
 * button. Without an account the button goes through sign-up and comes back
 * here with ?accept=1, which finishes the join on its own.
 */
const JoinTripView = () => {
  useForceLightTheme();
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const reduceMotion = useReducedMotion();
  const dateLocale = i18n.language?.startsWith('en') ? enUS : cs;

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [joining, setJoining] = useState(false);
  const autoJoinRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    api.public.getInvite(token)
      .then((data) => { setInvite(data); setInvalid(false); })
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  const join = async () => {
    if (!user) {
      navigate('/auth', { state: { from: `/join/${token}?accept=1` } });
      return;
    }
    setJoining(true);
    try {
      const { tripId, status } = await api.trips.join(token);
      if (status === 'joined') toast.success(t('joinTrip.joined', { trip: invite?.trip?.title }));
      navigate(`/dashboard/trip/${tripId}`, { replace: true });
    } catch (err) {
      toast.error(err.message || t('joinTrip.error'));
      setJoining(false);
    }
  };

  // Návrat z registrace: dokončit připojení bez dalšího kliknutí.
  useEffect(() => {
    if (autoJoinRef.current || authLoading || !user || !invite) return;
    if (searchParams.get('accept') !== '1') return;
    autoJoinRef.current = true;
    join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, invite, searchParams]);

  const shell = (children) => (
    <div className="min-h-screen bg-desk text-primary flex flex-col">
      <header className="px-5 sm:px-8 pt-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={JourneoLogoBlack} alt="" className="h-7 w-auto" />
          <span className="font-bold text-[18px] tracking-tight">Journeo</span>
        </Link>
        <LandingLanguageSwitcher isDark={false} />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">{children}</main>
    </div>
  );

  if (loading) {
    return shell(
      <div className="w-full max-w-md glass-card rounded-[2rem] p-6 sm:p-8 space-y-5">
        <Skeleton className="w-14 h-14" rounded="rounded-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (invalid || !invite) {
    return shell(
      <div className="w-full max-w-md glass-card rounded-[2rem] p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-subtle text-muted flex items-center justify-center mx-auto mb-5">
          <Link2Off size={24} strokeWidth={2} aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-1.5">{t('joinTrip.invalid.title')}</h1>
        <p className="text-[14px] font-medium text-muted mb-6">{t('joinTrip.invalid.desc')}</p>
        <Link to="/" className="inline-flex items-center gap-2 rounded-2xl px-5 min-h-[44px] bg-ink text-white text-[14px] font-semibold hover:bg-gray-800 transition-colors">
          {t('joinTrip.invalid.cta')}
        </Link>
      </div>
    );
  }

  const { trip, owner, members = [], counts = {} } = invite;
  const ownerName = owner?.first_name || t('joinTrip.someone');
  const start = startOfDay(new Date(trip.startDate));
  const end = startOfDay(new Date(trip.endDate));
  const length = differenceInCalendarDays(end, start) + 1;
  const until = differenceInCalendarDays(start, startOfDay(new Date()));
  const people = [owner, ...members].filter(Boolean);
  const othersCount = members.length;

  const stats = [
    { id: 'plannedDays', Icon: NotebookText, value: counts.plannedDays },
    { id: 'places', Icon: MapPinned, value: counts.places },
    { id: 'packing', Icon: PackageOpen, value: counts.packing },
    { id: 'expenses', Icon: Wallet, value: counts.expenses },
  ].filter((s) => s.value > 0);

  const isBusy = joining || (searchParams.get('accept') === '1' && !!user);

  return shell(
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="w-full max-w-md glass-card rounded-[2rem] p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-5">
        <UserAvatar user={owner} size="lg" />
        <p className="text-[15px] font-semibold text-secondary">
          {t('joinTrip.invitedBy', { name: ownerName })}
        </p>
      </div>

      <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-tight" style={{ textWrap: 'balance' }}>
        {trip.title}
      </h1>
      <div className="mt-2 overflow-hidden">
      <p className="meta-dots -ml-5 flex flex-wrap items-center gap-y-1 text-[14px] font-medium text-muted tabular-nums">
        <span className="text-primary font-semibold">
          {format(start, 'd. MMM', { locale: dateLocale })} – {format(end, 'd. MMM yyyy', { locale: dateLocale })}
        </span>
        <span>{t('joinTrip.days', { count: length })}</span>
        {until > 0 && <span>{t('joinTrip.countdown', { count: until })}</span>}
      </p>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex -space-x-2">
          {people.slice(0, 5).map((p, i) => (
            <UserAvatar key={i} user={p} size="sm" className="ring-2 ring-white" />
          ))}
        </div>
        <p className="text-[13px] font-medium text-muted">
          {othersCount > 0
            ? t('joinTrip.crew', { name: ownerName, count: othersCount })
            : t('joinTrip.crewSolo', { name: ownerName })}
        </p>
      </div>

      {stats.length > 0 && (
        <ul className="mt-5 grid grid-cols-2 gap-2">
          {stats.map(({ id, Icon, value }) => (
            <li key={id} className="flex items-center gap-2.5 rounded-2xl bg-field border border-gray-200/70 px-3 py-2.5">
              <Icon size={16} strokeWidth={2.25} className="text-muted shrink-0" aria-hidden="true" />
              <span className="text-[13px] font-semibold text-primary tabular-nums">{t(`joinTrip.stats.${id}`, { count: value })}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-5 text-[14px] font-medium text-secondary" style={{ textWrap: 'pretty' }}>
        {t('joinTrip.pitch')}
      </p>

      <button
        onClick={join}
        disabled={isBusy}
        className="group mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl min-h-[52px] bg-accent text-white text-[16px] font-semibold hover:bg-accent-hover shadow-[0_6px_16px_-8px_rgba(37,99,235,0.7)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-80 disabled:cursor-wait"
      >
        {isBusy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}
        {isBusy ? t('joinTrip.joining') : t('joinTrip.cta')}
        {!isBusy && <ArrowRight size={18} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
      </button>
      <p className="mt-3 text-center text-[12px] font-medium text-muted">
        {user ? t('joinTrip.signedInAs', { email: user.email }) : t('joinTrip.microcopy')}
      </p>
    </motion.div>
  );
};

export default JoinTripView;
