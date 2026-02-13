---
title: Local Development Workflow
impact: CRITICAL
impactDescription: Standard development cycle using local Supabase stack with CLI and psql
tags: local, development, workflow, iteration, docker, psql, cli
---

## Local Development Workflow

Use the **CLI** to manage the local stack and capture changes. Use **`psql`** to interact with the local Postgres database for schema iteration, queries, and debugging.

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

# 2. Get local database URL
npx supabase status  # Note the DB URL

# 3. Iterate with psql (no migration files created)
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
  CREATE TABLE posts (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    created_at timestamptz DEFAULT now()
  );
"
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
  ALTER TABLE posts ADD COLUMN content text;
"
# Keep iterating until satisfied...

# 4. Capture final state as migration
npx supabase db diff -f "create_posts"

# 5. Generate types
npx supabase gen types --lang typescript --local > types.ts

# 6. Verify clean replay
npx supabase db reset

# 7. Deploy to remote (ask user permission first!)
npx supabase db push --dry-run
npx supabase db push
```

## Complete Cycle

| Step | Tool | Command | Purpose |
| --- | --- | --- | --- |
| 1 | CLI | `npx supabase start` | Start local services |
| 2 | CLI | `npx supabase status` | Get local DB URL and credentials |
| 3 | psql | `psql "$DB_URL" -c "..."` | Iterate schema without migration files |
| 4 | CLI | `npx supabase db diff -f "name"` | Capture as migration |
| 5 | CLI | `npx supabase gen types --local` | Generate TypeScript types |
| 6 | CLI | `npx supabase db reset` | Verify migration replays correctly |
| 7 | CLI | `npx supabase db push` | Deploy to remote (with user permission) |

Remind the user to commit changes at the end of each schema-modifying turn.

## Connecting with psql

The default local database connection string is:

```
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Always verify with `npx supabase status` — the port may differ if customized in `config.toml`.

**Common psql operations:**

```bash
# Run a query
psql "$DB_URL" -c "SELECT * FROM posts LIMIT 10"

# Run a SQL file
psql "$DB_URL" -f supabase/seed.sql

# Interactive session
psql "$DB_URL"

# List tables
psql "$DB_URL" -c "\dt public.*"

# Describe a table
psql "$DB_URL" -c "\d posts"
```

## Debugging

Use `psql` to inspect the local database directly:

```bash
# Check recent errors in Postgres logs
psql "$DB_URL" -c "SELECT * FROM pg_stat_activity WHERE state = 'active'"

# Test RLS policies
psql "$DB_URL" -c "SET request.jwt.claims = '{\"sub\": \"user-id\"}'; SELECT * FROM posts;"
```

## Reset and Retry

```bash
npx supabase db reset    # Drops and recreates from committed migrations + seed
```

## Related

- [dev-cli-reference.md](dev-cli-reference.md) — CLI command details
- [dev-cli-vs-mcp.md](dev-cli-vs-mcp.md) — When to use CLI+psql vs MCP
