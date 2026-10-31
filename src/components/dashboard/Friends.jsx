import { useState, useEffect, useCallback, useRef, useId } from 'react';
import { Search, UserPlus, UserCheck, X, Clock, Copy, Check, RefreshCw, Link as LinkIcon, MoreHorizontal, ArrowRight, ArrowDownLeft, ArrowUpRight, Loader2, Plane } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useDialog } from '../ui/DialogModal';
import UserAvatar from '../ui/UserAvatar';
import { FriendsSkeleton, SuggestionSkeletonItems } from '../ui/Skeletons';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatCurrencyShort } from '../../utils/currency';
import { countryFlag } from '../../utils/country';
import { track } from '../../utils/analytics';

// Přátelé jako spolucestující: každý přítel je pasová karta toho, co jste
// spolu procestovali — výlety, země, dny, příští výlet a jak jste na tom
// s penězi. Čekající žádosti jsou nahoře, poslední karta zve dalšího.

const EASE_OUT = [0.16, 1, 0.3, 1];
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60';
const secondaryButton =
  `inline-flex items-center justify-center gap-1.5 h-11 sm:h-10 px-3.5 rounded-soft bg-subtle hover:bg-recess text-primary text-[13px] font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`;
const primaryButton =
  `inline-flex items-center justify-center gap-1.5 h-11 sm:h-10 px-4 rounded-soft bg-accent hover:bg-accent-hover text-on-accent text-[13px] font-semibold whitespace-nowrap shadow-glow transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${focusRing}`;

const displayName = (u) =>
  u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.email;

const Spinner = ({ size = 15 }) => (
  <Loader2 size={size} strokeWidth={2.5} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
);

const daysUntil = (isoDate) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((start - today) / 86400000);
};

// ── Menu „⋯“ na kartě ─────────────────────────────────────────
const CardMenu = ({ label, onRemove, busy, t }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`w-11 h-11 -mr-2 -mt-1 flex items-center justify-center rounded-control text-icon-muted hover:text-primary hover:bg-subtle transition-colors cursor-pointer ${focusRing}`}
      >
        {busy ? <Spinner size={16} /> : <MoreHorizontal size={18} strokeWidth={2.25} />}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1 z-20 min-w-48 p-1.5 bg-page rounded-soft border border-default shadow-popover">
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onRemove(); }}
            className={`w-full text-left px-3 h-10 rounded-control text-[14px] font-semibold text-danger hover:bg-danger-wash transition-colors cursor-pointer ${focusRing}`}
          >
            {t('friends.card.remove')}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Pasová karta přítele ──────────────────────────────────────
const FriendCard = ({ friend, balance, onRemove, busy, t, i18n, currency }) => {
  const name = displayName(friend);
  const shared = friend.shared || { trips: 0, days: 0, countries: [], nextTrip: null };
  const since = friend.friendsSince
    ? new Date(friend.friendsSince).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-GB' : 'cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const next = shared.nextTrip;
  const nextIn = next ? daysUntil(next.startDate) : null;
  const money = (v) => formatCurrencyShort(v, currency, i18n.language);

  return (
    <article className="bg-page border border-default rounded-page shadow-page p-5 sm:p-6 flex flex-col">
      <div className="flex items-start gap-3.5">
        <UserAvatar user={friend} size="lg" />
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-[18px] font-bold tracking-tight text-primary truncate">
            <Link to={`/dashboard/profile/${friend.id}`} className={`hover:underline underline-offset-4 decoration-2 decoration-blue-500/40 rounded-control ${focusRing}`}>
              {name}
            </Link>
          </h3>
          <p className="text-[13px] font-medium text-muted truncate">{friend.bio || friend.email}</p>
        </div>
        <CardMenu label={t('friends.card.menu', { name })} onRemove={() => onRemove(friend.id, friend.first_name || t('friends.defaultName'))} busy={busy} t={t} />
      </div>

      {since && <p className="mt-3 text-[12px] font-medium text-muted">{t('friends.card.since', { date: since })}</p>}

      <dl className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-dashed border-strong">
        {[
          ['trips', shared.trips],
          ['countries', shared.countries.length],
          ['days', shared.days],
        ].map(([key, value]) => (
          <div key={key} className="min-w-0 flex flex-col">
            <dt className="order-last mt-1.5 text-[12px] font-medium leading-tight text-muted">{t(`friends.card.${key}`, { count: value })}</dt>
            <dd className={`text-[30px] font-bold leading-none tracking-tight tabular-nums ${value ? 'text-primary' : 'text-placeholder'}`}>{value}</dd>
          </div>
        ))}
      </dl>
      {shared.countries.length > 0 && (
        <p className="mt-3 text-[18px] leading-none tracking-[0.12em] truncate" aria-hidden="true">
          {shared.countries.slice(0, 10).map(countryFlag).join('')}
        </p>
      )}

      {/* Příští společný výlet — řádek oddělený linkou, ne karta v kartě */}
      <div className="mt-4 pt-4 border-t border-subtle">
        {next ? (
          <Link to={`/dashboard/trip/${next.id}`} className={`group flex items-center gap-3 -mx-2 px-2 py-1.5 rounded-soft hover:bg-field transition-colors ${focusRing}`}>
            {nextIn > 0 ? (
              <span className="min-w-11 text-center">
                <span className="block text-[22px] font-bold leading-none tracking-tight tabular-nums text-primary">{nextIn}</span>
                <span className="block mt-0.5 text-[11px] font-medium text-muted">{t('friends.card.daysToGo', { count: nextIn })}</span>
              </span>
            ) : (
              <span className="w-11 h-11 rounded-full bg-active text-active flex items-center justify-center shrink-0"><Plane size={18} strokeWidth={2.25} aria-hidden="true" /></span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-primary truncate">{next.title}</span>
              <span className="block text-[12px] font-medium text-muted">{nextIn > 0 ? t('friends.card.nextTrip') : t('friends.card.ongoing')}</span>
            </span>
            <ArrowRight size={16} strokeWidth={2.25} className="text-icon-muted group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
          </Link>
        ) : (
          <p className="py-1.5 text-[13px] font-medium text-muted">
            {shared.trips > 0 ? t('friends.card.nothingPlanned') : t('friends.card.neverTraveled')}
          </p>
        )}
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between gap-3">
        {balance ? (
          balance.direction === 'owedToMe' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-wash text-success text-[12px] font-semibold tabular-nums">
              <ArrowDownLeft size={14} strokeWidth={2.5} aria-hidden="true" /> {t('friends.card.owesYou', { amount: money(balance.amount) })}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-readonly text-readonly text-[12px] font-semibold tabular-nums">
              <ArrowUpRight size={14} strokeWidth={2.5} aria-hidden="true" /> {t('friends.card.youOwe', { amount: money(balance.amount) })}
            </span>
          )
        ) : shared.trips > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-subtle text-secondary text-[12px] font-semibold">
            <Check size={14} strokeWidth={2.5} aria-hidden="true" /> {t('friends.card.settled')}
          </span>
        ) : <span />}
        <Link
          to={`/dashboard/profile/${friend.id}`}
          className={`inline-flex items-center gap-1 min-h-11 px-1 -mr-1 text-[13px] font-semibold text-accent hover:text-accent-hover rounded-control ${focusRing}`}
        >
          {t('friends.card.profile')} <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};

// ── Pozvánka (poslední karta / prázdný stav) ─────────────────
const InviteCard = ({ inviteUrl, onCopy, copied, onRegenerate, regenerating, empty, t }) => (
  <section
    aria-labelledby="friends-invite"
    className={`rounded-page border-[1.5px] border-dashed border-strong bg-page/50 p-5 sm:p-6 flex flex-col justify-center ${empty ? 'md:col-span-2 xl:col-span-3 items-center text-center py-12' : ''}`}
  >
    <span className="w-14 h-14 rounded-full border-[1.5px] border-dashed border-strong text-icon-muted flex items-center justify-center">
      <UserPlus size={22} strokeWidth={2} aria-hidden="true" />
    </span>
    <h3 id="friends-invite" className="mt-4 text-[18px] font-bold tracking-tight text-primary">
      {empty ? t('friends.inviteCard.emptyTitle') : t('friends.inviteCard.title')}
    </h3>
    <p className={`mt-1.5 text-[13px] font-medium leading-relaxed text-muted ${empty ? 'max-w-[46ch]' : ''}`}>
      {empty ? t('friends.inviteCard.emptyDescription') : t('friends.inviteCard.description')}
    </p>
    <div className={`mt-4 flex items-center gap-2 w-full ${empty ? 'max-w-md' : ''}`}>
      <p className="flex-1 min-w-0 h-11 leading-[42px] px-3.5 rounded-control bg-page border border-default text-[13px] font-medium text-secondary truncate select-all text-left" title={inviteUrl || undefined}>
        {inviteUrl ? inviteUrl.replace(/^https?:\/\//, '') : '…'}
      </p>
      <button type="button" onClick={onCopy} disabled={!inviteUrl} aria-label={t('friends.invite.copy')} className={empty ? primaryButton : secondaryButton}>
        {copied ? <Check size={15} strokeWidth={2.5} aria-hidden="true" /> : <Copy size={15} strokeWidth={2.25} aria-hidden="true" />}
        <span className="hidden sm:inline">{copied ? t('friends.invite.copied') : t('friends.invite.copyShort')}</span>
      </button>
    </div>
    <button
      type="button"
      onClick={onRegenerate}
      disabled={regenerating || !inviteUrl}
      className={`mt-1 inline-flex items-center gap-1.5 min-h-11 px-1 text-[12px] font-semibold text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed rounded-control ${focusRing} ${empty ? '' : 'self-start -ml-1'}`}
    >
      <RefreshCw size={13} strokeWidth={2.5} className={regenerating ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" />
      {t('friends.invite.regenerate')}
    </button>
  </section>
);

const Friends = () => {
  const { t, i18n } = useTranslation();
  const { currency } = useCurrency();
  const reduceMotion = useReducedMotion();
  const searchId = useId();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = nehledá se
  const [isSearching, setIsSearching] = useState(false);
  const [pendingActions, setPendingActions] = useState(new Set());
  const [inviteToken, setInviteToken] = useState(null);
  const [isRegeneratingLink, setIsRegeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { confirmDialog, ModalPortal } = useDialog();
  const searchBoxRef = useRef(null);

  // Deep link from the friend-request email / notification:
  // /dashboard/friends?request=<friendshipId> (older links also carry tab=requests)
  const [searchParams] = useSearchParams();
  const highlightedRequestId = Number(searchParams.get('request')) || null;
  const highlightedRef = useRef(null);

  const setPending = (id, on) => setPendingActions(prev => {
    const next = new Set(prev);
    on ? next.add(id) : next.delete(id);
    return next;
  });

  const fetchData = useCallback(async () => {
    setLoadError(false);
    try {
      const [friendsData, requestsData] = await Promise.all([
        api.friends.getAll(),
        api.friends.getRequests(),
      ]);
      setFriends(friendsData.friends);
      setRequests(requestsData.requests);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
    // Zůstatky jsou doplněk — když selžou, karty se ukážou bez nich.
    api.trips.balancesSummary()
      .then((data) => setBalances(new Map((data.counterparties || []).map((c) => [Number(c.userId), c]))))
      .catch((err) => console.error('Failed to load balances:', err));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (loading || !highlightedRequestId) return;
    if (requests.some(r => r.friendshipId === highlightedRequestId)) {
      highlightedRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    } else {
      toast(t('friends.toasts.requestNotFound'), { id: 'friend-request-not-found' });
    }
    // Run once after the initial load, not on every requests change (accept/decline).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, highlightedRequestId]);

  useEffect(() => {
    api.friends.getInviteLink()
      .then(data => setInviteToken(data.token))
      .catch(err => console.error('Failed to load invite link:', err));
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await api.friends.search(searchQuery);
        setSearchResults(data.users);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Panel s výsledky se zavře klikem mimo nebo Escapem.
  const searchOpen = isSearching || searchResults !== null;
  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e) => { if (!searchBoxRef.current?.contains(e.target)) setSearchQuery(''); };
    const onKey = (e) => { if (e.key === 'Escape') setSearchQuery(''); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [searchOpen]);

  const handleSendRequest = async (userId) => {
    setPending(`search-${userId}`, true);
    try {
      await api.friends.sendRequest(userId);
      toast.success(t('friends.toasts.requestSent'));
      setSearchResults(prev => prev?.map(u => u.id === userId ? { ...u, friendshipStatus: 'PENDING_SENT' } : u));
    } catch (err) {
      toast.error(err.message || t('friends.toasts.requestError'));
    } finally {
      setPending(`search-${userId}`, false);
    }
  };

  const handleAccept = async (friendshipId) => {
    setPending(friendshipId, true);
    try {
      await api.friends.accept(friendshipId);
      toast.success(t('friends.toasts.accepted'));
      fetchData();
    } catch (err) {
      toast.error(err.message || t('friends.toasts.acceptError'));
    } finally {
      setPending(friendshipId, false);
    }
  };

  const handleDecline = async (friendshipId) => {
    setPending(friendshipId, true);
    try {
      await api.friends.decline(friendshipId);
      setRequests(prev => prev.filter(r => r.friendshipId !== friendshipId));
    } catch (err) {
      toast.error(err.message || t('friends.toasts.declineError'));
    } finally {
      setPending(friendshipId, false);
    }
  };

  const handleRemoveFriend = async (friendId, name) => {
    const ok = await confirmDialog({
      title: t('friends.remove.title'),
      message: t('friends.remove.message', { name }),
      confirmLabel: t('friends.remove.confirm'),
      variant: 'danger',
    });
    if (!ok) return;

    setPending(friendId, true);
    try {
      const statusData = await api.friends.getStatus(friendId);
      if (statusData.friendshipId) {
        await api.friends.remove(statusData.friendshipId);
        setFriends(prev => prev.filter(f => f.id !== friendId));
        toast.success(t('friends.toasts.removed'));
      }
    } catch (err) {
      toast.error(err.message || t('friends.toasts.removeError'));
    } finally {
      setPending(friendId, false);
    }
  };

  const inviteUrl = inviteToken ? `${window.location.origin}/dashboard/add-friend/${inviteToken}` : null;

  const handleRegenerateInvite = async () => {
    const ok = await confirmDialog({
      title: t('friends.invite.regenerateTitle'),
      message: t('friends.invite.regenerateMessage'),
      confirmLabel: t('friends.invite.regenerateConfirm'),
      variant: 'danger',
    });
    if (!ok) return;

    setIsRegeneratingLink(true);
    try {
      const { token } = await api.friends.regenerateInviteLink();
      setInviteToken(token);
      toast.success(t('friends.invite.regenerateSuccess'));
    } catch (err) {
      toast.error(err.message || t('friends.invite.regenerateError'));
    } finally {
      setIsRegeneratingLink(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      track('friend_invite_copied');
      setLinkCopied(true);
      toast.success(t('friends.invite.linkCopied'));
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error(t('friends.invite.copyError'));
    }
  };

  if (loading) {
    return <FriendsSkeleton />;
  }

  const sharedCountries = new Set(friends.flatMap((f) => f.shared?.countries || []));

  const searchStatus = (user) => {
    switch (user.friendshipStatus) {
      case 'ACCEPTED':
        return <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-success"><UserCheck size={15} strokeWidth={2.25} aria-hidden="true" /> {t('friends.status.alreadyFriends')}</span>;
      case 'PENDING_SENT':
        return <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-secondary"><Clock size={15} strokeWidth={2.25} aria-hidden="true" /> {t('friends.status.requestSent')}</span>;
      case 'PENDING_RECEIVED':
        return <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-secondary"><Clock size={15} strokeWidth={2.25} aria-hidden="true" /> {t('friends.status.pendingReceived')}</span>;
      default:
        return (
          <button type="button" onClick={() => handleSendRequest(user.id)} disabled={pendingActions.has(`search-${user.id}`)} className={secondaryButton}>
            {pendingActions.has(`search-${user.id}`) ? <Spinner /> : <UserPlus size={15} strokeWidth={2.25} aria-hidden="true" />}
            {t('friends.status.addButton')}
          </button>
        );
    }
  };

  return (
    <div className="w-full pb-16">
      {ModalPortal}

      {/* Hlavička: souhrn vlevo, hledání + pozvání vpravo */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl text-primary tracking-tight font-bold">{t('friends.title')}</h1>
          {friends.length > 0 && (
            <p className="mt-1.5 text-[15px] font-medium text-muted tabular-nums">
              {t('friends.summary.friends', { count: friends.length })}
              {sharedCountries.size > 0 && <> · {t('friends.summary.countries', { count: sharedCountries.size })}</>}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div ref={searchBoxRef} className="relative flex-1 lg:w-80 lg:flex-none">
            <label htmlFor={searchId} className="sr-only">{t('friends.search.label')}</label>
            <Search size={16} strokeWidth={2.25} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-icon-muted pointer-events-none" aria-hidden="true" />
            <input
              id={searchId}
              type="search"
              autoComplete="off"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('friends.search.placeholder')}
              aria-expanded={searchOpen}
              aria-controls={`${searchId}-results`}
              className="w-full h-11 rounded-soft bg-page border border-default pl-10 pr-11 text-base sm:text-[14px] font-medium text-primary placeholder:text-placeholder hover:border-strong focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/25 transition-[border-color,box-shadow] [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t('friends.search.clear')}
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-soft text-icon-muted hover:text-primary transition-colors cursor-pointer ${focusRing}`}
              >
                <X size={16} strokeWidth={2.25} />
              </button>
            )}

            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  id={`${searchId}-results`}
                  aria-live="polite"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  className="absolute left-0 right-0 lg:left-auto lg:w-[26rem] top-full mt-2 z-30 bg-page border border-default rounded-soft shadow-popover overflow-hidden"
                >
                  {isSearching ? (
                    <ul aria-hidden="true" className="py-1"><SuggestionSkeletonItems rows={3} /></ul>
                  ) : searchResults.length === 0 ? (
                    <p className="px-4 py-4 text-[13px] font-medium text-muted">{t('friends.search.noResults')}</p>
                  ) : (
                    <ul className="max-h-80 overflow-y-auto custom-scrollbar [&>*+*]:border-t [&>*+*]:border-subtle">
                      {searchResults.map(user => (
                        <li key={user.id} className="flex items-center gap-3 px-4 py-3">
                          <UserAvatar user={user} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-primary truncate">{displayName(user)}</p>
                            {(user.first_name || user.last_name) && <p className="text-[12px] font-medium text-muted truncate">{user.email}</p>}
                          </div>
                          <div className="shrink-0">{searchStatus(user)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button type="button" onClick={handleCopyInvite} disabled={!inviteUrl} className={`${secondaryButton} h-11`}>
            {linkCopied ? <Check size={15} strokeWidth={2.5} aria-hidden="true" /> : <LinkIcon size={15} strokeWidth={2.25} aria-hidden="true" />}
            <span className="hidden sm:inline">{t('friends.inviteButton')}</span>
          </button>
        </div>
      </header>

      {/* Čekající žádosti */}
      {requests.length > 0 && (
        <section aria-labelledby="friends-requests" className="mb-8 space-y-2">
          <h2 id="friends-requests" className="sr-only">{t('friends.requests.title')}</h2>
          {requests.map(req => {
            const busy = pendingActions.has(req.friendshipId);
            const highlighted = req.friendshipId === highlightedRequestId;
            return (
              <div
                key={req.friendshipId}
                ref={highlighted ? highlightedRef : undefined}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-page border rounded-[20px] shadow-card px-4 py-3.5 ${highlighted ? 'border-blue-500/50 ring-2 ring-blue-500/20' : 'border-default'}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-accent shrink-0" aria-hidden="true" />
                  <UserAvatar user={req} size="md" />
                  <p className="min-w-0 text-[14px] font-medium text-soft">
                    <Trans i18nKey="friends.requests.message" values={{ name: displayName(req) }} components={[<strong key="n" className="font-bold text-primary" />]} />
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:flex gap-2 sm:shrink-0">
                  <button type="button" onClick={() => handleDecline(req.friendshipId)} disabled={busy} className={secondaryButton}>
                    {t('friends.status.decline')}
                  </button>
                  <button type="button" onClick={() => handleAccept(req.friendshipId)} disabled={busy} className={primaryButton}>
                    {busy ? <Spinner /> : <UserCheck size={15} strokeWidth={2.25} aria-hidden="true" />}
                    {t('friends.status.accept')}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {loadError ? (
        <div role="alert" className="py-16 flex flex-col items-center text-center gap-3">
          <p className="text-[15px] font-semibold text-primary">{t('friends.loadError')}</p>
          <button type="button" onClick={() => { setLoading(true); fetchData(); }} className={secondaryButton}>
            <RefreshCw size={14} strokeWidth={2.5} aria-hidden="true" /> {t('friends.retry')}
          </button>
        </div>
      ) : (
        <section aria-labelledby="friends-list">
          <h2 id="friends-list" className="sr-only">{t('friends.listTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {friends.map(friend => (
              <FriendCard
                key={friend.id}
                friend={friend}
                balance={balances.get(Number(friend.id))}
                onRemove={handleRemoveFriend}
                busy={pendingActions.has(friend.id)}
                t={t}
                i18n={i18n}
                currency={currency}
              />
            ))}
            <InviteCard
              inviteUrl={inviteUrl}
              onCopy={handleCopyInvite}
              copied={linkCopied}
              onRegenerate={handleRegenerateInvite}
              regenerating={isRegeneratingLink}
              empty={friends.length === 0}
              t={t}
            />
          </div>
        </section>
      )}
    </div>
  );
};

export default Friends;
