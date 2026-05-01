(function () {
  var SUPPORTED = ['en', 'de', 'tr', 'fr', 'es', 'it', 'pt'];
  var LABELS = { en: 'EN', de: 'DE', tr: 'TR', fr: 'FR', es: 'ES', it: 'IT', pt: 'PT-BR' };
  var STORAGE_KEY = 'sda_locale_pref_' + window.location.hostname;

  function withTrailingSlash(path) {
    if (!path) return '/';
    return path.endsWith('/') ? path : path + '/';
  }

  function parsePath(pathname) {
    var segs = pathname.split('/').filter(Boolean);
    var locale = 'en';
    var hasLocalePrefix = false;

    if (segs.length > 0 && SUPPORTED.indexOf(segs[0]) >= 0 && segs[0] !== 'en') {
      locale = segs[0];
      hasLocalePrefix = true;
      segs.shift();
    }

    var base = '/' + segs.join('/');
    if (base === '/') {
      return { locale: locale, hasLocalePrefix: hasLocalePrefix, base: '/' };
    }

    return {
      locale: locale,
      hasLocalePrefix: hasLocalePrefix,
      base: withTrailingSlash(base)
    };
  }

  function buildPath(locale, base) {
    if (locale === 'en') return base;
    return '/' + locale + (base === '/' ? '/' : base);
  }

  function browserPreferredLocale() {
    var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']);
    for (var i = 0; i < langs.length; i += 1) {
      var code = (langs[i] || '').toLowerCase().slice(0, 2);
      if (SUPPORTED.indexOf(code) >= 0) return code;
    }
    return 'en';
  }

  function shouldAutoRedirect(pathname) {
    var blockedPrefixes = ['/google', '/404'];
    for (var i = 0; i < blockedPrefixes.length; i += 1) {
      if (pathname.indexOf(blockedPrefixes[i]) === 0) return false;
    }
    return true;
  }

  var pathInfo = parsePath(window.location.pathname);
  var savedLocale = localStorage.getItem(STORAGE_KEY);
  if (savedLocale && SUPPORTED.indexOf(savedLocale) < 0) savedLocale = null;

  var targetLocale = pathInfo.locale;
  if (!pathInfo.hasLocalePrefix) {
    if (savedLocale) {
      targetLocale = savedLocale;
    } else {
      targetLocale = browserPreferredLocale();
    }
  }

  var shouldRedirect = !pathInfo.hasLocalePrefix && targetLocale !== 'en' && shouldAutoRedirect(window.location.pathname);
  if (shouldRedirect) {
    var targetPath = buildPath(targetLocale, pathInfo.base);
    if (targetPath !== window.location.pathname) {
      window.location.replace(targetPath + window.location.search + window.location.hash);
      return;
    }
  }

  localStorage.setItem(STORAGE_KEY, pathInfo.locale);

  var section = document.createElement('section');
  section.style.padding = '18px 16px 26px';
  section.style.textAlign = 'center';

  var wrap = document.createElement('div');
  wrap.style.display = 'inline-flex';
  wrap.style.alignItems = 'center';
  wrap.style.gap = '8px';
  wrap.style.background = 'rgba(12, 16, 34, 0.9)';
  wrap.style.border = '1px solid rgba(120, 140, 200, 0.35)';
  wrap.style.borderRadius = '999px';
  wrap.style.padding = '8px 12px';

  var label = document.createElement('span');
  label.textContent = 'Lang';
  label.style.fontSize = '12px';
  label.style.opacity = '0.9';
  label.style.fontFamily = 'Inter, sans-serif';

  var select = document.createElement('select');
  select.setAttribute('aria-label', 'Language');
  select.style.background = 'transparent';
  select.style.color = '#E8EDFF';
  select.style.border = '0';
  select.style.outline = 'none';
  select.style.fontSize = '12px';
  select.style.fontWeight = '700';
  select.style.cursor = 'pointer';

  for (var j = 0; j < SUPPORTED.length; j += 1) {
    var code = SUPPORTED[j];
    var opt = document.createElement('option');
    opt.value = code;
    opt.textContent = LABELS[code];
    opt.style.color = '#10142A';
    if (code === pathInfo.locale) opt.selected = true;
    select.appendChild(opt);
  }

  select.addEventListener('change', function (e) {
    var next = e.target.value;
    localStorage.setItem(STORAGE_KEY, next);
    var nextPath = buildPath(next, pathInfo.base);
    window.location.href = nextPath + window.location.search + window.location.hash;
  });

  wrap.appendChild(label);
  wrap.appendChild(select);
  section.appendChild(wrap);
  document.body.appendChild(section);
})();
