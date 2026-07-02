# Skill evals

Behavioral evals for the skills in this repo. An eval is a test case for a skill: a realistic user prompt plus assertions describing what a correct response looks like. They measure whether a skill actually changes agent behavior for the better, and catch regressions when a skill is edited.

These are **not** shipped with the skills (the release build only packages `skills/`); they live here so they are versioned alongside the skills and can be run and extended by the team.

## Layout

```
evals/
  <skill-name>/
    evals.json
```

`evals.json` follows the `skill-creator` schema:

- `skill_name` — the skill under test.
- `evals[]` — each has a `prompt` (what a user would say), `expected_output` (what good looks like), optional `files` fixtures, and `assertions[]`.
- Each assertion has an `id`, `description`, and a `check`: `regex` (with `pattern`), `contains`/`not_contains` (with `value`), or `subjective` (with a `rubric` graded by a model).

## Running

Run through the `skill-creator` skill, which executes each prompt **with** and **without** the skill and grades the assertions, so you can see the lift the skill provides:

```
/skill-creator
```

Point it at `evals/<skill-name>/evals.json`. Extend a suite by adding cases to its `evals.json`; keep assertions concrete and prefer `regex`/`contains` over `subjective` where an exact string is expected.

## Coverage note

The `supabase-debugging` suite covers the main layers (RLS, Data API, Edge Functions, Realtime, connections/pooler, auth), the efficiency thesis (narrow, source-specific queries over broad scans), and the optimization-vs-debugging scope boundary. It is a starting set, not exhaustive; the example log queries also need validation against the live ClickHouse endpoint.
