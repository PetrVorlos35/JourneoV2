import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Home, Map, BarChart2, Users, Wallet, Plane, Plus, Mail,
  CalendarDays, CheckSquare, FileText, MapPin, Check, ChevronDown, Sun,
} from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
    className={`group inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold rounded-full px-8 py-4 shadow-lg shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] transition-all duration-300 ${className}`}
  >
    {children}
    <ArrowRight
      size={17}
      strokeWidth={2.5}
      className="transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
    />
  </Link>
);

// ── Hand-drawn margin doodles, desktop only ──────────────────────────────────
// Sketches scattered through the page margins, like notes in a travel journal.
// Solid strokes draw themselves in when scrolled into view; dotted trails fade.
const DOODLE_VIEWPORT = { once: true, margin: '-40px' };

const DoodleStroke = ({ d, delay = 0, dotted = false, ...rest }) => {
  const reduce = useReducedMotion();
  const common = {
    d,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.25,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...(dotted ? { strokeDasharray: '0.5 7.5' } : {}),
    ...rest,
  };
  if (reduce) return <path {...common} />;
  if (dotted) {
    return (
      <motion.path
        {...common}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={DOODLE_VIEWPORT}
        transition={{ duration: 0.9, delay, ease: EASE }}
      />
    );
  }
  return (
    <motion.path
      {...common}
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={DOODLE_VIEWPORT}
      transition={{
        pathLength: { duration: 0.9, delay, ease: EASE },
        opacity: { duration: 0.2, delay },
      }}
    />
  );
};

// Each doodle: viewBox + a list of strokes ({ d, dt: extra delay, dotted })
// and optional Caveat text labels ({ text, x, y, size }).
const DOODLES = {
  plane: {
    viewBox: '0 0 140 96',
    parts: [
      { d: 'M8 84 C34 84 48 66 58 50', dotted: true, dt: 0.35 },
      { d: 'M112 14 C95 21 81 29 66 38 C73 40 80 42 88 44 Z' },
      { d: 'M112 14 C104 25 97 34 89 44', dt: 0.15 },
      { d: 'M88 44 C88 49 89 53 90 57 C93 53 96 50 99 46', dt: 0.3 },
    ],
  },
  sun: {
    viewBox: '0 0 96 96',
    parts: [
      { d: 'M48 26 C60 25 71 35 70 48 C69 61 59 70 47 69 C35 68 26 58 27 46 C28 35 37 27 48 26' },
      { d: 'M48 15 C48 12 48 9 47 6', dt: 0.25 },
      { d: 'M64 21 C66 18 68 16 70 13', dt: 0.3 },
      { d: 'M80 47 C83 47 86 47 89 46', dt: 0.35 },
      { d: 'M73 66 C75 68 77 71 79 73', dt: 0.4 },
      { d: 'M47 81 C47 84 47 87 47 90', dt: 0.45 },
      { d: 'M29 68 C27 70 24 73 22 75', dt: 0.5 },
      { d: 'M16 45 C13 45 10 46 7 46', dt: 0.55 },
      { d: 'M30 22 C28 19 25 17 23 14', dt: 0.6 },
    ],
  },
  compass: {
    viewBox: '0 0 96 108',
    parts: [
      { text: 'N', x: 48, y: 18, size: 22 },
      { d: 'M48 30 C64 31 76 43 75 59 C74 74 62 86 47 85 C32 84 21 72 22 57 C23 43 34 30 48 30' },
      { d: 'M49 38 L56 58 L48 78 L42 58 Z', dt: 0.25 },
      { d: 'M74 58 L69 58', dt: 0.4 },
      { d: 'M27 57 L32 57', dt: 0.45 },
      { dot: { cx: 49, cy: 58, r: 2 } },
    ],
  },
  scribble: {
    viewBox: '0 0 130 80',
    parts: [
      { d: 'M10 58 C20 30 42 18 52 30 C62 42 40 58 32 46 C24 34 44 22 62 26 C80 30 90 40 102 38', dt: 0 },
      { text: '?!', x: 114, y: 30, size: 26 },
    ],
  },
  suitcase: {
    viewBox: '0 0 96 96',
    parts: [
      { d: 'M16 36 C15 58 15 68 18 76 C40 79 60 79 78 76 C81 60 81 48 79 36 C58 32 37 32 16 36 Z' },
      { d: 'M38 34 C38 26 41 22 48 22 C55 22 58 26 58 34', dt: 0.2 },
      { d: 'M33 35 C32 48 32 62 33 77', dt: 0.35 },
      { d: 'M63 35 C64 48 64 62 63 77', dt: 0.45 },
    ],
  },
  mountains: {
    viewBox: '0 0 110 76',
    parts: [
      { d: 'M6 68 C20 46 30 32 40 20 C46 30 50 38 55 46 C61 36 66 30 72 24 C82 40 90 54 102 68' },
      { d: 'M33 30 C35 33 37 35 40 37 C43 34 45 32 47 30', dt: 0.3 },
    ],
  },
  stars: {
    viewBox: '0 0 96 72',
    parts: [
      { d: 'M24 14 L24 30 M16 22 L32 22' },
      { d: 'M62 32 L62 44 M56 38 L68 38', dt: 0.2 },
      { d: 'M38 52 L38 60 M34 56 L42 56', dt: 0.35 },
    ],
  },
  pin: {
    viewBox: '0 0 72 88',
    parts: [
      { d: 'M36 12 C48 12 58 22 58 34 C58 48 36 74 36 74 C36 74 14 48 14 34 C14 22 24 12 36 12 Z' },
      { d: 'M36 26 C41 26 44 30 44 34 C44 39 40 42 36 42 C31 42 28 39 28 34 C28 30 31 26 36 26', dt: 0.3 },
    ],
  },
  qmark: {
    viewBox: '0 0 72 96',
    parts: [
      { d: 'M22 26 C22 12 50 8 56 22 C61 34 48 40 42 47 C39 51 38 56 38 62' },
      { dot: { cx: 38, cy: 76, r: 2.5 } },
    ],
  },
  arrow: {
    viewBox: '0 0 100 76',
    parts: [
      { d: 'M14 8 C36 16 62 32 80 54' },
      { d: 'M70 50 L84 58 L68 64', dt: 0.3 },
    ],
  },
  heart: {
    viewBox: '0 0 96 88',
    parts: [
      { d: 'M48 74 C22 54 12 36 22 26 C32 17 45 24 48 34 C51 24 64 17 74 26 C84 36 74 54 48 74 Z' },
    ],
  },
  ticket: {
    viewBox: '0 0 110 58',
    parts: [
      {
        d: 'M6 12 C6 8 9 6 13 6 L97 6 C101 6 104 8 104 12 L104 18 C100 18 98 21 98 24 C98 27 100 30 104 30 L104 46 C104 50 101 52 97 52 L13 52 C9 52 6 50 6 46 L6 30 C10 30 12 27 12 24 C12 21 10 18 6 18 Z',
      },
      { d: 'M60 10 L60 48', dotted: true, dt: 0.25 },
    ],
  },
};

const Doodle = ({ name, className = '', delay = 0, inline = false }) => {
  const spec = DOODLES[name];
  return (
    <div
      className={`hidden xl:block pointer-events-none select-none text-blue-600 opacity-50 ${inline ? 'relative' : 'absolute'} ${className}`}
      aria-hidden="true"
    >
      <svg viewBox={spec.viewBox} className="w-full h-auto">
        {spec.parts.map((part, i) => {
          if (part.text) {
            return (
              <text
                key={i}
                x={part.x}
                y={part.y}
                textAnchor="middle"
                fontSize={part.size}
                fill="currentColor"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                {part.text}
              </text>
            );
          }
          if (part.dot) {
            return <circle key={i} {...part.dot} fill="currentColor" />;
          }
          return <DoodleStroke key={i} d={part.d} dotted={part.dotted} delay={delay + (part.dt || 0)} />;
        })}
      </svg>
    </div>
  );
};

// ── Floating product fragments in the desktop margins ────────────────────────
// Real pieces of the app (packing list, boarding pass, sharing chip) drifting
// beside the hero, so the margins belong to the product instead of whitespace.
const FloatIn = ({ className = '', delay = 0, rotate = 0, drift = 8, children }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`hidden xl:block absolute z-10 pointer-events-none select-none ${className}`}
      initial={reduce ? false : { opacity: 0, y: 30, rotate: rotate + 5 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      aria-hidden="true"
    >
      <motion.div
        animate={reduce ? {} : { y: [0, -drift, 0] }}
        transition={{ duration: 6.5, delay: delay + 1, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

const FLOAT_CARD =
  'rounded-2xl border border-gray-200/80 bg-white/90 backdrop-blur-sm shadow-[0_20px_48px_-20px_rgba(37,99,235,0.35)]';

const PackingCard = () => {
  const { t } = useTranslation();
  const items = t('landing.float.packing.items', { returnObjects: true });
  if (!Array.isArray(items)) return null;
  return (
    <div className={`w-48 p-4 ${FLOAT_CARD}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
          <CheckSquare size={12} strokeWidth={2.5} />
        </span>
        <span className="text-[12px] font-bold text-gray-900">
          {t('landing.features.everything.packing')}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((label, i) => {
          const done = i < 2;
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 ${
                  done ? 'bg-blue-600 text-white' : 'border-[1.5px] border-gray-300'
                }`}
              >
                {done && <Check size={9} strokeWidth={3.5} />}
              </span>
              <span className={`text-[11px] font-medium truncate ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full w-[70%] rounded-full bg-blue-500" />
      </div>
      <p className="mt-1.5 text-[10px] font-semibold text-gray-500">
        {t('landing.float.packing.progress')}
      </p>
    </div>
  );
};

const TicketCard = () => {
  const { t } = useTranslation();
  return (
    <div className={`w-48 ${FLOAT_CARD}`}>
      <div className="px-4 pt-3.5 pb-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-blue-600 mb-2.5">
          {t('landing.float.ticket.label')}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-gray-900">PRG</span>
          <span className="relative flex-1 border-t-2 border-dotted border-gray-300">
            <span className="absolute left-1/2 -translate-x-1/2 -top-[9px] bg-white px-1 text-blue-600">
              <Plane size={12} strokeWidth={2.25} />
            </span>
          </span>
          <span className="text-lg font-bold tracking-tight text-gray-900">KIX</span>
        </div>
      </div>
      <div className="relative border-t border-dashed border-gray-300 rounded-b-2xl bg-gray-50/80 px-4 py-2.5 flex items-center justify-between">
        <span className="absolute -left-[7px] -top-[7px] w-3.5 h-3.5 rounded-full bg-[#fbfbfd] border border-gray-200/80" />
        <span className="absolute -right-[7px] -top-[7px] w-3.5 h-3.5 rounded-full bg-[#fbfbfd] border border-gray-200/80" />
        <span className="text-[10px] font-semibold text-gray-500">{t('landing.float.ticket.date')}</span>
        <span className="text-[10px] font-semibold text-gray-500">{t('landing.float.ticket.seat')}</span>
      </div>
    </div>
  );
};

const SharedChip = () => {
  const { t } = useTranslation();
  const avatars = [
    { initials: 'JN', bg: 'bg-blue-500' },
    { initials: 'MK', bg: 'bg-emerald-500' },
    { initials: 'AT', bg: 'bg-violet-500' },
  ];
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-gray-200/80 bg-white/90 backdrop-blur-sm shadow-[0_16px_40px_-16px_rgba(37,99,235,0.3)] pl-2 pr-4 py-1.5">
      <div className="flex -space-x-2">
        {avatars.map((a) => (
          <div
            key={a.initials}
            className={`w-7 h-7 rounded-full ${a.bg} ring-2 ring-white flex items-center justify-center text-white text-[9px] font-bold`}
          >
            {a.initials}
          </div>
        ))}
      </div>
      <span className="text-[11px] font-semibold text-gray-700 whitespace-nowrap">
        {t('landing.features.community.shared')}
      </span>
    </div>
  );
};

const WeatherChip = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/90 backdrop-blur-sm shadow-[0_16px_40px_-16px_rgba(37,99,235,0.3)] px-4 py-2">
      <Sun size={15} strokeWidth={2.25} className="text-amber-500" />
      <span className="text-[12px] font-semibold text-gray-700 whitespace-nowrap">
        {t('landing.float.weather')}
      </span>
    </div>
  );
};

// ── Destination marquee — a slow drift of places between hero and problem ────
const DestinationMarquee = () => {
  const { t } = useTranslation();
  const items = t('landing.marquee', { returnObjects: true });
  if (!Array.isArray(items)) return null;
  // Four copies so one animation cycle (-50%) always spans at least a full
  // viewport, even on ultrawide screens — no gap at the loop point.
  const row = [...items, ...items, ...items, ...items];
  const mask = 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)';
  return (
    <section className="relative pb-20 sm:pb-28" aria-hidden="true">
      <div className="overflow-hidden" style={{ maskImage: mask, WebkitMaskImage: mask }}>
        <div className="flex w-max animate-marquee">
          {row.map((label, i) => (
            <span
              key={i}
              className="mr-3 whitespace-nowrap rounded-full border border-gray-200/80 bg-white/80 px-4 py-2 text-[13px] font-semibold text-gray-600"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

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
    <section id="changelog" className="relative px-6 pb-24 sm:pb-32 scroll-mt-24">
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-20 items-start">
        <Reveal className="mb-12 lg:mb-0 lg:sticky lg:top-28">
          <h2
            className="font-bold tracking-tight leading-[1.08]"
            style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)', textWrap: 'balance' }}
          >
            {t('landing.changelog.title')}
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed text-base sm:text-lg max-w-md" style={{ textWrap: 'pretty' }}>
            {t('landing.changelog.subtitle')}
          </p>
          <Doodle name="stars" inline className="w-[76px] mt-10 -rotate-3" />
        </Reveal>

        <div>
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
      </div>
    </section>
  );
};

// ── FAQ ──────────────────────────────────────────────────────────────────────
const FaqItem = ({ item, index, open, onToggle }) => {
  const reduce = useReducedMotion();
  return (
    <div>
      <button
        type="button"
        id={`faq-question-${index}`}
        aria-expanded={open}
        aria-controls={`faq-answer-${index}`}
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-gray-900 font-semibold text-[15px] sm:text-base group-hover:text-blue-700 transition-colors duration-300">
          {item.q}
        </span>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          className={`shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
            open ? 'rotate-180 text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`faq-answer-${index}`}
            role="region"
            aria-labelledby={`faq-question-${index}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
            className="overflow-hidden"
          >
            <p
              className="pb-6 pr-8 text-gray-600 leading-relaxed text-[15px] sm:text-base"
              style={{ textWrap: 'pretty' }}
            >
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FaqSection = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = React.useState(0);
  const items = t('landing.faq.items', { returnObjects: true });

  if (!Array.isArray(items)) return null;

  return (
    <section id="faq" className="relative px-6 pb-24 sm:pb-32 scroll-mt-24">
      <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-20 items-start">
        <Reveal className="mb-10 lg:mb-0 lg:sticky lg:top-28">
          <h2
            className="font-bold tracking-tight leading-[1.08]"
            style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)', textWrap: 'balance' }}
          >
            {t('landing.faq.title')}
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed text-base sm:text-lg max-w-md" style={{ textWrap: 'pretty' }}>
            {t('landing.faq.subtitle')}
          </p>
          <Doodle name="qmark" inline className="w-[58px] mt-10 rotate-[-8deg]" />
        </Reveal>
        <Reveal delay={0.1}>
          <div className="divide-y divide-gray-200/80 border-y border-gray-200/80">
            {items.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                index={i}
                open={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
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

      {/* Faint dot-grid, like graph paper in a travel journal */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-70"
        style={{
          backgroundImage: 'radial-gradient(rgba(37,99,235,0.16) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'linear-gradient(to bottom, transparent, black 320px, black calc(100% - 400px), transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 320px, black calc(100% - 400px), transparent)',
        }}
        aria-hidden="true"
      />

      {/* Ambient glow, same family as the dashboard background */}
      <div className="absolute inset-x-0 top-0 h-[900px] z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-56 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -top-24 -right-40 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <main className="relative z-10">
        {/* ── Hero ── */}
        <section className="relative px-6 pt-36 sm:pt-44 pb-14 sm:pb-16 text-center">
          <Doodle name="plane" className="left-[8%] top-32 w-[120px] rotate-[-3deg]" delay={1.2} />
          <FloatIn className="left-[3%] top-64" delay={0.9} rotate={-5}>
            <PackingCard />
          </FloatIn>
          <FloatIn className="right-[3%] top-40" delay={1.05} rotate={4}>
            <TicketCard />
          </FloatIn>
          <FloatIn className="right-[6%] top-[24rem]" delay={1.2} rotate={-2} drift={6}>
            <SharedChip />
          </FloatIn>
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
        <section className="relative px-6 pb-16 sm:pb-20">
          <Doodle name="compass" className="left-[7%] bottom-20 w-[72px] rotate-[-6deg]" />
          <FloatIn className="right-[5%] top-24" delay={0.8} rotate={3} drift={6}>
            <WeatherChip />
          </FloatIn>
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

        {/* ── Destination marquee ── */}
        <DestinationMarquee />

        {/* ── Problem ── */}
        <section className="relative px-6 py-20 sm:py-28 bg-white border-y border-gray-100">
          <Doodle name="scribble" className="right-[4%] top-8 w-[110px] rotate-[4deg]" />
          <Doodle name="suitcase" className="left-[5%] bottom-14 w-[68px] rotate-[4deg]" />
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
        <section id="features" className="relative px-6 py-24 sm:py-32 scroll-mt-24">
          <Doodle name="suitcase" className="left-[6%] top-20 w-[82px] rotate-[-5deg]" />
          <Doodle name="mountains" className="right-[5%] top-48 w-[104px] rotate-[3deg]" delay={0.15} />
          <Doodle name="stars" className="left-[4%] bottom-16 w-[64px]" delay={0.1} />
          <Doodle name="ticket" className="right-[6%] bottom-20 w-[90px] rotate-[-3deg]" delay={0.2} />
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
                <div className="h-full rounded-[2rem] border border-gray-200/70 bg-white/70 backdrop-blur-sm p-7 sm:p-9 transition-all duration-300 xl:hover:-translate-y-1 xl:hover:border-gray-300/80 xl:hover:shadow-[0_20px_48px_-24px_rgba(37,99,235,0.25)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 grid sm:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight mb-2.5">{t('landing.features.everything.title')}</h3>
                    <p className="text-gray-600 leading-relaxed text-[15px]">{t('landing.features.everything.description')}</p>
                  </div>
                  <EverythingVignette />
                </div>
              </Reveal>

              {/* Statistics */}
              <Reveal delay={0.1}>
                <div className="h-full rounded-[2rem] border border-gray-200/70 bg-white/70 backdrop-blur-sm p-7 sm:p-9 transition-all duration-300 xl:hover:-translate-y-1 xl:hover:border-gray-300/80 xl:hover:shadow-[0_20px_48px_-24px_rgba(37,99,235,0.25)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 flex flex-col justify-between gap-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight mb-2.5">{t('landing.features.stats.title')}</h3>
                    <p className="text-gray-600 leading-relaxed text-[15px]">{t('landing.features.stats.description')}</p>
                  </div>
                  <StatsVignette />
                </div>
              </Reveal>

              {/* Community */}
              <Reveal>
                <div className="h-full rounded-[2rem] border border-gray-200/70 bg-white/70 backdrop-blur-sm p-7 sm:p-9 transition-all duration-300 xl:hover:-translate-y-1 xl:hover:border-gray-300/80 xl:hover:shadow-[0_20px_48px_-24px_rgba(37,99,235,0.25)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 flex flex-col justify-between gap-8">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight mb-2.5">{t('landing.features.community.title')}</h3>
                    <p className="text-gray-600 leading-relaxed text-[15px]">{t('landing.features.community.description')}</p>
                  </div>
                  <CommunityVignette />
                </div>
              </Reveal>

              {/* Budget — wide */}
              <Reveal delay={0.1} className="lg:col-span-2">
                <div className="h-full rounded-[2rem] border border-gray-200/70 bg-white/70 backdrop-blur-sm p-7 sm:p-9 transition-all duration-300 xl:hover:-translate-y-1 xl:hover:border-gray-300/80 xl:hover:shadow-[0_20px_48px_-24px_rgba(37,99,235,0.25)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 grid sm:grid-cols-2 gap-8 items-center">
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

        {/* ── FAQ ── */}
        <FaqSection />

        {/* ── CTA ── */}
        <section className="relative px-6 pb-24 sm:pb-32">
          <Doodle name="arrow" className="left-[3%] top-16 w-[80px]" />
          <Doodle name="plane" className="right-[5%] top-10 w-[86px] rotate-[8deg]" delay={0.15} />
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
        <section className="relative px-6 pb-24 sm:pb-28">
          <Doodle name="heart" className="right-[17%] top-8 w-[52px] rotate-[8deg]" />
          <Doodle name="pin" className="left-[15%] top-4 w-[46px] rotate-[-6deg]" delay={0.1} />
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
