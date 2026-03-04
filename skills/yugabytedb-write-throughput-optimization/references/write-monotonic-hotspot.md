---
title: Avoid Hot Tablets from Monotonic Inserts on Range-Sharded Keys
impact: CRITICAL
impactDescription: Eliminates single-node write bottleneck, enabling linear write scalability across all nodes
tags: hot-tablet, monotonic, timestamp, serial, range-shard, write-throughput, hotspot
---

## Avoid Hot Tablets from Monotonic Inserts on Range-Sharded Keys

In YugabyteDB, data is distributed across tablets (shards). When an ASC/DESC range-sharded index receives monotonic inserts (timestamps via `NOW()`, auto-increment sequences, or date-based IDs), all new writes append to the end of the range — concentrating into a single tablet and overloading one node.

**Incorrect (all writes go to one tablet):**

```sql
CREATE TABLE events (
  id serial PRIMARY KEY,
  "timestamp" timestamptz NOT NULL DEFAULT NOW(),
  data jsonb
);

-- Range index on monotonic column — creates hot tablet
CREATE INDEX events_timestamp_idx ON events ("timestamp" ASC);

-- Every INSERT with NOW() appends to the last tablet
INSERT INTO events ("timestamp", data) VALUES (NOW(), '{"type": "click"}');
```

This causes:

- Write throughput limited to a single node
- Increased latency under load
- Unbalanced resource usage and compaction pressure
- Uneven tablet sizes over time

**Correct (distribute writes with bucket prefix):**

```sql
CREATE TABLE events (
  id serial PRIMARY KEY,
  "timestamp" timestamptz NOT NULL DEFAULT NOW(),
  data jsonb
);

-- Bucket prefix distributes writes across 3 tablets while preserving order within each
CREATE INDEX events_timestamp_idx ON events (
  (yb_hash_code("timestamp") % 3) ASC,
  "timestamp" ASC
) SPLIT AT VALUES ((1), (2));

-- Writes now distributed evenly across all 3 nodes
INSERT INTO events ("timestamp", data) VALUES (NOW(), '{"type": "click"}');
```

This pattern applies whenever the first high-cardinality column in an index key is monotonically increasing — even if it is the second or third key position. For example, this index is still a hotspot because `timestamp` is the first high-cardinality column and `type` has low cardinality:

```sql
-- Still a hotspot — ~90% of writes may go to one node
CREATE INDEX events_hotspot ON events ("type" ASC, "timestamp" ASC)
  WHERE type IN ('SUCCESS', 'FAILED');
```

Reference: [Lift-and-Shift of High Write-Throughput Apps](https://www.yugabyte.com/blog/lift-and-shift-high-write-throughput-apps/)
