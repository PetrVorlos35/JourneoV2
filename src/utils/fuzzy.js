// Fuzzy vyhledávání pro Spotlight (⌘K). Čeština potřebuje hledání bez
// diakritiky ("praha" musí najít "Praha" i "Příbram"), takže se všechno
// porovnává na normalizovaném textu.

/**
 * Malá písmena + odstranění diakritiky, znak po znaku. Díky tomu má
 * výsledek stejnou délku i indexy jako vstup — pozice shod spočítané nad
 * normalizovaným textem jde rovnou zvýraznit v originále.
 */
export const normalize = (input) => {
  const s = String(input ?? '').toLowerCase();
  let out = '';
  for (const ch of s) {
    const stripped = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Když se znak nerozloží na jediný (emoji, ß, …), necháme originál —
    // jinak by se indexy rozjely.
    out += stripped.length === 1 ? stripped : ch;
  }
  return out;
};

const BOUNDARY = /[\s\-–—_/\\,.:;()[\]{}#|'"]/;

const isBoundary = (text, i) => i === 0 || BOUNDARY.test(text[i - 1]);

/**
 * Skóre jednoho slova dotazu proti už normalizovanému textu.
 * Vrací `null`, když se slovo v textu vůbec nenajde.
 */
const scoreToken = (text, token) => {
  // 1) Souvislý výskyt — nejsilnější shoda a rovnou souvislé zvýraznění.
  const idx = text.indexOf(token);
  if (idx !== -1) {
    let score = 140 - Math.min(idx, 40);
    if (isBoundary(text, idx)) score += 70;      // začátek slova
    if (text.length === token.length) score += 50; // přesná shoda pole
    const positions = [];
    for (let i = 0; i < token.length; i++) positions.push(idx + i);
    return { score, positions };
  }

  // 2) Podposloupnost — "prkr" najde "Praha Krakov". Bonusy za navazující
  //    znaky a začátky slov, srážka za přeskakování.
  const positions = [];
  let cursor = 0;
  let score = 0;
  let streak = 0;
  for (let qi = 0; qi < token.length; qi++) {
    const found = text.indexOf(token[qi], cursor);
    if (found === -1) return null;
    if (found === cursor && qi > 0) {
      streak += 1;
      score += 8 + streak * 2;
    } else {
      streak = 0;
      score += 2;
      score -= Math.min(found - cursor, 12);
    }
    if (isBoundary(text, found)) score += 14;
    positions.push(found);
    cursor = found + 1;
  }
  return { score: Math.max(score, 1), positions };
};

/** Dotaz na jednotlivá slova; prázdný dotaz = žádné filtrování. */
export const tokenize = (query) => normalize(query).split(/\s+/).filter(Boolean);

/**
 * Ohodnotí položku podle jejích prohledávaných polí.
 *
 * `fields` je pole `{ norm, weight, highlight }`, kde `norm` je předem
 * normalizovaný text. Každé slovo dotazu se musí najít alespoň v jednom
 * poli — proto "praha vydaje" projde i tehdy, když je "Praha" v názvu
 * a "výdaje" až v klíčových slovech. Pozice pro zvýraznění se sbírají
 * jen z polí označených `highlight` (typicky název).
 *
 * Vrací `null`, když položka dotazu neodpovídá.
 */
export const scoreFields = (fields, tokens) => {
  if (!tokens.length) return { score: 0, positions: [] };

  let total = 0;
  const positions = new Set();

  for (const token of tokens) {
    let best = null;
    for (const field of fields) {
      if (!field.norm) continue;
      const hit = scoreToken(field.norm, token);
      if (!hit) continue;
      const weighted = hit.score * field.weight;
      if (!best || weighted > best.weighted) best = { weighted, hit, field };
    }
    if (!best) return null;
    total += best.weighted;
    if (best.field.highlight) best.hit.positions.forEach((p) => positions.add(p));
  }

  return { score: total, positions: [...positions].sort((a, b) => a - b) };
};

/** Pozice znaků → souvislé úseky `[start, end)` pro vykreslení `<mark>`. */
export const toRanges = (positions = []) => {
  const ranges = [];
  for (const pos of positions) {
    const last = ranges[ranges.length - 1];
    if (last && pos === last[1]) last[1] = pos + 1;
    else ranges.push([pos, pos + 1]);
  }
  return ranges;
};
