# Glacial Design System

Token spec, contracts, component specifications. The canonical reference. Agents should read [`RECIPES.md`](./RECIPES.md) first for "how do I build X"; this file is the "what is X actually" spec.

```
Reading order
─────────────
Agent path:  README → RECIPES.md → examples → DESIGN.md (you are here)
Human path:  README → examples → DESIGN.md → RECIPES.md (optional)
```

Current version: **`2.2.0`** — see [`VERSION`](./VERSION) and [`CHANGELOG.md`](./CHANGELOG.md).

---

## Aesthetic Direction

Glass Hybrid — frosted glass morphism that adapts between two distinct moods.

- **Light mode:** Frosted glass cards on a soft teal-tinted gradient. Clean, professional, approachable. Subtle radial gradient washes add depth without competing with content.
- **Dark mode:** Aurora glass. Near-black background with slow-moving colored orbs (purple, blue, teal). Transparent cards with backdrop blur. Neon status colors pop against the dark glass.
- **Decoration level:** Intentional — glass + orbs provide depth without clutter.
- **Mood:** Technical but alive. A control panel that feels good to look at, not just functional.

Six skins extend this aesthetic to other moods (warm-serif, midnight-mono, lavender, deep-navy, nord). The skin contract guarantees they all share the same component shape — only tokens change.

---

## Versioning Policy

Glacial follows [Semantic Versioning](https://semver.org/).

| Bump | When |
|------|------|
| **MAJOR** | Token rename, class rename, removed selector, breaking JS API change |
| **MINOR** | New token, new component, new skin, new JS helper |
| **PATCH** | Bugfix, comment, doc-only change, internal refactor |

**Deprecation policy.** When a token or class is removed:
1. The removal happens in a MAJOR bump (e.g. v3.0).
2. The PRECEDING MINOR release marks the item with a `/* @deprecated since vX.Y */` comment in `glacial.css`. Consumers get one full MINOR cycle to migrate before the next MAJOR removes the item.
3. `MIGRATING.md` documents the mapping (`old-token` → `new-token`) for the MAJOR release.

Token contracts are enforced by CI:
- `scripts/snapshot-tokens.sh` writes the public token list to `tokens.json`
- `scripts/diff-tokens.sh` fails CI if a token rename happens without a version bump
- `scripts/lint-skin.sh` fails CI if a skin file violates the skin contract

---

## Naming Rubric

Locked before any new component lands. Every public class follows one of these patterns:

| Pattern | Example | Use |
|---------|---------|-----|
| `.glacial-{name}` | `.glacial-metric` | Block (a complete component) |
| `.glacial-{name}-{variant}` | `.glacial-alert-warn` | Modifier on a block |
| `.glacial-{name}-{element}` | `.glacial-alert-title` | Child element of a block |
| `.glacial-{child-name}` | `.glacial-filter-pill` | Child block (when child has its own identity inside a parent — e.g. a pill within a filter-bar) |

### State preference

When marking state, prefer in this order:
1. Native pseudo-classes — `:hover`, `:focus-visible`, `:active`, `[disabled]`, `:checked`
2. ARIA attributes — `[aria-pressed="true"]`, `[aria-current="page"]`, `[aria-selected="true"]`
3. `[data-state="..."]` — for semantic states the platform doesn't model (e.g. `data-state="stale"`, `data-state="loading"` on `.glacial-status-row`)
4. `.is-{state}` class — fallback when none of the above fit

Rationale: pseudo-classes need no JS, ARIA carries accessibility meaning automatically, `data-state` and `.is-` are last resorts.

### Behavior hooks

JavaScript-driven behavior uses `data-glacial-*` attributes:

| Attribute | Purpose |
|-----------|---------|
| `data-glacial-loaded="<version>"` | Set by `glacial.js` on `<html>` to confirm load |
| `data-glacial-drawer-close="<id>"` | Declarative drawer-close hook on any clickable element |
| `data-glacial-skin` | Auto-wires a `<select>` element to the skin picker (used in examples) |

App code that hooks into glacial should also use the `data-glacial-*` namespace to keep the contract clear.

---

## Skin Contract

Skins live in `skins/*.css` and are loaded as one extra `<link>` after `glacial.css`. Selection is via `<html data-skin="...">`.

### Allowed selectors

A skin file MAY contain only these selector forms (plus comments and `@import`):

```css
:root                                              /* root token defaults */
[data-theme="dark"]                                /* manual dark theme */
[data-skin="<name>"]                               /* light variant of this skin */
[data-skin="<name>"][data-theme="dark"]            /* manual dark variant */
@media (prefers-color-scheme: dark) {              /* OS dark fallback */
  [data-skin="<name>"]:not([data-theme="light"]) {
    /* OS-dark overrides */
  }
}
```

### Required matrix

Every skin MUST ship all three of:
1. Light variant block: `[data-skin="<name>"] { ... }`
2. Manual-dark variant block: `[data-skin="<name>"][data-theme="dark"] { ... }`
3. OS-dark fallback block: `@media (prefers-color-scheme: dark) { [data-skin="<name>"]:not([data-theme="light"]) { ... } }`

This guarantees the `data-skin × data-theme` matrix has no gaps — manual-dark, OS-dark-with-no-manual-choice, and OS-dark-but-user-forced-light are all defined.

Use [`skins/_template.css`](./skins/_template.css) as the starting point.

### Override scope

Skins MAY override:
- All public token values (`--accent`, `--bg`, `--font-body`, `--orb-1-color`, `--blur`, etc.)
- Any token from `tokens.json`

Skins MUST NOT:
- Define new selectors targeting `.glacial-*` class internals
- Define bare element selectors (`h1`, `body`, etc.) without the `data-skin` scope
- Define `@keyframes` or animations
- Import other CSS files that violate these rules

### Documented exception

If a skin genuinely needs to override a class internal (the canonical case is `warm-serif` swapping headings to serif but keeping body sans), it MUST:
1. Add a comment block above the rule starting with `SKIN-EXCEPTION:` and a one-paragraph justification.
2. The lint script (`scripts/lint-skin.sh`) detects this marker and warns instead of failing.

Example (from `skins/warm-serif.css`):

```css
/* SKIN-EXCEPTION: serif headings only.
 * Headings get the serif; body stays sans for readability. --font-body
 * would replace ALL text with serif, which is too heavy for long body
 * copy. We need a serif for h1/h2/h3/h4 + .glacial-empty-state-title only.
 * The skin contract lint warns but doesn't fail because of this header. */
[data-skin="warm-serif"] h1,
[data-skin="warm-serif"] h2,
[data-skin="warm-serif"] h3,
[data-skin="warm-serif"] h4,
[data-skin="warm-serif"] .glacial-empty-state-title {
  font-family: 'Libre Baskerville', Georgia, serif;
}
```

---

## Glacial DNA Checklist

Every Tier 1 and Tier 2 component MUST pass these 10 rules before merging. They preserve the visual identity that distinguishes glacial from generic AI-slop dashboards.

1. **Glass surface** or transparent on a glass parent. No solid-fill backgrounds.
2. **Labels in monospace** — uppercase, letter-spaced, using `--font-mono`.
3. **Accent glow on focus/active in dark mode** — `--accent` shadow at 30-40% opacity.
4. **No drop shadows in dark mode** — dark uses borders + blur only. (Hybrid aesthetic gets hard offset shadows in `--accent-bg`, which is different.)
5. **Tokens only** — no hex literals, no rgba literals in component CSS. Every color references a token.
6. **Survives the aurora test** — looks intentional in dark mode against animated orbs.
7. **Survives the warm-serif test** — works correctly when fonts swap to serif and bg goes cream.
8. **No icon-in-colored-circle pattern** — banned AI-slop tell.
9. **No purple/violet accent fallbacks** — banned palette (orbs are an exception, but only inside `.glacial-aurora`).
10. **No 3-column feature grid layout** — banned composition; use asymmetric layouts (3-col metrics + 2-col content + full-width table).

---

## Typography

Stacks (overridable per-skin via `--font-body` / `--font-mono`):

```css
--font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'SF Mono', Menlo, Consolas, monospace;
```

System fonts by default — zero loading latency, native feel. Skins like `warm-serif` and `midnight-mono` swap these to opinionated stacks.

### Type scale

| Role | Size | Weight | Family | Notes |
|------|------|--------|--------|-------|
| Page title (`.ex-h1`) | 24-28px | 700 | body | Main page heading |
| Section header (`.ex-h2`) | 16-18px | 700 | body | Major section |
| Section title (`.ex-h3`) | 10-12px | 700 | mono | Uppercase, letter-spacing 1.5px |
| Body | 13px | 400 | body | Default |
| Labels / nav | 11px | 600 | mono | Uppercase, letter-spacing 0.5px |
| Column headers / `.glacial-metric-label` | 10px | 700 | mono | Uppercase, letter-spacing 1.5px |
| Badges / `.glacial-filter-pill` | 9-11px | 700 | mono | Uppercase, letter-spacing 0.5px |
| Logo | 13px | 700 | mono | Letter-spacing 1px |

Hybrid aesthetic adds opt-in `.glacial-h1` and `.glacial-h2` utility classes that force monospace + uppercase + letter-spaced styling on the page title and section headers.

---

## Token Catalog

Public tokens (snapshot in `tokens.json`). Skins may override these freely.

### Surface tokens
| Token | Purpose |
|-------|---------|
| `--bg` | Page background |
| `--bg-card` | Glass card surface (translucent) |
| `--bg-card-hover` | Glass card hover state |
| `--bg-header` | Header surface (slightly different blur) |
| `--bg-input` | Input field surface |

### Border tokens
| Token | Purpose |
|-------|---------|
| `--border` | Outer translucent border |
| `--border-card` | Card border (accent-tinted in light, neutral in dark) |
| `--border-hover` | Card hover border |

### Text tokens
| Token | Purpose |
|-------|---------|
| `--text` | Body text |
| `--text-strong` | Headings, primary content |
| `--text-secondary` | Labels, captions |
| `--text-muted` | Meta info |
| `--text-faint` | Placeholder, dividers |

### Accent (the signature brand color)
| Token | Purpose |
|-------|---------|
| `--accent` | Primary brand color (teal in default; swap per skin) |
| `--accent-bg` | Accent at low opacity for backgrounds |
| `--accent-border` | Accent at medium opacity for borders |

### Status (semantic colors — consistent across themes, values shift for dark readability)
| Token | Semantics |
|-------|-----------|
| `--green` / `--green-bg` | Success, healthy, completed |
| `--yellow` / `--yellow-bg` | Warning, intake, pending, stale |
| `--red` / `--red-bg` | Error, failed, critical |
| `--blue` / `--blue-bg` | Review, informational |

### Aurora orbs
| Token | Purpose |
|-------|---------|
| `--orb-1-color` | First orb (default purple) |
| `--orb-2-color` | Second orb (default blue) |
| `--orb-3-color` | Third orb (default teal) |
| `--orb-opacity` | Master opacity multiplier (0 in light, 1 in dark by default; skins MAY set 0 to disable) |

### Effects
| Token | Purpose |
|-------|---------|
| `--shadow` | Box-shadow value (`none` in dark) |
| `--blur` | Backdrop-filter strength (auto-reduced on mobile) |
| `--skeleton-shimmer` | Skeleton loader shimmer color |
| `--glow-low` / `--glow-med` / `--glow-high` | Box-shadow glow intensities for dark-mode dots |

### Radii
| Token | Default | Use |
|-------|---------|-----|
| `--radius-sm` | 4px | Badges, pills, small UI |
| `--radius` | 8px | Cards, inputs, buttons |
| `--radius-lg` | 12px | Modals, drawers, large surfaces |

Hybrid aesthetic tightens these to 3 / 6 / 10. `midnight-mono` tightens to 2 / 4 / 6. `lavender` loosens to 6 / 10 / 16. `deep-navy` tightens to 3 / 6 / 10.

### Typography
| Token | Default |
|-------|---------|
| `--font-body` | system-ui sans-serif stack |
| `--font-mono` | SF Mono, Menlo, Consolas |

---

## Spacing & Layout

- **Base unit:** 4px
- **Density:** Comfortable (the only default — see [decisions log](#decisions-log))
- **Scale:** 4, 8, 12, 16, 20, 24, 32, 48px
- **Card padding:** 12px
- **Card gap:** 8px
- **Container padding:** 20px (12px on mobile)
- **Header height:** 48px

### Layout constraints

| Page type | Max width |
|-----------|-----------|
| Form / detail | 600-700px |
| List / index | 900-1100px |
| Dashboard | 1280px |
| Board / kanban | 1200px |
| Tour (with rail) | full page |

### Responsive breakpoints

```css
@media (max-width: 1024px)  /* tablet — hide data-priority="3" columns */
@media (max-width: 768px)   /* phone — hide data-priority="2" columns; --blur reduces to 12px */
@media (max-width: 540px)   /* small phone — breadcrumbs middle-truncate */
@media (pointer: coarse)    /* touch primary — Cmd+K hint hides; --blur further reduces */
```

### Mobile blur policy (auto-applied)

```css
@media (max-width: 767px)               { :root { --blur: 12px; } }
@media (pointer: coarse) and
       (max-width: 540px)               { :root { --blur: 8px; } }
```

Five stacked `.glacial-glass` cards on iOS Safari at full 20px blur drop below 30 FPS during scroll — this policy keeps mobile smooth.

---

## Glass Effect

The defining visual element. Every Tier 1 surface (cards, headers, inputs) uses this pattern:

```css
background: var(--bg-card);
backdrop-filter: blur(var(--blur));
-webkit-backdrop-filter: blur(var(--blur));
border: 1px solid var(--border-card);
border-radius: var(--radius);
```

Headers get a slightly different treatment:

```css
background: var(--bg-header);
backdrop-filter: blur(var(--blur));
border-bottom: 1px solid var(--border);
```

### Stacked glass rule

At most **2 levels of nested `.glacial-glass`**. Beyond that, child surfaces use `--bg-card-hover` opaque (no nested blur). Compounding `backdrop-filter` on iOS Safari is expensive.

---

## Aurora Effects (Dark Mode Only)

Animated background orbs that create a living aurora effect. CSS classes (`.glacial-aurora .orb-{1,2,3}`) are styled in `glacial.css`; the DOM is injected by `glacial.js` (skipped when `prefers-reduced-motion: reduce`).

```
Three orbs:
- orb-1 (600×600, --orb-1-color, opacity 0.15 × --orb-opacity, top-left, 80s drift)
- orb-2 (500×500, --orb-2-color, opacity 0.10 × --orb-opacity, bottom-right, 60s drift)
- orb-3 (400×400, --orb-3-color, opacity 0.08 × --orb-opacity, mid-left, 70s drift)
```

Skins recolor or disable orbs via `--orb-1-color` / `--orb-2-color` / `--orb-3-color` / `--orb-opacity`. `warm-serif` and `nord` set `--orb-opacity: 0` (orbs disabled). `midnight-mono` and `lavender` swap to thematic palettes (greens/cyan/lime; purples/magenta).

---

## Component Specifications — Tier 1

Every Tier 1 component below has a state matrix specifying which states ship and which are intentionally out of scope.

### `.glacial-glass` / `.glacial-glass-header`

| State | Behavior |
|-------|----------|
| Default | Glass surface as defined above |
| All other states | Inherit from child component (these are surfaces, not interactive) |

### `.glacial-table`

```html
<table class="glacial-table">
  <thead>
    <tr>
      <th data-priority="1">Name</th>      <!-- always visible -->
      <th data-priority="2">Body</th>      <!-- hides <768px -->
      <th data-priority="3">VIN</th>       <!-- hides <1024px -->
      <th data-priority="2" class="num">Price</th>   <!-- right-align -->
    </tr>
  </thead>
  <tbody>
    <tr>...</tr>
  </tbody>
</table>
```

| State | Behavior |
|-------|----------|
| Default | Sticky header on scroll, 1px row dividers |
| Hover | `--bg-card-hover` background on row |
| Focus-within | 2px accent outline on focused row |
| Loading | Pair with `.glacial-skeleton` rows inside `<tbody>` |
| Empty | Replace `<tbody>` with `.glacial-empty-state` wrapped in a single full-width row |
| Error | Pair with `.glacial-alert.glacial-alert-error` above the table |
| Stale | App-level: render a yellow "Last updated 14 minutes ago" caption below the table |
| Disabled | Out of scope — tables don't have a disabled state |

### `.glacial-alert` (variants: `info` / `warn` / `success` / `error`)

```html
<div class="glacial-alert glacial-alert-warn">
  <svg class="glacial-alert-icon">...</svg>
  <div class="glacial-alert-body">
    <div class="glacial-alert-title">Disk usage at 78%</div>
    Cleanup of /var/log recommended within 7 days.
  </div>
  <button class="glacial-alert-dismiss" aria-label="Dismiss">×</button>
</div>
```

| State | Behavior |
|-------|----------|
| Default (info/warn/success/error) | Left-border colored bar + tinted background using `--{color}-bg` |
| Hover | Inherits — alerts are not interactive surfaces |
| Dismiss button | `:hover` darkens, `:focus-visible` shows accent outline |
| All other states | Out of scope |

### `.glacial-empty-state`

```html
<div class="glacial-empty-state">
  <svg class="glacial-empty-state-icon">...</svg>
  <h3 class="glacial-empty-state-title">No listings match</h3>
  <p class="glacial-empty-state-caption">Try widening the year range.</p>
  <button class="glacial-btn glacial-btn-secondary">Clear filters</button>
</div>
```

| State | Behavior |
|-------|----------|
| Default | Centered icon + title + caption + optional CTA |
| Error variant (`.glacial-empty-state-error`) | Icon goes red |
| Dark mode | Icon gets accent glow (`--glow-low`) |
| All other states | Out of scope (this IS a state) |

### `.glacial-metric`

```html
<div class="glacial-metric">
  <span class="glacial-metric-label">Active users</span>
  <span class="glacial-metric-value">1,284</span>
  <span class="glacial-metric-delta glacial-metric-delta-up">▲ 12.4% · 24h</span>
</div>
```

| State | Behavior |
|-------|----------|
| Default | Mono uppercase label + tabular-nums value + delta indicator |
| Hover | Border color shifts to `--border-hover` |
| Loading (`[data-state="loading"]`) | Replace value with `<span class="glacial-skeleton glacial-skeleton-text">` |
| Empty (`[data-state="empty"]`) | Value goes faint, render `—` |
| Error | App-level: wrap with `.glacial-alert` or render value with `.glacial-metric-delta-down` |
| Stale | App-level: append `· stale 3h ago` to the delta line |
| Delta variants | `-up` (green), `-down` (red), `-flat` (muted). Glow in dark mode. |
| Disabled | Out of scope |

### `.glacial-breadcrumbs`

```html
<nav aria-label="Breadcrumb" class="glacial-breadcrumbs">
  <a href="/">Home</a>
  <span class="glacial-breadcrumbs-sep">/</span>
  <a href="/listings">Listings</a>
  <span class="glacial-breadcrumbs-sep">/</span>
  <span class="glacial-breadcrumbs-current">2019 Mazda MX-5</span>
</nav>
```

| State | Behavior |
|-------|----------|
| Default | Mono uppercase trail with `/` separators |
| Hover (links) | `--accent-bg` background, `--text-strong` color |
| Focus-visible (links) | Accent outline |
| Current page | `.glacial-breadcrumbs-current` — no link, stronger color |
| Mobile (<540px) | Middle-truncate via `.glacial-breadcrumbs-trunc` (only first + last visible) |
| Disabled / loading / error | Out of scope |

### `.glacial-filter-bar` + `.glacial-filter-pill`

```html
<div class="glacial-filter-bar">
  <div>
    <span class="glacial-filter-bar-label">Status</span>
    <div class="glacial-filter-bar-group" role="group" data-multi="false">
      <button class="glacial-filter-pill" aria-pressed="true">All <span class="glacial-filter-pill-count">218</span></button>
      <button class="glacial-filter-pill">Active <span class="glacial-filter-pill-count">184</span></button>
    </div>
  </div>
</div>
```

| State | Behavior |
|-------|----------|
| Default | Outline pill with monospace label |
| Hover | `--bg-card-hover` background, `--text-strong` color |
| Active (`aria-pressed="true"` or `.is-active`) | `--accent` text, `--accent-bg` background, `--accent-border` |
| Focus-visible | Accent outline |
| Disabled | 0.5 opacity, `cursor: not-allowed`, no hover effect |
| Mobile (<540px) | Group becomes horizontal scroll-snap |
| Keyboard model | Arrow keys navigate within group, Space/Enter toggles, ARIA `role="group"` on bar |

### `.glacial-status-row`

```html
<div class="glacial-status-row" data-state="warn">
  <svg class="glacial-status-row-icon">...</svg>
  <span class="glacial-status-row-name">cdn-edge-04</span>
  <span class="glacial-status-row-meta">elevated latency</span>
  <span class="glacial-status-row-dot" aria-label="warning"></span>
</div>
```

| State | `data-state` | Dot color | Glow (dark) |
|-------|--------------|-----------|-------------|
| Healthy (default) | `healthy` (or unset) | `--green` | `--glow-med` green |
| Active | `active` | `--accent` | `--glow-med` accent |
| Warning | `warn` | `--yellow` | `--glow-low` yellow |
| Error | `error` | `--red` | `--glow-high` red |
| Stale | `stale` | `--yellow` | none (intentionally muted) |
| Loading | `loading` | `--text-muted` | none |
| Empty | `empty` | transparent + dashed border | none |

| Other state | Behavior |
|-------------|----------|
| Hover | `--bg-card-hover` background |
| Min height 44px (touch target) | Always |

### `.glacial-skeleton` + `.glacial-skeleton-text`

```html
<span class="glacial-skeleton glacial-skeleton-text" style="width:60%; height:24px;"></span>
```

| State | Behavior |
|-------|----------|
| Default | Pure-CSS shimmer, `transform: translateX()` on a pseudo-element gradient |
| Animation delay | 200ms — avoids flash on instant loads |
| Reduced-motion | Static `--bg-card-hover` block, no animation |
| Sized via inline style or wrapping element | Match the shape of incoming content |

### `.glacial-badge` (variants: `green` / `yellow` / `red` / `blue` / `accent`)

| State | Behavior |
|-------|----------|
| Default | Mono uppercase, 9px, semantic color on matching `-bg` |
| All other states | Out of scope (badges are passive labels) |

### `.glacial-btn` (variants: `primary` / `secondary`)

| State | Behavior |
|-------|----------|
| Default | Rounded, 13px weight 600, primary = accent fill, secondary = transparent + accent text |
| Hover (primary) | `filter: brightness(1.1)` |
| Hover (secondary) | `--accent-bg` background |
| Focus-visible | Native browser outline + accent (Tier 3 work: explicit `:focus-visible` ring) |
| Active | Native press depression |
| Disabled | App-level: add `disabled` attribute, native styling applies |

### `.glacial-nav` + `.glacial-toggle`

These are top-of-page nav (top bar pattern). For the responsive rail/bottom-nav, use `.glacial-rail` (Tier 2).

| State (`.glacial-nav a`) | Behavior |
|---|---|
| Default | Mono uppercase 11px, secondary color |
| Hover | `--accent-bg`, strong color |
| Active (`.active` class) | `--accent` text, `--accent-bg`, `--accent-border` |

| State (`.glacial-toggle`) | Behavior |
|---|---|
| Default | Transparent button with border |
| Hover | `--accent-bg`, `--accent-border` |

---

## Component Specifications — Tier 2

### `.glacial-rail` — responsive rail / bottom-nav

```html
<div class="glacial-rail-shell">
  <aside class="glacial-rail" aria-label="Primary navigation">
    <div class="glacial-rail-brand">G</div>
    <a href="#" class="glacial-rail-item is-active" aria-current="page" aria-label="Dashboard">
      <svg class="glacial-rail-item-icon">...</svg>
      <span class="glacial-rail-item-label">Home</span>
      <span class="glacial-rail-item-tip">Dashboard</span>
    </a>
    ...more items...
    <span class="glacial-rail-spacer"></span>
  </aside>
  <main class="glacial-rail-content">...page content...</main>
</div>
```

| Breakpoint | Layout |
|-----------|--------|
| ≥768px | 60px vertical rail on the left. Tooltips on hover (`.glacial-rail-item-tip`). Labels hidden. |
| <768px | Bottom nav. Icons + small labels (`.glacial-rail-item-label` becomes visible). Brand and spacer hidden. Touch targets 56×48px. |

| State (`.glacial-rail-item`) | Behavior |
|---|---|
| Default | Transparent, `--text-secondary` color |
| Hover | `--bg-card-hover` background, `--text-strong` color |
| Active (`.is-active` or `aria-current="page"`) | `--accent-bg` background, `--accent` color |
| Active in dark mode | `--glow-low` accent shadow |
| Focus-visible | 2px accent outline |
| Tooltip on touch device | Hidden (`@media (hover: none)`) |

### `.glacial-drawer` — right panel / bottom sheet

```html
<div class="glacial-drawer-overlay"></div>
<aside class="glacial-drawer" id="my-drawer" role="dialog" aria-modal="true" aria-label="Listing detail">
  <header class="glacial-drawer-header">
    <h2 class="glacial-drawer-title">2018 Honda Civic</h2>
    <button class="glacial-drawer-close" data-glacial-drawer-close="my-drawer" aria-label="Close">×</button>
  </header>
  <div class="glacial-drawer-body">
    ...content...
  </div>
</aside>
```

```js
glacialOpenDrawer('my-drawer');     // by id
glacialCloseDrawer('my-drawer');    // by id
glacialCloseDrawer();               // closes topmost
```

| Breakpoint | Layout |
|-----------|--------|
| ≥541px | Slides from right, 480px wide max-100vw, full height |
| <541px | Slides from bottom (bottom sheet), 92vh tall, drag-handle pseudo-element at top |

| State | Behavior |
|-------|----------|
| Default | `data-open="false"` — translated off-screen, `pointer-events: none` |
| Open (`data-open="true"`) | Slides in over a 200ms ease-out. Overlay fades 200ms. |
| Focus | Trapped inside drawer while open; previous focus restored on close |
| Esc key | Closes topmost drawer |
| Overlay click | Closes topmost drawer |
| `[data-glacial-drawer-close]` button | Declarative close hook — value is the drawer id |
| Reduced-motion | Transitions disabled |

### `.glacial-split-view` — master / detail

```html
<div class="glacial-split-view" id="my-split">
  <aside class="glacial-split-list">
    <header class="glacial-split-list-header">
      <h2 class="glacial-split-list-title">Listings</h2>
      <span class="glacial-split-list-meta">8 active</span>
    </header>
    <a class="glacial-split-row is-selected" aria-current="true">
      <span class="glacial-split-row-title">2018 Civic</span>
      <span class="glacial-split-row-meta"><span>Sedan</span><span class="num">$14,200</span></span>
    </a>
    ...more rows...
  </aside>
  <section class="glacial-split-detail">
    <button class="glacial-split-back" onclick="...">← Back</button>
    ...detail content...
  </section>
</div>
```

| Breakpoint | Layout |
|-----------|--------|
| ≥768px | Two columns: 360px list + flex detail |
| <768px | One column at a time. `[data-mobile-view="list"]` (default) shows list; `="detail"` shows detail. App code toggles on row click; back button toggles back. |

| State | Behavior |
|-------|----------|
| Default | List visible, detail visible (desktop) or hidden (mobile) |
| Selected row (`.is-selected` or `aria-current="true"`) | `--accent-bg` background, 2px accent left border |
| Hover row | `--bg-card-hover` |
| Focus-visible row | 2px accent outline |
| Empty detail | Use `.glacial-split-empty` for "Select an item" prompt |
| Mobile back button | `.glacial-split-back` — only visible on mobile, toggles parent `data-mobile-view` |

### `glacialPalette({ items, ... })` — Cmd+K

DOM is JS-injected. Don't hand-write `.glacial-palette-*` markup; call the helper.

```js
glacialPalette({
  placeholder: 'Type a command or jump...',
  shortcut: true,                       // auto-bind Cmd+K / Ctrl+K (default)
  items: [
    { id: 'home',     label: 'Go to Dashboard', section: 'Navigate', icon: '⌂', shortcut: 'G D', onSelect: () => location.href = '/' },
    { id: 'theme',    label: 'Toggle theme',    section: 'Actions',  shortcut: '⌥T', onSelect: glacialToggleTheme }
  ]
});
```

Returns `{ open, close, isOpen, setItems }`.

| State | Behavior |
|-------|----------|
| Closed (default) | Overlay invisible, `pointer-events: none` |
| Open | Overlay fades in, input auto-focuses, items render grouped by section |
| Filtered (input has text) | Items filter by label substring; first match auto-selected |
| Empty filter result | "No matches" message |
| ↑↓ keys | Navigate selection (auto-scrolls into view) |
| Enter | Activate selected item's `onSelect`, close palette |
| Esc | Close without activating |
| Cmd+K / Ctrl+K | Toggle (open if closed, close if open) — auto-bound unless `{ shortcut: false }` |
| Overlay click | Close |

---

## Motion

- **Approach:** Minimal-functional + aurora atmosphere
- **Card hover:** `transition: all 0.15s` (background, border, transform)
- **Theme transition:** `transition: background-color 0.3s, color 0.3s`
- **Aurora orbs:** 60-80s `ease-in-out infinite` (the only expressive animation)
- **Drawer / palette:** 200ms `ease-out`
- **Skeleton shimmer:** 1500ms `infinite`, animation-delay 200ms (avoids flash on fast loads)
- **Easing:** `ease-in-out` for orbs, `ease` or `ease-out` for UI

### Reduced-motion contract

Every animation in glacial respects `@media (prefers-reduced-motion: reduce)`:

- Aurora orbs: `glacial.js` skips DOM injection entirely
- Skeleton shimmer: pure CSS `@media (prefers-reduced-motion: no-preference)` gate; reduced-motion sees a static block
- Drawer + palette: transitions disabled
- Theme transition: kept (color shifts aren't motion in the same sense)

---

## Accessibility

| Concern | Coverage |
|---------|----------|
| **Keyboard nav** | All interactive elements have `:focus-visible` rings. Filter pills navigate with arrow keys. Drawer + palette trap focus. Cmd+K opens, Esc closes. |
| **Touch targets** | 44×44px minimum on rail, status-row, drawer-close. Bottom-nav rail items are 56×48px. |
| **Color contrast** | WCAG AA verified for default skin (text on bg, accent on bg). Skin authors are responsible for verifying contrast on their palette. The lavender skin's dusty `#7c5fa5` accent on white = 4.6:1 (AA). |
| **Reduced motion** | Honored — see contract above |
| **ARIA** | `aria-current="page"` on rail/breadcrumb active items. `aria-pressed` on filter pills. `role="dialog" aria-modal="true"` on drawers. `role="group"` on filter-bar groups. `aria-label` on icon-only items. |
| **Semantic HTML** | `<nav>` for breadcrumbs and rail. `<aside>` for drawer and split-list. `<dialog>`-style behavior on drawer (with focus trap). |

---

## HA Integration

Home Assistant uses a dedicated theme file (`themes/glacial.yaml`) loaded via `!include_dir_merge_named themes`. The theme maps Glacial tokens to HA's CSS custom properties for both light and dark modes.

### card-mod glass presets

For full glass effect on HA cards, use card-mod (already installed via HACS):

```yaml
# Frosted glass card
card_mod:
  style: |
    ha-card {
      background: rgba(255,255,255,0.06) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(255,255,255,0.06) !important;
      border-radius: 8px !important;
    }
```

```yaml
# Accent-bordered card
card_mod:
  style: |
    ha-card {
      background: rgba(255,255,255,0.06) !important;
      backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(0,229,255,0.25) !important;
      border-radius: 8px !important;
    }
```

HA's theme system doesn't support animated backgrounds or `backdrop-filter` natively. These card-mod snippets add glass effects to individual cards. Full aurora orbs require custom dashboard panels or the standalone glacial-served dashboard.

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-14 | Glass Hybrid direction chosen | Unifies Scotty/CTRL teal app style with Aurora Glass dashboard effects |
| 2026-04-14 | System fonts kept | Zero latency, native feel, no font management overhead |
| 2026-04-14 | Dual-theme with aurora | Light mode for day use, dark aurora for night. Toggle persists per-service. |
| 2026-04-14 | Neon status colors in dark mode | Standard semantic colors get elevated brightness in dark mode for readability on near-black |
| 2026-04-14 | Service icon colors stay hardcoded | HA blue, Pi-hole red, Grafana orange, etc. are external brand colors, not Glacial tokens |
| 2026-04-14 | Dashboard keeps 16px border-radius | Larger cards on the dashboard suit the bigger radius |
| 2026-04-14 | Dashboard keeps 4th orb (amber) | Part of the aurora character, spec includes 3 core orbs but dashboard adds a 4th |
| 2026-05-03 | Tier 1 components added | Surveys of 5 consumer apps showed identical reimplementation of tables, alerts, breadcrumbs, metrics, etc. Promote to system. |
| 2026-05-03 | Skin system introduced | Token-only override layer applied via `[data-skin]`. Replaces ad-hoc CSS overrides per-project. |
| 2026-05-03 | Six skins shipped | default, warm-serif, midnight-mono, lavender, deep-navy, nord. ctrl-specific extensions deferred — ctrl will use a project-local skin file. |
| 2026-05-03 | Aurora orb tokens | Skins can recolor or disable orbs via `--orb-{1,2,3}-color` and `--orb-opacity` |
| 2026-05-03 | Mobile blur policy | `--blur` auto-reduces 20→12→8px to keep iOS Safari above 30 FPS with stacked glass |
| 2026-05-03 | Skeleton shimmer pure CSS | Drop the planned JS injector. CSS is GPU-accelerated, animation-delay avoids flash on instant loads. |
| 2026-05-03 | Debug surface added | `<html data-glacial-loaded>` + `window.glacial.help()` + boot banner. Both DX voices flagged the absence as critical. |
| 2026-05-03 | Naming rubric locked | `.glacial-{name}-{variant}`, `data-state` for semantic states, `data-glacial-*` for behavior hooks |
| 2026-05-03 | Tagged vendor copy over submodule | Eng consensus. Submodules add `--recurse-submodules` discipline that breaks CI for negligible gain when one team owns both repos. |
| 2026-05-04 | Density toggle dropped | Variant exploration showed comfortable is the right default; compact and spacious are app-specific concerns, not system-level. |
| 2026-05-04 | Mini-rail + bottom-nav unified | One responsive component (`.glacial-rail`) instead of two separate. Rail desktop, bottom-nav mobile. |
| 2026-05-04 | Split-view + drawer for list→detail | Split-view for power-user browsing; drawer for quick-edits and mobile. Single-page stays for shareable URLs. |
| 2026-05-04 | Hybrid aesthetic shipped opt-in | Polished default unchanged. `data-aesthetic="hybrid"` adds tighter radii + 1px accent borders + hard offset shadows for distinctiveness. Pure neo-brutalism rejected (loses glacial DNA). |
| 2026-05-04 | Cmd+K palette helper | `glacialPalette()` injects DOM, auto-binds Cmd+K, supports sections + filtering + keyboard nav. Hint badge hidden on `(pointer: coarse)`. |
| 2026-05-04 | Skin contract enforced via lint | `scripts/lint-skin.sh` blocks non-token overrides. `SKIN-EXCEPTION:` marker allows justified exceptions (warm-serif's serif headings). |
| 2026-05-04 | Token contract enforced via diff | `scripts/diff-tokens.sh` blocks token renames without a version bump. `tokens.json` is the public snapshot. |
