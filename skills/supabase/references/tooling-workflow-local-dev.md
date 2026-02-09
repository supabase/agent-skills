---
title: Local Development Workflow
impact: CRITICAL
impactDescription: CLI-primary local iteration with MCP for rapid schema exploration
tags: local, development, workflow, iteration
---

## Local Development Workflow

CLI manages the local stack and captures changes. MCP `execute_sql` enables rapid schema iteration without creating migration files. MCP `get_advisors` checks security and performance before finalizing.

**Incorrect:**

```sql
-- Creating migration files for every small change during iteration
supabase migration new add_title
-- Edit file...
supabase db reset
supabase migration new add_content
-- Edit file...
supabase db reset
-- Result: Multiple migration files for one table
```

**Correct:**

```bash
# 1. Start local stack (CLI)
npx supabase start

# 2. Iterate with MCP execute_sql (no migrations created)
execute_sql({ query: "CREATE TABLE posts (...)" })
execute_sql({ query: "ALTER TABLE posts ADD ..." })
# Keep iterating until satisfied...

# 3. Check security/performance (MCP)
get_advisors({ project_id: "ref" })

# 4. Capture final state (CLI)
npx supabase db diff -f "create_posts"

# 5. Generate types (CLI)
npx supabase gen types --lang typescript --local > types.ts

# 6. Verify clean replay (CLI)
npx supabase db reset
```

## Workflow Steps

| Step | Tool | Command/Tool | Purpose |
| --- | --- | --- | --- |
| 1 | CLI | `supabase start` | Start local services |
| 2 | MCP | `execute_sql` | Iterate schema (no files) |
| 3 | MCP | `get_advisors` | Check security/performance |
| 4 | CLI | `supabase db diff -f` | Capture as migration |
| 5 | CLI | `supabase gen types --local` | Generate types |
| 6 | CLI | `supabase db reset` | Verify clean replay |

## Why This Works

- MCP `execute_sql` changes schema without creating migration files
- Iterate freely without cluttering `supabase/migrations/`
- CLI `db diff` captures final state as single clean migration
- MCP `get_advisors` catches security issues early
- CLI `db reset` verifies the migration replays correctly

## Reset and Retry

```bash
# Something wrong? Reset and try again
npx supabase db reset  # Resets to committed migrations
```

## Related

- [../cli-project-commands.md](../cli-project-commands.md) - Start local stack
- [../cli-database-commands.md](../cli-database-commands.md) - db diff, db reset
- [../cli-generation-commands.md](../cli-generation-commands.md) - Generate types
