import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Home, Map, BarChart2, Users, Wallet, Plane, Plus, Mail,
  CalendarDays, CheckSquare, FileText, MapPin, Check, ChevronDown,
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import VersionBadge from './ui/VersionBadge';
import useForceLightTheme from '../hooks/useForceLightTheme';
import { CHANGELOG } from '../config/changelog';

const EASE = [0.16, 1, 0.3, 1];

// Scroll-triggered reveal used by every section below the hero.
const Reveal = ({ children, delay = 0, className = '' }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

const PrimaryCta = ({ children, className = '' }) => (
  <Link
    to="/auth"
    state={{ mode: 'register' }}
    className={`inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold rounded-full px-8 py-4 shadow-lg shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] transition-all duration-300 ${className}`}
  >
    {children}
    <ArrowRight size={17} strokeWidth={2.5} />
  </Link>
);

// ── Light dashboard replica shown in the hero ────────────────────────────────
const DashboardMock = () => {
  const { t } = useTranslation();

  const trips = [
    {
      dest: t('landing.solution.destination'),
      dates: t('landing.solution.dates'),
      chip: 'bg-blue-100 text-blue-600',
    },
    {
      dest: t('landing.solution.trip2'),
      dates: t('landing.solution.trip2dates'),
      chip: 'bg-emerald-100 text-emerald-600',
    },
  ];

  const sideIcons = [Home, Map, BarChart2, Users, Wallet];

  return (
    <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 backdrop-blur-xl overflow-hidden shadow-[0_24px_80px_-24px_rgba(37,99,235,0.25),0_8px_32px_rgba(0,0,0,0.06)]">
      {/* App header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-600/30">
            <span className="text-white text-[10px] font-black">J</span>
          </div>
          <span className="text-gray-900 text-sm font-semibold">{t('tripsOverview.title')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-blue-600 rounded-full px-3 py-1.5 shadow-sm shadow-blue-600/30">
          <Plus size={12} strokeWidth={3} />
          <span className="hidden sm:inline">{t('tripsOverview.actions.newTrip')}</span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden sm:flex w-16 border-r border-gray-100 flex-col items-center py-5 gap-2 flex-shrink-0">
          {sideIcons.map((Icon, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-xl ${i === 0 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-gray-400'}`}
            >
              <Icon size={15} strokeWidth={2.25} />
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 sm:p-6 space-y-3 min-w-0">
          {/* Countdown */}
          <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 sm:px-5 py-4">
            <p className="text-blue-700 text-[10px] uppercase tracking-widest mb-1.5 font-bold">
              {t('tripsOverview.countdown.label')}
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-gray-900 font-bold text-4xl sm:text-5xl leading-none tracking-tighter">121</span>
              <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold">
                {t('tripsOverview.countdown.days')}
              </span>
              <span className="text-gray-500 text-sm truncate">· {t('landing.solution.destination')}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { num: '8', label: t('tripsOverview.stats.trips') },
              { num: '156', label: t('tripsOverview.countdown.days') },
              { num: '24', label: t('tripsOverview.stats.places') },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl bg-gray-50/80 border border-gray-100 px-2 sm:px-3 py-3 text-center">
                <p className="text-gray-900 font-bold text-lg sm:text-2xl tracking-tight">{stat.num}</p>
                <p className="text-gray-500 text-[9px] uppercase tracking-wider mt-0.5 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Trip rows */}
          {trips.map((trip, i) => (
            <div key={i} className="rounded-xl bg-gray-50/80 border border-gray-100 px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${trip.chip}`}>
                  <Plane size={13} strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-900 text-xs font-semibold truncate">{trip.dest}</p>
                  <p className="text-gray-500 text-[10px] truncate">{trip.dates}</p>
                </div>
              </div>
              <span className="flex-shrink-0 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1">
                {t('tripsOverview.open')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Messy spreadsheet visual for the problem section ─────────────────────────
const SpreadsheetMock = () => {
  const { t } = useTranslation();

  const cols = [
    t('landing.problem.col1'),
    t('landing.problem.col2'),
    t('landing.problem.col3'),
    t('landing.problem.col4'),
  ];
  const rows = t('landing.problem.rows', { returnObjects: true });
  const rowMeta = [
    { bg: 'bg-red-50/80', expense: 'text-red-600 font-mono', status: 'text-red-600' },
    { bg: '', expense: 'text-emerald-600 font-mono', status: 'text-emerald-600' },
    { bg: 'bg-amber-50/80', expense: 'text-gray-500 font-mono', status: 'text-amber-600' },
    { bg: 'bg-red-50/60', expense: 'text-red-600 font-mono', status: 'text-red-600' },
    { bg: '', expense: 'text-gray-400 font-mono', status: 'text-gray-400' },
  ];

  return (
    <div className="relative">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_16px_48px_-16px_rgba(0,0,0,0.12)] overflow-hidden rotate-[-1deg]">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-2 text-gray-400 text-[10px] font-mono truncate">
            {t('landing.problem.filename')}
          </span>
        </div>
        <div className="grid grid-cols-4 bg-gray-50/70 border-b border-gray-100">
          {cols.map((h, i) => (
            <div key={i} className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 border-r border-gray-100 last:border-r-0">
              {h}
            </div>
          ))}
        </div>
        {rows.map((row, i) => {
          const meta = rowMeta[i];
          const cells = [
            { text: row.dest, cls: 'text-gray-700 font-medium' },
            { text: row.date, cls: 'text-gray-500' },
            { text: row.expense, cls: meta.expense },
            { text: row.status, cls: meta.status },
          ];
          return (
            <div key={i} className={`grid grid-cols-4 border-b border-gray-100 last:border-b-0 ${meta.bg}`}>
              {cells.map((cell, j) => (
                <div key={j} className={`px-3 py-3 text-[11px] border-r border-gray-100/70 last:border-r-0 truncate ${cell.cls}`}>
                  {cell.text}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Floating chat bubble */}
      <div className="absolute -right-3 sm:-right-8 -bottom-8 bg-white border border-gray-200 rounded-2xl p-3.5 w-52 shadow-xl rotate-[2deg]">
        <p className="text-gray-900 text-xs font-semibold">{t('landing.problem.chat.name')}</p>
        <p className="text-gray-600 text-[11px] mt-1 leading-snug">{t('landing.problem.chat.msg')}</p>
        <p className="text-gray-400 text-[10px] mt-2">{t('landing.problem.chat.ago')}</p>
      </div>
    </div>
  );
};

// ── Feature card vignettes ───────────────────────────────────────────────────
const EverythingVignette = () => {
  const { t } = useTranslation();
  const chips = [
    { icon: CalendarDays, key: 'itinerary' },
    { icon: Wallet, key: 'budget' },
    { icon: CheckSquare, key: 'packing' },
    { icon: FileText, key: 'documents' },
  ];
  return (
    <div className="rounded-2xl bg-gray-50/80 border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
          <MapPin size={16} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className="text-gray-900 text-sm font-semibold truncate">{t('landing.solution.destination')}</p>
          <p className="text-gray-500 text-[11px] truncate">{t('landing.solution.dates')}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* eslint-disable-next-line no-unused-vars */}
        {chips.map(({ icon: Icon, key }) => (
          <span key={key} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-700">
            <Icon size={12} strokeWidth={2.25} className="text-blue-600" />
            {t(`landing.features.everything.${key}`)}
          </span>
        ))}
      </div>
    </div>
  );
};

const StatsVignette = () => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-8">
      <div>
        <p className="text-4xl font-bold tracking-tighter text-gray-900">12</p>
        <p className="text-[11px] font-semibold text-gray-500 mt-1">{t('landing.features.stats.countries')}</p>
      </div>
      <div>
        <p className="text-4xl font-bold tracking-tighter text-gray-900">87</p>
        <p className="text-[11px] font-semibold text-gray-500 mt-1">{t('landing.features.stats.days')}</p>
      </div>
    </div>
  );
};

const CommunityVignette = () => {
  const { t } = useTranslation();
  const avatars = [
    { initials: 'JN', bg: 'bg-blue-500' },
    { initials: 'MK', bg: 'bg-emerald-500' },
    { initials: 'AT', bg: 'bg-violet-500' },
    { initials: 'PV', bg: 'bg-amber-500' },
  ];
  return (
    <div className="flex items-center gap-4">
      <div className="flex -space-x-2.5">
        {avatars.map((a) => (
          <div
            key={a.initials}
            className={`w-9 h-9 rounded-full ${a.bg} ring-2 ring-white flex items-center justify-center text-white text-[10px] font-bold`}
          >
            {a.initials}
          </div>
        ))}
      </div>
      <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 rounded-full px-3 py-1.5">
        {t('landing.features.community.shared')}
      </span>
    </div>
  );
};

const BudgetVignette = () => {
  const { t } = useTranslation();
  const cats = t('landing.features.budget.vignette.cats', { returnObjects: true });
  const dots = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
  const widths = ['27%', '23%', '12%'];
  return (
    <div className="rounded-2xl bg-gray-50/80 border border-gray-100 p-4 sm:p-5">
      <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
        {t('landing.features.budget.vignette.label')}
      </p>
      <div className="flex items-baseline gap-2 mt-1 mb-3">
        <span className="text-2xl font-bold tracking-tight text-gray-900">
          {t('landing.features.budget.vignette.total')}
        </span>
        <span className="text-[11px] font-medium text-gray-500">
          {t('landing.features.budget.vignette.limit')}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden flex">
        {widths.map((w, i) => (
          <div key={i} className={`h-full ${dots[i]}`} style={{ width: w }} />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {Array.isArray(cats) && cats.map((cat, i) => (
          <div key={i} className="flex items-center gap-2.5 text-[12px]">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dots[i]}`} />
            <span className="text-gray-700 font-medium">{cat.name}</span>
            <span className="ml-auto font-semibold text-gray-900 tabular-nums">{cat.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── What's new — inline changelog built from the same data as the modal ─────
const formatReleaseDate = (iso, lng) => {
  try {
    return new Date(iso).toLocaleDateString(lng, { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
};

const ChangelogSection = () => {
  const { t, i18n } = useTranslation();
  const [latest, ...older] = CHANGELOG;
  const latestBase = `changelog.releases.${latest.key}`;
  const latestHighlights = t(`${latestBase}.highlights`, { returnObjects: true });

  return (
    <section id="changelog" className="px-6 pb-24 sm:pb-32 scroll-mt-24">
      <div className="max-w-3xl mx-auto">
        <Reveal className="text-center max-w-xl mx-auto mb-12 sm:mb-14">
          <h2
            className="font-bold tracking-tight leading-[1.08]"
            style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)', textWrap: 'balance' }}
          >
            {t('landing.changelog.title')}
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed text-base sm:text-lg" style={{ textWrap: 'pretty' }}>
            {t('landing.changelog.subtitle')}
          </p>
        </Reveal>

        {/* Latest release — full card */}
        <Reveal>
          <article className="rounded-[2rem] border border-gray-200/70 bg-white/70 backdrop-blur-sm p-7 sm:p-9">
            <div className="flex items-center gap-2.5 flex-wrap mb-4">
              <span className="text-[12px] font-bold tracking-wide px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/25">
                v{latest.version}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-50 text-emerald-600">
                {t('changelog.current')}
              </span>
              <span className="text-gray-500 text-[13px] font-medium ml-auto">
                {formatReleaseDate(latest.date, i18n.language)}
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2">{t(`${latestBase}.title`)}</h3>
            <p className="text-gray-600 leading-relaxed text-[15px] mb-6">{t(`${latestBase}.summary`)}</p>
            {Array.isArray(latestHighlights) && (
              <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {latestHighlights.slice(0, 4).map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Check size={10} strokeWidth={3} />
                    </span>
                    <span className="text-gray-700 text-[13px] leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </Reveal>

        {/* Older releases — compact rows */}
        <Reveal delay={0.1}>
          <div className="mt-2 divide-y divide-gray-100 px-2 sm:px-4">
            {older.map((release) => (
              <div key={release.version} className="py-5 flex items-baseline gap-3 sm:gap-4">
                <span className="text-[12px] font-bold tracking-wide px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 shrink-0">
                  v{release.version}
                </span>
                <div className="min-w-0">
                  <p className="text-gray-900 font-semibold text-[15px]">
                    {t(`changelog.releases.${release.key}.title`)}
                  </p>
                  <p className="text-gray-600 text-[13px] leading-relaxed mt-0.5 line-clamp-2">
                    {t(`changelog.releases.${release.key}.summary`)}
                  </p>
                </div>
                <span className="text-gray-500 text-[12px] font-medium ml-auto shrink-0 hidden sm:block">
                  {formatReleaseDate(release.date, i18n.language)}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
const LandingPage = () => {
  useForceLightTheme();
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  const heroEntrance = (delay) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 26 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: EASE },
        };

  const scrollToId = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const latestRelease = CHANGELOG[0];

  return (
    <div className="relative min-h-screen bg-[#fbfbfd] text-gray-900 font-sans selection:bg-blue-500/30 overflow-x-clip">
      <Navbar variant="light" />

      {/* Ambient glow, same family as the dashboard background */}
      <div className="absolute inset-x-0 top-0 h-[900px] z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-56 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -top-24 -right-40 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <main className="relative z-10">
        {/* ── Hero ── */}
        <section className="px-6 pt-36 sm:pt-44 pb-14 sm:pb-16 text-center">
          <motion.div {...heroEntrance(0)} className="mb-6 sm:mb-7">
            <a
              href="#changelog"
              onClick={scrollToId('changelog')}
              className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 pl-1.5 pr-3 py-1.5 text-[13px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors max-w-full"
            >
              <span className="shrink-0 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5">
                {t('landing.hero.newBadge')} v{latestRelease.version}
              </span>
              <span className="truncate">{t(`changelog.releases.${latestRelease.key}.title`)}</span>
              <ChevronDown size={14} strokeWidth={2.5} className="shrink-0 text-blue-500" />
            </a>
          </motion.div>

          <motion.h1
            {...heroEntrance(0.1)}
            className="font-bold tracking-tight leading-[1.05] max-w-3xl mx-auto"
            style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)', textWrap: 'balance' }}
          >
            {t('landing.hero.title')}
          </motion.h1>

          <motion.p
            {...heroEntrance(0.25)}
            className="mt-5 sm:mt-6 text-gray-600 max-w-xl mx-auto leading-relaxed text-base sm:text-lg"
            style={{ textWrap: 'pretty' }}
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          <motion.div {...heroEntrance(0.4)} className="mt-8 sm:mt-10 flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <PrimaryCta>{t('landing.hero.cta')}</PrimaryCta>
              <a
                href="#features"
                onClick={scrollToId('features')}
                className="inline-flex items-center justify-center font-semibold text-gray-700 rounded-full px-7 py-4 border border-gray-200 bg-white/60 hover:bg-white hover:border-gray-300 transition-colors duration-300"
              >
                {t('landing.hero.secondary')}
              </a>
            </div>
            <p className="text-[13px] font-medium text-gray-500">{t('landing.hero.microcopy')}</p>
          </motion.div>
        </section>

        {/* ── Product mock ── */}
        <section className="px-6 pb-24 sm:pb-32">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: EASE }}
            className="relative max-w-4xl mx-auto"
          >
            {/* Handwritten note */}
            <div
              className="absolute -top-10 right-4 sm:right-10 rotate-[-4deg] text-blue-600 text-xl sm:text-2xl select-none pointer-events-none"
              style={{ fontFamily: "'Caveat', cursive" }}
              aria-hidden="true"
            >
              {t('landing.hero.note')} ↴
            </div>
            <DashboardMock />
          </motion.div>
        </section>

        {/* ── Problem ── */}
        <section className="px-6 py-20 sm:py-28 bg-white border-y border-gray-100">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <Reveal>
              <h2
                className="font-bold tracking-tight leading-[1.08]"
                style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', textWrap: 'balance' }}
              >
                {t('landing.problem.title')}{' '}
                <span className="text-gray-400">{t('landing.problem.titleAlt')}</span>
              </h2>
              <p className="mt-6 text-gray-600 leading-relaxed text-base sm:text-lg max-w-lg" style={{ textWrap: 'pretty' }}>
                {t('landing.problem.body')}
              </p>
              <p className="mt-4 text-gray-900 font-medium leading-relaxed text-base sm:text-lg max-w-lg" style={{ textWrap: 'pretty' }}>
                {t('landing.problem.body2')}
              </p>
            </Reveal>
            <Reveal delay={0.15} className="pb-10 lg:pb-0">
              <SpreadsheetMock />
            </Reveal>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="px-6 py-24 sm:py-32 scroll-mt-24">
          <div className="max-w-6xl mx-auto">
            <Reveal className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
              <h2
                className="font-bold tracking-tight leading-[1.08]"
                style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', textWrap: 'balance' }}
              >
                {t('landing.features.title')}
              </h2>
              <p className="mt-5 text-gray-600 leading-relaxed text-base sm:text-lg" style={{ textWrap: 'pretty' }}>
                {t('landing.features.subtitle')}
              </p>
            </Reveal>

            <div className="grid lg:grid-cols-3 gap-5">
              {/* Everything in one place — wide */}
              <Reveal className="lg:col-span-2">
                <div className="h-full rounded-[2rem] border border-gray-200/70 bg-white/70 backdrop-blur-sm p-7 sm:p-9 grid sm:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight mb-2.5">{t('landing.features.everything.title')}</h3>
                    <p className="text-gray-600 leading-relaxed text-[15px]">{t('landing.features.everything.description')}</p>
                  </div>
                  <EverythingVignette />
                </div>
              </Reveal>

              {/* Statistics */}
              <Reveal delay={0.1}>
                <div className="h-full rounded-[2rem] border border-gray-200/70 bg-white/70 backdrop-blur-sm p-7 sm:p-9 flex flex-col justify-between gap-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight mb-2.5">{t('landing.features.stats.title')}</h3>
                    <p className="text-gray-600 leading-relaxed text-[15px]">{t('landing.features.stats.description')}</p>
                  </div>
                  <StatsVignette />
                </div>
              </Reveal>

              {/* Community */}
              <Reveal>
                <div className="h-full rounded-[2rem] border border-gray-200/70 bg-white/70 backdrop-blur-sm p-7 sm:p-9 flex flex-col justify-between gap-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight mb-2.5">{t('landing.features.community.title')}</h3>
                    <p className="text-gray-600 leading-relaxed text-[15px]">{t('landing.features.community.description')}</p>
                  </div>
                  <CommunityVignette />
                </div>
              </Reveal>

              {/* Budget — wide */}
              <Reveal delay={0.1} className="lg:col-span-2">
                <div className="h-full rounded-[2rem] border border-gray-200/70 bg-white/70 backdrop-blur-sm p-7 sm:p-9 grid sm:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight mb-2.5">{t('landing.features.budget.title')}</h3>
                    <p className="text-gray-600 leading-relaxed text-[15px]">{t('landing.features.budget.description')}</p>
                  </div>
                  <BudgetVignette />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── What's new ── */}
        <ChangelogSection />

        {/* ── CTA ── */}
        <section className="px-6 pb-24 sm:pb-32">
          <Reveal className="max-w-5xl mx-auto">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-blue-600 px-6 py-16 sm:p-20 text-center shadow-[0_32px_80px_-32px_rgba(37,99,235,0.55)]">
              <div
                className="absolute -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-blue-400/30 blur-[100px] pointer-events-none"
                aria-hidden="true"
              />
              <div className="relative">
                <p
                  className="text-blue-100 text-2xl sm:text-3xl rotate-[-2deg] mb-4 select-none"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  {t('landing.cta.script')}
                </p>
                <h2
                  className="text-white font-bold tracking-tight leading-[1.05] mb-5"
                  style={{ fontSize: 'clamp(2.2rem, 5vw, 3.75rem)', textWrap: 'balance' }}
                >
                  {t('landing.cta.title')}
                </h2>
                <p className="text-blue-100 leading-relaxed max-w-md mx-auto text-base sm:text-lg mb-9" style={{ textWrap: 'pretty' }}>
                  {t('landing.cta.subtitle')}
                </p>
                <Link
                  to="/auth"
                  state={{ mode: 'register' }}
                  className="inline-flex items-center gap-2.5 bg-white text-blue-700 font-bold rounded-full text-base px-9 py-4 shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-transform duration-300"
                >
                  {t('landing.cta.button')}
                  <ArrowRight size={17} strokeWidth={2.5} />
                </Link>
                <p className="mt-5 text-[13px] font-medium text-blue-100">{t('landing.hero.microcopy')}</p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Feedback ── */}
        <section className="px-6 pb-24 sm:pb-28">
          <Reveal className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" style={{ textWrap: 'balance' }}>
              {t('landing.feedback.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8" style={{ textWrap: 'pretty' }}>
              {t('landing.feedback.subtitle')}
            </p>
            <a
              href="mailto:petr@vorlos.eu"
              className="inline-flex items-center gap-2.5 font-semibold text-gray-900 rounded-full px-7 py-3.5 border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-300"
            >
              <Mail size={16} strokeWidth={2.25} className="text-blue-600" />
              petr@vorlos.eu
            </a>
          </Reveal>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-8 px-6 text-sm font-medium text-gray-500 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            &copy; {new Date().getFullYear()}{' '}
            <a
              href="https://vorlos.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 transition-colors"
            >
              Petr Vorlíček
            </a>
            . {t('landing.footer.madeWith')}
          </p>
          <div className="flex items-center gap-6">
            <VersionBadge className="text-[11px] font-bold tracking-wide px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors" />
            <Link to="/privacy" className="hover:text-gray-900 transition-colors">
              {t('landing.footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-gray-900 transition-colors">
              {t('landing.footer.terms')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
