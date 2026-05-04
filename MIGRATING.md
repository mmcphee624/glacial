# Migrating

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
