/**
 * Glacial Design System — Theme + Skin + Aesthetic + Aurora + Debug + Tier 2/3 helpers
 * @version 2.9.0
 *
 * Include via <script src="glacial.js"></script>
 * Provides:
 *   - window.glacialToggleTheme()
 *   - window.glacialSetSkin(name)
 *   - window.glacialSetAesthetic(name)            (v2.1.0)
 *   - window.glacialOpenDrawer(idOrEl)            (v2.1.0)
 *   - window.glacialCloseDrawer(idOrEl?)          (v2.1.0)
 *   - window.glacialPalette({ items, onSelect })  (v2.1.0 — Cmd+K helper)
 *   - window.glacialOnThemeChange(cb)             (v2.4.0 — theme/skin/aesthetic change event)
 *   - window.glacialOpenModal(idOrEl)             (v2.4.0)
 *   - window.glacialCloseModal(idOrEl?)           (v2.4.0)
 *   - window.glacialToast({ message, variant })   (v2.4.0)
 *   - window.glacialMountSettings(target, opts?)  (v2.6.0 — cog + theme/skin/aesthetic popover)
 *   - window.glacialAppSwitcher({ services, target }) (v2.6.0 — app launcher tiles)
 *   - window.glacialDecorateUrl(url)              (v2.7.0 — carry live theme/skin/aesthetic as URL params)
 *   - window.glacial.help()
 *
 * Sets <html data-glacial-loaded="2.9.0"> before first paint.
 *
 * Theme/skin priority (highest first):
 *   1. URL params:  ?theme=light|dark · ?skin=<name> · ?aesthetic=<name>
 *   2. Cookie:      {service}-theme (or shared glacial-theme) · glacial-skin
 *   3. GLACIAL_DEFAULT_THEME ('light'|'dark', or 'auto' = follow OS) / GLACIAL_DEFAULT_SKIN
 *   4. OS pref:     prefers-color-scheme (theme only; skin defaults to "default")
 *
 * Optional config (window globals or <meta name="..."> equivalents — all default
 * off/unset, so existing consumers are unchanged):
 *   - GLACIAL_SHARED_THEME  — use one `glacial-theme` cookie, not per-service     (v2.6.0)
 *   - GLACIAL_DEFAULT_THEME — 'light'|'dark' forced default, or 'auto'=follow OS   (v2.6.0; 'auto' v2.7.0)
 *   - GLACIAL_DEFAULT_SKIN  — durable default skin until a user picks             (v2.7.0)
 *
 * Cross-surface appearance carry (v2.7.0): glacialDecorateUrl(url) appends the
 * live theme/skin/aesthetic as glacial's readable ?theme/?skin/?aesthetic params,
 * omitting any value that equals the destination default. The app-switcher
 * decorates glacial-aware tile URLs at CLICK time, so a hop to a sibling surface
 * carries the current pick. With GLACIAL_SHARED_THEME on, a carried param is
 * validated against the known vocab and persisted to this surface's host-only
 * cookie on the next surface's boot.
 *
 * Storage degrades gracefully: cookie → sessionStorage → in-memory if both blocked.
 * Same-origin tabs stay live in sync via BroadcastChannel('glacial') (v2.6.0).
 *
 * See DESIGN.md for full specification.
 */

/* =========================================================================
 * Pure core: decorateUrl  (v2.7.0)
 * -------------------------------------------------------------------------
 * Side-effect-free. No DOM, no globals, no cookies — just URL string work, so
 * it is unit-testable under node:test (see scripts/test-js.mjs). The browser
 * wrapper window.glacialDecorateUrl reads live <html> state and calls this.
 *
 *   glacialDecorateUrlCore(url, { theme, skin, aesthetic, defaults })
 *
 * Appends glacial's EXISTING readable params (?theme=&skin=&aesthetic=),
 * merging with any existing query, placing them BEFORE a #hash. Rules:
 *   - OVERWRITE any theme/skin/aesthetic already on the URL (current state wins).
 *   - OMIT a value that equals the destination default:
 *       · skin      → omit when it === defaults.skin (the configured default skin)
 *       · theme     → omit when auto/unset (only 'light'/'dark' are written)
 *       · aesthetic → omit when unset/empty
 *   - Idempotent: re-decorating an already-decorated URL doesn't double-add.
 *   - Handles relative URLs and already-encoded values safely.
 * Returns the original string unchanged if it can't be parsed as a URL.
 * ========================================================================= */
var glacialDecorateUrlCore = (function () {
  'use strict';

  // Split a URL string into [base, query, hash], preserving the base EXACTLY
  // (scheme/host/path or relative form — leading-slash, ./, //host, bare name,
  // or empty). We edit only the query, then reassemble, so a relative URL stays
  // relative and a protocol-relative or fragment-only URL keeps its shape. We
  // deliberately avoid round-tripping through new URL() with a sentinel base,
  // which would force an absolute pathname and corrupt relative inputs.
  function split(url) {
    var hash = '';
    var hashAt = url.indexOf('#');
    if (hashAt !== -1) { hash = url.slice(hashAt); url = url.slice(0, hashAt); }
    var query = '';
    var qAt = url.indexOf('?');
    if (qAt !== -1) { query = url.slice(qAt + 1); url = url.slice(0, qAt); }
    return { base: url, query: query, hash: hash };
  }

  function decorate(url, opts) {
    if (typeof url !== 'string' || url === '') return url;
    opts = opts || {};
    var defaults = opts.defaults || {};
    var defaultSkin = defaults.skin || 'default';

    var parts = split(url);
    var params;
    try {
      params = new URLSearchParams(parts.query);
    } catch (e) {
      return url; // unparseable query — leave the URL untouched
    }

    // theme: only 'light'/'dark' are explicit picks worth carrying. Anything
    // else (auto/unset/empty) means "no pick" → omit AND clear any stale value.
    if (opts.theme === 'light' || opts.theme === 'dark') {
      params.set('theme', opts.theme);
    } else {
      params.delete('theme');
    }

    // skin: carry unless it equals the destination default skin (clean URLs in
    // the common case). Omit + clear when default/unset.
    if (opts.skin && opts.skin !== defaultSkin) {
      params.set('skin', opts.skin);
    } else {
      params.delete('skin');
    }

    // aesthetic: carry only when set (unset === polished default).
    if (opts.aesthetic) {
      params.set('aesthetic', opts.aesthetic);
    } else {
      params.delete('aesthetic');
    }

    // Reassemble: base + ?query (only if any params remain) + #hash. Params land
    // BEFORE the hash; URLSearchParams.toString() encodes values safely, so the
    // result is correctly merged and idempotent on re-decorate.
    var qs = params.toString();
    return parts.base + (qs ? '?' + qs : '') + parts.hash;
  }

  return decorate;
})();

// ===== Icon system pure core (v2.9.0) =====
// Inline line-icon registry + a pure iconSvg(name, opts) returning an
// '<svg class="glacial-icon">…</svg>' string. Pure + DOM-free so it's
// node:test-able and reusable (palette icons, starters). SECURITY: the returned
// string is inserted via innerHTML downstream (e.g. glacialPalette), so every
// caller-supplied opt (title/class/size/strokeWidth) is HTML-escaped or
// numerically coerced here — only the registry's own hardcoded markup is
// trusted. Glyphs are a 24×24 grid designed at stroke 1.5 (applied via the
// .glacial-icon class / --icon-stroke token); fill="none" line strokes with a
// small fill-hybrid subset for dense status glyphs.
var glacialIconCore = (function () {
  'use strict';

  // Curated 41-glyph line set (v1.0.0) — 24×24 grid, designed at stroke 1.5,
  // round caps/joins, currentColor. Stroke-only except small filled shapes
  // (fill="currentColor" stroke="none") for 16px legibility: info-circle,
  // alert-triangle, dot, list bullets, server status dots, more-horizontal.
  // Entries are inner markup only — the wrapper adds <svg>/viewBox/stroke.
  var REGISTRY = {
    // nav
    'home': '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/>',
    'search': '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    'menu': '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
    'dashboard': '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    'list': '<circle cx="5" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="5" cy="17" r="1.1" fill="currentColor" stroke="none"/><path d="M9.5 7H20"/><path d="M9.5 12H20"/><path d="M9.5 17H20"/>',
    'settings': '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3.2M12 18v3.2M21.2 12H18M6 12H2.8M18.5 5.5l-2.2 2.2M7.7 16.3l-2.2 2.2M18.5 18.5l-2.2-2.2M7.7 7.7 5.5 5.5"/>',
    'user': '<circle cx="12" cy="8" r="3.6"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
    'bell': '<path d="M17 9.5A5 5 0 0 0 7 9.5c0 5.2-2.2 6.8-2.2 6.8h14.4S17 14.7 17 9.5Z"/><path d="M10.2 19.5a2 2 0 0 0 3.6 0"/>',
    'folder': '<path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h3.6l2 2.4H19A1.5 1.5 0 0 1 20.5 9.9v7.6A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5Z"/>',
    // status
    'check-circle': '<circle cx="12" cy="12" r="8.5"/><path d="m8.4 12.2 2.4 2.4 4.8-5.2"/>',
    'alert-triangle': '<path d="M10.3 4.9 2.7 18.3a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.9a2 2 0 0 0-3.4 0Z"/><path fill="currentColor" stroke="none" d="M11 10h2v4.2h-2z"/><circle cx="12" cy="17.3" r="1.1" fill="currentColor" stroke="none"/>',
    'info-circle': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="8" r="1.1" fill="currentColor" stroke="none"/><path fill="currentColor" stroke="none" d="M11 11h2v6h-2z"/>',
    'x-circle': '<circle cx="12" cy="12" r="8.5"/><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6"/>',
    'clock': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2V12l3.2 2"/>',
    'activity': '<path d="M3 12h3.8l2.4-6 3.8 12 2.4-6H21"/>',
    'shield': '<path d="M12 3.5 19 6v5c0 4.5-3 7.6-7 9.5-4-1.9-7-5-7-9.5V6Z"/>',
    'dot': '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>',
    'server': '<rect x="4" y="4.5" width="16" height="6" rx="1.5"/><rect x="4" y="13.5" width="16" height="6" rx="1.5"/><circle cx="7.5" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="7.5" cy="16.5" r="1.1" fill="currentColor" stroke="none"/>',
    // actions
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'edit': '<path d="M4 20.5 8.2 19 18.6 8.6a1.5 1.5 0 0 0 0-2.2l-1-1a1.5 1.5 0 0 0-2.2 0L5 15.8Z"/><path d="m14.3 6.7 3 3"/>',
    'trash': '<path d="M4.5 7h15"/><path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7"/><path d="M6.8 7l.9 11.6A1.6 1.6 0 0 0 9.3 20h5.4a1.6 1.6 0 0 0 1.6-1.4L17.2 7"/><path d="M10.2 10.5v5.5M13.8 10.5v5.5"/>',
    'download': '<path d="M12 4v10.5"/><path d="m7.8 10.5 4.2 4.2 4.2-4.2"/><path d="M5 19.5h14"/>',
    'upload': '<path d="M12 14.5V4"/><path d="m7.8 8.2 4.2-4.2 4.2 4.2"/><path d="M5 19.5h14"/>',
    'copy': '<rect x="8.5" y="8.5" width="11" height="11" rx="1.8"/><path d="M15.5 8.5V6A1.5 1.5 0 0 0 14 4.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
    'external-link': '<path d="M13.5 4.5H19.5V10.5"/><path d="M19.5 4.5 12 12"/><path d="M17.5 13.2V18a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V8A1.5 1.5 0 0 1 6 6.5h4.8"/>',
    'filter': '<path d="M4.5 6.2h15l-5.7 6.9V19l-3.6 1.6v-7.5Z"/>',
    'refresh': '<path d="M19.8 11A7.8 7.8 0 0 0 6.4 6.2L4.5 8"/><path d="M4.5 4.2V8h3.8"/><path d="M4.2 13A7.8 7.8 0 0 0 17.6 17.8L19.5 16"/><path d="M19.5 19.8V16h-3.8"/>',
    'x': '<path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8"/>',
    'check': '<path d="m5 12.5 4.5 4.5L19 6.5"/>',
    'more-horizontal': '<circle cx="5.5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
    // arrows
    'arrow-up': '<path d="M12 19.5V5"/><path d="m6.5 10.5 5.5-5.5 5.5 5.5"/>',
    'arrow-down': '<path d="M12 4.5V19"/><path d="m6.5 13.5 5.5 5.5 5.5-5.5"/>',
    'arrow-left': '<path d="M19.5 12H5"/><path d="m10.5 6.5-5.5 5.5 5.5 5.5"/>',
    'arrow-right': '<path d="M4.5 12H19"/><path d="m13.5 6.5 5.5 5.5-5.5 5.5"/>',
    'chevron-up': '<path d="m6 15 6-6 6 6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-left': '<path d="m15 6-6 6 6 6"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    // data
    'bar-chart': '<rect x="4.5" y="10.5" width="4" height="9" rx="0.8"/><rect x="10" y="5.5" width="4" height="14" rx="0.8"/><rect x="15.5" y="13.5" width="4" height="6" rx="0.8"/>',
    'calendar': '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 9.7h16"/><path d="M8.5 3.5v4M15.5 3.5v4"/>',
    'database': '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.6 3.1 2.9 7 2.9s7-1.3 7-2.9V6"/><path d="M5 12v6c0 1.6 3.1 2.9 7 2.9s7-1.3 7-2.9v-6"/>'
  };

  // Common synonyms → canonical name, so a near-miss guess still resolves.
  var ALIASES = {
    'gear': 'settings', 'cog': 'settings', 'magnifier': 'search',
    'delete': 'trash', 'bin': 'trash', 'dismiss': 'x', 'close': 'x', 'add': 'plus',
    'pencil': 'edit', 'kebab': 'more-horizontal', 'more': 'more-horizontal',
    'ellipsis': 'more-horizontal', 'warning': 'alert-triangle', 'warn': 'alert-triangle',
    'success': 'check-circle', 'error': 'x-circle', 'info': 'info-circle',
    'caret-down': 'chevron-down', 'caret-up': 'chevron-up',
    'caret-left': 'chevron-left', 'caret-right': 'chevron-right',
    'analytics': 'bar-chart', 'chart': 'bar-chart', 'db': 'database',
    'pulse': 'activity', 'profile': 'user', 'notification': 'bell', 'grid': 'dashboard'
  };

  function escAttr(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function finiteNum(v) {
    var n = typeof v === 'number' ? v : parseFloat(v);
    return isFinite(n) ? n : null;
  }
  function canonical(name) {
    var key = String(name == null ? '' : name).toLowerCase().trim();
    if (Object.prototype.hasOwnProperty.call(REGISTRY, key)) return key;
    if (Object.prototype.hasOwnProperty.call(ALIASES, key) &&
        Object.prototype.hasOwnProperty.call(REGISTRY, ALIASES[key])) return ALIASES[key];
    return null;
  }

  // Visible placeholder for an unknown name — never throws, never silently blank.
  var PLACEHOLDER = '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M9 9l6 6M15 9l-6 6"/>';

  function iconSvg(name, opts) {
    opts = opts || {};
    var key = canonical(name);
    var body = key ? REGISTRY[key] : PLACEHOLDER;

    var cls = 'glacial-icon';
    if (opts['class'] != null) {
      // class tokens only — strip anything that could break out of the attribute
      var safe = String(opts['class']).replace(/[^a-zA-Z0-9 _-]/g, '').trim();
      if (safe) cls += ' ' + safe;
    }

    var attrs = ' class="' + cls + '" viewBox="0 0 24 24"';
    var sz = finiteNum(opts.size);
    if (sz && sz > 0) attrs += ' width="' + sz + '" height="' + sz + '"';
    var sw = finiteNum(opts.strokeWidth);
    if (sw && sw > 0) attrs += ' stroke-width="' + sw + '"';

    var titleEl = '';
    if (opts.title != null && String(opts.title) !== '') {
      attrs += ' role="img"';
      titleEl = '<title>' + escAttr(opts.title) + '</title>';
    } else {
      attrs += ' aria-hidden="true" focusable="false"';
    }

    return '<svg' + attrs + '>' + titleEl + body + '</svg>';
  }

  // inner markup only (no <svg> wrapper) — '' for an unknown name.
  function iconInner(name) {
    var key = canonical(name);
    return key ? REGISTRY[key] : '';
  }

  return {
    iconSvg: iconSvg,
    iconInner: iconInner,
    names: function () { return Object.keys(REGISTRY); },
    has: function (name) { return canonical(name) !== null; }
  };
})();

// Export the pure core for node:test (CommonJS). When required under node there
// is no DOM, so the browser IIFE below short-circuits — only the pure function
// is exposed. In the browser this guard is a no-op (no module global).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { decorateUrl: glacialDecorateUrlCore, iconSvg: glacialIconCore.iconSvg, iconInner: glacialIconCore.iconInner };
}

(function () {
  'use strict';

  // node/SSR guard: the rest of glacial is DOM-only. Under node:test (require),
  // there is no document — bail so importing for the pure-core test is safe.
  if (typeof document === 'undefined') return;

  var VERSION = '2.9.0';

  // ===== Optional config (v2.6.0) =====
  // Read from a window global, falling back to <meta name="..."> content. All
  // unset by default ⇒ behavior unchanged for existing consumers. These are the
  // ONLY config inputs glacial reads; everything else stays zero-config.
  function configValue(globalKey, metaName) {
    try {
      if (typeof window[globalKey] !== 'undefined' && window[globalKey] !== null) {
        return window[globalKey];
      }
    } catch (e) {}
    try {
      var meta = document.querySelector('meta[name="' + metaName + '"]');
      if (meta) {
        var c = meta.getAttribute('content');
        return c === null ? null : c;
      }
    } catch (e) {}
    return null;
  }
  function configTruthy(globalKey, metaName) {
    var v = configValue(globalKey, metaName);
    if (v === null) return false;
    if (typeof v === 'string') {
      var low = v.toLowerCase();
      return !(low === '' || low === 'false' || low === '0' || low === 'off' || low === 'no');
    }
    return !!v;
  }

  var SHARED_THEME = configTruthy('GLACIAL_SHARED_THEME', 'glacial-shared-theme');
  // 'auto' (v2.7.0) means "no forced default — follow OS preference"; treated the
  // same as unset so a consumer can declare auto explicitly. Only 'light'/'dark'
  // pin a durable default.
  var DEFAULT_THEME = (function () {
    var v = configValue('GLACIAL_DEFAULT_THEME', 'glacial-default-theme');
    return (v === 'light' || v === 'dark') ? v : null;
  })();
  // v2.7.0 — durable default skin until a user picks. Validated to glacial's
  // skin-name shape (alphanum/dash); anything else is ignored so a bad meta/global
  // can't set a junk [data-skin].
  var DEFAULT_SKIN = (function () {
    var v = configValue('GLACIAL_DEFAULT_SKIN', 'glacial-default-skin');
    return (typeof v === 'string' && /^[a-z0-9-]+$/i.test(v)) ? v : null;
  })();

  // ===== Storage with graceful degradation =====
  // Try cookie first (persistent across tabs); fall back to sessionStorage
  // (Safari private mode / cookies blocked); fall back to in-memory.
  var memStore = {};

  function getCookie(name) {
    try {
      var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    } catch (e) { return null; }
  }
  function setCookie(name, value) {
    try {
      // Host-only cookie (no domain=). v2.6.0's GLACIAL_COOKIE_DOMAIN was removed
      // in v2.7.0: browsers reject a domain scoped to a bare single-label TLD
      // (e.g. domain=.lan), which silently broke the write. Cross-surface carry is
      // now done via URL params (glacialDecorateUrl), not a shared cookie domain.
      var cookie = name + '=' + value + ';path=/;max-age=31536000;SameSite=Lax';
      document.cookie = cookie;
      return true;
    } catch (e) { return false; }
  }
  function getSession(key) {
    try { return window.sessionStorage.getItem(key); }
    catch (e) { return null; }
  }
  function setSession(key, value) {
    try { window.sessionStorage.setItem(key, value); return true; }
    catch (e) { return false; }
  }
  function readPersisted(name) {
    return getCookie(name) || getSession(name) || memStore[name] || null;
  }
  function writePersisted(name, value) {
    memStore[name] = value;
    if (!setCookie(name, value)) {
      setSession(name, value);
    }
  }

  // ===== URL params (override cookies for this page load) =====
  function getURLParam(name) {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get(name);
    } catch (e) { return null; }
  }

  // ===== Service name (theme cookie scope, kept v1-compatible) =====
  var serviceName = (function () {
    try {
      var host = window.location.hostname;
      var parts = host.split('.');
      if (parts.length > 1 && parts[parts.length - 1] === 'home') {
        return parts[0]; // "app" from "app.home"
      }
    } catch (e) {}
    return 'glacial';
  })();

  // Per-service theme cookie name (v1-compatible). v2.6.0 — when GLACIAL_SHARED_THEME
  // is on, WRITES go to the single shared 'glacial-theme' name instead, so a theme
  // pick is one cookie across surfaces. THEME_WRITE_COOKIE is what writers use;
  // readThemeCookie() reads both (shared first, then the legacy per-service name)
  // so an already-saved theme migrates without a re-pick.
  var THEME_COOKIE = serviceName + '-theme';
  var SHARED_THEME_COOKIE = 'glacial-theme';
  var THEME_WRITE_COOKIE = SHARED_THEME ? SHARED_THEME_COOKIE : THEME_COOKIE;
  var SKIN_COOKIE = 'glacial-skin'; // project-wide, NOT per-service
  var AESTHETIC_COOKIE = 'glacial-aesthetic'; // v2.1.0 — project-wide

  // v2.6.0 — read the persisted theme honoring both the shared and per-service
  // cookie names. Shared wins (it's the migrated/authoritative value); the
  // per-service name is the legacy fallback so existing users keep their pick.
  function readThemeCookie() {
    return readPersisted(SHARED_THEME_COOKIE) || readPersisted(THEME_COOKIE);
  }

  // ===== Change event (v2.4.0) =====
  // Dispatched on <document> whenever theme / skin / aesthetic changes (boot,
  // public setters, and OS-preference switches). Consumers can listen via
  // document.addEventListener('glacial:change', fn) or window.glacialOnThemeChange(fn).
  // detail = { theme, skin, aesthetic }. Saves apps from polling/MutationObserver.
  function currentState() {
    var el = document.documentElement;
    return {
      theme: el.getAttribute('data-theme'),
      skin: el.getAttribute('data-skin'),
      aesthetic: el.getAttribute('data-aesthetic')
    };
  }
  function emitChange() {
    emitChangeInternal(true);
  }
  // fromLocal=false suppresses re-broadcast (used when re-applying a message that
  // arrived over the channel, so two tabs don't ping-pong forever).
  function emitChangeInternal(fromLocal) {
    try {
      document.dispatchEvent(new CustomEvent('glacial:change', { detail: currentState() }));
    } catch (e) {}
    if (fromLocal) broadcastState();
  }

  // ===== Cross-tab live sync (v2.6.0) =====
  // Mirror theme/skin/aesthetic to other SAME-ORIGIN tabs in real time over a
  // BroadcastChannel. This is live-sync only; cross-surface (different subdomain)
  // persistence comes from the shared cookie on the next load, NOT from here.
  // Degrades to a no-op where BroadcastChannel is unavailable.
  var glacialChannel = null;
  function broadcastState() {
    if (!glacialChannel) return;
    try { glacialChannel.postMessage(currentState()); } catch (e) {}
  }
  (function setupChannel() {
    if (typeof BroadcastChannel === 'undefined') return;
    try {
      glacialChannel = new BroadcastChannel('glacial');
      glacialChannel.addEventListener('message', function (e) {
        var s = e.data || {};
        var el = document.documentElement;
        var changed = false;
        if ((s.theme === 'light' || s.theme === 'dark') && el.getAttribute('data-theme') !== s.theme) {
          el.setAttribute('data-theme', s.theme); changed = true;
        }
        if (s.skin && el.getAttribute('data-skin') !== s.skin) {
          el.setAttribute('data-skin', s.skin); changed = true;
        }
        var curAes = el.getAttribute('data-aesthetic');
        var nextAes = s.aesthetic || null;
        if (curAes !== nextAes) {
          if (nextAes) el.setAttribute('data-aesthetic', nextAes);
          else el.removeAttribute('data-aesthetic');
          changed = true;
        }
        // Re-emit glacial:change so app listeners update, but DON'T re-broadcast.
        if (changed) emitChangeInternal(false);
      });
    } catch (e) { glacialChannel = null; }
  })();

  // ===== Theme =====
  function getOSTheme() {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {}
    return 'light';
  }
  function getTheme() {
    // Precedence: URL ?theme= > persisted cookie > GLACIAL_DEFAULT_THEME > OS pref.
    // A real user pick writes a cookie, so it outranks the forced default.
    // GLACIAL_DEFAULT_THEME='auto' (v2.7.0) resolves to null above, so it falls
    // through to OS preference — identical to leaving the default unset.
    return getURLParam('theme') || readThemeCookie() || DEFAULT_THEME || getOSTheme();
  }
  function applyTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    document.documentElement.setAttribute('data-theme', theme);
    emitChange();
  }

  // ===== Skin =====
  // The six built-in skins. Used by the settings swatch picker AND by the v2.7.0
  // persist-on-param validation (a carried ?skin= must be a known skin before it's
  // written to the cookie). Custom consumer skins still apply via ?skin=/cookie,
  // they just aren't auto-persisted from a carried param.
  var GLACIAL_BUILTIN_SKINS = ['default', 'warm-serif', 'midnight-mono', 'lavender', 'deep-navy', 'nord'];

  function getSkin() {
    // Precedence: URL ?skin= > persisted cookie > GLACIAL_DEFAULT_SKIN > 'default'.
    // A real user pick writes the cookie, so it outranks the configured default.
    return getURLParam('skin') || readPersisted(SKIN_COOKIE) || DEFAULT_SKIN || 'default';
  }
  function applySkin(skin) {
    if (!skin) skin = 'default';
    document.documentElement.setAttribute('data-skin', skin);
    emitChange();
  }

  // ===== Aesthetic =====
  function getAesthetic() {
    return getURLParam('aesthetic') || readPersisted(AESTHETIC_COOKIE) || null;
  }
  function applyAesthetic(name) {
    if (!name) {
      document.documentElement.removeAttribute('data-aesthetic');
    } else {
      document.documentElement.setAttribute('data-aesthetic', name);
    }
    emitChange();
  }

  // ===== Apply theme + skin + aesthetic BEFORE first paint =====
  applyTheme(getTheme());
  applySkin(getSkin());
  applyAesthetic(getAesthetic());
  document.documentElement.setAttribute('data-glacial-loaded', VERSION);

  // ===== Persist-on-param (v2.7.0, opt-in via GLACIAL_SHARED_THEME) =====
  // When appearance is carried in via a ?theme/?skin/?aesthetic param AND this
  // consumer opted into shared appearance, persist the carried pick to THIS
  // surface's host-only cookie so a later cold reload keeps it (otherwise a
  // carried param is ephemeral — applied for this load only). Every value is
  // VALIDATED against glacial's known vocab first; anything off-vocab is ignored
  // so a crafted link can't poison the cookie with junk. This is appearance-only,
  // opt-in, and non-sensitive.
  (function persistCarriedParams() {
    if (!SHARED_THEME) return;
    var VALID_AESTHETICS = { hybrid: 1 };
    try {
      var pTheme = getURLParam('theme');
      if (pTheme === 'light' || pTheme === 'dark') {
        writePersisted(THEME_WRITE_COOKIE, pTheme);
      }
      var pSkin = getURLParam('skin');
      // Only persist a known built-in skin (reuses glacial's skin vocab); the
      // alphanum/dash shape from glacialSetSkin is implied by the allow-list.
      if (pSkin && GLACIAL_BUILTIN_SKINS.indexOf(pSkin) !== -1) {
        writePersisted(SKIN_COOKIE, pSkin);
      }
      var pAes = getURLParam('aesthetic');
      if (pAes && VALID_AESTHETICS[pAes]) {
        writePersisted(AESTHETIC_COOKIE, pAes);
      }
    } catch (e) {}
  })();

  // ===== Public API =====
  window.glacialToggleTheme = function () {
    var current = document.documentElement.getAttribute('data-theme') || getTheme();
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    writePersisted(THEME_WRITE_COOKIE, next);
    return next;
  };

  window.glacialSetSkin = function (name) {
    if (typeof name !== 'string' || !/^[a-z0-9-]+$/i.test(name)) {
      console.warn('[glacial] Invalid skin name; expected alphanum/dash:', name);
      return null;
    }
    applySkin(name);
    writePersisted(SKIN_COOKIE, name);
    return name;
  };

  window.glacialSetAesthetic = function (name) {
    if (name === null || name === '' || name === 'default') {
      applyAesthetic(null);
      writePersisted(AESTHETIC_COOKIE, '');
      return null;
    }
    if (typeof name !== 'string' || !/^[a-z0-9-]+$/i.test(name)) {
      console.warn('[glacial] Invalid aesthetic name; expected alphanum/dash or null:', name);
      return null;
    }
    applyAesthetic(name);
    writePersisted(AESTHETIC_COOKIE, name);
    return name;
  };

  // Subscribe to theme/skin/aesthetic changes. Returns an unsubscribe fn.
  //   var off = glacialOnThemeChange(function (d) { ... d.theme / d.skin ... });
  window.glacialOnThemeChange = function (cb) {
    if (typeof cb !== 'function') return function () {};
    var handler = function (e) { cb(e.detail); };
    document.addEventListener('glacial:change', handler);
    return function () { document.removeEventListener('glacial:change', handler); };
  };

  // ===== Appearance carry (v2.7.0) =====
  // glacialDecorateUrl(url) appends the LIVE resolved theme/skin/aesthetic (read
  // off <html>) as glacial's readable ?theme/?skin/?aesthetic params, omitting a
  // value that equals this consumer's configured default skin (or auto/unset
  // theme/aesthetic). Thin wrapper over the pure glacialDecorateUrlCore so a hop
  // to a sibling surface carries the current pick. Use it on outbound glacial-aware
  // links (the app-switcher does this at click time).
  window.glacialDecorateUrl = function (url) {
    var el = document.documentElement;
    // For theme/aesthetic, the resolved <html> value IS the pick (auto resolves
    // to a concrete OS theme — but if the user never pinned, we don't want to
    // freeze the OS guess onto the link). So only carry theme when it was an
    // explicit pick: a cookie, a URL param, or a forced light/dark default.
    var themePicked = !!(readThemeCookie() || getURLParam('theme') || DEFAULT_THEME);
    return glacialDecorateUrlCore(url, {
      theme: themePicked ? el.getAttribute('data-theme') : null,
      skin: el.getAttribute('data-skin'),
      aesthetic: el.getAttribute('data-aesthetic'),
      defaults: { skin: DEFAULT_SKIN || 'default' }
    });
  };

  // ===== Aurora orbs (existing, prefers-reduced-motion gated) =====
  function injectOrbs() {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
      }
    } catch (e) {}
    if (document.querySelector('.glacial-aurora')) return false;

    var container = document.createElement('div');
    container.className = 'glacial-aurora';
    for (var i = 1; i <= 3; i++) {
      var orb = document.createElement('div');
      orb.className = 'orb orb-' + i;
      container.appendChild(orb);
    }
    document.body.insertBefore(container, document.body.firstChild);
    return true;
  }

  var orbsActive = false;
  function tryInjectOrbs() { orbsActive = injectOrbs(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInjectOrbs);
  } else {
    tryInjectOrbs();
  }

  // ===== OS theme listener (only auto-switches if user hasn't set a cookie) =====
  try {
    if (window.matchMedia) {
      var mql = window.matchMedia('(prefers-color-scheme: dark)');
      var listener = function (e) {
        // Only auto-switch when the user hasn't pinned a theme by any means:
        // no cookie (shared or per-service), no URL override, and no forced
        // GLACIAL_DEFAULT_THEME — otherwise an OS light/dark flip would revert
        // a migrated user or override the durable default.
        if (!readThemeCookie() && !getURLParam('theme') && !DEFAULT_THEME) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      };
      if (mql.addEventListener) mql.addEventListener('change', listener);
      else if (mql.addListener) mql.addListener(listener); // older Safari
    }
  } catch (e) {}

  // ===== Drawer (v2.1.0) =====
  // Open: glacialOpenDrawer(idOrEl) — also pairs with .glacial-drawer-overlay
  // Close: glacialCloseDrawer(idOrEl?) — closes the given drawer or all open ones
  // Esc / overlay-click closes automatically.
  var openDrawers = [];
  var prevFocus = null;

  function resolveDrawer(idOrEl) {
    if (!idOrEl) return null;
    if (typeof idOrEl === 'string') return document.getElementById(idOrEl);
    if (idOrEl && idOrEl.nodeType === 1) return idOrEl;
    return null;
  }

  function findOverlay(drawer) {
    // Prefer adjacent overlay; fall back to any .glacial-drawer-overlay
    var sib = drawer.previousElementSibling;
    if (sib && sib.classList && sib.classList.contains('glacial-drawer-overlay')) return sib;
    return document.querySelector('.glacial-drawer-overlay');
  }

  // Shared focus trap (v2.4.0 — extracted from the drawer; reused by the modal).
  // Traps Tab within `el`, focuses the first focusable, returns a teardown fn.
  var GLACIAL_FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function trapFocus(el) {
    var focusable = el.querySelectorAll(GLACIAL_FOCUSABLE);
    if (!focusable.length) return function () {};
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    el.addEventListener('keydown', handler);
    setTimeout(function () { first.focus(); }, 50);
    return function () { el.removeEventListener('keydown', handler); };
  }

  window.glacialOpenDrawer = function (idOrEl) {
    var drawer = resolveDrawer(idOrEl);
    if (!drawer) {
      console.warn('[glacial] Drawer not found:', idOrEl);
      return false;
    }
    var overlay = findOverlay(drawer);
    prevFocus = document.activeElement;
    drawer.setAttribute('data-open', 'true');
    if (overlay) overlay.setAttribute('data-open', 'true');
    openDrawers.push(drawer);
    drawer._glacialUntrap = trapFocus(drawer);
    return true;
  };

  window.glacialCloseDrawer = function (idOrEl) {
    var drawer = idOrEl ? resolveDrawer(idOrEl) : openDrawers[openDrawers.length - 1];
    if (!drawer) return false;
    drawer.setAttribute('data-open', 'false');
    var overlay = findOverlay(drawer);
    if (overlay) overlay.setAttribute('data-open', 'false');
    if (drawer._glacialUntrap) {
      drawer._glacialUntrap();
      delete drawer._glacialUntrap;
    }
    openDrawers = openDrawers.filter(function (d) { return d !== drawer; });
    if (prevFocus && prevFocus.focus) {
      try { prevFocus.focus(); } catch (e) {}
      prevFocus = null;
    }
    return true;
  };

  // Auto-wire: clicks on .glacial-drawer-overlay close the topmost drawer;
  // Escape closes the topmost drawer.
  document.addEventListener('click', function (e) {
    var overlay = e.target.closest && e.target.closest('.glacial-drawer-overlay');
    if (overlay && overlay.getAttribute('data-open') === 'true') {
      window.glacialCloseDrawer();
    }
    var closer = e.target.closest && e.target.closest('[data-glacial-drawer-close]');
    if (closer) {
      e.preventDefault();
      var target = closer.getAttribute('data-glacial-drawer-close');
      window.glacialCloseDrawer(target || closer.closest('.glacial-drawer'));
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openDrawers.length > 0) {
      window.glacialCloseDrawer();
    }
  });

  // ===== Cmd+K palette (v2.1.0) =====
  // Usage:
  //   var pal = glacialPalette({
  //     items: [
  //       { id, label, icon?, shortcut?, section?, onSelect: fn }
  //     ]
  //   });
  //   pal.open(); pal.close(); // Cmd+K / Ctrl+K toggles by default
  //
  // The palette injects its own DOM. Style hooks: .glacial-palette-*
  // The keyboard shortcut auto-binds unless { shortcut: false } is passed.
  window.glacialPalette = function (config) {
    config = config || {};
    var items = config.items || [];
    var bindShortcut = config.shortcut !== false;
    var placeholder = config.placeholder || 'Type a command or search...';

    // Build DOM once
    var overlay = document.createElement('div');
    overlay.className = 'glacial-palette-overlay';
    overlay.setAttribute('data-open', 'false');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="glacial-palette" role="dialog" aria-label="Command palette">' +
      '  <input class="glacial-palette-input" type="text" placeholder="' + placeholder + '" autocomplete="off" spellcheck="false">' +
      '  <div class="glacial-palette-list"></div>' +
      '  <div class="glacial-palette-empty">No matches</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var palette = overlay.querySelector('.glacial-palette');
    var input = overlay.querySelector('.glacial-palette-input');
    var list = overlay.querySelector('.glacial-palette-list');
    var empty = overlay.querySelector('.glacial-palette-empty');
    var selectedIdx = 0;
    var visibleItems = [];

    function renderItems(filter) {
      list.innerHTML = '';
      visibleItems = [];
      var f = (filter || '').toLowerCase().trim();
      var bySection = {};
      items.forEach(function (item) {
        if (f && item.label.toLowerCase().indexOf(f) === -1) return;
        var section = item.section || '';
        if (!bySection[section]) bySection[section] = [];
        bySection[section].push(item);
      });
      Object.keys(bySection).forEach(function (section) {
        if (section) {
          var label = document.createElement('div');
          label.className = 'glacial-palette-section';
          label.textContent = section;
          list.appendChild(label);
        }
        bySection[section].forEach(function (item) {
          var el = document.createElement('div');
          el.className = 'glacial-palette-item';
          el.setAttribute('role', 'option');
          var icon = item.icon ? '<span class="glacial-palette-item-icon">' + item.icon + '</span>' : '';
          var shortcut = item.shortcut ? '<span class="glacial-palette-item-shortcut">' + item.shortcut + '</span>' : '';
          el.innerHTML = icon + '<span class="glacial-palette-item-label">' + item.label + '</span>' + shortcut;
          el.addEventListener('click', function () {
            if (item.onSelect) item.onSelect(item);
            close();
          });
          list.appendChild(el);
          visibleItems.push(el);
        });
      });
      empty.style.display = visibleItems.length ? 'none' : 'block';
      selectIndex(0);
    }

    function selectIndex(i) {
      if (visibleItems.length === 0) return;
      i = Math.max(0, Math.min(i, visibleItems.length - 1));
      visibleItems.forEach(function (el) { el.classList.remove('is-selected'); });
      visibleItems[i].classList.add('is-selected');
      visibleItems[i].scrollIntoView({ block: 'nearest' });
      selectedIdx = i;
    }

    function open() {
      overlay.setAttribute('data-open', 'true');
      overlay.setAttribute('aria-hidden', 'false');
      input.value = '';
      renderItems('');
      setTimeout(function () { input.focus(); }, 50);
    }
    function close() {
      overlay.setAttribute('data-open', 'false');
      overlay.setAttribute('aria-hidden', 'true');
    }
    function isOpen() { return overlay.getAttribute('data-open') === 'true'; }

    input.addEventListener('input', function (e) { renderItems(e.target.value); });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function (e) {
      if (bindShortcut && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen()) close(); else open();
        return;
      }
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); selectIndex(selectedIdx + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); selectIndex(selectedIdx - 1); }
      else if (e.key === 'Enter' && visibleItems[selectedIdx]) {
        e.preventDefault();
        visibleItems[selectedIdx].click();
      }
    });

    return { open: open, close: close, isOpen: isOpen, setItems: function (next) { items = next || []; if (isOpen()) renderItems(input.value); } };
  };

  // ===== Modal (v2.4.0) =====
  // Reuses the shared focus trap. glacialOpenModal(idOrEl) / glacialCloseModal(idOrEl?).
  // Esc, overlay-click, and [data-glacial-modal-close] close it; open declaratively
  // with [data-glacial-modal-open="id"]. Markup mirrors the drawer.
  var openModals = [];
  var modalPrevFocus = null;

  function resolveEl(idOrEl) {
    if (!idOrEl) return null;
    if (typeof idOrEl === 'string') return document.getElementById(idOrEl);
    if (idOrEl.nodeType === 1) return idOrEl;
    return null;
  }
  function modalOverlayFor(modal) {
    var p = modal.closest('.glacial-modal-overlay');
    if (p) return p;
    var sib = modal.previousElementSibling;
    if (sib && sib.classList && sib.classList.contains('glacial-modal-overlay')) return sib;
    return null;
  }

  window.glacialOpenModal = function (idOrEl) {
    var modal = resolveEl(idOrEl);
    if (!modal) { console.warn('[glacial] Modal not found:', idOrEl); return false; }
    var overlay = modalOverlayFor(modal);
    modalPrevFocus = document.activeElement;
    if (overlay) overlay.setAttribute('data-open', 'true');
    modal.setAttribute('data-open', 'true');
    openModals.push(modal);
    modal._glacialUntrap = trapFocus(modal);
    return true;
  };
  window.glacialCloseModal = function (idOrEl) {
    var modal = idOrEl ? resolveEl(idOrEl) : openModals[openModals.length - 1];
    if (!modal) return false;
    var overlay = modalOverlayFor(modal);
    if (overlay) overlay.setAttribute('data-open', 'false');
    modal.setAttribute('data-open', 'false');
    if (modal._glacialUntrap) { modal._glacialUntrap(); delete modal._glacialUntrap; }
    openModals = openModals.filter(function (m) { return m !== modal; });
    if (modalPrevFocus && modalPrevFocus.focus) {
      try { modalPrevFocus.focus(); } catch (e) {}
      modalPrevFocus = null;
    }
    return true;
  };

  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var opener = e.target.closest('[data-glacial-modal-open]');
    if (opener) { e.preventDefault(); window.glacialOpenModal(opener.getAttribute('data-glacial-modal-open')); return; }
    var ov = e.target.closest('.glacial-modal-overlay');
    if (ov && e.target === ov && ov.getAttribute('data-open') === 'true') { window.glacialCloseModal(); return; }
    var closer = e.target.closest('[data-glacial-modal-close]');
    if (closer) {
      e.preventDefault();
      var t = closer.getAttribute('data-glacial-modal-close');
      window.glacialCloseModal(t || closer.closest('.glacial-modal'));
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openModals.length > 0) window.glacialCloseModal();
  });

  // ===== Toast (v2.4.0) =====
  // glacialToast({ message, variant, timeout, action: { label, onClick } }) or
  // glacialToast('message'). variant: info|success|warn|error. Returns dismiss fn.
  // Injects an aria-live="polite" region so screen readers announce it.
  function toastRegion() {
    var region = document.querySelector('.glacial-toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'glacial-toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    return region;
  }
  window.glacialToast = function (opts) {
    opts = opts || {};
    if (typeof opts === 'string') opts = { message: opts };
    var region = toastRegion();
    var toast = document.createElement('div');
    toast.className = 'glacial-toast' + (opts.variant ? ' glacial-toast-' + opts.variant : '');
    var msg = document.createElement('span');
    msg.className = 'glacial-toast-message';
    msg.textContent = opts.message || '';
    toast.appendChild(msg);
    var timer = null;
    function dismiss() {
      if (timer) { clearTimeout(timer); timer = null; }
      toast.setAttribute('data-leaving', 'true');
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 200);
    }
    if (opts.action && opts.action.label) {
      var act = document.createElement('button');
      act.className = 'glacial-toast-action';
      act.type = 'button';
      act.textContent = opts.action.label;
      act.addEventListener('click', function () { if (opts.action.onClick) opts.action.onClick(); dismiss(); });
      toast.appendChild(act);
    }
    var close = document.createElement('button');
    close.className = 'glacial-toast-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Dismiss');
    close.innerHTML = '&times;';
    close.addEventListener('click', dismiss);
    toast.appendChild(close);
    region.appendChild(toast);
    var ms = typeof opts.timeout === 'number' ? opts.timeout : 4000;
    if (ms > 0) timer = setTimeout(dismiss, ms);
    return dismiss;
  };

  // ===== Tabs (v2.4.0) — auto-wired via [data-glacial-tabs] =====
  // Markup: [data-glacial-tabs] > .glacial-tab-list > .glacial-tab(aria-controls="panelId")
  //         plus .glacial-tab-panel[id]. Click activates; arrows/Home/End move.
  function initTabs(container) {
    var tabs = Array.prototype.slice.call(container.querySelectorAll('.glacial-tab'));
    if (!tabs.length) return;
    var list = container.querySelector('.glacial-tab-list') || container;
    list.setAttribute('role', 'tablist');
    function panelFor(tab) {
      var id = tab.getAttribute('aria-controls');
      return id ? document.getElementById(id) : null;
    }
    function activate(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('role', 'tab');
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var p = panelFor(t);
        if (p) { p.setAttribute('role', 'tabpanel'); p.hidden = !on; }
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(tab, false); });
      tab.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); activate(tabs[(i + 1) % tabs.length], true); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); activate(tabs[(i - 1 + tabs.length) % tabs.length], true); }
        else if (e.key === 'Home') { e.preventDefault(); activate(tabs[0], true); }
        else if (e.key === 'End') { e.preventDefault(); activate(tabs[tabs.length - 1], true); }
      });
    });
    var initial = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    activate(initial, false);
  }

  // ===== Menu / dropdown (v2.4.0) — [data-glacial-menu] trigger =====
  // Trigger button[data-glacial-menu] toggles its .glacial-menu (next sibling, or
  // the element whose id matches the attribute value). Esc / outside-click close;
  // ArrowUp/Down move between .glacial-menu-item (use <button>/<a> for focusability).
  function menuFor(trigger) {
    var ref = trigger.getAttribute('data-glacial-menu');
    if (ref) return document.getElementById(ref);
    var sib = trigger.nextElementSibling;
    return (sib && sib.classList && sib.classList.contains('glacial-menu')) ? sib : null;
  }
  function closeAllMenus(except) {
    document.querySelectorAll('.glacial-menu[data-open="true"]').forEach(function (m) {
      if (m !== except) m.setAttribute('data-open', 'false');
    });
    document.querySelectorAll('[data-glacial-menu][aria-expanded="true"]').forEach(function (t) {
      if (menuFor(t) !== except) t.setAttribute('aria-expanded', 'false');
    });
  }
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-glacial-menu]');
    if (trigger) {
      e.preventDefault();
      var menu = menuFor(trigger);
      if (!menu) return;
      var isOpen = menu.getAttribute('data-open') === 'true';
      closeAllMenus(isOpen ? null : menu);
      menu.setAttribute('data-open', isOpen ? 'false' : 'true');
      trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      if (!isOpen) {
        var first = menu.querySelector('.glacial-menu-item');
        if (first) setTimeout(function () { first.focus(); }, 0);
      }
      return;
    }
    if (!e.target.closest || !e.target.closest('.glacial-menu')) closeAllMenus(null);
  });
  document.addEventListener('keydown', function (e) {
    var menu = document.querySelector('.glacial-menu[data-open="true"]');
    if (!menu) return;
    var trigger = document.querySelector('[data-glacial-menu][aria-expanded="true"]');
    if (e.key === 'Escape') {
      menu.setAttribute('data-open', 'false');
      if (trigger) { trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      var items = Array.prototype.slice.call(menu.querySelectorAll('.glacial-menu-item'));
      if (!items.length) return;
      var cur = items.indexOf(document.activeElement);
      var next = e.key === 'ArrowDown' ? (cur + 1) % items.length : (cur - 1 + items.length) % items.length;
      items[next].focus();
    }
  });

  // Auto-init tabs on load.
  function initAllTabs() {
    document.querySelectorAll('[data-glacial-tabs]').forEach(function (c) { initTabs(c); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllTabs);
  } else {
    initAllTabs();
  }

  // ===== Settings cog (v2.6.0) — Tier 1 =====
  // glacialMountSettings(targetSelector | el, opts?) injects a cog button whose
  // popover holds: a theme segmented control (light/dark/auto), a skin picker of
  // swatches (each rendering its own [data-skin] tokens), and an aesthetic toggle.
  // Controls drive the existing public setters — no private state of its own.
  // opts: { skins: ['default', ...], aesthetics: [{ value, label }], label }.
  // (GLACIAL_BUILTIN_SKINS is declared up in the Skin section so it's available
  //  to the pre-paint persist-on-param validation too.)

  function resolveTarget(target) {
    if (!target) return null;
    if (typeof target === 'string') return document.querySelector(target);
    if (target.nodeType === 1) return target;
    return null;
  }

  window.glacialMountSettings = function (target, opts) {
    opts = opts || {};
    var host = resolveTarget(target);
    if (!host) { console.warn('[glacial] Settings target not found:', target); return null; }

    var skins = opts.skins || GLACIAL_BUILTIN_SKINS;
    var aesthetics = opts.aesthetics || [
      { value: '', label: 'Polished' },
      { value: 'hybrid', label: 'Hybrid' }
    ];

    var root = document.createElement('div');
    root.className = 'glacial-settings';

    var cog = document.createElement('button');
    cog.type = 'button';
    cog.className = 'glacial-settings-cog';
    cog.setAttribute('aria-label', opts.label || 'Settings');
    cog.setAttribute('aria-expanded', 'false');
    cog.setAttribute('aria-haspopup', 'true');
    cog.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';

    var pop = document.createElement('div');
    pop.className = 'glacial-settings-popover';
    pop.setAttribute('data-open', 'false');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Appearance settings');

    // --- Theme segmented control (light / dark / auto) ---
    var themeGroup = document.createElement('div');
    themeGroup.className = 'glacial-settings-group';
    var themeLabel = document.createElement('div');
    themeLabel.className = 'glacial-settings-label';
    themeLabel.textContent = 'Theme';
    themeGroup.appendChild(themeLabel);
    var seg = document.createElement('div');
    seg.className = 'glacial-settings-segmented';
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', 'Theme');
    var THEME_OPTS = [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'auto', label: 'Auto' }
    ];
    var segBtns = {};
    THEME_OPTS.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'glacial-settings-seg';
      b.textContent = o.label;
      b.setAttribute('data-value', o.value);
      b.addEventListener('click', function () {
        if (o.value === 'auto') {
          // Clear the pin and fall back to OS preference. Clear BOTH cookie names
          // (shared + legacy per-service) so a migrated user — who may still hold
          // the old per-service cookie that readThemeCookie() falls back to —
          // fully unpins rather than reverting to the stale value.
          writePersisted(SHARED_THEME_COOKIE, '');
          writePersisted(THEME_COOKIE, '');
          applyTheme(getOSTheme());
        } else {
          // Pin explicitly: write the cookie AND apply, even when the resolved
          // theme already matches (e.g. clicking "Light" while in auto+OS-light).
          // glacialToggleTheme() only flips relative to current, so it'd no-op
          // there and leave the choice unpersisted.
          applyTheme(o.value);
          writePersisted(THEME_WRITE_COOKIE, o.value);
        }
        syncSeg();
      });
      seg.appendChild(b);
      segBtns[o.value] = b;
    });
    themeGroup.appendChild(seg);
    pop.appendChild(themeGroup);

    function syncSeg() {
      var pinned = readThemeCookie();
      var active = pinned ? document.documentElement.getAttribute('data-theme') : 'auto';
      Object.keys(segBtns).forEach(function (v) {
        var on = v === active;
        segBtns[v].setAttribute('aria-pressed', on ? 'true' : 'false');
        segBtns[v].classList.toggle('is-active', on);
      });
    }

    // --- Skin swatch picker ---
    var skinGroup = document.createElement('div');
    skinGroup.className = 'glacial-settings-group';
    var skinLabel = document.createElement('div');
    skinLabel.className = 'glacial-settings-label';
    skinLabel.textContent = 'Skin';
    skinGroup.appendChild(skinLabel);
    var swatches = document.createElement('div');
    swatches.className = 'glacial-settings-skins';
    var skinBtns = {};
    skins.forEach(function (name) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'glacial-settings-swatch';
      // Scope the swatch to the skin's own tokens — var(--accent)/var(--bg)
      // resolve under [data-skin] (see glacial.css), never a hardcoded color.
      b.setAttribute('data-skin', name);
      b.setAttribute('aria-label', name);
      b.setAttribute('title', name);
      b.addEventListener('click', function () {
        window.glacialSetSkin(name);
        syncSkins();
      });
      swatches.appendChild(b);
      skinBtns[name] = b;
    });
    skinGroup.appendChild(swatches);
    pop.appendChild(skinGroup);

    function syncSkins() {
      var cur = document.documentElement.getAttribute('data-skin') || 'default';
      Object.keys(skinBtns).forEach(function (n) {
        var on = n === cur;
        skinBtns[n].setAttribute('aria-pressed', on ? 'true' : 'false');
        skinBtns[n].classList.toggle('is-active', on);
      });
    }

    // --- Aesthetic toggle ---
    var aesGroup = document.createElement('div');
    aesGroup.className = 'glacial-settings-group';
    var aesLabel = document.createElement('div');
    aesLabel.className = 'glacial-settings-label';
    aesLabel.textContent = 'Aesthetic';
    aesGroup.appendChild(aesLabel);
    var aesSeg = document.createElement('div');
    aesSeg.className = 'glacial-settings-segmented';
    aesSeg.setAttribute('role', 'group');
    aesSeg.setAttribute('aria-label', 'Aesthetic');
    var aesBtns = {};
    aesthetics.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'glacial-settings-seg';
      b.textContent = o.label;
      b.setAttribute('data-value', o.value);
      b.addEventListener('click', function () {
        window.glacialSetAesthetic(o.value || null);
        syncAes();
      });
      aesSeg.appendChild(b);
      aesBtns[o.value] = b;
    });
    aesGroup.appendChild(aesSeg);
    pop.appendChild(aesGroup);

    function syncAes() {
      var cur = document.documentElement.getAttribute('data-aesthetic') || '';
      Object.keys(aesBtns).forEach(function (v) {
        var on = v === cur;
        aesBtns[v].setAttribute('aria-pressed', on ? 'true' : 'false');
        aesBtns[v].classList.toggle('is-active', on);
      });
    }

    function syncAll() { syncSeg(); syncSkins(); syncAes(); }

    function openPop() {
      pop.setAttribute('data-open', 'true');
      cog.setAttribute('aria-expanded', 'true');
      syncAll();
    }
    function closePop() {
      pop.setAttribute('data-open', 'false');
      cog.setAttribute('aria-expanded', 'false');
    }
    function isOpen() { return pop.getAttribute('data-open') === 'true'; }

    cog.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isOpen()) closePop(); else openPop();
    });
    // Keep the popover open when interacting inside it.
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { if (isOpen()) closePop(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { closePop(); cog.focus(); }
    });
    // Stay in sync when theme/skin/aesthetic change from anywhere (other tabs,
    // a Cmd+K command, the OS listener).
    document.addEventListener('glacial:change', function () { if (isOpen()) syncAll(); });

    root.appendChild(cog);
    root.appendChild(pop);
    host.appendChild(root);
    syncAll();
    return { open: openPop, close: closePop, root: root };
  };

  // ===== App switcher (v2.6.0) — Tier 2 =====
  // glacialAppSwitcher({ services: [{ name, url, description, status?, group?, carry? }], target, carryAppearance? })
  // renders data-driven .glacial-tile launchers. status ∈ green|yellow|red drives
  // the status dot (existing --green/--yellow/--red tokens). group buckets tiles
  // under a heading. Returns the rendered container.
  //
  // v2.7.0 — appearance carry: a tile click decorates its URL with the LIVE
  // theme/skin/aesthetic (via glacialDecorateUrl) at CLICK time, so the current
  // pick follows the hop (reading at click time, not render time, never carries a
  // stale pick). Per-service `carry:false` skips a tile (use for non-glacial
  // targets so we don't append params to foreign/canonical links). Switcher-level
  // `carryAppearance:false` disables it globally. Both default ON.
  window.glacialAppSwitcher = function (config) {
    config = config || {};
    var services = config.services || [];
    var host = resolveTarget(config.target);
    if (!host) { console.warn('[glacial] App-switcher target not found:', config.target); return null; }
    var carryAppearance = config.carryAppearance !== false; // default ON

    var grid = document.createElement('div');
    grid.className = 'glacial-app-switcher';

    var STATUS = { green: 1, yellow: 1, red: 1 };
    var byGroup = {};
    var order = [];
    services.forEach(function (s) {
      var g = s.group || '';
      if (!byGroup[g]) { byGroup[g] = []; order.push(g); }
      byGroup[g].push(s);
    });

    order.forEach(function (g) {
      if (g) {
        var heading = document.createElement('div');
        heading.className = 'glacial-app-switcher-group';
        heading.textContent = g;
        grid.appendChild(heading);
      }
      var row = document.createElement('div');
      row.className = 'glacial-app-switcher-row';
      byGroup[g].forEach(function (s) {
        var tile = document.createElement('a');
        tile.className = 'glacial-tile';
        var rawUrl = s.url || '#';
        tile.href = rawUrl;

        // Decorate at CLICK time so the carried appearance is the live pick, not
        // whatever it was at render. Only for glacial-aware targets (carry !== false)
        // and only when the switcher hasn't disabled carry. A plain left-click
        // (no modifier) rewrites href just-in-time; modifier/middle clicks
        // (open-in-new-tab) get the same decorated href so they carry too.
        var shouldCarry = carryAppearance && s.carry !== false && rawUrl !== '#';
        if (shouldCarry) {
          tile.addEventListener('click', function () {
            try { tile.href = window.glacialDecorateUrl(rawUrl); } catch (e) {}
          });
          // Keyboard activation (Enter) fires click, so this covers a11y too.
          tile.addEventListener('auxclick', function () {
            try { tile.href = window.glacialDecorateUrl(rawUrl); } catch (e) {}
          });
        }

        if (s.status && STATUS[s.status]) {
          var dot = document.createElement('span');
          dot.className = 'glacial-tile-status glacial-tile-status-' + s.status;
          dot.setAttribute('aria-hidden', 'true');
          tile.appendChild(dot);
        }

        var name = document.createElement('span');
        name.className = 'glacial-tile-name';
        name.textContent = s.name || '';
        tile.appendChild(name);

        if (s.description) {
          var desc = document.createElement('span');
          desc.className = 'glacial-tile-desc';
          desc.textContent = s.description;
          tile.appendChild(desc);
        }
        row.appendChild(tile);
      });
      grid.appendChild(row);
    });

    host.appendChild(grid);
    return grid;
  };

  // ===== Debug surface =====
  // Resolved token snapshot for window.glacial.help()
  function snapshotTokens() {
    var out = {};
    try {
      var styles = getComputedStyle(document.documentElement);
      var names = [
        '--bg', '--bg-card', '--bg-card-hover', '--bg-header', '--bg-input',
        '--border', '--border-card', '--border-hover',
        '--text', '--text-strong', '--text-secondary', '--text-muted', '--text-faint',
        '--accent', '--accent-bg', '--accent-border',
        '--green', '--green-bg', '--yellow', '--yellow-bg', '--red', '--red-bg', '--blue', '--blue-bg',
        '--shadow', '--blur', '--radius-sm', '--radius', '--radius-lg',
        '--orb-opacity', '--orb-1-color', '--orb-2-color', '--orb-3-color',
        '--skeleton-shimmer', '--glow-low', '--glow-med', '--glow-high',
        '--font-mono', '--font-body'
      ];
      for (var i = 0; i < names.length; i++) {
        var v = styles.getPropertyValue(names[i]).trim();
        if (v) out[names[i]] = v;
      }
    } catch (e) {}
    return out;
  }

  var CLASSES = [
    'glacial-glass', 'glacial-glass-header',
    'glacial-aurora',
    'glacial-badge', 'glacial-badge-green', 'glacial-badge-yellow', 'glacial-badge-red', 'glacial-badge-blue', 'glacial-badge-accent',
    'glacial-btn', 'glacial-btn-primary', 'glacial-btn-secondary',
    'glacial-nav', 'glacial-toggle',
    // v2.0.0
    'glacial-table',
    'glacial-alert', 'glacial-alert-info', 'glacial-alert-warn', 'glacial-alert-success', 'glacial-alert-error',
    'glacial-empty-state',
    'glacial-metric', 'glacial-metric-label', 'glacial-metric-value', 'glacial-metric-delta',
    'glacial-breadcrumbs',
    'glacial-filter-bar', 'glacial-filter-pill',
    'glacial-status-row',
    'glacial-skeleton', 'glacial-skeleton-text',
    // v2.1.0 — Tier 2
    'glacial-rail', 'glacial-rail-shell', 'glacial-rail-item', 'glacial-rail-content',
    // v2.3.0 — Tier 2 contextual sub-rail
    'glacial-rail-secondary', 'glacial-rail-secondary-title', 'glacial-rail-secondary-item',
    'glacial-drawer', 'glacial-drawer-overlay', 'glacial-drawer-header', 'glacial-drawer-close', 'glacial-drawer-body',
    'glacial-split-view', 'glacial-split-list', 'glacial-split-detail', 'glacial-split-row', 'glacial-split-back',
    'glacial-h1', 'glacial-h2',
    // v2.4.0 — Tier 3 forms
    'glacial-field', 'glacial-field-label', 'glacial-field-hint', 'glacial-field-error',
    'glacial-input', 'glacial-textarea', 'glacial-select', 'glacial-checkbox', 'glacial-radio', 'glacial-switch',
    // v2.4.0 — Tier 3 overlays + interactive
    'glacial-modal-overlay', 'glacial-modal', 'glacial-modal-header', 'glacial-modal-title', 'glacial-modal-close', 'glacial-modal-body', 'glacial-modal-footer',
    'glacial-dropdown', 'glacial-menu', 'glacial-menu-item', 'glacial-menu-separator',
    'glacial-tabs', 'glacial-tab-list', 'glacial-tab', 'glacial-tab-panel',
    'glacial-toast-region', 'glacial-toast', 'glacial-toast-message', 'glacial-toast-action', 'glacial-toast-close',
    'glacial-toast-info', 'glacial-toast-success', 'glacial-toast-warn', 'glacial-toast-error',
    'glacial-accordion', 'glacial-accordion-item', 'glacial-accordion-trigger', 'glacial-accordion-panel',
    'glacial-progress', 'glacial-progress-bar', 'glacial-spinner',
    'glacial-avatar', 'glacial-avatar-group',
    'glacial-pagination', 'glacial-pagination-item',
    // v2.6.0 — Tier 1 settings cog
    'glacial-settings', 'glacial-settings-cog', 'glacial-settings-popover',
    'glacial-settings-group', 'glacial-settings-label',
    'glacial-settings-segmented', 'glacial-settings-seg',
    'glacial-settings-skins', 'glacial-settings-swatch',
    // v2.6.0 — Tier 2 app switcher
    'glacial-app-switcher', 'glacial-app-switcher-group', 'glacial-app-switcher-row',
    'glacial-tile', 'glacial-tile-status', 'glacial-tile-status-green',
    'glacial-tile-status-yellow', 'glacial-tile-status-red',
    'glacial-tile-name', 'glacial-tile-desc',
    // v2.8.0 — Tier 1 layout primitives
    'glacial-container', 'glacial-container-narrow', 'glacial-container-wide',
    'glacial-grid', 'glacial-grid-2', 'glacial-grid-3', 'glacial-grid-4',
    // v2.9.0 — icons
    'glacial-icon'
  ];

  // ===== Icons (v2.9.0) =====
  // Thin DOM wrapper over the pure iconSvg core. glacialIcon('home') → an SVG
  // string for innerHTML / template use. No arg (or '?' / 'help') → the name list.
  function glacialIcon(name, opts) {
    if (name == null || name === '?' || name === 'help') {
      var list = glacialIconCore.names();
      try { console.info('[glacial] ' + list.length + ' icons: ' + list.join(', ')); } catch (e) {}
      return list;
    }
    if (!glacialIconCore.has(name)) {
      try { console.warn('[glacial] unknown icon "' + name + '" — rendering placeholder. Run glacialIcon("?") for the list.'); } catch (e) {}
    }
    return glacialIconCore.iconSvg(name, opts);
  }
  window.glacialIcon = glacialIcon;

  window.glacial = {
    version: VERSION,
    help: function () {
      return {
        version: VERSION,
        theme: document.documentElement.getAttribute('data-theme'),
        skin: document.documentElement.getAttribute('data-skin'),
        aesthetic: document.documentElement.getAttribute('data-aesthetic'),
        aurora: orbsActive,
        classes: CLASSES.slice(),
        icons: glacialIconCore.names(),
        tokens: snapshotTokens()
      };
    },
    toggleTheme: window.glacialToggleTheme,
    setSkin: window.glacialSetSkin,
    setAesthetic: window.glacialSetAesthetic,
    onThemeChange: window.glacialOnThemeChange,
    openDrawer: window.glacialOpenDrawer,
    closeDrawer: window.glacialCloseDrawer,
    openModal: window.glacialOpenModal,
    closeModal: window.glacialCloseModal,
    toast: window.glacialToast,
    palette: window.glacialPalette,
    mountSettings: window.glacialMountSettings,
    appSwitcher: window.glacialAppSwitcher,
    decorateUrl: window.glacialDecorateUrl,
    icon: window.glacialIcon,
    iconInner: glacialIconCore.iconInner
  };

  // ===== Boot banner =====
  try {
    var t = document.documentElement.getAttribute('data-theme');
    var s = document.documentElement.getAttribute('data-skin');
    var a = document.documentElement.getAttribute('data-aesthetic') || 'polished';
    console.info(
      '[glacial] v' + VERSION + ' loaded · theme=' + t + ' · skin=' + s +
      ' · aesthetic=' + a +
      ' · aurora=' + (orbsActive ? 'on' : 'off') +
      ' · window.glacial.help()'
    );
  } catch (e) {}
})();
