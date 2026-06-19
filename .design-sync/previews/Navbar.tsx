import { Navbar } from 'journeov2';

// The landing navbar: a floating, blurred pill with the Journeo logo, a language
// switcher, and a login CTA. It's `fixed top-6`, so the preview gives it a tall
// dark frame to sit in. Single cell.

export const Default = () => (
  <div style={{ position: 'relative', height: 180, background: '#0a0a0a' }}>
    <Navbar />
  </div>
);
