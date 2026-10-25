#!/usr/bin/env bash
# Flow Starter — bootstrap a new project from the latest main branch.
#
# One-liner (copy/paste):
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/gaboesquivel/flow-starter/main/.agents/tooling/setup/install.sh)"
#
# Requires: git, bash 3.2+, perl

set -euo pipefail

REPO_URL="${FLOW_STARTER_SOURCE:-https://github.com/gaboesquivel/flow-starter.git}"
INSTALL_SCRIPT_REL=".agents/tooling/setup/install.sh"
ASSESSMENT_HANDOFF=".agents/flow/operations/assessment-adoption.md"

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
  FROM="$from" TO="$to" perl -i -pe 's/\Q$ENV{FROM}\E/$ENV{TO}/g' "$file"
}

set_json_string_field() {
  local file="$1"
  local key="$2"
  local value="$3"
  if [[ ! -f "$file" ]]; then
    die "expected file missing after clone: $file"
  fi
  KEY="$key" VALUE="$value" perl -i -pe '
    if (/^\s*"$ENV{KEY}":\s*"/) {
      $_ = qq{  "$ENV{KEY}": "$ENV{VALUE}",\n};
    }
  ' "$file"
}

set_portless_name() {
  local file="$1"
  local name="$2"
  if [[ ! -f "$file" ]]; then
    die "expected file missing after clone: $file"
  fi
  NAME="$name" perl -i -0777 -pe '
    s/("portless":\s*\{[^}]*"name":\s*")[^"]+(")/$1.$ENV{NAME}.$2/s
  ' "$file"
}

run_install() {
  local project_name="$1"
  local slug
  slug="$(slugify "$project_name")"

  if [[ -z "${project_name// }" ]]; then
    die "project name cannot be empty"
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

  rm -rf .agents/eval/fixtures/assessments
  rm -f "$ASSESSMENT_HANDOFF"
  rm -f "$INSTALL_SCRIPT_REL"
  rm -f .agents/tooling/setup/install.test.mjs
  rm -f .agents/eval/src/assessment/run.test.ts
  rm -f CLAUDE.md
  rm -f docs/adr/0002-feature-intelligence-product.md
  rm -f docs/initiatives/feature-intelligence.md

  local host_from="web.localhost"
  local host_to="${slug}.localhost"

  replace_in_file "apps/web/next.config.ts" "$host_from" "$host_to"
  replace_in_file "apps/web/AGENTS.md" "$host_from" "$host_to"

  if [[ "$(uname -s)" == "Darwin" ]]; then
    sed -i '' "s/^# Project Name$/# ${project_name}/" README.md
  else
    sed -i "s/^# Project Name$/# ${project_name}/" README.md
  fi

  set_json_string_field "package.json" "name" "$slug"
  set_portless_name "apps/web/package.json" "$slug"

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
  printf '  pnpm dev          # https://%s\n' "$host_to"
}

main() {
  require_command git
  require_command perl

  local project_name="${FLOW_STARTER_PROJECT_NAME:-}"
  if [[ -z "$project_name" ]]; then
    printf 'Flow Starter install\n\n'
    printf 'Project name (used for the folder and https://<name>.localhost): '
    read -r project_name
  fi

  run_install "$project_name"
}

main "$@"
