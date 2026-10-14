# AGENTS.md

- Test: `npm test && npm run check && npm run eval` (no dependencies; CI on Node 20 and 22).
- The skill: `skills/dev-work-bot-setup/SKILL.md`. Keep it generic: no names, tokens or internal URLs (`npm run check` enforces it; add `--denylist <file>` locally for private terms, never commit that file).
- Changing a safety rule? Update `evals/scenarios.json` in the same PR and regenerate `evals/results-coverage.json` with `node bin/skill-eval.mjs --out evals/results-coverage.json`.
- Seams: `src/check.mjs`, `src/evals.mjs` and the two CLIs in `bin/`. The LLM is a boundary; fake it in tests.
- Only publish eval numbers that came from a real run.
- Box environment: `scripts/setup-box.sh` (tool list) and `docs/box-environment.md` (table) must list the same tools and tiers. `skill-check` fails on drift. `--check` must never install anything or print token values.
