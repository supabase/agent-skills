---
name: yugabytedb-write-throughput-optimization
description: >
  YugabyteDB write throughput optimization and index design for distributed SQL.
  Use this skill when writing, reviewing, or optimizing SQL for YugabyteDB,
  especially when dealing with monotonic inserts (timestamps, sequences),
  high write-throughput tables, hot tablet avoidance, bucket-based sharding,
  or lift-and-shift of PostgreSQL apps to YugabyteDB.
license: MIT
metadata:
  author: yugabyte
  version: "1.0.0"
  organization: Yugabyte
  date: March 2026
  abstract: >
    Index design and write distribution guide for YugabyteDB, a distributed
    PostgreSQL-compatible database. Covers the bucket-based sharding pattern
    using yb_hash_code() to eliminate write hotspots from monotonic inserts
    while preserving globally ordered reads. Based on YugabyteDB 2025.2.1
    planner optimizations that enable merge-stream execution without
    application changes. Contains rules across 4 categories prioritized by
    impact, with SQL examples, EXPLAIN ANALYZE output, and practical guidance
    for lift-and-shift migrations from PostgreSQL.
---

# YugabyteDB Write Throughput Optimization

Index design and write distribution guide for YugabyteDB (distributed PostgreSQL). Eliminates write hotspots from monotonic inserts while preserving globally ordered reads — enabling true lift-and-shift of high-write-throughput applications.

## When to Apply

Reference these guidelines when:

- Designing primary keys or indexes for YugabyteDB tables
- Migrating high-write-throughput PostgreSQL apps to YugabyteDB
- Troubleshooting hot tablets or uneven write distribution
- Working with timestamp-ordered inserts, sequences, or time-series data
- Implementing "latest N items" queries (activity feeds, audit logs)
- Choosing between HASH, RANGE, and bucket-based sharding strategies
- Optimizing ORDER BY / LIMIT queries on distributed indexes

## Key Concept: The Bucket Pattern

YugabyteDB distributes data across tablets. Monotonic inserts (e.g., `NOW()` timestamps, auto-increment IDs) on range-sharded indexes concentrate all writes into a single tablet, creating hotspots.

The **bucket pattern** adds a low-cardinality prefix using `yb_hash_code(column) % N` to distribute writes across N tablets while preserving range ordering within each bucket:

```sql
-- Instead of this (hotspot):
CREATE INDEX ON events ("timestamp" ASC);

-- Use this (distributed + ordered):
CREATE INDEX ON events (
  (yb_hash_code("timestamp") % 3) ASC,
  "timestamp" ASC
) SPLIT AT VALUES ((1), (2));
```

With YugabyteDB 2025.2.1 planner optimizations (`yb_enable_derived_saops`, `yb_max_saop_merge_streams`), the query planner automatically merges ordered streams from each bucket — delivering globally ordered results **with no SQL or application changes**.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Write Distribution | CRITICAL | `write-` |
| 2 | Index Design | HIGH | `index-` |
| 3 | Query Planning | HIGH | `query-` |
| 4 | Access Patterns | MEDIUM-HIGH | `access-` |

## How to Use

Read individual rule files for detailed explanations and SQL examples:

```
references/write-monotonic-hotspot.md
references/write-bucket-pattern.md
references/index-type-selection.md
references/_sections.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect SQL example with explanation
- Correct SQL example with explanation
- EXPLAIN ANALYZE output demonstrating the improvement
- Additional context, trade-offs, and sizing guidance

## References

- https://www.yugabyte.com/blog/lift-and-shift-high-write-throughput-apps/
- https://docs.yugabyte.com/stable/explore/indexes-constraints/
- https://docs.yugabyte.com/stable/api/ysql/the-sql-language/statements/ddl_create_index/
- https://docs.yugabyte.com/stable/develop/quality-of-service/write-heavy-workloads/
