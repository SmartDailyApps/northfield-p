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

  function matchesLocale(lang, target) {
    if (!lang) return false;
    lang = lang.toLowerCase();
    if (lang === target) return true;
    if (target === 'en' && (lang === 'en-us' || lang === 'en-gb' || lang === 'x-default')) return true;
    if (target === 'de' && (lang === 'de-de' || lang === 'de-at' || lang === 'de-ch')) return true;
    if (target === 'pt' && (lang === 'pt-br' || lang === 'pt-pt')) return true;
    if (target === 'fr' && (lang === 'fr-fr' || lang === 'fr-ca')) return true;
    if (target === 'es' && (lang === 'es-es' || lang === 'es-mx')) return true;
    if (target === 'it' && lang === 'it-it') return true;
    if (target === 'tr' && lang === 'tr-tr') return true;
    return false;
  }

  function getAlternatePath(targetLocale, fallbackBase) {
    var links = document.querySelectorAll('link[rel="alternate"][hreflang]');
    for (var i = 0; i < links.length; i += 1) {
      var link = links[i];
      var hreflang = link.getAttribute('hreflang') || '';
      if (matchesLocale(hreflang, targetLocale)) {
        var href = link.getAttribute('href');
        if (href) {
          try {
            var u = new URL(href, window.location.origin);
            return withTrailingSlash(u.pathname);
          } catch (e) {
            var cleaned = href.replace(/^https?:\/\/[^\/]+/, '');
            return withTrailingSlash(cleaned);
          }
        }
      }
    }
    return buildPath(targetLocale, fallbackBase);
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
    var targetPath = getAlternatePath(targetLocale, pathInfo.base);
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
  wrap.style.background = 'rgba(14, 19, 40, 0.95)';
  wrap.style.border = '1px solid rgba(226, 184, 75, 0.4)';
  wrap.style.borderRadius = '999px';
  wrap.style.padding = '8px 14px';
  wrap.style.boxShadow = '0 4px 14px rgba(0,0,0,0.2)';

  var label = document.createElement('ion-icon');
  label.setAttribute('name', 'globe-outline');
  label.style.fontSize = '15px';
  label.style.color = '#E2B84B';

  var select = document.createElement('select');
  select.setAttribute('aria-label', 'Language');
  select.style.background = 'transparent';
  select.style.color = '#E8EDFF';
  select.style.border = '0';
  select.style.outline = 'none';
  select.style.fontSize = '13px';
  select.style.fontWeight = '600';
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
    var nextPath = getAlternatePath(next, pathInfo.base);
    window.location.href = nextPath + window.location.search + window.location.hash;
  });

  wrap.appendChild(label);
  wrap.appendChild(select);
  section.appendChild(wrap);
  document.body.appendChild(section);
})();

