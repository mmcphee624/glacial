# Changelog

All notable changes to glacial are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
