# Evals — Agent Guide

This package evaluates whether AI agents correctly implement Supabase tasks
when using skill documentation. Modeled after
[Vercel's next-evals-oss](https://github.com/vercel-labs/next-evals-oss): each
eval is a self-contained project with a task prompt, the agent works on it, and
hidden tests check the result. Binary pass/fail.

## Architecture

```
1. Create temp dir with project skeleton (PROMPT.md, supabase/ dir)
2. Install skills via `skills add` CLI (or skip for baseline)
3. Run: claude -p "prompt" --cwd /tmp/eval-xxx
4. Agent reads skill, creates migrations/code in the workspace
5. Copy hidden EVAL.ts into workspace, run vitest
6. Capture pass/fail
```

The agent is **Claude Code** invoked via `claude -p` (print mode). It operates
on a real filesystem in a temp directory and can read/write files freely.

**Important**: MCP servers are disabled via `--strict-mcp-config` with an empty
config. This ensures the agent uses only local tools (Bash, Edit, Write, Read,
Glob, Grep) and cannot access remote services like Supabase MCP or Neon. All
work must happen on the local filesystem — e.g., creating migration files in
`supabase/migrations/`, not applying them to a remote project.

## Eval Structure

Each eval lives in `evals/{scenario-name}/`:

```
evals/auth-rls-new-project/
  PROMPT.md          # Task description (visible to agent)
  EVAL.ts            # Vitest assertions (hidden from agent during run)
  package.json       # Minimal project manifest
  supabase/
    config.toml      # Pre-initialized supabase config
    migrations/      # Empty — agent creates files here
```

**EVAL.ts** is never copied to the workspace until after the agent finishes.
This prevents the agent from "teaching to the test."

## Running Evals

```bash
# Run all scenarios with skills (default)
mise run eval

# Run a specific scenario
EVAL_SCENARIO=auth-rls-new-project mise run eval

# Override model
EVAL_MODEL=claude-opus-4-6 mise run eval

# Run without skills (baseline)
EVAL_BASELINE=true mise run eval

# Install only a specific skill
EVAL_SKILL=supabase mise run eval

# Upload results to Braintrust
mise run eval:upload
```

Or directly:

```bash
cd packages/evals
npx tsx src/runner.ts

# Single scenario, baseline mode
EVAL_BASELINE=true EVAL_SCENARIO=auth-rls-new-project npx tsx src/runner.ts
```

## Baseline Mode

Set `EVAL_BASELINE=true` to run scenarios **without** skills. By default,
scenarios run with skills installed via the `skills` CLI.

To compare with-skill vs baseline, run evals twice:

```bash
mise run eval                        # with skills
EVAL_BASELINE=true mise run eval     # without skills (baseline)
```

Compare the results to measure how much skills improve agent output.

## Adding Scenarios

1. Create `evals/{scenario-name}/` with `PROMPT.md`, `EVAL.ts`, `package.json`
2. Add any starter files the agent should see (e.g., `supabase/config.toml`)
3. Write vitest assertions in `EVAL.ts` that check the agent's output files
4. Document the scenario in `scenarios/SCENARIOS.md`

## Environment

```
ANTHROPIC_API_KEY=sk-ant-...    # Required: Claude Code authentication
EVAL_MODEL=...                  # Optional: override model (default: claude-sonnet-4-5-20250929)
EVAL_SCENARIO=...               # Optional: run single scenario
EVAL_SKILL=...                  # Optional: install only this skill (e.g., "supabase")
EVAL_BASELINE=true              # Optional: run without skills (baseline mode)
BRAINTRUST_UPLOAD=true          # Optional: upload results to Braintrust
```

## Key Files

```
src/
  runner.ts              # Main orchestrator
  types.ts               # Core interfaces
  runner/
    scaffold.ts          # Creates temp workspace from eval template
    agent.ts             # Invokes claude -p as subprocess
    test.ts              # Runs vitest EVAL.ts against workspace
    results.ts           # Collects results and prints summary
evals/
  auth-rls-new-project/  # Scenario 1
scenarios/
  SCENARIOS.md           # Scenario descriptions
```
