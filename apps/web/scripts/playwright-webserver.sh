#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PLAYWRIGHT_PORT:-3198}"
mkdir -p .data
export FEATURE_DATA_PATH="${FEATURE_DATA_PATH:-$(pwd)/.data/playwright-feature-store.json}"
# Browser tests assert fixture triage; live AI is covered in route unit tests with .env.local.
export AI_GATEWAY_API_KEY=""
export ANTHROPIC_API_KEY=""
exec pnpm exec next dev -p "$PORT"
