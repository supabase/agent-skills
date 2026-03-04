---
title: Clear, Action-Oriented Title (e.g., "Use Bucket Prefix to Distribute Monotonic Writes")
impact: MEDIUM
impactDescription: Quantified benefit (e.g., "3-10x write throughput by eliminating hot tablets")
tags: keyword1, keyword2, keyword3
---

## [Rule Title]

[1-2 sentence explanation of the problem and why it matters in a distributed SQL context. Focus on scalability and performance impact.]

**Incorrect (describe the problem):**

```sql
-- Comment explaining what makes this a hotspot or performance issue
CREATE INDEX ON events ("timestamp" ASC);

-- All monotonic inserts go to the last tablet
INSERT INTO events VALUES (NOW(), ...);
```

**Correct (describe the solution):**

```sql
-- Comment explaining why this distributes writes evenly
CREATE INDEX ON events (
  (yb_hash_code("timestamp") % 3) ASC,
  "timestamp" ASC
) SPLIT AT VALUES ((1), (2));

-- Writes now distributed across 3 tablets
INSERT INTO events VALUES (NOW(), ...);
```

[Optional: EXPLAIN ANALYZE output, sizing guidance, trade-offs]

Reference: [YugabyteDB Docs](https://docs.yugabyte.com/)
