import { AuroraBackground } from 'journeov2';

// AuroraBackground is an absolutely-positioned, pure-CSS animated amber aurora
// (intensity: subtle | normal | vivid). It fills its nearest positioned
// ancestor, so previews give it a dark, relative, fixed-height frame.

const Frame = ({ children }: { children: any }) => (
  <div style={{ position: 'relative', height: 280, background: '#020617', borderRadius: 16, overflow: 'hidden' }}>
    {children}
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="text-white/80 text-2xl font-bold tracking-tight">Plan your next escape</span>
    </div>
  </div>
);

export const Normal = () => <Frame><AuroraBackground intensity="normal" /></Frame>;
export const Vivid = () => <Frame><AuroraBackground intensity="vivid" /></Frame>;
