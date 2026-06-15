# Changelog

All notable changes to glacial are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.0] — 2026-06-15

UI continuity: the generic mechanisms that make separate surfaces feel like one
product — a shared theme/skin pick that can ride across surfaces, one settings
affordance, and a shared app switcher. Fully additive — no token or class
removals, every new behavior is opt-in and off by default (MINOR).

### Added — Cross-surface config (all opt-in, off by default)
- **`GLACIAL_COOKIE_DOMAIN`** (`window` global or `<meta name="glacial-cookie-domain">`)
  — when set, glacial's cookies gain `;domain=<value>` so a theme/skin pick rides
  along to sibling subdomains. Unset ⇒ cookie string unchanged.
- **`GLACIAL_SHARED_THEME`** — truthy ⇒ writes a single `glacial-theme` cookie
  instead of the per-service `{service}-theme`. Reads honor both names
  (`readThemeCookie()` = shared, then legacy per-service), so an already-saved
  theme **migrates without a re-pick** and the OS listener won't auto-switch a
  migrated user.
- **`GLACIAL_DEFAULT_THEME`** (`'light'`/`'dark'`) — a durable default theme.
  `getTheme()` precedence is now URL `?theme=` > persisted cookie >
  `GLACIAL_DEFAULT_THEME` > OS preference. The OS-preference listener
  short-circuits when a default is set, so an OS light/dark toggle doesn't revert
  the forced default; a real user pick (cookie) still wins.

### Added — Cross-tab live sync
- Theme / skin / aesthetic changes post `{ theme, skin, aesthetic }` to a
  `BroadcastChannel('glacial')`; other **same-origin** tabs re-apply the
  attributes and re-emit `glacial:change`. Guarded for browsers without
  BroadcastChannel (no-op). This is live sync only — cross-surface persistence
  comes from the shared cookie on the next load.

### Added — Components
- **`glacial-settings`** (Tier 1) — a cog button + popover with a theme
  segmented control (light/dark/auto), a skin picker rendered as swatches of each
  built-in skin's own `[data-skin]` tokens, and an aesthetic toggle. Mount via
  `glacialMountSettings(targetSelector, opts?)`. Controls drive the existing
  `glacialToggleTheme` / `glacialSetSkin` / `glacialSetAesthetic` setters.
- **`glacial-app-switcher` + `glacial-tile`** (Tier 2) — a data-driven launcher.
  `glacialAppSwitcher({ services: [{ name, url, description, status?, group? }], target })`
  renders tiles with an optional status dot (`--green`/`--yellow`/`--red`).
- New `glacialMountSettings` and `glacialAppSwitcher` are exposed on the
  `window.glacial` debug object; all new classes are registered in `CLASSES[]`.
- `examples/v2.6-continuity.html` demonstrates the cog, swatches, and switcher
  (placeholder services only).

## [2.5.0] — 2026-06-11

Accessibility fix: primary-button text color is now a token. Additive — no
token removals, no breaking changes (MINOR: new public token per the
versioning policy, even though the change is a contrast bugfix).

### Added — Tokens & accessibility
- **`--btn-primary-text`** — text color on accent-filled surfaces
  (`.glacial-btn-primary`). Defaults to `#0a0a0a`: the hardcoded `#fff` only
  reached ~2.4:1 on the default teal `--accent` (`#00b8d4`), failing WCAG AA
  for normal text; dark text hits 8.3:1 (12.9:1 on the dark-theme `#00e5ff`).
  Skins now pick the AA-passing side per variant:
  - `lavender` — `#fff` in light (5.2:1 on `#7c5fa5`), `#0a0a0a` in dark (9.7:1)
  - `deep-navy` — `#fff` in light (11.1:1 on `#1a3a72`), `#0a0a0a` in dark (9.1:1)
  - `warm-serif` — `#fff` in light (13.3:1 on `#213500`), `#0a0a0a` in dark (9.9:1)
  - `nord` / `midnight-mono` — inherit the `#0a0a0a` default (4.9:1 / 4.75:1
    light, 9.9:1 / 14.8:1 dark)

### Fixed
- `.glacial-btn-primary` no longer hardcodes `color: #fff`; it reads
  `var(--btn-primary-text)` so every skin × theme combination meets WCAG AA
  (≥4.5:1). `skins/_template.css` and `skins/default.css` document the new
  contract entry.

## [2.4.0] — 2026-05-31

Tier 3: forms, overlays, and feedback components, plus a high-contrast
safeguard and CI. Additive — no token removals, no breaking changes.

### Added — Tokens & accessibility
- **Spacing scale** tokens (`--space-2xs` … `--space-3xl`, 4px base) and a
  **fluid type scale** (`--text-xs` … `--text-3xl`, `clamp()`-based). Skins and
  apps can now adjust density/scale by overriding tokens.
- **`prefers-contrast: more` safeguard** — remaps surface/border/text tokens to
  high-contrast values, kills `--blur`, and disables the aurora in dark mode.
  Pure token remap, so every component inherits it (DNA #5 intact).
- **`glacial:change` event** + `glacialOnThemeChange(cb)` — fires on theme /
  skin / aesthetic change so consumers stop polling or observing `<html>`.

### Added — Form components
- `.glacial-field` (+ `-label` / `-hint` / `-error`), `.glacial-input`,
  `.glacial-textarea`, `.glacial-select` (styled native), `.glacial-checkbox`,
  `.glacial-radio`, `.glacial-switch`. States via `:focus-visible` (accent ring
  + dark glow), `[disabled]`, `:checked`, and `[aria-invalid="true"]`. Native
  `input[type=date]` themed (no custom picker). `examples/form.html` migrated
  off the `ex-*` demo classes to the real components.

### Added — Overlay & interactive components
- `.glacial-modal` (+ overlay/header/title/close/body/footer) with shared focus
  trap, Esc / overlay-click / `[data-glacial-modal-close]` close, and
  `[data-glacial-modal-open]`. JS: `glacialOpenModal` / `glacialCloseModal`.
- `.glacial-toast` (+ region) via `glacialToast({ message, variant, timeout, action })`,
  announced through an `aria-live` region.
- `.glacial-tabs` / `-tab-list` / `-tab` / `-tab-panel`, auto-wired by
  `[data-glacial-tabs]` (roles, arrow/Home/End keys, `aria-selected`).
- `.glacial-dropdown` / `.glacial-menu` / `-menu-item`, auto-wired by
  `[data-glacial-menu]` (Esc / outside-click close, arrow-key navigation).
- `.glacial-tooltip` via `[data-glacial-tooltip]` (hover + focus-visible).
- `.glacial-accordion` (+ item/trigger/panel) on native `<details>` (zero-JS).
- `.glacial-progress` (+ bar), `.glacial-spinner` (reduced-motion gated),
  `.glacial-avatar` (+ group), `.glacial-pagination` (+ item).
- Drawer focus-trap refactored into a shared `trapFocus()` (reused by the modal).

### Added — Layout
- Container queries: `.glacial-rail-shell` and `.glacial-rail-content` are named
  containers (`glacial-shell` / `glacial-content`); a `.glacial-split-view`
  nested in the content area now collapses on its container width, not just the
  viewport. Viewport `@media` stays as the fallback.

### Added — Tooling & docs
- `.github/workflows/ci.yml` runs every gate on push/PR.
- `scripts/check-contract.mjs` (pure Node): CLASSES[] ⊆ CSS, every `var(--x)`
  declared, and no chromatic color literals in component bodies (DNA #5).
- New `CONTRIBUTING.md`; `examples/components.html` gallery for the Tier 3 set.

## [2.3.0] — 2026-05-29

Additive: a second navigation tier. Composes with the existing rail; no token
changes, no breaking changes. Unblocks control-pane's two-level nav.

### Added — Two-tier rail
- `.glacial-rail-secondary` — contextual, text-labeled sub-rail that pairs with
  the Tier 1 icon rail. Opt in with the `.has-secondary` shell modifier; without
  it the layout is the single-tier rail, unchanged. New classes:
  `.glacial-rail-secondary`, `.glacial-rail-secondary-title`,
  `.glacial-rail-secondary-item`.
  - Desktop: `60px 200px 1fr` grid. Sub-rail is a glass surface, sticky, and
    scrolls vertically when sections overflow. Title truncates with ellipsis;
    section labels wrap (never truncate a nav target).
  - Mobile (<768px): sub-rail becomes a sticky, scroll-snapping top strip; Tier 1
    stays the bottom nav. Strip drops `backdrop-filter` (mobile blur policy) and
    items meet the 44px touch-target minimum. Title hidden.
  - Two distinct landmarks (`aria-label="Primary"` / `"Project sections"`),
    `aria-current="page"` in both tiers. Explicit modifier chosen over `:has()`
    for older/embedded-webview compatibility.
- `examples/rail-dual.html` — dual-rail reference (real glacial classes), with a
  `.has-secondary` toggle and long title/label to demonstrate overflow.

### Added — Tooling
- `scripts/check-classes.sh` — asserts every `CLASSES[]` name in `glacial.js` has
  a matching `.<name>` selector in `glacial.css`.

## [2.2.0] — 2026-05-04

Documentation and CI tooling. No new components, no token changes — but the
scaffolding now exists to keep future versions honest.

### Added — Decision guide for agents
- `RECIPES.md` — TL;DR map (pick a recipe in 30 seconds), hello-glacial
  3-line snippet, starter prompt for new projects, "Which skin?" decision
  tree, six page recipes (dashboard / list / split-view / detail / form /
  board / tour) each with When-to-use, container, components, anti-patterns,
  copy-this link, and Why-this-layout rationale, decision trees for common
  forks (need a list? need a state? live data? list→detail nav?
  navigation pattern?), 12-item don't-do list distilled from surveyed
  consumer projects, skin catalog, full debug checklist, and a complete
  class index of every public `.glacial-*` class shipped to date.

### Added — Specification expansion
- `DESIGN.md` rewritten and expanded to canonical-spec status:
  - Versioning policy (MAJOR / MINOR / PATCH definitions, 1-MINOR-cycle
    deprecation window before MAJOR removal)
  - Naming rubric (`.glacial-{name}-{variant}` blocks, `data-state`
    for semantic states, `data-glacial-*` for behavior hooks, ARIA over
    `.is-state` over data attributes)
  - Skin contract (allow-list of selectors, required `data-skin × data-theme`
    matrix template, `SKIN-EXCEPTION:` marker for justified component-level
    overrides)
  - Glacial DNA Checklist (10 hard rules every Tier 1 + Tier 2 component
    must pass before merging)
  - Token catalog with one-line purpose per token (matches `tokens.json`)
  - Per-component spec for all 13 Tier 1 components and 4 Tier 2 components,
    including state matrices specifying which states ship, which are
    intentionally out of scope, and how to compose components (e.g. a
    table's empty state nests `.glacial-empty-state` inside `<tbody>`)
  - Reduced-motion contract (every animation gates on `prefers-reduced-motion`)
  - Accessibility coverage matrix
  - Decisions log expanded with all v2.0, v2.1, and v2.2 decisions

### Added — CI gates
- `scripts/snapshot-tokens.sh` — extracts every `--*` declaration from
  `glacial.css` to `tokens.json`. Supports `--check` mode for CI.
- `scripts/diff-tokens.sh` — fails CI if a token is added or removed
  without a version bump in the same range. Enforces semver: removals
  require MAJOR, additions require at least MINOR.
- `scripts/lint-skin.sh` — enforces the skin contract (selector allow-list).
  Recognizes `SKIN-EXCEPTION:` comment marker for justified exceptions
  (e.g. `warm-serif`'s serif-headings-only override).
- `tokens.json` — public token snapshot, machine-readable. Currently 39
  tokens declared. Lives under version control as the contract artifact.

### Changed — README
- 3-line "Hello, glacial" at the top
- Reading order declared explicitly (agent path vs human path)
- File table updated for v2.2.0 inventory
- Adoption prompt rewritten (5 lines, points at RECIPES.md and
  `glacial.help()` verification, references tagged vendor copy)
- Theming section documents all three axes (theme / skin / aesthetic)
  with their JS APIs and URL params

### Changed — `skins/warm-serif.css`
- Justification comment for the serif-headings rule reformatted to use
  the `SKIN-EXCEPTION:` marker. The rule itself is unchanged. This makes
  the lint script recognize the documented exception and warn instead of
  fail.

### Migration notes (from 2.1.x)
No breaking changes. No tokens or classes added or removed — `tokens.json`
diff is empty. All changes are docs and tooling. Adopt the new docs at
your own pace.

To enable the CI gates in your fork or downstream consumer, run any of:
```bash
./scripts/snapshot-tokens.sh --check
./scripts/diff-tokens.sh main..HEAD
./scripts/lint-skin.sh skins/*.css
```

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
- `examples/skins-preview.html` — built-in skins side-by-side with live skin switcher
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
