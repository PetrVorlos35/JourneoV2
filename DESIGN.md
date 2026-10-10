---
name: Journeo
description: A calm, personal travel notebook for planning and running trips, solo or together.
colors:
  accent-blue: "#155dfc"
  accent-blue-hover: "#1447e6"
  accent-blue-night: "#51a2ff"
  desk: "#fbfbfd"
  page: "#ffffff"
  field: "#f9fafb"
  tab-recess: "#f1f1f4"
  ink: "#101828"
  ink-plan: "#1e2939"
  ink-soft: "#364153"
  muted-strong: "#4a5565"
  muted: "#6a7282"
  placeholder: "#6a7282"
  hairline: "#e5e7eb"
  rule-soft: "#f3f4f6"
  night-desk: "#000000"
  night-page: "#1c1c1e"
  night-ink: "#ffffff"
  night-sidebar: "#111113"
  active-wash: "#eff6ff"
  active-ink: "#1447e6"
  success: "#007a55"
  danger: "#e7000b"
  readonly-wash: "#fffbeb"
  readonly-ink: "#973c00"
  editor-ink: "#7008e7"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  subhead:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  numeral:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  plan:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "2rem"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.5
  control:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.375
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.35
  micro:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.25
rounded:
  control: "12px"
  soft: "16px"
  page: "28px"
  card: "32px"
  full: "9999px"
spacing:
  gap: "8px"
  page-x-mobile: "20px"
  page-x-desktop: "40px"
  touch: "44px"
  field-height: "48px"
  sidebar-width: "264px"
  bar-slot: "52px"
components:
  button-primary:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.page}"
    typography: "{typography.control}"
    rounded: "{rounded.soft}"
    padding: "0 20px"
    height: "{spacing.touch}"
  button-primary-hover:
    backgroundColor: "{colors.accent-blue-hover}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.page}"
    rounded: "{rounded.soft}"
    padding: "0 20px"
    height: "{spacing.touch}"
  icon-button:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.soft}"
    size: "{spacing.touch}"
  input-field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.soft}"
    padding: "0 16px"
    height: "{spacing.field-height}"
  notebook-page:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.page}"
    padding: "{spacing.page-x-desktop}"
  day-chip:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.soft}"
    padding: "10px 14px 12px"
  day-chip-selected:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.page}"
  tool-tab:
    backgroundColor: "{colors.tab-recess}"
    textColor: "{colors.muted-strong}"
    rounded: "0 12px 12px 0"
    padding: "14px 12px 14px 16px"
  tool-tab-active:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
  glass-card:
    backgroundColor: "rgba(255, 255, 255, 0.7)"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px 32px"
  sidebar:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    width: "{spacing.sidebar-width}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.muted-strong}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  nav-item-active:
    backgroundColor: "{colors.active-wash}"
    textColor: "{colors.active-ink}"
  passport:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.soft}"
    padding: "16px"
  next-trip-card:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.soft}"
    padding: "14px"
  bottom-bar-slot:
    textColor: "{colors.muted-strong}"
    typography: "{typography.micro}"
    rounded: "{rounded.control}"
    height: "{spacing.bar-slot}"
  bottom-bar-slot-active:
    textColor: "{colors.accent-blue}"
  chip-readonly:
    backgroundColor: "{colors.readonly-wash}"
    textColor: "{colors.readonly-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Journeo

## Overview

**Creative North Star: "The Travel Notebook on a Quiet Desk"**

Journeo is a white page lying on an almost-white desk. The desk (#fbfbfd) is the app ground; the work happens on pages and cards that sit a hair above it, edged by gray hairlines and the softest ambient shadow. One saturated voice, a confident blue, marks what is selected and what to do next; everything else is ink and grays. Type is Inter throughout: large, tight, bold titles over medium-weight 13 to 15px working text, with tabular numerals wherever counts and money appear.

The trip notebook (trip detail) is the system's most literal expression and its newest surface: one day per page, a strip of day chips above it, divider tabs attached to the page's right edge, and the day's plan written on faint ruled lines. Inside the page nothing floats a second time. Sections are separated by lines, not by more cards. The wider app (dashboard, statistics, friends, settings) carries the same world in a slightly glassier dialect: translucent white cards with backdrop blur and 32px corners over the desk. The app shell around it reads as a travel passport: a flush white sidebar whose top block is the traveler's identity, their counts (countries, trips, days) and the flags of countries they have visited, above plain navigation.

Light is the verified register: this build was designed and checked in light, and the user prefers it. Dark is fully supported through `dark:` class variants (black desk, #1c1c1e pages, #f5f5f7 ink, blue lifted to #60a5fa) and every new surface must ship both. PRODUCT.md records light as the primary register.

**Key Characteristics:**
- Near-white desk, pure-white pages, hairline gray edges.
- One accent: blue-600 for selection and the primary action only.
- Inter only in the product UI; bold tight titles, medium working text, tabular numbers.
- A flush passport sidebar on desktop; avatar, bottom sheet and a five-slot bottom bar on mobile.
- Generous rounding (12 / 16 / 28 / 32px), never sharp; dashboard buttons are rounded rectangles, not pills.
- Ambient, low-contrast shadows; a page never nests a floating card inside itself.
- Light and dark both shipped on every surface; light is the verified register.

## Design Tokens & Figma

The Figma library is the source of truth: https://www.figma.com/design/RVM2kVY4MrTRiC88nFPeyX/Journeo (pages: Getting Started, Foundations, components, Screens; Light/Dark and Desktop/Mobile modes).

- **Flow:** Figma variables → `design/tokens.json` (export) → `npm run tokens` → `src/styles/tokens.css`. Never edit `tokens.css` by hand.
- **Logo:** the compass rose `src/assets/Journeo_blacklogo.png` (light) / `Journeo_whitelogo.png` (dark), 28px tall next to an 18px bold wordmark; in Figma both images sit in the Logo component and switch via the `logo/show-on-*` variables.
- **Values:** primitives are the Tailwind v4 palette (oklch, converted to sRGB in Figma), so a token renders exactly like the utility it replaced. Hex values in this file's front matter are those sRGB conversions.
- **Use semantic classes, not light/dark pairs:** `bg-desk`, `bg-page`, `bg-field`, `bg-subtle`, `bg-accent`, `hover:bg-accent-hover`, `bg-active`, `bg-glass`, `bg-passport`, `bg-bar`, `bg-success-wash`, `bg-danger-wash`; `text-primary`, `text-secondary`, `text-muted`, `text-accent`, `text-active`, `text-success`, `text-danger`, `placeholder:text-placeholder`; `text-icon-*`; `border-default`, `border-subtle`, `border-glass`, `border-check`; overview tile tones via `var(--color-icon-tone-blue|violet|emerald|amber|red)`; `rounded-control|soft|page|card`; `shadow-page|card|tab|glow|popover|sheet|overlay|focus`; type `text-display … text-micro` plus overview `text-countdown`, `text-hero`, `text-card`, `text-small` (`text-plan-size` for the plan). Dark mode is handled by the token, so no `dark:` counterpart is needed.
- **Runtime variables** match Figma Dev Mode code syntax, e.g. `var(--color-bg-page)`, `var(--type-size-display)`, `var(--layout-page-padding)`.
- **Guards:** `npm run lint:design` flags light/dark pairs that have a token and known contrast failures; `npm run tokens:check` fails when `tokens.css` is stale.
- **Contrast:** every text token pair passes WCAG 2.2 AA in both themes (table on the Foundations page). Do not put `text-muted`, `text-placeholder` or `text-danger` on `bg-subtle`; use `text-secondary`.

## Colors

A cool, nearly colorless paper palette with a single blue voice and small semantic washes.

### Primary
- **Notebook Blue** (accent-blue): selected day chip, primary buttons (add expense, add item, new trip), active tab icon, active bottom-bar slot, caret in the plan, focus rings at 20 to 50% alpha. Hover darkens to **Deep Blue** (accent-blue-hover, blue-700) so white text keeps 4.5:1. In dark mode the accent becomes **Night Blue** (accent-blue-night) for text and icons; filled buttons stay blue-600.
- **Active Wash** (active-wash) with **Active Ink** (active-ink): the active navigation row in the sidebar and the passport sheet, plus the shortcut chip inside it. A tint, not a fill, so the sidebar's single filled blue control stays "+ Vytvořit výlet". In dark mode the wash is blue-500 at 10% and the ink blue-300.

### Neutral
- **Desk** (desk): app ground behind everything. In dark mode, **Night Desk** (night-desk).
- **Page White** (page): notebook page, day chips at rest, icon buttons, active tool tab. In dark mode, **Night Page** (night-page).
- **Field Gray** (field): resting fill of inputs and in-place edit hovers; inputs turn page-white on focus.
- **Tab Recess** (tab-recess): inactive divider tabs, which read as tucked behind the page.
- **Ink** (ink): titles and primary text. **Plan Ink** (ink-plan) for long-form day plans; **Soft Ink** (ink-soft) for icon-button glyphs.
- **Muted Strong** (muted-strong) for tab status lines and secondary labels that must pass AA; **Muted** (muted) for metadata, dates, captions; **Placeholder** (placeholder) for placeholders and inert icons only.
- **Hairline** (hairline): page, chip, input and tab edges (often at 80% alpha). **Soft Rule** (rule-soft): dividers inside a page (page footer, list rows). Dark mode uses white at 6 to 10% for both.
- **Night Ink** (night-ink): body text in dark mode.
- **Night Sidebar** (night-sidebar): the desktop sidebar ground in dark mode, a step above the black desk.

### Semantic
- **Saved Green** (success): saved state check, "all packed", positive balances. Text uses emerald-700 (`text-success`) for AA contrast; icons and fills may stay emerald-600.
- **Alert Red** (danger): delete hovers, over-budget, save-failed retry. Text uses red-600 (`text-danger`); icons and borders may use red-500.
- **Read-only Amber** (readonly-wash with readonly-ink): the read-only banner and viewer role chip. **Editor Violet** (editor-ink on a violet-50 wash) marks the editor role chip.

### Named Rules
**The One Blue Rule.** Blue means "selected" or "do this". It never decorates: no blue headings, no blue section labels, no blue borders at rest. A screen has one filled blue action in view (on mobile notebook, the raised add-expense button).

**The Two Registers Rule.** Every color assignment ships with its `dark:` counterpart in the same class string. A surface verified only in one register is unfinished.

## Typography

**Display Font:** Inter (with -apple-system, Segoe UI, Roboto, Helvetica, Arial)
**Body Font:** Inter
**Annotation Font:** Caveat 600, only as handwritten annotation on the landing page, auth screen and PDF export; never in the dashboard UI.

**Character:** One family doing all the work, distinguished by weight and size rather than by pairing. Titles are bold and tightly tracked; working text sits at medium weight so the page feels written-on, not printed-at.

### Hierarchy
- **Display** (700, 48px desktop / 26px mobile, 1.1, -0.025em): the trip title at the top of the notebook; balanced wrapping.
- **Headline** (700, 36px desktop / 28 to 30px mobile, 1.25): page h1s across the dashboard, the day title, tool titles on the page (Balení, Rozpočet).
- **Subhead** (700, 20px, -0.025em): section and card headings on dashboard pages (statistics, budget, trip overview, create-trip steps).
- **Title** (700, 18px): dialog and modal headings, card titles.
- **Numeral** (700, 26px, 1.0, tabular): the date numeral in day chips, the passport counts (Země / Výlety / Dny) and the next-trip countdown; the same treatment scales up for budget totals.
- **Plan** (400, 16px, 2rem line height): the day's free-text plan, which sits exactly on the ruled lines.
- **Body** (500, 15px): list items, input values, location, empty states.
- **Control** (600, 14px): navigation items, row and list titles, account-menu rows, button text, the next-trip title. 500 and 700 at 14px also appear for secondary rows and the passport name.
- **Label** (600, 13px): section labels in sentence case ("To pack · 8"), back link, search trigger, save status.
- **Caption** (500, 12px): day-chip weekday and place, tab status lines, passport count labels and bio, role chips (600).
- **Micro** (600 or 500, 11px, sentence case): bottom-bar labels, keyboard-shortcut chips, the version badge, unit text under a numeral ("dní do odjezdu"), small avatar initials. Never uppercase, never widely tracked.

### Named Rules
**The Sentence-Case Label Rule.** Section and field labels are 13px semibold muted text in sentence case, optionally followed by a dot-separated count. The app does not use 11px bold uppercase widely-tracked labels; they were removed across the dashboard, admin and public share view; the 11px Micro size exists only for bar labels, shortcut chips and units, in sentence case (exceptions: calendar weekday heads, language codes, PDF print styles, and the landing page's own marketing style).

**The Tabular Numbers Rule.** Any count, date numeral, percentage or amount uses tabular figures.

## Layout

On desktop (md and up) the dashboard is a flush 264px sidebar beside a scrolling content column, capped at 1400px and centered, with 16 / 32 / 40px padding (mobile / sm / md). The sidebar is not a floating panel: it runs full height on a white ground (night sidebar in dark) with a single hairline right border. Top to bottom it holds the logo row (logo, wordmark, version badge, notification bell at the right), the passport block, the filled "+ Vytvořit výlet" button and the ⌘K search trigger, the navigation list (Přehled, Výlety, Mapa, Výdaje, a soft-rule divider, then Statistiky, Přátelé and Admin), and, pinned at the bottom, the next-trip card, which is hidden on the overview because the overview's main card already shows that trip. Account actions, the theme toggle and notifications all live in the sidebar; there are no floating top-right actions on desktop. On the global map the sidebar overlays the map, which runs edge to edge beneath it.

On mobile (below md) the sidebar becomes three pieces. A sticky glass top bar carries the logo and wordmark at the left and search, bell and the user's avatar at the right, each a 44px target; the avatar replaces the hamburger and opens the passport. The fullscreen map hides the top bar, so it repeats the avatar as a 44px white button in its own control row. The passport opens as a bottom sheet (top-rounded 28px, grabber, 44px round close button, up to 90% of the viewport) holding the passport block, the next-trip card, the secondary destinations (Statistiky, Přátelé, Nastavení, Admin), the theme toggle under a sentence-case "Vzhled" label, and logout in a footer above the safe-area inset. A fixed full-width bottom bar gives Přehled, Výlety, a raised "+ Výlet", Mapa and Výdaje; on the fullscreen map it drops the create action and shows four slots, because a round plus over a map reads as "add a place".

The trip notebook stacks: back link and title row (save status and actions at the right), a full-width day strip, then the page (taking the remaining width) with the 176px tab rail attached to its right edge on large screens (lg and up). The page has a viewport-relative minimum height so the footer's previous/next links sit near the fold. Below lg the rail becomes a fixed bottom bar of five slots with the primary action raised in the middle, respecting the safe-area inset. It is the same bar as the app's mobile bottom bar (white at 95%, top hairline, 52px slots, 11px labels, raised 56px blue square), so navigation has one grammar everywhere.

Touch targets are 44px minimum (52px for bottom-bar slots); text inputs are 16px on mobile to avoid zoom. The day strip scrolls horizontally with its edges fading only on the side that continues, and keeps the selected day centered.

## Elevation & Depth

Depth is ambient and layered, never structural. The desktop sidebar casts no shadow at all; a hairline is its only edge. Surfaces separate from the desk through white-on-near-white, a hairline edge and a very soft shadow; nothing casts a hard or offset shadow. The dashboard additionally places two large, heavily blurred blue and purple glows behind the content as desk atmosphere; that layer is incumbent and lives only behind the layout, never on a page.

### Shadow Vocabulary
- **Page lift** (`0 1px 2px rgba(17,24,39,0.04), 0 12px 32px -16px rgba(17,24,39,0.12)`): the notebook page.
- **Card ambient** (`0 4px 24px rgba(0,0,0,0.04)`; dark `0 4px 24px rgba(0,0,0,0.15)`): glass cards across the app.
- **Tab merge** (`6px 4px 14px -8px rgba(17,24,39,0.16)`): the active divider tab, joining it to the page.
- **Blue action glow** (`0 6px 16px -8px rgba(37,99,235,0.7)`; raised mobile action `0 8px 20px -8px`): filled blue buttons and the selected day chip.
- **Popover** (`0 12px 32px -12px rgba(17,24,39,0.25)`): the account disclosure that drops below the passport block.
- **Sheet lift** (`0 -8px 40px -12px rgba(0,0,0,0.35)`): the mobile passport sheet, cast upward over a black/30 scrim with light backdrop blur.
- **Overlay** (Tailwind shadow-2xl): dialogs and other bottom sheets, over a black/20 scrim with medium backdrop blur.

### Named Rules
**The No Card-in-Card Rule.** Inside a page, sections are divided by a top hairline, not wrapped in another bordered or shadowed card. Embedded tools (for example the budget inside the trip) drop their card chrome and become ruled sections of the page.

## Shapes

Generously rounded rectangles everywhere. Controls (small icon buttons, tab corners, in-place edit fields) use 12px; buttons, inputs, day chips and list-level containers use 16px; the notebook page uses 28px; app cards and dialogs use 32px (dialogs become top-rounded bottom sheets on mobile; the passport sheet's top corners are 28px). The app shell itself has no corners: the desktop sidebar is a flush full-height column separated by a hairline right border. Inside it, navigation rows, the create button, the search trigger and the account-menu rows use 12px, and the passport block and next-trip card use 16px. The passport's stats are set off from its identity row by a dashed perforation rule, the one dashed line in the shell. Fully round shapes in the dashboard are reserved for small status dots, role chips, progress tracks, avatars, the sheet grabber and circular close buttons; dashboard buttons are rounded rectangles. The marketing landing page is its own dialect and uses full-round CTAs. Divider tabs are rounded only on their outer (right) side so they read as attached to the page edge. Map pins are teardrops (round with one 6px corner), solid when visited and dashed-outline when wishlisted.

## Components

### Buttons
Firm, quiet, and touchable.
- **Shape:** gently rounded (16px), 44px tall.
- **Primary:** blue-600 fill, white 14px semibold text, 20px horizontal padding, blue action glow; hover lightens to blue-500, press scales to 95%.
- **Ink:** gray-900 fill with white text (white with gray-900 text in dark), used for Share in the trip header.
- **Icon button:** 44px square, white with hairline edge, soft-ink glyph; hover fills field gray.
- **Disabled:** gray-100 fill, placeholder text, no glow.
- **Focus:** 2px blue ring at 40 to 60% alpha.

### Chips
- **Role chip:** full-round, 12px semibold, amber wash for read-only, violet wash for editor, with a 12px icon.
- **Day chip:** see Signature Components.

### Cards / Containers
- **Corner Style:** 32px (app cards), 28px (notebook page).
- **Background:** glass cards are white at 70% with strong backdrop blur over the desk; the notebook page is opaque white (night page in dark).
- **Shadow Strategy:** card ambient or page lift (see Elevation).
- **Border:** white/50 hairline on glass, gray-200 at 80% on the page; white/10 in dark.
- **Internal Padding:** 20 to 32px on cards; 20px / 40px horizontal on the page.

### Inputs / Fields
- **Style:** field-gray fill, gray-200 edge, 16px corners, 48px tall, 15px medium text. The older glass input is white/40 with 20px by 16px padding.
- **Focus:** fill turns white, edge to blue-500 at 40%, plus a 2px blue ring at 20%.
- **In-place edit:** titles and plans edit where they are read: transparent until hover (field gray), with a soft blue ring on focus. No save buttons; changes autosave and the header shows Saving / Saved / Retry.

### Navigation
- **Sidebar (desktop):** flush 264px white column with a hairline right border (see Layout). Items are 12px-rounded rows (10px by 12px padding) with a 19px icon and 14px semibold label in muted-strong; hover adds a gray-100 wash and ink text. The active item sits on an active-wash pill with active-ink text and a 2.5-weight icon; the pill glides between rows with a spring (instant under reduced motion). Hovering a row reveals its one-letter shortcut in an 11px chip at the right. A soft-rule divider separates the everyday destinations from Statistiky, Přátelé and Admin.
- **Create and search:** the full-width blue "+ Vytvořit výlet" (44px tall, 12px corners, blue action glow, N chip on hover) is the sidebar's only filled control; below it a 40px gray-100 search trigger with a 13px label and a visible ⌘K chip.
- **Top bar (mobile):** sticky glass bar, logo and wordmark left; search, bell and avatar right, each 44px. The avatar opens the passport sheet.
- **Bottom bar (mobile):** full width, white at 95% with blur and a top hairline, above the safe-area inset. Slots are 52px tall with 22px icons over 11px semibold labels; inactive muted-strong, active accent-blue with a heavier icon. The center slot is a raised 56px blue square with 16px corners, the raised blue action glow, a plus and a blue-700 "Výlet" label. The trip detail's tool bar uses the identical grammar.
- **Back link:** 13px semibold muted text with an arrow, darkening to ink on hover.

### Passport (signature)
The traveler's identity as the head of the shell. A 16px-rounded block on field gray at 70% with a hairline edge: avatar, name (14px bold), bio or "Cestovatel" (12px muted), and an up-down chevron; then a dashed perforation rule; then three columns of 26px tabular numerals with 12px labels underneath (Země, Výlety, Dny; an em dash when a count is unavailable); then up to eight flag "stamps" of visited countries in one line. On desktop the whole block is a button that opens the account disclosure (theme toggle, Nastavení, red Odhlásit se) as a popover beneath it; while open or on settings its edge darkens. On mobile the same block heads the passport sheet.

### Next-Trip Card
A 16px-rounded hairline card led by the countdown: a 26px tabular numeral over an 11px unit line ("18 / dní do odjezdu", or "3 / den z 7" during a trip), then the trip title in 14px semibold (15px in the sheet), clamped to two lines. Hover adds a field-gray wash. The ongoing trip wins over the nearest upcoming one.

### Divider Tabs (signature)
The trip's tools live as tabs attached to the right edge of the page. Inactive tabs are recessed (tab-recess fill, gray-600 text, 12px right corners, inset 12px from the page); hovering slides them halfway out. The active tab extends to the page edge, turns page-white, gains the tab-merge shadow and a blue icon, and shows a live tabular status line (8/12, 34 040 Kč).

### Day Strip and Day Page (signature)
Day chips (92 to 160px wide) carry a 12px weekday, a 26px tabular numeral and a 12px place; the selected day is blue with white text, today gets a small blue dot and label. The day page has the headline-size day title, a "Day n of N · date" line, a location field with a blue pin, the plan on ruled lines (7% ink every 2rem, scrolling with the text), and a footer with previous/next day links separated by a soft rule.

## Do's and Don'ts

### Do:
- **Do** set every new surface on the desk (#fbfbfd) with white pages and hairline edges, and ship its `dark:` variants in the same class strings.
- **Do** keep blue-600 for selection and the primary action; one filled blue action in view.
- **Do** use Inter at 700 with tight tracking for titles and 500 to 600 at 12 to 15px for working text; tabular figures for every number.
- **Do** use 16px corners for buttons, inputs and chips, 28 to 32px for pages, cards and dialogs.
- **Do** separate sections inside a page with a top hairline, as the embedded budget does.
- **Do** edit in place and autosave, with a visible save status, instead of adding save buttons.
- **Do** keep touch targets at 44px or more and respect safe-area insets on fixed bars and sheets.
- **Do** mark the active destination with the active-wash pill and active-ink text; keep filled blue for the one create action.
- **Do** give every mobile bottom bar the same grammar: full width, top hairline, 52px slots, 11px labels, one raised blue center action.

### Don't:
- **Don't** nest a bordered or shadowed card inside the notebook page or another card.
- **Don't** use blue for decoration: headings, labels and resting borders stay ink and gray.
- **Don't** add 11px bold uppercase, widely tracked labels; labels are sentence-case 13px semibold.
- **Don't** use pill-shaped buttons inside the dashboard (full-round CTAs belong to the landing page), and don't use sharp corners anywhere.
- **Don't** use hard or offset shadows; depth stays ambient.
- **Don't** float the app shell as a rounded card or add floating top-right action clusters; the sidebar is a flush column with a hairline edge.
- **Don't** bring Caveat or any second family into the dashboard UI.
- **Don't** design or verify in only one theme.
