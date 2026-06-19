import { SpotlightCard } from 'journeov2';

// SpotlightCard is a presentational wrapper: a rounded, translucent card with a
// cursor-following glow. It only shows its frame + children, so previews supply
// realistic trip-card content on a dark backdrop (the card bg is near-transparent).

export const Default = () => (
  <div style={{ padding: 32, background: '#0a0a0a' }}>
    <SpotlightCard className="p-8" >
      <div style={{ maxWidth: 320 }}>
        <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Next trip</div>
        <h3 className="text-2xl font-bold text-white mb-2">Kyoto, Japan</h3>
        <p className="text-white/60 text-sm leading-relaxed">
          Ancient temples, quiet gardens, and the slow drift of the Kamo river.
          Hover to follow the spotlight.
        </p>
      </div>
    </SpotlightCard>
  </div>
);

export const Grid = () => (
  <div style={{ padding: 32, background: '#0a0a0a', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
    <SpotlightCard className="p-6">
      <div className="text-white font-semibold text-lg">Paris</div>
      <div className="text-white/50 text-sm mt-1">7 days · April</div>
    </SpotlightCard>
    <SpotlightCard
      className="p-6"
      spotlightColor="rgba(96,165,250,0.12)"
      hoverBorderColor="rgba(96,165,250,0.3)"
    >
      <div className="text-white font-semibold text-lg">Reykjavík</div>
      <div className="text-white/50 text-sm mt-1">5 days · September</div>
    </SpotlightCard>
  </div>
);
