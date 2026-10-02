---
name: supabase-postgres-best-practices
description: "Postgres best practices maintained by Supabase, for Postgres running anywhere. Load this skill BEFORE writing or changing anything that lives in a Postgres database: creating or altering tables and columns (including choosing column types), schema design, migrations and declarative schema files, RLS policies and the tests that verify them, indexes, triggers, database functions, queues and scheduled jobs (pg_cron, pgmq), vector/semantic search (pgvector), and restoring dumps (pg_restore) or importing data. Also load it when diagnosing slow queries, high CPU, timeouts, EXPLAIN plans, connection exhaustion, locking, bloat, or rows visible to the wrong user or tenant. This is not just a performance guide — schema, migration, security, and SQL authoring tasks need these rules too, even for a one-column change or a single query."
license: MIT
metadata:
  author: supabase
  version: "1.1.1"
  organization: Supabase
  date: January 2026
  abstract: Comprehensive Postgres performance optimization guide for developers using Supabase and Postgres. Contains performance rules across 8 categories, prioritized by impact from critical (query performance, connection management) to incremental (advanced features). Each rule includes detailed explanations, incorrect vs. correct SQL examples, query plan analysis, and specific performance metrics to guide automated optimization and code generation.
---

# Supabase Postgres Best Practices

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

Choose the rule that matches the task, then read that reference file for detailed explanations and SQL examples.

### 1. Query Performance — CRITICAL

| Rule | Summary |
|------|---------|
| [query-missing-indexes](references/query-missing-indexes.md) | Add indexes on WHERE and JOIN columns |
| [query-partial-indexes](references/query-partial-indexes.md) | Use partial indexes for filtered queries |
| [query-composite-indexes](references/query-composite-indexes.md) | Create composite indexes for multi-column queries |
| [query-covering-indexes](references/query-covering-indexes.md) | Use covering indexes to avoid table lookups |
| [query-index-types](references/query-index-types.md) | Choose the right index type for your data |

### 2. Connection Management — CRITICAL

| Rule | Summary |
|------|---------|
| [conn-pooling](references/conn-pooling.md) | Use connection pooling for all applications |
| [conn-limits](references/conn-limits.md) | Set appropriate connection limits |
| [conn-idle-timeout](references/conn-idle-timeout.md) | Configure idle connection timeouts |
| [conn-prepared-statements](references/conn-prepared-statements.md) | Use prepared statements correctly with pooling |

### 3. Security & RLS — CRITICAL

| Rule | Summary |
|------|---------|
| [security-rls-basics](references/security-rls-basics.md) | Enable Row Level Security for multi-tenant data |
| [security-rls-performance](references/security-rls-performance.md) | Optimize RLS policies for performance |
| [security-privileges](references/security-privileges.md) | Apply the principle of least privilege |

### 4. Schema Design — HIGH

| Rule | Summary |
|------|---------|
| [schema-data-types](references/schema-data-types.md) | Choose appropriate data types |
| [schema-primary-keys](references/schema-primary-keys.md) | Select an optimal primary key strategy |
| [schema-foreign-key-indexes](references/schema-foreign-key-indexes.md) | Index foreign key columns |
| [schema-constraints](references/schema-constraints.md) | Add constraints safely in migrations |
| [schema-partitioning](references/schema-partitioning.md) | Partition large tables for better performance |
| [schema-lowercase-identifiers](references/schema-lowercase-identifiers.md) | Use lowercase identifiers for compatibility |

### 5. Concurrency & Locking — MEDIUM-HIGH

| Rule | Summary |
|------|---------|
| [lock-short-transactions](references/lock-short-transactions.md) | Keep transactions short to reduce lock contention |
| [lock-skip-locked](references/lock-skip-locked.md) | Use SKIP LOCKED for non-blocking queue processing |
| [lock-advisory](references/lock-advisory.md) | Use advisory locks for application-level locking |
| [lock-deadlock-prevention](references/lock-deadlock-prevention.md) | Prevent deadlocks with consistent lock ordering |

### 6. Data Access Patterns — MEDIUM

| Rule | Summary |
|------|---------|
| [data-n-plus-one](references/data-n-plus-one.md) | Eliminate N+1 queries with batch loading |
| [data-pagination](references/data-pagination.md) | Use cursor-based pagination instead of OFFSET |
| [data-upsert](references/data-upsert.md) | Use UPSERT for insert-or-update operations |
| [data-batch-inserts](references/data-batch-inserts.md) | Batch INSERT statements for bulk data |

### 7. Monitoring & Diagnostics — LOW-MEDIUM

| Rule | Summary |
|------|---------|
| [monitor-explain-analyze](references/monitor-explain-analyze.md) | Use EXPLAIN ANALYZE to diagnose slow queries |
| [monitor-pg-stat-statements](references/monitor-pg-stat-statements.md) | Enable pg_stat_statements for query analysis |
| [monitor-vacuum-analyze](references/monitor-vacuum-analyze.md) | Maintain table statistics with VACUUM and ANALYZE |

### 8. Advanced Features — LOW

| Rule | Summary |
|------|---------|
| [advanced-jsonb-indexing](references/advanced-jsonb-indexing.md) | Index JSONB columns for efficient querying |
| [advanced-full-text-search](references/advanced-full-text-search.md) | Use tsvector for full-text search |

See [reference section definitions](references/_sections.md) for category metadata.

Each rule file contains:
- Brief explanation of why it matters
- Incorrect SQL example with explanation
- Correct SQL example with explanation
- Optional EXPLAIN output or metrics
- Additional context and references
- Supabase-specific notes when applicable

## References

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security
