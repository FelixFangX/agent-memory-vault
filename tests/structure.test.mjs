import { test } from "node:test";
import assert from "node:assert/strict";
import { checkVault } from "../src/index.mjs";
import { vault, MINIMAL, ok, fm } from "./helpers.mjs";

const TODAY = new Date("2026-06-01");
const rules = async (files) => (await checkVault(await vault(files), { today: TODAY })).map((f) => `${f.level}:${f.rule}:${f.file}`);

test("a minimal valid vault has no findings", async () => {
  assert.deepEqual(await rules(MINIMAL), []);
});
test("missing required files are errors", async () => {
  const { ["personal/pending.md"]: _, ...rest } = MINIMAL;
  assert.deepEqual(await rules(rest), ["error:required-file:personal/pending.md"]);
});
test("notes without frontmatter are errors", async () => {
  assert.deepEqual(await rules({ ...MINIMAL, "personal/x.md": "# no fm\n" }), ["error:frontmatter-missing:personal/x.md"]);
});
test("scope must match the folder", async () => {
  assert.deepEqual(await rules({ ...MINIMAL, "work/checkout/a.md": ok("personal") }), ["error:scope-mismatch:work/checkout/a.md"]);
});
test("source must be stated, confirmed or verified", async () => {
  assert.deepEqual(await rules({ ...MINIMAL, "global/a.md": ok("global", { source: "guess" }) }), ["error:source-invalid:global/a.md"]);
});
test("updated must be an ISO date", async () => {
  assert.deepEqual(await rules({ ...MINIMAL, "global/a.md": ok("global", { updated: "last week" }) }), ["error:date-invalid:global/a.md"]);
});
test("required keys are enforced", async () => {
  const note = fm({ scope: "global", source: "stated", updated: "2026-01-15" });
  assert.deepEqual(await rules({ ...MINIMAL, "global/a.md": note }), ["error:frontmatter-key:global/a.md", "error:frontmatter-key:global/a.md"]);
});
test("private: false is allowed but warned", async () => {
  assert.deepEqual(await rules({ ...MINIMAL, "global/a.md": ok("global", { private: false }) }), ["warn:not-private:global/a.md"]);
});
test("past expires dates are stale warnings; future ones are fine", async () => {
  assert.deepEqual(await rules({ ...MINIMAL, "personal/g.md": ok("personal", { expires: "2026-03-01" }), "personal/h.md": ok("personal", { expires: "2026-12-01" }) }),
    ["warn:stale:personal/g.md"]);
});
test("empty work modules are errors (create only when content exists)", async () => {
  assert.deepEqual(await rules({ ...MINIMAL, "work/billing": null }), ["error:empty-module:work/billing"]);
});
test("unknown top-level folders are errors (three scopes only)", async () => {
  assert.deepEqual(await rules({ ...MINIMAL, "misc/a.md": ok("global") }), ["error:unknown-scope:misc/a.md"]);
});
