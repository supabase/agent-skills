---
title: Understand Merge Stream Execution in EXPLAIN Output
impact: MEDIUM
impactDescription: Verify that bucket indexes produce sorted results without expensive sort nodes
tags: explain, merge-streams, merge-sort-key, merge-stream-key, diagnostics
---

## Understand Merge Stream Execution in EXPLAIN Output

When the planner optimizations are active, EXPLAIN output shows new fields indicating merge-stream execution. Understanding these fields confirms your bucket index is working correctly — delivering globally ordered results without a sort node.

**Incorrect (sort node present — planner not using merge streams):**

```sql
EXPLAIN (ANALYZE, COSTS OFF) SELECT "timestamp" FROM events
WHERE "timestamp" >= '2025-01-01' ORDER BY "timestamp";
```

```
Sort (actual time=5200.000..6100.000 rows=10000000 loops=1)
  Sort Key: "timestamp"
  Sort Method: external merge  Disk: 250000kB
  ->  Index Only Scan using events_timestamp_idx on events
        ...
```

The `Sort` node materializes all 10M rows before sorting — slow and memory-intensive.

**Correct (merge streams — no sort node):**

```sql
SET yb_enable_derived_saops = true;
SET yb_max_saop_merge_streams = 64;
SET yb_enable_cbo = on;
ANALYZE events;

EXPLAIN (ANALYZE, COSTS OFF) SELECT "timestamp" FROM events
WHERE "timestamp" >= '2025-01-01' ORDER BY "timestamp";
```

```
Index Only Scan using events_timestamp_idx on events (actual rows=10000000 loops=1)
  Index Cond: (("timestamp" >= '2025-01-01')
    AND (((yb_hash_code("timestamp") % 3)) = ANY ('{0,1,2}'::integer[])))
  Merge Sort Key: "timestamp"
  Merge Stream Key: (yb_hash_code("timestamp") % 3)
  Merge Streams: 3
```

### Key Fields to Look For

| Field | Meaning |
|-------|---------|
| **Merge Sort Key** | The column(s) used for global ordering across streams |
| **Merge Stream Key** | The expression that defines each stream (the bucket expression) |
| **Merge Streams: N** | Number of parallel ordered streams being merged (should equal your bucket count) |
| **No Sort node** | Confirms merge-stream execution is active |

### Troubleshooting

If you see a Sort node instead of merge streams:

1. Check `SHOW yb_enable_derived_saops` — must be `true`
2. Check `SHOW yb_max_saop_merge_streams` — must be ≥ your bucket count
3. Run `ANALYZE` on the table — CBO needs statistics
4. Verify the index uses `ASC` on the bucket expression (not `HASH`)

Reference: [Lift-and-Shift of High Write-Throughput Apps](https://www.yugabyte.com/blog/lift-and-shift-high-write-throughput-apps/)
