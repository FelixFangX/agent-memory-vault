# AGENTS.md: how to use this memory vault

You are reading a personal-memory vault. Follow these rules exactly.

## Read
1. Load only the scopes the request needs:
   - Always: `global/principles.md`.
   - Personal requests: `personal/*`.
   - Work requests: `work/INDEX.md`, then only the module folders it points to.
2. **Never** inject `personal/` into a work request, or `work/` into a personal one.
3. Treat `source: stated` as self-report and `source: verified` as checked fact. Prefer verified facts when they conflict.
4. If a note's `expires` date has passed, treat the note as stale: ask before relying on it.

## Write
- Store only facts the human **stated** or **confirmed**. Guesses go to `personal/pending.md` (or a module's open questions) as questions, not facts.
- Date time-sensitive facts (`expires:`).
- Never store: secrets or credentials, tool or agent configs, your own reasoning, full chat logs, unconfirmed guesses, or information about other people's relationships.
- Create a work module folder only when you have real content for it, and add it to `work/INDEX.md`.
- Update only when it's useful. Small edits beat rewrites. Bump `updated:`.

## Check
Run `node bin/vault-check.mjs vault` before committing. Fix every error.

See `../CONVENTIONS.md` for the full frontmatter spec.
