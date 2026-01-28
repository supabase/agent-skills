---
title: execute_sql vs apply_migration
impact: CRITICAL
impactDescription: Using wrong tool causes migration tracking issues or untracked schema changes
tags: mcp, execute-sql, apply-migration, ddl, dml
---

## execute_sql vs apply_migration

Choose the correct MCP tool based on operation type and environment. Use `execute_sql` for data queries and local iteration. Use `apply_migration` for tracked schema changes on hosted databases. Using the wrong tool causes migration tracking issues or untracked schema changes that won't sync to other environments.

**Incorrect:**

```sql
-- Via execute_sql on HOSTED database
CREATE TABLE posts (
  id uuid PRIMARY KEY,
  title text NOT NULL
);
-- Schema change not tracked in migrations
-- supabase migration fetch won't find it
-- Other developers won't get this change
```

Using `execute_sql` for DDL on hosted database - change is not tracked in migrations.

**Correct:**

```sql
-- Via apply_migration on HOSTED database
-- Migration name: create_posts_table
CREATE TABLE posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
-- Tracked in supabase_migrations schema
-- supabase migration fetch will sync to local
```

Use `apply_migration` for DDL on hosted. Migrations are tracked and synced.

## Decision Matrix

| Operation | Local MCP | Hosted MCP |
|-----------|-----------|------------|
| SELECT queries | `execute_sql` | `execute_sql` |
| INSERT/UPDATE/DELETE | `execute_sql` | `execute_sql` |
| Schema iteration | `execute_sql` | `apply_migration` |
| Final DDL | CLI `db diff -f` | `apply_migration` |

## Related

- [workflow-local.md](workflow-local.md) - Local iteration workflow
- [workflow-hosted.md](workflow-hosted.md) - Hosted workflow
- [db-schema-tools.md](db-schema-tools.md) - Schema inspection tools
