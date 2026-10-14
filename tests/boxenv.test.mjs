import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { checkBoxEnvSync, toolsFromDoc, toolsFromScript } from '../src/boxenv.mjs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const sh = read('scripts/setup-box.sh');
const doc = read('docs/box-environment.md');

test('setup script and doc list the same tools with the same tiers', () => {
  assert.deepEqual(checkBoxEnvSync(sh, doc), []);
  assert.ok(toolsFromScript(sh).some((t) => t.name === 'gh' && t.tier === 'required'));
});

test('drift is reported both ways and on tier changes', () => {
  const msgs = checkBoxEnvSync(
    '"TOOLS=(\n  "gh|required|apt:gh"\n  "jq|optional|apt:jq"\n)'.slice(1),
    '| `gh` | required | x |\n| `jq` | required | x |\n| `rg` | required | x |\n',
  ).map((f) => f.message);
  assert.deepEqual(msgs, ['jq is optional in the script but required in the doc', 'rg is in the doc but not the setup script']);
  assert.equal(toolsFromDoc('| Service | How |').length, 0);
});

test('setup-box.sh is valid bash and --check --json reports without installing', () => {
  assert.equal(spawnSync('bash', ['-n', 'scripts/setup-box.sh']).status, 0);
  const r = spawnSync('bash', ['scripts/setup-box.sh', '--check', '--json'], { env: { ...process.env, DEV_WORK_SECRETS_DIR: '/nonexistent-dev-work' } });
  const out = JSON.parse(r.stdout.toString());
  assert.equal(out.tools.length, toolsFromScript(sh).length);
  assert.equal(out.auth.secretsDir, 'absent');
  assert.equal(r.status, out.ok ? 0 : 1);
});
