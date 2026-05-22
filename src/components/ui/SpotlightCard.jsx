import { useRef, useCallback, memo } from 'react';

/**
 * Card with a cursor-following spotlight glow effect.
 * Inspired by Aceternity UI hover cards.
 * Uses CSS custom properties for spotlight position — no re-renders.
 */
const SpotlightCard = memo(function SpotlightCard({ 
  children, 
  className = '',
  spotlightColor = 'rgba(245, 158, 11, 0.08)',
  borderColor = 'rgba(255, 255, 255, 0.06)',
  hoverBorderColor = 'rgba(245, 158, 11, 0.2)',
}) {
  const cardRef = useRef(null);
  
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
    cardRef.current.style.setProperty('--spotlight-color', spotlightColor);
  }, [spotlightColor]);
  
  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`spotlight-card group relative rounded-3xl transition-all duration-500 ${className}`}
      style={{
        border: `1px solid ${borderColor}`,
        background: 'rgba(255, 255, 255, 0.02)',
      }}
      onMouseEnter={() => {
        if (cardRef.current) {
          cardRef.current.style.borderColor = hoverBorderColor;
          cardRef.current.style.background = 'rgba(255, 255, 255, 0.04)';
        }
      }}
      onMouseLeave={() => {
        if (cardRef.current) {
          cardRef.current.style.borderColor = borderColor;
          cardRef.current.style.background = 'rgba(255, 255, 255, 0.02)';
        }
      }}
    >
      {/* Spotlight gradient overlay */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${spotlightColor}, transparent 60%)`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

export default SpotlightCard;
