# Evals

Agent evaluation system for Supabase skills. Tests whether AI agents (starting
with Claude Code) correctly implement Supabase tasks when given access to skill
documentation.

## How It Works

Each eval is a self-contained project directory with a task prompt. The agent
works on it autonomously, then hidden vitest assertions check the result.
Binary pass/fail.

```
1. Create temp workspace from eval template
2. Agent (claude -p) reads prompt and creates files
3. Hidden EVAL.ts runs vitest assertions against the output
4. Pass/fail
```

## Usage

```bash
# Run all scenarios
mise run eval

# Run a specific scenario
EVAL_SCENARIO=auth-rls-new-project mise run eval

# Run with baseline comparison (with-skill vs without-skill)
EVAL_BASELINE=true mise run eval

# Override model
EVAL_MODEL=claude-opus-4-6 mise run eval
```

### Environment Variables

```
ANTHROPIC_API_KEY         Required: Claude Code authentication
EVAL_MODEL                Override model (default: claude-sonnet-4-5-20250929)
EVAL_SCENARIO             Run single scenario by name
EVAL_BASELINE=true        Run baseline comparison (no skill)
```

## Adding Scenarios

1. Create `evals/{name}/` with `PROMPT.md`, `EVAL.ts`, and starter files
2. Write vitest assertions in `EVAL.ts`
3. Document in `scenarios/SCENARIOS.md`

See [AGENTS.md](AGENTS.md) for full details.
