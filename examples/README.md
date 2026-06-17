# Glacial Examples

Live reference pages for every Tier 1 component and page recipe. Open these in a browser to see what glacial looks like rendered, swap themes/skins on the fly, and copy markup into your own project.

## Run on Mac

From the **glacial repo root** (not from `examples/`):

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/examples/> in Safari or Chrome.

The examples reference `../glacial.css`, `../glacial.js`, and `../skins/*.css` — serving from the repo root keeps those paths resolvable. Don't `cd examples/` and run the server there or the asset paths break.

## Run on phone (over hotel wifi or any network)

### Option A — Same wifi (Mac LAN IP)

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Find your Mac's LAN IP: System Settings → Network → Wi-Fi → Details → IP Address.
On phone, open `http://<your-mac-ip>:8000/examples/`.

Hotel networks often block peer-to-peer. If that fails, use Option B.

### Option B — cloudflared tunnel (any network)

```bash
cloudflared tunnel --url http://localhost:8000
```

`cloudflared` will print a `https://*.trycloudflare.com` URL. Open that on your phone.

**Security note:** the cloudflared URL is **public and unauthenticated** for as long as the tunnel runs. Anyone with the URL can reach your local server. Treat the URL as ephemeral:
- Kill the cloudflared process when you're done (`Ctrl+C`).
- Don't bookmark the URL — it changes on every run.
- Run the server from the **repo root**, not your home directory, so the tunnel only exposes glacial — never `~/.ssh/`, `~/.aws/`, or other unrelated files.

## Skin + theme switching

Every example page has a persistent `[skin]` and `[theme]` selector in the header (cookie-backed, mirrors `glacialToggleTheme()`). You can also override via URL params:

- `examples/dashboard.html?skin=warm-serif&theme=dark`
- `examples/skins-preview.html?skin=nord`

URL params take precedence over cookies for that page load.

## Reduced-motion testing

To verify components respect `prefers-reduced-motion`:
1. Chrome DevTools → cmd-shift-P → "Show Rendering"
2. Set "Emulate CSS media feature prefers-reduced-motion" to `reduce`
3. Reload — aurora orbs should be absent, skeleton shimmer should be a static block.

## What each page demonstrates

| Page | Recipe | Components shown |
|---|---|---|
| `index.html` | (catalog) | Links to all pages, mobile QR for phone testing |
| `dashboard.html` | Dashboard recipe | metric × 4, alert, status-row, breadcrumbs, skeleton-to-real swap |
| `list.html` | List/index recipe | table with `data-priority`, filter-bar + filter-pills, breadcrumbs |
| `detail.html` | Detail recipe | breadcrumbs, metric, alert, status-row, spec grid |
| `form.html` | Form recipe | breadcrumbs, alert, glass card with inputs |
| `board.html` | Board recipe | 4-column glass cards, badges, filter-bar |
| `mobile.html` | Mobile audit | 44px touch-target check, table column-hide, filter-bar scroll-snap, breadcrumb truncation |
| `skins-preview.html` | (catalog) | Same dashboard rendered under the built-in skins side-by-side |
| `v2.6-continuity.html` | (feature) | Settings cog, app switcher, shared-theme config, cross-tab sync |
| `v2.7-appearance-carry.html` | (feature) | Cross-surface appearance carry: app-switcher click-time URL decoration, `glacialDecorateUrl`, `carry:false`, opt-in defaults |

## Verification

Run through this checklist before merging glacial v2:

- [ ] Every page renders correctly in light + dark
- [ ] Every page renders correctly with `?skin=warm-serif` (cream + serif headings)
- [ ] Every page renders correctly with `?skin=nord` (arctic frost + muted blue)
- [ ] Reduced-motion: orbs absent, skeleton static
- [ ] Mobile: tables hide priority-2 columns at <768px; touch targets ≥44px in `mobile.html`
- [ ] DevTools console shows `[glacial] v2.0.0 loaded · theme=… · skin=… · aurora=…`
- [ ] DevTools: `<html data-glacial-loaded="2.0.0">` is set
- [ ] DevTools: `window.glacial.help()` returns version + tokens
