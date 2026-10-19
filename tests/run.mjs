// Headless gameplay tests: each *.test.mjs drives the real simulation (src/game/World.js) and prints
// PASS/FAIL lines. The level tests are scripted playthroughs proving each level can be finished.
//   npm test
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
let failed = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.test.mjs')).sort()) {
  const r = spawnSync(process.execPath, [join(dir, f)], { cwd: dir, encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const bad = r.status !== 0 || /\bFAIL\b/.test(out);
  if (bad) failed++;
  console.log(`${bad ? '✗' : '✓'} ${f}`);
  if (bad) console.log(out.split('\n').map((l) => `    ${l}`).join('\n'));
}
console.log(failed ? `\n${failed} test file(s) failed` : '\nall gameplay tests passed');
process.exit(failed ? 1 : 0);
