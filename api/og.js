import { ImageResponse } from '@vercel/og';
import { createElement as h } from 'react';

export const config = { runtime: 'edge' };

const BG = '#0C0A09';
const FG = '#FAFAF9';
const MUTED = '#A8A29E';
const ACCENT = '#3B82F6';

// Avatar preset keywords map to a single letter glyph fallback (icons aren't
// available in the OG renderer, so we render initials instead).
const PRESET_AVATARS = new Set(['mountain', 'beach', 'city', 'forest', 'travel', 'photography']);

// Load a Google font as TTF (Satori cannot parse woff2). The legacy UA forces
// Google to return a truetype `src`.
async function loadFont(family, weight, text) {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl, {
      headers: { 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)' },
    })).text();
    const url = css.match(/src: url\((.+?)\) format/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

function formatDateRange(startDate, endDate, locale = 'cs') {
  if (!startDate) return '';
  const opts = { day: 'numeric', month: 'long', year: 'numeric' };
  try {
    const start = new Date(startDate).toLocaleDateString(locale, opts);
    if (!endDate || endDate === startDate) return start;
    const end = new Date(endDate).toLocaleDateString(locale, opts);
    return `${start} – ${end}`;
  } catch {
    return '';
  }
}

function getInitials(firstName, lastName) {
  const a = (firstName || '').trim()[0] || '';
  const b = (lastName || '').trim()[0] || '';
  return (a + b).toUpperCase() || '??';
}

function cta(text) {
  return h(
    'div',
    {
      style: {
        position: 'absolute',
        bottom: '64px',
        right: '80px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 28px',
        borderRadius: '999px',
        background: ACCENT,
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: 700,
      },
    },
    text,
    h('div', { style: { fontSize: 28, fontWeight: 700 } }, '→')
  );
}

function shell(children, ctaText) {
  const items = Array.isArray(children) ? [...children] : [children];
  if (ctaText) items.push(cta(ctaText));
  return h(
    'div',
    {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        background: BG,
        backgroundImage: `radial-gradient(circle at 75% 15%, rgba(59,130,246,0.18), transparent 45%)`,
        position: 'relative',
        padding: '80px',
        fontFamily: 'Inter',
      },
    },
    items
  );
}

function brandRow(origin, size = 44) {
  return h(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
    h('img', { src: `${origin}/og-mark.png`, width: size, height: size, style: { objectFit: 'contain' } }),
    h('div', { style: { fontSize: 34, fontWeight: 700, color: FG, letterSpacing: '-0.02em' } }, 'Journeo')
  );
}

export default async function handler(request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const type = url.pathname.split('/').filter(Boolean).pop() || 'main';
  const token = url.searchParams.get('token');
  const lang = url.searchParams.get('lang') || 'cs';

  let titleText = 'Journeo';
  let subtitle = lang.startsWith('en')
    ? 'Your personal travel journal'
    : 'Váš osobní cestovatelský deník';
  let body;

  try {
    if (type === 'trip' && token) {
      const data = await (await fetch(`${origin}/api/public/trips/${token}`)).json();
      const trip = data?.trip;
      if (trip) {
        titleText = trip.title || titleText;
        const range = formatDateRange(trip.startDate, trip.endDate, lang);
        body = shell([
          brandRow(origin),
          h(
            'div',
            { style: { display: 'flex', flexDirection: 'column', marginTop: 'auto', gap: '24px' } },
            h(
              'div',
              { style: { fontSize: 26, fontWeight: 600, color: ACCENT, letterSpacing: '0.06em', textTransform: 'uppercase' } },
              lang.startsWith('en') ? 'Trip' : 'Výlet'
            ),
            h(
              'div',
              { style: { fontSize: 76, fontWeight: 700, color: FG, lineHeight: 1.05, letterSpacing: '-0.03em', maxWidth: '1000px' } },
              titleText
            ),
            range
              ? h('div', { style: { fontSize: 34, color: MUTED } }, range)
              : null
          ),
        ], lang.startsWith('en') ? 'View trip' : 'Zobrazit výlet');
      }
    } else if (type === 'profile' && token) {
      const user = await (await fetch(`${origin}/api/public/profile/${token}`)).json();
      if (user && (user.firstName || user.lastName)) {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        titleText = name;
        const isImage = typeof user.avatarUrl === 'string' && /^https?:\/\//.test(user.avatarUrl);
        const avatar = isImage
          ? h('img', {
              src: user.avatarUrl,
              width: 180,
              height: 180,
              style: { borderRadius: '90px', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.12)' },
            })
          : h(
              'div',
              {
                style: {
                  width: '180px', height: '180px', borderRadius: '90px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(59,130,246,0.15)', border: '4px solid rgba(59,130,246,0.4)',
                  color: '#93C5FD', fontSize: 72, fontWeight: 700,
                },
              },
              getInitials(user.firstName, user.lastName)
            );
        body = shell([
          brandRow(origin),
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '40px', marginTop: 'auto' } },
            avatar,
            h(
              'div',
              { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
              h('div', { style: { fontSize: 64, fontWeight: 700, color: FG, letterSpacing: '-0.03em' } }, name),
              h(
                'div',
                { style: { fontSize: 30, color: MUTED } },
                lang.startsWith('en') ? 'on Journeo' : 'na Journeo'
              )
            )
          ),
        ], lang.startsWith('en') ? 'Add friend' : 'Přidat mezi přátele');
      }
    }
  } catch {
    // fall through to the default/main card on any data error
  }

  // Default ("main") card — logo mark + wordmark + tagline
  if (!body) {
    body = shell([
      h(
        'div',
        {
          style: {
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '32px', margin: 'auto',
          },
        },
        h('img', { src: `${origin}/og-mark.png`, width: 140, height: 140, style: { objectFit: 'contain' } }),
        h('div', { style: { fontSize: 96, fontWeight: 700, color: FG, letterSpacing: '-0.04em' } }, 'Journeo'),
        h('div', { style: { fontSize: 34, color: MUTED } }, subtitle)
      ),
    ], lang.startsWith('en') ? 'Start planning' : 'Začít plánovat');
  }

  const glyphText =
    `Journeo Výlet Trip na on ${titleText} ${subtitle} 0123456789–→ ` +
    `Zobrazit výlet Přidat mezi přátele Začít plánovat View trip Add friend Start planning`;
  const [regular, bold] = await Promise.all([
    loadFont('Inter', 400, glyphText),
    loadFont('Inter', 700, glyphText),
  ]);
  const fonts = [];
  if (regular) fonts.push({ name: 'Inter', data: regular, weight: 400, style: 'normal' });
  if (bold) fonts.push({ name: 'Inter', data: bold, weight: 700, style: 'normal' });

  return new ImageResponse(body, {
    width: 1200,
    height: 630,
    ...(fonts.length ? { fonts } : {}),
  });
}
