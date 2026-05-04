/**
 * Glacial Design System — Theme + Skin + Aesthetic + Aurora + Debug + Tier 2 helpers
 * @version 2.1.0
 *
 * Include via <script src="glacial.js"></script>
 * Provides:
 *   - window.glacialToggleTheme()
 *   - window.glacialSetSkin(name)
 *   - window.glacialSetAesthetic(name)            (v2.1.0)
 *   - window.glacialOpenDrawer(idOrEl)            (v2.1.0)
 *   - window.glacialCloseDrawer(idOrEl?)          (v2.1.0)
 *   - window.glacialPalette({ items, onSelect })  (v2.1.0 — Cmd+K helper)
 *   - window.glacial.help()
 *
 * Sets <html data-glacial-loaded="2.1.0"> before first paint.
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

  var VERSION = '2.1.0';

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
  var AESTHETIC_COOKIE = 'glacial-aesthetic'; // v2.1.0 — project-wide

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
  }

  // ===== Apply theme + skin + aesthetic BEFORE first paint =====
  applyTheme(getTheme());
  applySkin(getSkin());
  applyAesthetic(getAesthetic());
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

  function trapFocusInDrawer(drawer) {
    var focusable = drawer.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
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
    drawer.addEventListener('keydown', handler);
    drawer._glacialTrap = handler;
    setTimeout(function () { first.focus(); }, 50);
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
    trapFocusInDrawer(drawer);
    return true;
  };

  window.glacialCloseDrawer = function (idOrEl) {
    var drawer = idOrEl ? resolveDrawer(idOrEl) : openDrawers[openDrawers.length - 1];
    if (!drawer) return false;
    drawer.setAttribute('data-open', 'false');
    var overlay = findOverlay(drawer);
    if (overlay) overlay.setAttribute('data-open', 'false');
    if (drawer._glacialTrap) {
      drawer.removeEventListener('keydown', drawer._glacialTrap);
      delete drawer._glacialTrap;
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
    'glacial-drawer', 'glacial-drawer-overlay', 'glacial-drawer-header', 'glacial-drawer-close', 'glacial-drawer-body',
    'glacial-split-view', 'glacial-split-list', 'glacial-split-detail', 'glacial-split-row', 'glacial-split-back',
    'glacial-h1', 'glacial-h2'
  ];

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
        tokens: snapshotTokens()
      };
    },
    toggleTheme: window.glacialToggleTheme,
    setSkin: window.glacialSetSkin,
    setAesthetic: window.glacialSetAesthetic,
    openDrawer: window.glacialOpenDrawer,
    closeDrawer: window.glacialCloseDrawer,
    palette: window.glacialPalette
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
