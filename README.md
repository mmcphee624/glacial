# Glacial

A glass morphism design system with aurora effects, six skins, and a Cmd+K palette. Built for dashboards, internal tools, and data-dense UIs that should feel alive, not sterile.

```
http://100.88.236.87:8000/examples/    ← live reference (run python3 -m http.server)
```

## Hello, glacial

Three lines. That's the whole getting-started.

```html
<link rel="stylesheet" href="vendor/glacial/glacial.css">
<script src="vendor/glacial/glacial.js"></script>
<div class="glacial-glass" style="padding:20px;">Frosted glass card</div>
```

`window.glacial.help()` in your DevTools console confirms it loaded.

## Reading order

- **AI agents:** [`RECIPES.md`](./RECIPES.md) → [`examples/`](./examples/) → [`DESIGN.md`](./DESIGN.md)
- **Humans:** this file → [`examples/`](./examples/) → [`DESIGN.md`](./DESIGN.md) → [`RECIPES.md`](./RECIPES.md)

## What's included

| File | Purpose |
|------|---------|
| `glacial.css` | Tokens, glass effect, aurora orbs, Tier 1 + Tier 2 components, mobile blur policy |
| `glacial.js` | Theme + skin + aesthetic toggle, debug surface, drawer + Cmd+K palette helpers |
| `skins/*.css` | 6 brand variants (default, warm-serif, midnight-mono, lavender, deep-navy, nord) |
| `RECIPES.md` | Decision guide for agents — page recipes, anti-patterns, debug checklist |
| `DESIGN.md` | Full token catalog, skin contract, state matrices, DNA Checklist, versioning policy |
| `MIGRATING.md` | Version-to-version upgrade notes |
| `CHANGELOG.md` | Per-release change log |
| `examples/` | Static HTML reference for every component and recipe |
| `scripts/` | Token contract + skin contract CI gates |
| `ha-theme/glacial.yaml` | Home Assistant theme mapping |
| `tokens.json` | Public token snapshot (machine-readable) |
| `VERSION` | Current version (`2.2.0`) |

## Adopting in a new project

Paste this into the agent working in the new repo:

> Adopt glacial: vendor a tagged copy of `mmcphee624/glacial` v2.2.0 to `vendor/glacial/` (curl `https://github.com/mmcphee624/glacial/archive/v2.2.0.tar.gz`, extract). Link `vendor/glacial/glacial.css` and `vendor/glacial/glacial.js` from your app shell. Read `vendor/glacial/RECIPES.md` and pick the recipe matching the page you're building. Don't override `--accent` directly — write a skin under `vendor/glacial/skins/` if you need rebranding. Verify by checking `<html data-glacial-loaded>` is set and `window.glacial.help()` returns `{version: "2.2.0"}`.

## Theming

Three independent axes, all set on `<html>`:

```html
<html data-theme="dark" data-skin="warm-serif" data-aesthetic="hybrid">
```

| Axis | Values | Default |
|------|--------|---------|
| `data-theme` | `light` / `dark` (or unset → OS preference) | OS preference |
| `data-skin` | `default` / `warm-serif` / `midnight-mono` / `lavender` / `deep-navy` / `nord` | `default` |
| `data-aesthetic` | unset (polished) / `hybrid` (brutalist edges on glass) | unset |

Set them programmatically:

```js
glacialToggleTheme();           // light ↔ dark
glacialSetSkin('warm-serif');   // any of the six
glacialSetAesthetic('hybrid');  // null reverts to polished
```

Or via URL params for ephemeral previews: `?theme=dark&skin=midnight-mono&aesthetic=hybrid`

## Home Assistant

Copy `ha-theme/glacial.yaml` into your HA `themes/` directory and add `!include_dir_merge_named themes` to your configuration. See [`DESIGN.md`](./DESIGN.md) for card-mod glass presets.

## Colors at a glance

| Token | Light | Dark |
|-------|-------|------|
| `--accent` | `#00b8d4` (teal) | `#00e5ff` (bright cyan) |
| `--bg` | `#eef1f5` | `#111114` |
| `--text` | `#3a3a42` | `#c8c8d0` |
| `--green` | `#16a34a` | `#39ff14` (neon) |
| `--yellow` | `#d97706` | `#fbbf24` |
| `--red` | `#dc2626` | `#ff4444` |

Full token catalog in [`DESIGN.md`](./DESIGN.md). Machine-readable: [`tokens.json`](./tokens.json).

## License

MIT
