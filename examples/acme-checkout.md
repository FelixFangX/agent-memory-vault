# Example: filled-in configuration (fictional)

Everything here is invented: Acme Widgets, its people, repos and URLs do not exist. Use it to see what the interview in `SKILL.md` produces.

## 1. Interview answers (saved to agent memory)
| Question | Answer |
|---|---|
| Focus area | Checkout redesign; done when tracker issue `CHK-100` and its sub-issues are closed |
| Repos and branches | `acme/web-app` (frontend), `acme/payments-api` (backend); integration branch `checkout-v2`; previews come from PRs against `checkout-v2` |
| Voice | English, short, plain; reports as 3-6 key bullets |
| Team chat app | Slack, signature line `— Sam (via bot)` |
| Key people | Priya Rao (eng lead): open with one context line. Leo Martins (designer): include screenshots |
| Silent bots | `deploy-bot`, `ci-notify` |
| Testing | Preview URL `https://web-app-git-<branch>-acme.example.app`; API tests for payments, UI clicks for the cart flow; bypass secret entered via secure input only |

## 2. Connections
- GitHub: `acme/web-app`, `acme/payments-api` (read-only by default)
- Linear: team `CHK`
- Slack: connector, posting only after a confirmed draft
- Optional: Sentry project `web-app`

Credentials file on the box (values never shown): `~/.config/sam-secrets/preview.env`, mode 600.

## 3. Example draft (sent only after Sam confirms)
> Priya, context: cart totals were off by one cent on the preview.
> Fixed in the `checkout-v2` preview; API tests pass (12/12). UI pass on mobile still pending.
> — Sam (via bot)

## 4. Optional routines accepted
- Daily end-of-day summary at 18:00 local time.
