# Journeo design system — conventions

Journeo is a **dark-first travel-planning app**, built with **React 19 + Tailwind CSS v4**.
Components are real, compiled exports on `window.Journeo.*`. They ship pre-styled; your
job is realistic content and layout glue around them.

## Wrapping & setup (required)

Two things must be true for components to render correctly:

1. **Dark theme.** Journeo is dark-first. Put `class="dark"` on the root (`<html>` or the
   top app element). Tailwind's dark styles use `@custom-variant dark (&:where(.dark, .dark *))`,
   so without a `.dark` ancestor every `dark:` style is inert and components render in their
   lighter fallback.
2. **Provider context.** Several components read i18n and router context — `Navbar` and
   `NotFound` use `react-router` `<Link>`, and `DialogModal`, `Navbar`, `NotFound`,
   `LandingLanguageSwitcher`, `CharCount`-adjacent flows use `react-i18next` `t()`. Wrap the
   app in a router (e.g. `BrowserRouter`) and an initialized i18next instance. The bundle
   exports **`DSProvider`** (`window.Journeo.DSProvider`) which supplies a router + i18n for
   isolated previews; in a real app use your own `BrowserRouter` + i18next setup. Without
   these, those components throw or render raw translation keys.

## Styling idiom — Tailwind v4 utilities, dark-first

Style your own layout with **Tailwind utility classes**, matching Journeo's look:

| Concern | Vocabulary |
|---|---|
| Surfaces | near-black (`bg-black`, `bg-[#0a0a0a]`, `bg-[#1d1d1f]`), translucent white (`bg-white/5`, `bg-white/10`) |
| Brand accent | **amber** — `text-amber-400`, `bg-amber-500`, amber glows; blue for info/avatars |
| Rounding | generous — `rounded-2xl`, `rounded-3xl`, `rounded-full` |
| Glass / depth | `backdrop-blur-*`, subtle `border border-white/10`, `shadow-2xl` |
| Type | Inter (`--font-sans`); bold tight headings (`font-bold tracking-tight`), `tracking-widest uppercase` micro-labels, `tabular-nums` for counters |
| Dark variants | always pair light + `dark:` (`text-gray-900 dark:text-white`) under the `.dark` root |

**Important:** the shipped `_ds_bundle.css` is Journeo's *compiled* Tailwind subset — it
contains only the utilities the app already used. Prefer classes you can confirm exist in it;
for novel one-off layout, inline `style={{…}}` is safe and on-pattern (the components
themselves mix utilities with inline styles).

## Where the truth lives

- **`styles.css`** — the entry; `@import`s `_ds_bundle.css` (component styles) + tokens/fonts.
  Read it (and `_ds_bundle.css`) for the exact tokens and available utilities.
- **`components/<group>/<Name>/<Name>.prompt.md`** — per-component usage + props.
- **`components/<group>/<Name>/<Name>.d.ts`** — the prop contract.

## Idiomatic snippet

```jsx
const { SpotlightCard } = window.Journeo;

// inside a `.dark` root, with a router + i18n provider mounted
<div className="bg-[#0a0a0a] p-8 grid grid-cols-2 gap-4">
  <SpotlightCard className="p-6">
    <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Next trip</div>
    <h3 className="text-xl font-bold text-white">Kyoto, Japan</h3>
    <p className="text-white/60 text-sm mt-1">7 days · April</p>
  </SpotlightCard>
</div>
```
