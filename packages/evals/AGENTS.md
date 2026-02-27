# Evals — Agent Guide

This package evaluates whether AI agents correctly implement Supabase tasks
when using skill documentation. Built on
[@vercel/agent-eval](https://github.com/vercel/agent-eval): each eval is a
self-contained scenario with a task prompt, the agent works in a Docker sandbox,
and hidden vitest assertions check the result. Binary pass/fail.

## Architecture

```
1. eval.sh starts Supabase, exports keys
2. agent-eval reads experiments/experiment.ts
3. For each scenario:
   a. setup() resets DB, writes config + skills into Docker sandbox
   b. Agent (Claude Code) runs PROMPT.md in the sandbox
   c. EVAL.ts (vitest) asserts against agent output
4. Results saved to results/experiment/{timestamp}/{scenario}/run-{N}/
5. Optional: upload.ts pushes results to Braintrust
```

The agent is **Claude Code** running inside a Docker sandbox managed by
`@vercel/agent-eval`. It operates on a real filesystem and can read/write files
freely.

## File Structure

```
packages/evals/
  experiments/
    experiment.ts        # ExperimentConfig — agent, sandbox, setup() hook
  scripts/
    eval.sh              # Supabase lifecycle wrapper (start → eval → stop)
  src/
    upload.ts            # Standalone Braintrust result uploader
  evals/
    eval-utils.ts        # Shared helpers (findMigrationFiles, getMigrationSQL, etc.)
    {scenario}/
      PROMPT.md          # Task description (visible to agent)
      EVAL.ts            # Vitest assertions (hidden from agent during run)
      meta.ts            # expectedReferenceFiles for scoring
      package.json       # Minimal manifest with vitest devDep
  project/
    supabase/
      config.toml        # Shared Supabase config seeded into each sandbox
  scenarios/             # Workflow scenario proposals
  results/               # Output from eval runs (gitignored)
```

## Running Evals

```bash
# Run all scenarios with skills
mise run eval

# Force re-run (bypass source caching)
mise run --force eval

# Run a specific scenario
EVAL_SCENARIO=auth-rls-new-project mise run eval

# Override model
EVAL_MODEL=claude-opus-4-6 mise run eval

# Run without skills (baseline)
EVAL_BASELINE=true mise run eval

# Dry run (no API calls)
mise run eval:dry

# Upload results to Braintrust
mise run eval:upload
```

## Baseline Mode

Set `EVAL_BASELINE=true` to run scenarios **without** skills injected. By
default, skill files from `skills/supabase/` are written into the sandbox.

Compare with-skill vs baseline:

```bash
mise run eval                        # with skills
EVAL_BASELINE=true mise run eval     # without skills (baseline)
```

## Adding Scenarios

1. Create `evals/{scenario-name}/` with:
   - `PROMPT.md` — task description for the agent
   - `EVAL.ts` — vitest assertions checking agent output
   - `meta.ts` — export `expectedReferenceFiles` array for scoring
   - `package.json` — `{ "private": true, "type": "module", "devDependencies": { "vitest": "^2.0.0" } }`
2. Add any starter files the agent should see (they get copied via `setup()`)
3. Assertions use helpers from `../eval-utils.ts` (e.g., `findMigrationFiles`, `getMigrationSQL`)

## Environment

```
ANTHROPIC_API_KEY=sk-ant-...         # Required: Claude Code authentication
EVAL_MODEL=...                       # Optional: override model (default: claude-sonnet-4-6)
EVAL_SCENARIO=...                    # Optional: run single scenario
EVAL_BASELINE=true                   # Optional: run without skills
BRAINTRUST_API_KEY=...               # Required for eval:upload
BRAINTRUST_PROJECT_ID=...            # Required for eval:upload
```

## Docker Evals

Build and run evals inside Docker (e.g., for CI):

```bash
mise run eval:docker:build           # Build the eval Docker image
mise run eval:docker                 # Run evals in Docker
mise run eval:docker:shell           # Debug shell in eval container
```
