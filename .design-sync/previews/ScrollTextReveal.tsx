import { ScrollTextReveal } from 'journeov2';
import { useMotionValue } from 'framer-motion';

// ScrollTextReveal fades words in as a scroll `progress` MotionValue advances
// from 0→1. Statically we pin progress to 1 so every word is fully revealed
// (the component clamps each word's range, so progress=1 → opacity 1 for all).
// The revealed text is white with a glow, so it sits on a dark backdrop.
// Single cell (framer-driven).

export const Revealed = () => {
  const progress = useMotionValue(1);
  return (
    <div style={{ background: '#0a0a0a', padding: 40, maxWidth: 560 }}>
      <p className="text-3xl font-bold leading-snug">
        <ScrollTextReveal
          text="Every great trip begins with a single plan."
          progress={progress}
        />
      </p>
    </div>
  );
};
