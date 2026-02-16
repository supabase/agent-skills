---
title: Local Development Workflow
impact: CRITICAL
impactDescription: Standard development cycle using local Supabase stack with CLI, psql, and supabase-js
tags: local, development, workflow, iteration, docker, psql, cli, sdk
---

## Local Development Workflow

Use the **CLI** to manage the local stack, create migrations, and deploy. Use **`psql`** to connect to the local Postgres database for debugging, inspection, and troubleshooting. Use **supabase-js** in the application code for all client-side database interaction.

**Incorrect:**

```bash
# Iterating on schema with psql directly — no migration trail
psql "$DB_URL" -c "CREATE TABLE posts (...)"
psql "$DB_URL" -c "ALTER TABLE posts ADD COLUMN content text"
npx supabase db diff -f "create_posts"
# Problem: schema changes bypass migration workflow, diff can miss things
```

**Correct:**

```bash
# 1. Start local stack
npx supabase start

# 2. Create migration for schema changes
npx supabase migration new create_posts

# 3. Edit the migration file with the desired SQL
# supabase/migrations/<timestamp>_create_posts.sql

# 4. Apply migrations and verify
npx supabase db reset

# 5. Generate types
npx supabase gen types --lang typescript --local > types.ts

# 6. Use psql to inspect and debug
psql "$DB_URL" -c "SELECT * FROM posts LIMIT 10"
psql "$DB_URL" -c "\d posts"

# 7. Deploy to remote (ask user permission first!)
npx supabase db push --dry-run
npx supabase db push
```

## Tool Roles

| Tool | Role | Used For |
| --- | --- | --- |
| CLI (`npx supabase`) | Project management, schema changes, deployment | `migration new`, `db diff`, `db reset`, `db push`, `gen types`, `functions serve` |
| `psql` | Agent database access | Debugging queries, inspecting schema, testing RLS, exploring data |
| supabase-js SDK | Application database client | All database interaction in the user's app code (queries, inserts, auth, storage) |

**Key distinction:** `psql` is the agent's tool for connecting to the local database to inspect and debug. The user's application code connects through the **supabase-js SDK**, not `psql`. Schema changes always go through **CLI migrations**.

## Complete Cycle

| Step | Tool | Command | Purpose |
| --- | --- | --- | --- |
| 1 | CLI | `npx supabase start` | Start local services |
| 2 | CLI | `npx supabase status` | Get local DB URL and credentials |
| 3 | CLI | `npx supabase migration new "name"` | Create migration file for schema changes |
| 4 | — | Edit migration SQL file | Write the schema change |
| 5 | CLI | `npx supabase db reset` | Apply migrations from scratch, verify correctness |
| 6 | CLI | `npx supabase gen types --local` | Generate TypeScript types |
| 7 | psql | `psql "$DB_URL" -c "..."` | Debug and inspect the database |
| 8 | CLI | `npx supabase db push` | Deploy to remote (with user permission) |

When iterating on schema, edit the migration file and run `npx supabase db reset` to re-apply. Use `npx supabase db diff` only to capture changes made outside of migration files (e.g., via the Studio UI).

Remind the user to commit changes at the end of each schema-modifying turn.

## Using psql for Debugging

The default local database connection string is:

```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Always verify with `npx supabase status` — the port may differ if customized in `config.toml`.

**Common psql operations (agent debugging):**

```bash
# Inspect data
psql "$DB_URL" -c "SELECT * FROM posts LIMIT 10"

# Run a seed file
psql "$DB_URL" -f supabase/seed.sql

# List tables
psql "$DB_URL" -c "\dt public.*"

# Describe a table
psql "$DB_URL" -c "\d posts"

# Test RLS policies
psql "$DB_URL" -c "SET request.jwt.claims = '{\"sub\": \"user-id\"}'; SELECT * FROM posts;"

# Check active connections
psql "$DB_URL" -c "SELECT * FROM pg_stat_activity WHERE state = 'active'"
```

## Reset and Retry

```bash
npx supabase db reset    # Drops and recreates from committed migrations + seed
```

## Related

- [dev-cli-reference.md](dev-cli-reference.md) — CLI command details
- [dev-cli-vs-mcp.md](dev-cli-vs-mcp.md) — When to use CLI+psql vs MCP
