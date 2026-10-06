---
name: Journeo
description: A calm, personal travel notebook for planning and running trips, solo or together.
colors:
  accent-blue: "#2563eb"
  accent-blue-hover: "#3b82f6"
  accent-blue-night: "#60a5fa"
  desk: "#fbfbfd"
  page: "#ffffff"
  field: "#f9fafb"
  tab-recess: "#f1f1f4"
  ink: "#111827"
  ink-plan: "#1f2937"
  ink-soft: "#374151"
  muted-strong: "#4b5563"
  muted: "#6b7280"
  placeholder: "#9ca3af"
  hairline: "#e5e7eb"
  rule-soft: "#f3f4f6"
  night-desk: "#000000"
  night-page: "#1c1c1e"
  night-ink: "#f5f5f7"
  success: "#059669"
  danger: "#ef4444"
  readonly-wash: "#fffbeb"
  readonly-ink: "#92400e"
  editor-ink: "#6d28d9"
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
components:
  button-primary:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.page}"
    typography: "{typography.label}"
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

The trip notebook (trip detail) is the system's most literal expression and its newest surface: one day per page, a strip of day chips above it, divider tabs attached to the page's right edge, and the day's plan written on faint ruled lines. Inside the page nothing floats a second time. Sections are separated by lines, not by more cards. The wider app (dashboard, statistics, friends, settings) carries the same world in a slightly glassier dialect: translucent white cards with backdrop blur and 32px corners over the desk.

Light is the verified register: this build was designed and checked in light, and the user prefers it. Dark is fully supported through `dark:` class variants (black desk, #1c1c1e pages, #f5f5f7 ink, blue lifted to #60a5fa) and every new surface must ship both. PRODUCT.md records light as the primary register.

**Key Characteristics:**
- Near-white desk, pure-white pages, hairline gray edges.
- One accent: blue-600 for selection and the primary action only.
- Inter only in the product UI; bold tight titles, medium working text, tabular numbers.
- Generous rounding (12 / 16 / 28 / 32px), never sharp; dashboard buttons are rounded rectangles, not pills.
- Ambient, low-contrast shadows; a page never nests a floating card inside itself.
- Light and dark both shipped on every surface; light is the verified register.

## Colors

A cool, nearly colorless paper palette with a single blue voice and small semantic washes.

### Primary
- **Notebook Blue** (accent-blue): selected day chip, primary buttons (add expense, add item, new trip), active tab icon, sidebar active pill, caret in the plan, focus rings at 20 to 50% alpha. Hover lightens to **Bright Blue** (accent-blue-hover). In dark mode the accent becomes **Night Blue** (accent-blue-night) for text and icons; filled buttons stay blue-600.

### Neutral
- **Desk** (desk): app ground behind everything. In dark mode, **Night Desk** (night-desk).
- **Page White** (page): notebook page, day chips at rest, icon buttons, active tool tab. In dark mode, **Night Page** (night-page).
- **Field Gray** (field): resting fill of inputs and in-place edit hovers; inputs turn page-white on focus.
- **Tab Recess** (tab-recess): inactive divider tabs, which read as tucked behind the page.
- **Ink** (ink): titles and primary text. **Plan Ink** (ink-plan) for long-form day plans; **Soft Ink** (ink-soft) for icon-button glyphs.
- **Muted Strong** (muted-strong) for tab status lines and secondary labels that must pass AA; **Muted** (muted) for metadata, dates, captions; **Placeholder** (placeholder) for placeholders and inert icons only.
- **Hairline** (hairline): page, chip, input and tab edges (often at 80% alpha). **Soft Rule** (rule-soft): dividers inside a page (page footer, list rows). Dark mode uses white at 6 to 10% for both.
- **Night Ink** (night-ink): body text in dark mode.

### Semantic
- **Saved Green** (success): saved state check, "all packed", positive balances.
- **Alert Red** (danger): delete hovers, over-budget, save-failed retry.
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
- **Title** (700, 18px): dialog and modal headings, card titles.
- **Numeral** (700, 26px, 1.0, tabular): the date numeral in day chips; the same treatment scales up for budget totals.
- **Plan** (400, 16px, 2rem line height): the day's free-text plan, which sits exactly on the ruled lines.
- **Body** (500, 15px): list items, input values, location, empty states.
- **Label** (600, 13 to 14px): section labels in sentence case ("To pack · 8"), back link, button text (14px), save status.
- **Caption** (500, 12px): day-chip weekday and place, tab status lines, role chips (600).

### Named Rules
**The Sentence-Case Label Rule.** Section and field labels are 13px semibold muted text in sentence case, optionally followed by a dot-separated count. The app does not use 11px bold uppercase widely-tracked labels; they were removed across the dashboard, admin and public share view (exceptions: calendar weekday heads, language codes, PDF print styles, and the landing page's own marketing style).

**The Tabular Numbers Rule.** Any count, date numeral, percentage or amount uses tabular figures.

## Layout

The dashboard is a fixed 280px sidebar panel (desktop, md and up) beside a scrolling content column; on mobile a bottom tab bar and a slide-in drawer replace it. Content columns breathe: page padding is 20px on mobile and 40px on desktop (sm and up), with 24 to 36px top padding on pages.

The trip notebook stacks: back link and title row (save status and actions at the right), a full-width day strip, then the page (taking the remaining width) with the 176px tab rail attached to its right edge on large screens (lg and up). The page has a viewport-relative minimum height so the footer's previous/next links sit near the fold. Below lg the rail becomes a fixed bottom bar of five slots with the primary action raised in the middle, respecting the safe-area inset.

Touch targets are 44px minimum (52px for bottom-bar slots); text inputs are 16px on mobile to avoid zoom. The day strip scrolls horizontally with its edges fading only on the side that continues, and keeps the selected day centered.

## Elevation & Depth

Depth is ambient and layered, never structural. Surfaces separate from the desk through white-on-near-white, a hairline edge and a very soft shadow; nothing casts a hard or offset shadow. The dashboard additionally places two large, heavily blurred blue and purple glows behind the content as desk atmosphere; that layer is incumbent and lives only behind the layout, never on a page.

### Shadow Vocabulary
- **Page lift** (`0 1px 2px rgba(17,24,39,0.04), 0 12px 32px -16px rgba(17,24,39,0.12)`): the notebook page.
- **Card ambient** (`0 4px 24px rgba(0,0,0,0.04)`; dark `0 4px 24px rgba(0,0,0,0.15)`): glass cards across the app.
- **Tab merge** (`6px 4px 14px -8px rgba(17,24,39,0.16)`): the active divider tab, joining it to the page.
- **Blue action glow** (`0 6px 16px -8px rgba(37,99,235,0.7)`; raised mobile action `0 8px 20px -8px`): filled blue buttons and the selected day chip.
- **Overlay** (Tailwind shadow-2xl): dialogs, bottom sheets, the mobile drawer, over a black/20 scrim with medium backdrop blur.

### Named Rules
**The No Card-in-Card Rule.** Inside a page, sections are divided by a top hairline, not wrapped in another bordered or shadowed card. Embedded tools (for example the budget inside the trip) drop their card chrome and become ruled sections of the page.

## Shapes

Generously rounded rectangles everywhere. Controls (small icon buttons, tab corners, in-place edit fields) use 12px; buttons, inputs, day chips and list-level containers use 16px; the notebook page uses 28px; app cards, dialogs and the sidebar panel use 32px (dialogs become top-rounded bottom sheets on mobile). Fully round shapes in the dashboard are reserved for small status dots, role chips, progress tracks, avatars and circular close buttons; dashboard buttons are rounded rectangles. The marketing landing page is its own dialect and uses full-round CTAs. Divider tabs are rounded only on their outer (right) side so they read as attached to the page edge. Map pins are teardrops (round with one 6px corner), solid when visited and dashed-outline when wishlisted.

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
- **Sidebar (desktop):** a 32px-rounded translucent gray-50 panel; items are 16px-rounded rows with a blue-600 animated pill under the active item and white text on it.
- **Bottom bar (mobile):** white at 95% with blur and a top hairline; 11px semibold labels under 22px icons, active in blue; a raised 56px blue square for the primary action.
- **Back link:** 13px semibold muted text with an arrow, darkening to ink on hover.

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

### Don't:
- **Don't** nest a bordered or shadowed card inside the notebook page or another card.
- **Don't** use blue for decoration: headings, labels and resting borders stay ink and gray.
- **Don't** add 11px bold uppercase, widely tracked labels; labels are sentence-case 13px semibold.
- **Don't** use pill-shaped buttons inside the dashboard (full-round CTAs belong to the landing page), and don't use sharp corners anywhere.
- **Don't** use hard or offset shadows; depth stays ambient.
- **Don't** bring Caveat or any second family into the dashboard UI.
- **Don't** design or verify in only one theme.
