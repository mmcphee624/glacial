# Glacial

A glass morphism design system with aurora effects. Frosted glass cards on soft gradients in light mode, animated aurora orbs on near-black in dark mode.

## What's included

| File | Purpose |
|------|---------|
| `glacial.css` | CSS custom properties, glass effects, aurora orbs, component classes |
| `glacial.js` | Theme toggle (cookie-persisted), aurora orb injection, OS preference detection |
| `ha-theme/glacial.yaml` | Home Assistant theme mapping Glacial tokens to HA CSS properties |
| `DESIGN.md` | Full specification: colors, typography, spacing, components, accessibility |

## Quick start

### CSS only (tokens + glass)

```html
<link rel="stylesheet" href="glacial.css">

<div class="glacial-glass">
  Frosted glass card
</div>
```

### CSS + JS (theme toggle + aurora)

```html
<link rel="stylesheet" href="glacial.css">
<script src="glacial.js"></script>

<button class="glacial-toggle" onclick="glacialToggleTheme()">Toggle theme</button>
```

The JS automatically:
- Detects OS dark/light preference
- Persists theme choice in a cookie
- Injects aurora orb elements in dark mode
- Respects `prefers-reduced-motion`

### Home Assistant

Copy `ha-theme/glacial.yaml` into your HA `themes/` directory and add `!include_dir_merge_named themes` to your configuration. See `DESIGN.md` for card-mod glass presets.

## Adopting glacial in a new project

Paste this into the agent working in the new repo:

> Adopt the glacial design system from `https://github.com/mmcphee624/glacial`. Add it as a git submodule at `vendor/glacial`, and link `vendor/glacial/glacial.css` + `vendor/glacial/glacial.js` from the app shell. Restyle pages using glacial's tokens and component classes: `.glacial-glass`, `.glacial-glass-header`, `.glacial-badge` / `.glacial-badge-{green,yellow,red,blue,accent}`, `.glacial-btn-primary` / `.glacial-btn-secondary`, `.glacial-nav`, `.glacial-toggle`. Drive theming via the `data-theme` attribute on `<html>` and wire a toggle button to `window.glacialToggleTheme()`. Token and visual reference: `vendor/glacial/DESIGN.md`. Prefer the submodule over copying files so upstream changes flow through.

If submodules are awkward for the project, fall back to copying `glacial.css` + `glacial.js` into `public/` (or equivalent) and linking them directly.

## Colors

| Token | Light | Dark |
|-------|-------|------|
| `--accent` | `#00b8d4` (teal) | `#00e5ff` (bright cyan) |
| `--bg` | `#eef1f5` | `#111114` |
| `--text` | `#3a3a42` | `#c8c8d0` |
| `--green` | `#16a34a` | `#39ff14` (neon) |
| `--yellow` | `#d97706` | `#fbbf24` |
| `--red` | `#dc2626` | `#ff4444` |

Full token reference in [DESIGN.md](DESIGN.md).

## License

MIT
