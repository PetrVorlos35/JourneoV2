import { memo } from 'react';

/**
 * Animated aurora gradient background with noise texture.
 * Pure CSS animations — no JS overhead.
 */
const AuroraBackground = memo(function AuroraBackground({ 
  className = '',
  intensity = 'normal' // 'subtle' | 'normal' | 'vivid'
}) {
  const opacityMap = {
    subtle: 'opacity-20',
    normal: 'opacity-30',
    vivid: 'opacity-50'
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Primary aurora gradient */}
      <div 
        className={`absolute inset-0 ${opacityMap[intensity]}`}
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(245, 158, 11, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(251, 191, 36, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 50% 60% at 50% 80%, rgba(249, 115, 22, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 70% 60%, rgba(217, 119, 6, 0.2) 0%, transparent 50%)
          `,
          animation: 'aurora 20s ease-in-out infinite',
        }}
      />
      
      {/* Secondary slower layer for depth */}
      <div 
        className={`absolute inset-0 ${opacityMap[intensity]}`}
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 60% 30%, rgba(245, 158, 11, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 50% 70% at 30% 70%, rgba(251, 146, 60, 0.1) 0%, transparent 50%)
          `,
          animation: 'aurora 30s ease-in-out infinite reverse',
        }}
      />
      
      {/* Noise overlay */}
      <div className="noise-overlay absolute inset-0" />
      
      {/* Top fade for nav readability */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#020617] to-transparent z-[2]" />
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#020617] to-transparent z-[2]" />
    </div>
  );
});

export default AuroraBackground;
