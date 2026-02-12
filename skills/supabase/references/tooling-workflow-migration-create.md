---
title: Migration Creation Workflow
impact: CRITICAL
impactDescription: CLI-first migration workflow with MCP as secondary option for remote-first
tags: migrations, workflow, sync
---

## Migration Creation Workflow

**Default: local-first** using CLI. Create migration files locally, test with `db reset`, push to remote with `db push`. Remote-first via MCP `apply_migration` is a secondary option when you need to apply directly to a remote database.

**Incorrect:**

```bash
# Applying via MCP without syncing locally
apply_migration({ project_id: "ref", name: "add_table", query: "..." })
# Local is now out of sync!
supabase db reset  # Fails or produces wrong state
```

**Correct (Local-First - Recommended):**

```bash
# 1. Create migration (CLI)
npx supabase migration new create_posts
# Edit supabase/migrations/<timestamp>_create_posts.sql

# 2. Test locally (CLI)
npx supabase db reset

# 3. Push to remote (CLI)
npx supabase db push
```

**Correct (Remote-First - Secondary):**

```bash
# 1. Apply via MCP
apply_migration({
  project_id: "ref",
  name: "create_posts",
  query: "CREATE TABLE posts (...)"
})

# 2. Sync to local (CLI) - REQUIRED
npx supabase migration fetch --yes
npx supabase db reset
```

## Workflow Comparison

| Step | Local-First (Default) | Remote-First (Secondary) |
| --- | --- | --- |
| Create | CLI `migration new` + edit file | MCP `apply_migration` |
| Test | CLI `db reset` | MCP `execute_sql` |
| Deploy | CLI `db push` | Already applied |
| Sync | Not needed | CLI `migration fetch` (required) |

## Key Commands

| Direction | CLI Command | When |
| --- | --- | --- |
| Local → Remote | `supabase db push` | Deploy local migrations |
| Remote → Local | `supabase migration fetch --yes` | After MCP migration |
| Check drift | `supabase db diff --linked` | Before development |

## Related

- [../cli-migration-commands.md](../cli-migration-commands.md) - Migration commands
- [../cli-database-commands.md](../cli-database-commands.md) - db push, db reset, db diff
