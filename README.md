<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./docs/assets/header-dark.svg">
  <img alt="agent-memory-vault: portable, private, correctable memory for any agent. Flow: you confirm → vault → agent context." src="./docs/assets/header-light.svg" width="100%">
</picture>

**A structure-only template for a personal-memory vault that any AI agent can read and write.** Plain Markdown, model-agnostic, Obsidian-friendly and local-first, plus a zero-dependency checker that keeps secrets, guesses and personal data out.

## Why

Vendor memory is tied to one model, you can't see it, and it mixes contexts. This vault is:

- **Portable:** Markdown + frontmatter. Works with Claude Code, Codex, Cursor or any MCP filesystem server.
- **Private:** local files, `private: true` by default, no secrets, no relationship info, personal context never injected into work.
- **Correctable:** every fact says whether it was *stated*, *confirmed* or *verified*, and when.

## Quickstart

```bash
gh repo create my-vault --private --template FelixFangX/agent-memory-vault --clone
cd my-vault
npm run check            # validate the example vault
```

Then replace the invented example notes in `vault/` with your own, and point your agent at `vault/AGENTS.md`:

```text
# in your agent's instructions (CLAUDE.md / AGENTS.md / rules)
Memory lives in ./vault. Read vault/AGENTS.md first and follow it.
```

## Layout

```text
vault/
├── AGENTS.md                 # read/write rules for agents
├── global/principles.md      # collaboration, decision, privacy principles
├── personal/
│   ├── profile.md
│   ├── goals-and-rhythm.md
│   └── pending.md            # questions waiting for confirmation, never treated as fact
└── work/
    ├── INDEX.md              # one row per real business module
    └── checkout/overview.md  # modules exist only when they have content
```

Frontmatter on every note (full spec in [CONVENTIONS.md](./CONVENTIONS.md)):

```yaml
---
scope: personal        # global | personal | work, must match the folder
type: profile
source: stated         # stated (self-report) | confirmed | verified
updated: 2026-01-15
expires: 2026-04-01    # optional: re-check after this date
private: true
---
```

## The checker

```bash
node bin/vault-check.mjs vault          # human-readable, exit 1 on errors
node bin/vault-check.mjs vault --json   # machine-readable findings
```

| Kind | Rules |
|---|---|
| Structure | required files, three scopes only, scope matches folder, `source` enum, ISO dates, no empty work modules, stale `expires` (warn), `private: false` (warn) |
| Privacy | secrets and keys, emails/phones outside `personal/`, relationship info, pasted chat logs, model reasoning, tool configs |

Findings name the rule, file and line, **never the matched value**. Accept a false positive with `<!-- vault-check:allow <rule> -->` on that line.

**Seam:** `checkVault(dir) → Finding[]` in `src/check.mjs`. Line rules plug in through `registerLineRules` (see `src/privacy.mjs`), so adding a rule doesn't touch the walker.

## Testing

```bash
npm test     # node:test, temp-dir fixtures at the checkVault + CLI seam
```

CI runs the tests and checks the example vault on Node 20 and 22.

## License

[MIT](./LICENSE). The example notes are invented; this repo contains no real personal data.
