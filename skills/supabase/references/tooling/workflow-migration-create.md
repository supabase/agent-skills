---
title: Migration Creation Workflow
impact: CRITICAL
impactDescription: Keep migrations clean and environments synced using CLI + MCP together
tags: migrations, workflow, sync
---

## Migration Creation Workflow

Two paths: **local-first** (CLI creates file, push to remote) and **remote-first** (MCP applies, CLI syncs locally). Both require syncing to keep environments aligned.

**Incorrect:**

```bash
# Apply via MCP, forget to sync
apply_migration({ project_id: "ref", name: "add_table", query: "..." })
# Later, local development...
supabase db reset  # Local is out of sync!
```

**Correct (Remote-First):**

```bash
# 1. Apply via MCP
apply_migration({
  project_id: "ref",
  name: "create_posts",
  query: "CREATE TABLE posts (...)"
})

# 2. Sync to local (CLI)
supabase migration fetch --yes
supabase db reset
```

**Correct (Local-First):**

```bash
# 1. Create migration (CLI)
supabase migration new create_posts
# Edit file...

# 2. Test locally (CLI)
supabase db reset

# 3. Push to remote (CLI)
supabase db push
```

## Workflow Comparison

| Step | Local-First | Remote-First |
|------|-------------|--------------|
| Create | CLI `migration new` | MCP `apply_migration` |
| Test | CLI `db reset` | MCP `execute_sql` |
| Deploy | CLI `db push` | Already applied |
| Sync | - | CLI `migration fetch` |

## Key Commands

| Direction | CLI Command | When |
|-----------|-------------|------|
| Remote → Local | `supabase migration fetch --yes` | After MCP migration |
| Local → Remote | `supabase db push` | Deploy local changes |
| Check drift | `supabase db diff --linked` | Before development |

## Related CLI Commands

- [../cli/migration-new.md](../cli/migration-new.md) - Create migration file
- [../cli/migration-fetch.md](../cli/migration-fetch.md) - Sync from remote
- [../cli/db-push.md](../cli/db-push.md) - Push to remote
- [../cli/db-diff.md](../cli/db-diff.md) - Check for drift
