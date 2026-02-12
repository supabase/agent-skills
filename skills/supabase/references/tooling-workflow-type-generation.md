---
title: Type Generation Workflow
impact: HIGH
impactDescription: CLI-only workflow for generating TypeScript types from database schema
tags: types, typescript, workflow, cli
---

## Type Generation Workflow

Generate TypeScript types after schema changes using CLI. Always specify the source (`--local` or `--linked`).

**Incorrect:**

```bash
# Schema changed but types not regenerated
npx supabase db diff -f "add_posts"
npx supabase db reset
# TypeScript still missing posts table type - type errors!
```

**Correct:**

```bash
# After local schema changes
npx supabase db diff -f "add_posts"
npx supabase db reset
npx supabase gen types --lang typescript --local > types.ts

# After remote schema changes
npx supabase gen types --lang typescript --linked > types.ts

# From specific project
npx supabase gen types --lang typescript --project-id REF > types.ts
```

## When to Use Each Flag

| Source | Command |
| --- | --- |
| Local database | `gen types --lang typescript --local` |
| Linked remote | `gen types --lang typescript --linked` |
| Specific project | `gen types --lang typescript --project-id REF` |

## CI Integration

```yaml
- name: Verify types current
  run: |
    npx supabase gen types --lang typescript --local > types.gen.ts
    if ! git diff --exit-code types.gen.ts; then
      echo "Types out of date!"
      exit 1
    fi
```

## Related

- [../cli-generation-commands.md](../cli-generation-commands.md) - Full CLI reference
- [../cli-database-commands.md](../cli-database-commands.md) - Schema changes before types
