---
name: supabase-postgres-best-practices
description: Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations. Also use when scaffolding a new Supabase project, creating tables, setting up or using a database, or building a backend for the first time.
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

## Reference Loading Guide

Load references based on the task at hand:

| Scenario | Load these first |
|----------|-----------------|
| Scaffolding a new project / creating tables | `schema-primary-keys.md`, `schema-data-types.md`, `conn-pooling.md` |
| Slow queries / performance investigation | `monitor-explain-analyze.md`, `query-missing-indexes.md`, `monitor-pg-stat-statements.md` |
| Too many connections / connection errors | `conn-pooling.md`, `conn-limits.md`, `conn-idle-timeout.md` |
| RLS / access control | `security-rls-basics.md`, `security-rls-performance.md`, `security-privileges.md` |
| Deadlocks / blocking queries | `lock-deadlock-prevention.md`, `lock-short-transactions.md`, `lock-advisory.md` |
| Bulk inserts / data migrations | `data-batch-inserts.md`, `data-upsert.md`, `lock-short-transactions.md` |
| Pagination / large result sets | `data-pagination.md`, `query-missing-indexes.md` |

## How to Use

Read individual rule files for detailed explanations and SQL examples. Each rule file contains:
- Brief explanation of why it matters
- Incorrect SQL example with explanation
- Correct SQL example with explanation
- Optional EXPLAIN output or metrics
- Supabase-specific notes (when applicable)

## References

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security
