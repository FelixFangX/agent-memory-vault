import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const fm = (o) => `---\n${Object.entries(o).map(([k, v]) => `${k}: ${v}`).join("\n")}\n---\n\n# Note\n`;
const ok = (scope, extra = {}) => fm({ scope, type: "note", source: "stated", updated: "2026-01-15", private: true, ...extra });

export const MINIMAL = {
  "AGENTS.md": "# agents\n",
  "global/principles.md": ok("global"),
  "personal/profile.md": ok("personal"),
  "personal/pending.md": ok("personal"),
  "work/INDEX.md": "# index\n",
};
export { ok };

/** Writes files {relPath: content} into a fresh temp vault and returns its path. `null` content = empty dir. */
export async function vault(files = MINIMAL) {
  const root = await mkdtemp(path.join(tmpdir(), "vault-"));
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(root, rel);
    if (content === null) { await mkdir(p, { recursive: true }); continue; }
    await mkdir(path.dirname(p), { recursive: true });
    await writeFile(p, content);
  }
  return root;
}
