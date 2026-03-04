---
title: Efficient LIMIT Queries on Bucket Indexes via Merge Streams
impact: MEDIUM-HIGH
impactDescription: "Latest N items" in 2.4ms scanning only N×buckets rows instead of full table
tags: limit, top-n, latest, activity-feed, audit-log, time-series
---

## Efficient LIMIT Queries on Bucket Indexes via Merge Streams

"Latest N items" queries (activity feeds, audit logs, dashboards) are extremely common in OLTP applications. With bucket indexes and merge-stream execution, YugabyteDB returns the top-N globally ordered rows by scanning only ~N rows per bucket — not the entire table.

**Incorrect (full scan + sort for top-N):**

```sql
-- Without merge streams: scans ALL matching rows, sorts, then takes 1000
SELECT "timestamp" FROM events
WHERE "timestamp" >= '2025-01-01'
  AND "timestamp" <  '2026-01-01'
ORDER BY "timestamp"
LIMIT 1000;

-- Plan: Sort (10M rows) -> Limit 1000 — slow, memory-intensive
```

**Correct (merge-stream LIMIT — scans only ~3000 rows):**

```sql
-- With planner optimizations enabled
SET yb_enable_derived_saops = true;
SET yb_max_saop_merge_streams = 64;
SET yb_enable_cbo = on;

SELECT "timestamp" FROM events
WHERE "timestamp" >= '2025-01-01'
  AND "timestamp" <  '2026-01-01'
ORDER BY "timestamp"
LIMIT 1000;
```

```
Limit (actual time=1.682..2.258 rows=1000 loops=1)
  ->  Index Only Scan using events_timestamp_idx on events
        Index Cond: (("timestamp" >= '2025-01-01')
          AND ("timestamp" < '2026-01-01')
          AND (((yb_hash_code("timestamp") % 3)) = ANY ('{0,1,2}'::integer[])))
        Merge Sort Key: "timestamp"
        Merge Stream Key: (yb_hash_code("timestamp") % 3)
        Merge Streams: 3
        Storage Index Rows Scanned: 3000
Execution Time: 2.402 ms
```

### Why 3000 Rows for LIMIT 1000?

With 3 buckets, the merge-stream executor reads up to LIMIT rows from each bucket stream (1000 × 3 = 3000), then merges them to find the globally-ordered top 1000. This is O(N × buckets) instead of O(total_rows).

### Common Use Cases

| Pattern | Query Shape |
|---------|-------------|
| Activity feed | `ORDER BY created_at DESC LIMIT 50` |
| Audit log | `WHERE entity_id = X ORDER BY timestamp DESC LIMIT 100` |
| Dashboard | `WHERE timestamp >= NOW() - INTERVAL '1 hour' ORDER BY timestamp LIMIT 1000` |
| Time-series latest | `ORDER BY timestamp DESC LIMIT 1` |

All benefit from the bucket + merge-stream pattern.

Reference: [Lift-and-Shift of High Write-Throughput Apps](https://www.yugabyte.com/blog/lift-and-shift-high-write-throughput-apps/)
