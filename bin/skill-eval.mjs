#!/usr/bin/env node
// Usage: skill-eval [--adapter coverage|model] [--skill path] [--scenarios path] [--json] [--out file]
// model adapter: LLM_API_KEY, LLM_BASE_URL (default https://api.openai.com/v1), LLM_MODEL (default gpt-4o-mini)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { coverage, openAICompatible, runModel, summarize } from '../src/evals.mjs';

const root = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const adapter = opt('--adapter', 'coverage');
const skillPath = resolve(opt('--skill', root + 'skills/dev-work-bot-setup/SKILL.md'));
const scenarios = JSON.parse(readFileSync(resolve(opt('--scenarios', root + 'evals/scenarios.json')), 'utf8'));
const skill = readFileSync(skillPath, 'utf8');

let results, model;
if (adapter === 'coverage') results = coverage(skill, scenarios);
else if (adapter === 'model') {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) { console.error('model adapter needs LLM_API_KEY (and optionally LLM_BASE_URL, LLM_MODEL)'); process.exit(2); }
  model = process.env.LLM_MODEL || 'gpt-4o-mini';
  results = await runModel(scenarios, skill, openAICompatible({ apiKey, baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1', model }));
} else { console.error(`unknown adapter ${adapter}`); process.exit(2); }

const summary = { adapter, ...(model ? { model } : {}), scenarios: scenarios.length, ...summarize(results) };
const outFile = opt('--out');
if (outFile) writeFileSync(resolve(outFile), JSON.stringify({ ...summary, results }, null, 2) + '\n');
if (args.includes('--json')) console.log(JSON.stringify(summary));
else {
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.id}${r.pass ? '' : '  ' + (r.missing?.join('; ') || r.reasons?.join('; ') || r.error)}`);
  console.log(`${adapter}: ${summary.passed}/${summary.total} passed (${(summary.passRate * 100).toFixed(1)}%)`);
}
process.exit(summary.passed === summary.total ? 0 : 1);
