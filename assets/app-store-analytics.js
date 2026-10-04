document.addEventListener("click", (event) => {
  const anchor = event.target instanceof Element ? event.target.closest("a[data-cta-kind='app_store']") : null;
  if (!anchor || typeof window.gtag !== "function") return;
  try {
    const destination = new URL(anchor.href);
    if (destination.hostname !== "apps.apple.com" || destination.pathname !== "/jp/app/id6803588933") return;
    window.gtag("event", "app_store_cta_click", {
      slot: anchor.dataset.slot || "unknown",
      device_type: /iPhone|iPad|iPod/i.test(navigator.userAgent) ? "ios" : "other",
    });
  } catch {
    // A malformed link must not interrupt navigation.
  }
}, { passive: true });
