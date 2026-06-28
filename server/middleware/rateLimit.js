import rateLimit from 'express-rate-limit';

// ============================================================
// Rate limiting
//
// Pozn.: Na Vercel serverless běží každá instance (warm lambda)
// s vlastní pamětí, takže in-memory počítadla nejsou sdílená
// napříč instancemi. Pro běžnou ochranu proti hrubému bušení
// requesty to ale plně stačí. Kritické omezení (cooldown na
// odesílání ověřovacích kódů) je řešené přes databázi v
// `lib/otpThrottle.js`, takže funguje spolehlivě i serverless.
// ============================================================

const isProd = process.env.NODE_ENV === 'production';

// Společné chování: vracíme JSON ve stejném tvaru jako zbytek API
// ({ error }) a posíláme standardní hlavičky RateLimit-* + Retry-After.
const common = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
};

// ── Globální limit pro všechny /api cally ───────────────────
// Velkorysý strop, aby normální používání appky (dashboard
// načítá víc endpointů najednou) nikdy nenarazilo, ale jeden
// klient nemohl appku zaplavit tisíci requesty.
export const globalLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000, // 1 minuta
  max: 300, // max 300 requestů / minutu / IP
  message: { error: 'Příliš mnoho požadavků. Zkuste to prosím za chvíli.' },
});

// ── Přísnější limit pro citlivé auth endpointy ──────────────
// Login / register / verify / resend / reset hesla. Chrání
// před hádáním hesel, enumerací e-mailů a spamem.
export const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 40, // max 40 pokusů / 15 min / IP
  message: { error: 'Příliš mnoho pokusů o přihlášení. Zkuste to prosím později.' },
  // Úspěšné GETy (např. /auth/me) nezapočítáváme, ať legitimní
  // používání nenarazí na strop.
  skip: (req) => req.method === 'GET',
});
