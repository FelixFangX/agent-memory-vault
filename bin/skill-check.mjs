#!/usr/bin/env node
// Usage: skill-check [dir] [--denylist <file>] [--json]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkSkill, scanText } from '../src/check.mjs';
import { checkBoxEnvSync } from '../src/boxenv.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json');
const di = args.indexOf('--denylist');
const denyPath = di >= 0 ? resolve(args[di + 1]) : null;
const root = resolve(args.find((a, i) => !a.startsWith('--') && (di < 0 || i !== di + 1)) ?? '.');
const denylist = denyPath ? readFileSync(denyPath, 'utf8').split(/\r?\n/) : [];

const SKIP = new Set(['.git', 'node_modules']);
const TEXT = /\.(md|mjs|js|json|ya?ml|txt|svg|toml|sh)$|^(LICENSE|\.gitignore)$/;
function listFiles() {
  try { return execFileSync('git', ['-C', root, 'ls-files'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n').filter(Boolean); }
  catch {
    const out = [];
    (function walk(d) { for (const n of readdirSync(d)) { if (SKIP.has(n)) continue; const p = join(d, n); statSync(p).isDirectory() ? walk(p) : out.push(relative(root, p)); } })(root);
    return out;
  }
}

const findings = [];
const files = listFiles().filter(f => TEXT.test(f.split('/').pop()) && resolve(root, f) !== denyPath);
const skills = files.filter(f => /(^|\/)SKILL\.md$/.test(f));
if (!skills.length) findings.push({ level: 'error', rule: 'skill-missing', file: '.', message: 'no SKILL.md found' });
for (const f of skills) for (const x of checkSkill(readFileSync(join(root, f), 'utf8'))) findings.push({ ...x, file: f });
for (const f of files) for (const x of scanText(readFileSync(join(root, f), 'utf8'), { denylist })) findings.push({ ...x, file: f });

const SH = 'scripts/setup-box.sh', DOC = 'docs/box-environment.md';
if (files.includes(SH) || files.includes(DOC)) {
  const read = (f) => (files.includes(f) ? readFileSync(join(root, f), 'utf8') : '');
  for (const x of checkBoxEnvSync(read(SH), read(DOC))) findings.push({ ...x, file: DOC });
}

const errors = findings.filter(f => f.level === 'error').length;
if (json) console.log(JSON.stringify(findings, null, 2));
else {
  for (const f of findings) console.log(`${f.level.toUpperCase()} ${f.file}${f.line ? ':' + f.line : ''} [${f.rule}] ${f.message}`);
  console.log(`${files.length} files, ${skills.length} skill(s), ${errors} errors`);
}
process.exit(errors ? 1 : 0);
