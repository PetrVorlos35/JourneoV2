import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import JourneoLogo from '../../assets/Journeo_whitelogo.png';

/**
 * DashboardSplash – zobrazí se jednou při vstupu do dashboardu,
 * pak se plynule přepne na samotný obsah (children).
 */
const DashboardSplash = ({ children }) => {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'done'

  useEffect(() => {
    // Po 2.2 s přejdeme na skutečný obsah
    const t = setTimeout(() => setPhase('done'), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {phase === 'loading' ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
        >
          {/* Glowing background blob */}
          <div className="absolute w-96 h-96 bg-indigo-600/25 rounded-full blur-[120px] pointer-events-none" />

          <motion.img
            src={JourneoLogo}
            alt="Journeo"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'backOut' }}
            className="w-20 mb-6 relative z-10"
          />

          {/* Animated word */}
          <motion.div
            className="relative z-10 flex overflow-hidden"
            initial="hidden"
            animate="visible"
          >
            {"Journeo".split('').map((char, i) => (
              <motion.span
                key={i}
                className="text-6xl sm:text-8xl font-extrabold text-white tracking-tight"
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.07, ease: 'easeOut' }}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className="relative z-10 text-gray-400 mt-4 text-sm tracking-widest uppercase"
          >
            Váš cestovní deník
          </motion.p>

          {/* Loading bar */}
          <motion.div
            className="relative z-10 mt-10 h-[2px] bg-white/10 rounded-full w-40 overflow-hidden"
          >
            <motion.div
              className="h-full bg-indigo-400 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DashboardSplash;
