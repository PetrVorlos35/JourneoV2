import { CharCount } from 'journeov2';

// CharCount renders a "<len> / <max>" counter that shifts color as the value
// approaches the limit: muted (normal) → amber (≥80%) → red (≥95%). Showing the
// three states together makes the token colors legible.

const Row = ({ label, value, max }: { label: string; value: string; max: number }) => (
  <div className="flex items-center gap-4">
    <span className="text-white/40 text-xs uppercase tracking-wide w-24">{label}</span>
    <CharCount value={value} max={max} />
  </div>
);

export const States = () => (
  <div style={{ padding: 28, background: '#0a0a0a', display: 'flex', flexDirection: 'column', gap: 14 }}>
    <Row label="Normal" value={'A quiet lake day.'} max={280} />
    <Row label="Near limit" value={'x'.repeat(232)} max={280} />
    <Row label="At limit" value={'x'.repeat(277)} max={280} />
  </div>
);
