# Migrating

## v2.8.0 → v2.9.0

**Additive — no action required.** v2.9 adds the icon system: `glacialIcon(name)` /
`window.glacial.icon`, the `.glacial-icon` class, and the `--icon-stroke` token. Nothing was
removed. You can replace hand-drawn inline `<svg>` icons with `glacialIcon('name')` (it
returns an SVG string for `innerHTML` / templates), but nothing forces it. Icon **names** are
public API going forward — a rename is MAJOR with a deprecation cycle, and a small alias map
already maps common synonyms (`gear`→`settings`, etc.). Find names at runtime with
`glacialIcon('?')` or `window.glacial.help().icons`.

## v2.7.0 → v2.8.0

**Additive — no action required.** v2.8 adds layout primitives — `.glacial-container`
(+ `-narrow` / `-wide`) and `.glacial-grid` (+ `-2` / `-3` / `-4`) — implementing the
"Layout constraints" already documented in `DESIGN.md` as real classes. No tokens or
classes were removed and no new tokens were added. If you previously hand-rolled a page
container or metric grid (or copied the demo-only `.ex-*` layout), you can switch to these;
nothing forces it.

## v2.6.x → v2.7.0

**One removal, otherwise additive.** v2.7 replaces v2.6's shared-cookie-domain
cross-surface sharing with a URL-param **appearance carry**. The only breaking
item is the removal of `GLACIAL_COOKIE_DOMAIN` (it never worked for the deployments
it targeted — see the footgun note below). Everything else is opt-in and off by
default; the carry only auto-applies to app-switcher tiles.

### Why the change

`GLACIAL_COOKIE_DOMAIN` set `;domain=<value>` on glacial's cookies to share a pick
across sibling subdomains. Browsers **reject** a cookie whose `domain` is a bare
**single-label TLD** (the host has no registrable dot-separated parent). So for a
deployment under a made-up internal TLD — e.g. surfaces at `app.lan` and
`status.lan` trying `domain=.lan` — the cookie write **silently fails**, which in
v2.6 also broke glacial's own cookie writes on those hosts. There is no
client-side workaround; only a host-only cookie sticks. (Cookies under a normal
registrable domain like `app.example.com` with `domain=.example.com` were fine —
but the single-label-TLD case was the one we shipped for, hence the pivot.)

### What replaces it: appearance carry

glacial already honors `?theme/?skin/?aesthetic` on landing. v2.7 adds the write
half: when the user clicks an app-switcher tile, glacial **decorates** the
destination URL with the current pick, so it carries to the next surface — no DNS,
no shared cookie, no proxy.

- **`glacialDecorateUrl(url)`** (also `window.glacial.decorateUrl`) — appends the
  live `theme`/`skin`/`aesthetic` as glacial's readable params, omitting any value
  that equals the destination default (clean URLs in the common case). It merges
  with an existing query, keeps params before a `#hash`, overwrites a conflicting
  param, is idempotent, and preserves relative + pre-encoded URLs.
- **App-switcher** decorates tiles **at click time** (so the carried pick is always
  current). New per-service `carry` flag (default `true`) — set `carry:false` on
  non-glacial targets (a Pi-hole / Grafana / router admin link) so foreign or
  canonical URLs aren't decorated. A switcher-level `carryAppearance:false`
  disables it globally.

  ```js
  glacialAppSwitcher({
    target: '#nav',
    services: [
      { name: 'App A', url: 'https://a.example', status: 'green' },            // carries
      { name: 'App B', url: 'https://b.example', status: 'yellow' },           // carries
      { name: 'Router', url: 'https://router.example', carry: false }         // not decorated
    ]
  });
  ```

- For your own (non-switcher) outbound links, decorate them yourself at click time
  — e.g. in a delegated click handler: `a.href = glacialDecorateUrl(a.dataset.url)`.

### New config (set before `glacial.js` loads)

1. **`GLACIAL_DEFAULT_SKIN`** (`window` global or `<meta name="glacial-default-skin">`)
   — a durable default skin until the user picks. `getSkin()` precedence is now
   URL `?skin=` > cookie > `GLACIAL_DEFAULT_SKIN` > `'default'`. Read pre-paint, so
   it applies before first paint (no FOUC), mirroring `GLACIAL_DEFAULT_THEME`.

2. **`GLACIAL_DEFAULT_THEME='auto'`** — `auto` now means "follow OS preference"
   (identical to leaving it unset), so you can declare it explicitly. `'light'` /
   `'dark'` still pin a durable default.

   ```html
   <script>
     window.GLACIAL_DEFAULT_SKIN  = 'deep-navy'; // durable default skin
     window.GLACIAL_DEFAULT_THEME = 'auto';      // follow OS (explicit)
     window.GLACIAL_SHARED_THEME  = true;        // one glacial-theme cookie + persist-on-param
   </script>
   <script src="vendor/glacial/glacial.js"></script>
   ```

### Persist-on-param (opt-in) — security note

When `GLACIAL_SHARED_THEME` is truthy, a carried `?theme/?skin/?aesthetic` param is
**persisted** to this surface's host-only cookie on boot (so a later cold reload
keeps the carried look). This means a **crafted link** (e.g. `…?skin=nord`) can set
an **opted-in** site's appearance for that visitor. This is deliberate and bounded:
it is **appearance-only** (theme/skin/aesthetic, nothing sensitive), **opt-in**
(off unless you set `GLACIAL_SHARED_THEME`), and **validated** — the value must be
in glacial's known vocab (theme ∈ light/dark, skin ∈ the six built-ins, aesthetic ∈
hybrid) or it is ignored, so the cookie can't be poisoned with junk. With
shared-theme off (the default), a carried param is ephemeral (applied for that load,
not persisted).

### Removing `GLACIAL_COOKIE_DOMAIN`

Delete any `GLACIAL_COOKIE_DOMAIN` global/`<meta>`. If you were relying on it for
cross-surface sharing, set `GLACIAL_SHARED_THEME=true` (and the two defaults above)
and let the app-switcher carry the pick. If you set it via `<meta>`, remove that tag.

## v2.5.x → v2.6.0

**No breaking changes.** Purely additive: cross-surface config, cross-tab live
sync, and two new components. Existing markup and behavior are unchanged — every
new mechanism is **opt-in and off by default**. Re-vendor and nothing moves
until you flip a flag.

### Cross-surface config (set before `glacial.js` loads)

Each reads a `window` global first, then a `<meta name="...">` with the same
kebab-case name. Leave them unset to keep current behavior.

1. **`GLACIAL_COOKIE_DOMAIN`** — share glacial's cookies across sibling
   subdomains. When set, the cookie string gains `;domain=<value>` (e.g.
   `.example.home`), so a theme/skin pick on one surface is visible to the
   others. Unset ⇒ the cookie is host-only as before.

2. **`GLACIAL_SHARED_THEME`** — truthy ⇒ glacial writes a single `glacial-theme`
   cookie instead of the per-service `{service}-theme`. Reads check **both**
   names (shared first, then the legacy per-service name), so a user's existing
   saved theme migrates automatically — no re-pick — and the OS-preference
   listener won't auto-flip a migrated user. Combine with
   `GLACIAL_COOKIE_DOMAIN` to share one theme across every surface.

3. **`GLACIAL_DEFAULT_THEME`** (`'light'` | `'dark'`) — a durable default applied
   until the user makes a real pick. Precedence in `getTheme()` is now
   URL `?theme=` > persisted cookie > `GLACIAL_DEFAULT_THEME` > OS preference,
   and the OS listener short-circuits when a default is set (an OS light/dark
   toggle no longer reverts your forced default). A real user pick writes a
   cookie and wins.

   ```html
   <script>
     window.GLACIAL_COOKIE_DOMAIN = '.example.home';
     window.GLACIAL_SHARED_THEME  = true;
     window.GLACIAL_DEFAULT_THEME = 'dark';
   </script>
   <script src="vendor/glacial/glacial.js"></script>
   ```

### Cross-tab live sync

Theme / skin / aesthetic changes now broadcast to other **same-origin** tabs
over `BroadcastChannel('glacial')`, which re-apply and re-emit `glacial:change`.
No setup; degrades to a no-op where BroadcastChannel is unavailable.
**Same-origin only** — a different surface (subdomain) picks up the change from
the shared cookie on its next load, not live.

### New components

4. **Settings cog.** `glacialMountSettings('#slot')` injects a cog + popover
   with a theme segmented control, a skin swatch picker (each swatch renders its
   own skin's tokens), and an aesthetic toggle. It drives the existing
   `glacialToggleTheme` / `glacialSetSkin` / `glacialSetAesthetic` setters — drop
   it in to replace a hand-rolled theme/skin control.

5. **App switcher.** `glacialAppSwitcher({ services, target })` renders
   `.glacial-tile` launchers (optional `status` dot, optional `group` heading).
   Supply your own service list.

## v2.3.x → v2.4.0

**No breaking changes.** Purely additive: 15 new tokens (8 spacing, 7 fluid
type), the Tier 3 component set, a high-contrast safeguard, a change event, and
CI. Existing markup renders identically. Re-vendor and you're done.

### What's new and worth adopting

1. **Form components.** Replace any hand-rolled inputs with `.glacial-input`,
   `.glacial-textarea`, `.glacial-select`, `.glacial-checkbox`, `.glacial-radio`,
   `.glacial-switch`, wrapped in `.glacial-field` with a `.glacial-field-label`.
   Mark errors with `aria-invalid="true"` on the control and a
   `.glacial-field-error` message — the red border is automatic. If you were
   faking inputs with local classes (the old `examples/form.html` used `ex-*`),
   migrate them now.

2. **Overlays.** `.glacial-modal` (`glacialOpenModal(id)` / `glacialCloseModal()`),
   `glacialToast({ message, variant })`, `[data-glacial-tabs]`,
   `[data-glacial-menu]`, `[data-glacial-tooltip]`, and `<details
   class="glacial-accordion-item">`. All keyboard-accessible and
   reduced-motion-aware out of the box.

3. **Stop observing `<html>`.** Replace any MutationObserver/poll on
   `data-theme` with:
   ```js
   glacialOnThemeChange(function (d) { /* d.theme, d.skin, d.aesthetic */ });
   ```

4. **High contrast comes free.** Users with `prefers-contrast: more` now get
   solid surfaces, stronger borders, and no aurora — no work on your side, as
   long as your custom CSS references glacial tokens rather than hardcoded
   colors.

5. **New gate.** If you fork or maintain glacial, CI now runs
   `node scripts/check-contract.mjs` (classes ⊆ CSS, token refs declared, no
   stray color literals) alongside the existing bash gates. See `CONTRIBUTING.md`.

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
   <link rel="stylesheet" href="vendor/glacial/skins/warm-serif.css">  <!-- or another built-in, or your own -->
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
