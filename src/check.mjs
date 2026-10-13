import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";

export const SCOPES = ["global", "personal", "work"];
export const SOURCES = ["stated", "confirmed", "verified"];
export const REQUIRED = ["AGENTS.md", "global/principles.md", "personal/profile.md", "personal/pending.md", "work/INDEX.md"];
const NO_FRONTMATTER = new Set(["AGENTS.md", "README.md", "INDEX.md"]);
const REQUIRED_KEYS = ["scope", "type", "source", "updated", "private"];
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (s) => typeof s === "string" && ISO.test(s) && !Number.isNaN(Date.parse(s));

/** Extra line-level rules can be plugged in (see privacy.mjs). */
const lineRules = [];
export const registerLineRules = (rules) => lineRules.push(...rules);

async function walk(dir, rel = "") {
  const out = { files: [], dirs: [] };
  for (const e of await readdir(path.join(dir, rel), { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      out.dirs.push(r);
      const sub = await walk(dir, r);
      out.files.push(...sub.files); out.dirs.push(...sub.dirs);
    } else out.files.push(r);
  }
  return out;
}

/**
 * @param {string} root vault directory
 * @param {{today?: Date}} [opts]
 * @returns {Promise<{level:'error'|'warn', rule:string, file:string, line?:number, message:string}[]>}
 */
export async function checkVault(root, { today = new Date() } = {}) {
  const findings = [];
  const add = (level, rule, file, message, line) => findings.push({ level, rule, file, ...(line ? { line } : {}), message });
  const { files, dirs } = await walk(root);
  const fileSet = new Set(files);

  for (const req of REQUIRED) if (!fileSet.has(req)) add("error", "required-file", req, "required file is missing");

  for (const d of dirs) {
    const [scope, mod, ...deeper] = d.split("/");
    if (scope === "work" && mod && deeper.length === 0 && !files.some((f) => f.startsWith(`${d}/`) && f.endsWith(".md")))
      add("error", "empty-module", d, "work modules are created only when they have content");
  }

  for (const file of files.filter((f) => f.endsWith(".md")).sort()) {
    const parts = file.split("/");
    if (parts.length === 1) continue; // root files like AGENTS.md
    const folderScope = parts[0];
    if (!SCOPES.includes(folderScope)) { add("error", "unknown-scope", file, `top-level folder must be one of ${SCOPES.join(", ")}`); continue; }
    const text = await readFile(path.join(root, file), "utf8");
    const base = parts.at(-1);
    const fm = parseFrontmatter(text);

    if (!NO_FRONTMATTER.has(base)) {
      if (!fm) add("error", "frontmatter-missing", file, "note has no frontmatter block");
      else {
        const d = fm.data;
        for (const k of REQUIRED_KEYS) if (!(k in d)) add("error", "frontmatter-key", file, `missing key: ${k}`);
        if ("scope" in d && d.scope !== folderScope) add("error", "scope-mismatch", file, `scope '${d.scope}' but folder is '${folderScope}'`);
        if ("source" in d && !SOURCES.includes(d.source)) add("error", "source-invalid", file, `source must be ${SOURCES.join(" | ")}`);
        if ("updated" in d && !isDate(d.updated)) add("error", "date-invalid", file, "updated must be YYYY-MM-DD");
        if ("expires" in d) {
          if (!isDate(d.expires)) add("error", "date-invalid", file, "expires must be YYYY-MM-DD");
          else if (new Date(d.expires) < today) add("warn", "stale", file, `expired on ${d.expires}: re-check before relying on it`);
        }
        if (d.private === false) add("warn", "not-private", file, "private: false, so make sure this note is safe to publish");
      }
    }

    const lines = text.split(/\r?\n/);
    for (const rule of lineRules) for (const f of rule.check({ file, scope: folderScope, lines, text })) add(f.level, rule.id, file, f.message, f.line);
  }
  return findings;
}
