"use client";
import React, { useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Home, Plane, Wallet, Users, LineChart, BarChart2, Mail } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import JourneoLogo from '../assets/Journeo_whitelogo.png';
import VersionBadge from './ui/VersionBadge';

const LandingPage = () => {
  const { t } = useTranslation();
  const scrollRef = useRef(null);

  const sectionScrollRange = useMemo(
    () => (typeof window !== 'undefined' ? window.innerHeight * 5 : 4500),
    []
  );
  const { scrollY } = useScroll();
  const scrollYProgress = useTransform(scrollY, [0, sectionScrollRange], [0, 1]);

  // ── Phase 1 : HERO (0.00 → 0.20) ─────────────────────────────────────────
  const heroOpacity = useTransform(scrollYProgress, [0, 0.02, 0.14, 0.20], [1, 1, 1, 0]);
  const heroScale   = useTransform(scrollYProgress, [0.02, 0.20], [1, 0.88]);
  const heroY       = useTransform(scrollYProgress, [0.02, 0.20], [0, -80]);
  const watermarkY  = useTransform(scrollYProgress, [0, 0.20], [0, -240]);
  const orbY        = useTransform(scrollYProgress, [0, 0.20], [0, -100]);
  const orbOp       = useTransform(scrollYProgress, [0, 0.14, 0.20], [1, 1, 0]);

  // ── Phase 2 : PROBLEM (0.22 → 0.44) ──────────────────────────────────────
  const probOpacity = useTransform(scrollYProgress, [0.22, 0.30, 0.37, 0.44], [0, 1, 1, 0]);
  const probY       = useTransform(scrollYProgress, [0.22, 0.30], [100, 0]);
  const probBlurRaw = useTransform(scrollYProgress, [0.37, 0.44], [0, 20]);
  const probFilter  = useTransform(probBlurRaw, v => `blur(${v}px)`);

  // ── Phase 3 : DASHBOARD (0.46 → 0.68) ────────────────────────────────────
  const cardOpacity = useTransform(scrollYProgress, [0.46, 0.54, 0.61, 0.68], [0, 1, 1, 0]);
  const cardY       = useTransform(scrollYProgress, [0.46, 0.54], [140, 0]);
  const cardRotateX = useTransform(scrollYProgress, [0.54, 0.68], [0, -12]);
  const cardGlowOp  = useTransform(scrollYProgress, [0.46, 0.54, 0.61, 0.68], [0, 1, 1, 0]);

  // ── Phase 4 : FEATURES (0.70 → 0.87) ─────────────────────────────────────
  const f1Op = useTransform(scrollYProgress, [0.70, 0.75, 0.82, 0.87], [0, 1, 1, 0]);
  const f1Y  = useTransform(scrollYProgress, [0.70, 0.75], [80, 0]);
  const f1X  = useTransform(scrollYProgress, [0.70, 0.75], [-40, 0]);
  const f2Op = useTransform(scrollYProgress, [0.73, 0.78, 0.82, 0.87], [0, 1, 1, 0]);
  const f2Y  = useTransform(scrollYProgress, [0.73, 0.78], [80, 0]);
  const f3Op = useTransform(scrollYProgress, [0.76, 0.81, 0.82, 0.87], [0, 1, 1, 0]);
  const f3Y  = useTransform(scrollYProgress, [0.76, 0.81], [80, 0]);
  const f3X  = useTransform(scrollYProgress, [0.76, 0.81], [40, 0]);

  // ── Phase 5 : CTA (0.89 → 1.00) ──────────────────────────────────────────
  const ctaOpacity = useTransform(scrollYProgress, [0.89, 0.96], [0, 1]);
  const ctaScale   = useTransform(scrollYProgress, [0.89, 0.96], [0.92, 1]);
  const ctaY       = useTransform(scrollYProgress, [0.89, 0.96], [60, 0]);
  const ctaPtr     = useTransform(ctaOpacity, v => (v > 0.15 ? 'auto' : 'none'));

  const sheetCols = [
    t('landing.problem.col1'),
    t('landing.problem.col2'),
    t('landing.problem.col3'),
    t('landing.problem.col4'),
  ];

  const sheetRowMeta = [
    { bg: 'bg-red-500/[0.06]',   colors: ['text-white/55', 'text-white/32', 'text-red-400 font-mono',         'text-red-400/70'] },
    { bg: '',                     colors: ['text-white/55', 'text-white/32', 'text-emerald-400/65 font-mono', 'text-emerald-400/65'] },
    { bg: 'bg-yellow-500/[0.04]', colors: ['text-white/55', 'text-white/22', 'text-white/38 font-mono',        'text-yellow-400/65'] },
    { bg: 'bg-red-500/[0.04]',   colors: ['text-white/55', 'text-white/32', 'text-red-400/75 font-mono',      'text-red-400/70'] },
    { bg: '',                     colors: ['text-white/38', 'text-white/22', 'text-white/18 font-mono',        'text-white/28'] },
  ];

  const sheetRows = t('landing.problem.rows', { returnObjects: true });

  const dashTrips = [
    {
      dest: t('landing.solution.destination'),
      dates: t('landing.solution.dates'),
      activities: t('landing.solution.activities1'),
      colorIcon: 'text-indigo-300',
      colorBg: 'bg-indigo-500/15',
      colorBtn: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/18',
    },
    {
      dest: t('landing.solution.trip2'),
      dates: t('landing.solution.trip2dates'),
      activities: t('landing.solution.activities2'),
      colorIcon: 'text-emerald-300',
      colorBg: 'bg-emerald-500/15',
      colorBtn: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/18',
    },
  ];

  return (
    <div className="bg-neutral-950 text-[#f5f5f7] font-sans selection:bg-blue-500/30 min-h-screen">
      <Navbar />

      <div ref={scrollRef} className="relative h-[600vh]">
        <div className="sticky top-0 h-screen overflow-hidden bg-neutral-950">

          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          {/* ── PHASE 1 — HERO ─────────────────────────────────────────── */}
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6"
          >
            {/* JOURNEO watermark */}
            <motion.div
              style={{ y: watermarkY }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            >
              <span className="text-[24vw] font-black tracking-tighter text-white/[0.04] leading-none">
                JOURNEO
              </span>
            </motion.div>

            {/* Glow orb */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <motion.div style={{ y: orbY, opacity: orbOp }}>
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.09) 45%, transparent 70%)',
                  }}
                />
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.9 }}
              className="relative text-[10px] tracking-[0.45em] text-white/22 uppercase mb-5 sm:mb-10 font-semibold"
            >
              {t('landing.hero.eyebrow')}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 44 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative font-black tracking-tight text-white leading-[0.92] max-w-4xl"
              style={{ fontSize: 'clamp(2.4rem, 6vw, 6rem)' }}
            >
              {t('landing.hero.title')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.9 }}
              className="relative mt-4 sm:mt-8 text-white/35 max-w-xs sm:max-w-lg leading-relaxed text-sm sm:text-base"
            >
              {t('landing.hero.subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="relative mt-8 sm:mt-16 flex flex-col items-center gap-3"
            >
              <span className="text-white/18 text-[9px] tracking-[0.4em] uppercase font-medium">
                Scroll
              </span>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                className="w-px h-8 sm:h-10 bg-gradient-to-b from-white/22 to-transparent"
              />
            </motion.div>
          </motion.div>

          {/* ── PHASE 2 — PROBLEM ──────────────────────────────────────── */}
          <motion.div
            style={{ opacity: probOpacity, y: probY, filter: probFilter }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 sm:px-6 pointer-events-none"
          >
            <div className="relative w-full max-w-2xl lg:max-w-3xl mb-5 sm:mb-8">
              {/* Ghost rows — hidden on mobile so they don't overflow */}
              <div className="hidden sm:block absolute -top-10 left-4 right-4 h-14 rounded-2xl bg-red-500/6 border border-red-500/12 rotate-[-2deg]" />
              <div className="hidden sm:block absolute -top-4 left-0 right-10 h-14 rounded-2xl bg-yellow-500/6 border border-yellow-500/10 rotate-[1.5deg]" />

              {/* Spreadsheet */}
              <div className="relative rounded-2xl border border-white/8 bg-neutral-900/90 overflow-hidden">
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/[0.03] border-b border-white/5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/35" />
                  <span className="ml-2 text-white/18 text-[10px] font-mono truncate">
                    {t('landing.problem.filename')}
                  </span>
                </div>
                {/* On mobile show 4 cols; on sm+ show 5 (with empty action col) */}
                <div className="grid grid-cols-4 sm:grid-cols-5 bg-white/[0.03] border-b border-white/5">
                  {sheetCols.map((h, i) => (
                    <div key={i} className="px-2 sm:px-3 py-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-white/18 border-r border-white/[0.04] last:border-r-0">
                      {h}
                    </div>
                  ))}
                  <div className="hidden sm:block px-3 py-2 border-l border-white/[0.04]" />
                </div>
                {sheetRows.map((row, i) => {
                  const meta = sheetRowMeta[i];
                  const cells = [row.dest, row.date, row.expense, row.status];
                  return (
                    <div key={i} className={`grid grid-cols-4 sm:grid-cols-5 border-b border-white/[0.03] last:border-b-0 ${meta.bg}`}>
                      {cells.map((cell, j) => (
                        <div key={j} className={`px-2 sm:px-3 py-2.5 sm:py-3 text-[10px] sm:text-[11px] border-r border-white/[0.03] last:border-r-0 truncate ${meta.colors[j]}`}>
                          {cell}
                        </div>
                      ))}
                      <div className="hidden sm:block border-l border-white/[0.03]" />
                    </div>
                  );
                })}
              </div>

              {/* Floating bubbles — desktop only */}
              <div className="hidden sm:block absolute -right-14 top-8 bg-[#1c1c1e] border border-white/10 rounded-2xl p-3.5 w-52 shadow-2xl rotate-[2deg]">
                <p className="text-white/75 text-xs font-semibold">{t('landing.problem.chat.name')}</p>
                <p className="text-white/38 text-[11px] mt-1 leading-snug">{t('landing.problem.chat.msg')}</p>
                <p className="text-white/18 text-[10px] mt-2">{t('landing.problem.chat.ago')}</p>
              </div>
              <div className="hidden sm:block absolute -left-14 bottom-8 bg-[#1c1c1e] border border-white/10 rounded-2xl p-3.5 w-46 shadow-2xl -rotate-[1.5deg]">
                <p className="text-white/75 text-xs font-semibold">{t('landing.problem.notes.name')}</p>
                <p className="text-white/38 text-[11px] mt-1 leading-snug">{t('landing.problem.notes.msg')}</p>
                <p className="text-white/18 text-[10px] mt-2">{t('landing.problem.notes.today')}</p>
              </div>
            </div>

            <p className="text-white/18 text-[10px] font-semibold tracking-[0.4em] uppercase mb-4">
              {t('landing.problem.label')}
            </p>
            <h2
              className="font-black tracking-tight text-white text-center leading-[0.92]"
              style={{ fontSize: 'clamp(2rem, 7vw, 7rem)' }}
            >
              {t('landing.problem.title')}<br />
              <span className="text-white/22">{t('landing.problem.titleAlt')}</span>
            </h2>
          </motion.div>

          {/* ── PHASE 3 — DASHBOARD ────────────────────────────────────── */}
          <motion.div
            style={{ opacity: cardOpacity, y: cardY }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-4 sm:px-6"
          >
            <p className="text-white/18 text-[10px] font-semibold tracking-[0.4em] uppercase mb-4 sm:mb-8">
              {t('landing.solution.label')}
            </p>

            <div style={{ perspective: '1400px' }} className="relative w-full max-w-sm sm:max-w-lg lg:max-w-3xl">
              {/* Glow */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <motion.div
                  className="w-full h-full"
                  style={{
                    opacity: cardGlowOp,
                    background:
                      'radial-gradient(ellipse at center, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.15) 45%, transparent 70%)',
                    filter: 'blur(50px)',
                  }}
                />
              </div>

              <motion.div style={{ rotateX: cardRotateX }}>
                <div
                  className="rounded-2xl sm:rounded-3xl p-[1.5px]"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 50%, rgba(99,102,241,0.3) 100%)',
                  }}
                >
                  <div className="rounded-[18px] sm:rounded-[22px] bg-[#0c0c0f] overflow-hidden">

                    {/* App header */}
                    <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        >
                          <span className="text-white text-[9px] sm:text-[10px] font-black">J</span>
                        </div>
                        <span className="text-white/60 text-xs sm:text-sm font-semibold">
                          {t('tripsOverview.title')}
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-white/40 bg-white/[0.04] border border-white/8 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1">
                        <span className="text-indigo-400 font-bold leading-none">+</span>
                        <span className="hidden sm:inline">{t('tripsOverview.actions.newTrip')}</span>
                      </div>
                    </div>

                    <div className="flex">
                      {/* Sidebar — hidden on mobile */}
                      <div className="hidden sm:flex w-12 lg:w-14 border-r border-white/5 flex-col items-center py-4 gap-4 lg:gap-5 flex-shrink-0">
                        <Home size={14} className="text-indigo-400" />
                        <Plane size={14} className="text-white/22" />
                        <BarChart2 size={14} className="text-white/22" />
                        <Users size={14} className="text-white/22" />
                        <Wallet size={14} className="text-white/22" />
                      </div>

                      {/* Main content */}
                      <div className="flex-1 p-3 sm:p-4 lg:p-5 space-y-2.5 sm:space-y-3 min-w-0">

                        {/* Countdown */}
                        <div className="rounded-xl sm:rounded-2xl bg-indigo-500/8 border border-indigo-500/14 px-3 sm:px-4 py-3 sm:py-4">
                          <p className="text-white/28 text-[8px] sm:text-[9px] uppercase tracking-widest mb-1.5 font-semibold">
                            {t('tripsOverview.countdown.label')}
                          </p>
                          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-white font-black text-3xl sm:text-4xl lg:text-5xl leading-none tracking-tighter">
                              121
                            </span>
                            <span className="text-white/35 text-[10px] sm:text-xs uppercase tracking-widest font-medium">
                              {t('tripsOverview.countdown.days')}
                            </span>
                            <span className="text-white/38 text-xs sm:text-sm ml-0.5 truncate">
                              · {t('landing.solution.destination')}
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { num: '8',   label: t('tripsOverview.stats.trips') },
                            { num: '156', label: t('tripsOverview.countdown.days') },
                            { num: '24',  label: t('tripsOverview.stats.places') },
                          ].map((stat, i) => (
                            <div key={i} className="rounded-lg sm:rounded-xl bg-white/[0.04] border border-white/5 px-2 sm:px-3 py-2.5 sm:py-3 text-center">
                              <p className="text-white font-bold text-lg sm:text-xl lg:text-2xl">{stat.num}</p>
                              <p className="text-white/25 text-[8px] sm:text-[9px] uppercase tracking-wider mt-0.5 sm:mt-1 font-semibold">
                                {stat.label}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Trip cards */}
                        {dashTrips.map((trip, i) => (
                          <div key={i} className="rounded-lg sm:rounded-xl bg-white/[0.04] border border-white/5 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <div className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center ${trip.colorBg}`}>
                                <Plane size={11} className={trip.colorIcon} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-white/80 text-[11px] sm:text-xs font-semibold truncate">{trip.dest}</p>
                                <p className="text-white/30 text-[9px] sm:text-[10px] truncate">{trip.dates}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                              <span className="text-white/22 text-[10px] hidden lg:block">{trip.activities}</span>
                              <span className={`text-[10px] font-medium border rounded-md sm:rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 ${trip.colorBtn}`}>
                                {t('tripsOverview.open')}
                              </span>
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* ── PHASE 4 — FEATURES ─────────────────────────────────────── */}
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none px-4 sm:px-6">
            <div className="w-full max-w-xs sm:max-w-2xl lg:max-w-6xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 lg:gap-7">
                {[
                  {
                    op: f1Op, y: f1Y, x: f1X,
                    num: '01',
                    icon: <Wallet size={22} className="sm:hidden" />,
                    iconLg: <Wallet size={26} className="hidden sm:block" />,
                    iconBg: 'bg-emerald-500/14', iconColor: 'text-emerald-400',
                    border: 'border-emerald-500/10', from: 'from-emerald-500/7',
                    title: t('landing.features.budget.title'),
                    desc: t('landing.features.budget.description'),
                  },
                  {
                    op: f2Op, y: f2Y, x: 0,
                    num: '02',
                    icon: <Users size={22} className="sm:hidden" />,
                    iconLg: <Users size={26} className="hidden sm:block" />,
                    iconBg: 'bg-blue-500/14', iconColor: 'text-blue-400',
                    border: 'border-blue-500/10', from: 'from-blue-500/7',
                    title: t('landing.features.community.title'),
                    desc: t('landing.features.community.description'),
                  },
                  {
                    op: f3Op, y: f3Y, x: f3X,
                    num: '03',
                    icon: <LineChart size={22} className="sm:hidden" />,
                    iconLg: <LineChart size={26} className="hidden sm:block" />,
                    iconBg: 'bg-violet-500/14', iconColor: 'text-violet-400',
                    border: 'border-violet-500/10', from: 'from-violet-500/7',
                    title: t('landing.features.stats.title'),
                    desc: t('landing.features.stats.description'),
                  },
                ].map((feat, i) => (
                  <motion.div key={i} style={{ opacity: feat.op, y: feat.y, x: feat.x }}>
                    <div className={`rounded-2xl sm:rounded-3xl bg-gradient-to-b ${feat.from} to-transparent border ${feat.border} p-5 sm:p-7 lg:p-10 h-full`}>
                      <div className="flex items-start justify-between mb-4 sm:mb-7 lg:mb-8">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl ${feat.iconBg} flex items-center justify-center ${feat.iconColor} flex-shrink-0`}>
                          {feat.icon}
                          {feat.iconLg}
                        </div>
                        <span
                          className="font-black text-5xl sm:text-6xl lg:text-7xl leading-none select-none"
                          style={{ color: 'rgba(255,255,255,0.05)' }}
                        >
                          {feat.num}
                        </span>
                      </div>
                      <h3 className="text-white font-bold text-sm sm:text-base lg:text-2xl mb-2 sm:mb-3">{feat.title}</h3>
                      <p className="text-white/30 text-xs sm:text-sm lg:text-base leading-relaxed line-clamp-3 sm:line-clamp-none">{feat.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ── PHASE 5 — CTA ──────────────────────────────────────────── */}
          <motion.div
            style={{ opacity: ctaOpacity, scale: ctaScale, y: ctaY, pointerEvents: ctaPtr }}
            className="absolute inset-0 z-50 flex items-center justify-center px-4 sm:px-6"
          >
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
              <motion.div
                animate={{ scale: [1, 1.06, 1], opacity: [0.18, 0.26, 0.18] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-[350px] h-[350px] sm:w-[650px] sm:h-[650px] rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(99,102,241,0.45) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)',
                  filter: 'blur(70px)',
                }}
              />
            </div>

            <div className="relative text-center w-full max-w-sm sm:max-w-xl lg:max-w-3xl">
              <div
                className="rounded-2xl sm:rounded-3xl p-[1.5px]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 50%, rgba(99,102,241,0.28) 100%)',
                }}
              >
                <div className="rounded-[18px] sm:rounded-[22px] bg-[#09090c] backdrop-blur-3xl p-7 sm:p-10 lg:p-16">
                  <img
                    src={JourneoLogo}
                    alt="Journeo"
                    className="h-6 sm:h-8 lg:h-10 w-auto object-contain mx-auto mb-5 sm:mb-8 opacity-65"
                  />
                  <h2
                    className="text-white font-black tracking-tight leading-[0.92] mb-4 sm:mb-5"
                    style={{ fontSize: 'clamp(1.8rem, 5.5vw, 5.5rem)' }}
                  >
                    {t('landing.cta.title')}
                  </h2>
                  <p className="text-white/32 leading-relaxed mb-7 sm:mb-10 max-w-xs sm:max-w-md mx-auto text-sm sm:text-base">
                    {t('landing.cta.subtitle')}
                  </p>
                  <Link
                    to="/auth"
                    state={{ mode: 'register' }}
                    className="inline-flex items-center gap-2 sm:gap-3 bg-white text-neutral-950 font-bold rounded-full text-sm sm:text-base px-6 sm:px-10 py-3 sm:py-4 lg:py-5 hover:scale-[1.04] hover:shadow-[0_0_50px_rgba(255,255,255,0.14)] transition-all duration-300 shadow-lg"
                  >
                    {t('landing.cta.button')}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Feedback / contact */}
      <section className="relative bg-neutral-950 border-t border-white/5 px-6 py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          <div
            className="w-[420px] h-[420px] sm:w-[620px] sm:h-[620px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.04) 45%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 text-indigo-300 mb-6">
            <Mail size={22} />
          </div>
          <p className="text-white/22 text-[10px] font-semibold tracking-[0.4em] uppercase mb-4">
            {t('landing.feedback.label')}
          </p>
          <h2
            className="font-black tracking-tight text-white leading-[0.95] mb-4"
            style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3.25rem)' }}
          >
            {t('landing.feedback.title')}
          </h2>
          <p className="text-white/35 leading-relaxed max-w-md mx-auto text-sm sm:text-base mb-8">
            {t('landing.feedback.subtitle')}
          </p>
          <a
            href="mailto:petr@vorlos.eu"
            className="inline-flex items-center gap-2.5 bg-white text-neutral-950 font-bold rounded-full text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 hover:scale-[1.04] hover:shadow-[0_0_50px_rgba(255,255,255,0.14)] transition-all duration-300 shadow-lg"
          >
            <Mail size={16} />
            petr@vorlos.eu
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-6 text-center text-sm font-medium text-white/28 bg-neutral-950 border-t border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p>
            &copy; {new Date().getFullYear()}{' '}
            <a
              href="https://vorlos.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Petr Vorlíček
            </a>
            . {t('landing.footer.madeWith')}
          </p>
          <div className="flex items-center gap-6">
            <VersionBadge className="text-[11px] font-bold tracking-wide px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors" />
            <Link to="/privacy" className="hover:text-white transition-colors">
              {t('landing.footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              {t('landing.footer.terms')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
