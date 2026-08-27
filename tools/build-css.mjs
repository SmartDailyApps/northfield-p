// WEB-UX1 Phase 2 | deterministic static-CSS build/check (FREEZE.md §4).
//
//   node tools/build-css.mjs            build assets/css/main.min.css
//   node tools/build-css.mjs --check    rebuild to temp; verify committed output is current
//   node tools/build-css.mjs --json     machine-readable summary line
//
// Exit codes: 0 pass · 1 stale/mismatch · 2 config/tool error.
// No network access. Output must be byte-identical across reruns.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(repoRoot, 'tailwind.config.js');
const inputPath = join(repoRoot, 'assets', 'css', 'input.css');
const outputPath = join(repoRoot, 'assets', 'css', 'main.min.css');
const checkMode = process.argv.includes('--check');
const jsonMode = process.argv.includes('--json');

function tailwindCliPath() {
  const pkg = require.resolve('tailwindcss/package.json');
  const manifest = JSON.parse(readFileSync(pkg, 'utf8'));
  const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin.tailwindcss;
  return resolve(dirname(pkg), bin);
}

function runCompiler(outPath) {
  const cli = tailwindCliPath();
  const res = spawnSync(process.execPath, [cli, '-c', configPath, '-i', inputPath, '-o', outPath, '--minify'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (res.status !== 0) {
    process.stderr.write(res.stdout || '');
    process.stderr.write(res.stderr || '');
    fail(2, `tailwind compiler exited ${res.status}`);
  }
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function fail(code, message, payload = {}) {
  if (jsonMode) console.log(JSON.stringify({ ok: false, code, message, ...payload }));
  else console.error(`FAIL(${code}): ${message}`);
  process.exit(code);
}

try {
  if (!existsSync(configPath) || !existsSync(inputPath)) fail(2, 'tailwind.config.js or assets/css/input.css missing');
  const tmpOut = join(tmpdir(), `mgf-main-${Date.now()}.min.css`);
  runCompiler(tmpOut);
  const fresh = readFileSync(tmpOut);

  if (!checkMode) {
    copyFileSync(tmpOut, outputPath);
    rmSync(tmpOut, { force: true });
    const result = { status: 'BUILT', sha256: sha256(fresh), bytes: fresh.length };
    if (jsonMode) console.log(JSON.stringify({ ok: true, ...result }));
    else console.log(`BUILT assets/css/main.min.css bytes=${fresh.length} sha256=${result.sha256}`);
    process.exit(0);
  }

  if (!existsSync(outputPath)) {
    if (jsonMode) console.log(JSON.stringify({ ok: false, status: 'MISSING', expectedSha256: sha256(fresh), bytes: fresh.length }));
    else console.error('STALE: assets/css/main.min.css MISSING | run "npm run build:css" and commit the output.');
    rmSync(tmpOut, { force: true });
    process.exit(1);
  }

  const current = readFileSync(outputPath);
  const identical = current.equals(fresh);
  rmSync(tmpOut, { force: true });
  if (identical) {
    const result = { status: 'CURRENT', sha256: sha256(current), bytes: current.length };
    if (jsonMode) console.log(JSON.stringify({ ok: true, ...result }));
    else console.log(`CURRENT assets/css/main.min.css bytes=${current.length} sha256=${result.sha256}`);
    process.exit(0);
  }
  if (jsonMode) console.log(JSON.stringify({ ok: false, status: 'STALE', onDiskSha256: sha256(current), expectedSha256: sha256(fresh), onDiskBytes: current.length, expectedBytes: fresh.length }));
  else console.error('STALE: assets/css/main.min.css differs from a fresh build | run "npm run build:css" and commit the output.');
  process.exit(1);
} catch (err) {
  fail(2, err && err.stack ? err.stack : String(err));
}
