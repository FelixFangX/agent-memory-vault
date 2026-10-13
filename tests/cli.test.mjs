import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { vault, MINIMAL } from "./helpers.mjs";

const bin = fileURLToPath(new URL("../bin/vault-check.mjs", import.meta.url));
const run = (...args) => spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });

test("exits 0 on a valid vault", async () => {
  assert.equal(run(await vault()).status, 0);
});
test("exits 1 and names the rule on errors", async () => {
  const { ["work/INDEX.md"]: _, ...rest } = MINIMAL;
  const r = run(await vault(rest));
  assert.equal(r.status, 1);
  assert.match(r.stdout, /required-file.*work\/INDEX\.md/);
});
test("--json prints machine-readable findings", async () => {
  const { ["work/INDEX.md"]: _, ...rest } = MINIMAL;
  const out = JSON.parse(run(await vault(rest), "--json").stdout);
  assert.equal(out[0].rule, "required-file");
});
test("the example vault in this repo passes", () => {
  assert.equal(run(fileURLToPath(new URL("../vault", import.meta.url))).status, 0);
});
