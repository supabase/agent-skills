---
title: Type Generation Workflow
impact: HIGH
impactDescription: Keep TypeScript types in sync with schema using CLI for local and MCP for remote
tags: types, typescript, workflow
---

## Type Generation Workflow

Generate TypeScript types after schema changes. Use CLI for local schema, MCP `generate_typescript_types` for remote when connected.

**Incorrect:**

```bash
# Schema changed but types not regenerated
apply_migration({ name: "add_posts", query: "CREATE TABLE posts (...)" })
# TypeScript still missing posts table type - type errors!
```

**Correct:**

```bash
# After local schema changes
supabase db diff -f "add_posts"
supabase db reset
supabase gen types typescript --local > types.ts

# After remote schema changes (MCP)
apply_migration({ ... })
generate_typescript_types({ project_id: "ref" })
# Or use CLI:
supabase gen types typescript --linked > types.ts
```

## When to Use Each

| Source | CLI | MCP |
|--------|-----|-----|
| Local database | `gen types --local` | Not available |
| Linked remote | `gen types --linked` | `generate_typescript_types` |
| Specific project | `gen types --project-id` | `generate_typescript_types` |

## CI Integration

```yaml
- name: Verify types current
  run: |
    supabase gen types typescript --local > types.gen.ts
    if ! git diff --exit-code types.gen.ts; then
      echo "Types out of date!"
      exit 1
    fi
```

## Related CLI Commands

- [../cli/gen-types.md](../cli/gen-types.md) - Full CLI reference
- [../cli/db-diff.md](../cli/db-diff.md) - Generate migration first
