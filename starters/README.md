# Glacial Starters

Clonable page templates. Unlike [`examples/`](../examples/) — which are *showcase* pages
wrapped in demo chrome (skin switchers, `_examples.css`, `.ex-*` layout) you have to strip —
a starter is the thing you **copy into your project and ship**. Clone one, replace the
content, done.

| Starter | Recipe | What it is |
|---|---|---|
| [`dashboard.html`](./dashboard.html) | Dashboard | KPI overview — metric grid, alerts, service status, activity table. Shows a **loading** (skeleton) tile and a commented **empty** table state. |
| [`app-shell.html`](./app-shell.html) | Split view | Master/detail app shell — rail + `.glacial-split-view` + Cmd+K, ↑/↓ to step rows, mobile list↔detail swap, **empty** detail state. |
| [`form.html`](./form.html) | Form / settings | Settings form — fields, validation on **submit** (not per-keystroke), a real **error** state, visible labels. |

## Use one

1. **Clone the file** into your project.
2. **Fix the two asset paths.** In the `<head>`, `../glacial.css` / `../glacial.js` resolve only
   when previewing *inside this repo*. Point them at your vendored copy (`vendor/glacial/…`) or a
   pinned CDN:
   ```html
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/mmcphee624/glacial@v2.9.0/glacial.css">
   <script src="https://cdn.jsdelivr.net/gh/mmcphee624/glacial@v2.9.0/glacial.js"></script>
   ```
   Each starter has a **load-check** that throws a red banner if glacial didn't load — so a wrong
   path fails loudly instead of silently rendering unstyled. (Delete the check once you're wired.)
3. **Replace the content** between the `<!-- CONTENT: … START -->` / `END` markers (and the data
   object in the app-shell). Then delete the top comment + the load-check `<script>`.

## Good to know

- **Layout is glacial's, not local.** Starters use `.glacial-container*` + `.glacial-grid*`
  (v2.8.0) — no per-file layout CSS to drift. Vendor **≥ v2.9.0** (icons + primitives).
- **Icons** come from `glacialIcon('name')` (v2.9.0), hydrated into `[data-glacial-icon]` slots. A
  typo renders a visible placeholder + a console warning; run `glacialIcon('?')` for the name list.
- **Not on the CDN.** Starters ship in the GitHub tarball, not at `glacial.home/v2` (the publish
  allowlist is `glacial.css` / `glacial.js` / `VERSION` / `skins/`). Clone them from your vendored
  copy or straight from the repo.
- **Upgrades.** A cloned file is a snapshot — re-vendoring glacial won't touch your markup. But
  icons resolve from `glacial.js` at runtime, so a newer glacial *does* pull icon fixes/additions
  automatically (a significant glyph change is called out in `MIGRATING.md`).

Recipe details, anti-patterns, and the component class index live in
[`../RECIPES.md`](../RECIPES.md).
