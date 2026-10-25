#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PLAYWRIGHT_PORT:-3198}"
mkdir -p .data
export FEATURE_DATA_PATH="${FEATURE_DATA_PATH:-$(pwd)/.data/playwright-feature-store.json}"
exec pnpm exec next dev -p "$PORT"
