# Migrating

## v2.1.x → v2.2.0

**No breaking changes.** No tokens or classes added or removed — token
snapshot diff is empty. All changes are documentation and CI tooling.

### What's new and worth adopting

1. **Read `RECIPES.md` first** if you're starting a new project. Six page
   recipes are documented end-to-end (dashboard / list / split-view /
   detail / form / board / tour) with copy-paste anchors into
   `examples/`. Each recipe explains the *why* of the layout, not just
   the markup.

2. **Run the CI gates** if you're forking or maintaining a downstream
   consumer:
   ```bash
   ./scripts/snapshot-tokens.sh --check    # tokens.json up to date?
   ./scripts/diff-tokens.sh main..HEAD     # any silent token renames?
   ./scripts/lint-skin.sh skins/*.css      # skin contract honored?
   ```
   These take seconds and catch drift before it ships.

3. **`SKIN-EXCEPTION:` marker** — if you author a custom skin and need to
   override a component class internal (the canonical case is swapping
   headings to a different font but keeping body text), add a comment
   block above the rule beginning with `SKIN-EXCEPTION:` and a short
   justification. The lint script recognizes the marker and warns
   instead of failing. See `skins/warm-serif.css` for the reference
   implementation.

4. **DESIGN.md is the canonical spec.** It now includes per-component
   state matrices, the Glacial DNA Checklist, the full skin contract,
   and the versioning + deprecation policy. Skim the table of contents
   when you need to understand "what's the contract for X."

### Token names — none renamed
Every v2.1 token is intact. `tokens.json` is unchanged.

## v2.0.x → v2.1.0

**No breaking changes.** All v2.0 components unchanged. v2.1 adds three
optional Tier 2 components and an `aesthetic` axis.

### What you can do without changing anything
- Skip Tier 2 entirely. Your v2.0 dashboard works exactly as before.
- The new `data-aesthetic` attribute is unset by default — polished look
  is preserved.

### What's new and worth adopting

1. **Mini rail / bottom nav** for projects with 4-6 sections:
   ```html
   <div class="glacial-rail-shell">
     <aside class="glacial-rail">
       <a class="glacial-rail-item is-active">
         <svg class="glacial-rail-item-icon">…</svg>
         <span class="glacial-rail-item-label">Home</span>
         <span class="glacial-rail-item-tip">Dashboard</span>
       </a>
       …
     </aside>
     <main class="glacial-rail-content">…</main>
   </div>
   ```
   Desktop renders a 60px vertical rail with tooltips on hover; mobile
   renders a thumb-zone bottom nav with the labels visible.

2. **Drawer** for quick-edit / detail-peek without leaving the list:
   ```html
   <div class="glacial-drawer-overlay"></div>
   <aside class="glacial-drawer" id="my-drawer" role="dialog" aria-modal="true">
     <header class="glacial-drawer-header">
       <h2 class="glacial-drawer-title">Title</h2>
       <button class="glacial-drawer-close" data-glacial-drawer-close="my-drawer">×</button>
     </header>
     <div class="glacial-drawer-body">…</div>
   </aside>

   <script>glacialOpenDrawer('my-drawer');</script>
   ```
   Right-side panel on desktop, bottom sheet on mobile. Focus trap +
   Esc close + overlay click close are auto-wired.

3. **Split view** for power-user list → detail flows:
   ```html
   <div class="glacial-split-view" id="my-split">
     <aside class="glacial-split-list">…rows…</aside>
     <section class="glacial-split-detail">
       <button class="glacial-split-back" onclick="document.getElementById('my-split').setAttribute('data-mobile-view','list')">← Back</button>
       …detail…
     </section>
   </div>
   ```
   Two columns on desktop, mobile shows one at a time. App code sets
   `data-mobile-view="detail"` on the parent when a row is clicked.

4. **Hybrid aesthetic** for projects where you want a more deliberate
   look:
   ```html
   <html data-aesthetic="hybrid">
   ```
   Or programmatically: `glacialSetAesthetic('hybrid')`. Reverts with
   `glacialSetAesthetic(null)`.

5. **Cmd+K palette** for keyboard-first navigation:
   ```js
   glacialPalette({
     items: [
       { id: 'home', label: 'Go to Dashboard', section: 'Navigate', onSelect: () => location.href = '/' },
       { id: 'theme', label: 'Toggle theme', section: 'Actions', shortcut: '⌥T', onSelect: glacialToggleTheme }
     ]
   });
   ```
   Auto-binds `⌘K` (Mac) and `Ctrl+K` (others). Disable with
   `{ shortcut: false }` and call `.open()` yourself.

### Token names — none renamed
Every v2.0 token is intact. Two new tokens are added; nothing changed.

## v1.x → v2.0.0

**No breaking changes.** v2 is fully additive over v1 — all v1 classes, tokens, and behaviors continue to work.

### What you can do without changing anything
- Keep using `.glacial-glass`, `.glacial-glass-header`, `.glacial-badge`, `.glacial-btn-*`, `.glacial-nav`, `.glacial-toggle` — unchanged.
- Keep using `glacialToggleTheme()` — unchanged.
- Keep using `[data-theme="light"]` / `[data-theme="dark"]` — unchanged.

### What's new and worth adopting
1. **Verify glacial loaded** — add a check in your dev console:
   ```js
   document.documentElement.dataset.glacialLoaded
   // → "2.0.0"
   window.glacial.help()
   // → { version, theme, skin, classes, tokens }
   ```
   If `data-glacial-loaded` is missing, glacial.js didn't run. Check your script tag.

2. **Pick a skin** (optional). v2 introduces `<html data-skin="...">` for brand variants. Your v1 app uses the default skin implicitly. To rebrand, add a skin file:
   ```html
   <link rel="stylesheet" href="vendor/glacial/glacial.css">
   <link rel="stylesheet" href="vendor/glacial/skins/warm-serif.css">  <!-- or ctrl, or your own -->
   ```
   Then set `<html data-skin="warm-serif">`.

3. **Reach for Tier 1 components** instead of rebuilding them:
   - Replace your hand-rolled tables with `.glacial-table`
   - Replace your warning banners with `.glacial-alert.glacial-alert-warn`
   - Replace your "no items" divs with `.glacial-empty-state`
   - Replace your KPI tiles with `.glacial-metric`
   - Replace your filter row with `.glacial-filter-bar` + `.glacial-filter-pill`
   - Replace your service status rows with `.glacial-status-row`
   - Replace your loading divs with `.glacial-skeleton`
   - Replace your nav crumbs with `.glacial-breadcrumbs`

   See `RECIPES.md` for which components go in which page type.

4. **Switch to tagged release** if you weren't already. v2 ships with a `VERSION` file and semver tags. To pin:
   ```bash
   curl -L https://github.com/mmcphee624/glacial/archive/v2.0.0.tar.gz | tar xz -C vendor/
   mv vendor/glacial-2.0.0 vendor/glacial
   ```

### Token names — none renamed
Every v1 token is intact. The contract is enforced by `scripts/diff-tokens.sh` running in CI on this repo.

If you used any token that wasn't documented in v1's DESIGN.md, check `tokens.json` for the official public set.

## v0.x → v1.x

(There was no public v0.)

## Future migrations

This project follows semver. Token renames or class removals will only happen in a MAJOR bump (e.g. v3.0.0), and any removed token will carry a `/* @deprecated since vX.Y */` comment for one full MINOR cycle before removal.
