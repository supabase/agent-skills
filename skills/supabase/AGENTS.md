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
| 1 | Row Level Security | CRITICAL | `rls-` |
| 2 | Connection Pooling | CRITICAL | `conn-` |
| 3 | Schema Design | HIGH | `schema-` |
| 4 | Migrations | HIGH | `migrations-` |
| 5 | Performance | CRITICAL | `perf-` |
| 6 | Security | CRITICAL | `security-` |

Reference files are named `{prefix}-{topic}.md` (e.g., `query-missing-indexes.md`).

## Available References

**Connection Pooling** (`conn-`):
- `references/conn-pooling.md`

**Migrations** (`migrations-`):
- `references/migrations-diff.md`
- `references/migrations-idempotent.md`
- `references/migrations-testing.md`

**Performance** (`perf-`):
- `references/perf-indexes.md`
- `references/perf-query-optimization.md`

**Row Level Security** (`rls-`):
- `references/rls-common-mistakes.md`
- `references/rls-mandatory.md`
- `references/rls-performance.md`
- `references/rls-policy-types.md`
- `references/rls-views.md`

**Schema Design** (`schema-`):
- `references/schema-auth-fk.md`
- `references/schema-extensions.md`
- `references/schema-jsonb.md`
- `references/schema-realtime.md`
- `references/schema-timestamps.md`

**Security** (`security-`):
- `references/security-functions.md`
- `references/security-service-role.md`

---

*18 reference files across 6 categories*