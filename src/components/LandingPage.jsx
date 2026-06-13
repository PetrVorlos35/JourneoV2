"use client";
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, ChevronDown, Clock, Plane, MapPin, Calendar, TrendingUp, Wallet, Users, Globe, LineChart } from 'lucide-react';
import { motion, useScroll, useTransform, useMotionTemplate } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import HorizontalScrollCarousel from './ui/HorizontalScrollCarousel';
import SpotlightCard from './ui/SpotlightCard';

import JourneoLogo from '../assets/Journeo_whitelogo.png';

const LandingPage = () => {
  const { t } = useTranslation();
  // Hero parallax hooks
  const { scrollY } = useScroll();
  const heroBackgroundY = useTransform(scrollY, [0, 1000], [0, 300]);



  return (
    <div className="dark min-h-screen selection:bg-blue-500/30 bg-black text-[#f5f5f7] font-sans">

      <Navbar />

      {/* ===== Hero Section ===== */}
      <section className="relative h-[80vh] flex flex-col justify-center items-center text-center px-6 z-10 pt-20 overflow-hidden">

        {/* Giant Watermark Text */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          style={{ y: heroBackgroundY }}
        >
          <span className="text-[20vw] font-black tracking-tighter text-white/[0.08] leading-none">
            JOURNEO
          </span>
        </motion.div>

        <h1 className="relative z-10 text-[12vw] sm:text-[5rem] lg:text-[7rem] font-bold leading-[1.05] sm:leading-[0.95] tracking-tighter max-w-5xl mx-auto break-words mt-12">
          {t('landing.hero.title')}
        </h1>

        <p className="relative z-10 mt-8 text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto font-medium tracking-tight">
          {t('landing.hero.subtitle')}
        </p>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 mt-12">
          <Link to="/auth" state={{ mode: 'register' }} className="group flex items-center gap-2 px-8 py-4 bg-white text-black text-[15px] font-semibold rounded-full hover:scale-105 transition-transform duration-300 shadow-xl shadow-white/10">
            {t('landing.hero.cta')}
          </Link>
        </div>

        {/* Scroll Indicator */}
        <motion.button 
          onClick={() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' })}
          animate={{ y: [0, 10, 0] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 hover:text-white transition-colors cursor-pointer z-10"
        >
          <ChevronDown size={28} strokeWidth={2} />
        </motion.button>
      </section>

      {/* ===== Horizontal Features Showcase (Hidden on Mobile) ===== */}
      <HorizontalScrollCarousel />

      {/* ===== Mobile Storytelling Section (Standard Scrolling with Fade-ins) ===== */}
      <section className="md:hidden relative w-full flex flex-col pb-20 pt-10">
        <div className="relative z-10 flex flex-col gap-24 px-6 mt-10 w-full max-w-[360px] mx-auto">
          
          {/* Phase 1 */}
          <motion.div 
            initial={{opacity: 0, y: 40}} 
            whileInView={{opacity: 1, y: 0}} 
            viewport={{once: true, margin: "-50px"}} 
            transition={{duration: 0.8}}
            className="flex flex-col items-start text-left gap-6 w-full"
          >
            <h2 className="text-4xl font-bold tracking-tighter text-white drop-shadow-lg leading-[1.1]">
              {t('landing.mobile.phase1.title')}
            </h2>
            <div className="glass-card bg-white/10 p-6 rounded-[2rem] border border-white/20 shadow-2xl backdrop-blur-3xl w-full flex flex-col text-left">
              <div className="flex items-center gap-2 text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-4 bg-blue-500/20 self-start px-3 py-1.5 rounded-full">
                <Clock size={14} strokeWidth={2.5} /> {t('landing.mobile.countdown.label')}
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold tracking-tighter text-white leading-none">14</span>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{t('landing.mobile.countdown.days')}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{t('carousel.card1.destination')}</h3>
              <p className="text-gray-300 text-[13px] font-medium">{t('carousel.card1.departure')}</p>
            </div>
          </motion.div>

          {/* Phase 2 */}
          <motion.div 
            initial={{opacity: 0, y: 40}} 
            whileInView={{opacity: 1, y: 0}} 
            viewport={{once: true, margin: "-50px"}} 
            transition={{duration: 0.8}}
            className="flex flex-col items-start text-left gap-6 w-full"
          >
            <h2 className="text-4xl font-bold tracking-tighter text-white drop-shadow-lg leading-[1.1]">
              {t('landing.mobile.phase2.title')}
            </h2>
            <div className="glass-card bg-white/10 p-6 rounded-[2rem] border border-white/20 shadow-2xl backdrop-blur-3xl w-full text-left">
              <div className="w-12 h-12 mb-5 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                <MapPin size={24} strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white tracking-tight">{t('carousel.card2.destination')}</h3>
              <div className="flex items-center text-[13px] font-bold text-gray-300 gap-2 mb-5">
                <Calendar size={14} strokeWidth={2} />
                <span>{t('landing.mobile.tripDates')}</span>
              </div>
              <div className="pt-4 border-t border-white/20 flex justify-between items-center">
                <span className="text-gray-300 text-[11px] uppercase tracking-widest font-bold">{t('landing.mobile.activities')} 24</span>
                <span className="text-[11px] font-bold text-blue-300 uppercase tracking-widest flex items-center gap-1">{t('landing.mobile.open')} <ArrowRight size={14}/></span>
              </div>
            </div>
          </motion.div>

          {/* Phase 3 */}
          <motion.div 
            initial={{opacity: 0, y: 40}} 
            whileInView={{opacity: 1, y: 0}} 
            viewport={{once: true, margin: "-50px"}} 
            transition={{duration: 0.8}}
            className="flex flex-col items-start text-left gap-6 w-full"
          >
            <h2 className="text-4xl font-bold tracking-tighter text-white drop-shadow-lg leading-[1.1]">
              {t('landing.mobile.phase3.title')}
            </h2>
            <div className="glass-card bg-white/10 p-6 rounded-[2rem] border border-white/20 shadow-2xl backdrop-blur-3xl w-full text-left">
              <h3 className="text-gray-300 text-[11px] flex items-center gap-2 mb-6 uppercase tracking-widest font-bold">
                <TrendingUp size={16} strokeWidth={2.5} /> {t('landing.mobile.yourData')}
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-5xl font-bold text-white leading-none tracking-tighter">12</span>
                  <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mt-2">{t('landing.mobile.countries')}</p>
                </div>
                <div>
                  <span className="text-5xl font-bold text-white leading-none tracking-tighter">45</span>
                  <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mt-2">{t('landing.mobile.days')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Phase 4 */}
          <motion.div
            initial={{opacity: 0, scale: 0.9}}
            whileInView={{opacity: 1, scale: 1}}
            viewport={{once: true, margin: "-50px"}}
            transition={{duration: 0.8}}
            className="flex flex-col items-center text-center gap-6 pt-10"
          >
            <img src={JourneoLogo} alt="Journeo Logo" className="h-16 w-auto object-contain mx-auto drop-shadow-2xl" />
            <h2 className="text-5xl font-bold tracking-tighter text-white drop-shadow-2xl">
              {t('landing.mobile.phase4.title')}
            </h2>
          </motion.div>

        </div>
      </section>

      {/* ===== Features Bento Grid ===== */}
      <section className="relative z-10 py-24 md:py-32 px-6 bg-black border-t border-white/5 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 md:mb-24">
          <motion.h2 
            initial={{opacity: 0, y: 20}} 
            whileInView={{opacity: 1, y: 0}} 
            viewport={{once: true}}
            transition={{duration: 0.6}}
            className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6"
          >
            {t('landing.features.title')}
          </motion.h2>
          <motion.p
            initial={{opacity: 0, y: 20}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            transition={{duration: 0.6, delay: 0.1}}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium tracking-tight"
          >
            {t('landing.features.subtitle')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 auto-rows-[minmax(280px,auto)]">
          {/* Card 1: Rozpočet */}
          <motion.div 
            initial={{opacity: 0, y: 30}} 
            whileInView={{opacity: 1, y: 0}} 
            viewport={{once: true}}
            transition={{duration: 0.6, delay: 0.1}}
            className="col-span-1 md:col-span-2"
          >
            <SpotlightCard className="h-full p-8 flex flex-col justify-between overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20">
                <Wallet size={24} strokeWidth={2} />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-3">{t('landing.features.budget.title')}</h3>
                <p className="text-gray-400 font-medium">{t('landing.features.budget.description')}</p>
              </div>
              <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none z-0" />
            </SpotlightCard>
          </motion.div>

          {/* Card 2: Cestovatelská komunita */}
          <motion.div 
            initial={{opacity: 0, y: 30}} 
            whileInView={{opacity: 1, y: 0}} 
            viewport={{once: true}}
            transition={{duration: 0.6, delay: 0.2}}
            className="col-span-1"
          >
            <SpotlightCard className="h-full p-8 flex flex-col justify-between overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 border border-blue-500/20">
                <Users size={24} strokeWidth={2} />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-3">{t('landing.features.community.title')}</h3>
                <p className="text-gray-400 font-medium">{t('landing.features.community.description')}</p>
              </div>
              <div className="absolute right-0 bottom-0 translate-x-1/3 translate-y-1/3 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none z-0" />
            </SpotlightCard>
          </motion.div>

          {/* Card 3: Detailní statistiky */}
          <motion.div 
            initial={{opacity: 0, y: 30}} 
            whileInView={{opacity: 1, y: 0}} 
            viewport={{once: true}}
            transition={{duration: 0.6, delay: 0.3}}
            className="col-span-1"
          >
            <SpotlightCard className="h-full p-8 flex flex-col justify-between overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 border border-purple-500/20">
                <LineChart size={24} strokeWidth={2} />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-3">{t('landing.features.stats.title')}</h3>
                <p className="text-gray-400 font-medium">{t('landing.features.stats.description')}</p>
              </div>
              <div className="absolute left-0 top-0 -translate-x-1/3 -translate-y-1/3 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none z-0" />
            </SpotlightCard>
          </motion.div>

          {/* Card 4: Všechny cesty na jednom místě */}
          <motion.div 
            initial={{opacity: 0, y: 30}} 
            whileInView={{opacity: 1, y: 0}} 
            viewport={{once: true}}
            transition={{duration: 0.6, delay: 0.4}}
            className="col-span-1 md:col-span-2"
          >
            <SpotlightCard className="h-full p-8 flex flex-col justify-between overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-6 border border-rose-500/20">
                <Globe size={24} strokeWidth={2} />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-3">{t('landing.features.everything.title')}</h3>
                <p className="text-gray-400 font-medium">{t('landing.features.everything.description')}</p>
              </div>
              <div className="absolute left-1/2 bottom-0 translate-x-[-50%] translate-y-1/2 w-64 h-32 bg-rose-500/10 blur-[60px] rounded-full pointer-events-none z-0" />
            </SpotlightCard>
          </motion.div>
        </div>
      </section>

      {/* ===== Minimalist CTA Section ===== */}
      <section className="relative z-10 flex flex-col justify-center items-center py-40 md:py-60 px-6 bg-black border-t border-white/5">
        <div className="max-w-3xl text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-8 leading-[1.1]">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-gray-500 mb-12 font-medium">
            {t('landing.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/auth" state={{ mode: 'register' }} className="group flex items-center justify-center gap-4 px-10 py-5 bg-white text-black text-lg font-bold rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
              {t('landing.cta.button')}
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="py-8 px-6 text-center text-sm font-medium text-gray-500 tracking-tight relative z-10 bg-black/80 backdrop-blur-md border-t border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} <a href="https://vorlos.eu" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Petr Vorlíček</a>. {t('landing.footer.madeWith')}</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">{t('landing.footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-white transition-colors">{t('landing.footer.terms')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
