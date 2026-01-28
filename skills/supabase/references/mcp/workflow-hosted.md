---
title: Hosted MCP Development Workflow
impact: CRITICAL
impactDescription: Ensures migrations are tracked and synced correctly
tags: mcp, hosted, development, workflow, apply-migration
---

## Hosted MCP Development Workflow

When using MCP with hosted Supabase, the remote database is the source of truth for migration history. Use `apply_migration` for all schema changes to ensure they are tracked. After applying migrations via MCP, sync locally with `supabase migration fetch` to keep local migration files up to date.

**Incorrect:**

```sql
-- Via execute_sql MCP tool on hosted
CREATE TABLE posts (
  id uuid PRIMARY KEY,
  title text
);
-- Change is NOT tracked in migrations
-- Local migration files out of sync
-- Other team members won't see the change
```

Using `execute_sql` for schema changes on hosted database - not tracked in migrations.

**Correct:**

```sql
-- Via apply_migration MCP tool
-- Name: create_posts_table
CREATE TABLE posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
-- Then sync locally: supabase migration fetch --yes
-- Then regenerate types: supabase gen types typescript --linked > types.ts
```

Use `apply_migration` for schema changes. Migrations are tracked in `supabase_migrations` schema.

## Hosted Workflow Steps

1. Link project: `supabase link --project-ref <id>`
2. Apply changes with `apply_migration` MCP tool
3. Run `get_advisors` for security/performance checks
4. Sync locally: `supabase migration fetch --yes`
5. Generate types: `supabase gen types typescript --linked > types.ts`

## Related

- [workflow-local.md](workflow-local.md) - Local workflow
- [db-execute-vs-migrate.md](db-execute-vs-migrate.md) - Tool selection
- [workflow-migration-sync.md](workflow-migration-sync.md) - Sync patterns
