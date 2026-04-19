/**
 * Glacial Design System — Theme Toggle + Aurora Orbs
 *
 * Include via <script src="glacial.js"></script>
 * Provides: window.glacialToggleTheme()
 *
 * Theme detection priority:
 *   1. Cookie ({service}-theme or glacial-theme)
 *   2. OS preference (prefers-color-scheme)
 *   3. Default: light
 *
 * See DESIGN.md for full specification.
 */
(function () {
  'use strict';

  // Detect service name from hostname for per-service cookie
  var serviceName = (function () {
    var host = window.location.hostname;
    var parts = host.split('.');
    if (parts.length > 1 && parts[parts.length - 1] === 'home') {
      return parts[0]; // e.g., "ctrl" from "ctrl.home"
    }
    return 'glacial';
  })();

  var COOKIE_NAME = serviceName + '-theme';

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function setCookie(name, value) {
    document.cookie = name + '=' + value + ';path=/;max-age=31536000;SameSite=Lax';
  }

  function getOSPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function getTheme() {
    return getCookie(COOKIE_NAME) || getOSPreference();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Apply theme immediately (prevents flash)
  applyTheme(getTheme());

  /**
   * Toggle between light and dark themes.
   * Sets a cookie to persist the choice.
   */
  window.glacialToggleTheme = function () {
    var current = document.documentElement.getAttribute('data-theme') || getTheme();
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setCookie(COOKIE_NAME, next);
    return next;
  };

  /**
   * Inject aurora orb DOM elements into the page.
   * Skipped entirely when prefers-reduced-motion is set.
   * Requires glacial.css for orb styling.
   */
  function injectOrbs() {
    // Skip if user prefers reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Skip if orbs already exist
    if (document.querySelector('.glacial-aurora')) {
      return;
    }

    var container = document.createElement('div');
    container.className = 'glacial-aurora';

    for (var i = 1; i <= 3; i++) {
      var orb = document.createElement('div');
      orb.className = 'orb orb-' + i;
      container.appendChild(orb);
    }

    document.body.insertBefore(container, document.body.firstChild);
  }

  // Inject orbs when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectOrbs);
  } else {
    injectOrbs();
  }

  // Listen for OS theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      // Only auto-switch if user hasn't manually set a preference
      if (!getCookie(COOKIE_NAME)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
})();
