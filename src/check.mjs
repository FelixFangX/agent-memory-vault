// Pure checks: SKILL.md frontmatter and a secret/PII text scan.
// Findings are { level, rule, line?, message } and never contain the matched value.

export function checkSkill(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return [{ level: 'error', rule: 'frontmatter-missing', message: 'SKILL.md must start with --- frontmatter ---' }];
  const fields = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (kv) { key = kv[1]; fields[key] = /^[>|][-+]?$/.test(kv[2]) ? '' : kv[2].trim(); }
    else if (key && /^\s+\S/.test(line)) fields[key] = (fields[key] + ' ' + line.trim()).trim();
  }
  const out = [];
  for (const k of ['name', 'description']) {
    if (!fields[k]) out.push({ level: 'error', rule: `frontmatter-${k}`, message: `frontmatter needs a non-empty "${k}"` });
  }
  return out;
}

const SECRET = [
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}\b/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\blin_api_[A-Za-z0-9]{20,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(?:api[_-]?key|secret|token|password|passwd)\s*[:=]\s*["']?[A-Za-z0-9_\-\/+]{12,}/i,
];
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/;
const PHONE = [
  /\+\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}\b/, // international
  /\b1[3-9]\d{9}\b/, // mainland China mobile
  /\(\d{3}\)\s?\d{3}-\d{4}\b/,
];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function scanText(text, { denylist = [] } = {}) {
  const deny = denylist.map(t => t.trim()).filter(Boolean)
    .map(t => new RegExp(`(?<![\\p{L}\\p{N}_])${esc(t)}(?![\\p{L}\\p{N}_])`, 'iu'));
  const out = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const hit = (rule, message) => out.push({ level: 'error', rule, line: i + 1, message });
    if (SECRET.some(r => r.test(line))) hit('secret', 'possible secret or credential');
    if (EMAIL.test(line)) hit('email', 'email address');
    if (PHONE.some(r => r.test(line))) hit('phone', 'phone number');
    deny.forEach((r, n) => { if (r.test(line)) hit('denylist', `denylisted term #${n + 1}`); });
  });
  return out;
}
