---
title: Local Development Workflow
impact: CRITICAL
impactDescription: Optimal local iteration using CLI stack management with MCP schema iteration
tags: local, development, workflow, iteration
---

## Local Development Workflow

Combine CLI stack management with MCP rapid iteration. CLI starts local services, MCP iterates schema without creating migration files, CLI captures final changes. This keeps migration history clean while enabling fast development.

**Incorrect:**

```sql
-- Using MCP apply_migration during local iteration
-- Creates migration for every small change
CREATE TABLE posts (title text);  -- Migration #1
ALTER TABLE posts ADD content text;  -- Migration #2
-- Result: Multiple migration files for one table
```

**Correct:**

```bash
# 1. Start local stack (CLI only)
supabase start

# 2. Iterate with MCP execute_sql (no migrations created)
execute_sql({ query: "CREATE TABLE posts (...)" })
execute_sql({ query: "ALTER TABLE posts ADD ..." })
# Keep iterating until satisfied...

# 3. Capture final state (CLI)
supabase db diff -f "create_posts"

# 4. Generate types (CLI)
supabase gen types typescript --local > types.ts
```

## Workflow Steps

| Step | Tool | Command/Tool | Purpose |
|------|------|--------------|---------|
| 1 | CLI | `supabase start` | Start local services |
| 2 | MCP | `execute_sql` | Iterate schema (no files) |
| 3 | MCP | `get_advisors` | Check security/performance |
| 4 | CLI | `supabase db diff -f` | Capture as migration |
| 5 | CLI | `supabase gen types --local` | Generate types |

## Why This Works

- MCP `execute_sql` changes schema without creating migration files
- Iterate freely without cluttering `supabase/migrations/`
- CLI `db diff` captures final state as single clean migration
- MCP `get_advisors` catches security issues early

## Reset and Retry

```bash
# Something wrong? Reset and try again
supabase db reset  # Resets to committed migrations
```

## Related CLI Commands

- [../cli/project-start.md](../cli/project-start.md) - Start local stack
- [../cli/db-diff.md](../cli/db-diff.md) - Generate migration from changes
- [../cli/gen-types.md](../cli/gen-types.md) - Generate TypeScript types
