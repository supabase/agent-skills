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
| 1 | Getting Started | CRITICAL | `getting-` |
| 2 | Database | CRITICAL | `db-` |
| 3 | Authentication | CRITICAL | `auth-` |
| 4 | Storage | HIGH | `storage-` |
| 5 | Edge Functions | HIGH | `edge-` |
| 6 | Realtime | MEDIUM-HIGH | `realtime-` |
| 7 | SDK | HIGH | `sdk-` |
| 8 | CLI | CRITICAL | `cli-` |
| 9 | MCP | MEDIUM | `mcp-` |
| 10 | Tooling | MEDIUM | `tooling-` |
| 11 | Vectors | MEDIUM | `vectors-` |

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

---

*18 reference files across 11 categories*