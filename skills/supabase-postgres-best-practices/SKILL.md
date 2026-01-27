---
name: supabase-postgres-best-practices
description: Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations.
license: MIT
metadata:
  author: supabase
  version: "1.1.0"
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

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`

## Runtime Detection

Before applying rules, agents should detect the PostgreSQL environment to ensure compatibility:

### Version Detection

```sql
SELECT version();
-- Example output: PostgreSQL 15.4 on x86_64-pc-linux-gnu
```

Extract the major version number (e.g., "15" from "PostgreSQL 15.4") to check against rule `minVersion` requirements.

### Extension Availability

```sql
SELECT name, installed_version, default_version
FROM pg_available_extensions
WHERE name IN ('pg_stat_statements', 'pgcrypto', 'uuid-ossp', 'postgis')
ORDER BY name;
```

Check if required extensions are available before recommending rules that depend on them.

### Configuration Check

```sql
SELECT name, setting
FROM pg_settings
WHERE name IN ('shared_preload_libraries', 'max_connections', 'work_mem');
```

## Rule Filtering

Only recommend rules where:
- `minVersion` <= detected PostgreSQL version (or minVersion is unset)
- All required `extensions` are available or installable
- The rule is appropriate for the user's deployment context

### Version Compatibility

| Feature | Min Version | Affected Rules |
|---------|-------------|----------------|
| ON CONFLICT (UPSERT) | 9.5 | data-upsert |
| SKIP LOCKED | 9.5 | lock-skip-locked |
| JSONB type | 9.4 | advanced-jsonb-indexing |
| Declarative Partitioning | 10 | schema-partitioning |
| Covering Indexes (INCLUDE) | 11 | query-covering-indexes |

## References

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security
