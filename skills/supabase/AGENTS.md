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
| 1 | Client Initialization | CRITICAL | `client-` |
| 2 | Connection Pooling | CRITICAL | `conn-` |
| 2 | TypeScript | HIGH | `ts-` |
| 3 | Schema Design | HIGH | `schema-` |
| 3 | Query Patterns | HIGH | `query-` |
| 4 | Migrations | HIGH | `migrations-` |
| 4 | Error Handling | MEDIUM-HIGH | `error-` |
| 5 | Performance | CRITICAL | `perf-` |
| 5 | Performance | HIGH | `perf-` |
| 6 | Security | CRITICAL | `security-` |
| 6 | Framework Integration | HIGH | `framework-` |

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
- `references/sdk/perf-queries.md`
- `references/sdk/perf-realtime.md`

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

**Client Initialization** (`client-`):
- `references/sdk/client-browser.md`
- `references/sdk/client-config.md`
- `references/sdk/client-server.md`

**Error Handling** (`error-`):
- `references/sdk/error-handling.md`

**Framework Integration** (`framework-`):
- `references/sdk/framework-nextjs.md`

**Query Patterns** (`query-`):
- `references/sdk/query-crud.md`
- `references/sdk/query-filters.md`
- `references/sdk/query-joins.md`
- `references/sdk/query-rpc.md`

**TypeScript** (`ts-`):
- `references/sdk/ts-generation.md`
- `references/sdk/ts-usage.md`

---

*31 reference files across 12 categories*