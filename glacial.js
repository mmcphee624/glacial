/**
 * Glacial Design System — Theme + Skin + Aesthetic + Aurora + Debug + Tier 2/3 helpers
 * @version 2.6.0
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
 *   - window.glacial.help()
 *
 * Sets <html data-glacial-loaded="2.6.0"> before first paint.
 *
 * Theme/skin priority (highest first):
 *   1. URL params:  ?theme=light|dark · ?skin=<name>
 *   2. Cookie:      {service}-theme (or shared glacial-theme) · glacial-skin
 *   3. GLACIAL_DEFAULT_THEME (durable forced default, theme only)   (v2.6.0)
 *   4. OS pref:     prefers-color-scheme (theme only; skin defaults to "default")
 *
 * Optional config (window globals or <meta name="..."> equivalents — all default
 * off, so existing consumers are unchanged):
 *   - GLACIAL_COOKIE_DOMAIN — share cookies across sibling subdomains      (v2.6.0)
 *   - GLACIAL_SHARED_THEME  — use one `glacial-theme` cookie, not per-service (v2.6.0)
 *   - GLACIAL_DEFAULT_THEME — 'light'|'dark' forced default until a user picks (v2.6.0)
 *
 * Storage degrades gracefully: cookie → sessionStorage → in-memory if both blocked.
 * Same-origin tabs stay live in sync via BroadcastChannel('glacial') (v2.6.0);
 * cross-surface persistence comes from the shared cookie on the NEXT load, not
 * live sync.
 *
 * See DESIGN.md for full specification.
 */
(function () {
  'use strict';

  var VERSION = '2.6.0';

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

  var COOKIE_DOMAIN = configValue('GLACIAL_COOKIE_DOMAIN', 'glacial-cookie-domain');
  var SHARED_THEME = configTruthy('GLACIAL_SHARED_THEME', 'glacial-shared-theme');
  var DEFAULT_THEME = (function () {
    var v = configValue('GLACIAL_DEFAULT_THEME', 'glacial-default-theme');
    return (v === 'light' || v === 'dark') ? v : null;
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
      var cookie = name + '=' + value + ';path=/;max-age=31536000;SameSite=Lax';
      // v2.6.0 — opt-in shared-cookie domain (e.g. ".example.home") so a theme
      // pick on one surface rides along to sibling subdomains. Unset ⇒ unchanged.
      if (COOKIE_DOMAIN) cookie += ';domain=' + COOKIE_DOMAIN;
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
    return getURLParam('theme') || readThemeCookie() || DEFAULT_THEME || getOSTheme();
  }
  function applyTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    document.documentElement.setAttribute('data-theme', theme);
    emitChange();
  }

  // ===== Skin =====
  function getSkin() {
    return getURLParam('skin') || readPersisted(SKIN_COOKIE) || 'default';
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
  var GLACIAL_BUILTIN_SKINS = ['default', 'warm-serif', 'midnight-mono', 'lavender', 'deep-navy', 'nord'];

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
  // glacialAppSwitcher({ services: [{ name, url, description, status?, group? }], target })
  // renders data-driven .glacial-tile launchers. status ∈ green|yellow|red drives
  // the status dot (existing --green/--yellow/--red tokens). group buckets tiles
  // under a heading. Returns the rendered container.
  window.glacialAppSwitcher = function (config) {
    config = config || {};
    var services = config.services || [];
    var host = resolveTarget(config.target);
    if (!host) { console.warn('[glacial] App-switcher target not found:', config.target); return null; }

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
        tile.href = s.url || '#';

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
    'glacial-tile-name', 'glacial-tile-desc'
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
    onThemeChange: window.glacialOnThemeChange,
    openDrawer: window.glacialOpenDrawer,
    closeDrawer: window.glacialCloseDrawer,
    openModal: window.glacialOpenModal,
    closeModal: window.glacialCloseModal,
    toast: window.glacialToast,
    palette: window.glacialPalette,
    mountSettings: window.glacialMountSettings,
    appSwitcher: window.glacialAppSwitcher
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
