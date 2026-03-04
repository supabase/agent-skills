---
title: Use yb_hash_code() Bucket Prefix to Distribute Monotonic Writes
impact: CRITICAL
impactDescription: 3-Nx write throughput by distributing inserts across N nodes instead of 1
tags: bucket, yb_hash_code, sharding, write-distribution, modulo, generated-column
---

## Use yb_hash_code() Bucket Prefix to Distribute Monotonic Writes

The bucket pattern adds a low-cardinality prefix using `yb_hash_code(column) % N` to evenly distribute writes across N tablets while preserving range ordering within each bucket. This is the primary solution for monotonic insert hotspots in YugabyteDB.

**Incorrect (single hot tablet):**

```sql
CREATE INDEX events_timestamp_idx
  ON events ("timestamp" ASC) INCLUDE (id);

-- All monotonic inserts concentrate in the last tablet
```

**Correct (N-way distributed writes):**

```sql
CREATE INDEX events_timestamp_idx
  ON events ((yb_hash_code("timestamp") % 3) ASC, "timestamp" ASC) INCLUDE (id)
  SPLIT AT VALUES ((1), (2));

-- Writes distributed across 3 tablets, one per node
```

### Bucket Sizing

- Set the modulo to at least the number of nodes in your cluster
- 3 nodes → `% 3`, 9 nodes → `% 9`
- More buckets = better write distribution, but more merge streams during reads

### Rules for Unique Indexes and Primary Keys

- **Unique index or PK:** the `yb_hash_code()` arguments must be a subset of the unique/PK columns
- **Non-unique index:** the columns inside `yb_hash_code()` don't matter as long as they are deterministic

```sql
-- For a unique index, hash the unique columns
CREATE UNIQUE INDEX events_unique_idx
  ON events ((yb_hash_code(id) % 3) ASC, id ASC);

-- For a non-unique index, hash any deterministic column
CREATE INDEX events_timestamp_idx
  ON events ((yb_hash_code("timestamp") % 3) ASC, "timestamp" ASC);
```

### Alternative: GENERATED Column

You can also use a stored generated column as the bucket:

```sql
ALTER TABLE events ADD COLUMN bucket int
  GENERATED ALWAYS AS (yb_hash_code("timestamp") % 3) STORED;

CREATE INDEX events_bucket_timestamp_idx
  ON events (bucket ASC, "timestamp" ASC);
```

Note: `GENERATED ALWAYS AS ... STORED` requires YugabyteDB 2024.2+.

Reference: [Lift-and-Shift of High Write-Throughput Apps](https://www.yugabyte.com/blog/lift-and-shift-high-write-throughput-apps/)
