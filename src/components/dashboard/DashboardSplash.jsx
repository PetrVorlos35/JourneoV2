import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import JourneoLogo from '../../assets/Journeo_whitelogo.png';
import JourneoLogoDark from '../../assets/Journeo_blacklogo.png';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * DashboardSplash – zobrazí se jednou při vstupu do dashboardu,
 * pak se plynule přepne na samotný obsah (children).
 */
const DashboardSplash = ({ children }) => {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'done'
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
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
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fbfbfd] dark:bg-black transition-colors duration-500"
        >
          {/* Subtle glow */}
          <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

          <motion.img
            src={isDark ? JourneoLogo : JourneoLogoDark}
            alt="Journeo"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'backOut' }}
            className="w-16 mb-8 relative z-10"
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
                className="text-5xl sm:text-7xl font-bold text-gray-900 dark:text-white tracking-tight"
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
            className="relative z-10 text-gray-500 dark:text-gray-400 mt-6 text-[11px] font-medium tracking-[0.2em] uppercase"
          >
            Váš cestovatelský deník
          </motion.p>

          {/* Loading bar */}
          <motion.div
            className="relative z-10 mt-12 h-[2px] bg-black/10 dark:bg-white/10 rounded-full w-32 overflow-hidden"
          >
            <motion.div
              className="h-full bg-blue-500 rounded-full"
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
          className="h-full w-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DashboardSplash;
