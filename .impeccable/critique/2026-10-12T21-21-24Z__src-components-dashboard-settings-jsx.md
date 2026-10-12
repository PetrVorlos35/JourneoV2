---
target: Settings page
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/petrvorel35/JourneoV2/src/components/dashboard/Settings.jsx"
target_fingerprint: "sha256:7f7d1ecf8e49ace5a6905a0041da6dadd664e347a02a851532732cf5d023760f"
target_path: /Users/petrvorel35/JourneoV2/src/components/dashboard/Settings.jsx
timestamp: 2026-10-12T21-21-24Z
slug: src-components-dashboard-settings-jsx
---
Method: dual-agent (A: design review · B: detector + browser)

# Settings critique — 22/40 (Acceptable)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 2 | Amber pulse save; theme/lang save silently; clear-data shows success on failure |
| 2 | Real world | 3 | Mostly plain Czech; "(Bio)", "Nebezpečná zóna" |
| 3 | Control/freedom | 2 | No discard, no unsaved-changes guard |
| 4 | Consistency | 1 | 3 save models; uppercase tracked labels, card-in-card, decorative blue |
| 5 | Error prevention | 3 | Typed confirmations; clear-data scope unclear |
| 6 | Recognition | 3 | Avatar icons unlabeled |
| 7 | Efficiency | 1 | ~4 screens, no section nav; Settings missing from desktop nav |
| 8 | Minimalism | 2 | 6 equal cards with badge + redundant subtitle |
| 9 | Error recovery | 2 | Password error not at field; generic profile-save toast |
| 10 | Help | 3 | Great IBAN/delete copy; currency convert unexplained |

Specificity: generic SaaS settings skinned in Journeo colors; doesn't echo the passport identity it edits.
Detector: static clean; live 8 contrast fails (IBAN hint 2.6:1 L317, unselected tiles 4.4:1, danger copy 3.5:1 L587/602, delete btn 3.8:1 L607), nested card L322.

Priority issues:
- [P1] Clear-data success toast fires regardless of outcome (Settings.jsx:129-130, DashboardHome.jsx:190) — harden
- [P1] Three save models (button+amber pulse / instant / modal) — autosave with status — shape
- [P1] IA: one long stack; invite link in profile form; IBAN mixed with identity; password always expanded; page ends in red — regroup Profil / Vyrovnání / Předvolby / Účet a zabezpečení, section index desktop, drill-in list mobile — shape
- [P2] DS violations + 8 contrast fails (badges, uppercase lang switcher, 24px h2, hardcoded grays/reds) — polish
- [P2] Tiles lack radiogroup/aria-checked; unnamed avatars; password rules not announced; pulse ignores reduced motion — audit

Personas: Alex (no nav entry/anchors, currency modal), Sam (unnamed avatars, 11px gray counters, h2>div), Casey (40px copy btn, far save, full-width red buttons at thumb end).
Questions: edit profile in passport? prefs as 3 quiet rows? drop "Smazat všechna data"?
