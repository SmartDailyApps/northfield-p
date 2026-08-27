// WEB-UX1 Phase 2 | sitemap generator (evidence/diff tool; NOT wired into publishing).
//
//   node tools/build-sitemap.mjs            print computed sitemap XML to stdout
//   node tools/build-sitemap.mjs --diff     compare computed vs current sitemap.xml
//
// Exit codes: 0 ok · 2 config error. Read-only: never writes sitemap.xml.
//
// Lastmod policy (FREEZE §7):
//   articles      -> content object `updated ?? published` (tools/ratgeber-content.mjs)
//   guide hubs    -> newest published guide date
//   static pages  -> last meaningful git commit date touching the page file
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { additionalArticles, article, locales } from './ratgeber-content.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const diffMode = process.argv.includes('--diff');
const writeMode = process.argv.includes('--write');
const BASE = 'https://mygoldfolio.de';

function gitDate(relPath) {
  try {
    return execFileSync('git', ['-C', repoRoot, 'log', '-1', '--format=%cs', '--', relPath.replace(/^\//, '')], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return null;
  }
}

function routes() {
  const localeCodes = Object.keys(locales);
  const entries = new Map(); // url -> lastmod
  const add = (path, lastmod) => {
    if (!path || !lastmod) return;
    entries.set(`${BASE}${path}`, lastmod);
  };

  // Homes ×7
  add('/', gitDate('index.html'));
  for (const code of localeCodes) add(`/${code}/`, gitDate(`${code}/index.html`));

  // Secondary pages ×7 (segment names identical across locales)
  for (const seg of ['changelog', 'feedback', 'help', 'privacy', 'roadmap']) {
    add(`/${seg}/`, gitDate(`${seg}/index.html`));
    for (const code of localeCodes) add(`/${code}/${seg}/`, gitDate(`${code}/${seg}/index.html`));
  }

  // Guides: hubs + articles from the canonical content objects
  const published = [article, ...additionalArticles].filter((a) => a.status !== 'draft');
  const dates = published.map((a) => a.updated ?? a.published);
  const newestGuideDate = dates.length ? dates.reduce((acc, d) => (d > acc ? d : acc)) : null;

  for (const code of localeCodes) {
    const loc = locales[code];
    if (!loc?.hubPath) continue;
    if (!existsSync(join(repoRoot, loc.hubPath.replace(/^\//, ''), 'index.html'))) continue;
    add(loc.hubPath, newestGuideDate);
    for (const art of published) {
      const path = art.paths?.[code] ?? loc.articlePath;
      if (!path) continue;
      // Only the base article uses the shared locale.articlePath; other articles
      // must provide their own per-locale paths entry.
      const isSharedDefault = !art.paths?.[code] && art !== article;
      if (isSharedDefault) continue;
      if (!existsSync(join(repoRoot, path.replace(/^\//, ''), 'index.html'))) continue;
      add(path, art.updated ?? art.published);
    }
  }

  return entries;
}

function xml(entries) {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
  for (const [loc, lastmod] of [...entries.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push('  <url>', `    <loc>${loc}</loc>`, `    <lastmod>${lastmod}</lastmod>`, '  </url>');
  }
  lines.push('</urlset>', '');
  return lines.join('\n');
}

const computed = routes();
if (diffMode) {
  const sitemapPath = join(repoRoot, 'sitemap.xml');
  if (!existsSync(sitemapPath)) {
    console.error('FAIL(2): sitemap.xml not found');
    process.exit(2);
  }
  const raw = readFileSync(sitemapPath, 'utf8');
  const existing = new Set();
  const re = /<loc>(.*?)<\/loc>/g;
  let m;
  while ((m = re.exec(raw)) !== null) existing.add(m[1]);

  const lines = [];
  let missing = 0;
  for (const [url] of [...computed.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (!existing.has(url)) {
      lines.push(`+ MISSING-FROM-CURRENT ${url} (computed lastmod ${computed.get(url)})`);
      missing += 1;
    }
  }
  const validUrls = new Set(computed.keys());
  let extra = 0;
  for (const url of [...existing].sort()) {
    if (!validUrls.has(url)) {
      lines.push(`- IN-CURRENT-NOT-COMPUTED ${url}`);
      extra += 1;
    }
  }
  console.log(`# sitemap diff @ ${new Date().toISOString().slice(0, 10)}`);
  console.log(`# computed=${computed.size} current=${existing.size} missing-from-current=${missing} unexpected-in-current=${extra}`);
  console.log(lines.join('\n'));
  process.exit(0);
}

if (writeMode) {
  const sitemapPath = join(repoRoot, 'sitemap.xml');
  writeFileSync(sitemapPath, xml(computed), 'utf8');
  console.log(`WROTE ${sitemapPath} (${computed.size} URLs)`);
  process.exit(0);
}

console.log(xml(computed));
