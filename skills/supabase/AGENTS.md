# supabase

> **Note:** `CLAUDE.md` is a symlink to this file.

## Overview

Guides and best practices for working with Supabase. Covers getting started, Auth, Database, Storage, Edge Functions, Realtime, supabase-js SDK, CLI, and MCP integration. Use for any Supabase-related questions.

## Structure

```
supabase/
  SKILL.md       # Main skill file - read this first
  AGENTS.md      # This navigation guide
  CLAUDE.md      # Symlink to AGENTS.md
  references/    # Detailed reference files
```

## Usage

1. Read `SKILL.md` for the main skill instructions
2. Browse `references/` for detailed documentation on specific topics
3. Reference files are loaded on-demand - read only what you need

## Reference Categories

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Database | CRITICAL | `db-` |
| 2 | Edge Functions | HIGH | `edge-` |
| 3 | SDK | HIGH | `sdk-` |
| 4 | Realtime | MEDIUM-HIGH | `realtime-` |
| 5 | Storage | HIGH | `storage-` |

Reference files are named `{prefix}-{topic}.md` (e.g., `query-missing-indexes.md`).

## Available References

**Database** (`db-`):
- `references/db-conn-pooling.md`
- `references/db-migrations-diff.md`
- `references/db-migrations-idempotent.md`
- `references/db-migrations-testing.md`
- `references/db-perf-indexes.md`
- `references/db-perf-query-optimization.md`
- `references/db-rls-common-mistakes.md`
- `references/db-rls-mandatory.md`
- `references/db-rls-performance.md`
- `references/db-rls-policy-types.md`
- `references/db-rls-views.md`
- `references/db-schema-auth-fk.md`
- `references/db-schema-extensions.md`
- `references/db-schema-jsonb.md`
- `references/db-schema-realtime.md`
- `references/db-schema-timestamps.md`
- `references/db-security-functions.md`
- `references/db-security-service-role.md`

**Edge Functions** (`edge-`):
- `references/edge-adv-regional.md`
- `references/edge-adv-streaming.md`
- `references/edge-adv-websockets.md`
- `references/edge-auth-jwt-verification.md`
- `references/edge-auth-rls-integration.md`
- `references/edge-db-direct-postgres.md`
- `references/edge-db-supabase-client.md`
- `references/edge-dbg-limits.md`
- `references/edge-dbg-testing.md`
- `references/edge-fun-project-structure.md`
- `references/edge-fun-quickstart.md`
- `references/edge-pat-background-tasks.md`
- `references/edge-pat-cors.md`
- `references/edge-pat-error-handling.md`
- `references/edge-pat-routing.md`

**Realtime** (`realtime-`):
- `references/realtime-broadcast-basics.md`
- `references/realtime-broadcast-database.md`
- `references/realtime-patterns-cleanup.md`
- `references/realtime-patterns-debugging.md`
- `references/realtime-patterns-errors.md`
- `references/realtime-postgres-changes.md`
- `references/realtime-presence-tracking.md`
- `references/realtime-setup-auth.md`
- `references/realtime-setup-channels.md`

**SDK** (`sdk-`):
- `references/sdk-client-browser.md`
- `references/sdk-client-config.md`
- `references/sdk-client-server.md`
- `references/sdk-error-handling.md`
- `references/sdk-framework-nextjs.md`
- `references/sdk-perf-queries.md`
- `references/sdk-perf-realtime.md`
- `references/sdk-query-crud.md`
- `references/sdk-query-filters.md`
- `references/sdk-query-joins.md`
- `references/sdk-query-rpc.md`
- `references/sdk-ts-generation.md`
- `references/sdk-ts-usage.md`

**Storage** (`storage-`):
- `references/storage-access-control.md`
- `references/storage-cdn-caching.md`
- `references/storage-download-urls.md`
- `references/storage-ops-file-management.md`
- `references/storage-transform-images.md`
- `references/storage-upload-resumable.md`
- `references/storage-upload-standard.md`

---

*62 reference files across 5 categories*
