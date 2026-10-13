// Line-level heuristics for things a memory vault must not hold.
// Every finding names the rule and line, never the matched value.
const allowed = (line, id) => new RegExp(`<!--\\s*vault-check:allow\\s+[^>]*\\b${id}\\b`).test(line);

const perLine = (id, level, message, test) => ({
  id,
  check: ({ lines, scope }) =>
    lines.flatMap((line, i) => (!allowed(line, id) && test(line, scope) ? [{ level, line: i + 1, message }] : [])),
});

const SECRET = [
  /\b(sk-|sk_live_|rk_live_|ghp_|gho_|ghs_|github_pat_|xox[abpr]-|glpat-|AIza)[A-Za-z0-9_-]{16,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, // JWT
  /\b(password|passwd|pwd|secret|api[_ -]?key|token|密码)\s*[:=：]\s*\S{6,}/i,
];
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const PHONE = /(\+\d{1,3}[\s.-]?)\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b|\b1[3-9]\d{9}\b|\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/;
const RELATIONSHIP = /\b(girl ?friend|boy ?friend|wife|husband|spouse|fianc[ée]e?|ex-(girl|boy)friend|my partner|dating|divorc\w*|crush on)\b|女朋友|男朋友|老婆|老公|妻子|丈夫|前任|恋爱|相亲/i;
const REASONING = /<(thinking|think|reasoning|scratchpad)>|chain[- ]of[- ]thought:/i;
const TOOL_CONFIG = /"(mcpServers|alwaysApply|allowedTools|permissions)"\s*:|^\s*(mcpServers|alwaysApply):/;

export const PRIVACY_RULES = [
  perLine("secret", "error", "looks like a credential: secrets never belong in memory", (l) => SECRET.some((re) => re.test(l))),
  perLine("personal-data", "error", "email or phone number outside personal/", (l, scope) => scope !== "personal" && (EMAIL.test(l) || PHONE.test(l))),
  perLine("relationship", "error", "relationship information is never stored", (l) => RELATIONSHIP.test(l)),
  perLine("model-reasoning", "error", "model reasoning is not memory: store the conclusion, not the thinking", (l) => REASONING.test(l)),
  perLine("tool-config", "error", "tool or agent configuration belongs in the tool, not the vault", (l) => TOOL_CONFIG.test(l)),
  {
    id: "chat-log",
    check: ({ lines }) => {
      const user = lines.filter((l) => /^\s*(\*\*)?(user|human|me|用户)(\*\*)?\s*[:：]/i.test(l)).length;
      const bot = lines.filter((l) => /^\s*(\*\*)?(assistant|ai|bot|claude|gpt|助手)(\*\*)?\s*[:：]/i.test(l)).length;
      const first = lines.findIndex((l) => /^\s*(\*\*)?(user|human|assistant)(\*\*)?\s*[:：]/i.test(l));
      return user >= 2 && bot >= 2 && !allowed(lines[first] ?? "", "chat-log")
        ? [{ level: "error", line: first + 1, message: "looks like a pasted chat transcript: store the facts, not the conversation" }]
        : [];
    },
  },
];
