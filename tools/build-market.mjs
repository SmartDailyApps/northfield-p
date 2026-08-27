import { mkdir, writeFile } from 'fs/promises';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { locales, metals, marketPath } from './market-content.mjs';
import { consentHead, tailwind, absoluteUrl, esc, brandWordmark, playUrl, sharedFooter } from './build-ratgeber.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..');

const dryRun = process.argv.includes('--dry-run');

function pathToOutput(path) {
  return resolve(repoRoot, path.startsWith('/') ? path.slice(1) : path, 'index.html');
}

function languageLinks(currentCode, currentMetal) {
  return Object.values(locales).map((locale) => {
    const path = currentMetal ? marketPath(currentMetal, locale) : locale.marketPath;
    return `<a href="${path}"${locale.code === currentCode ? ' aria-current="page"' : ''}>${locale.label}</a>`;
  }).join('');
}

function hreflang(currentMetal) {
  const links = Object.values(locales).map((locale) => {
    const path = currentMetal ? marketPath(currentMetal, locale) : locale.marketPath;
    return `<link rel="alternate" hreflang="${locale.locale}" href="${absoluteUrl(path)}" />`;
  });
  const defaultPath = currentMetal ? marketPath(currentMetal, locales.en) : locales.en.marketPath;
  links.push(`<link rel="alternate" hreflang="x-default" href="${absoluteUrl(defaultPath)}" />`);
  return links.join('\n');
}

function marketNav(locale, currentMetal) {
  return `<nav class="sticky top-0 z-50 border-b border-border/40 bg-navy/90 backdrop-blur"><div class="guide-shell guide-nav flex min-h-[68px] items-center justify-between gap-4"><a href="${locale.code === 'en' ? '/' : `/${locale.code}/`}" class="flex items-center gap-3"><img src="/images/icon.png" alt="MyGoldFolio" class="h-8 w-8 rounded-xl flex-shrink-0" />${brandWordmark()}</a><div class="flex items-center gap-4 text-sm"><a href="${locale.marketPath}" class="guide-nav-chip guide-nav-chip--active flex items-center gap-1.5 cta-pulse"><span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-gold"></span></span>${esc(locale.marketLabel)}</a><a href="${locale.code === 'en' ? '/#download' : `/${locale.code}/#download`}" class="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gold px-4 py-2 text-xs font-bold text-navy shadow-lg shadow-gold/20 transition hover:bg-amber sm:text-sm"><ion-icon name="logo-google-playstore" style="font-size:14px;"></ion-icon><span>${esc(locale.appLabel)}</span></a></div></div></nav>`;
}

function marketPage(locale, metal) {
  const content = metal.locales[locale.code];
  const canonical = absoluteUrl(marketPath(metal, locale));
  
  // Dummy article item for the app-install link attribution
  const dummyArticleItem = { id: `market-${metal.id}` };

  const breadcrumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: locale.homeLabel, item: absoluteUrl(locale.code === 'en' ? '/' : `/${locale.code}/`) }, { '@type': 'ListItem', position: 2, name: locale.marketLabel, item: absoluteUrl(locale.marketPath) }, { '@type': 'ListItem', position: 3, name: content.title, item: canonical }] };
  const articleLd = { '@context': 'https://schema.org', '@type': 'Article', headline: content.title, description: content.description, inLanguage: locale.locale, author: { '@type': 'Organization', name: 'MyGoldFolio' }, publisher: { '@type': 'Organization', name: 'MyGoldFolio', logo: { '@type': 'ImageObject', url: absoluteUrl('/images/icon.png') } }, mainEntityOfPage: canonical };

  // Extract localized features and stats from home page
  const homePath = pathToOutput(locale.code === 'en' ? '/' : `/${locale.code}/`);
  let sharedFeaturesHtml = '';
  let sharedHeroHtml = '';
  try {
    const homeHtml = readFileSync(homePath, 'utf8');
    const featMatch = homeHtml.match(/<!-- Built For Precious Metals -->([\s\S]*?)(?=<!-- Stats strip -->)/);
    if (featMatch) {
      sharedFeaturesHtml = '<!-- Built For Precious Metals -->' + featMatch[1];
    }
    const heroMatch = homeHtml.match(/<!-- Hero -->([\s\S]*?)(?=<!-- Built For Precious Metals -->)/);
    if (heroMatch) {
      sharedHeroHtml = '<!-- Hero CTA -->' + heroMatch[1]
        .replace(/href="#download"/g, `href="${locale.code === 'en' ? '/' : `/${locale.code}/`}#download"`)
        .replace(/href="#plans"/g, `href="${locale.code === 'en' ? '/' : `/${locale.code}/`}#plans"`)
        .replace(/href="#features"/g, `href="${locale.code === 'en' ? '/' : `/${locale.code}/`}#features"`);
    }
  } catch (e) {
    console.error('Could not load home html for ' + locale.code);
  }

  return `<!DOCTYPE html>
<html lang="${locale.locale}"><head>
${consentHead()}
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(content.seoTitle)}</title><meta name="description" content="${esc(content.description)}" />
<meta property="og:title" content="${esc(content.seoTitle)}" /><meta property="og:description" content="${esc(content.description)}" /><meta property="og:type" content="article" /><meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/images/icon.png" /><link rel="canonical" href="${canonical}" />
${hreflang(metal)}
<link rel="alternate" hreflang="x-default" href="${absoluteUrl(marketPath(metal, locales.en))}" />
${tailwind()}
<script type="application/ld+json">${JSON.stringify(articleLd)}</script><script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
<style>
.tv-placeholder {
  width: 100%; height: 500px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #0f0f1a; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; text-align: center; padding: 2rem;
}
.tv-placeholder-icon { font-size: 3rem; color: #D4A843; margin-bottom: 1rem; opacity: 0.5; }
.tv-placeholder-text { font-size: 0.875rem; color: #9ca3af; max-width: 400px; }
</style>
</head><body class="bg-navy text-gray-200">
${marketNav(locale, metal)}
<main data-market-id="${metal.id}" data-market-locale="${locale.code}">
  <section class="guide-hub-hero">
    <div class="guide-shell max-w-4xl text-center">
      <nav class="guide-breadcrumb justify-center mb-6" aria-label="Breadcrumb">
        <a href="${locale.code === 'en' ? '/' : `/${locale.code}/`}">${esc(locale.homeLabel)}</a>
        <span aria-hidden="true">/</span>
        <a href="${locale.marketPath}">${esc(locale.marketLabel)}</a>
      </nav>
      <h1 class="text-4xl md:text-5xl font-black text-white mb-4">${esc(content.title)}</h1>
      <p class="text-gray-400 max-w-2xl mx-auto">${esc(content.description)}</p>
    </div>
  </section>
  <div class="guide-shell">
    <div class="py-16 md:py-24">
      <div class="bg-navy-light/40 border border-${metal.theme === 'gold' ? 'gold' : metal.theme + '-400'}/30 rounded-[2rem] p-4 md:p-6 shadow-2xl relative overflow-hidden" data-aos="fade-up">
      <!-- Glow effect -->
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-gold/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <!-- TradingView Widget Container -->
      <div class="relative w-full rounded-xl overflow-hidden border border-white/5 bg-[#0f0f1a] p-1" style="height: 550px;">
        <div class="w-full h-full rounded-lg overflow-hidden relative" style="transform: translateZ(0);">
          <div id="tv-placeholder" class="tv-placeholder h-full">
            <ion-icon name="bar-chart-outline" class="tv-placeholder-icon"></ion-icon>
            <p class="tv-placeholder-text">${esc(locale.consentPrompt)}</p>
            <button data-consent-accept="functional" class="mt-4 rounded-full bg-navy/50 border border-white/10 px-4 py-2 text-xs font-bold hover:bg-navy transition cursor-pointer">Accept Cookies</button>
          </div>
          <!-- Widget container -->
          <div class="tradingview-widget-container" style="height:100%;width:100%">
            <div id="tradingview_chart" class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="relative overflow-hidden w-full mt-4 border-t border-white/5 bg-gradient-to-b from-navy via-[#12121d] to-navy">
    <div class="absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
    
    <!-- Hero (Set It. Forget It.) -->
    <div class="relative z-10 pt-10 md:pt-16 pb-8 md:pb-12">
      ${sharedHeroHtml.replace('href="#download"', `href="${locale.code === 'en' ? '/#download' : `/${locale.code}/#download`}"`)}
    </div>
    
    <!-- Features Grid -->
    <div class="relative z-10 pb-16 md:pb-24 -mt-8 md:-mt-12">
      ${sharedFeaturesHtml.replace('border-b border-border/20', 'border-b-0').replace('py-16', 'py-8')}
    </div>
  </div>
</main>
${sharedFooter(locale)}
<script src="/assets/js/aos.js"></script>
<script>
  AOS.init({ duration: 800, once: true, offset: 50, easing: 'ease-out-back' });
  
  document.addEventListener("DOMContentLoaded", function() {
    const container = document.getElementById("tv-container");
    const placeholder = document.getElementById("tv-placeholder");
    
    let widgetLoaded = false;
    
    // Function to load the widget
    function loadTradingView() {
      if (widgetLoaded) return;
      widgetLoaded = true;
      placeholder.style.display = "none";
      
      const urlParams = new URLSearchParams(window.location.search);
      const fiat = urlParams.get('currency') || 'USD';
      let tvSymbol = "${metal.tvSymbol}";
      if (fiat !== 'USD') {
        // Just a naive replacement for the symbol if it's OANDA:XAUUSD -> OANDA:XAUEUR
        tvSymbol = tvSymbol.replace('USD', fiat.toUpperCase());
      }

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": tvSymbol,
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "2",
        "locale": "${locale.code}",
        "enable_publishing": false,
        "backgroundColor": "#0f0f1a",
        "gridColor": "rgba(255, 255, 255, 0.06)",
        "hide_top_toolbar": false,
        "hide_legend": false,
        "save_image": false,
        "allow_symbol_change": true,
        "container_id": "tradingview_chart",
        "support_host": "https://www.tradingview.com"
      });
      
      const widgetDiv = document.querySelector(".tradingview-widget-container__widget");
      widgetDiv.appendChild(script);
    }
    
    // Check consent before loading
    function checkConsentAndLoad() {
      // Use existing consent check logic (window.CookieConsent)
      // Actually, since MyGoldFolio uses cookie-consent, we should check it properly.
      // Or we can just check if CookieConsent object exists and function returns true.
      // Sometimes it's a specific cookie, like 'cookie-consent' = 'accepted'
      const match = document.cookie.match(new RegExp('(^| )cookie-consent=([^;]+)'));
      const hasConsent = match && match[2] === 'accepted';
      
      if (hasConsent) {
        // Observe viewport to lazy load
        if ('IntersectionObserver' in window) {
          const container = document.getElementById('tradingview_chart');
          if (!container) return;
          const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
              loadTradingView();
              observer.disconnect();
            }
          }, { rootMargin: '200px' });
          observer.observe(container);
        } else {
          loadTradingView();
        }
      }
    }

    // Existing CookieConsent system triggers an event or reload.
    // Let's hook into the global accept function if possible, or just poll initially.
    checkConsentAndLoad();
    
    // We should also listen for the event that might be dispatched
    document.addEventListener("cookieConsentUpdated", checkConsentAndLoad);
    document.addEventListener("click", function(e) {
      if (e.target.closest('[data-consent-accept]')) {
         document.cookie = "cookie-consent=accepted; path=/; max-age=31536000";
         if (window.CookieConsent && typeof window.CookieConsent.accept === 'function') {
           window.CookieConsent.accept('functional');
         }
         setTimeout(checkConsentAndLoad, 100);
      }
    });
  });
</script>
</body></html>`;
}

async function write(path, body) {
  if (dryRun) {
    console.log(`[dry run] ${path}`);
    return;
  }
  const output = pathToOutput(path);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, body, 'utf8');
  console.log(path);
}

function marketHubPage(locale) {
  const canonical = absoluteUrl(locale.marketPath);
  
  const breadcrumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: locale.homeLabel, item: absoluteUrl(locale.code === 'en' ? '/' : `/${locale.code}/`) }, { '@type': 'ListItem', position: 2, name: locale.marketLabel, item: canonical }] };

  // Generate metal cards
  const metalCards = metals.map(metal => {
    const content = metal.locales[locale.code];
    const borderColor = metal.theme === 'gold' ? 'gold' : `${metal.theme}-400`;
    return `<a href="${marketPath(metal, locale)}" class="guide-card block hover:ring-2 ring-${borderColor}/50 transition bg-navy-light/40 border border-${borderColor}/30 rounded-2xl p-6 relative overflow-hidden group">
      <div class="absolute -top-12 -right-12 w-24 h-24 bg-gold/10 blur-[30px] rounded-full pointer-events-none group-hover:bg-gold/20 transition duration-500"></div>
      <h3 class="text-xl font-bold text-white flex items-center gap-2 mb-2"><ion-icon name="trending-up-outline" class="text-gold"></ion-icon> ${esc(content.title)}</h3>
      <p class="text-gray-400 text-sm line-clamp-2">${esc(content.description)}</p>
      <span class="mt-4 inline-flex items-center gap-2 font-bold text-gold text-sm group-hover:translate-x-1 transition-transform">${esc(locale.marketLabel)} <span aria-hidden="true">→</span></span>
    </a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="${locale.locale}"><head>
${consentHead()}
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(locale.marketHubTitle)} | MyGoldFolio</title><meta name="description" content="${esc(locale.marketHubIntro)}" />
<meta property="og:title" content="${esc(locale.marketHubTitle)}" /><meta property="og:description" content="${esc(locale.marketHubIntro)}" /><meta property="og:type" content="website" /><meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/images/icon.png" /><link rel="canonical" href="${canonical}" />
${hreflang(null)} 
${tailwind()}
<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
</head><body class="bg-navy text-gray-200">
${marketNav(locale, null)}
<main>
  <section class="guide-hub-hero">
    <div class="guide-shell max-w-4xl text-center">
      <nav class="guide-breadcrumb justify-center mb-6" aria-label="Breadcrumb">
        <a href="${locale.code === 'en' ? '/' : `/${locale.code}/`}">${esc(locale.homeLabel)}</a>
      </nav>
      <h1 class="text-4xl md:text-5xl font-black text-white mb-4">${esc(locale.marketHubTitle)}</h1>
      <p class="text-gray-400 max-w-2xl mx-auto">${esc(locale.marketHubIntro)}</p>
    </div>
  </section>
  <div class="guide-shell">
    <div class="py-16 md:py-24 max-w-4xl mx-auto">
      <div class="grid sm:grid-cols-2 gap-6">
        ${metalCards}
      </div>
    </div>
  </div>
</main>
${sharedFooter(locale)}
</body></html>`;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
  for (const locale of Object.values(locales)) {
    await write(locale.marketPath, marketHubPage(locale));
    for (const metal of metals) {
      await write(marketPath(metal, locale), marketPage(locale, metal));
    }
  }
}
