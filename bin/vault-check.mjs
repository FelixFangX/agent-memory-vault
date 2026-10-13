#!/usr/bin/env node
import { checkVault } from "../src/index.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const dir = args.find((a) => !a.startsWith("--")) ?? ".";
const findings = await checkVault(dir);

if (json) console.log(JSON.stringify(findings, null, 2));
else {
  for (const f of findings) console.log(`${f.level === "error" ? "✗" : "!"} ${f.rule}  ${f.file}${f.line ? `:${f.line}` : ""}  ${f.message}`);
  const e = findings.filter((f) => f.level === "error").length, w = findings.length - e;
  console.log(e || w ? `${e} error(s), ${w} warning(s)` : "✓ vault looks good");
}
process.exit(findings.some((f) => f.level === "error") ? 1 : 0);
