# Changelog

All notable changes to glacial are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] — 2026-05-04

UX winners from the v2.0 variant exploration (PR #2) land as production
components. The decisions were: comfortable density (no toggle), responsive
mini-rail → bottom-nav, split-view + drawer for list/detail, polished default
with opt-in hybrid aesthetic.

### Added — Tier 2 components
- `.glacial-rail` + `.glacial-rail-shell` + `.glacial-rail-item` — vertical
  60px icon rail on desktop with hover tooltips; transforms into a
  thumb-zone bottom nav with icons + labels at `<768px`. Supports
  `aria-current="page"` and `.is-active` for the selected item, with an
  optional accent glow in dark mode.
- `.glacial-drawer` + `.glacial-drawer-overlay` + `.glacial-drawer-header`
  + `.glacial-drawer-close` + `.glacial-drawer-body` — right-side panel on
  desktop, bottom sheet (with drag handle) on mobile. Focus trap, escape
  closes, overlay click closes, `[data-glacial-drawer-close]` attribute hook.
- `.glacial-split-view` + `.glacial-split-list` + `.glacial-split-detail`
  + `.glacial-split-row` + `.glacial-split-back` — master/detail layout.
  Two-column desktop; on `<768px` toggles `data-mobile-view` between
  `"list"` (default) and `"detail"` so only one pane shows at a time, with
  a back button to return to the list.

### Added — Aesthetic axis
- `<html data-aesthetic="hybrid">` — third axis alongside `data-theme` and
  `data-skin`. Keeps glass + aurora; borrows brutalist edges: tighter radii
  (3/6/10), 1px solid accent borders on glass, hard offset shadows in
  `--accent-bg`, optional monospace headings via `.glacial-h1` / `.glacial-h2`
  utility classes.
- Default (no attribute) keeps the polished v2.0 look unchanged.

### Added — JS helpers
- `window.glacialSetAesthetic(name | null)` — `null` reverts to polished.
  Persists via `glacial-aesthetic` cookie + URL param `?aesthetic=hybrid`.
- `window.glacialOpenDrawer(idOrEl)` / `window.glacialCloseDrawer(idOrEl?)` —
  programmatic drawer control with focus trap and previous-focus restore.
- `window.glacialPalette({ items, onSelect, placeholder, shortcut })` —
  Cmd+K command palette helper. Auto-binds `⌘K`/`Ctrl+K` (toggle),
  `↑↓` arrow nav, `Enter` to activate, `Esc` to close. Items support
  `{ id, label, icon, shortcut, section, onSelect }`. Returns
  `{ open, close, isOpen, setItems }`.
- `window.glacial.help()` now reports the active aesthetic.
- Boot banner now includes `aesthetic=…`.

### Added — Examples
- `examples/v2.1-tour.html` — single page demonstrating rail + drawer +
  Cmd+K palette + hybrid aesthetic toggle, with all 6 skins selectable.
  This is the canonical "all-Tier-2-things-working-together" reference.

### Decisions documented
- Density: comfortable is the only default. No toggle ships. The compact
  and spacious variants from `examples/ux/density.html` were not promoted.
- Navigation: mini-rail wins on desktop, bottom-nav wins on mobile —
  unified into a single responsive component (`.glacial-rail`).
- Layout: split-view is the desktop list→detail default; drawer is the
  mobile/quick-edit alternative; single-page stays the existing pattern
  for shareable URLs.
- Aesthetic: pure brutalism rejected (loses glacial DNA). Hybrid ships
  as opt-in only.

### Migration notes (from 2.0.x)
No breaking changes. All v2.0 classes/tokens unchanged. To adopt the new
components, see `MIGRATING.md` and `examples/v2.1-tour.html`.

## [2.0.0] — 2026-05-03

### Added — Tier 1 component library
- `.glacial-table` — responsive table with hover, mobile column-hide via `data-priority` (`1`/`2`/`3`)
- `.glacial-alert` — left-border colored bar over glass, four variants: `info` / `warn` / `success` / `error`
- `.glacial-empty-state` — centered icon + heading + caption + optional CTA
- `.glacial-metric` — large-value tile with monospace label
- `.glacial-breadcrumbs` — monospace separator-delimited trail with mobile middle-truncation
- `.glacial-filter-bar` + `.glacial-filter-pill` — labeled pill groups with keyboard navigation
- `.glacial-status-row` — icon + text + glow-dot status indicator with `[data-state]` variants
- `.glacial-skeleton` + `.glacial-skeleton-text` — pure-CSS shimmer placeholders for loading states

### Added — Skin system
- `<html data-skin="...">` mechanism for token-only brand variants
- `skins/default.css` — documentation skin (no-op, explains every token)
- `skins/warm-serif.css` — editorial / hospitality. Cream + forest green + serif headings.
- `skins/midnight-mono.css` — terminal / hacker tools. Pure black + neon green + monospace everywhere.
- `skins/lavender.css` — soft / contemplative. Pale lavender + dusty purple + twilight orbs.
- `skins/deep-navy.css` — finance / serious. Abyssal navy + sky cyan + deep-sea orbs.
- `skins/nord.css` — calm / engineering. Arctic frost palette, muted blues, no aurora.
- `skins/_template.css` — reference showing the required `data-skin × data-theme` matrix
- Aurora orb tokens: `--orb-1-color`, `--orb-2-color`, `--orb-3-color`

### Added — Decision guide
- `RECIPES.md` — page-type recipes, decision trees, anti-patterns, starter prompt, debug checklist, class index

### Added — Debug surface
- `<html data-glacial-loaded="2.0.0">` set before first paint
- Boot banner: `[glacial] v2.0.0 loaded · theme=X · skin=Y · aurora=on/off`
- `window.glacial.help()` returns `{version, theme, skin, classes, tokens}`

### Added — Tokens
- `--skeleton-shimmer` — shimmer color (per-skin override)
- `--glow-low`, `--glow-med`, `--glow-high` — explicit glow intensity tokens
- `--blur` — backdrop-filter strength (auto-reduced on mobile to `12px`, on coarse pointers to `8px`)
- `--orb-1-color`, `--orb-2-color`, `--orb-3-color`, `--orb-opacity` (existing)

### Added — Contracts and tooling
- Naming rubric in DESIGN.md: `.glacial-{name}` block, `.glacial-{name}-{variant}` modifier, `data-glacial-*` behavior hooks
- Skin contract: token overrides only; selector allow-list enforced by `scripts/lint-skin.sh`
- Token rename detection: `scripts/snapshot-tokens.sh` + `scripts/diff-tokens.sh` against `tokens.json`
- Versioning policy: MAJOR = rename/remove, MINOR = additive, PATCH = bugfix
- Deprecation policy: removed tokens get one MINOR cycle of deprecation comment before removal

### Added — Examples
- `examples/dashboard.html`, `list.html`, `detail.html`, `form.html`, `board.html` — page-type recipes
- `examples/mobile.html` — touch target audit + responsive showcase
- `examples/skins-preview.html` — default / warm-serif / ctrl side-by-side with live skin switcher
- All examples include a persistent skin+theme toggle (cookie-backed)
- URL params override cookies: `?skin=warm-serif&theme=dark`

### Changed
- Mobile blur policy: `--blur: 12px` at `<768px`, `8px` on coarse pointers
- README adoption prompt rewritten — 5 lines, includes verification step
- Cookie scope: `glacial-skin` is project-wide (not per-service-name); `{service}-theme` unchanged for backward compat

### Migration notes (from v1.x)
No breaking changes. v1 consumers can upgrade in place. See `MIGRATING.md`.

## [1.0.0] — 2026-04-14

### Added
- Initial release of glacial design system
- Glass morphism CSS tokens (light + dark theme)
- Aurora orb effects (dark mode only)
- Theme toggle via `glacialToggleTheme()`
- Home Assistant theme mapping (`ha-theme/glacial.yaml`)
- DESIGN.md spec
