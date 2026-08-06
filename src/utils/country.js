// ISO 3166-1 alpha-2 → flag emoji (regional indicator symbols).
export const countryFlag = (code) =>
  code && code.length === 2
    ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))
    : '🏳️';

export default countryFlag;
