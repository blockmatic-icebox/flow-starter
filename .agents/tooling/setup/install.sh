#!/usr/bin/env bash
# Flow Factory — bootstrap a new project from the latest main branch.
#
# One-liner (copy/paste):
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/gaboesquivel/flow-factory/main/.agents/tooling/setup/install.sh)"
#
# Requires: git, bash 3.2+, node

set -euo pipefail

REPO_URL="${FLOW_FACTORY_SOURCE:-${FLOW_STARTER_SOURCE:-https://github.com/gaboesquivel/flow-factory.git}}"

die() {
  printf 'install.sh: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

resolve_adoption_script() {
  if [[ -n "${INSTALL_SCRIPT_DIR:-}" && -f "${INSTALL_SCRIPT_DIR}/product-adoption.mjs" ]]; then
    printf '%s' "${INSTALL_SCRIPT_DIR}/product-adoption.mjs"
    return
  fi
  if [[ -n "${BASH_SOURCE[0]:-}" && "${BASH_SOURCE[0]}" != bash ]]; then
    local dir
    dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [[ -f "${dir}/product-adoption.mjs" ]]; then
      printf '%s' "${dir}/product-adoption.mjs"
      return
    fi
  fi
  local tmp raw_base
  tmp="$(mktemp -t flow-product-adoption.mjs)"
  raw_base="${FLOW_FACTORY_RAW_BASE:-https://raw.githubusercontent.com/gaboesquivel/flow-factory/main}"
  if ! curl -fsSL "${raw_base}/.agents/tooling/setup/product-adoption.mjs" -o "$tmp"; then
    die "failed to fetch product-adoption.mjs"
  fi
  printf '%s' "$tmp"
}

validate_project_name() {
  local project_name="$1"
  local script json slug
  script="$(resolve_adoption_script)"
  if ! json="$(node "$script" validate --project-name "$project_name")"; then
    die "invalid project name"
  fi
  slug="$(printf '%s' "$json" | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s);process.stdout.write(j.slug);});')"
  if [[ -z "$slug" ]]; then
    die "product adoption validate returned empty slug"
  fi
  printf '%s' "$slug"
}

run_install() {
  local project_name="$1"
  local slug
  slug="$(validate_project_name "$project_name")"

  if [[ -e "$slug" ]]; then
    die "directory already exists: $slug"
  fi

  printf '\nCloning into %s ...\n' "$slug"
  git clone --depth 1 "$REPO_URL" "$slug"

  local root="$slug"
  cd "$root"

  if ! node .agents/tooling/setup/product-adoption.mjs apply \
    --root "$(pwd)" \
    --project-name "$project_name"; then
    die "product adoption failed"
  fi

  rm -rf .git
  if ! git init -b main >/dev/null 2>&1; then
    die "git init failed; configure user.name and user.email for git commits"
  fi
  if ! git add -A >/dev/null 2>&1; then
    die "git add failed"
  fi
  if ! git commit -m "Initial commit" >/dev/null 2>&1; then
    die "git commit failed; configure user.name and user.email for git commits"
  fi

  printf '\nDone. New project at ./%s\n\n' "$slug"
  printf 'Next steps:\n'
  printf '  cd %s\n' "$slug"
  printf '  pnpm setup        # install deps and env templates\n'
  printf '  pnpm setup:portless   # optional: HTTPS local URLs\n'
  printf '  pnpm dev          # https://%s.localhost\n' "$slug"
}

main() {
  require_command git
  require_command node

  local project_name="${FLOW_FACTORY_PROJECT_NAME:-${FLOW_STARTER_PROJECT_NAME:-}}"
  if [[ -z "$project_name" ]]; then
    printf 'Flow Factory install\n\n'
    printf 'Project name (used for the folder and https://<name>.localhost): '
    read -r project_name
  fi

  run_install "$project_name"
}

main "$@"
