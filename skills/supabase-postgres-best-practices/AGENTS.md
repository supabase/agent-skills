# supabase-postgres-best-practices

> **Note:** `CLAUDE.md` is a symlink to this file.

## Overview

Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations.

## Structure

```
supabase-postgres-best-practices/
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
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

Reference files are named `{prefix}-{topic}.md` (e.g., `query-missing-indexes.md`).

## Available References

**Advanced Features** (`advanced-`):
- `references/advanced-full-text-search.md`
- `references/advanced-jsonb-indexing.md`

**Connection Management** (`conn-`):
- `references/conn-idle-timeout.md`
- `references/conn-limits.md`
- `references/conn-pooling.md`
- `references/conn-prepared-statements.md`

**Data Access Patterns** (`data-`):
- `references/data-batch-inserts.md`
- `references/data-n-plus-one.md`
- `references/data-pagination.md`
- `references/data-upsert.md`

**Concurrency & Locking** (`lock-`):
- `references/lock-advisory.md`
- `references/lock-deadlock-prevention.md`
- `references/lock-short-transactions.md`
- `references/lock-skip-locked.md`

**Monitoring & Diagnostics** (`monitor-`):
- `references/monitor-explain-analyze.md`
- `references/monitor-pg-stat-statements.md`
- `references/monitor-vacuum-analyze.md`

**Query Performance** (`query-`):
- `references/query-composite-indexes.md`
- `references/query-covering-indexes.md`
- `references/query-index-types.md`
- `references/query-missing-indexes.md`
- `references/query-partial-indexes.md`

**Schema Design** (`schema-`):
- `references/schema-data-types.md`
- `references/schema-foreign-key-indexes.md`
- `references/schema-lowercase-identifiers.md`
- `references/schema-partitioning.md`
- `references/schema-primary-keys.md`

**Security & RLS** (`security-`):
- `references/security-privileges.md`
- `references/security-rls-basics.md`
- `references/security-rls-performance.md`

---

*30 reference files across 8 categories*