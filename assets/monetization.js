(function () {
  'use strict';

  var ENTRY_PARAM_KEYS = ['mt_from', 'mt_slot', 'mt_kind'];

  function normalizeAnalyticsValue(value, maxLength) {
    return String(value || '')
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .slice(0, maxLength || 80);
  }

  function fireEvent(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: name, monetization: params });
    }
  }

  function getPageKey(pathname) {
    if (!pathname || pathname === '/') {
      return 'index';
    }

    return pathname
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-z0-9_-]+/gi, '_')
      .toLowerCase();
  }

  function getPageRole() {
    return document.body ? document.body.getAttribute('data-page-role') || '' : '';
  }

  function getEntryParams() {
    if (window.__vgMonetizationEntry) {
      return window.__vgMonetizationEntry;
    }

    try {
      var params = new URLSearchParams(window.location.search);
      var entry = {
        from: normalizeAnalyticsValue(params.get('mt_from'), 80),
        slot: normalizeAnalyticsValue(params.get('mt_slot'), 80),
        kind: normalizeAnalyticsValue(params.get('mt_kind'), 80)
      };
      window.__vgMonetizationEntry = entry;
      return entry;
    } catch (error) {
      var fallbackEntry = {
        from: '',
        slot: '',
        kind: ''
      };
      window.__vgMonetizationEntry = fallbackEntry;
      return fallbackEntry;
    }
  }

  function clearEntryParams() {
    if (!window.history.replaceState) {
      return;
    }

    var url = new URL(window.location.href);
    var changed = false;

    ENTRY_PARAM_KEYS.forEach(function (key) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    });

    if (!changed) {
      return;
    }

    var nextUrl = url.pathname;
    if (url.searchParams.toString()) {
      nextUrl += '?' + url.searchParams.toString();
    }
    nextUrl += url.hash;
    window.history.replaceState({}, document.title, nextUrl);
  }

  function trimLabel(text) {
    return (text || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  function decorateInternalLinks() {
    var anchors = document.querySelectorAll('a[data-cta-kind]');
    var pageKey = getPageKey(window.location.pathname);

    anchors.forEach(function (anchor) {
      var href = anchor.getAttribute('href');
      if (!href || anchor.getAttribute('target') === '_blank') {
        return;
      }

      var url;
      try {
        url = new URL(href, window.location.href);
      } catch (error) {
        return;
      }

      if (url.origin !== window.location.origin) {
        return;
      }

      url.searchParams.set('mt_from', pageKey);

      var slot = anchor.getAttribute('data-slot');
      var kind = anchor.getAttribute('data-cta-kind');

      if (slot) {
        url.searchParams.set('mt_slot', slot);
      }
      if (kind) {
        url.searchParams.set('mt_kind', kind);
      }

      anchor.setAttribute('href', url.pathname + url.search + url.hash);
    });
  }

  function trackEntryLanding() {
    var entry = getEntryParams();
    if (!entry.from && !entry.slot && !entry.kind) {
      return;
    }

    fireEvent('monetization_landing', {
      page: normalizeAnalyticsValue(window.location.pathname, 160),
      page_key: normalizeAnalyticsValue(getPageKey(window.location.pathname), 80),
      page_role: normalizeAnalyticsValue(getPageRole(), 80),
      entry_from: entry.from,
      entry_slot: entry.slot,
      entry_kind: entry.kind
    });

    clearEntryParams();
  }

  function trackClick(event) {
    var anchor = event.target.closest('a[data-cta-kind], a[data-aff-key]');
    if (!anchor) {
      return;
    }

    var url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch (error) {
      return;
    }

    var entry = getEntryParams();
    var isAffiliate = anchor.hasAttribute('data-aff-key');

    fireEvent('monetization_cta_click', {
      page: normalizeAnalyticsValue(window.location.pathname, 160),
      page_key: normalizeAnalyticsValue(getPageKey(window.location.pathname), 80),
      page_role: normalizeAnalyticsValue(getPageRole(), 80),
      cta_kind: normalizeAnalyticsValue(
        isAffiliate ? 'affiliate' : anchor.getAttribute('data-cta-kind'),
        80
      ),
      slot: normalizeAnalyticsValue(anchor.getAttribute('data-slot'), 80),
      cta_label: trimLabel(anchor.textContent),
      target_host: normalizeAnalyticsValue(url.host, 255),
      target_path: normalizeAnalyticsValue(url.pathname, 500),
      target_type: url.origin === window.location.origin ? 'internal' : 'external',
      entry_from: entry.from,
      entry_slot: entry.slot,
      entry_kind: entry.kind,
      aff_key: normalizeAnalyticsValue(anchor.getAttribute('data-aff-key'), 80),
      aff_status: normalizeAnalyticsValue(anchor.getAttribute('data-aff-status'), 40),
      aff_item: normalizeAnalyticsValue(anchor.getAttribute('data-item'), 80),
      aff_network: normalizeAnalyticsValue(anchor.getAttribute('data-network'), 40)
    });
  }

  function init() {
    decorateInternalLinks();
    trackEntryLanding();
    document.addEventListener('click', trackClick, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
