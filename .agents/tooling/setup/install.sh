#!/usr/bin/env bash
# Flow Starter — bootstrap a new project from the latest main branch.
#
# One-liner (copy/paste):
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/gaboesquivel/flow-starter/main/scripts/install.sh)"
#
# Requires: git, bash 3.2+

set -euo pipefail

REPO_URL="https://github.com/gaboesquivel/flow-starter.git"
INSTALL_SCRIPT_REL="scripts/install.sh"

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

replace_in_file() {
  local file="$1"
  local from="$2"
  local to="$3"
  if [[ ! -f "$file" ]]; then
    die "expected file missing after clone: $file"
  fi
  if ! command -v perl >/dev/null 2>&1; then
    die "perl is required for safe text replacement"
  fi
  FROM="$from" TO="$to" perl -i -pe 's/\Q$ENV{FROM}\E/$ENV{TO}/g' "$file"
}

main() {
  require_command git
  require_command sed

  printf 'Flow Starter install\n\n'
  printf 'Project name (used for the folder and https://<name>.localhost): '
  local project_name
  read -r project_name

  if [[ -z "${project_name// }" ]]; then
    die "project name cannot be empty"
  fi

  local slug
  slug="$(slugify "$project_name")"
  if [[ -z "$slug" ]]; then
    die "project name must contain at least one letter or digit"
  fi

  if [[ "$slug" == "flow" ]]; then
    die 'slug "flow" is reserved (conflicts with the Flow agent app at flow.localhost)'
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

  rm -f "$INSTALL_SCRIPT_REL"

  local host_from="web.localhost"
  local host_to="${slug}.localhost"

  replace_in_file "apps/web/next.config.ts" "$host_from" "$host_to"
  replace_in_file "apps/web/AGENTS.md" "$host_from" "$host_to"
  replace_in_file ".agents/flow/operations/verification.md" "$host_from" "$host_to"
  replace_in_file ".agents/flow/factory.md" "$host_from" "$host_to"
  replace_in_file "apps/flow/app/_lib/flow-agent/knowledge-snapshot.ts" "$host_from" "$host_to"

  if [[ "$(uname -s)" == "Darwin" ]]; then
    sed -i '' "s/^# Project Name$/# ${project_name}/" README.md
    sed -i '' 's/^  "name": "flow",$/  "name": "'"${slug}"'",/' package.json
    sed -i '' '/"portless": {/,/}/ s/"name": "web"/"name": "'"${slug}"'"/' apps/web/package.json
  else
    sed -i "s/^# Project Name$/# ${project_name}/" README.md
    sed -i 's/^  "name": "flow",$/  "name": "'"${slug}"'",/' package.json
    sed -i '/"portless": {/,/}/ s/"name": "web"/"name": "'"${slug}"'"/' apps/web/package.json
  fi

  rm -rf .git
  git init -b main
  git add -A
  git commit -m "Initial commit"

  printf '\nDone. New project at ./%s\n\n' "$slug"
  printf 'Next steps:\n'
  printf '  cd %s\n' "$slug"
  printf '  pnpm setup        # install deps and env templates\n'
  printf '  pnpm setup:portless   # optional: HTTPS local URLs\n'
  printf '  pnpm dev          # https://%s\n' "$host_to"
  printf '  pnpm dev:flow     # https://flow.localhost (Flow agent app)\n'
}

main "$@"
