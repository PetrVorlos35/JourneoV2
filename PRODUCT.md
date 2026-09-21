# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Solo travelers and group trip organizers — often the same person in different moments. When planning solo, they want a personal hub: itinerary, packing list, documents in one place. When organizing for a group, they become coordinators: sharing trips, setting read-only views, tracking who has what.

Primary context: planning at home or a café before the trip, reviewing on mobile while traveling. Occasionally sharing a public link with friends who don't have an account.

## Product Purpose

Journeo is a premium travel planning app. It exists because trip planning is fragmented across spreadsheets, notes apps, and email threads. Journeo unifies the itinerary, packing list, and documents into one calm, beautiful space — and makes sharing effortless.

Success looks like: a user who opens Journeo instead of a spreadsheet, and shares a trip link instead of a screenshot.

## Positioning

Journeo's mechanism is consolidation with craft, not any single feature: itinerary, packing list, documents, budget/expense settlement, an interactive saved-places map, and frictionless sharing all live in one calm space, built with the attention to detail of something made for oneself first. A competitor could copy one of those pieces; the claim is that no fragmented stack of a splitting app, a map app, and a notes app feels this unhurried doing all of it together.

## Operating Context

Two recurring usage moments: heads-down planning at home or a café before a trip (building the itinerary, adding places to the map, inviting collaborators), and lighter on-the-go use while actually traveling (checking the map, logging an expense, pulling up a document, consulting the packing list) — mobile is the traveling-context device. Group trips involve collaborators with different access levels (owner, editor, read-only), and a public share link lets someone without a Journeo account view a trip. The product is bilingual (Czech/English) for its current user base.

## Capabilities and Constraints

Confirmed functionality: per-trip itinerary/day planning, packing lists, document/file storage, an interactive map (MapLibre, CARTO tiles, light/dark styles) for saving and browsing trip places, budget tracking with multi-person expense settlement ("Vyrovnání"), friends/collaborators with trip sharing, a public read-only share link per trip, cross-trip statistics, and an admin panel for privileged accounts. Auth is email/password or Google OAuth. Theme is light/dark/system, dark is primary. This is a responsive web app (React + Vite), not native iOS/Android — mobile support means mobile web, optimized per the dashboard's mobile-UX conventions (44px touch targets, bottom-sheet modals, safe-area insets).

## Brand Personality

Premium, calm, personal. Like a beautifully made notebook — not a booking engine.

Three words: **refined**, **unhurried**, **yours**.

Emotional goal: the user should feel in control, not overwhelmed. The app should feel like it was made with care — a product someone built for themselves first.

## Anti-references

- **TripAdvisor / Booking.com** — Dense, transactional, ad-saturated. The experience of being sold to, not helped.
- **Generic gray SaaS dashboards** — Forgettable, soulless, cookie-cutter. No sense of personality or craft.
- **Pinterest / influencer travel aesthetic** — Beige serifs, mood-board energy, style over substance.

## Design Principles

1. **Breathing room over density.** Every screen earns its whitespace. Don't pack features in; let the content breathe.
2. **Craft at every scale.** The small things matter: transitions, empty states, loading moments, error messages. Users notice the absence of rough edges more than any single feature.
3. **Personal, not corporate.** The app should feel like it was made by a person, not a product team. Warmth without being cute; confidence without being cold.
4. **Context-aware fidelity.** Desktop gets full richness: sidebars, multi-column layouts, hover states. Mobile gets focused simplicity: one task at a time, clear navigation, no compromise on legibility.
5. **Honest about state.** Read-only is read-only. Shared is shared. The interface never obscures what the user can and can't do.

## Evidence on Hand

Journeo is a real, personally-used product — the founder and a circle of friends plan and run actual trips in it (e.g. the "Surfíky" trip in the current dashboard). There are no testimonials, case studies, press mentions, or usage-scale metrics on hand; future work must not invent any.

## Accessibility & Inclusion

Target WCAG AA. Bilingual Czech/English (i18n already in place). Support for reduced motion via `prefers-reduced-motion`. Dark and light mode both supported — dark is the primary design register.
