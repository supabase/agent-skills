# Supabase Postgres Best Practices

## Structure

```
supabase-postgres-best-practices/
  SKILL.md       # Main skill file
  AGENTS.md      # This file (CLAUDE.md is a symlink)
  references/    # Detailed reference files
```

## Usage

1. Browse `references/` for detailed documentation on specific topics
2. Reference files are loaded on-demand - read only what you need

Comprehensive performance optimization guide for Postgres, maintained by Supabase. Contains rules across 8 categories, prioritized by impact to guide automated query optimization and schema design.

## When to Apply

Reference these guidelines when:
- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Optimizing for Postgres-specific features
- Working with Row-Level Security (RLS)

## Rule Categories by Priority

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

## How to Use

Read individual rule files for detailed explanations and SQL examples:

```
references/query-missing-indexes.md
references/schema-partial-indexes.md
references/_sections.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect SQL example with explanation
- Correct SQL example with explanation
- Optional EXPLAIN output or metrics
- Additional context and references
- Supabase-specific notes (when applicable)

## References

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security

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
- `references/schema-constraints.md`
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

*31 reference files across 8 categories*