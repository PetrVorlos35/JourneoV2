// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from 'framer-motion';
import AnimatedValue from './AnimatedValue';

/**
 * Quiet metric tile: coloured icon plate + label + counted-up number.
 * Deliberately a plain border, not a glass-card — glass is reserved for
 * primary content so chrome and content stay tellable apart.
 */
const MetricCard = ({ icon: Icon, label, value, suffix = '', glowColor, delay = 0 }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[2rem] border border-gray-200/60 dark:border-white/[0.07] p-5 sm:p-6 flex items-center gap-4 sm:gap-5"
    >
      <div
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${glowColor}15`, boxShadow: `0 0 20px ${glowColor}20` }}
      >
        <Icon size={22} strokeWidth={2} style={{ color: glowColor }} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-0.5">{label}</p>
        <AnimatedValue
          value={value}
          suffix={suffix}
          className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tighter leading-none"
        />
      </div>
    </motion.div>
  );
};

export default MetricCard;
