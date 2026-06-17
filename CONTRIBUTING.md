# Contributing to Glacial

Glacial is a zero-build, vendored design system: raw `glacial.css` + `glacial.js`
copied into consumer projects. No bundler, no `node_modules`, no transpile step.
Keep it that way — the value is that any project can `curl` a tag and link two files.

## Run the gates before you push

All gates are fast and dependency-light (bash + Node, both preinstalled in CI):

```bash
bash scripts/snapshot-tokens.sh --check   # tokens.json matches glacial.css
bash scripts/diff-tokens.sh               # token renames carry a version bump
bash scripts/lint-skin.sh                 # skins override tokens only
bash scripts/check-classes.sh             # CLASSES[] all exist in CSS
node scripts/check-contract.mjs           # superset: classes, token refs, no color literals
node --check glacial.js                   # JS parses
node --test scripts/test-js.mjs           # JS unit tests (pure decorateUrl core)
```

CI (`.github/workflows/ci.yml`) runs the same set on every push and PR.

**Node 18+** is required for the unit gate — it uses the built-in `node:test`
runner (no dev dependencies, in keeping with the zero-build rule). The unit
suite covers the pure, side-effect-free cores (today: `decorateUrl`, which
powers the v2.7 cross-surface appearance carry). `glacial.js` exports those cores
under CommonJS and skips its DOM IIFE when there's no `document`, so requiring it
from a test is safe. If you add a pure helper, add a `node:test` case for it here.

## Adding a component

1. **Name it by the rubric** (see `DESIGN.md` → Naming Rubric):
   `.glacial-{name}`, `.glacial-{name}-{variant}`, `.glacial-{name}-{element}`.
2. **Mark state in this order**: native pseudo-classes (`:hover`,
   `:focus-visible`, `:checked`, `[disabled]`) → ARIA (`[aria-current]`,
   `[aria-selected]`, `[aria-invalid]`, `[aria-expanded]`) → `[data-state]` →
   `.is-{state}`. JS behavior hooks use the `data-glacial-*` namespace.
3. **Pass the DNA Checklist** (`DESIGN.md` → Glacial DNA Checklist). The
   load-bearing one: **tokens only — no hex/rgba literals in component bodies.**
   Pure `#fff` / `#000` / `rgba(0,0,0,…)` scrims and `transparent` are the only
   exceptions, and `check-contract.mjs` enforces this.
4. **Gate motion** behind `@media (prefers-reduced-motion: reduce)`.
5. **Register the class** in the `CLASSES[]` array in `glacial.js` (powers
   `window.glacial.help()`); `check-classes.sh` fails if it has no CSS rule.
6. **Document** it: a spec section in `DESIGN.md`, a class-index line in
   `RECIPES.md`, and an example in `examples/`.
7. **Bump the version**: adding tokens or classes is a MINOR bump; removing a
   public token/class is MAJOR (with one MINOR deprecation cycle first). Update
   `VERSION`, the `@version` headers, `CHANGELOG.md`, and `MIGRATING.md`, then
   re-run `snapshot-tokens.sh` to regenerate `tokens.json`.

## Authoring a skin

Skins live in `skins/*.css` and **override token values only** — never target
`.glacial-*` internals. Ship all three blocks (light, manual-dark, OS-dark) per
the Skin Contract in `DESIGN.md`. Start from `skins/_template.css`. If you
genuinely must override a class internal (e.g. serif headings), add a
`SKIN-EXCEPTION:` comment above the rule; `lint-skin.sh` warns instead of failing.

## Accessibility expectations

- Visible labels (no placeholder-as-label), `aria-invalid` on bad fields.
- Keyboard paths for every interactive component (Tab, Esc, arrows where they
  apply); icon-only controls get an `aria-label`.
- Touch targets ≥ 44px.
- Color from tokens so `prefers-contrast: more` and the skins both work.
- Honor `prefers-reduced-motion`.

## Voice for docs

Lead with the point, name real classes and tokens, no filler. Match the existing
tone in `DESIGN.md` and `RECIPES.md`.
