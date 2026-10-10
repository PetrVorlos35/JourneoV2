// Design lint: keeps class names aligned with the Journeo design tokens (design/tokens.json).
// Flags raw light/dark Tailwind pairs that have a semantic token, and patterns that fail WCAG AA.
// Usage: npm run lint:design
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// [light class, dark class, token utility]
const PAIRS = [
  ['bg-emerald-50', 'bg-emerald-500/10', 'bg-success-wash'],
  ['bg-red-50', 'bg-red-500/10', 'bg-danger-wash'],
  ['border-gray-300', 'border-white/20', 'border-check'],
  ['text-emerald-700', 'text-emerald-400', 'text-success'],
  ['bg-white', 'bg-[#1C1C1E]', 'bg-page'],
  ['bg-[#fbfbfd]', 'bg-black', 'bg-desk'],
  ['bg-gray-50', 'bg-white/5', 'bg-field'],
  ['bg-gray-100', 'bg-white/10', 'bg-subtle'],
  ['bg-blue-50', 'bg-blue-500/10', 'bg-active'],
  ['bg-gray-900', 'bg-white', 'bg-ink'],
  ['text-gray-900', 'text-white', 'text-primary'],
  ['text-gray-800', 'text-gray-100', 'text-plan'],
  ['text-gray-700', 'text-gray-300', 'text-soft'],
  ['text-gray-600', 'text-gray-300', 'text-secondary'],
  ['text-gray-500', 'text-gray-400', 'text-muted'],
  ['text-blue-600', 'text-blue-400', 'text-accent'],
  ['text-blue-700', 'text-blue-400', 'text-active'],
  ['text-emerald-600', 'text-emerald-400', 'text-success'],
  ['text-red-500', 'text-red-400', 'text-danger'],
  ['border-gray-200', 'border-white/10', 'border-default'],
  ['border-gray-100', 'border-white/10', 'border-subtle'],
];

// Classes that fail contrast in their usual role.
const A11Y = [
  [/(^|\s)hover:bg-blue-500(\s|$)/, 'hover on a blue button lightens to 3.7:1 with white text; use hover:bg-accent-hover'],
  [/(^|\s)(placeholder-gray-400|placeholder:text-gray-400)(\s|$)/, 'placeholder gray-400 is 2.5:1; use placeholder:text-placeholder'],
  [/(^|\s)bg-blue-600(?![\s\S]*\bdark:bg-)(\s|$)/, 'use bg-accent (same color, tracked by the design system)'],
];

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?)$/.test(name)) files.push(p);
  }
};
walk(join(root, 'src'));

const STRING_RE = /(["'`])((?:(?!\1)[^\\\n]|\\.)*)\1/g;
const problems = [];
for (const file of files) {
  if (readFileSync(file, 'utf8').includes('design-lint-ignore-file')) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const [, , str] of line.matchAll(STRING_RE)) {
      const tokens = str.split(/\s+/);
      const set = new Set(tokens);
      for (const tok of tokens) {
        const parts = tok.split(':');
        const base = parts.pop();
        if (parts.includes('dark')) continue;
        const prefix = parts.length ? parts.join(':') + ':' : '';
        for (const [light, dark, token] of PAIRS) {
          if (base === light && (set.has(`dark:${prefix}${dark}`) || set.has(`${prefix}dark:${dark}`))) {
            problems.push(`${relative(root, file)}:${i + 1}  ${prefix}${light} + dark:${prefix}${dark} → ${prefix}${token}`);
          }
        }
      }
      for (const [re, msg] of A11Y) if (re.test(str)) problems.push(`${relative(root, file)}:${i + 1}  ${msg}`);
    }
  });
}

if (problems.length) {
  console.log(problems.join('\n'));
  console.log(`\n${problems.length} design-token issue(s). Tokens: design/tokens.json · Figma: https://www.figma.com/design/RVM2kVY4MrTRiC88nFPeyX/Journeo`);
  process.exit(1);
}
console.log(`Design lint passed (${files.length} files).`);
