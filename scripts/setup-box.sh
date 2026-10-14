#!/usr/bin/env bash
# Set up (or check) the bot's Linux box for the dev-work skill.
#   scripts/setup-box.sh          install what's missing (idempotent; safe to re-run)
#   scripts/setup-box.sh --check  report only, change nothing; exit 1 if a required tool is missing
#   add --json for machine-readable output
# Never logs in for you and never prints secret values. Logins: docs/box-environment.md.
set -uo pipefail

CHECK=0; JSON=0
for a in "$@"; do
  case "$a" in
    --check) CHECK=1 ;;
    --json) JSON=1 ;;
    -h|--help) sed -n '2,6p' "$0"; exit 0 ;;
    *) echo "unknown option: $a" >&2; exit 2 ;;
  esac
done

SECRETS_DIR="${DEV_WORK_SECRETS_DIR:-$HOME/.config/dev-work}"

# TOOLS: name|tier|install. Keep in sync with the table in docs/box-environment.md (a test enforces it).
TOOLS=(
  "git|required|apt:git"
  "gh|required|apt:gh"
  "node|required|apt:nodejs"
  "npm|required|apt:npm"
  "python3|required|apt:python3"
  "curl|required|apt:curl"
  "jq|required|apt:jq"
  "rg|required|apt:ripgrep"
  "pnpm|optional|npm:pnpm"
  "uv|optional|skip"
  "lark-cli|optional|npm:@larksuite/cli"
  "supabase|optional|npx"
  "google-chrome|optional|skip"
  "pdftotext|optional|apt:poppler-utils"
  "ffmpeg|optional|apt:ffmpeg"
)

SUDO=""; [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null && sudo -n true 2>/dev/null && SUDO="sudo -n"
APT_UPDATED=0

version_of() {
  case "$1" in
    supabase) npx -y supabase@latest --version 2>/dev/null | tail -1 ;;
    pdftotext) pdftotext -v 2>&1 | head -1 ;;
    ffmpeg) ffmpeg -version 2>/dev/null | head -1 | cut -d' ' -f1-3 ;;
    curl) curl --version 2>/dev/null | head -1 | cut -d' ' -f1-2 ;;
    *) "$1" --version 2>/dev/null | head -1 ;;
  esac
}

present() {
  if [ "$1" = supabase ]; then command -v supabase >/dev/null || command -v npx >/dev/null; else command -v "$1" >/dev/null; fi
}

install() {
  local how="$2"
  case "$how" in
    apt:*)
      [ -n "$SUDO" ] || [ "$(id -u)" -eq 0 ] || { echo "  no sudo; install ${how#apt:} manually" >&2; return 1; }
      [ $APT_UPDATED -eq 1 ] || { $SUDO apt-get update -qq >/dev/null; APT_UPDATED=1; }
      $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${how#apt:}" >/dev/null ;;
    npm:*)
      mkdir -p "$HOME/.local"
      npm install -g --silent --prefix "$HOME/.local" "${how#npm:}" >/dev/null ;;
    npx|skip) return 0 ;;
  esac
}

missing_required=0
rows=()
for row in "${TOOLS[@]}"; do
  IFS='|' read -r name tier how <<<"$row"
  if ! present "$name" && [ $CHECK -eq 0 ]; then install "$name" "$how" || true; fi
  if present "$name"; then status=ok; ver="$(version_of "$name")"; else status=missing; ver=""; [ "$tier" = required ] && missing_required=1; fi
  rows+=("$name|$tier|$status|$ver")
done

# Auth: report signed-in or not, never token values.
gh_auth=no; gh auth status >/dev/null 2>&1 && gh_auth=yes
gh_scopes=""; [ $gh_auth = yes ] && gh_scopes="$(gh api -i user 2>/dev/null | tr -d '\r' | sed -n 's/^[Xx]-[Oo]auth-[Ss]copes: //p')"
lark_auth=n/a; command -v lark-cli >/dev/null && { lark-cli auth status >/dev/null 2>&1 && lark_auth=yes || lark_auth=no; }
git_identity=no; git config --global user.name >/dev/null && git config --global user.email >/dev/null && git_identity=yes
secrets=absent
if [ -d "$SECRETS_DIR" ]; then
  secrets=ok
  [ "$(stat -c %a "$SECRETS_DIR")" = 700 ] || secrets=loose
  for f in "$SECRETS_DIR"/*.env; do [ -e "$f" ] && [ "$(stat -c %a "$f")" != 600 ] && secrets=loose; done
fi
if [ $CHECK -eq 0 ] && [ ! -d "$SECRETS_DIR" ]; then install -d -m 700 "$SECRETS_DIR"; secrets=ok; fi

if [ $JSON -eq 1 ]; then
  printf '{"tools":['
  sep=""; for r in "${rows[@]}"; do IFS='|' read -r n t s v <<<"$r"
    printf '%s{"name":"%s","tier":"%s","status":"%s","version":%s}' "$sep" "$n" "$t" "$s" "$(printf '%s' "$v" | jq -Rs .)"; sep=","; done
  printf '],"auth":{"gh":"%s","ghScopes":"%s","lark":"%s","gitIdentity":"%s","secretsDir":"%s"},"ok":%s}\n' \
    "$gh_auth" "$gh_scopes" "$lark_auth" "$git_identity" "$secrets" "$([ $missing_required -eq 0 ] && echo true || echo false)"
else
  for r in "${rows[@]}"; do IFS='|' read -r n t s v <<<"$r"; printf '%-14s %-9s %-8s %s\n' "$n" "$t" "$s" "$v"; done
  echo "auth: gh=$gh_auth (scopes: ${gh_scopes:-none}) lark=$lark_auth git-identity=$git_identity secrets-dir=$secrets"
  [ $missing_required -eq 0 ] && echo "ok: all required tools present" || echo "missing required tools; see docs/box-environment.md"
fi
exit $missing_required
