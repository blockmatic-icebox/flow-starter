#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PLAYWRIGHT_PORT:-3199}"
export GENUI_FIXTURE_LAB=1
exec pnpm exec next dev -p "$PORT"
