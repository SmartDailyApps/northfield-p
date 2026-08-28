// WEB-UX1 Phase 2 | modular read-only site validator.
//
//   node scripts/validate-site.mjs                     report-only default (consent+links STRICT)
//   node scripts/validate-site.mjs --strict-all        every check hard-fails
//   node scripts/validate-site.mjs --root <path>       validate a copy (seeded-fault fixtures)
//   node scripts/validate-site.mjs --only <check>      run one check
//   node scripts/validate-site.mjs --json              machine-readable summary
//
// Exit codes: 0 pass · 1 strict failure · 2 config error.
// Read-only: never writes. Checks: consent*, links, route-parity, seo-head,
// version, sitemap, images-markup, runtime-origins, css-current, budgets.
// (* = always strict; others strict only with --strict-all.)
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { additionalArticles, article, locales } from '../tools/ratgeber-content.mjs';

const args = process.argv.slice(2);
const rootArg = args.includes('--root') ? args[args.indexOf('--root') + 1] : undefined;
const onlyRaw = args.find((a) => a.startsWith('--only='))?.split('=')[1] ?? (args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined);
const onlyArg = onlyRaw && !onlyRaw.startsWith('--') ? onlyRaw : undefined;
const jsonMode = args.includes('--json');
const strictAll = args.includes('--strict-all');
const strictOrigins = strictAll || args.includes('--strict-origins');
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = rootArg ? resolve(rootArg) : REPO;
const BASE = 'https://mygoldfolio.de';
const LOCALES = ['en', 'de', 'tr', 'fr', 'es', 'it', 'pt'];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const isPublicHtml = (rel) => rel.toLowerCase().endsWith('.html')
  && !rel.startsWith('docs/')
  && !rel.startsWith('node_modules/')
  && !rel.startsWith('.astro/')
  && !rel.startsWith('scratch/')
  && !rel.startsWith('src/')
  && rel !== 'googlecaf002d6e499638a.html';

const publicPages = () => walk(ROOT)
  .map((p) => relative(ROOT, p).replace(/\\/g, '/'))
  .filter(isPublicHtml)
  .sort();

const headOf = (html) => html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? '';
const stripHead = (html) => html.replace(/<head[\s\S]*?<\/head>/i, '');

function checkConsent(pages, add) {
  for (const rel of pages) {
    const html = readFileSync(join(ROOT, rel), 'utf8');
    const head = headOf(html);
    const scriptsInHead = [...head.matchAll(/<script\b[^>]*>/gi)].map((m) => m[0]);
    const first = scriptsInHead[0] ?? '';
    const firstIsLoader = /src="\/images\/consent-analytics\.js"/.test(first)
      && /data-site="product"/.test(first)
      && /data-gtm-id="GTM-MKR2RFW2"/.test(first)
      && /data-consent-key="mgf_analytics_consent_v1"/.test(first);
    if (!firstIsLoader) add(rel, `consent loader must be the FIRST script in <head> with product attrs (found: ${first.slice(0, 90) || 'none'})`);
    const bodyPlusTools = stripHead(html);
    if (/googletagmanager\.com\/gtm\.js|gtag\(|googletagmanager\.com\/ns\.html|<noscript>\s*<iframe\s+src="[^"]*googletagmanager/i.test(bodyPlusTools)) {
      add(rel, 'direct gtag/GTM/noscript-iframe reference outside the consent loader');
    }
  }
  // Generator sources must stay consent-safe too (Phase 0 contract).
  for (const tool of ['tools/build-ratgeber.mjs']) {
    const p = join(ROOT, tool);
    if (!existsSync(p)) continue;
    const src = readFileSync(p, 'utf8');
    if (/googletagmanager\.com\/(gtm\.js|ns\.html)|gtag\(/.test(src)) add(tool, 'generator emits direct GTM/gtag | violates Phase 0 contract');
  }
}

function resolveInternal(url) {
  if (!url || /^(https?:)?\/\//i.test(url)) return url?.startsWith(`${BASE}/`) ? url.slice(BASE.length) : null;
  if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('data:')) return null;
  return url;
}

function checkLinks(pages, add) {
  const fileSet = new Set(pages);
  const knownAssets = new Set(walk(ROOT).map((p) => relative(ROOT, p).replace(/\\/g, '/')));
  for (const rel of pages) {
    const html = readFileSync(join(ROOT, rel), 'utf8');
    const refs = [...html.matchAll(/\b(?:href|src)="([^"]+)"/gi)].map((m) => m[1]);
    const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
    for (const raw of refs) {
      if (raw.startsWith('#')) continue;
      const pathPart = resolveInternal(raw);
      if (!pathPart || pathPart === '') continue;
      const clean = pathPart.split('#')[0].split('?')[0];
      if (!clean) continue;
      let candidate;
      if (clean.startsWith('/')) candidate = clean.slice(1);
      else candidate = (dir ? `${dir}/` : '') + clean;
      const normalized = candidate.replace(/\/index\.html$/, '/');
      const okFile = knownAssets.has(candidate) || knownAssets.has(normalized.replace(/\/$/, '') + '/index.html')
        || fileSet.has(normalized.endsWith('/') ? normalized : normalized)
        || existsSync(join(ROOT, candidate))
        || (normalized.endsWith('/') && existsSync(join(ROOT, normalized, 'index.html')))
        || existsSync(join(ROOT, normalized, 'index.html'));
      if (!okFile) add(rel, `broken internal ref "${raw}"`);
    }
  }
}

function expectedLocaleRoutes() {
  // Canonical route set:
  //  - non-guide public pages mirrored across all 7 locales (identical segment
  //    names; impressum is EN-only by design)
  //  - guides hubs/articles exactly as defined in tools/ratgeber-content.mjs
  //    (article slugs are per-locale, so the content module is the truth source)
  const routes = [];
  const enPages = publicPages().filter((rel) => {
    if (/^(de|es|fr|it|pt|tr)\//.test(rel)) return false;
    if (rel === '404.html' || rel === 'googlecaf002d6e499638a.html' || rel === 'docs/changelog-internalonly.html') return false;
    if (rel.startsWith('guides/')) return false;
    return true;
  });
  for (const rel of enPages) {
    routes.push(rel);
    if (rel === 'impressum/index.html') continue;
    for (const code of LOCALES) {
      if (code === 'en') continue;
      routes.push(rel === 'index.html' ? `${code}/index.html` : `${code}/${rel}`);
    }
  }
  const published = [article, ...additionalArticles].filter((a) => a.status !== 'draft');
  const totalPages = Math.max(1, Math.ceil(published.length / 4));
  for (const code of Object.keys(locales)) {
    const loc = locales[code];
    if (loc?.hubPath) {
      for (let p = 1; p <= totalPages; p += 1) {
        const pagePath = p === 1 ? loc.hubPath : `${loc.hubPath}page/${p}/`;
        routes.push(`${pagePath.replace(/^\//, '')}index.html`);
      }
    }
    for (const art of published) {
      const path = art.paths?.[code] ?? (art === article ? loc.articlePath : null);
      if (path) routes.push(`${path.replace(/^\//, '')}index.html`);
    }
  }
  return routes;
}

function checkRouteParity(pages, add) {
  for (const want of expectedLocaleRoutes()) {
    if (!pages.includes(want)) add(want, `expected page missing from tree`);
  }
}

function checkSeoHead(pages, add, warn) {
  for (const rel of pages) {
    if (rel === '404.html') continue;
    const html = readFileSync(join(ROOT, rel), 'utf8');
    const head = headOf(html);
    const canonical = head.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
    const expectPath = rel === 'index.html' ? '/' : `/${rel.replace(/\/index\.html$/, '')}/`;
    if (!canonical) warn(rel, 'canonical MISSING');
    else if (canonical !== `${BASE}${expectPath}`) warn(rel, `canonical ${canonical} != expected ${BASE}${expectPath}`);
    const alternates = [...head.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"[^>]*>/gi)].map((m) => [m[1], m[2]]);
    const langs = new Set(alternates.map(([l]) => l));
    const hasXDefault = langs.has('x-default');
    const coreLocales = alternates.filter(([l]) => LOCALES.map((x) => (x === 'pt' ? 'pt-BR' : x)).includes(l));
    if (coreLocales.length !== 7) warn(rel, `hreflang set has ${coreLocales.length}/7 locales`);
    if (!hasXDefault) warn(rel, 'hreflang x-default missing');
    for (const [, href] of alternates) {
      const targetPath = href.startsWith(BASE) ? href.slice(BASE.length) : href;
      const wantFile = targetPath === '/' ? 'index.html' : `${targetPath.replace(/^\//, '').replace(/\/$/, '')}/index.html`;
      if (!existsSync(join(ROOT, wantFile))) add(rel, `hreflang target does not exist: ${href}`);
    }
    for (const block of [...stripHead(html).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi), ...[...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]]) {
      try {
        JSON.parse(block[1]);
      } catch (err) {
        add(rel, `unparseable JSON-LD (${err.message})`);
      }
    }
    if (/highPrice":\s*"5\.99/.test(head) || /"price":\s*"5\.99"/.test(head)) {
      warn(rel, 'stale SoftwareApplication pricing (AggregateOffer highPrice 5.99) | Phase 5 repair item');
    }
  }
}

function checkVersion(pages, add, warn) {
  const vp = join(ROOT, 'version.js');
  if (!existsSync(vp)) return add('version.js', 'missing');
  const src = readFileSync(vp, 'utf8');
  const v = src.match(/VERSION\s*=\s*'([^']+)'/)?.[1];
  if (!v || !/^\d+\.\d+\.\d+$/.test(v)) add('version.js', `VERSION not semver: "${v}"`);
  let placeholders = 0;
  for (const rel of pages) {
    placeholders += (readFileSync(join(ROOT, rel), 'utf8').match(/data-mgf-version/g) ?? []).length;
  }
  warn('site-wide', `data-mgf-version placeholder occurrences in public HTML: ${placeholders} (version.js consumers exist on homes via script tag only)`);
}

function checkSitemap(pages, add, warn) {
  const smPath = join(REPO, 'sitemap.xml');
  if (!existsSync(smPath)) return add('sitemap.xml', 'missing');
  const diff = runNode(['tools/build-sitemap.mjs', '--diff']);
  const headline = diff.status.split('\n').find((l) => l.startsWith('# computed=')) ?? diff.status.split('\n')[0];
  warn('sitemap.xml', `${headline.trim().replace(/^#\s*/, '')} | Phase 5 repair item (full diff: node tools/build-sitemap.mjs --diff)`);
}

function checkImageMarkup(pages, add, warn) {
  let noDims = 0;
  let total = 0;
  for (const rel of pages) {
    const html = readFileSync(join(ROOT, rel), 'utf8');
    for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
      total += 1;
      const tag = m[0];
      if (!/\bwidth="/.test(tag) || !/\bheight="/.test(tag)) noDims += 1;
    }
  }
  warn('site-wide', `img tags without explicit width/height: ${noDims}/${total} | responsive markup lands in Phases 3–5 (report-only)`);
}

function checkRuntimeOrigins(pages, add, warn) {
  let allowlist = {};
  try {
    allowlist = JSON.parse(readFileSync(join(REPO, 'scripts', 'runtime-allowlist.json'), 'utf8')).origins ?? {};
  } catch (err) {
    return add('scripts/runtime-allowlist.json', `unreadable: ${err.message}`);
  }
  const seen = new Map();
  for (const rel of pages) {
    const html = readFileSync(join(ROOT, rel), 'utf8');
    // Runtime assets only: script/link/iframe/img/source tags. Plain <a href>
    // navigations are outbound links, not visitor-side runtime dependencies.
    for (const m of html.matchAll(/<(?:script|link|iframe|img|source)\b[^>]*?\b(?:src|href)="https?:\/\/([^/"']+)/gi)) {
      const origin = m[1];
      seen.set(origin, (seen.get(origin) ?? 0) + 1);
    }
  }
  for (const [origin] of [...seen.entries()].sort()) {
    if (origin === 'mygoldfolio.de') continue; // self-origin absolute URLs are not external
    if (!(origin in allowlist)) {
      const msg = `unknown external runtime origin "${origin}" (${seen.get(origin)} refs) | add to allowlist with rationale or remove`;
      (strictOrigins ? add : warn)('site-wide', msg);
    }
  }
  warn('runtime-origins', `known origins still pending disposition: ${Object.keys(allowlist).filter((k) => k !== 'formspree.io').join(', ')}`);
}

function runNode(cmdArgs, cwd = REPO) {
  try {
    return { status: execFileSync(process.execPath, cmdArgs, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(), code: 0 };
  } catch (err) {
    return { status: String(err.stdout ?? '') + String(err.stderr ?? ''), code: err.status ?? 1 };
  }
}

function checkCssCurrent(pages, add, warn) {
  const r = runNode(['tools/build-css.mjs', '--check']);
  if (r.code !== 0) warn('css', 'assets/css/main.min.css is STALE or MISSING vs tailwind.config.js/input.css (run npm run build:css) | becomes strict at Phase 3 rollout');
  else warn('css', 'assets/css/main.min.css CURRENT');
}

function checkBudgets(pages, add, warn) {
  const budgets = {
    'index.html': 700_000,
    'de/index.html': 700_000,
  };
  for (const [rel, budget] of Object.entries(budgets)) {
    if (!pages.includes(rel)) continue;
    const html = readFileSync(join(ROOT, rel), 'utf8');
    let bytes = Buffer.byteLength(html);
    for (const m of html.matchAll(/(?:src|srcset)="([^"]+)"/gi)) {
      for (const part of m[1].split(',')) {
        const pathPart = part.trim().split(/\s+/)[0];
        const internal = resolveInternal(pathPart);
        if (!internal || !internal.startsWith('/')) continue;
        const p = join(ROOT, internal.slice(1));
        if (existsSync(p)) bytes += statSync(p).size;
      }
    }
    warn('budgets', `${rel}: local HTML+image payload ≈ ${(bytes / 1024).toFixed(0)} KB vs FREEZE image budget ≤ ${Math.round(budget / 1024)} KB (report-only until Phase 3 pilot)`);
  }
}

const checks = [
  { name: 'consent', mode: 'strict', fn: checkConsent },
  { name: 'links', mode: 'strict', fn: checkLinks },
  { name: 'route-parity', mode: 'report', fn: checkRouteParity },
  { name: 'seo-head', mode: 'report', fn: checkSeoHead },
  { name: 'version', mode: 'report', fn: checkVersion },
  { name: 'sitemap', mode: 'report', fn: checkSitemap },
  { name: 'images-markup', mode: 'report', fn: checkImageMarkup },
  { name: 'runtime-origins', mode: 'report', fn: checkRuntimeOrigins },
  { name: 'css-current', mode: 'report', fn: checkCssCurrent },
  { name: 'budgets', mode: 'report', fn: checkBudgets },
];

const results = [];
for (const check of checks) {
  if (onlyArg && check.name !== onlyArg) continue;
  const failures = [];
  const warnings = [];
  const add = (where, msg) => failures.push({ where, msg });
  const warn = (where, msg) => warnings.push({ where, msg });
  try {
    await check.fn(publicPages(), add, warn);
    results.push({ name: check.name, mode: strictAll ? 'strict' : check.mode, failures, warnings });
  } catch (err) {
    results.push({ name: check.name, mode: strictAll ? 'strict' : check.mode, failures: [{ where: check.name, msg: `check crashed: ${err.message}` }], warnings });
  }
}

const strictFailed = results.some((r) => r.mode !== 'report' && r.failures.length > 0);
const totalWarnings = results.reduce((n, r) => n + r.warnings.length, 0);
if (jsonMode) {
  console.log(JSON.stringify({ ok: !strictFailed, root: ROOT, results }, null, 2));
} else {
  console.log(`validate-site @ ${ROOT}`);
  for (const r of results) {
    console.log(`\n[${strictAll ? 'strict' : r.mode}] ${r.name}: ${r.failures.length === 0 ? 'PASS' : 'FAIL'} · ${r.failures.length} finding(s), ${r.warnings.length} note(s)`);
    for (const f of r.failures) console.log(`   ✗ ${f.where}: ${f.msg}`);
    for (const w of r.warnings.slice(0, 12)) console.log(`   • ${w.where}: ${w.msg}`);
    if (r.warnings.length > 12) console.log(`   … +${r.warnings.length - 12} more notes`);
  }
  console.log(`\n${strictFailed ? 'RESULT: FAIL (strict checks)' : 'RESULT: PASS'} · ${totalWarnings} report-only note(s)`);
}
process.exit(strictFailed ? 1 : 0);
