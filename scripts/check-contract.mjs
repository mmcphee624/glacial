#!/usr/bin/env node
/*
 * Glacial contract checker (v2.4.0). Pure Node, no dependencies. Three checks:
 *
 *   1. Every name in glacial.js CLASSES[] has a matching `.name` selector in
 *      glacial.css (the debug surface can't lie about what exists).
 *   2. Every var(--x) referenced in glacial.css is declared in glacial.css
 *      (no dangling token references).
 *   3. No chromatic color literals inside component rule bodies — colors must
 *      come from tokens (DNA rule #5). Allowed: pure white/black/transparent,
 *      and any literal inside a token-declaration block (:root / [data-theme] /
 *      prefers-color-scheme / prefers-contrast) or inside url(...).
 *
 * Superset of scripts/check-classes.sh. Exit 1 on any violation.
 *   node scripts/check-contract.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(ROOT, 'glacial.css'), 'utf8');
const js = readFileSync(join(ROOT, 'glacial.js'), 'utf8');

let failures = 0;
const fail = (msg) => { console.error('  ✗ ' + msg); failures++; };

/* ---- Check 1: CLASSES[] subset of CSS selectors ---- */
const classBlock = (js.match(/var CLASSES = \[([\s\S]*?)\];/) || [, ''])[1];
const classNames = [...new Set([...classBlock.matchAll(/'(glacial-[a-z0-9-]+)'/g)].map((m) => m[1]))];
let c1 = 0;
for (const name of classNames) {
  const re = new RegExp('\\.' + name + '(?![\\w-])');
  if (re.test(css)) c1++;
  else fail(`CLASSES[] "${name}" has no .${name} selector in glacial.css`);
}

/* ---- Check 2: every var(--x) is declared ---- */
const declared = new Set([...css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]));
const referenced = new Set([...css.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)].map((m) => m[1]));
let c2 = 0;
for (const tok of referenced) {
  if (declared.has(tok)) c2++;
  else fail(`var(${tok}) referenced but never declared in glacial.css`);
}

/* ---- Check 3: no chromatic color literals in component bodies ---- */
// Blank out comments (keep newlines for line numbers) and url() contents
// (so the select chevron's data-URI SVG doesn't trip the scan).
const stripped = css
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/url\([^)]*\)/g, 'url()');

const ALLOWED_HEX = /^#(?:fff|ffffff|000|000000)$/i;
const isTokenBlock = (stack) =>
  stack.some((p) => /:root|\[data-theme|prefers-color-scheme|prefers-contrast/.test(p));

function checkDecl(decl, ln, stack) {
  if (isTokenBlock(stack)) return;
  for (const m of decl.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    if (!ALLOWED_HEX.test(m[0])) fail(`glacial.css:${ln} chromatic hex "${m[0]}" in a component body — use a token`);
  }
  for (const m of decl.matchAll(/(rgba?|hsla?)\(([^)]*)\)/g)) {
    const args = m[2].replace(/\s/g, '');
    const isBlack = /^0,0,0/.test(args);
    const isWhite = /^255,255,255/.test(args);
    if (!(isBlack || isWhite)) fail(`glacial.css:${ln} chromatic ${m[1]}() in a component body — use a token`);
  }
}

let line = 1;
let buf = '';
const stack = [];
for (let i = 0; i < stripped.length; i++) {
  const ch = stripped[i];
  if (ch === '\n') line++;
  if (ch === '{') { stack.push(buf.trim()); buf = ''; }
  else if (ch === '}') { stack.pop(); buf = ''; }
  else if (ch === ';') { checkDecl(buf, line, stack); buf = ''; }
  else buf += ch;
}

if (failures === 0) {
  console.log(`✓ check-contract: ${c1} classes ok, ${c2} token refs ok, no stray color literals`);
  process.exit(0);
}
console.error(`\ncheck-contract: ${failures} violation(s).`);
process.exit(1);
