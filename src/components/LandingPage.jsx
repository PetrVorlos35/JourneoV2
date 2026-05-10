import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, BarChart2, Calendar, Users, ArrowRight, Plane, Sparkles } from 'lucide-react';
import { Globe } from './ui/Globe';
import JourneoLogo from '../assets/Journeo_whitelogo.png';

// --- Static Data ---
const globeMarkers = [
  { location: [50.0755, 14.4378], id: 'prague' },
  { location: [41.9028, 12.4964], id: 'rome' },
  { location: [48.8566, 2.3522], id: 'paris' },
  { location: [35.6762, 139.6503], id: 'tokyo' },
  { location: [40.7128, -74.0060], id: 'nyc' },
  { location: [-33.8688, 151.2093], id: 'sydney' },
];

const GLOBE_CONFIG = {
  baseColor: [0.05, 0.1, 0.3],
  markerColor: [0.4, 0.6, 1],
  glowColor: [0.1, 0.2, 0.4]
};

// --- Background Components ---

const GridBackground = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
  </div>
);

// --- Animation Components ---

const AnimatedText = ({ text, className, delay = 0 }) => {
  const words = text.split(' ');
  
  return (
    <div className="flex flex-wrap justify-center overflow-visible px-4">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.8,
            delay: delay + (i * 0.1),
            ease: [0.21, 0.47, 0.32, 0.98]
          }}
          className={`inline-block whitespace-nowrap ${className} ${i !== words.length - 1 ? 'mr-[0.25em]' : ''}`}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

// --- Sections ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 sm:px-6 py-4 ${
        scrolled ? 'sm:py-3' : 'sm:py-6'
      }`}
    >
      <div className={`max-w-7xl mx-auto flex items-center justify-between rounded-full px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-500 ${
        scrolled 
          ? 'bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl' 
          : 'bg-transparent border border-transparent'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <img src={JourneoLogo} alt="Journeo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          <span className="text-lg sm:text-xl font-bold tracking-tight text-white">Journeo</span>
        </div>

        <div className="hidden md:flex items-center gap-10 text-sm font-medium">
          {['Vlastnosti', 'O aplikaci', 'Komunita'].map((item) => (
            <a key={item} href={`#${item}`} className="text-gray-400 hover:text-white transition-colors">
              {item}
            </a>
          ))}
        </div>

        <Link 
          to="/dashboard" 
          className="relative group px-4 sm:px-6 py-2 rounded-full bg-white text-black text-xs sm:text-sm font-bold overflow-hidden transition-all hover:scale-105 active:scale-95"
        >
          <span className="relative z-10">Vstoupit</span>
          <div className="absolute inset-0 bg-blue-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </Link>
      </div>
    </motion.nav>
  );
};

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay }}
    className="group p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-500"
  >
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
      <Icon size={20} className="sm:w-6 sm:h-6" />
    </div>
    <h3 className="text-lg sm:text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
    <p className="text-gray-500 leading-relaxed text-sm">{description}</p>
  </motion.div>
);

const LandingPage = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">
        <GridBackground />
        
        {/* Glow effect follows mouse */}
        <div 
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000 opacity-50"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(37, 99, 235, 0.08), transparent 80%)`
          }}
        />

        {/* Globe Background - Absolute positioned behind content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] sm:w-[100%] max-w-[800px] aspect-square pointer-events-none opacity-40 sm:opacity-60 blur-[2px] sm:blur-none">
          <Globe 
            className="w-full h-full"
            markers={globeMarkers}
            baseColor={GLOBE_CONFIG.baseColor}
            markerColor={GLOBE_CONFIG.markerColor}
            glowColor={GLOBE_CONFIG.glowColor}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 w-full text-center space-y-8 sm:space-y-12">
          <div className="space-y-6 sm:space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
            </motion.div>

            <div className="space-y-4 sm:space-y-6">
              <div className="relative inline-block">
                <AnimatedText 
                  text="Journeo"
                  className="text-7xl sm:text-9xl md:text-[10rem] font-bold tracking-tight text-white select-none"
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 1 }}
                  className="absolute -top-6 -right-6 hidden sm:block"
                >
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest backdrop-blur-md">
                    Beta
                  </span>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="space-y-6"
              >
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                  Zaznamenávejte svá <span className="text-blue-500 italic">dobrodružství</span>
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light px-4">
                  Jednoduchá a elegantní aplikace pro plánování, sdílení a uchovávání vzpomínek na všechny vaše cesty.
                </p>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 px-6"
          >
            <Link 
              to="/dashboard" 
              className="w-full sm:w-auto group flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all active:scale-95 shadow-xl shadow-white/5"
            >
              Začít objevovat
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-lg transition-all">
              Více o nás
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Sjeďte dolů</span>
          <div className="w-px h-8 sm:h-12 bg-gradient-to-b from-white to-transparent" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="Vlastnosti" className="py-20 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
            <h2 className="text-[10px] sm:text-xs font-bold text-blue-500 uppercase tracking-[0.3em]">Funkce</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Vše co potřebujete pro dokonalý přehled
            </h3>
            <p className="text-slate-500 text-base sm:text-lg font-light">
              Aplikace navržená s ohledem na jednoduchost a krásný design. Zaznamenat výlet nebylo nikdy jednodušší.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={Calendar} 
              title="Denní plánování" 
              description="Sestavte si itinerář den po dni. Zadejte lokace, aktivity a poznámky ke každému dni výletu."
              delay={0.1}
            />
            <FeatureCard 
              icon={BarChart2} 
              title="Statistiky cest" 
              description="Přehled všech vašich cest – počet výletů, strávené dny na cestách a naplánované aktivity."
              delay={0.2}
            />
            <FeatureCard 
              icon={MapPin} 
              title="Sledování lokací" 
              description="Ke každému výletnímu dni přiřaďte město nebo konkrétní místo, které plánujete navštívit."
              delay={0.3}
            />
            <FeatureCard 
              icon={Users} 
              title="Sdílení a komunita" 
              description="Brzy přijdou funkce pro sdílení výletů s přáteli a plánování společných dobrodružství."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 relative overflow-hidden px-4">
        <div className="absolute inset-0 bg-blue-600/5 z-0" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-20 text-center space-y-8">
            <div className="inline-flex p-4 rounded-3xl bg-blue-500/10 text-blue-400 mb-4">
              <Plane size={32} />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white tracking-tight">
              Začněte své <span className="text-blue-500 italic">dobrodružství</span> dnes
            </h2>
            <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto font-light">
              Žádná registrace, žádná databáze. Otevřete aplikaci a začněte plánovat hned teď.
            </p>
            <div className="pt-8">
              <Link 
                to="/dashboard" 
                className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-white text-black rounded-2xl font-bold text-lg sm:text-xl hover:scale-105 transition-all active:scale-95 inline-block"
              >
                Vstoupit do Journeo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-[#01040f]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img src={JourneoLogo} alt="Journeo" className="w-6 h-6 object-contain opacity-50" />
            <span className="text-slate-500 font-bold tracking-tight">Journeo</span>
          </div>
          <div className="text-slate-600 text-xs sm:text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Journeo — Petr Vorlíček. Vyrobeno pro cestovatele.
          </div>
          <div className="flex gap-6 text-slate-500 text-sm">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
