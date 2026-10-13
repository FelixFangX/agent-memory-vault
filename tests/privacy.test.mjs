import { test } from "node:test";
import assert from "node:assert/strict";
import { checkVault } from "../src/index.mjs";
import { vault, MINIMAL, ok } from "./helpers.mjs";

const scan = async (rel, body) => {
  const scope = rel.split("/")[0];
  const findings = await checkVault(await vault({ ...MINIMAL, [rel]: ok(scope) + body }), { today: new Date("2026-06-01") });
  return findings.filter((f) => f.file === rel);
};
const ids = async (rel, body) => (await scan(rel, body)).map((f) => f.rule);

test("API keys and tokens are errors", async () => {
  assert.deepEqual(await ids("work/a/n.md", "key sk-abcdefghijklmnopqrstuv12\n"), ["secret"]);
  assert.deepEqual(await ids("global/n.md", "ghp_abcdefghijklmnopqrstuvwxyz0123456789\n"), ["secret"]);
});
test("private key blocks and password lines are errors", async () => {
  assert.deepEqual(await ids("personal/n.md", "-----BEGIN OPENSSH PRIVATE KEY-----\n"), ["secret"]);
  assert.deepEqual(await ids("personal/n.md", "wifi password: hunter2hunter\n"), ["secret"]);
});
test("findings report the line but never echo the secret", async () => {
  const [f] = await scan("work/a/n.md", "x\nkey sk-abcdefghijklmnopqrstuv12\n");
  assert.ok(f.line > 0);
  assert.ok(!JSON.stringify(f).includes("abcdefghijklmnop"));
});
test("emails and phone numbers are flagged outside personal/, allowed inside", async () => {
  assert.deepEqual(await ids("work/a/n.md", "contact jane.doe@corp.example.com\n"), ["personal-data"]);
  assert.deepEqual(await ids("global/n.md", "call +1 415 555 0133\n"), ["personal-data"]);
  assert.deepEqual(await ids("personal/n.md", "me: alex@example.com\n"), []);
});
test("relationship info is flagged in every scope (English and Chinese)", async () => {
  assert.deepEqual(await ids("personal/n.md", "My girlfriend prefers mornings\n"), ["relationship"]);
  assert.deepEqual(await ids("personal/n.md", "老婆 周末加班\n"), ["relationship"]);
});
test("chat transcripts, model reasoning and tool configs are flagged", async () => {
  assert.deepEqual(await ids("work/a/n.md", "User: hi\nAssistant: hello\nUser: next\nAssistant: ok\n"), ["chat-log"]);
  assert.deepEqual(await ids("global/n.md", "<thinking>\nmaybe\n</thinking>\n"), ["model-reasoning"]);
  assert.deepEqual(await ids("global/n.md", '```json\n{ "mcpServers": { "fs": {} } }\n```\n'), ["tool-config"]);
});
test("a line can opt out of one rule with an allow comment", async () => {
  assert.deepEqual(await ids("work/a/n.md", "support@vendor.example.com <!-- vault-check:allow personal-data -->\n"), []);
});
test("ordinary prose is clean", async () => {
  assert.deepEqual(await ids("work/a/n.md", "Retries are idempotent via an order key. Partner APIs return 429 under load.\n"), []);
});
