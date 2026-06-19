// Changelog data — newest release first.
// Each entry's `key` maps to translation keys under `changelog.releases.<key>`
// in the locale files (cs/en). Use an underscore in the key (not a dot),
// because i18next treats "." as a nesting separator.
//
// To ship a new version:
//   1. Bump APP_VERSION in ./version.js (and package.json).
//   2. Prepend a new entry here.
//   3. Add the matching `changelog.releases.<key>` block to both locale files.
export const CHANGELOG = [
  {
    version: '1.0',
    date: '2026-06-19',
    key: 'v1_0',
  },
];
