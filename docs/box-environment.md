# Box environment

The bot works on its own Linux box (Debian-like, x86_64). The skill assumes the tools below. Run `scripts/setup-box.sh --check` to see what's there, and `scripts/setup-box.sh` to install what's missing. Both are safe to re-run. Neither one logs in for you or prints a secret.

## Tools

| Tool | Tier | Why the skill needs it |
|---|---|---|
| `git` | required | Clone repos, read diffs and history for reviews and reports |
| `gh` | required | PRs, CI checks, issues and preview links from the shell |
| `node` | required | Run project tests and this repo's checks (Node 20+) |
| `npm` | required | Install project deps and npm-based CLIs |
| `python3` | required | Scripted API tests and data checks |
| `curl` | required | API tests against PR previews |
| `jq` | required | Read JSON from APIs, `gh` and CLIs |
| `rg` | required | Fast code search across repos |
| `pnpm` | optional | Projects that use pnpm lockfiles |
| `uv` | optional | Python projects managed with uv |
| `lark-cli` | optional | Lark/Feishu messages, docs and calendars when no connector is available |
| `supabase` | optional | Edge function logs and deploys (runs via `npx supabase`) |
| `google-chrome` | optional | UI checks of preview builds in the box browser |
| `pdftotext` | optional | Read PDF specs and attachments (poppler-utils) |
| `ffmpeg` | optional | Trim or convert screen recordings for bug reports |

`--check` exits 1 only if a **required** tool is missing. Optional tools are reported but never block. Installs use apt (with passwordless sudo) or `npm -g --prefix ~/.local`. Tools the script can't install, like `uv` and Chrome, are reported for manual setup.

## Auth (the owner signs in; the bot never sees a secret in chat)

| Service | How to sign in on the box | Check |
|---|---|---|
| GitHub (`gh`) | `gh auth login --web --scopes repo,read:org,workflow`. The owner enters the device code in the browser. | `gh auth status` |
| git identity | `git config --global user.name "<name>"` and `user.email` set to the code host's no-reply address | `git config --global user.email` |
| Lark/Feishu (`lark-cli`) | `lark-cli config init --app-secret-stdin` (app secret via secure input), then `lark-cli auth login` (device flow) | `lark-cli auth status` |
| Supabase | `npx supabase login` (browser), or a personal access token saved as `SUPABASE_ACCESS_TOKEN` in the secrets file | `npx supabase projects list` |
| Other API keys | Entered by the owner via secure input into the secrets file | `--check` reports file modes only |

Secrets file: `~/.config/dev-work/*.env` (override with `DEV_WORK_SECRETS_DIR`). The directory is mode 700 and each file is mode 600. The script creates the directory, and `--check` reports `secrets-dir=loose` if the modes are wrong. Load a file with `set -a; . ~/.config/dev-work/<name>.env; set +a` right before the command that needs it. Never `cat` it, echo it, or paste values into chat, memory, commits or the skill.

`--check` reports whether each login is present (`gh=yes`, the GitHub scope names, `lark=yes`) and never prints token values.
