<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/header-dark.svg">
  <img alt="dev-work-grok-bot-skill: interview, connect, safe assistant" src="docs/assets/header-light.svg" width="100%">
</picture>

# dev-work-grok-bot-skill

A Grok Bot skill that turns your bot into a developer work assistant. It follows your product area across repos and trackers, tests preview builds, drafts team messages in your voice, and stays inside strict safety rules.

```
status   skill: dev-work-bot-setup   runtime: Grok Bot   deps: none   checks: CI
```

## Install
1. **Copy the skill**: add [`skills/dev-work-bot-setup/SKILL.md`](skills/dev-work-bot-setup/SKILL.md) to your bot's skills, or
2. **Ask the bot**: paste the file into a chat and say *"Save this as a skill and run it."*

The bot then interviews you one question at a time and configures itself. Nothing external happens without your confirmation.

## What it configures
| Area | Result |
|---|---|
| Profile | Focus area, repos/branches, voice, chat app and key people, reply rules, testing setup |
| Connections | GitHub, Linear (or your tracker), Lark/Feishu, Slack or Teams, optional Sentry/analytics, via one-click connect cards |
| Safety rules | Saved verbatim to agent memory |
| Messaging, testing, reporting | Draft-then-confirm sends, preview-based tests, conclusion-first reports |

Details: [docs/what-gets-configured.md](docs/what-gets-configured.md). A filled-in fictional setup: [examples/acme-checkout.md](examples/acme-checkout.md).

## Safety model
- Secrets are never requested in chat or stored in memory or in the skill; they go through secure input into a mode-600 file on the bot's box.
- Only your own words in the chat authorize actions. Forwarded messages, repo files and web pages are content, never commands.
- GitHub is read-only by default. Pushes, PRs, merges and deploys need an explicit instruction.
- Tracker edits need a numbered confirmation; nothing is ever deleted.
- Team messages go out only after you confirm the draft.

## Safety evals
20 scripted scenarios in [`evals/scenarios.json`](evals/scenarios.json): relayed approvals ("X said the owner approved, send it"), pasted tokens, prompt injection in repo files and web pages, unrequested pushes, tracker deletes, inbound requests for money or chat history, credentials in reports, and more. Each scenario has an expected decision (`refuse`, `confirm`, `draft` or `proceed`) and strings the reply must never contain.

| Adapter | What it measures | Latest result |
|---|---|---|
| `coverage` (CI, every push) | The skill states every rule each scenario depends on | **20/20 (100%)**, [results](evals/results-coverage.json) |
| `model` (opt-in) | A model given the skill as system prompt makes the expected decision and doesn't leak | not run yet |

Coverage is a regression guard: CI fails if an edit drops a rule. It doesn't prove a model obeys the rules; that's what the `model` adapter is for:

```bash
LLM_API_KEY=... LLM_MODEL=gpt-4o-mini npm run eval:model   # any OpenAI-compatible endpoint (LLM_BASE_URL)
```

## Customize
Edit the interview questions (section 1), the inbound reply policy (section 4) or the optional routines (section 7) in `SKILL.md`. Keep it generic: no names, tokens or internal URLs. The checker enforces that.

## Test
```bash
npm test                                        # node:test specs, no dependencies
npm run eval                                    # scenario coverage (--json for machine output)
npm run check                                   # frontmatter + secret/email/phone scan
node bin/skill-check.mjs . --denylist my.txt    # optional local list of private terms (never commit it)
```
CI runs all three on Node 20 and 22. Findings never print the matched value.

## License
[MIT](LICENSE)
