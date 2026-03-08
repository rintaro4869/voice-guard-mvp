(function () {
  'use strict';

  var LINKS_URL = '/assets/affiliate-links.json';

  /**
   * Fire aff_click tracking event via gtag or dataLayer.
   * Silently skips if neither is available.
   */
  function fireEvent(params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'aff_click', params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: 'aff_click', aff: params });
    }
    // no-op if neither exists
  }

  /**
   * Attach click handler to a single affiliate element.
   * Reads resolved URL from element's href at click time.
   */
  function attachClickHandler(el) {
    el.addEventListener('click', function () {
      var params = {
        page: window.location.pathname,
        slot: el.getAttribute('data-slot') || '',
        item: el.getAttribute('data-item') || '',
        network: el.getAttribute('data-network') || '',
        destination: el.href || el.getAttribute('href') || ''
      };
      fireEvent(params);
    });
  }

  /**
   * Inject resolved href from linksMap into all elements
   * that have a matching data-aff-key attribute.
   */
  function injectLinks(linksMap) {
    var elements = document.querySelectorAll('[data-aff-key]');
    elements.forEach(function (el) {
      var key = el.getAttribute('data-aff-key');
      if (key && linksMap[key]) {
        el.setAttribute('href', linksMap[key]);
      }
      // Always attach handler (even if key not found, fallback href is used)
      attachClickHandler(el);
    });
  }

  /**
   * Attach click handlers using fallback hrefs only
   * (called when JSON fetch fails).
   */
  function injectFallbackHandlers() {
    var elements = document.querySelectorAll('[data-aff-key]');
    elements.forEach(function (el) {
      attachClickHandler(el);
    });
  }

  /**
   * Main init: fetch affiliate-links.json, inject hrefs, attach handlers.
   */
  function init() {
    fetch(LINKS_URL)
      .then(function (res) {
        if (!res.ok) {
          throw new Error('affiliate-links.json fetch failed: ' + res.status);
        }
        return res.json();
      })
      .then(function (linksMap) {
        injectLinks(linksMap);
      })
      .catch(function () {
        // Graceful degradation: fallback hrefs remain, just attach click handlers
        injectFallbackHandlers();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
