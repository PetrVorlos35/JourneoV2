import { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/**
 * Count-up number. The animated span is aria-hidden and the real value is
 * exposed to screen readers separately, so assistive tech never reads a
 * half-finished number. Skips the animation entirely under reduced motion.
 */
const AnimatedValue = ({ value, suffix = '', prefix = '', className = '' }) => {
  const [displayed, setDisplayed] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const { i18n } = useTranslation();
  const finalValue = typeof value === 'number' ? value : 0;

  useEffect(() => {
    if (finalValue === 0) { setDisplayed(0); return; }

    if (shouldReduceMotion) {
      setDisplayed(finalValue);
      return;
    }

    const duration = 700;
    const startTime = performance.now();
    let rafId;

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * finalValue));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [finalValue, shouldReduceMotion]);

  return (
    <>
      <span className={className} aria-hidden="true">
        {prefix}{displayed.toLocaleString(i18n.language)}{suffix}
      </span>
      <span className="sr-only">{prefix}{finalValue.toLocaleString(i18n.language)}{suffix}</span>
    </>
  );
};

export default AnimatedValue;
