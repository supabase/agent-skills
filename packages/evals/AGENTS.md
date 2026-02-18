# Evals — Agent Guide

This package evaluates whether LLMs correctly apply Supabase best practices
using skill documentation as context. It uses
[Braintrust](https://www.braintrust.dev/) for eval orchestration and the
[Vercel AI SDK](https://sdk.vercel.ai/) for LLM calls.

## Architecture

Two-step **LLM-as-judge** pattern powered by Braintrust's `Eval()`:

1. The **eval model** receives a prompt with skill context and produces a code
   fix. All eval model calls go through the **Braintrust AI proxy** — a single
   OpenAI-compatible endpoint that routes to any provider (Anthropic, OpenAI,
   Google, etc.).
2. Five independent **judge scorers** (`claude-opus-4-6` via direct Anthropic
   API) evaluate the fix via structured output (Zod schemas via AI SDK's
   `Output.object()`).

The eval runs once per model in the model matrix, creating a separate Braintrust
experiment per model for side-by-side comparison.

Key files:

```
src/
  code-fix.eval.ts        # Braintrust Eval() entry point (loops over models)
  dataset.ts              # Maps extracted test cases to EvalCase format
  scorer.ts               # Five AI SDK-based scorers (quality, safety, minimality)
  models.ts               # Braintrust proxy + direct Anthropic provider
  models.config.ts        # Model matrix (add/remove models here)
  dataset/
    types.ts              # CodeFixTestCase interface
    extract.ts            # Auto-extracts test cases from skill references
  prompts/
    code-fix.ts           # System + user prompts for the eval model
```

## How It Works

**Test cases are auto-extracted** from `skills/*/references/*.md`. The extractor
(`dataset/extract.ts`) finds consecutive `**Incorrect:**` / `**Correct:**` code
block pairs under `##` sections. Each pair becomes one test case.

Five independent scorers evaluate each fix (0–1 scale):

- **Correctness** — does the fix address the core issue?
- **Completeness** — does the fix include all necessary changes?
- **Best Practice** — does the fix follow Supabase conventions?
- **Regression Safety** — does the fix avoid introducing new problems (broken
  functionality, removed security measures, new vulnerabilities)?
- **Minimality** — is the fix tightly scoped to the identified issue without
  unnecessary rewrites or over-engineering?

Each model in the matrix generates a separate Braintrust experiment. The
dashboard supports side-by-side comparison of experiments.

## Adding Test Cases

No code changes needed. Add paired Incorrect/Correct blocks to any skill
reference file. The extractor picks them up automatically.

Required format in a reference `.md` file:

```markdown
## Section Title

Explanation of the issue.

**Incorrect:**

\```sql
-- bad code
\```

**Correct:**

\```sql
-- good code
\```
```

Rules:

- Pairs must be consecutive — an Incorrect block immediately followed by a
  Correct block
- Labels are matched case-insensitively. Bad labels: `Incorrect`, `Wrong`, `Bad`.
  Good labels: `Correct`, `Good`, `Usage`, `Implementation`, `Example`,
  `Recommended`
- The optional parenthetical in the label becomes the `description` field:
  `**Incorrect (missing RLS):**`
- Files prefixed with `_` (like `_sections.md`, `_template.md`) are skipped
- Each pair gets an ID like `supabase/db-rls-mandatory#0` (skill/filename#index)

## Adding/Removing Models

Edit the `EVAL_MODELS` array in `src/models.config.ts`:

```typescript
export const EVAL_MODELS: EvalModelConfig[] = [
  { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5", provider: "anthropic", ci: true },
  { id: "gpt-5.3", label: "GPT 5.3", provider: "openai", ci: true },
  // Add new models here
];
```

Provider API keys must be configured in the Braintrust dashboard under
Settings → AI providers.

## Running Evals

```bash
# Run all models locally (no Braintrust upload)
mise run eval

# Run a single model
mise run eval:model model=claude-sonnet-4-5-20250929

# Run and upload to Braintrust dashboard
mise run eval:upload
```

Or directly:

```bash
cd packages/evals

# Local run (all models)
npx braintrust eval --no-send-logs src/code-fix.eval.ts

# Single model
EVAL_MODEL=claude-sonnet-4-5-20250929 npx braintrust eval --no-send-logs src/code-fix.eval.ts

# Filter to one test case (across all models)
npx braintrust eval --no-send-logs src/code-fix.eval.ts --filter 'input.testCase.id=db-migrations-idempotent'
```

## Environment

API keys are loaded by mise from `packages/evals/.env` (configured in root
`mise.toml`). Copy `.env.example` to `.env` and fill in the keys.

```
BRAINTRUST_API_KEY=...         # Required: proxy routing + dashboard upload
BRAINTRUST_PROJECT_ID=...      # Required: Braintrust project identifier
ANTHROPIC_API_KEY=sk-ant-...   # Required: judge model (Claude Opus 4.6)
```

Optional overrides:

```
EVAL_MODEL=claude-sonnet-4-5-20250929  # Run only this model (skips matrix)
EVAL_JUDGE_MODEL=claude-opus-4-6       # Judge model for scorers
```

## Modifying Prompts

- `src/prompts/code-fix.ts` — what the eval model sees
- `src/scorer.ts` — judge prompts for each scorer dimension

Temperature settings:

- Eval model: `0.2` (in `code-fix.eval.ts`)
- Judge model: `0.1` (in `scorer.ts`)

## Modifying Scoring

Each scorer in `src/scorer.ts` is independent. To add a new dimension:

1. Create a new `EvalScorer` function in `scorer.ts`
2. Add it to the `scores` array in `code-fix.eval.ts`
