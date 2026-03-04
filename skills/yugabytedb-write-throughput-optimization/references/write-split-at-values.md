---
title: Pre-Split Bucket Indexes with SPLIT AT VALUES
impact: HIGH
impactDescription: Immediate even distribution from first insert instead of waiting for auto-splitting
tags: split, tablets, pre-split, distribution, ddl
---

## Pre-Split Bucket Indexes with SPLIT AT VALUES

When creating a bucket-prefixed index, use `SPLIT AT VALUES` to pre-create one tablet per bucket value. Without pre-splitting, all data initially lands in a single tablet until YugabyteDB auto-splits it — temporarily recreating the hotspot you're trying to avoid.

**Incorrect (no pre-splitting — temporary hotspot):**

```sql
-- All data starts in one tablet until auto-split triggers
CREATE INDEX events_timestamp_idx
  ON events ((yb_hash_code("timestamp") % 3) ASC, "timestamp" ASC);
```

**Correct (pre-split — immediate distribution):**

```sql
-- 3 buckets (0, 1, 2) → split at boundaries 1 and 2 → 3 tablets from the start
CREATE INDEX events_timestamp_idx
  ON events ((yb_hash_code("timestamp") % 3) ASC, "timestamp" ASC)
  SPLIT AT VALUES ((1), (2));
```

### Sizing the SPLIT Clause

The number of split points is always `N - 1` where N is the modulo:

```sql
-- 3 buckets → 2 split points
SPLIT AT VALUES ((1), (2));

-- 6 buckets → 5 split points
SPLIT AT VALUES ((1), (2), (3), (4), (5));

-- 9 buckets → 8 split points
SPLIT AT VALUES ((1), (2), (3), (4), (5), (6), (7), (8));
```

### When to Use

- Always use `SPLIT AT VALUES` with the bucket pattern for write-heavy tables
- The SPLIT clause is technically optional but strongly recommended
- Without it, you rely on auto-splitting which adds latency during the initial load

Reference: [YugabyteDB CREATE INDEX](https://docs.yugabyte.com/stable/api/ysql/the-sql-language/statements/ddl_create_index/)
