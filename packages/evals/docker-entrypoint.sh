#!/usr/bin/env bash
# Entrypoint for the eval Docker container.
# Validates environment, adds mocks to PATH, then runs the given command.
set -euo pipefail

export IN_DOCKER=true

# Validate required env
if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "ERROR: ANTHROPIC_API_KEY is not set." >&2
  echo "Pass it via: docker run -e ANTHROPIC_API_KEY=sk-ant-... ..." >&2
  exit 1
fi

# Prepend mocks directory to PATH so mock supabase/docker/psql are found first
export PATH="/app/packages/evals/mocks:${PATH}"

echo "=== Eval Environment ==="
echo "  Node:    $(node --version)"
echo "  Claude:  $(claude --version 2>/dev/null || echo 'n/a')"
echo "  Docker:  mock"
echo "  Model:   ${EVAL_MODEL:-default}"
echo "  Scenario: ${EVAL_SCENARIO:-all}"
echo "========================"

exec "$@"
