---
version: 1
slug: "src-components-admin-adminhome-jsx"
primary_target: "src/components/admin/AdminHome.jsx"
related_targets: []
---

# Admin (dashboard/admin)

Scope: /dashboard/admin/* — Operate mode, inside the app shell (passport sidebar, mobile bar). Inherits DESIGN.md. Audience: the founder as operator: is the app growing, manage users, debug/support. Total expense sums are removed (mixed currencies are meaningless).

## Direction contract

THESIS: People first — a searchable list beside an always-open dossier of the selected person (profile, role, trips, friends, actions); trips work the same way. Refuses the old separate console with faded wide tables and a modal-per-row.

OWN-WORLD: Same white page on the #fbfbfd desk, hairline rows, blue-50 selected row, one filled blue action at most, danger actions in red text at the dossier foot. Growth chart: weekly grouped bars, blue (sign-ups) + amber-600 (trips), validated palette.

STORY: Overview tells if the app lives (this week, active users, 12-week chart, newest people). Users: search, click, everything about that person is right there; change role or delete with confirmation. Trips: same, with owner link and trash flag.

FIRST VIEWPORT: Title "Admin" + segmented Přehled · Uživatelé · Výlety. Users: left ~40% list (search, sort, rows), right dossier. Mobile: list, tap → full-width dossier with back.

FORM: Master-detail, position 4 of 7, seed key eaa9949c.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
