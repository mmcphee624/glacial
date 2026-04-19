# Glacial Design System

A glass morphism design system with aurora effects and dual-theme support (light/dark). Drop `glacial.css` and `glacial.js` into any web project for frosted glass cards, animated aurora backgrounds, and a complete token system.

## Product Context
- **What this is:** A reusable design system for web dashboards and tools
- **Who it's for:** Developers building data-dense UIs that should feel alive, not sterile
- **Space:** Developer tools / dashboards / internal apps
- **Project type:** Web app dashboards, boards, and data views

## Aesthetic Direction
- **Direction:** Glass Hybrid — frosted glass morphism that adapts between two distinct moods
- **Light mode:** Frosted glass cards on a soft teal-tinted gradient. Clean, professional, approachable. Subtle radial gradient washes add depth without competing with content.
- **Dark mode:** Aurora glass. Near-black background with slow-moving colored orbs (purple, blue, teal). Transparent cards with backdrop blur. Neon status colors that pop against the dark glass.
- **Decoration level:** Intentional — glass effects and subtle background treatment provide depth without clutter
- **Mood:** Technical but alive. A control panel that feels good to look at, not just functional.

## Typography
- **Display/Body:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` — system fonts for zero latency, native feel
- **Monospace:** `'SF Mono', Menlo, Consolas, monospace` — used for labels, badges, nav items, metadata, and anything "technical"
- **Loading:** None required (system fonts)
- **Scale:**
  - Page title: 18px, weight 700
  - Section header: 13-15px, weight 700
  - Body: 13px, weight 400
  - Labels/nav: 11px, weight 600, monospace, letter-spacing 0.5px
  - Column headers/section titles: 10px, weight 700, monospace, uppercase, letter-spacing 1.5px
  - Badges: 9-10px, weight 700, monospace, uppercase, letter-spacing 0.5px
  - Logo: 13px, weight 700, monospace, letter-spacing 1px

## Color

### Light Theme
```css
--bg: #eef1f5;
--bg-card: rgba(255,255,255,0.6);
--bg-card-hover: rgba(255,255,255,0.78);
--bg-header: rgba(255,255,255,0.65);
--bg-input: rgba(255,255,255,0.75);
--border: rgba(255,255,255,0.35);
--border-card: rgba(0,184,212,0.1);
--border-hover: rgba(0,184,212,0.25);
--text: #3a3a42;
--text-strong: #1a1a22;
--text-secondary: #5a5a66;
--text-muted: #888;
--text-faint: #aaa;
--accent: #00b8d4;                    /* Teal — the signature color */
--accent-bg: rgba(0,184,212,0.08);
--accent-border: rgba(0,184,212,0.3);
--green: #16a34a;
--green-bg: rgba(22,163,74,0.1);
--yellow: #d97706;
--yellow-bg: rgba(217,119,6,0.1);
--red: #dc2626;
--red-bg: rgba(220,38,38,0.1);
--blue: #2563eb;
--blue-bg: rgba(37,99,235,0.1);
--shadow: 0 2px 12px rgba(0,0,0,0.04);
```

Light mode background treatment: subtle radial gradients of teal at ~5-7% opacity, creating a soft wash behind the glass cards.

### Dark Theme
```css
--bg: #111114;
--bg-card: rgba(255,255,255,0.06);
--bg-card-hover: rgba(255,255,255,0.10);
--bg-header: rgba(12,12,15,0.85);
--bg-input: rgba(255,255,255,0.06);
--border: rgba(255,255,255,0.08);
--border-card: rgba(255,255,255,0.06);
--border-hover: rgba(0,229,255,0.2);
--text: #c8c8d0;
--text-strong: #f0f0f5;
--text-secondary: #888;
--text-muted: #666;
--text-faint: #444;
--accent: #00e5ff;                    /* Bright cyan — elevated teal for dark backgrounds */
--accent-bg: rgba(0,229,255,0.08);
--accent-border: rgba(0,229,255,0.25);
--green: #39ff14;                     /* Neon green */
--green-bg: rgba(57,255,20,0.08);
--yellow: #fbbf24;                    /* Golden yellow */
--yellow-bg: rgba(251,191,36,0.08);
--red: #ff4444;                       /* Bright red */
--red-bg: rgba(255,68,68,0.08);
--blue: #60a5fa;
--blue-bg: rgba(96,165,250,0.08);
--shadow: none;                       /* No shadows in dark mode, only borders and blur */
```

Dark mode background: aurora orbs (see Effects section).

### Status Color Semantics
These are consistent across themes (values shift for dark mode readability):
- **Green:** Success, approved, completed, healthy
- **Teal/Cyan (accent):** Active, in-progress, primary actions, links
- **Yellow/Amber:** Warning, intake, pending, needs attention
- **Red:** Error, failed, rejected, critical priority
- **Blue:** Review, informational

## Glass Effect
The defining visual element. Every surface (cards, headers, inputs) uses this pattern:

```css
background: var(--bg-card);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid var(--border-card);
border-radius: 8px;
```

Headers get a slightly different treatment:
```css
background: var(--bg-header);
backdrop-filter: blur(20px);
border-bottom: 1px solid var(--border);
```

## Aurora Effects (Dark Mode Only)

Animated background orbs that create a living aurora effect:

```css
.aurora-container {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

/* Three orbs: purple, blue, teal */
.orb-1 { background: #7c3aed; opacity: 0.15; filter: blur(120px); animation: float1 80s infinite ease-in-out; }
.orb-2 { background: #2563eb; opacity: 0.10; filter: blur(120px); animation: float2 60s infinite ease-in-out; }
.orb-3 { background: #14b8a6; opacity: 0.08; filter: blur(120px); animation: float3 70s infinite ease-in-out; }
```

Orb animations should be slow (60-80s cycles), smooth, and travel +/-50-150px. They create atmosphere without distracting from content.

Toggle aurora visibility with CSS custom property: `opacity: var(--orb-opacity)` (0 in light, 1 in dark).

## Spacing
- **Base unit:** 4px
- **Density:** Compact — these are data-dense tools, not marketing sites
- **Scale:** 4, 8, 12, 16, 20, 24, 32, 48px
- **Card padding:** 12px
- **Card gap:** 8px
- **Container padding:** 20px (12px on mobile)
- **Header height:** 48px

## Layout
- **Approach:** Grid-disciplined
- **Board grids:** 4 columns (2 on tablet, 1 on mobile)
- **Container max-width:** 700px (forms/detail), 900px (lists), 1100-1200px (boards)
- **Border radius:** 4px (badges), 8px (cards, inputs, buttons), 12px (modals)
- **Responsive breakpoints:** 768px (tablet), 480px (mobile)

## Components

### Badges
```css
font-family: monospace stack;
font-size: 9px;
font-weight: 700;
letter-spacing: 0.5px;
padding: 2px 7px;
border-radius: 3px;
text-transform: uppercase;
/* Color: semantic color on matching -bg */
```

### Buttons
```css
padding: 8px 16px;
border-radius: 6px;
font-weight: 600;
transition: all 0.15s;
/* Primary: accent background, inverted text */
/* Secondary: transparent, accent text, border on hover */
```

### Priority Dots
```css
width: 6px; height: 6px;
border-radius: 50%;
/* Dark mode: add box-shadow glow matching the dot color at 30-40% opacity */
```

### Nav Links
```css
font-family: monospace stack;
font-size: 11px;
font-weight: 600;
letter-spacing: 0.5px;
padding: 6px 12px;
border-radius: 4px;
/* Active: accent color, accent-bg background, accent-border */
```

### Theme Toggle
- Store preference in cookie: `{service}-theme` (e.g., `ctrl-theme`, `scotty-theme`)
- Set `data-theme` attribute on `<html>` element
- Icons: sun for light, moon for dark
- Apply theme before page render (script in `<head>`) to prevent flash

## HA Integration

Home Assistant uses a dedicated theme file (`themes/glacial.yaml`) loaded via `!include_dir_merge_named themes`. The theme maps Glacial tokens to HA's CSS custom properties for both light and dark modes.

### card-mod Glass Presets

For full glass effect on HA cards, use card-mod (already installed via HACS):

```yaml
# Frosted glass card
card_mod:
  style: |
    ha-card {
      background: rgba(255,255,255,0.06) !important;
      backdrop-filter: blur(20px) !important;
      -webkit-backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(255,255,255,0.06) !important;
      border-radius: 8px !important;
    }
```

```yaml
# Accent-bordered card
card_mod:
  style: |
    ha-card {
      background: rgba(255,255,255,0.06) !important;
      backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(0,229,255,0.25) !important;
      border-radius: 8px !important;
    }
```

Note: HA's theme system doesn't support animated backgrounds or backdrop-filter natively. These card-mod snippets add glass effects to individual cards. Full aurora orbs require custom dashboard panels or the standalone dashboard.

## Motion
- **Approach:** Minimal-functional + aurora
- **Card hover:** `transition: all 0.15s` (background, border, transform)
- **Theme transition:** `transition: background-color 0.3s, color 0.3s`
- **Aurora orbs:** 60-80s infinite ease-in-out (the only expressive animation)
- **Easing:** `ease-in-out` for orbs, `ease` for UI transitions
- **No shadows in dark mode.** Borders and blur handle visual separation.

## Accessibility
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables orb animations in CSS. JS checks `matchMedia('(prefers-reduced-motion: reduce)')` and skips orb DOM injection entirely.
- **Color contrast:** Light mode text (#3a3a42) on light bg (#eef1f5) meets WCAG AA. Dark mode text (#c8c8d0) on dark bg (#111114) meets WCAG AA. Neon status colors are used on near-black backgrounds for strong contrast.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-14 | Glass Hybrid direction chosen | Unifies Scotty/CTRL teal app style with Aurora Glass dashboard effects |
| 2026-04-14 | System fonts kept | Zero latency, native feel, no font management overhead |
| 2026-04-14 | Dual-theme with aurora | Light mode for day use, dark aurora for night. Toggle persists per-service. |
| 2026-04-14 | Neon status colors in dark mode | Standard semantic colors get elevated brightness in dark mode for readability on near-black |
| 2026-04-14 | Service icon colors stay hardcoded | HA blue, Pi-hole red, Grafana orange, etc. are external brand colors, not Glacial tokens |
| 2026-04-14 | Dashboard keeps 16px border-radius | Larger cards on the dashboard suit the bigger radius |
| 2026-04-14 | Dashboard keeps 4th orb (amber) | Part of the aurora character, spec includes 3 core orbs but dashboard adds a 4th |
