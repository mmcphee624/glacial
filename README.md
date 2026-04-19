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
