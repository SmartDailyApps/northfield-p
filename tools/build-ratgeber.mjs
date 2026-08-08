import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { article, locales } from './ratgeber-content.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const absoluteUrl = (path) => `https://mygoldfolio.de${path}`;
const playUrl = 'https://play.google.com/store/apps/details?id=com.mygoldfolio.app&referrer=utm_source%3Dwebsite%26utm_medium%3Dorganic%26utm_campaign%3Dmgf_website%26utm_content%3Darticle_portfolio_tracking';
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const pathToOutput = (path) => resolve(repoRoot, path.replace(/^\//, ''), 'index.html');
const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

function analytics() {
  return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-MKR2RFW2');</script>
<!-- End Google Tag Manager -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-F2Y9RHH0QC"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-F2Y9RHH0QC');</script>`;
}

function tailwind() {
  return `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com"></script>
<script>tailwind.config={theme:{extend:{colors:{navy:'#0F0F1A','navy-light':'#1A1A2E',border:'#1E3A5C',gold:'#D4A843',amber:'#FFE27A',muted:'#969bab'}}}}</script>
<link rel="stylesheet" href="/images/ratgeber.css" />`;
}

function languageLinks(currentCode, kind) {
  return Object.values(locales).map((locale) => {
    const path = kind === 'hub' ? locale.hubPath : locale.articlePath;
    return `<a href="${path}"${locale.code === currentCode ? ' aria-current="page"' : ''}>${locale.label}</a>`;
  }).join('');
}

function hreflang(kind) {
  return Object.values(locales).map((locale) => `<link rel="alternate" hreflang="${locale.locale}" href="${absoluteUrl(kind === 'hub' ? locale.hubPath : locale.articlePath)}" />`).join('\n');
}

function sharedNav(locale, current) {
  return `<nav class="sticky top-0 z-50 border-b border-border/40 bg-navy/90 backdrop-blur"><div class="guide-shell flex min-h-[68px] items-center justify-between gap-4"><a href="${locale.code === 'en' ? '/' : `/${locale.code}/`}" class="flex items-center gap-3"><img src="/images/icon.png" alt="MyGoldFolio" class="h-8 w-8 rounded-xl" /><span class="text-lg font-extrabold tracking-tight text-white">My<span class="text-[#E2B84B]">Gold</span>Folio</span></a><div class="flex items-center gap-4 text-sm"><details class="guide-languages"><summary aria-label="Language">${esc(locale.label)}</summary><div>${languageLinks(locale.code, current)}</div></details><a href="${locale.hubPath}" class="guide-nav-chip${current === 'hub' ? ' guide-nav-chip--active' : ''}">${esc(locale.hubLabel)}</a><a href="${locale.code === 'en' ? '/#download' : `/${locale.code}/#download`}" class="rounded-full bg-gold px-4 py-2 font-bold text-navy hover:bg-amber">${esc(locale.appLabel)}</a></div></div></nav>`;
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
  return `<section id="${esc(section.id)}"><h2>${esc(section.title)}</h2>${paragraphs}${bullets}${ordered}${section.table ? renderTable(section.table) : ''}</section>`;
}

function articlePage(locale, content) {
  const canonical = absoluteUrl(locale.articlePath);
  const articleLd = { '@context': 'https://schema.org', '@type': 'Article', headline: content.title, description: content.description, image: absoluteUrl(article.image), datePublished: article.published, dateModified: article.updated, inLanguage: locale.locale, author: { '@type': 'Organization', name: 'MyGoldFolio' }, publisher: { '@type': 'Organization', name: 'MyGoldFolio', logo: { '@type': 'ImageObject', url: absoluteUrl('/images/icon.png') } }, mainEntityOfPage: canonical };
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: content.faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) };
  const breadcrumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: locale.homeLabel, item: absoluteUrl(locale.code === 'en' ? '/' : `/${locale.code}/`) }, { '@type': 'ListItem', position: 2, name: locale.hubLabel, item: absoluteUrl(locale.hubPath) }, { '@type': 'ListItem', position: 3, name: content.title, item: canonical }] };
  const toc = content.sections.map((section) => `<a href="#${esc(section.id)}">${esc(section.title)}</a>`).join('');
  const sections = content.sections.map(renderSection).join('');
  const faq = content.faq.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join('');
  return `<!DOCTYPE html>
<html lang="${locale.locale}"><head>
${analytics()}
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(content.seoTitle || content.title)} | MyGoldFolio</title><meta name="description" content="${esc(content.description)}" />
<meta property="og:title" content="${esc(content.title)}" /><meta property="og:description" content="${esc(content.description)}" /><meta property="og:type" content="article" /><meta property="og:image" content="${absoluteUrl(article.image)}" /><meta property="article:published_time" content="${article.published}" /><meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/images/icon.png" /><link rel="canonical" href="${canonical}" />
${hreflang('article')}
${tailwind()}
<script type="application/ld+json">${json(articleLd)}</script><script type="application/ld+json">${json(faqLd)}</script><script type="application/ld+json">${json(breadcrumbLd)}</script>
</head><body class="bg-navy text-gray-200"><noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MKR2RFW2" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
${sharedNav(locale, 'article')}
<main data-guide-id="${article.id}" data-guide-locale="${locale.code}" data-guide-category="${esc(article.category[locale.code])}"><header class="guide-article-hero"><img src="${article.image}" alt="${esc(article.imageAlt[locale.code])}" /><div class="guide-shell guide-article-hero__content"><nav class="guide-breadcrumb" aria-label="Breadcrumb"><a href="${locale.code === 'en' ? '/' : `/${locale.code}/`}">${esc(locale.homeLabel)}</a><span aria-hidden="true">/</span><a href="${locale.hubPath}">${esc(locale.hubLabel)}</a></nav><p class="guide-eyebrow mb-4">${esc(article.category[locale.code])} · ${article.readingMinutes} min</p><h1>${esc(content.title)}</h1><p>${esc(content.intro)}</p><p class="guide-article-meta">${article.updated} · MyGoldFolio</p></div></header>
<div class="guide-shell grid max-w-6xl gap-10 py-14 md:grid-cols-[minmax(0,1fr)_15rem] md:py-20"><article class="guide-prose min-w-0"><div class="guide-kicker"><strong>${esc(content.summary)}</strong></div>${sections}<div class="guide-cta"><p class="guide-eyebrow mb-3">MyGoldFolio</p><h2 class="!mt-0 text-2xl">${esc(content.ctaTitle)}</h2><p>${esc(content.ctaText)}</p><a href="${playUrl}" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#FFE27A] px-5 py-3 text-sm font-black text-[#10101B] shadow-lg shadow-gold/20 transition hover:bg-white">${esc(content.ctaLabel)} <span aria-hidden="true">→</span></a><p class="mt-4 text-xs text-gray-500">${esc(locale.disclosure)}</p></div><section class="guide-faq mt-12" id="faq"><h2>${esc(locale.faqLabel)}</h2><div class="space-y-3">${faq}</div></section><div class="guide-next"><a href="${locale.hubPath}">← ${esc(locale.backLabel)}</a></div></article><aside class="hidden md:block"><div class="guide-card guide-toc sticky top-24 p-5"><p class="mb-3 text-xs font-extrabold uppercase tracking-[.15em] text-gold">${esc(locale.contentsLabel)}</p>${toc}<a href="#faq">${esc(locale.faqLabel)}</a></div></aside></div></main>
${sharedFooter(locale)}</body></html>`;
}

function hubPage(locale, content) {
  const canonical = absoluteUrl(locale.hubPath);
  return `<!DOCTYPE html>
<html lang="${locale.locale}"><head>
${analytics()}
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(locale.hubTitle)} | MyGoldFolio</title><meta name="description" content="${esc(locale.hubIntro)}" />
<meta property="og:title" content="${esc(locale.hubTitle)}" /><meta property="og:description" content="${esc(locale.hubIntro)}" /><meta property="og:type" content="website" /><meta property="og:image" content="${absoluteUrl(article.image)}" /><meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/images/icon.png" /><link rel="canonical" href="${canonical}" />
${hreflang('hub')}
${tailwind()}
</head><body class="bg-navy text-gray-200"><noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MKR2RFW2" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
${sharedNav(locale, 'hub')}
<main><section class="guide-hub-hero"><div class="guide-shell max-w-4xl text-center"><p class="guide-eyebrow mb-4">${esc(locale.eyebrow)}</p><h1>${esc(locale.hubTitle)}</h1><p>${esc(locale.hubIntro)}</p></div></section><section class="guide-shell py-12 md:py-16"><p class="guide-eyebrow mb-2">${esc(locale.latestLabel)}</p><div class="grid max-w-3xl gap-6"><a href="${locale.articlePath}" class="guide-card guide-article-card block"><img src="${article.image}" alt="${esc(article.imageAlt[locale.code])}" /><div class="p-6"><p class="guide-eyebrow mb-3">${esc(article.category[locale.code])} · ${article.readingMinutes} min</p><h2 class="text-2xl font-black text-white">${esc(content.title)}</h2><p class="mt-3 leading-relaxed text-gray-400">${esc(content.description)}</p><span class="mt-5 inline-flex items-center gap-2 font-bold text-gold">${esc(locale.readLabel)} <span aria-hidden="true">→</span></span></div></a></div></section></main>
${sharedFooter(locale)}</body></html>`;
}

async function write(path, body) {
  const output = pathToOutput(path);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, body, 'utf8');
  console.log(path);
}

for (const [code, locale] of Object.entries(locales)) {
  await write(locale.hubPath, hubPage(locale, article.locales[code]));
  await write(locale.articlePath, articlePage(locale, article.locales[code]));
}
