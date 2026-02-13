---
title: Local Development Workflow
impact: CRITICAL
impactDescription: Standard development cycle using local Supabase stack
tags: local, development, workflow, iteration, docker
---

## Local Development Workflow

CLI manages the local stack and captures changes. The local MCP server (`localhost:54321/mcp`) enables rapid schema iteration with `execute_sql` without creating migration files.

**Incorrect:**

```bash
# Creating migration files for every small change during iteration
npx supabase migration new add_title
# Edit file...
npx supabase db reset
npx supabase migration new add_content
# Edit file...
npx supabase db reset
# Result: Multiple noisy migration files for one table
```

**Correct:**

```bash
# 1. Start local stack
npx supabase start

# 2. Iterate with execute_sql (no migration files created)
execute_sql({ query: "CREATE TABLE posts (...)" })
execute_sql({ query: "ALTER TABLE posts ADD COLUMN content text" })
# Keep iterating until satisfied...

# 3. Check security and performance
get_advisors({ project_id: "local" })

# 4. Capture final state as migration
npx supabase db diff -f "create_posts"

# 5. Generate types
npx supabase gen types --lang typescript --local > types.ts

# 6. Verify clean replay
npx supabase db reset

# 7. Deploy to remote
npx supabase db push
```

## Complete Cycle

| Step | Tool | Command | Purpose |
| --- | --- | --- | --- |
| 1 | CLI | `npx supabase start` | Start local services |
| 2 | MCP | `execute_sql` | Iterate schema without migration files |
| 3 | MCP | `get_advisors` | Check security and performance |
| 4 | CLI | `npx supabase db diff -f "name"` | Capture as migration |
| 5 | CLI | `npx supabase gen types --local` | Generate TypeScript types |
| 6 | CLI | `npx supabase db reset` | Verify migration replays correctly |
| 7 | CLI | `npx supabase db push` | Deploy to remote |

Remind the user to commit changes at the end of each schema-modifying turn.

## Debugging

```javascript
get_logs({ project_id: "local", service: "postgres" })   // Slow queries, errors
get_logs({ project_id: "local", service: "api" })         // PostgREST / RLS failures
```

## Reset and Retry

```bash
npx supabase db reset    # Drops and recreates from committed migrations + seed
```

## Related

- [dev-cli-reference.md](dev-cli-reference.md) — CLI command details
- [dev-mcp-tools.md](dev-mcp-tools.md) — MCP tool reference
- [dev-cli-vs-mcp.md](dev-cli-vs-mcp.md) — When to use which tool
