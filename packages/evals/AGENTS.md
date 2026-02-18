# Evals — Agent Guide

This package evaluates whether LLMs correctly apply Supabase best practices
using skill documentation as context. It uses
[Braintrust](https://www.braintrust.dev/) for eval orchestration and the
[Vercel AI SDK](https://sdk.vercel.ai/) for LLM calls.

## Architecture

Two-step **LLM-as-judge** pattern powered by Braintrust's `Eval()`:

1. The **eval model** (default: `claude-sonnet-4-5-20250929`) receives a prompt
   with skill context and produces a code fix.
2. Three independent **judge scorers** (default: `claude-opus-4-6`) evaluate the
   fix via structured output (Zod schemas via AI SDK's `Output.object()`).

Key files:

```
src/
  code-fix.eval.ts        # Braintrust Eval() entry point
  dataset.ts              # Maps extracted test cases to EvalCase format
  scorer.ts               # Three AI SDK-based scorers (Correctness, Completeness, Best Practice)
  models.ts               # Model provider factory (Anthropic / OpenAI)
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

Three independent scorers evaluate each fix (0–1 scale):

- **Correctness** — does the fix address the core issue?
- **Completeness** — does the fix include all necessary changes?
- **Best Practice** — does the fix follow Supabase conventions?

Braintrust aggregates the scores and provides a dashboard for tracking
regressions over time.

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

## Running Evals

```bash
# Run locally (no Braintrust upload)
mise run eval

# Run and upload to Braintrust dashboard
mise run eval:upload
```

Or directly:

```bash
cd packages/evals

# Local run
npx braintrust eval --no-send-logs src/code-fix.eval.ts

# Upload to Braintrust
npx braintrust eval src/code-fix.eval.ts
```

In CI, evals run via `braintrustdata/eval-action@v1` and are gated by the
`run-evals` PR label.

## Environment

API keys are loaded by mise from `packages/evals/.env` (configured in root
`mise.toml`). Copy `.env.example` to `.env` and fill in the keys.

```
ANTHROPIC_API_KEY=sk-ant-...    # Required: eval model + judge model
BRAINTRUST_API_KEY=...          # Required for upload to Braintrust dashboard
BRAINTRUST_PROJECT_ID=...       # Required for upload to Braintrust dashboard
```

Optional overrides:

```
EVAL_MODEL=claude-sonnet-4-5-20250929    # Model under test
EVAL_JUDGE_MODEL=claude-opus-4-6         # Judge model for scorers
```
