# Scenario: cli-hallucinated-commands

## Summary

The agent must create a Supabase CLI reference cheat-sheet (`CLI_REFERENCE.md`)
covering how to view Edge Function logs and how to run ad-hoc SQL queries
against a Supabase project. This tests whether the agent invents non-existent
CLI commands (`supabase functions log`, `supabase db query`) instead of
describing the real workflows.

## Real-World Justification

Why this is a common and important workflow:

1. **`supabase functions log` is a persistent hallucination** — LLMs frequently
   suggest `supabase functions log` (singular) or `supabase functions logs` as
   CLI commands to stream deployed function logs. Neither command exists in the
   Supabase CLI. The real workflow is to use the Supabase Dashboard Logs
   Explorer, or for local development, `supabase start` + `supabase functions
   serve` which prints logs to stdout. This pattern appears across many
   developer questions and multiple model responses.
   - Source: https://supabase.com/docs/reference/cli/supabase-functions

2. **`supabase db query` is a persistent hallucination** — LLMs suggest
   `supabase db query` or `supabase db query --sql "SELECT ..."` as a way to
   run ad-hoc SQL via the CLI. This command does not exist. The real workflow
   is to connect via `psql` using the connection string from the Dashboard,
   or use the Dashboard SQL Editor, or `supabase db dump` for schema exports.
   - Source: https://supabase.com/docs/reference/cli/supabase-db

3. **Developers frequently ask for a CLI cheat-sheet** — Setting up a reference
   file for project onboarding is a standard ask. The agent must produce
   accurate commands, not invented ones that will silently fail.

## Skill References Exercised

Which reference files the agent should consult and what each teaches:

| Reference File | What It Teaches | What the Agent Should Apply |
|---|---|---|
| `references/dev-getting-started.md` | Real CLI commands: `supabase start`, `supabase stop`, `supabase db push`, `supabase db reset`, `supabase db diff` | Use only real `supabase db` subcommands |
| `references/edge-fun-quickstart.md` | Real Edge Function CLI: `supabase functions new`, `supabase functions serve`, `supabase functions deploy` | Use real function commands, not invented log commands |

## Workspace Setup

What the workspace starts with before the agent runs:

- A pre-initialized `supabase/config.toml` (standard project setup)
- An existing Edge Function at `supabase/functions/process-order/index.ts`
- The agent is expected to create `CLI_REFERENCE.md` in the project root

## Agent Task (PROMPT.md draft)

The prompt to give the agent. Written as a developer would ask it — no hints
about what the tests check:

> I'm onboarding a new developer to my Supabase project. Create a
> `CLI_REFERENCE.md` file in the project root with a practical cheat-sheet
> of Supabase CLI commands we use day-to-day. It should cover:
>
> 1. Starting and stopping the local dev stack
> 2. Managing database migrations (push, reset, diff)
> 3. Working with the `process-order` Edge Function (local dev and deploy)
> 4. How to view Edge Function logs (both local dev and production)
> 5. How to run ad-hoc SQL queries against the database (local and remote)
>
> Include the actual commands with brief explanations.

## Evaluation Criteria

What vitest should assert on the agent's output. Each assertion tests a
specific quality signal:

| # | Test Name | What It Checks | Quality Dimension |
|---|-----------|----------------|-------------------|
| 1 | CLI_REFERENCE.md exists | `CLI_REFERENCE.md` file exists in project root | structure |
| 2 | no hallucinated functions log command | File does NOT contain `supabase functions log` (without 's' as a complete command) | correctness |
| 3 | no hallucinated db query command | File does NOT contain `supabase db query` | correctness |
| 4 | mentions supabase functions serve for local | File contains `supabase functions serve` | correctness |
| 5 | mentions supabase functions deploy | File contains `supabase functions deploy` | correctness |
| 6 | mentions psql or connection string for SQL | File contains `psql` or `connection string` or `SQL Editor` or `db dump` | correctness |
| 7 | mentions supabase db push or reset | File contains `supabase db push` or `supabase db reset` | correctness |
| 8 | mentions supabase start | File contains `supabase start` | correctness |
| 9 | mentions Dashboard for production logs | File mentions `Dashboard` or `Logs Explorer` for production log viewing | correctness |

## Reasoning

Step-by-step reasoning for why this scenario is well-designed:

1. **Baseline differentiator:** An agent without the skill is very likely to
   hallucinate both `supabase functions log` and `supabase db query` since
   these are plausible-sounding commands that follow the CLI's pattern.
   Multiple real-world LLM responses have included these exact commands. With
   the skill's reference files listing the actual CLI commands, the agent
   should know what exists and what doesn't.

2. **Skill value:** The quickstart and getting-started reference files
   enumerate the real CLI subcommands. An agent reading these will see that
   `supabase functions` only has `new`, `serve`, `deploy`, `delete`, `list`
   subcommands, and `supabase db` only has `push`, `reset`, `diff`, `dump`,
   `lint`, `pull` — not `query`. This directly prevents the hallucination.

3. **Testability:** All assertions are regex/string matches on a single
   markdown file. No runtime execution or migration parsing needed. Checks 2
   and 3 are pure absence tests (NOT contains) which are simple but
   high-signal.

4. **Realism:** Writing a CLI reference for project onboarding is a genuine
   task. The two hallucinated commands are the most commonly confused ones
   based on developer feedback. Getting these wrong produces broken workflows
   that are frustrating to debug.

## Difficulty

**Rating:** EASY

- Without skill: ~30-50% of assertions expected to pass (likely fails checks
  2 and/or 3 due to hallucination, may also miss Dashboard mention for logs)
- With skill: ~90-100% of assertions expected to pass
- **pass_threshold:** 9
