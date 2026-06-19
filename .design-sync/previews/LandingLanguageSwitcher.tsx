import { LandingLanguageSwitcher } from 'journeov2';

// A compact "cs | en" language toggle. isDark controls the active/inactive
// text colors. Pure CSS, so both themes can share the sheet.

export const Dark = () => (
  <div style={{ background: '#0a0a0a', padding: 28, display: 'inline-block' }}>
    <LandingLanguageSwitcher isDark={true} />
  </div>
);

export const Light = () => (
  <div style={{ background: '#ffffff', padding: 28, display: 'inline-block' }}>
    <LandingLanguageSwitcher isDark={false} />
  </div>
);
