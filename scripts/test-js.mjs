#!/usr/bin/env node
/*
 * Glacial JS unit gate (v2.9.0). Pure Node, ZERO dependencies — the built-in
 * node:test runner (requires Node 18+). Covers the pure cores glacial.js exports
 * under CommonJS: decorateUrl (cross-surface appearance carry) and iconSvg (the
 * icon registry — escaping/coercion is a security boundary, since the output is
 * inserted via innerHTML). glacial.js exports the pure cores under CommonJS and
 * short-circuits its DOM IIFE when there is no `document`, so requiring it here
 * is side-effect-free.
 *
 *   node --test scripts/test-js.mjs      # or: node scripts/test-js.mjs
 *
 * Wired into CI alongside scripts/check-contract.mjs.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { decorateUrl, iconSvg } = require(join(ROOT, 'glacial.js'));

const DEF = { defaults: { skin: 'default' } };
// merge a partial pick onto the standard defaults
const pick = (o) => ({ ...DEF, ...o });

test('exports a pure decorateUrl function', () => {
  assert.equal(typeof decorateUrl, 'function');
});

// (a) no existing query — appends the readable params
test('(a) no existing query: appends ?theme&skin', () => {
  assert.equal(
    decorateUrl('https://example.com/x', pick({ theme: 'light', skin: 'nord' })),
    'https://example.com/x?theme=light&skin=nord'
  );
});

// (b) existing query — merges, keeping the existing param
test('(b) existing query: merges and keeps the prior param', () => {
  assert.equal(
    decorateUrl('https://example.com/x?foo=1', pick({ skin: 'nord' })),
    'https://example.com/x?foo=1&skin=nord'
  );
});

// (c) #hash present — params land BEFORE the fragment
test('(c) #hash present: params precede the fragment', () => {
  assert.equal(
    decorateUrl('https://example.com/x?foo=1#section', pick({ skin: 'nord' })),
    'https://example.com/x?foo=1&skin=nord#section'
  );
});

// (d) value == default — omitted (clean URLs in the common case)
test('(d) value equals default: omitted', () => {
  // skin == default skin → omit skin; theme auto → omit theme. Nothing to add.
  assert.equal(
    decorateUrl('https://example.com/', pick({ theme: 'auto', skin: 'default' })),
    'https://example.com/'
  );
  // only skin is non-default
  assert.equal(
    decorateUrl('https://example.com/', pick({ theme: 'auto', skin: 'nord' })),
    'https://example.com/?skin=nord'
  );
});

// (e) conflicting existing param — overwritten (current state wins)
test('(e) conflicting existing param: overwritten', () => {
  assert.equal(
    decorateUrl('https://example.com/x?theme=dark&skin=lavender', pick({ theme: 'light', skin: 'nord' })),
    'https://example.com/x?theme=light&skin=nord'
  );
  // a now-default value also CLEARS a stale conflicting param
  assert.equal(
    decorateUrl('https://example.com/x?skin=lavender', pick({ skin: 'default' })),
    'https://example.com/x'
  );
});

// (f) relative URL — stays relative, exact base preserved
test('(f) relative URL: form preserved', () => {
  assert.equal(
    decorateUrl('/dash?a=1#top', pick({ theme: 'dark', skin: 'nord' })),
    '/dash?a=1&theme=dark&skin=nord#top'
  );
  // bare-name relative (no leading slash) must NOT gain a slash
  assert.equal(
    decorateUrl('page.html', pick({ skin: 'nord' })),
    'page.html?skin=nord'
  );
  // protocol-relative must keep its host
  assert.equal(
    decorateUrl('//cdn.example.com/a', pick({ skin: 'nord' })),
    '//cdn.example.com/a?skin=nord'
  );
});

// (g) pre-encoded value — an unrelated encoded param survives the merge
test('(g) pre-encoded value: preserved through the merge', () => {
  const out = decorateUrl('https://example.com/s?q=a%26b', pick({ skin: 'nord' }));
  // the & inside the value stays encoded (not split into a new param), skin appended
  assert.equal(out, 'https://example.com/s?q=a%26b&skin=nord');
  const u = new URL(out);
  assert.equal(u.searchParams.get('q'), 'a&b');
  assert.equal(u.searchParams.get('skin'), 'nord');
});

// (h) idempotent — re-decorating doesn't double-add
test('(h) idempotent: re-decorate is a no-op', () => {
  const opts = pick({ theme: 'light', skin: 'nord' });
  const once = decorateUrl('https://example.com/x?foo=1#h', opts);
  const twice = decorateUrl(once, opts);
  assert.equal(twice, once);
  // each param appears exactly once
  const u = new URL(once);
  assert.equal(u.searchParams.getAll('skin').length, 1);
  assert.equal(u.searchParams.getAll('theme').length, 1);
});

// Guard rails: non-strings and non-editable schemes are returned untouched.
test('non-string and empty inputs returned as-is', () => {
  assert.equal(decorateUrl(null, pick({ skin: 'nord' })), null);
  assert.equal(decorateUrl(undefined, pick({ skin: 'nord' })), undefined);
  assert.equal(decorateUrl('', pick({ skin: 'nord' })), '');
});

// aesthetic carries only when set.
test('aesthetic carried when set, omitted when unset', () => {
  assert.equal(
    decorateUrl('https://example.com/', pick({ skin: 'nord', aesthetic: 'hybrid' })),
    'https://example.com/?skin=nord&aesthetic=hybrid'
  );
  assert.equal(
    decorateUrl('https://example.com/?aesthetic=hybrid', pick({ skin: 'nord' })),
    'https://example.com/?skin=nord'
  );
});

// ===== Icon core (v2.9.0) — pure iconSvg(name, opts) =====
// The returned string is inserted via innerHTML downstream (e.g. glacialPalette),
// so escaping + numeric coercion of caller-supplied opts is a security boundary,
// not polish. These cases lock that in.

test('iconSvg: exported pure function', () => {
  assert.equal(typeof iconSvg, 'function');
});

test('iconSvg: known name → glacial-icon svg, decorative by default', () => {
  const s = iconSvg('plus');
  assert.match(s, /^<svg /);
  assert.match(s, /class="glacial-icon"/);
  assert.match(s, /viewBox="0 0 24 24"/);
  assert.match(s, /aria-hidden="true"/);
  assert.doesNotMatch(s, /role="img"/);
});

test('iconSvg: alias resolves to the canonical glyph', () => {
  assert.equal(iconSvg('add'), iconSvg('plus')); // add → plus
});

test('iconSvg: unknown name → placeholder, never throws or blanks', () => {
  const s = iconSvg('totally-not-an-icon');
  assert.match(s, /^<svg /);
  assert.match(s, /class="glacial-icon"/);
  assert.ok(s.length > 20);
});

test('iconSvg: title → role=img + escaped <title> (XSS boundary)', () => {
  const s = iconSvg('x', { title: 'a"b<c>d&e\'f' });
  assert.match(s, /role="img"/);
  assert.match(s, /<title>.*<\/title>/);
  assert.doesNotMatch(s, /a"b<c>d&e'f/);          // raw payload must not survive
  for (const ent of ['&quot;', '&lt;', '&gt;', '&amp;', '&#39;']) assert.ok(s.includes(ent), ent);
});

test('iconSvg: class sanitized to safe tokens (no attribute breakout)', () => {
  const s = iconSvg('x', { class: 'my-class">"<script>' });
  const m = s.match(/class="([^"]*)"/);
  assert.ok(m, 'class attr is well-formed');
  assert.match(m[1], /^glacial-icon /);
  assert.doesNotMatch(m[1], /[<>"]/);
});

test('iconSvg: numeric opts coerced; junk never breaks an attribute', () => {
  const s = iconSvg('x', { size: '24"><script', strokeWidth: 'nope' });
  assert.doesNotMatch(s, /(width|height|stroke-width)="[^"]*[<>]/); // no <,> breakout in a value
  assert.doesNotMatch(s, /<script/);                                // junk tail dropped by parseFloat
  assert.doesNotMatch(s, /stroke-width=/);  // non-numeric → no attr (CSS token handles it)
  const ok = iconSvg('x', { size: 32, strokeWidth: 2 });
  assert.match(ok, /width="32" height="32"/);
  assert.match(ok, /stroke-width="2"/);
});

test('iconSvg: null/empty name → placeholder (defensive)', () => {
  assert.match(iconSvg(null), /class="glacial-icon"/);
  assert.match(iconSvg(''), /class="glacial-icon"/);
});
