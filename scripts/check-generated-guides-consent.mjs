// Phase 0 (WEB-UX1): consent-contract regression gate for the guide generator.
//
// Renders every guide/hub page fresh in memory (no files written) and enforces:
//   1. exactly one canonical consent loader per public page,
//   2. the loader is the first element inside <head>,
//   3. zero direct googletagmanager.com/gtag loaders or GTM noscript iframes.
// Negative fixtures prove the detector fails on the legacy direct-GTM output so a
// hand-corrected working tree cannot hide a broken generator template.
// The tracked working tree itself is audited by scripts/check-measurement-consent.mjs.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articlePage, hubPage, locales, outputArticles, articlePath, consentHead } from '../tools/build-ratgeber.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const loader = consentHead().trim();

const forbiddenPatterns = [
  [/googletagmanager\.com\/gtag\/js/, 'direct gtag.js loader'],
  [/googletagmanager\.com\/gtm\.js/, 'direct googletagmanager.com/gtm.js request'],
  [/gtag\(['"]config['"]/, 'inline gtag config call'],
  [/gtm\.start/, 'inline gtm.start dataLayer push'],
  [/googletagmanager\.com\/ns\.html/, 'GTM noscript iframe'],
];

function consentFindings(html) {
  const findings = [];
  const loaderCount = html.split(loader).length - 1;
  if (loaderCount !== 1) {
    findings.push(`expected exactly one consent loader, found ${loaderCount}`);
  } else {
    const headIndex = html.indexOf('<head>');
    const afterHead = headIndex === -1 ? '' : html.slice(headIndex + '<head>'.length);
    const leading = afterHead.slice(0, afterHead.indexOf(loader));
    if (headIndex === -1 || !/^\n+$/.test(leading)) {
      findings.push('consent loader is not the first element inside <head>');
    }
  }
  for (const [pattern, label] of forbiddenPatterns) {
    if (pattern.test(html)) findings.push(`${label} is present`);
  }
  return findings;
}

const failures = [];

for (const locale of Object.values(locales)) {
  const pages = [
    [`hub ${locale.hubPath}`, hubPage(locale)],
    ...outputArticles.map((item) => [`article ${articlePath(item, locale)}`, articlePage(locale, item)]),
  ];
  for (const [label, html] of pages) {
    for (const finding of consentFindings(html)) {
      failures.push(`${label}: ${finding}`);
    }
  }
}

const legacyFixture = `<!DOCTYPE html><html lang="en-US"><head>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});})(window,document,'script','dataLayer','GTM-MKR2RFW2');</script>
<!-- End Google Tag Manager -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-F2Y9RHH0QC"></script>
<script>window.dataLayer=[];function gtag(){dataLayer.push(arguments);}gtag('config','G-F2Y9RHH0QC');</script>
</head><body><noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MKR2RFW2" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript></body></html>`;
if (consentFindings(legacyFixture).length === 0) {
  failures.push('negative fixture: legacy direct-GTM page was NOT detected');
}

const lateLoaderFixture = `<!DOCTYPE html><html lang="en-US"><head>
<title>Fixture</title>${loader}
</head><body></body></html>`;
if (consentFindings(lateLoaderFixture).length === 0) {
  failures.push('negative fixture: consent loader placed after <title> was NOT detected as out of position');
}

const pageNames = Object.keys(locales).length * (1 + outputArticles.length);
if (failures.length) {
  console.error(`Fresh-generation consent audit FAILED (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`PASS: ${pageNames} freshly rendered guide/hub pages carry exactly one first-in-head consent loader; zero direct GTM/gtag/noscript patterns; negative fixtures correctly rejected.`);
