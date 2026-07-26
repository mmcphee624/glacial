# Glacial

Zero-build glass-morphism design system: raw `glacial.css` + `glacial.js`, no bundler, no
dependencies. Consumers vendor a tagged tarball and link two files — keep it that way. The
current version lives in `VERSION` (never hardcode it in docs; the README has drifted before).

## Reading path

`RECIPES.md` (copy-paste recipes + class index) → `examples/` (every component live) →
`DESIGN.md` (the spec + Skin Contract + DNA checklist). `starters/` are clone-and-ship pages;
`skins/` override tokens only; `ha-theme/` is the Home Assistant port.

## Develop + gate

Preview: `python3 -m http.server` → open `/examples/`. Before every push, run the CI gates
(bash + Node 18+, dependency-light; `.github/workflows/ci.yml` runs the same set):

```bash
bash scripts/snapshot-tokens.sh --check   # tokens.json matches glacial.css
bash scripts/diff-tokens.sh               # token renames carry a version bump
bash scripts/lint-skin.sh                 # skins override tokens only
bash scripts/check-classes.sh             # CLASSES[] all exist in CSS
node scripts/check-contract.mjs           # superset: classes, token refs, no color literals
node --check glacial.js                   # JS parses
node --test scripts/test-js.mjs           # JS unit tests (pure cores)
```

## Conventions (the load-bearing ones)

- **Tokens only** — no hex/rgba literals in component bodies (`#fff`/`#000` scrims and
  `transparent` are the only exceptions; `check-contract.mjs` enforces it).
- Naming: `.glacial-{name}`, `.glacial-{name}-{variant}`, `.glacial-{name}-{element}`.
  State order: native pseudo-classes → ARIA attributes → `[data-state]` → `.is-{state}`.
  JS behavior hooks use the `data-glacial-*` namespace.
- New component = CSS + `CLASSES[]` registration in `glacial.js` + spec section in
  `DESIGN.md` + class-index line in `RECIPES.md` + an example page.
- Gate motion behind `@media (prefers-reduced-motion: reduce)`.

## Release

SemVer + Keep-a-Changelog: bump `VERSION`, add the `CHANGELOG.md` entry, note breaking
upgrades in `MIGRATING.md`, tag `vX.Y.Z`. Token renames require a version bump
(`diff-tokens.sh` gate). Consumers pin tags — never point them at `main`.
