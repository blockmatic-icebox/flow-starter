#!/usr/bin/env bash
# Flow Factory — bootstrap a new project from the latest main branch.
#
# One-liner (copy/paste):
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/gaboesquivel/flow-factory/main/.agents/tooling/setup/install.sh)"
#
# Requires: git, bash 3.2+, node

set -euo pipefail

REPO_URL="${FLOW_FACTORY_SOURCE:-${FLOW_STARTER_SOURCE:-https://github.com/gaboesquivel/flow-factory.git}}"

PORTLESS_RESERVED=(
  run get alias hosts list doctor trust clean prune proxy service
)

slugify() {
  local input="$1"
  local slug
  slug="$(printf '%s' "$input" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')"
  slug="${slug#-}"
  slug="${slug%-}"
  printf '%s' "$slug"
}

is_reserved_portless_name() {
  local name="$1"
  local reserved
  for reserved in "${PORTLESS_RESERVED[@]}"; do
    if [[ "$name" == "$reserved" ]]; then
      return 0
    fi
  done
  return 1
}

die() {
  printf 'install.sh: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

run_install() {
  local project_name="$1"
  local slug
  slug="$(slugify "$project_name")"

  if [[ -z "${project_name// }" ]]; then
    die "project name cannot be empty"
  fi

  if printf '%s' "$project_name" | grep -q '[[:cntrl:]]'; then
    die "project name cannot contain control characters"
  fi

  if [[ -z "$slug" ]]; then
    die "project name must contain at least one letter or digit"
  fi

  if is_reserved_portless_name "$slug"; then
    die "slug \"$slug\" is reserved by portless; choose another project name"
  fi

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
