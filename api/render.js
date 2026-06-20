export const config = { runtime: 'edge' };

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

// Resolve route → OG metadata. Returns null to fall back to default tags.
async function resolveMeta(pathname, origin, lang) {
  const en = lang.startsWith('en');

  const tripMatch = pathname.match(/^\/share\/([a-f0-9]{64})/i);
  if (tripMatch) {
    const token = tripMatch[1];
    try {
      const data = await (await fetch(`${origin}/api/public/trips/${token}`)).json();
      const trip = data?.trip;
      if (trip?.title) {
        const range = formatDateRange(trip.startDate, trip.endDate, lang);
        const title = range
          ? `${trip.title} · ${range} — Journeo`
          : `${trip.title} — cestovní plán na Journeo`;
        const description = en
          ? `See the trip plan for “${trip.title}”${range ? ` (${range})` : ''} on Journeo — itinerary, packing list and documents, all in one place.`
          : `Prohlédněte si cestovní plán „${trip.title}"${range ? ` (${range})` : ''} na Journeo — itinerář, seznam věcí na sbalení i dokumenty na jednom místě.`;
        return {
          title,
          description,
          image: `${origin}/api/og/trip?token=${token}&lang=${lang}`,
        };
      }
    } catch { /* fall back */ }
    return null;
  }

  const inviteMatch = pathname.match(/\/add-friend\/([a-f0-9]{16,64})/i);
  if (inviteMatch) {
    const token = inviteMatch[1];
    try {
      const user = await (await fetch(`${origin}/api/public/profile/${token}`)).json();
      const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
      if (name) {
        return {
          title: `${name} vás zve na Journeo — cestovatelský deník`,
          description: en
            ? `${name} invited you to connect on Journeo — plan trips together, share itineraries and keep all your travel plans in one place.`
            : `${name} vás zve mezi přátele na Journeo — plánujte výlety společně, sdílejte itineráře a mějte cestovní plány na jednom místě.`,
          image: `${origin}/api/og/profile?token=${token}&lang=${lang}`,
        };
      }
    } catch { /* fall back */ }
    return null;
  }

  return null;
}

function buildTags({ title, description, image, url }) {
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Journeo" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ].join('\n    ');
}

export default async function handler(request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const lang = (request.headers.get('accept-language') || 'cs').toLowerCase().startsWith('en') ? 'en' : 'cs';

  // Always serve the SPA shell so real users still get the app.
  let html = await (await fetch(`${origin}/index.html`)).text();

  const meta = await resolveMeta(url.pathname, origin, lang);

  if (meta) {
    meta.url = `${origin}${url.pathname}`;
    // Strip any default og/twitter/title/description tags, then inject specifics.
    html = html
      .replace(/<title>[\s\S]*?<\/title>/i, '')
      .replace(/<meta\s+name="description"[^>]*>/gi, '')
      .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
      .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
      .replace('</head>', `    ${buildTags(meta)}\n  </head>`);
  }

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
