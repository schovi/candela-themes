// Runs the app's *.test.ts files under node --test. They import app modules that
// use extensionless specifiers (Vite-resolved), which node's own resolver can't
// follow, so we esbuild-bundle each test to a temp file first (node: builtins stay
// external) and run node --test over the bundles.
import { build } from 'esbuild';
import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const srcDir = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src');
const tests = readdirSync(srcDir).filter((f) => f.endsWith('.test.ts'));
if (tests.length === 0) process.exit(0);

const outDir = mkdtempSync(join(tmpdir(), 'candela-tests-'));
const outfiles = tests.map((f) => join(outDir, basename(f, '.ts') + '.mjs'));
await build({
  entryPoints: tests.map((f) => join(srcDir, f)),
  outdir: outDir,
  bundle: true,
  format: 'esm',
  platform: 'node',
  outExtension: { '.js': '.mjs' },
  loader: { '.json': 'json' },
  logLevel: 'warning',
});

const child = spawn(process.execPath, ['--test', ...outfiles], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 1));
