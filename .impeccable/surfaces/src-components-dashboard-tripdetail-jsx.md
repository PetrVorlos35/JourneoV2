---
version: 1
slug: "src-components-dashboard-tripdetail-jsx"
primary_target: "src/components/dashboard/TripDetail.jsx"
related_targets: []
---

# Trip detail (přehled výletu)

Scope: /dashboard/trip/:id — Operate mode. Inherits the Journeo app world (Inter, #fbfbfd ground, gray-900 ink, blue-600 accent, light primary, dark supported via `dark:`).

Audience/job: owner or collaborator plans one day at a time at home; on the road opens the trip on mobile to see today's program and log an expense fast. Changes autosave (no manual save button). Viewer role is read-only and must say so.

## Direction contract

THESIS: The trip is a notebook — one day per page, flipped with arrows, swipe or the date strip; tools (Balení, Odkazy a poznámky, Mapa, Rozpočet) are divider tabs on the page's right edge. Refuses the old sidebar-of-days-plus-tool-strip where days and tools fought for one column.

OWN-WORLD: White page on the #fbfbfd desk, hairline gray-200 edges, no nested cards. Date strip of day chips (weekday, numeral, place). Divider tabs attached to the page edge with live status (8/12, 34 040 Kč); the active tab merges with the page. Plan text on faint ruled lines. Blue only for selection and primary action.

STORY: Open → today's (or first) day page. Read/edit place, title and plan in place; it saves itself. Flip days. Open a tab to pack, add links, view map, log spending; close returns to the day.

FIRST VIEWPORT: Desktop: back link, title row with save status + share/PDF; date strip full width; page (~80%) with day header, location, ruled plan, prev/next footer; tab rail on right edge. Mobile: compact title, date strip scrolled to today, day page, bottom bar Program · Balení · [+ výdaj] · Odkazy · Rozpočet; map via its own fullscreen.

FORM: Notebook day pages, position 5 of 7 on the ordered list, seed key a19edcf8.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
