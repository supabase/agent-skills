---
title: Choose the Right Index Sharding Strategy for Your Access Pattern
impact: HIGH
impactDescription: Correct index type eliminates full-table scans and write hotspots simultaneously
tags: hash, range, bucket, index-type, sharding, access-pattern
---

## Choose the Right Index Sharding Strategy for Your Access Pattern

YugabyteDB supports four index sharding strategies, each with different trade-offs for ordering, range scans, and write distribution. Choosing the wrong type forces unnecessary full scans or creates write hotspots.

| Strategy | Syntax | Ordering | Range Scan | Equality | Write Distribution |
|----------|--------|----------|------------|----------|--------------------|
| RANGE | `(col ASC)` | Yes | Yes | Yes | Poor for monotonic |
| HASH | `((col) HASH)` | No | No | Yes | Excellent |
| HASH + RANGE | `((col1) HASH, col2 ASC)` | Yes (needs col1 =) | Yes (needs col1 =) | Yes | Good on col1 |
| BUCKET + RANGE | `((expr) ASC, col ASC)` | Yes | Yes | Yes | Excellent |

**Incorrect (HASH when you need ordering):**

```sql
-- Hash index — cannot produce ordered results
CREATE INDEX events_hash_idx ON events (("timestamp") HASH);

-- This query requires a sort node (expensive)
SELECT * FROM events
WHERE "timestamp" >= '2025-01-01'
ORDER BY "timestamp" LIMIT 100;
```

**Incorrect (RANGE on monotonic column):**

```sql
-- Range index — preserves order but creates write hotspot
CREATE INDEX events_range_idx ON events ("timestamp" ASC);
```

**Correct (BUCKET + RANGE for both):**

```sql
-- Bucket prefix — distributes writes AND preserves ordering via merge streams
CREATE INDEX events_bucket_idx ON events (
  (yb_hash_code("timestamp") % 3) ASC,
  "timestamp" ASC
) SPLIT AT VALUES ((1), (2));

-- Ordered query works without sort node
SELECT * FROM events
WHERE "timestamp" >= '2025-01-01'
ORDER BY "timestamp" LIMIT 100;
```

### Decision Guide

- **Point lookups only** (e.g., `WHERE id = X`) → use HASH
- **Range scans + equality filter** (e.g., `WHERE user_id = X ORDER BY created_at`) → use HASH + RANGE
- **Range scans without equality filter on a high-write column** → use BUCKET + RANGE
- **Low-write or non-monotonic range column** → plain RANGE is fine

Reference: [Lift-and-Shift of High Write-Throughput Apps](https://www.yugabyte.com/blog/lift-and-shift-high-write-throughput-apps/)
