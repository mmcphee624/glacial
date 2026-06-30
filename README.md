# Glacial

A glass morphism design system with aurora effects, six skins, and a Cmd+K palette. Built for dashboards, internal tools, and data-dense UIs that should feel alive, not sterile.

```
http://localhost:8000/examples/    ← live reference (run python3 -m http.server)
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
| `glacial.css` | Tokens (color, spacing, fluid type), glass effect, aurora orbs, Tier 1–3 components, prefers-contrast safeguard, mobile blur policy |
| `glacial.js` | Theme + skin + aesthetic toggle, change event, cross-surface config, cross-tab sync, debug surface, drawer / modal / toast / tabs / menu / Cmd+K / settings-cog / app-switcher helpers |
| `skins/*.css` | 6 brand variants (default, warm-serif, midnight-mono, lavender, deep-navy, nord) |
| `RECIPES.md` | Decision guide for agents — page recipes, anti-patterns, debug checklist |
| `DESIGN.md` | Full token catalog, skin contract, state matrices, DNA Checklist, versioning policy |
| `CONTRIBUTING.md` | How to add a component or skin (naming rubric, DNA checklist, gates) |
| `MIGRATING.md` | Version-to-version upgrade notes |
| `CHANGELOG.md` | Per-release change log |
| `examples/` | Static HTML reference for every component and recipe |
| `scripts/` | Token + skin + class + contract CI gates |
| `ha-theme/glacial.yaml` | Home Assistant theme mapping |
| `tokens.json` | Public token snapshot (machine-readable) |
| `VERSION` | Current version (`2.7.0`) |

## Adopting in a new project

Paste this into the agent working in the new repo:

> Adopt glacial: vendor a tagged copy of `mmcphee624/glacial` v2.7.0 to `vendor/glacial/` (curl `https://github.com/mmcphee624/glacial/archive/v2.7.0.tar.gz`, extract). Link `vendor/glacial/glacial.css` and `vendor/glacial/glacial.js` from your app shell. Read `vendor/glacial/RECIPES.md` and pick the recipe matching the page you're building. Don't override `--accent` directly — write a skin under `vendor/glacial/skins/` if you need rebranding. Verify by checking `<html data-glacial-loaded>` is set and `window.glacial.help()` returns `{version: "2.7.0"}`.

## Theming

Three independent axes, all set on `<html>`:

```html
<html data-theme="dark" data-skin="warm-serif" data-aesthetic="hybrid">
```

| Axis | Values | Default |
|------|--------|---------|
| `data-theme` | `light` / `dark` (or unset → OS preference) | OS preference |
| `data-skin` | `default` / `warm-serif` / `midnight-mono` / `lavender` / `deep-navy` / `nord` / `cobalt` / `aqua` | `default` |
| `data-aesthetic` | unset (polished) / `hybrid` (brutalist edges on glass) | unset |

Set them programmatically:

```js
glacialToggleTheme();           // light ↔ dark
glacialSetSkin('warm-serif');   // any of the six
glacialSetAesthetic('hybrid');  // null reverts to polished
```

Or via URL params for ephemeral previews: `?theme=dark&skin=midnight-mono&aesthetic=hybrid`

Or drop in the **settings cog** for a ready-made control surface (theme segmented
control + skin swatches + aesthetic toggle), and the **app switcher** to launch
between surfaces. App-switcher tiles **carry the current appearance** to the next
surface (v2.7 — see below):

```js
glacialMountSettings('#settings-slot');        // injects the cog + popover
glacialAppSwitcher({                            // data-driven launcher tiles
  target: '#nav',
  services: [
    { name: 'App A',  url: 'https://a.example', description: 'An internal tool', status: 'green' },
    { name: 'App B',  url: 'https://b.example', description: 'Another surface',  status: 'yellow' },
    { name: 'Router', url: 'https://router.example', carry: false }  // non-glacial → not decorated
  ]
});
```

## Cross-surface appearance carry (v2.7, opt-in)

Make separate surfaces feel like one product: a theme/skin pick on one surface
**follows the user** to the next, carried as glacial's readable URL params through
the app-switcher. No shared cookie, no DNS, no proxy.

```js
// Decorate any outbound URL with the live theme/skin/aesthetic (omitting defaults):
glacialDecorateUrl('https://b.example/dash?tab=1#top');
// → 'https://b.example/dash?tab=1&skin=nord#top'  (when nord is the live skin)
```

The app-switcher calls this **at click time** for every glacial-aware tile, so the
carried pick is always current. Opt a link out with `carry: false` (per service)
or the whole switcher out with `carryAppearance: false`.

Optional config — set as a `window` global (or a `<meta name="...">` with the same
kebab-case name) **before** `glacial.js` loads. All default off/unset:

| Config | Effect |
|--------|--------|
| `GLACIAL_SHARED_THEME` | Truthy ⇒ write a single `glacial-theme` cookie instead of the per-service `{service}-theme`, **and** persist a carried-in `?theme/?skin/?aesthetic` param (validated against glacial's vocab) so a later cold reload keeps it. Reads honor both cookie names, so an already-saved theme migrates without a re-pick. |
| `GLACIAL_DEFAULT_THEME` | `'light'` / `'dark'` — a durable default until the user picks (outranks OS preference; a user pick wins). `'auto'` = follow OS (same as unset). |
| `GLACIAL_DEFAULT_SKIN` | A durable default skin until the user picks. Precedence: URL `?skin=` > cookie > `GLACIAL_DEFAULT_SKIN` > `'default'`. |

```html
<script>
  window.GLACIAL_SHARED_THEME  = true;        // one glacial-theme cookie + persist carried params
  window.GLACIAL_DEFAULT_THEME = 'auto';      // follow OS preference
  window.GLACIAL_DEFAULT_SKIN  = 'deep-navy'; // durable default skin
</script>
<script src="vendor/glacial/glacial.js"></script>
```

Same-origin tabs also stay live in sync over `BroadcastChannel('glacial')`.

> **Note:** with `GLACIAL_SHARED_THEME` on, a crafted `?skin=` link can set an
> opted-in site's appearance for that visitor — appearance-only, opt-in, validated
> against the known vocab (no cookie poisoning), non-sensitive. See `MIGRATING.md`.
> v2.6's `GLACIAL_COOKIE_DOMAIN` was **removed** in v2.7 (browsers reject a cookie
> scoped to a bare single-label TLD, so it silently failed) — `MIGRATING.md` has the
> footgun details.

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
