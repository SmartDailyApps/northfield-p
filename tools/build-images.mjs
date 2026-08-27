// WEB-UX1 Phase 2 (rev 4, final) | manifest-driven responsive-image derivatives (FREEZE §1/§3).
//
//   node tools/build-images.mjs                    generate all derivatives
//   node tools/build-images.mjs --dry-run          list planned outputs, write nothing
//   node tools/build-images.mjs --check            reconcile manifest vs disk (hash-exact)
//   node tools/build-images.mjs --filter=<substr>  limit to sources whose path contains <substr>
//   node tools/build-images.mjs --json             machine-readable summary (last line)
//
// Exit codes: 0 pass · 1 mismatch/stale · 2 config error.
// Deterministic: sorted inputs, fixed encode options, metadata stripped,
// sequential generation. No network access. No watermarks/overlays |
// branding belongs in the source artwork (owner decision 2026-08-26).
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(repoRoot, 'tools', 'images.manifest.json');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const checkMode = args.includes('--check');
const jsonMode = args.includes('--json');
const filterArg = args.find((a) => a.startsWith('--filter='));
const filter = filterArg ? filterArg.split('=')[1] : null;

function fail(code, message) {
  if (jsonMode) console.log(JSON.stringify({ ok: false, code, message }));
  else console.error(`FAIL(${code}): ${message}`);
  process.exit(code);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]');
  return new RegExp(`^${escaped}$`);
}

function collectSources(relGlob) {
  const rx = globToRegExp(relGlob);
  return walk(join(repoRoot, 'images'))
    .map((p) => relative(repoRoot, p).replace(/\\/g, '/'))
    .filter((p) => rx.test(p))
    .sort();
}

const formatExtMap = { avif: '.avif', webp: '.webp', png: '.png', jpeg: '.jpg' };

async function encode(sourceAbs, width, fmt) {
  let pipe = sharp(sourceAbs).resize({ width, withoutEnlargement: true });
  switch (fmt.type) {
    case 'avif':
      pipe = pipe.avif({ quality: fmt.quality ?? 50, effort: fmt.effort ?? 4 });
      break;
    case 'webp':
      pipe = fmt.lossless ? pipe.webp({ lossless: true }) : pipe.webp({ quality: fmt.quality ?? 80 });
      break;
    case 'png':
      pipe = pipe.png({ compressionLevel: fmt.compressionLevel ?? 9 });
      break;
    case 'jpeg':
      pipe = pipe.jpeg({ quality: fmt.quality ?? 80, mozjpeg: fmt.mozjpeg !== false });
      break;
    default:
      fail(2, `unknown format type "${fmt.type}"`);
  }
  // sharp strips all metadata by default; this explicit call documents intent.
  return pipe.withMetadata({ exif: {} }).toBuffer();
}

async function plan() {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    return fail(2, `cannot parse ${manifestPath}: ${err.message}`);
  }
  const outputRoot = manifest.outputRoot || 'images/gen';
  const jobs = [];
  for (const [role, spec] of Object.entries(manifest.roles || {})) {
    if (!spec.source || !Array.isArray(spec.widths) || !Array.isArray(spec.formats)) {
      return fail(2, `role "${role}" needs source, widths[], formats[]`);
    }
    const sources = collectSources(spec.source).filter((s) => !filter || s.includes(filter));
    for (const relSource of sources) {
      const sourceAbs = join(repoRoot, relSource);
      const meta = await sharp(sourceAbs).metadata();
      // Preserve any sub-path below the glob's fixed prefix (e.g. locale folders),
      // so 'images/app-screens/en/dashboard.png' -> base 'en/dashboard'.
      const prefix = spec.source.split('*')[0].replace(/[^/]*$/, '');
      const base = relSource.startsWith(prefix) ? relSource.slice(prefix.length).replace(/\.[^.]+$/, '') : relSource.split('/').pop().replace(/\.[^.]+$/, '');
      for (const width of spec.widths) {
        if (width > meta.width) continue; // cap-at-source rule (FREEZE ladder rule)
        for (const fmt of spec.formats) {
          jobs.push({
            role,
            source: relSource,
            width,
            format: fmt.type,
            outRel: `${outputRoot}/${role}/${base}-${width}${formatExtMap[fmt.type]}`,
          });
        }
      }
    }
  }
  return { jobs };
}

async function main() {
  const { jobs } = await plan();

  if (dryRun) {
    for (const job of jobs) console.log(`DRY ${job.outRel}  <= ${job.source} @${job.width}w (${job.format})`);
    console.log(`dry-run: ${jobs.length} planned outputs across ${new Set(jobs.map((j) => j.source)).size} sources`);
    process.exit(0);
  }

  if (checkMode) {
    let missing = 0;
    let stale = 0;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    for (const job of jobs) {
      const abs = join(repoRoot, job.outRel);
      if (!existsSync(abs)) {
        missing += 1;
        if (!jsonMode) console.log(`MISSING ${job.outRel}`);
        continue;
      }
      const onDisk = readFileSync(abs);
      const fmt = manifest.roles[job.role].formats.find((f) => f.type === job.format);
      const fresh = await encode(join(repoRoot, job.source), job.width, fmt);
      if (!onDisk.equals(fresh)) {
        stale += 1;
        if (!jsonMode) console.log(`STALE   ${job.outRel}`);
      }
    }
    const summary = { ok: missing === 0 && stale === 0, expected: jobs.length, missing, stale };
    if (jsonMode) console.log(JSON.stringify(summary));
    else {
      console.log(`check: expected=${summary.expected} missing=${missing} stale=${stale}`);
      if (summary.ok) console.log('CURRENT | disk matches a fresh deterministic regeneration.');
    }
    process.exit(summary.ok ? 0 : 1);
  }

  mkdirSync(join(repoRoot, 'images', 'gen'), { recursive: true });
  let written = 0;
  let bytes = 0;
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const job of jobs) {
    const fmt = manifest.roles[job.role].formats.find((f) => f.type === job.format);
    const fresh = await encode(join(repoRoot, job.source), job.width, fmt);
    const abs = join(repoRoot, job.outRel);
    mkdirSync(dirname(abs), { recursive: true });
    const current = existsSync(abs) ? readFileSync(abs) : null;
    if (!current || !current.equals(fresh)) writeFileSync(abs, fresh);
    written += 1;
    bytes += fresh.length;
  }
  const summary = { ok: true, written, totalBytes: bytes };
  if (jsonMode) console.log(JSON.stringify(summary));
  else console.log(`built ${written} derivatives, ${bytes} bytes total under images/gen/ (unchanged files left untouched)`);
  process.exit(0);
}

main().catch((err) => fail(2, err && err.stack ? err.stack : String(err)));
