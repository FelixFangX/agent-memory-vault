# Conventions

## Scopes

| Folder | Holds | Never holds |
|---|---|---|
| `global/` | Cross-context collaboration, decision and privacy principles | Anything about a specific person or project |
| `personal/` | Profile, goals & rhythm, pending-confirmation list | Work details, secrets, relationship info |
| `work/` | `INDEX.md` + one folder per **real** business module | Personal info, empty placeholder modules |

## Frontmatter

Every note except `AGENTS.md`, `README.md` and `INDEX.md` starts with:

```yaml
---
scope: personal          # global | personal | work (must match the folder)
type: profile            # free text: principle, profile, goal, pending, module, decision…
source: stated           # stated (self-report) | confirmed (agent proposed, human confirmed) | verified (checked against an artefact)
updated: 2026-01-15      # ISO date of last meaningful change
expires: 2026-04-01      # optional: when this fact should be re-checked
private: true            # default; set false only for notes you would publish
---
```

## Store / never store

**Store:** facts the human stated or confirmed, decisions with their reason, preferences that change how the agent should work, open questions.

**Never store:** secrets, tokens or passwords; tool or agent configuration; model reasoning or chain-of-thought; full chat transcripts; unconfirmed guesses (put them in the pending list); information about the human's relationships or other people's private lives.

## Injection

Minimal per request: `global/principles.md` plus the one scope the request is about. Never personal into work.

## Review (optional)

Every ~3 days, or when something changed: resolve pending items, refresh `expires`, delete notes that stopped being useful. Skip the review when nothing changed.

## Checker rules (privacy)

| Rule | Flags | Where |
|---|---|---|
| `secret` | API keys/tokens (sk-, ghp_, xox*-, AKIA…), private key blocks, JWTs, `password:`-style lines | everywhere |
| `personal-data` | email addresses, phone numbers | outside `personal/` |
| `relationship` | partner/spouse/dating terms (EN + 中文) | everywhere |
| `chat-log` | ≥2 user and ≥2 assistant turns in one note | everywhere |
| `model-reasoning` | `<thinking>`-style blocks, "chain of thought:" | everywhere |
| `tool-config` | `mcpServers`, `alwaysApply`, `allowedTools`… | everywhere |

These are heuristics. To accept a false positive on one line, append `<!-- vault-check:allow <rule> -->`. Findings report file and line, never the matched value.
