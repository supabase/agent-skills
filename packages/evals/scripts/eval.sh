#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EVALS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_DIR="$EVALS_DIR/project"

# ---------------------------------------------------------------------------
# Parse CLI arguments
# ---------------------------------------------------------------------------

AGENT_EVAL_ARGS=()
UPLOAD=true  # Always upload to Braintrust by default

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill)
      export EVAL_SKILL="$2"
      shift 2
      ;;
    --scenario)
      export EVAL_SCENARIO="$2"
      shift 2
      ;;
    *)
      AGENT_EVAL_ARGS+=("$1")
      shift
      ;;
  esac
done

echo "Starting Supabase..."
supabase start --exclude studio,imgproxy,mailpit --workdir "$PROJECT_DIR"

# Export keys so experiment.ts and vitest assertions can connect
eval "$(supabase status --output json --workdir "$PROJECT_DIR" | \
  node -e "
    const s = JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));
    console.log('export SUPABASE_URL=' + (s.API_URL || 'http://127.0.0.1:54321'));
    console.log('export SUPABASE_ANON_KEY=' + s.ANON_KEY);
    console.log('export SUPABASE_SERVICE_ROLE_KEY=' + s.SERVICE_ROLE_KEY);
    console.log('export SUPABASE_DB_URL=' + (s.DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'));
  ")"

trap 'echo "Stopping Supabase..."; supabase stop --no-backup --workdir "$PROJECT_DIR"' EXIT

echo "Running agent-eval..."
cd "$EVALS_DIR"
npx agent-eval "${AGENT_EVAL_ARGS[@]+"${AGENT_EVAL_ARGS[@]}"}"

# Upload results to Braintrust (default: true, skip with --no-upload)
if [ "$UPLOAD" = "true" ]; then
  echo "Uploading results to Braintrust..."
  npx tsx src/upload.ts
fi
