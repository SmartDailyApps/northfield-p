import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { additionalArticles, article, locales } from './ratgeber-content.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const absoluteUrl = (path) => `https://mygoldfolio.de${path}`;
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const pathToOutput = (path) => resolve(repoRoot, path.replace(/^\//, ''), 'index.html');
const includeDrafts = process.argv.includes('--include-drafts');
const dryRun = process.argv.includes('--dry-run');
const allArticles = [article, ...additionalArticles];
// The original live guide predates the explicit status field; articles are live unless
// they are explicitly marked as drafts.
const publishedArticles = allArticles.filter((item) => item.status !== 'draft');
const outputArticles = includeDrafts ? allArticles : publishedArticles;

// Consent-gated measurement head. Must stay byte-identical to the loader contract
// enforced by scripts/check-measurement-consent.mjs (product): one consent loader,
// no direct GTM/gtag requests, no GTM noscript iframe.
export function consentHead() {
  return `
<script src="/images/consent-analytics.js" data-site="product" data-gtm-id="GTM-MKR2RFW2" data-consent-key="mgf_analytics_consent_v1"></script>`;
}

function tailwind() {
  return `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/assets/css/main.min.css" />
<script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script><script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
<link rel="stylesheet" href="/images/ratgeber.css" />`;
}

function articlePath(articleItem, locale) {
  return articleItem.paths?.[locale.code] || locale.articlePath;
}

function brandWordmark(className = 'text-lg font-extrabold tracking-tight text-white') {
  return `<span class="${className}">My<span class="text-[#E2B84B]">Gold</span>Folio</span>`;
}

function languageLinks(currentCode, currentArticle) {
  return Object.values(locales).map((locale) => {
    const path = currentArticle ? articlePath(currentArticle, locale) : locale.hubPath;
    return `<a href="${path}"${locale.code === currentCode ? ' aria-current="page"' : ''}>${locale.label}</a>`;
  }).join('');
}

function hreflang(currentArticle) {
  return Object.values(locales).map((locale) => {
    const path = currentArticle ? articlePath(currentArticle, locale) : locale.hubPath;
    return `<link rel="alternate" hreflang="${locale.locale}" href="${absoluteUrl(path)}" />`;
  }).join('\n');
}

function sharedNav(locale, currentArticle) {
  return `<nav class="sticky top-0 z-50 border-b border-border/40 bg-navy/90 backdrop-blur"><div class="guide-shell flex min-h-[68px] items-center justify-between gap-4"><a href="${locale.code === 'en' ? '/' : `/${locale.code}/`}" class="flex items-center gap-3"><img src="/images/icon.png" alt="MyGoldFolio" class="h-8 w-8 rounded-xl" />${brandWordmark()}</a><div class="flex items-center gap-4 text-sm"><details class="guide-languages"><summary aria-label="Language">${esc(locale.label)}</summary><div>${languageLinks(locale.code, currentArticle)}</div></details><a href="${locale.hubPath}" class="guide-nav-chip${currentArticle ? '' : ' guide-nav-chip--active'}">${esc(locale.hubLabel)}</a><a href="${locale.code === 'en' ? '/#download' : `/${locale.code}/#download`}" class="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gold px-4 py-2 text-xs font-bold text-navy shadow-lg shadow-gold/20 transition hover:bg-amber sm:text-sm"><ion-icon name="logo-google-playstore" style="font-size:14px;"></ion-icon><span>${esc(locale.appLabel)}</span></a></div></div></nav>`;
}

function sharedFooter(locale) {
  return `<footer class="border-t border-border/30 px-6 py-8 text-center text-xs text-muted"><p>© 2026 SmartDailyApps. All rights reserved.</p><div class="mt-3 flex flex-wrap justify-center gap-4"><a href="${locale.code === 'en' ? '/' : `/${locale.code}/`}" class="hover:text-gold">${esc(locale.homeLabel)}</a><a href="${locale.hubPath}" class="hover:text-gold">${esc(locale.hubLabel)}</a><a href="${locale.code === 'en' ? '/help/' : `/${locale.code}/help/`}" class="hover:text-gold">${esc(locale.helpLabel)}</a><a href="${locale.code === 'en' ? '/privacy/' : `/${locale.code}/privacy/`}" class="hover:text-gold">${esc(locale.privacyLabel)}</a></div></footer><script src="/images/play-store-attribution.js"></script><script src="/images/guide-analytics.js"></script>`;
}

function renderTable(table) {
  return `<div class="guide-table-wrap"><table class="guide-table"><thead><tr>${table.head.map((cell) => `<th>${esc(cell)}</th>`).join('')}</tr></thead><tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function renderSection(section) {
  const paragraphs = (section.paragraphs || []).map((paragraph) => `<p>${esc(paragraph)}</p>`).join('');
  const bullets = section.bullets ? `<ul>${section.bullets.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : '';
  const ordered = section.ordered ? `<ol>${section.ordered.map((item) => `<li>${esc(item)}</li>`).join('')}</ol>` : '';
  const links = section.links ? `<ul>${section.links.map((linkItem) => `<li><a href="${esc(linkItem.href)}" target="_blank" rel="noopener noreferrer">${esc(linkItem.label)}</a></li>`).join('')}</ul>` : '';
  return `<section id="${esc(section.id)}"><h2>${esc(section.title)}</h2>${paragraphs}${links}${bullets}${ordered}${section.table ? renderTable(section.table) : ''}</section>`;
}

function playUrl(articleItem) {
  const content = `article_${articleItem.id.replace(/-/g, '_')}`;
  return `https://play.google.com/store/apps/details?id=com.mygoldfolio.app&referrer=utm_source%3Dwebsite%26utm_medium%3Dorganic%26utm_campaign%3Dmgf_website%26utm_content%3D${encodeURIComponent(content)}`;
}

function renderRelated(locale, articleItem) {
  const related = (articleItem.related || [])
    .map((id) => outputArticles.find((candidate) => candidate.id === id))
    .filter(Boolean);
  if (!related.length) return '';

  const cards = related.map((relatedArticle) => {
    const content = relatedArticle.locales[locale.code];
    return `<a href="${articlePath(relatedArticle, locale)}" class="guide-card guide-article-card block"><img src="${relatedArticle.image}" alt="${esc(relatedArticle.imageAlt[locale.code])}" /><div class="p-5"><p class="guide-eyebrow mb-2">${esc(relatedArticle.category[locale.code])} · ${relatedArticle.readingMinutes} min</p><h3 class="text-xl font-black text-white">${esc(content.title)}</h3><p class="mt-2 leading-relaxed text-gray-400">${esc(content.description)}</p><span class="mt-4 inline-flex items-center gap-2 font-bold text-gold">${esc(locale.readLabel)} <span aria-hidden="true">→</span></span></div></a>`;
  }).join('');
  return `<section class="guide-related mt-12"><h2>${esc(locale.relatedLabel)}</h2><div class="grid gap-5">${cards}</div></section>`;
}

export function articlePage(locale, articleItem) {
  const content = articleItem.locales[locale.code];
  const canonical = absoluteUrl(articlePath(articleItem, locale));
  const articleLd = { '@context': 'https://schema.org', '@type': 'Article', headline: content.title, description: content.description, image: absoluteUrl(articleItem.image), datePublished: articleItem.published, dateModified: articleItem.updated, inLanguage: locale.locale, author: { '@type': 'Organization', name: 'MyGoldFolio' }, publisher: { '@type': 'Organization', name: 'MyGoldFolio', logo: { '@type': 'ImageObject', url: absoluteUrl('/images/icon.png') } }, mainEntityOfPage: canonical };
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: content.faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) };
  const breadcrumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: locale.homeLabel, item: absoluteUrl(locale.code === 'en' ? '/' : `/${locale.code}/`) }, { '@type': 'ListItem', position: 2, name: locale.hubLabel, item: absoluteUrl(locale.hubPath) }, { '@type': 'ListItem', position: 3, name: content.title, item: canonical }] };
  const toc = content.sections.map((section) => `<a href="#${esc(section.id)}">${esc(section.title)}</a>`).join('');
  const sections = content.sections.map(renderSection).join('');
  const faq = content.faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join('');
  return `<!DOCTYPE html>
<html lang="${locale.locale}"><head>
${consentHead()}
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(content.seoTitle || content.title)} | MyGoldFolio</title><meta name="description" content="${esc(content.description)}" />
<meta property="og:title" content="${esc(content.title)}" /><meta property="og:description" content="${esc(content.description)}" /><meta property="og:type" content="article" /><meta property="og:image" content="${absoluteUrl(articleItem.image)}" /><meta property="article:published_time" content="${articleItem.published}" /><meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/images/icon.png" /><link rel="canonical" href="${canonical}" />
${hreflang(articleItem)}
${tailwind()}
<script type="application/ld+json">${json(articleLd)}</script><script type="application/ld+json">${json(faqLd)}</script><script type="application/ld+json">${json(breadcrumbLd)}</script>
</head><body class="bg-navy text-gray-200">
${sharedNav(locale, articleItem)}
<main data-guide-id="${articleItem.id}" data-guide-locale="${locale.code}" data-guide-category="${esc(articleItem.category[locale.code])}"><header class="guide-article-hero"><img src="${articleItem.image}" alt="${esc(articleItem.imageAlt[locale.code])}" /><div class="guide-shell guide-article-hero__content"><nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="${locale.code === 'en' ? '/' : `/${locale.code}/`}">${esc(locale.homeLabel)}</a><span aria-hidden="true">/</span><a href="${locale.hubPath}">${esc(locale.hubLabel)}</a></nav><p class="guide-eyebrow mb-4">${esc(articleItem.category[locale.code])} · ${articleItem.readingMinutes} min</p><h1>${esc(content.title)}</h1><p>${esc(content.intro)}</p><p class="guide-article-meta">${articleItem.updated} · ${brandWordmark('font-extrabold tracking-tight text-white')}</p></div></header>
<div class="guide-shell grid max-w-6xl gap-10 py-14 md:grid-cols-[minmax(0,1fr)_15rem] md:py-20"><article class="guide-prose min-w-0"><div class="guide-kicker"><strong>${esc(content.summary)}</strong></div>${sections}<div class="guide-cta"><p class="mb-3">${brandWordmark()}</p><h2 class="!mt-0 text-2xl">${esc(content.ctaTitle)}</h2><p>${esc(content.ctaText)}</p><a href="${playUrl(articleItem)}" target="_blank" rel="noopener noreferrer" class="guide-cta__action mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold to-amber px-5 py-3 text-sm font-black shadow-xl shadow-gold/25 transition hover:-translate-y-0.5 hover:shadow-gold/35 sm:w-auto" style="color:#0F0F1A !important;text-decoration:none;"><ion-icon name="diamond-outline"></ion-icon>${esc(content.ctaLabel)}</a></div>${renderRelated(locale, articleItem)}<section class="guide-faq mt-12" id="faq"><h2>${esc(locale.faqLabel)}</h2><div class="space-y-3">${faq}</div></section><div class="guide-next"><a href="${locale.hubPath}">← ${esc(locale.backLabel)}</a></div></article><aside class="hidden md:block"><div class="guide-card guide-toc sticky top-24 p-5"><p class="mb-3 text-xs font-extrabold uppercase tracking-[.15em] text-gold">${esc(locale.contentsLabel)}</p>${toc}<a href="#faq">${esc(locale.faqLabel)}</a></div></aside></div></main>
${sharedFooter(locale)}</body></html>`;
}

function articleCard(locale, articleItem) {
  const content = articleItem.locales[locale.code];
  return `<a href="${articlePath(articleItem, locale)}" class="guide-card guide-article-card block"><img src="${articleItem.image}" alt="${esc(articleItem.imageAlt[locale.code])}" /><div class="p-6"><p class="guide-eyebrow mb-3">${esc(articleItem.category[locale.code])} · ${articleItem.readingMinutes} min</p><h2 class="text-2xl font-black text-white">${esc(content.title)}</h2><p class="mt-3 leading-relaxed text-gray-400">${esc(content.description)}</p><span class="mt-5 inline-flex items-center gap-2 font-bold text-gold">${esc(locale.readLabel)} <span aria-hidden="true">→</span></span></div></a>`;
}

export function hubPage(locale) {
  const orderedArticles = [...publishedArticles].sort((a, b) => b.published.localeCompare(a.published));
  const cards = orderedArticles.map((articleItem) => articleCard(locale, articleItem)).join('');
  return `<!DOCTYPE html>
<html lang="${locale.locale}"><head>
${consentHead()}
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(locale.hubTitle)} | MyGoldFolio</title><meta name="description" content="${esc(locale.hubIntro)}" />
<meta property="og:title" content="${esc(locale.hubTitle)}" /><meta property="og:description" content="${esc(locale.hubIntro)}" /><meta property="og:type" content="website" /><meta property="og:image" content="${absoluteUrl(orderedArticles[0].image)}" /><meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/images/icon.png" /><link rel="canonical" href="${absoluteUrl(locale.hubPath)}" />
${hreflang()}
${tailwind()}
</head><body class="bg-navy text-gray-200">
${sharedNav(locale)}
<main><section class="guide-hub-hero"><div class="guide-shell max-w-4xl text-center"><p class="guide-eyebrow mb-4">${esc(locale.eyebrow)}</p><h1>${esc(locale.hubTitle)}</h1><p>${esc(locale.hubIntro)}</p></div></section><section class="guide-shell py-12 md:py-16"><p class="guide-eyebrow mb-2">${esc(locale.latestLabel)}</p><div class="grid max-w-3xl gap-6">${cards}</div></section></main>
${sharedFooter(locale)}</body></html>`;
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

export { locales, outputArticles, articlePath };

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
  for (const locale of Object.values(locales)) {
    await write(locale.hubPath, hubPage(locale));
    for (const articleItem of outputArticles) {
      await write(articlePath(articleItem, locale), articlePage(locale, articleItem));
    }
  }
}
