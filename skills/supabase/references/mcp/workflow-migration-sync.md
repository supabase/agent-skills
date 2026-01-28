---
title: Migration Sync Between Local and Hosted
impact: HIGH
impactDescription: Prevents schema drift and migration conflicts between environments
tags: mcp, migrations, sync, local, hosted
---

## Migration Sync Between Local and Hosted

Keep migration files synchronized between local and hosted environments. After applying migrations via hosted MCP, fetch them locally. Before pushing local migrations to hosted, ensure remote hasn't drifted. Use `supabase db diff --linked` to detect schema differences between environments.

**Incorrect:**

```bash
# Apply migration via MCP on hosted
# Then continue local development without fetching
# Local migration files are now out of sync
supabase db reset  # Fails or produces different schema
```

Not syncing after hosted MCP changes causes local environment to diverge.

**Correct:**

```bash
# After applying migration via hosted MCP:
supabase migration fetch --yes
# Local migration files now match remote

# Before local development:
supabase db diff --linked  # Check for drift
supabase db reset          # Apply all migrations locally
```

Always sync migrations after hosted changes and check for drift before local development.

## Sync Commands

| Direction | Command | When |
|-----------|---------|------|
| Hosted → Local | `supabase migration fetch` | After MCP `apply_migration` |
| Local → Hosted | `supabase db push` | Deploy local migrations |
| Detect drift | `supabase db diff --linked` | Before development |

## Resolve Conflicts

When schemas diverge:
1. `supabase migration fetch --yes` - Get remote migrations
2. `supabase db reset` - Reset local to match
3. `supabase db diff --linked` - Verify sync

## Related

- [workflow-local.md](workflow-local.md) - Local workflow
- [workflow-hosted.md](workflow-hosted.md) - Hosted workflow
