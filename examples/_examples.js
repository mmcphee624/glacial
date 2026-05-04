/**
 * Glacial examples — DEMO BEHAVIORS ONLY
 * @version 2.0.0
 *
 * NOT part of glacial. Wires up the skin selector, filter pills, and a
 * skeleton-to-real swap demo. Agents adopting glacial should NOT copy
 * this file.
 */
(function () {
  'use strict';

  // ===== Skin selector — sync with current skin and persist on change =====
  document.addEventListener('DOMContentLoaded', function () {
    var selects = document.querySelectorAll('[data-glacial-skin]');
    var current = document.documentElement.getAttribute('data-skin') || 'default';

    selects.forEach(function (sel) {
      sel.value = current;
      sel.addEventListener('change', function () {
        if (window.glacialSetSkin) {
          window.glacialSetSkin(sel.value);
        } else {
          document.documentElement.setAttribute('data-skin', sel.value);
        }
        // sync the others on this page if there are multiple toolbars
        selects.forEach(function (other) { if (other !== sel) other.value = sel.value; });
      });
    });
  });

  // ===== Filter-pill toggle (aria-pressed) =====
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.glacial-filter-bar-group').forEach(function (group) {
      var pills = group.querySelectorAll('.glacial-filter-pill');
      var multi = group.dataset.multi === 'true';

      pills.forEach(function (pill) {
        if (!pill.hasAttribute('aria-pressed')) {
          pill.setAttribute('aria-pressed', pill.classList.contains('is-active') ? 'true' : 'false');
        }
        pill.addEventListener('click', function (ev) {
          ev.preventDefault();
          if (pill.disabled) return;
          if (multi) {
            var pressed = pill.getAttribute('aria-pressed') === 'true';
            pill.setAttribute('aria-pressed', pressed ? 'false' : 'true');
          } else {
            pills.forEach(function (p) { p.setAttribute('aria-pressed', 'false'); });
            pill.setAttribute('aria-pressed', 'true');
          }
        });
        pill.addEventListener('keydown', function (ev) {
          if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
            ev.preventDefault();
            var next = pill.nextElementSibling || pills[0];
            if (next && next.classList.contains('glacial-filter-pill')) next.focus();
          } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
            ev.preventDefault();
            var prev = pill.previousElementSibling || pills[pills.length - 1];
            if (prev && prev.classList.contains('glacial-filter-pill')) prev.focus();
          } else if (ev.key === ' ' || ev.key === 'Enter') {
            ev.preventDefault();
            pill.click();
          }
        });
      });
    });
  });

  // ===== Alert dismiss =====
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.glacial-alert-dismiss');
    if (btn) {
      var alert = btn.closest('.glacial-alert');
      if (alert) alert.remove();
    }
  });

  // ===== Skeleton-to-real swap demo (dashboard.html) =====
  document.addEventListener('DOMContentLoaded', function () {
    var triggers = document.querySelectorAll('[data-skeleton-demo]');
    triggers.forEach(function (trigger) {
      var realData = trigger.querySelector('[data-real]');
      var skeleton = trigger.querySelector('[data-skeleton]');
      if (realData) realData.style.display = 'none';

      trigger.addEventListener('click', function () {
        if (skeleton && realData) {
          skeleton.style.display = 'none';
          realData.style.display = '';
        }
      });
    });
  });
})();
