/**
 * Glacial Design System — Theme + Skin + Aurora + Debug
 * @version 2.0.0
 *
 * Include via <script src="glacial.js"></script>
 * Provides:
 *   - window.glacialToggleTheme()
 *   - window.glacialSetSkin(name)
 *   - window.glacial.help()
 *
 * Sets <html data-glacial-loaded="2.0.0"> before first paint.
 *
 * Theme/skin priority (highest first):
 *   1. URL params:  ?theme=light|dark · ?skin=<name>
 *   2. Cookie:      {service}-theme · glacial-skin
 *   3. OS pref:     prefers-color-scheme (theme only; skin defaults to "default")
 *
 * Storage degrades gracefully: cookie → sessionStorage → in-memory if both blocked.
 *
 * See DESIGN.md for full specification.
 */
(function () {
  'use strict';

  var VERSION = '2.0.0';

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
      document.cookie = name + '=' + value + ';path=/;max-age=31536000;SameSite=Lax';
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
        return parts[0]; // "ctrl" from "ctrl.home"
      }
    } catch (e) {}
    return 'glacial';
  })();

  var THEME_COOKIE = serviceName + '-theme';
  var SKIN_COOKIE = 'glacial-skin'; // project-wide, NOT per-service

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
    return getURLParam('theme') || readPersisted(THEME_COOKIE) || getOSTheme();
  }
  function applyTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    document.documentElement.setAttribute('data-theme', theme);
  }

  // ===== Skin =====
  function getSkin() {
    return getURLParam('skin') || readPersisted(SKIN_COOKIE) || 'default';
  }
  function applySkin(skin) {
    if (!skin) skin = 'default';
    document.documentElement.setAttribute('data-skin', skin);
  }

  // ===== Apply theme + skin BEFORE first paint =====
  applyTheme(getTheme());
  applySkin(getSkin());
  document.documentElement.setAttribute('data-glacial-loaded', VERSION);

  // ===== Public API =====
  window.glacialToggleTheme = function () {
    var current = document.documentElement.getAttribute('data-theme') || getTheme();
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    writePersisted(THEME_COOKIE, next);
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
        if (!readPersisted(THEME_COOKIE) && !getURLParam('theme')) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      };
      if (mql.addEventListener) mql.addEventListener('change', listener);
      else if (mql.addListener) mql.addListener(listener); // older Safari
    }
  } catch (e) {}

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
    'glacial-skeleton', 'glacial-skeleton-text'
  ];

  window.glacial = {
    version: VERSION,
    help: function () {
      return {
        version: VERSION,
        theme: document.documentElement.getAttribute('data-theme'),
        skin: document.documentElement.getAttribute('data-skin'),
        aurora: orbsActive,
        classes: CLASSES.slice(),
        tokens: snapshotTokens()
      };
    },
    toggleTheme: window.glacialToggleTheme,
    setSkin: window.glacialSetSkin
  };

  // ===== Boot banner =====
  try {
    var t = document.documentElement.getAttribute('data-theme');
    var s = document.documentElement.getAttribute('data-skin');
    console.info(
      '[glacial] v' + VERSION + ' loaded · theme=' + t + ' · skin=' + s +
      ' · aurora=' + (orbsActive ? 'on' : 'off') +
      ' · window.glacial.help()'
    );
  } catch (e) {}
})();
