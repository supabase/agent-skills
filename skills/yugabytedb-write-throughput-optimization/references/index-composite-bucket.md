---
title: Design Composite Bucket Indexes for Multi-Column Access Patterns
impact: HIGH
impactDescription: Supports equality + range + ordering in a single distributed index
tags: composite-index, multi-column, bucket, key-design
---

## Design Composite Bucket Indexes for Multi-Column Access Patterns

When queries filter on multiple columns (e.g., `WHERE key_id = X ORDER BY timestamp`), place the bucket prefix first, then equality columns, then range/ordering columns. This layout supports write distribution, equality filtering, and ordered range scans simultaneously.

**Incorrect (no bucket — hotspot on timestamp):**

```sql
CREATE INDEX events_key_timestamp ON events (
  key_id,
  "timestamp" ASC,
  id
);

-- Writes on key_id=123 still concentrate in one tablet range
```

**Correct (bucket prefix with composite key):**

```sql
CREATE INDEX events_key_timestamp ON events (
  (yb_hash_code("timestamp") % 3) ASC,
  key_id,
  "timestamp" ASC,
  id
) SPLIT AT VALUES ((1), (2));
```

This supports queries with equality on `key_id` and range/ordering on `timestamp`:

```sql
EXPLAIN (ANALYZE, COSTS OFF, TIMING ON)
SELECT *
FROM events
WHERE key_id = 123
  AND "timestamp" >= '2025-05-05 08:00:00'
  AND ("timestamp", id) > ('2025-05-05 08:00:00', 1)
ORDER BY "timestamp" ASC, id ASC
LIMIT 1000;
```

```
Limit (actual time=2.059..2.633 rows=1000 loops=1)
  ->  Index Only Scan using events_key_timestamp on events
        Index Cond: ((key_id = 123)
          AND ("timestamp" >= '2025-05-05 08:00:00+00')
          AND (ROW("timestamp", id) > ROW('2025-05-05 08:00:00+00', 1))
          AND (((yb_hash_code("timestamp") % 3)) = ANY ('{0,1,2}'::integer[])))
        Merge Sort Key: "timestamp", id
        Merge Stream Key: (yb_hash_code("timestamp") % 3)
        Merge Streams: 3
        Heap Fetches: 0
Planning Time: 0.139 ms
Execution Time: 2.777 ms
Peak Memory Usage: 24 kB
```

### Column Order in Composite Bucket Indexes

1. **Bucket expression** — `(yb_hash_code(col) % N) ASC` — always first
2. **Equality columns** — columns used with `=` in WHERE (e.g., `key_id`)
3. **Range/ordering columns** — columns used with `>`, `<`, `>=`, `BETWEEN`, `ORDER BY`
4. **Row ID or unique column** — for keyset pagination tiebreakers

Reference: [Lift-and-Shift of High Write-Throughput Apps](https://www.yugabyte.com/blog/lift-and-shift-high-write-throughput-apps/)
