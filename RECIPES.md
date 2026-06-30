# Glacial Recipes

The agent's first stop. Pick the recipe that matches the page you're building, copy the markup from the linked example, ship.

> **To build a page:** if a [`starters/`](./starters/) file matches — **dashboard**, **app-shell**
> (split view), or **form** — clone it and replace its `CONTENT` blocks. Otherwise pick a recipe
> below and copy the linked example's `<main>`. Starters are clone-and-ship (no demo chrome);
> examples are the rendered reference.

This file is intentionally short. Anything not here is in `DESIGN.md` (token spec, contracts) or `examples/` (rendered reference).

---

## TL;DR — Pick in 30 seconds

| You're building... | Recipe | Container | Components | Example |
|---|---|---|---|---|
| Operations / KPI overview | **Dashboard** | 1280px | metric × 4, alert, status-row, breadcrumbs | [examples/dashboard.html](./examples/dashboard.html) |
| Browseable list of items | **List** | 1100px | breadcrumbs, filter-bar, table, empty-state | [examples/list.html](./examples/list.html) |
| One-item-at-a-time browse | **Split view** | full | rail + split-list + split-detail | [examples/v2.1-tour.html](./examples/v2.1-tour.html) |
| Single item deep dive | **Detail** | 700px | breadcrumbs, metric, alert, spec-grid | [examples/detail.html](./examples/detail.html) |
| Form / settings page | **Form** | 600px | breadcrumbs, alert, glass card, inputs | [examples/form.html](./examples/form.html) |
| Kanban / pipeline | **Board** | 1200px | filter-bar, glass cards × 4 columns | [examples/board.html](./examples/board.html) |
| Internal app shell | **Tour** (rail+drawer+Cmd+K) | full | rail, drawer, palette, all of the above | [examples/v2.1-tour.html](./examples/v2.1-tour.html) |

---

## Hello, glacial

Three lines:

```html
<link rel="stylesheet" href="vendor/glacial/glacial.css">
<script src="vendor/glacial/glacial.js"></script>
<div class="glacial-glass" style="padding:20px;">Frosted glass card</div>
```

Then in DevTools console:

```js
window.glacial.help()
// → { version: "2.2.0", theme: "dark", skin: "default", aesthetic: null, classes: [...], tokens: {...} }
```

If `window.glacial` is undefined, `glacial.js` didn't load. If `data-glacial-loaded` is missing on `<html>`, the script ran but errored — check the console.

---

## Starter prompt for new projects

Paste this into the agent working in a fresh repo:

> Adopt glacial: vendor a tagged copy of `mmcphee624/glacial` v2.2.0 to `vendor/glacial/` (curl `https://github.com/mmcphee624/glacial/archive/v2.2.0.tar.gz`, extract). Link `vendor/glacial/glacial.css` and `vendor/glacial/glacial.js` from your app shell. To build a page, clone the closest file from `vendor/glacial/starters/` (dashboard / app-shell / form) and replace its CONTENT blocks; for other page types pick the recipe in `vendor/glacial/RECIPES.md` and copy the example's `<main>`. Don't override `--accent` directly — write a skin under `vendor/glacial/skins/` if you need rebranding. Verify by checking `<html data-glacial-loaded>` is set and `window.glacial.help()` returns `{version: "2.2.0"}`.

The verification step matters. Without it, agents ship pages where glacial silently isn't loaded and you don't notice for hours.

---

## Which skin?

```
                                     ┌─────────────────────────┐
                                     │ Brand color preferred?  │
                                     └────────────┬────────────┘
                          ┌────── teal ───────────┼─── purple ────┐
                          ▼                       ▼               ▼
                   ┌─────────────┐         ┌──────────────┐  ┌──────────┐
                   │ Vibe?       │         │ Vibe?        │  │ lavender │
                   └──┬───────┬──┘         └──┬────────┬──┘  └──────────┘
            standard ┴   serious           soft  ┴   technical
                  ┌───┴────┐  ┌─────┴─────┐  ┌──┴───────┐  ┌──────┴───────┐
                  │default │  │ deep-navy │  │ lavender │  │midnight-mono │
                  └────────┘  └───────────┘  └──────────┘  └──────────────┘
                                  green                      ┌──────┐
                                ─ accent? ───── yes ────────►│ nord │
                                                             └──────┘
                                  warm + serif                ┌────────────┐
                                ─ headings? ─── yes ────────►│ warm-serif │
                                                             └────────────┘
```

| Skin | When |
|------|------|
| `default` | Dev tools, dashboards, infra. The original glacial. |
| `warm-serif` | Editorial, hospitality, content-heavy. Cream + forest green + serif headings. |
| `midnight-mono` | Terminal apps, infra dashboards, log viewers. Pure black + neon green + monospace everywhere. |
| `lavender` | Journals, note-taking, calm productivity. Pale lavender + dusty purple + twilight orbs. |
| `deep-navy` | Finance, contracts, infrastructure. Abyssal navy + sky cyan + tighter radii. |
| `nord` | Calm enterprise, engineering tools. Arctic frost palette, no aurora. |

Set with `<html data-skin="warm-serif">` or `glacialSetSkin("warm-serif")`. URL param `?skin=warm-serif` overrides cookie for one page load.

---

## Page recipes

Each recipe gives you:
- **When to use** (one sentence)
- **Container** (max-width)
- **Components** (which `.glacial-*` classes show up)
- **Anti-patterns** (what NOT to do)
- **Copy this** (line-anchor link to a real example file)
- **Why this layout** (one-sentence rationale)

### Dashboard

**When to use:** A KPI overview where the user scans for status and trends in 5 seconds.
**Container:** `max-width: 1280px`, padding `20px`.
**Layout:** breadcrumbs (optional) → metric grid (4-col desktop, 2 tablet, 1 mobile) → 2-column row (alerts left, status rows right) → activity table.
**Components:** `.glacial-breadcrumbs`, `.glacial-metric`, `.glacial-alert`, `.glacial-status-row`, `.glacial-table`, optionally `.glacial-skeleton` while loading.
**Anti-patterns:**
- Don't bury metrics under tabs. The first-thing-the-eye-sees should be the most important number.
- Don't use cards-of-cards (don't put `.glacial-glass` inside another `.glacial-glass`).
- Don't full-bleed the table on a desktop dashboard. Constrain to the container.

**Start here:** clone [`starters/dashboard.html`](./starters/dashboard.html) — clone-and-ship, no demo chrome. **Reference:** [examples/dashboard.html](./examples/dashboard.html) (rendered showcase).
**Why this layout:** F-pattern scan — top-left is the north-star metric, alerts sit at eye-level on the left where users land after scanning metrics, status rows on the right give peripheral confirmation. Activity table at the bottom is reference, not focal.

### List / Index

**When to use:** A browseable collection (>10 items) where users filter then drill in.
**Container:** `max-width: 900px-1100px`.
**Layout:** breadcrumbs → page title + lede → filter-bar → table (or grid of glass cards) → empty-state when filtered to zero.
**Components:** `.glacial-breadcrumbs`, `.glacial-filter-bar`, `.glacial-filter-pill`, `.glacial-table` with `data-priority`, `.glacial-badge`, `.glacial-empty-state`.
**Anti-patterns:**
- Don't paginate when virtualizing is feasible. Pagination breaks Cmd+F and feels slow.
- Don't hide the active filter — always show selected pills with their count (`Active (184)`).
- Don't render 10,000 rows. Use server-side filtering or virtualization.

**Copy this:** [examples/list.html](./examples/list.html).
**Why this layout:** filter-bar lives directly above the table so the relationship is spatial. `data-priority` collapses columns at breakpoints so mobile gets the same data, just narrower. Empty state has a "Clear filters" CTA so the user can recover.

### Split view (master-detail)

**When to use:** Power-user list browsing where users compare items rapidly without losing the list. The Linear/Mail UX.
**Container:** full page, no max-width.
**Layout:** rail (left) → split-list (360px) → split-detail (rest). On mobile: list and detail swap via `data-mobile-view`.
**Components:** `.glacial-rail`, `.glacial-split-view`, `.glacial-split-list`, `.glacial-split-row`, `.glacial-split-detail`, `.glacial-split-back` (mobile-only).
**Anti-patterns:**
- Don't put critical CTAs in the detail pane on mobile without a back-to-list path.
- Don't lose selection state when filtering — keep the selected row highlighted even if it's filtered out (and show a "Selected (filtered out)" indicator).
- Don't update the URL on every selection — that breaks browser back. Update on explicit deep-link only.

**Start here:** clone [`starters/app-shell.html`](./starters/app-shell.html) — a real `.glacial-split-view` + rail + Cmd+K + mobile list↔detail swap. **Reference:** [examples/v2.1-tour.html](./examples/v2.1-tour.html) (drawer variant).
**Why this layout:** keyboard-first browsing (↑↓ steps through rows, Enter opens). Detail updates without page reload, so animations are quick and context never reloads.

### Detail

**When to use:** Single-item zoom-in where the user wants every fact about one thing.
**Container:** `max-width: 700px` (narrow on purpose — this is reading, not scanning).
**Layout:** breadcrumbs → page title → hero metric row (3-col) → alert (if applicable) → spec-grid → activity log → action footer.
**Components:** `.glacial-breadcrumbs`, `.glacial-metric`, `.glacial-alert`, `.glacial-status-row`, `.glacial-btn`. Spec grid uses `<dl>` + the demo `.ex-spec-grid` styling (Tier 3 candidate).
**Anti-patterns:**
- Don't full-width on this. Reading lines longer than ~75ch hurts comprehension.
- Don't hide the destructive action behind a kebab menu. "Delete" is a real choice; surface it (with a confirm modal).
- Don't pad the metric row with filler. 3 hero metrics > 6 mediocre ones.

**Copy this:** [examples/detail.html](./examples/detail.html).
**Why this layout:** narrow column = comfortable reading width. Hero metrics establish "what is this thing's status" before the deep specs.

### Form

**When to use:** New item creation, settings page, anything with multiple inputs.
**Container:** `max-width: 600px-700px`.
**Layout:** breadcrumbs → title → validation alert (only after a failed submit) → glass card containing fieldsets → action buttons below.
**Components:** `.glacial-breadcrumbs`, `.glacial-alert.glacial-alert-error`, `.glacial-glass` as form wrapper, `.glacial-btn-primary` + `.glacial-btn-secondary`.
**Anti-patterns:**
- Don't validate on every keystroke. Validate on blur or submit.
- Don't use placeholder-as-label. Always have a visible label above the input.
- Don't cram inputs into a wide grid. Stack them vertically; the eye scans fields sequentially.

**Start here:** clone [`starters/form.html`](./starters/form.html). **Reference:** [examples/form.html](./examples/form.html).
**Why this layout:** stacked inputs on a narrow column = clear scanning order, no field competes for attention with another.

### Board (kanban)

**When to use:** Pipeline / workflow with discrete stages and items that move between them.
**Container:** `max-width: 1100px-1200px`.
**Layout:** breadcrumbs → title + lede → filter-bar → 4-column grid (collapses 2-col tablet, 1-col mobile) of glass cards.
**Components:** `.glacial-filter-bar`, `.glacial-filter-pill`, `.glacial-glass` cards inside columns, `.glacial-badge` per column header.
**Anti-patterns:**
- Don't make cards more than 3 lines tall. If you need more info, the user clicks for a drawer or detail page.
- Don't overload columns with sub-grouping. Two levels max (column → card).
- Don't auto-scroll columns independently — sync them or show all.

**Copy this:** [examples/board.html](./examples/board.html).
**Why this layout:** spatial mapping of state → user drags cards to reflect their mental model.

### Tour (the v2.1 reference)

**When to use:** Internal app shell — your homepage dashboard, control plane, anything that's "the place I open every day."
**Container:** full page, with a rail.
**Components:** `.glacial-rail` (responsive), `.glacial-drawer` for quick-edits, `glacialPalette()` for ⌘K, all the Tier 1 stuff inside.
**Anti-patterns:**
- Don't ship the Cmd+K hint badge to mobile. There's no physical keyboard. Hide on `(pointer: coarse)`.
- Don't use the rail for non-navigation. It's wayfinding, not toolbar.
- Don't overflow the bottom-nav on mobile. 4-5 items max; anything else goes in a "More" sheet.

**Copy this:** [examples/v2.1-tour.html](./examples/v2.1-tour.html) (the entire body).
**Why this layout:** rail handles the 4-6 destinations a personal tool actually has. Cmd+K covers the speed once you know it. Drawer keeps you in context for quick edits.

---

## Decision trees

### Need a list of items?

```
> 50 items?  ──── yes ──→ Table with filter-bar + data-priority
                           [list recipe]
       │
      no
       ▼
> Need spatial state? (kanban, pipeline)
                           Board with glass cards × N columns
                           [board recipe]
       │
      no
       ▼
> Browse-and-edit rapidly?
                           Split view (master-detail)
                           [split-view recipe]
       │
      no
       ▼
                           Table or stacked glass cards
                           [list recipe, simplified]
```

### Need to show a state?

```
Status of an external thing (service, person, item)?
  ──→ .glacial-status-row with [data-state="healthy|active|warn|error|stale"]

Status of a single value (count, %, KPI)?
  ──→ .glacial-metric with .glacial-metric-delta (up/down/flat)

System-level message (maintenance, error, success)?
  ──→ .glacial-alert with semantic variant (info/warn/success/error)

"Nothing here yet"?
  ──→ .glacial-empty-state with title + caption + primary CTA

Inline categorical tag (priority, status word)?
  ──→ .glacial-badge with color modifier
```

### Live data — loading / error / stale?

```
Is the thing currently loading for the first time?
  ──→ .glacial-skeleton (matches the shape of what's coming)

Is the thing in an error state but might recover?
  ──→ .glacial-status-row[data-state="error"] (red glow dot)

Is the data displayed but old (stale)?
  ──→ .glacial-status-row[data-state="stale"] (yellow dot, no glow)

Is something being saved / processed in the background?
  ──→ .glacial-status-row[data-state="active"] (accent glow dot)
```

### List → detail navigation?

```
Detail needs a shareable URL? (public page, archive, deep-link)
  ──→ Single-page navigation. Click row, navigate to /listings/123.

User browses-and-tweaks rapidly?
  ──→ Split view. Click row, detail pane updates. Add deep-link via
      explicit "Open in new tab" button.

Quick edit / preview without context loss?
  ──→ Drawer. Click row, drawer slides from right (bottom sheet on mobile).

Mobile-first?
  ──→ Drawer (becomes bottom sheet automatically). Or single-page.
```

### Navigation pattern?

```
≤ 4 destinations?
  ──→ Top nav (.glacial-nav)

5-12 destinations? Personal/internal tool?
  ──→ Mini-rail desktop + bottom-nav mobile (.glacial-rail)

≥ 12 destinations? Section grouping needed?
  ──→ Full sidebar (custom — glacial doesn't ship one yet; build with
      .glacial-glass + .glacial-nav). See examples/ux/nav-sidebar.html.

Power-user / keyboard-first?
  ──→ Add Cmd+K palette via glacialPalette() on top of any nav above.
```

---

## Anti-patterns (the don't-do list)

These appeared in surveyed projects and are mistakes you should not repeat:

1. **Don't override `--accent` directly in app CSS.** Write a skin under `skins/` instead. The skin contract enforces this — see DESIGN.md.

2. **Don't introduce new fonts in app CSS.** Use the `--font-body` and `--font-mono` tokens. If you need a different font, write a skin and override these tokens at the skin level.

3. **Don't build a one-off table.** Use `.glacial-table` with `data-priority` for responsive column hiding. If you need virtualization or inline-editing, those are Tier 3 candidates — open an issue.

4. **Don't build a one-off modal/drawer.** Use `.glacial-drawer` and the `glacialOpenDrawer()` helper. Focus trap, Escape to close, and overlay click are already wired.

5. **Don't disable aurora orbs in app CSS.** Set `--orb-opacity: 0` in your skin file (or use `nord`/`warm-serif` which already do).

6. **Don't write CSS that targets `.glacial-*` internals from a skin file.** Skins MUST override tokens only. The exception is documented (heading typography in `warm-serif`) and requires a `SKIN-EXCEPTION:` comment header.

7. **Don't show the Cmd+K hint badge on mobile.** No physical keyboard. Hide via `@media (pointer: coarse)`. See `examples/v2.1-tour.html` for the exact CSS.

8. **Don't render 10,000 table rows on initial load.** Server-side filter or virtualize.

9. **Don't use placeholder-as-label** in forms. Always have a visible `<label>` above the input.

10. **Don't validate forms on every keystroke.** Validate on blur or submit. Premature errors feel hostile.

11. **Don't build cards-of-cards.** At most 2 levels of nested `.glacial-glass`. Beyond that, child surfaces should be opaque or use `--bg-card-hover` as solid fill.

12. **Don't ship a generic 3-column feature grid** on a glacial page. That's the canonical AI-slop tell. Prefer asymmetric layouts (3-col metrics + 2-col content row + full-width table — see dashboard recipe).

---

## Skin catalog (one-line each)

| Skin | One-line |
|---|---|
| `default` | Teal aurora glass — the original. Use for dev tools, infra dashboards. |
| `warm-serif` | Cream + forest green + serif headings — editorial, hospitality, content. |
| `midnight-mono` | Pure black + neon green + monospace — terminal apps, log viewers. |
| `lavender` | Pale lavender + dusty purple + twilight orbs — journals, calm productivity. |
| `deep-navy` | Abyssal navy + sky cyan + tighter radii — finance, contracts, ledger UIs. |
| `nord` | Arctic frost palette, muted blues, no aurora — calm engineering tools. |

Authoring a new skin: copy `skins/_template.css`. Rules:
1. Only override CSS custom property values.
2. The four allowed selector forms: `:root`, `[data-theme="dark"]`, `[data-skin="..."]`, `[data-skin="..."][data-theme="dark"]`. Plus `@media (prefers-color-scheme: dark)` wrapping any of those.
3. Ship all three blocks: light, manual-dark, OS-dark fallback.
4. If you need to override a component class (e.g. swap headings to serif), add a `SKIN-EXCEPTION:` comment block above the rule. The lint warns but doesn't fail.

Run `./scripts/lint-skin.sh skins/<your-name>.css` to verify the contract.

---

## Debug checklist

When your page looks wrong:

| Symptom | Check |
|---|---|
| **Page looks unstyled** | `<head>` has `<link rel="stylesheet" href=".../glacial.css">`? |
| **No theme toggle / no aurora** | `<head>` has `<script src=".../glacial.js"></script>`? |
| **`window.glacial` is undefined** | Open DevTools console — was there a JS error during page load? |
| **`<html data-glacial-loaded>` is missing** | glacial.js ran but errored. Check console. |
| **Theme toggles but doesn't persist** | Cookies disabled? glacial.js falls back to sessionStorage; check it's allowed. |
| **Skin switches but reverts on reload** | URL params (`?skin=foo`) override cookies for one page load only. Use `glacialSetSkin()` to persist. |
| **Skin doesn't take effect** | Browser DevTools: is `<html data-skin="...">` set? Is `skins/<name>.css` returning 200? |
| **Colors are weird in dark mode under a custom skin** | Skin missing the `[data-skin="..."][data-theme="dark"]` block. See `skins/_template.css`. |
| **Aurora orbs look bad on a non-default skin** | Set `--orb-opacity: 0` in your skin, or override `--orb-1-color` / `--orb-2-color` / `--orb-3-color`. |
| **Mobile feels sluggish** | Check `--blur` on mobile — should be 12px at <768px, 8px on coarse pointer. Auto-applied; if not, check viewport meta tag. |
| **Cmd+K palette doesn't open** | Did you call `glacialPalette({...})` once at page load? It auto-binds the shortcut, but only after the function runs. |
| **Drawer won't close on Esc** | Multiple drawers open? `glacialCloseDrawer()` (no arg) closes the topmost. Check console for focus-trap errors. |
| **Components inside hybrid aesthetic look heavy** | Hard offset shadows compose with skins that have orbs. Try `--orb-opacity: 0` or use a skin that already does (warm-serif, nord). |

`window.glacial.help()` in the console returns the full state. Show it to me when reporting a bug.

---

## Class index

Every public `.glacial-*` class shipped in v2.4.0:

### Core (v1.0.0)
- `.glacial-glass` — frosted glass card surface
- `.glacial-glass-header` — glass header bar (slightly different blur)
- `.glacial-aurora` — orb container (auto-injected by glacial.js)
- `.glacial-badge` + `.glacial-badge-{green,yellow,red,blue,accent}` — small uppercase tag
- `.glacial-btn` + `.glacial-btn-primary` / `.glacial-btn-secondary` — buttons
- `.glacial-nav` — top nav link group
- `.glacial-toggle` — theme toggle button

### Tier 1 (v2.0.0)
- `.glacial-table` — responsive table; mobile column-hide via `data-priority`
- `.glacial-alert` + `.glacial-alert-{info,warn,success,error}` + `.glacial-alert-icon` / `.glacial-alert-body` / `.glacial-alert-title` / `.glacial-alert-dismiss`
- `.glacial-empty-state` + `-icon` / `-title` / `-caption` (+ `.glacial-empty-state-error` variant)
- `.glacial-metric` + `-label` / `-value` / `-delta` (+ `-up` / `-down` / `-flat` modifiers)
- `.glacial-breadcrumbs` + `-sep` / `-current` / `-trunc` children
- `.glacial-filter-bar` + `-label` / `-group` containers
- `.glacial-filter-pill` + `-count` modifier (`aria-pressed="true"` for active)
- `.glacial-status-row` + `-icon` / `-name` / `-meta` / `-dot` (+ `data-state="..."` variants)
- `.glacial-skeleton` + `.glacial-skeleton-text`

### Tier 2 (v2.1.0)
- `.glacial-rail` + `.glacial-rail-shell` + `.glacial-rail-content`
- `.glacial-rail-item` + `-icon` / `-label` / `-tip` (+ `.is-active` / `aria-current="page"`)
- `.glacial-rail-brand` + `.glacial-rail-spacer`
- `.glacial-drawer` + `.glacial-drawer-overlay` + `-header` / `-title` / `-close` / `-body`
- `.glacial-split-view` + `.glacial-split-list` + `-header` / `-title` / `-meta`
- `.glacial-split-row` + `-title` / `-meta` (+ `.is-selected` / `aria-current="true"`)
- `.glacial-split-detail` + `.glacial-split-back` + `.glacial-split-empty`
- `.glacial-palette-overlay` + `.glacial-palette` + `-input` / `-list` / `-section` / `-item` / `-empty` (DOM injected by `glacialPalette()`)
- `.glacial-h1` / `.glacial-h2` — heading utility (fluid `--text-*` scale; mono+uppercase under hybrid)

### Tier 2.5 (v2.3.0)
- `.glacial-rail-secondary` + `-title` / `-item` — contextual text sub-rail; add `.has-secondary` to `.glacial-rail-shell`

### Tier 3 (v2.4.0)
- **Forms:** `.glacial-field` + `-label` / `-hint` / `-error`; `.glacial-input` / `.glacial-textarea` / `.glacial-select`; `.glacial-checkbox` / `.glacial-radio` / `.glacial-switch` (errors via `aria-invalid="true"`)
- **Modal:** `.glacial-modal` + `.glacial-modal-overlay` + `-header` / `-title` / `-close` / `-body` / `-footer`
- **Dropdown:** `.glacial-dropdown` + `.glacial-menu` + `.glacial-menu-item` / `.glacial-menu-separator`
- **Tabs:** `.glacial-tabs` + `.glacial-tab-list` + `.glacial-tab` + `.glacial-tab-panel`
- **Toast:** `.glacial-toast-region` + `.glacial-toast` (+ `-info`/`-success`/`-warn`/`-error`) + `-message` / `-action` / `-close`
- **Accordion:** `.glacial-accordion` + `.glacial-accordion-item` (`<details>`) + `-trigger` (`<summary>`) + `-panel`
- **Feedback:** `.glacial-progress` + `.glacial-progress-bar`; `.glacial-spinner`
- **Avatar:** `.glacial-avatar` + `.glacial-avatar-group`
- **Pagination:** `.glacial-pagination` + `.glacial-pagination-item` (`aria-current="page"` for current)
- **Tooltip:** attribute-only — `[data-glacial-tooltip="text"]`

### Layout primitives (v2.8.0)
- `.glacial-container` (+ `-narrow` 700px / `-wide` 1280px) — centered max-width column with responsive gutters; implements DESIGN.md's "Layout constraints"
- `.glacial-grid` (responsive `auto-fit`) + `.glacial-grid-2` / `-3` / `-4` — collapse to 2-up at ≤1024px, 1-up at ≤540px

### Icons (v2.9.0)
- `.glacial-icon` — inline line-icon (1em, `currentColor`, weight via `--icon-stroke`); markup from `glacialIcon(name)`. Names: `glacialIcon('?')`.

### Behavior hooks (data attributes)
- `data-theme="light|dark"` on `<html>` — forces theme
- `data-skin="<name>"` on `<html>` — selects skin
- `data-aesthetic="hybrid"` on `<html>` — opt-in hybrid edges
- `data-glacial-loaded="<version>"` on `<html>` — set by glacial.js to confirm load
- `data-priority="1|2|3"` on `<th>` / `<td>` — responsive column hiding
- `data-state="..."` on `.glacial-status-row` and `.glacial-metric` — state variants
- `data-mobile-view="list|detail"` on `.glacial-split-view` — mobile pane toggle
- `data-open="true|false"` on `.glacial-drawer` and `.glacial-drawer-overlay` — open state
- `data-glacial-drawer-close="<id>"` — declarative close hook on a button or link
- `data-glacial-skin` (no value) on a `<select>` — auto-wired skin picker (see `_examples.js`)
- `data-glacial-modal-open="<id>"` / `data-glacial-modal-close="<id?>"` — declarative modal open/close (v2.4.0)
- `data-glacial-tabs` on a tab container — auto-wires roles + arrow-key nav (v2.4.0)
- `data-glacial-menu="<id?>"` on a trigger — toggles its `.glacial-menu` (v2.4.0)
- `data-glacial-tooltip="<text>"` on any element — hover/focus tooltip (v2.4.0)
- `has-secondary` (class) on `.glacial-rail-shell` — enables the two-tier rail (v2.3.0)

### JS API
- `window.glacialToggleTheme()` → light ↔ dark
- `window.glacialSetSkin(name)` → set `<html data-skin>` and persist
- `window.glacialSetAesthetic(name | null)` → set/clear `<html data-aesthetic>`
- `window.glacialOnThemeChange(cb)` → subscribe to theme/skin/aesthetic changes; returns unsubscribe (v2.4.0)
- `window.glacialOpenDrawer(idOrEl)` / `window.glacialCloseDrawer(idOrEl?)`
- `window.glacialOpenModal(idOrEl)` / `window.glacialCloseModal(idOrEl?)` (v2.4.0)
- `window.glacialToast({ message, variant, timeout, action })` → returns a dismiss fn (v2.4.0)
- `window.glacialPalette({ items, onSelect, placeholder, shortcut })` → returns `{ open, close, isOpen, setItems }`
- `window.glacialIcon(name, { title?, class?, size?, strokeWidth? })` → `<svg class="glacial-icon">` string; `glacialIcon('?')` → name list
- `window.glacial.help()` → full state object
- `window.glacial.{toggleTheme, setSkin, setAesthetic, onThemeChange, openDrawer, closeDrawer, openModal, closeModal, toast, palette, icon, version}` → namespaced API
