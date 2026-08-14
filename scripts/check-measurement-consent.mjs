import fs from 'node:fs';
import path from 'node:path';

const site = process.argv[2];
if (!['product', 'studio'].includes(site)) {
  console.error('Usage: node scripts/check-measurement-consent.mjs <product|studio>');
  process.exit(2);
}

const expected = site === 'product'
  ? {
      gtmId: 'GTM-MKR2RFW2',
      consentKey: 'mgf_analytics_consent_v1',
      privacyPaths: [
        'privacy/index.html',
        'de/privacy/index.html',
        'fr/privacy/index.html',
        'tr/privacy/index.html',
        'es/privacy/index.html',
        'it/privacy/index.html',
        'pt/privacy/index.html',
      ],
    }
  : {
      gtmId: 'GTM-WZLLSLQZ',
      consentKey: 'sda_analytics_consent_v1',
      privacyPaths: [
        'cookie-policy/index.html',
        'de/cookie-policy/index.html',
        'fr/cookie-policy/index.html',
        'tr/cookie-policy/index.html',
        'es/cookie-policy/index.html',
        'it/cookie-policy/index.html',
        'pt/cookie-policy/index.html',
      ],
    };

const root = process.cwd();
const failures = [];
const publicHtml = walk(root)
  .filter((file) => file.endsWith('.html'))
  .filter((file) => !relative(file).startsWith('docs/'))
  .filter((file) => !path.basename(file).startsWith('google'));

for (const file of publicHtml) {
  const source = fs.readFileSync(file, 'utf8');
  const rel = relative(file);
  const expectedLoader = `<script src="/images/consent-analytics.js" data-site="${site}" data-gtm-id="${expected.gtmId}" data-consent-key="${expected.consentKey}"></script>`;

  if (count(source, expectedLoader) !== 1) {
    failures.push(`${rel}: expected exactly one approved consent loader`);
  }
  if (/googletagmanager\.com\/gtag\/js|gtag\(['"]config['"]|gtm\.start|googletagmanager\.com\/ns\.html/.test(source)) {
    failures.push(`${rel}: legacy/direct Google measurement loader remains`);
  }
  if (/plausible\.io/i.test(source)) {
    failures.push(`${rel}: Plausible reference remains`);
  }
}

for (const privacyPath of expected.privacyPaths) {
  const file = path.join(root, privacyPath);
  const source = fs.readFileSync(file, 'utf8');
  if (!/local|browser|navegador|Browser|navigateur|tarayıcı|tarayici/i.test(source)) {
    failures.push(`${privacyPath}: local browser consent explanation is missing`);
  }
}

const consentSource = fs.readFileSync(path.join(root, 'images', 'consent-analytics.js'), 'utf8');
for (const required of [
  "analytics_storage: value",
  "ad_storage: deniedValue",
  "ad_user_data: deniedValue",
  "ad_personalization: deniedValue",
  "site-analytics-consent-granted",
  "site-consent-settings",
]) {
  if (!consentSource.includes(required)) {
    failures.push(`images/consent-analytics.js: missing ${required}`);
  }
}

if (site === 'product') {
  for (const home of ['index.html', 'de/index.html', 'fr/index.html', 'tr/index.html', 'es/index.html', 'it/index.html', 'pt/index.html']) {
    const source = fs.readFileSync(path.join(root, home), 'utf8');
    if (count(source, 'id="notify-form"') !== 1 || count(source, "formId: 'mpqolryl'") !== 1) {
      failures.push(`${home}: expected exactly one configured update-subscription form`);
    }
    if (count(source, 'https://unpkg.com/@formspree/ajax@1') !== 1) {
      failures.push(`${home}: expected exactly one Formspree subscription runtime`);
    }
    if (count(source, 'action="https://formspree.io/f/mpqolryl"') !== 1 || !source.includes('autocomplete="email"')) {
      failures.push(`${home}: subscription fallback action or email autofill is missing`);
    }
    if (!source.includes('info@mygoldfolio.de') || !source.includes('/privacy/')) {
      failures.push(`${home}: subscription privacy/unsubscribe wording is missing`);
    }
  }
  for (const eventScript of ['images/guide-analytics.js', 'images/play-store-attribution.js']) {
    const source = fs.readFileSync(path.join(root, eventScript), 'utf8');
    if (!source.includes('window.siteAnalytics')) {
      failures.push(`${eventScript}: event is not consent-gated`);
    }
  }
}

if (failures.length) {
  console.error(`Measurement/consent audit failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`PASS: ${publicHtml.length} public ${site} pages use one consent-gated GTM loader; no direct GA/Plausible/noscript loaders remain.`);

function walk(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(fullPath));
    else result.push(fullPath);
  }
  return result;
}

function relative(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

function count(source, value) {
  return source.split(value).length - 1;
}
