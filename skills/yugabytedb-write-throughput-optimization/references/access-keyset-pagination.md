---
title: Use Keyset Pagination with Bucket Indexes for Efficient Paging
impact: MEDIUM-HIGH
impactDescription: 2-3ms per page with global ordering, 0 heap fetches, 24 kB peak memory
tags: keyset-pagination, cursor, limit, paging, bucket
---

## Use Keyset Pagination with Bucket Indexes for Efficient Paging

Keyset (cursor-based) pagination uses a WHERE clause to skip past already-seen rows instead of OFFSET. Combined with bucket indexes and merge-stream execution, this delivers efficient, globally ordered pagination on distributed data.

**Incorrect (OFFSET-based pagination — scans and discards rows):**

```sql
-- Page 100 scans and discards 99,000 rows
SELECT * FROM events
WHERE key_id = 123
ORDER BY "timestamp" ASC, id ASC
LIMIT 1000 OFFSET 99000;
```

**Correct (keyset pagination — seeks directly to the cursor):**

```sql
-- First page
SELECT * FROM events
WHERE key_id = 123
  AND "timestamp" >= '2025-01-01'
ORDER BY "timestamp" ASC, id ASC
LIMIT 1000;

-- Next page: use the last row's (timestamp, id) as cursor
SELECT * FROM events
WHERE key_id = 123
  AND "timestamp" >= '2025-05-05 08:00:00'
  AND ("timestamp", id) > ('2025-05-05 08:00:00', 42)
ORDER BY "timestamp" ASC, id ASC
LIMIT 1000;
```

With a composite bucket index:

```sql
CREATE INDEX events_key_timestamp ON events (
  (yb_hash_code("timestamp") % 3) ASC,
  key_id,
  "timestamp" ASC,
  id
) SPLIT AT VALUES ((1), (2));
```

The planner produces an efficient merge-stream plan:

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

### Why This Works

1. **Merge streams** deliver globally ordered results without a sort node
2. **LIMIT** stops scanning as soon as 1000 rows are found (scans ~1000 per bucket × 3 buckets = ~3000 rows)
3. **Keyset cursor** `(timestamp, id) >` seeks directly to the right position in each bucket
4. **Index-only scan** returns results with 0 heap fetches

Reference: [Lift-and-Shift of High Write-Throughput Apps](https://www.yugabyte.com/blog/lift-and-shift-high-write-throughput-apps/)
