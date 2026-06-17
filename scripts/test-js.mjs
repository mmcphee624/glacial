#!/usr/bin/env node
/*
 * Glacial JS unit gate (v2.7.0). Pure Node, ZERO dependencies — the built-in
 * node:test runner (requires Node 18+). Covers the pure decorateUrl core that
 * powers cross-surface appearance carry (window.glacialDecorateUrl / the
 * app-switcher). glacial.js exports the pure core under CommonJS and
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
const { decorateUrl } = require(join(ROOT, 'glacial.js'));

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
