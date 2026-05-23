import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Clock, Plane, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import heroImage from '../assets/hero_travel.png';
import JourneoLogo from '../assets/Journeo_whitelogo.png';

const LandingPage = () => {
  // Scrollytelling reference and hooks
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });

  // Photo animations
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.8, 1.1]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.2], ["2.5rem", "0rem"]);
  const width = useTransform(scrollYProgress, [0, 0.2], ["90vw", "100vw"]);
  const height = useTransform(scrollYProgress, [0, 0.2], ["70vh", "100vh"]);
  const maxWidth = useTransform(scrollYProgress, [0, 0.2], ["1400px", "100vw"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 0.5, 0.5, 1]);
  const photoOpacity = useTransform(scrollYProgress, [0.85, 1], [1, 0]);

  // STORYTELLING TEXT PHASES (DESKTOP)
  const s1Opacity = useTransform(scrollYProgress, [0.1, 0.18, 0.28, 0.32], [0, 1, 1, 0]);
  const s1Y = useTransform(scrollYProgress, [0.1, 0.18, 0.28, 0.32], [30, 0, 0, -30]);
  const s1Scale = useTransform(scrollYProgress, [0.1, 0.32], [0.95, 1.05]);

  const s2Opacity = useTransform(scrollYProgress, [0.34, 0.42, 0.52, 0.56], [0, 1, 1, 0]);
  const s2Y = useTransform(scrollYProgress, [0.34, 0.42, 0.52, 0.56], [30, 0, 0, -30]);
  const s2Scale = useTransform(scrollYProgress, [0.34, 0.56], [0.95, 1.05]);

  const s3Opacity = useTransform(scrollYProgress, [0.58, 0.66, 0.74, 0.78], [0, 1, 1, 0]);
  const s3Y = useTransform(scrollYProgress, [0.58, 0.66, 0.74, 0.78], [30, 0, 0, -30]);
  const s3Scale = useTransform(scrollYProgress, [0.58, 0.78], [0.95, 1.05]);

  const s4Opacity = useTransform(scrollYProgress, [0.82, 0.88, 0.95, 1], [0, 1, 1, 0]);
  const s4Y = useTransform(scrollYProgress, [0.82, 0.88, 0.95, 1], [30, 0, 0, -30]);
  const s4Scale = useTransform(scrollYProgress, [0.82, 1], [0.95, 1.05]);

  // FLOATING UI WIDGETS ANIMATIONS (DESKTOP)
  const w1X = useTransform(scrollYProgress, [0.1, 0.32], ["25vw", "15vw"]);
  const w1Y = useTransform(scrollYProgress, [0.1, 0.32], ["15vh", "-10vh"]);
  const w1Rotate = useTransform(scrollYProgress, [0.1, 0.32], [10, -5]);
  
  const w2X = useTransform(scrollYProgress, [0.34, 0.56], ["-25vw", "-15vw"]);
  const w2Y = useTransform(scrollYProgress, [0.34, 0.56], ["0vh", "-15vh"]);
  const w2Rotate = useTransform(scrollYProgress, [0.34, 0.56], [-10, 5]);

  const w3X = useTransform(scrollYProgress, [0.58, 0.78], ["25vw", "15vw"]);
  const w3Y = useTransform(scrollYProgress, [0.58, 0.78], ["-15vh", "10vh"]);
  const w3Rotate = useTransform(scrollYProgress, [0.58, 0.78], [15, -2]);

  return (
    <div className="dark min-h-screen selection:bg-blue-500/30 bg-black text-[#f5f5f7] font-sans">
      
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center items-center">
        <div className="absolute w-[800px] h-[800px] rounded-[100%] bg-blue-500/10 blur-[120px]" />
      </div>

      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-3xl rounded-full bg-[#1d1d1f]/70 backdrop-blur-[40px] saturate-[1.8] border border-white/10 shadow-sm px-2 py-2">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 pl-4 group">
            <img 
              src={JourneoLogo} 
              alt="Journeo Logo" 
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105" 
            />
            <span className="font-semibold text-lg tracking-tight">Journeo</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-gray-400"></div>
          <div className="pr-1">
            <Link to="/auth" className="inline-block text-[13px] font-medium bg-white text-black px-5 py-2.5 rounded-full hover:scale-105 transition-transform duration-300 shadow-lg">
              Přihlásit se
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== Hero Section ===== */}
      <section className="relative h-[80vh] flex flex-col justify-center items-center text-center px-6 z-10 pt-20 overflow-hidden">
        
        {/* Giant Watermark Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
          <span className="text-[20vw] font-black tracking-tighter text-white/[0.08] leading-none">
            JOURNEO
          </span>
        </div>

        <h1 className="relative z-10 text-[12vw] sm:text-[5rem] lg:text-[7rem] font-bold leading-[1.05] sm:leading-[0.95] tracking-tighter max-w-5xl mx-auto break-words mt-12">
          Zaznamenávejte <br className="hidden sm:block" />
          svá dobrodružství.
        </h1>

        <p className="relative z-10 mt-8 text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto font-medium tracking-tight">
          Každý krok, každý objev, každá vzpomínka. Váš osobní cestovatelský deník v čistém a minimalistickém designu.
        </p>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 mt-12">
          <Link to="/auth" className="group flex items-center gap-2 px-8 py-4 bg-white text-black text-[15px] font-semibold rounded-full hover:scale-105 transition-transform duration-300 shadow-xl shadow-white/10">
            Začít psát
          </Link>
          <button onClick={() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' })} className="group flex items-center gap-2 px-8 py-4 text-[15px] font-semibold hover:text-white text-gray-400 transition-colors">
            Zjistit více <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ===== Desktop Cinematic Scrollytelling Section (Hidden on Mobile) ===== */}
      <section ref={targetRef} className="hidden md:block relative h-[400vh] w-full" id="story">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-black">
          
          <motion.div 
            className="relative overflow-hidden flex items-center justify-center shadow-2xl origin-center will-change-transform"
            style={{ width, height, maxWidth, borderRadius, opacity: photoOpacity }}
          >
            <motion.img
              src={heroImage}
              alt="Náhled aplikace"
              className="w-full h-full object-cover"
              style={{ scale }}
            />
            
            <motion.div 
              className="absolute inset-0 bg-black" 
              style={{ opacity: overlayOpacity }}
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6 perspective-[1000px]">
              
              {/* === Phase 1 === */}
              <motion.div className="absolute text-center md:text-left md:-translate-x-[20vw] w-full md:w-auto" style={{ opacity: s1Opacity, y: s1Y, scale: s1Scale }}>
                <h2 className="text-4xl sm:text-6xl md:text-[5rem] font-bold tracking-tighter text-white drop-shadow-2xl leading-[1.1]">
                  Svět čeká <br/> na objevení.
                </h2>
              </motion.div>
              
              <motion.div className="absolute hidden md:flex glass-card bg-white/10 p-6 rounded-[2rem] border border-white/20 shadow-[0_32px_64px_rgba(0,0,0,0.5)] backdrop-blur-3xl w-80 flex-col" style={{ opacity: s1Opacity, x: w1X, y: w1Y, rotate: w1Rotate }}>
                <div className="flex items-center gap-2 text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-4 bg-blue-500/20 self-start px-3 py-1.5 rounded-full">
                  <Clock size={14} strokeWidth={2.5} /> Další cesta za
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold tracking-tighter text-white leading-none">14</span>
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">dní</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-1 tracking-tight">Kjóto, Japonsko</h3>
                <p className="text-gray-300 text-[13px] font-medium">12. října 2026</p>
              </motion.div>

              {/* === Phase 2 === */}
              <motion.div className="absolute text-center md:text-right md:translate-x-[20vw] w-full md:w-auto" style={{ opacity: s2Opacity, y: s2Y, scale: s2Scale }}>
                <h2 className="text-4xl sm:text-6xl md:text-[5rem] font-bold tracking-tighter text-white drop-shadow-2xl leading-[1.1]">
                  Zážitky ale <br/> rychle pominou.
                </h2>
              </motion.div>

              <motion.div className="absolute hidden md:block glass-card bg-white/10 p-6 rounded-[2rem] border border-white/20 shadow-[0_32px_64px_rgba(0,0,0,0.5)] backdrop-blur-3xl w-72" style={{ opacity: s2Opacity, x: w2X, y: w2Y, rotate: w2Rotate }}>
                <div className="w-12 h-12 mb-5 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                  <MapPin size={24} strokeWidth={2} />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white tracking-tight">Kjóto</h3>
                <div className="flex items-center text-[13px] font-bold text-gray-300 gap-2 mb-5">
                  <Calendar size={14} strokeWidth={2} />
                  <span>1. 4. — 15. 4. 2026</span>
                </div>
                <div className="pt-4 border-t border-white/20 flex justify-between items-center">
                  <span className="text-gray-300 text-[11px] uppercase tracking-widest font-bold">Aktivit: 24</span>
                  <span className="text-[11px] font-bold text-blue-300 uppercase tracking-widest flex items-center gap-1">Otevřít <ArrowRight size={14}/></span>
                </div>
              </motion.div>

              {/* === Phase 3 === */}
              <motion.div className="absolute text-center md:text-left md:-translate-x-[20vw] w-full md:w-auto" style={{ opacity: s3Opacity, y: s3Y, scale: s3Scale }}>
                <h2 className="text-4xl sm:text-6xl md:text-[5rem] font-bold tracking-tighter text-white drop-shadow-2xl leading-[1.1]">
                  Proto si je <br/> musíte uchovat.
                </h2>
              </motion.div>

              <motion.div className="absolute hidden md:block glass-card bg-white/10 p-6 rounded-[2rem] border border-white/20 shadow-[0_32px_64px_rgba(0,0,0,0.5)] backdrop-blur-3xl w-72" style={{ opacity: s3Opacity, x: w3X, y: w3Y, rotate: w3Rotate }}>
                <h3 className="text-gray-300 text-[11px] flex items-center gap-2 mb-6 uppercase tracking-widest font-bold">
                  <TrendingUp size={16} strokeWidth={2.5} /> Vaše data
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-5xl font-bold text-white leading-none tracking-tighter">12</span>
                    <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mt-2">Zemí</p>
                  </div>
                  <div>
                    <span className="text-5xl font-bold text-white leading-none tracking-tighter">45</span>
                    <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mt-2">Dní</p>
                  </div>
                </div>
              </motion.div>

              {/* === Phase 4 === */}
              <motion.div className="absolute text-center w-full" style={{ opacity: s4Opacity, y: s4Y, scale: s4Scale }}>
                <img src={JourneoLogo} alt="Journeo Logo" className="h-20 w-auto object-contain mx-auto mb-8 drop-shadow-2xl" />
                <h2 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter text-white drop-shadow-2xl">
                  Vaše Journeo.
                </h2>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== Mobile Storytelling Section (Standard Scrolling with Fade-ins) ===== */}
      <section className="md:hidden relative w-full flex flex-col pb-20 pt-10">
        {/* Fixed background for a parallax feel on mobile */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img src={heroImage} className="w-full h-full object-cover opacity-20" alt="Mountain Background" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black"></div>
        </div>

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
              Svět čeká <br/> na objevení.
            </h2>
            <div className="glass-card bg-white/10 p-6 rounded-[2rem] border border-white/20 shadow-2xl backdrop-blur-3xl w-full flex flex-col text-left">
              <div className="flex items-center gap-2 text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-4 bg-blue-500/20 self-start px-3 py-1.5 rounded-full">
                <Clock size={14} strokeWidth={2.5} /> Další cesta za
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold tracking-tighter text-white leading-none">14</span>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">dní</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1 tracking-tight">Kjóto, Japonsko</h3>
              <p className="text-gray-300 text-[13px] font-medium">12. října 2026</p>
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
              Zážitky ale <br/> rychle pominou.
            </h2>
            <div className="glass-card bg-white/10 p-6 rounded-[2rem] border border-white/20 shadow-2xl backdrop-blur-3xl w-full text-left">
              <div className="w-12 h-12 mb-5 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                <MapPin size={24} strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white tracking-tight">Kjóto</h3>
              <div className="flex items-center text-[13px] font-bold text-gray-300 gap-2 mb-5">
                <Calendar size={14} strokeWidth={2} />
                <span>1. 4. — 15. 4. 2026</span>
              </div>
              <div className="pt-4 border-t border-white/20 flex justify-between items-center">
                <span className="text-gray-300 text-[11px] uppercase tracking-widest font-bold">Aktivit: 24</span>
                <span className="text-[11px] font-bold text-blue-300 uppercase tracking-widest flex items-center gap-1">Otevřít <ArrowRight size={14}/></span>
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
              Proto si je <br/> musíte uchovat.
            </h2>
            <div className="glass-card bg-white/10 p-6 rounded-[2rem] border border-white/20 shadow-2xl backdrop-blur-3xl w-full text-left">
              <h3 className="text-gray-300 text-[11px] flex items-center gap-2 mb-6 uppercase tracking-widest font-bold">
                <TrendingUp size={16} strokeWidth={2.5} /> Vaše data
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-5xl font-bold text-white leading-none tracking-tighter">12</span>
                  <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mt-2">Zemí</p>
                </div>
                <div>
                  <span className="text-5xl font-bold text-white leading-none tracking-tighter">45</span>
                  <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mt-2">Dní</p>
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
              Vaše Journeo.
            </h2>
          </motion.div>

        </div>
      </section>

      {/* ===== Minimalist CTA Section ===== */}
      <section className="relative z-10 flex flex-col justify-center items-center py-40 md:py-60 px-6 bg-black border-t border-white/5">
        <div className="max-w-3xl text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-8 leading-[1.1]">
            Jste připraveni vyrazit?
          </h2>
          <p className="text-xl text-gray-500 mb-12 font-medium">
            Připojte se a začněte tvořit svou osobní mapu světa. Bez závazků, bez zbytečností.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/auth" className="group flex items-center justify-center gap-4 px-10 py-5 bg-white text-black text-lg font-bold rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
              Začít zdarma
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="pb-12 text-center text-sm font-medium text-gray-600 tracking-tight relative z-10 bg-black">
        <p>&copy; {new Date().getFullYear()} Petr Vorlíček. Vytvořeno s důrazem na detail.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
