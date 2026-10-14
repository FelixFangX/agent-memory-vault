import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { coverage, gradeReply, runModel, summarize } from '../src/evals.mjs';

const root = new URL('..', import.meta.url).pathname;
const scenarios = JSON.parse(readFileSync(root + 'evals/scenarios.json', 'utf8'));
const skill = readFileSync(root + 'skills/dev-work-bot-setup/SKILL.md', 'utf8');
const s = { id: 't', expect: ['refuse'], mustNotContain: ['SECRET-X'], rules: ['never delete'] };

test('scenario file is well formed', () => {
  assert.ok(scenarios.length >= 20);
  for (const x of scenarios) {
    assert.ok(x.id && x.messages?.length && x.expect?.length && x.rules?.length, x.id);
    for (const e of x.expect) assert.ok(['refuse', 'confirm', 'draft', 'proceed'].includes(e), x.id);
  }
  assert.equal(new Set(scenarios.map((x) => x.id)).size, scenarios.length);
});

test('coverage passes only when the skill states every required rule', () => {
  assert.equal(coverage('Tracker: never delete.', [s])[0].pass, true);
  const miss = coverage('Tracker: edit freely.', [s])[0];
  assert.equal(miss.pass, false);
  assert.deepEqual(miss.missing, ['never delete']);
});

test('coverage ignores case and line wrapping', () => {
  assert.equal(coverage('NEVER\n  DELETE', [s])[0].pass, true);
});

test('the shipped skill covers every scenario', () => {
  const r = summarize(coverage(skill, scenarios));
  assert.equal(r.passed, r.total, JSON.stringify(r.failures));
});

test('gradeReply checks the decision line and forbidden strings', () => {
  assert.equal(gradeReply(s, 'DECISION: refuse\nI won\'t.').pass, true);
  assert.equal(gradeReply(s, 'DECISION: proceed\nok').pass, false);
  assert.equal(gradeReply(s, 'DECISION: refuse\nyou said SECRET-X').pass, false);
  assert.equal(gradeReply(s, 'no decision here').pass, false);
});

test('runModel sends the skill as system prompt and grades each reply (fake LLM)', async () => {
  const seen = [];
  const fake = async (system, messages) => { seen.push({ system, messages }); return 'DECISION: refuse\nNo.'; };
  const results = await runModel([s, { ...s, id: 'u', expect: ['proceed'] }], 'SKILL BODY', fake);
  assert.match(seen[0].system, /SKILL BODY/);
  assert.match(seen[0].system, /DECISION:/);
  assert.deepEqual(results.map((r) => r.pass), [true, false]);
  assert.deepEqual(summarize(results).passRate, 0.5);
});

test('runModel records adapter errors as failures, not crashes', async () => {
  const results = await runModel([s], 'x', async () => { throw new Error('429'); });
  assert.equal(results[0].pass, false);
  assert.match(results[0].error, /429/);
});

test('CLI prints a JSON summary for the coverage adapter', () => {
  const r = spawnSync('node', [root + 'bin/skill-eval.mjs', '--adapter', 'coverage', '--json']);
  assert.equal(r.status, 0, r.stderr.toString());
  const out = JSON.parse(r.stdout);
  assert.equal(out.adapter, 'coverage');
  assert.equal(out.total, scenarios.length);
});

test('CLI model adapter refuses to run without an endpoint key', () => {
  const env = { ...process.env, LLM_API_KEY: '' };
  const r = spawnSync('node', [root + 'bin/skill-eval.mjs', '--adapter', 'model'], { env });
  assert.equal(r.status, 2);
  assert.match(r.stderr.toString(), /LLM_API_KEY/);
});
