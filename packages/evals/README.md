# Evals

LLM evaluation system for Supabase agent skills, powered by [Braintrust](https://www.braintrust.dev/). Tests whether models can correctly apply Supabase best practices using skill documentation as context.

## How It Works

Each eval follows a two-step **LLM-as-judge** pattern orchestrated by Braintrust's `Eval()`:

1. **Generate** — The eval model (e.g. Sonnet 4.5) receives a prompt with skill context and produces a code fix.
2. **Judge** — Three independent scorers using a stronger model (Opus 4.6 by default) evaluate the fix via the Vercel AI SDK with structured output.

Test cases are extracted automatically from skill reference files (`skills/*/references/*.md`). Each file contains paired **Incorrect** / **Correct** code blocks — the model receives the bad code and must produce the fix.

**Scoring dimensions (each 0–1):**

| Scorer | Description |
|--------|-------------|
| Correctness | Does the fix address the core issue? |
| Completeness | Does it include all necessary changes? |
| Best Practice | Does it follow Supabase best practices? |

## Usage

```bash
# Run locally (no Braintrust upload)
mise run eval

# Run and upload to Braintrust dashboard
mise run eval:upload
```

### Environment Variables

API keys are loaded via mise from `packages/evals/.env` (see root `mise.toml`).

```
ANTHROPIC_API_KEY         Required: eval model + judge model
BRAINTRUST_API_KEY        Required for Braintrust dashboard upload
BRAINTRUST_PROJECT_ID     Required for Braintrust dashboard upload
EVAL_MODEL                Override default eval model (claude-sonnet-4-5-20250929)
EVAL_JUDGE_MODEL          Override default judge model (claude-opus-4-6)
```

## Adding Test Cases

Add paired Incorrect/Correct code blocks to any skill reference file. The extractor picks them up automatically on the next run.
