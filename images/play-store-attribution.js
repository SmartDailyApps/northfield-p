(() => {
  const playStoreSelector = 'a[href*="play.google.com/store/apps/details?id=com.mygoldfolio.app"]';
  const siteLocale = (document.documentElement.lang || 'en').toLowerCase();

  document.querySelectorAll(playStoreSelector).forEach((link) => {
    let ctaLocation = 'play_store';
    let campaign = 'mgf_website';

    try {
      const destination = new URL(link.href);
      const referrer = new URLSearchParams(destination.searchParams.get('referrer') || '');
      ctaLocation = referrer.get('utm_content') || ctaLocation;
      campaign = referrer.get('utm_campaign') || campaign;
    } catch (_) {
      // Keep the default labels if a future link is malformed.
    }

    link.addEventListener('click', () => {
      const eventParameters = {
        play_cta_location: ctaLocation,
        play_site_locale: siteLocale,
        play_campaign: campaign,
        transport_type: 'beacon',
      };

      window.siteAnalytics?.track('play_store_click', eventParameters);
    });
  });
})();
