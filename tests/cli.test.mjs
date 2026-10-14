import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const bin = new URL('../bin/skill-check.mjs', import.meta.url).pathname;
function repo(files) {
  const d = mkdtempSync(join(tmpdir(), 'sc-'));
  for (const [p, c] of Object.entries(files)) { mkdirSync(join(d, p, '..'), { recursive: true }); writeFileSync(join(d, p), c); }
  return d;
}
const skill = '---\nname: s\ndescription: d\n---\n';

test('clean repo exits 0', () => {
  const d = repo({ 'skills/s/SKILL.md': skill, 'README.md': '# hi' });
  assert.match(execFileSync('node', [bin, d]).toString(), /0 errors/);
});
test('leak exits 1 and denylist file is honoured', () => {
  const d = repo({ 'skills/s/SKILL.md': skill, 'docs/a.md': 'ask Zelda', 'deny.txt': 'Zelda\n' });
  const r = spawnSync('node', [bin, d, '--denylist', join(d, 'deny.txt'), '--json']);
  assert.equal(r.status, 1);
  const out = JSON.parse(r.stdout);
  assert.ok(out.some(f => f.rule === 'denylist' && f.file === 'docs/a.md'));
  assert.ok(!r.stdout.toString().includes('Zelda'));
});
test('repo without a skill is an error', () => {
  assert.equal(spawnSync('node', [bin, repo({ 'README.md': '#' })]).status, 1);
});
