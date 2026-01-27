# supabase

## Overview

Guides and best practices for working with Supabase. Covers getting started, Auth, Database, Storage, Edge Functions, Realtime, supabase-js SDK, CLI, and MCP integration. Use for any Supabase-related questions.

## Structure

```
supabase/
  SKILL.md       # Main skill file - read this first
  AGENTS.md      # This navigation guide
  references/    # Detailed reference files
```

## Usage

1. Read `SKILL.md` for the main skill instructions
2. Browse `references/` for detailed documentation on specific topics
3. Reference files are loaded on-demand - read only what you need

## Reference Categories

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Row Level Security | CRITICAL | `rls-` |
| 1 | Channel Setup | HIGH | `setup-` |
| 2 | Connection Pooling | CRITICAL | `conn-` |
| 2 | Broadcast Messaging | CRITICAL | `broadcast-` |
| 3 | Schema Design | HIGH | `schema-` |
| 3 | Presence Tracking | MEDIUM | `presence-` |
| 4 | Migrations | HIGH | `migrations-` |
| 4 | Postgres Changes | MEDIUM | `postgres-` |
| 5 | Performance | CRITICAL | `perf-` |
| 5 | Implementation Patterns | CRITICAL | `patterns-` |
| 6 | Security | CRITICAL | `security-` |

Reference files are named `{prefix}-{topic}.md` (e.g., `query-missing-indexes.md`).

## Available References

**Connection Pooling** (`conn-`):
- `references/db/conn-pooling.md`

**Migrations** (`migrations-`):
- `references/db/migrations-diff.md`
- `references/db/migrations-idempotent.md`
- `references/db/migrations-testing.md`

**Performance** (`perf-`):
- `references/db/perf-indexes.md`
- `references/db/perf-query-optimization.md`

**Row Level Security** (`rls-`):
- `references/db/rls-common-mistakes.md`
- `references/db/rls-mandatory.md`
- `references/db/rls-performance.md`
- `references/db/rls-policy-types.md`
- `references/db/rls-views.md`

**Schema Design** (`schema-`):
- `references/db/schema-auth-fk.md`
- `references/db/schema-extensions.md`
- `references/db/schema-jsonb.md`
- `references/db/schema-realtime.md`
- `references/db/schema-timestamps.md`

**Security** (`security-`):
- `references/db/security-functions.md`
- `references/db/security-service-role.md`

**Broadcast Messaging** (`broadcast-`):
- `references/realtime/broadcast-basics.md`
- `references/realtime/broadcast-database.md`

**Implementation Patterns** (`patterns-`):
- `references/realtime/patterns-cleanup.md`
- `references/realtime/patterns-errors.md`

**Postgres Changes** (`postgres-`):
- `references/realtime/postgres-changes.md`

**Presence Tracking** (`presence-`):
- `references/realtime/presence-tracking.md`

**Channel Setup** (`setup-`):
- `references/realtime/setup-auth.md`
- `references/realtime/setup-channels.md`

---

*26 reference files across 11 categories*