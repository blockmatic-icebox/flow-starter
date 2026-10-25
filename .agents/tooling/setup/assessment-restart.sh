#!/usr/bin/env bash
# Reset local assessment/product WIP, create a fresh branch, and run product adoption.
#
# Usage (from repository root):
#   bash .agents/tooling/setup/assessment-restart.sh
#   FLOW_ASSESSMENT_PROJECT_NAME="Meta CTO" FLOW_ASSESSMENT_BRANCH=meta-cto bash .agents/tooling/setup/assessment-restart.sh
#
# Requires: git, node, pnpm (for install step unless FLOW_ASSESSMENT_SKIP_INSTALL=1)

set -euo pipefail

die() {
  printf 'assessment-restart.sh: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "missing required command: $1"
}

find_repo_root() {
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "${dir}/AGENTS.md" && -d "${dir}/.agents" ]]; then
      printf '%s' "$dir"
      return
    fi
    dir="$(dirname "$dir")"
  done
  die "run from inside a Flow Factory repository (AGENTS.md not found)"
}

ROOT="$(find_repo_root)"
cd "$ROOT"

BASE_REF="${FLOW_ASSESSMENT_BASE_REF:-main}"
BRANCH="${FLOW_ASSESSMENT_BRANCH:-meta-cto}"
PROJECT_NAME="${FLOW_ASSESSMENT_PROJECT_NAME:-Meta CTO}"
SKIP_INSTALL="${FLOW_ASSESSMENT_SKIP_INSTALL:-0}"

ADOPTION_SCRIPT="${ROOT}/.agents/tooling/setup/product-adoption.mjs"

require_command git
require_command node

if ! git rev-parse --verify "${BASE_REF}" >/dev/null 2>&1; then
  die "base ref not found: ${BASE_REF}"
fi

printf 'Discarding unstaged changes and untracked assessment/product paths...\n'
git restore .
git clean -fd \
  -- docs \
  -- apps/web \
  -- packages \
  -- CLAUDE.md \
  -- prompts.txt \
  2>/dev/null || true

printf 'Checking out %s and creating branch %s...\n' "$BASE_REF" "$BRANCH"
git checkout "$BASE_REF"
git checkout -B "$BRANCH"

if [[ ! -f "$ADOPTION_SCRIPT" ]]; then
  printf 'Restoring product-adoption tooling from %s...\n' "$BASE_REF"
  git checkout "$BASE_REF" -- .agents/tooling/setup/product-adoption.mjs \
    .agents/tooling/setup/product-readme.template.md \
    2>/dev/null || die "product-adoption.mjs missing on ${BASE_REF}"
fi

SLUG="$(node "$ADOPTION_SCRIPT" slugify --project-name "$PROJECT_NAME")"

printf 'Running product adoption for "%s"...\n' "$PROJECT_NAME"
if ! node "$ADOPTION_SCRIPT" apply --root "$ROOT" --project-name "$PROJECT_NAME"; then
  die "product adoption failed"
fi

if [[ "$SKIP_INSTALL" != "1" ]]; then
  require_command pnpm
  printf 'Installing dependencies (pnpm install)...\n'
  pnpm install
fi

printf '\nAssessment restart complete.\n'
printf '  Branch: %s\n' "$BRANCH"
printf '  Project: %s\n' "$PROJECT_NAME"
printf '  Dev URL: https://%s.localhost (after pnpm dev)\n' "$SLUG"
printf '\nNext: paste the employer brief and begin Explore on this branch.\n'
