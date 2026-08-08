(() => {
  const guide = document.querySelector('[data-guide-id]');
  if (!guide) return;

  const parameters = {
    guide_id: guide.dataset.guideId,
    guide_locale: guide.dataset.guideLocale,
    guide_category: guide.dataset.guideCategory,
    transport_type: 'beacon',
  };

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'guide_view', parameters);
  } else if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: 'guide_view', ...parameters });
  }
})();
