import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-gray-300 mb-6">
            Vaše osobní kniha výletů
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-8"
        >
          Zaznamenávejte svá <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            dobrodružství
          </span> s Journeo
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
        >
          Jednoduchá a elegantní aplikace pro plánování, sdílení a uchovávání vzpomínek na všechny vaše výlety a cesty.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-xl font-bold text-lg hover:scale-105 transition-transform inline-block">
            Začít objevovat
          </Link>
          <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors inline-block text-center">
            Jak to funguje?
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
