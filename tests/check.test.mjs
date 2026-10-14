import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSkill, scanText } from '../src/check.mjs';

const ok = '---\nname: demo-skill\ndescription: >-\n  Use when testing.\n---\n# Demo\n';

test('valid frontmatter passes', () => assert.deepEqual(checkSkill(ok), []));
test('missing frontmatter is an error', () =>
  assert.equal(checkSkill('# no fm')[0].rule, 'frontmatter-missing'));
test('missing name and description are reported', () => {
  const rules = checkSkill('---\nfoo: bar\n---\n').map(f => f.rule);
  assert.deepEqual(rules.sort(), ['frontmatter-description', 'frontmatter-name']);
});
test('empty folded description is an error', () =>
  assert.equal(checkSkill('---\nname: x\ndescription: >-\n---\n')[0].rule, 'frontmatter-description'));

const tok = 'ghp_' + 'a'.repeat(36);
test('detects tokens without echoing them', () => {
  const f = scanText(`key ${tok}\n`);
  assert.equal(f[0].rule, 'secret');
  assert.equal(f[0].line, 1);
  assert.ok(!JSON.stringify(f).includes(tok));
});
test('detects private keys and assignments', () => {
  assert.equal(scanText('-----BEGIN ' + 'OPENSSH PRIVATE KEY-----')[0].rule, 'secret');
  assert.equal(scanText('api_' + 'key = "abcd1234efgh5678"')[0].rule, 'secret');
});
test('detects emails and phone numbers', () => {
  assert.equal(scanText('mail sam' + '@acme.io')[0].rule, 'email');
  assert.equal(scanText('call +1 415 ' + '555 0134')[0].rule, 'phone');
  assert.equal(scanText('call 138' + '00138000')[0].rule, 'phone');
});
test('ignores placeholders, URLs and dates', () => {
  assert.deepEqual(scanText('see https://example.app/x and 2026-10-14, version 1.2.3, mode 600\n`~/.config/<owner>-secrets/*.env`'), []);
});
test('denylist matches case-insensitively on word boundaries', () => {
  const f = scanText('Ping Zelda about it', { denylist: ['zelda'] });
  assert.equal(f[0].rule, 'denylist');
  assert.ok(!f[0].message.toLowerCase().includes('zelda'));
  assert.deepEqual(scanText('zeldaland', { denylist: ['zelda'] }), []);
});
