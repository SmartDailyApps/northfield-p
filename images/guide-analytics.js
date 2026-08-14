(() => {
  const guide = document.querySelector('[data-guide-id]');
  if (!guide) return;

  const parameters = {
    guide_id: guide.dataset.guideId,
    guide_locale: guide.dataset.guideLocale,
    guide_category: guide.dataset.guideCategory,
    transport_type: 'beacon',
  };

  let sent = false;
  const send = () => {
    if (sent || !window.siteAnalytics) return;
    sent = window.siteAnalytics.track('guide_view', parameters);
  };

  send();
  window.addEventListener('site-analytics-consent-granted', send);
})();
