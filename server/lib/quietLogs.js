// V produkci umlčí console.log/info/debug (warn/error zůstávají), pokud není
// zapnutý DEBUG=1. Musí to být úplně první import v index.js — ESM vyhodnocuje
// importy v pořadí, takže se override aplikuje i na logy, které běží při
// importu ostatních modulů (např. config/db.js).
if (process.env.NODE_ENV === 'production' && !process.env.DEBUG) {
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.debug = noop;
}
