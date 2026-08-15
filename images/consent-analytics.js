(() => {
  'use strict';

  const loader = document.currentScript;
  if (!loader) return;

  const site = loader.dataset.site === 'studio' ? 'studio' : 'product';
  const gtmId = loader.dataset.gtmId;
  const storageKey = loader.dataset.consentKey;
  const grantedValue = 'granted';
  const deniedValue = 'denied';
  const validChoices = new Set([grantedValue, deniedValue]);

  if (!gtmId || !storageKey) {
    console.error('Analytics consent configuration is incomplete.');
    return;
  }

  const localeKey = (() => {
    const value = (document.documentElement.lang || 'en').toLowerCase();
    if (value.startsWith('pt')) return 'pt';
    return ['de', 'fr', 'tr', 'es', 'it'].includes(value.slice(0, 2))
      ? value.slice(0, 2)
      : 'en';
  })();

  const messages = {
    en: {
      title: 'Optional analytics',
      body: 'Help us understand which pages and guides are useful. Analytics stays off unless you accept. No portfolio data is involved.',
      accept: 'Accept analytics',
      reject: 'Keep analytics off',
      settings: 'Analytics settings',
      policy: 'Privacy policy',
    },
    de: {
      title: 'Optionale Analyse',
      body: 'Hilf uns zu verstehen, welche Seiten und Ratgeber nützlich sind. Die Analyse bleibt aus, bis du zustimmst. Portfoliodaten sind nicht betroffen.',
      accept: 'Analyse erlauben',
      reject: 'Analyse ausgeschaltet lassen',
      settings: 'Analyse-Einstellungen',
      policy: 'Datenschutz',
    },
    fr: {
      title: 'Analyse facultative',
      body: 'Aidez-nous à comprendre quelles pages et quels guides sont utiles. L’analyse reste désactivée sans votre accord. Aucune donnée de portefeuille n’est concernée.',
      accept: 'Accepter l’analyse',
      reject: 'Laisser l’analyse désactivée',
      settings: 'Paramètres d’analyse',
      policy: 'Confidentialité',
    },
    tr: {
      title: 'İsteğe bağlı analiz',
      body: 'Hangi sayfa ve rehberlerin yararlı olduğunu anlamamıza yardımcı olun. Siz kabul etmedikçe analiz kapalı kalır. Portföy verileri kullanılmaz.',
      accept: 'Analizi kabul et',
      reject: 'Analizi kapalı tut',
      settings: 'Analiz ayarları',
      policy: 'Gizlilik politikası',
    },
    es: {
      title: 'Analítica opcional',
      body: 'Ayúdanos a saber qué páginas y guías resultan útiles. La analítica permanece desactivada salvo que la aceptes. No intervienen datos de cartera.',
      accept: 'Aceptar analítica',
      reject: 'Mantenerla desactivada',
      settings: 'Ajustes de analítica',
      policy: 'Privacidad',
    },
    it: {
      title: 'Analisi facoltativa',
      body: 'Aiutaci a capire quali pagine e guide sono utili. L’analisi resta disattivata finché non la accetti. Non vengono usati dati del portafoglio.',
      accept: 'Accetta l’analisi',
      reject: 'Mantieni l’analisi disattivata',
      settings: 'Impostazioni analisi',
      policy: 'Privacy',
    },
    pt: {
      title: 'Análise opcional',
      body: 'Ajude-nos a entender quais páginas e guias são úteis. A análise permanece desativada até você aceitar. Nenhum dado da carteira é usado.',
      accept: 'Aceitar análise',
      reject: 'Manter análise desativada',
      settings: 'Configurações de análise',
      policy: 'Privacidade',
    },
  };

  const policyPaths = site === 'studio'
    ? {
        en: '/cookie-policy/',
        de: '/de/cookie-policy/',
        fr: '/fr/cookie-policy/',
        tr: '/tr/cookie-policy/',
        es: '/es/cookie-policy/',
        it: '/it/cookie-policy/',
        pt: '/pt/cookie-policy/',
      }
    : {
        en: '/privacy/',
        de: '/de/privacy/',
        fr: '/fr/privacy/',
        tr: '/tr/privacy/',
        es: '/es/privacy/',
        it: '/it/privacy/',
        pt: '/pt/privacy/',
      };

  const copy = messages[localeKey];
  let choice = readChoice();
  let gtmLoaded = false;

  window.dataLayer = window.dataLayer || [];

  window.gtag = function gtag() {
    if (arguments[0] === 'event' && choice !== grantedValue) return;
    window.dataLayer.push(arguments);
  };

  setConsent('default', choice === grantedValue ? grantedValue : deniedValue);

  if (choice === grantedValue) {
    loadGtm();
  }

  window.siteAnalytics = Object.freeze({
    isGranted: () => choice === grantedValue,
    track(eventName, parameters = {}) {
      if (choice !== grantedValue || typeof eventName !== 'string' || !eventName) {
        return false;
      }
      window.dataLayer.push({
        event: eventName,
        ...parameters,
      });
      return true;
    },
    openPreferences() {
      renderUi();
      showPanel();
    },
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderUi, { once: true });
  } else {
    renderUi();
  }

  function readChoice() {
    try {
      const stored = window.localStorage.getItem(storageKey);
      return validChoices.has(stored) ? stored : null;
    } catch (_) {
      return null;
    }
  }

  function persistChoice(nextChoice) {
    try {
      window.localStorage.setItem(storageKey, nextChoice);
    } catch (_) {
      // The choice remains active for this page when storage is unavailable.
    }
  }

  function consentFields(value) {
    return {
      analytics_storage: value,
      ad_storage: deniedValue,
      ad_user_data: deniedValue,
      ad_personalization: deniedValue,
      functionality_storage: deniedValue,
      personalization_storage: deniedValue,
      security_storage: grantedValue,
      wait_for_update: 500,
    };
  }

  function setConsent(command, value) {
    window.gtag('consent', command, consentFields(value));
  }

  function loadGtm() {
    if (gtmLoaded) return;
    gtmLoaded = true;

    window.dataLayer.push({
      'gtm.start': Date.now(),
      event: 'gtm.js',
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
    script.dataset.consentManaged = 'true';
    document.head.appendChild(script);
  }

  function applyChoice(nextChoice) {
    const shouldReloadOnWithdrawal = nextChoice === deniedValue && gtmLoaded;

    choice = nextChoice;
    persistChoice(nextChoice);
    setConsent('update', nextChoice);

    if (nextChoice === grantedValue) {
      loadGtm();
      window.dispatchEvent(new CustomEvent('site-analytics-consent-granted'));
    } else {
      window.dispatchEvent(new CustomEvent('site-analytics-consent-denied'));
      if (shouldReloadOnWithdrawal) {
        window.location.reload();
        return;
      }
    }

    hidePanel();
  }

  function renderUi() {
    if (document.getElementById('site-consent-panel')) return;

    const accent = site === 'studio' ? '#8F73FF' : '#D4A843';
    const accentText = site === 'studio' ? '#FFFFFF' : '#0F0F1A';
    const style = document.createElement('style');
    style.id = 'site-consent-styles';
    style.textContent = `
      #site-consent-panel, #site-consent-settings {
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #site-consent-panel {
        position: fixed; left: 50%; bottom: 16px; z-index: 2147483646;
        width: min(680px, calc(100% - 24px)); transform: translateX(-50%);
        color: #F4F4F7; background: #151526; border: 1px solid rgba(255,255,255,.18);
        border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.45); padding: 18px;
      }
      #site-consent-panel[hidden], #site-consent-settings[hidden] { display: none !important; }
      #site-consent-panel h2 { margin: 0 0 8px; color: #FFFFFF; font-size: 18px; line-height: 1.3; font-weight: 800; }
      #site-consent-panel p { margin: 0; color: #D4D4DC; font-size: 14px; line-height: 1.55; }
      #site-consent-panel a { color: ${accent}; text-decoration: underline; text-underline-offset: 3px; }
      #site-consent-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
      #site-consent-actions button {
        min-height: 44px; flex: 1 1 190px; border-radius: 11px; padding: 10px 14px;
        font: inherit; font-size: 14px; font-weight: 750; cursor: pointer;
      }
      #site-consent-reject { color: #F4F4F7; background: transparent; border: 1px solid rgba(255,255,255,.35); }
      #site-consent-accept { color: ${accentText}; background: ${accent}; border: 1px solid ${accent}; }
      #site-consent-actions button:hover { filter: brightness(1.08); }
      #site-consent-actions button:focus-visible, #site-consent-settings:focus-visible {
        outline: 3px solid #FFFFFF; outline-offset: 3px;
      }
      #site-consent-settings {
        display: block; min-height: 40px; margin: 14px auto 0; padding: 8px 12px;
        color: #A9A9B6; background: transparent; border: 0;
        font-size: 12px; font-weight: 700; text-decoration: underline;
        text-underline-offset: 3px; cursor: pointer;
      }
      #site-consent-settings:hover { color: ${accent}; }
      @media (max-width: 480px) {
        #site-consent-panel { bottom: 8px; width: calc(100% - 16px); padding: 16px; }
        #site-consent-actions { flex-direction: column; }
        #site-consent-actions button { width: 100%; flex-basis: auto; }
      }
      @media (prefers-reduced-motion: reduce) {
        #site-consent-panel, #site-consent-settings { scroll-behavior: auto; }
      }
    `;

    const panel = document.createElement('section');
    panel.id = 'site-consent-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', 'site-consent-title');
    panel.innerHTML = `
      <h2 id="site-consent-title"></h2>
      <p><span id="site-consent-body"></span> <a id="site-consent-policy"></a></p>
      <div id="site-consent-actions">
        <button id="site-consent-reject" type="button"></button>
        <button id="site-consent-accept" type="button"></button>
      </div>
    `;

    const settings = document.createElement('button');
    settings.id = 'site-consent-settings';
    settings.type = 'button';
    settings.setAttribute('aria-controls', 'site-consent-panel');
    settings.setAttribute('aria-expanded', 'false');

    document.head.appendChild(style);
    document.body.append(panel);
    (document.querySelector('footer') || document.body).append(settings);

    panel.querySelector('#site-consent-title').textContent = copy.title;
    panel.querySelector('#site-consent-body').textContent = copy.body;
    const policyLink = panel.querySelector('#site-consent-policy');
    policyLink.textContent = copy.policy;
    policyLink.href = policyPaths[localeKey];
    panel.querySelector('#site-consent-reject').textContent = copy.reject;
    panel.querySelector('#site-consent-accept').textContent = copy.accept;
    settings.textContent = copy.settings;
    settings.setAttribute('aria-label', copy.settings);

    panel.querySelector('#site-consent-reject').addEventListener('click', () => applyChoice(deniedValue));
    panel.querySelector('#site-consent-accept').addEventListener('click', () => applyChoice(grantedValue));
    settings.addEventListener('click', showPanel);

    if (validChoices.has(choice)) {
      panel.hidden = true;
      settings.hidden = false;
    } else {
      panel.hidden = false;
      settings.hidden = true;
    }
  }

  function showPanel() {
    const panel = document.getElementById('site-consent-panel');
    const settings = document.getElementById('site-consent-settings');
    if (!panel || !settings) return;
    panel.hidden = false;
    settings.hidden = true;
    settings.setAttribute('aria-expanded', 'true');
    panel.querySelector('#site-consent-reject')?.focus({ preventScroll: true });
  }

  function hidePanel() {
    const panel = document.getElementById('site-consent-panel');
    const settings = document.getElementById('site-consent-settings');
    if (!panel || !settings) return;
    panel.hidden = true;
    settings.hidden = false;
    settings.setAttribute('aria-expanded', 'false');
    settings.focus({ preventScroll: true });
  }
})();
