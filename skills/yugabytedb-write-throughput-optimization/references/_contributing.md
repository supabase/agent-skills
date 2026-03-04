# Writing Guidelines for YugabyteDB References

Guidelines for creating effective YugabyteDB best practice references that work well with AI agents and LLMs.

## Key Principles

### 1. Concrete Transformation Patterns

Show exact SQL rewrites. Avoid philosophical advice.

**Good:** "Use `(yb_hash_code(col) % N) ASC` prefix instead of bare `col ASC`"
**Bad:** "Design good distributed indexes"

### 2. Error-First Structure

Always show the problematic pattern first, then the solution. This trains agents to recognize anti-patterns.

```markdown
**Incorrect (hot tablet from monotonic inserts):** [bad example]

**Correct (bucket-distributed writes):** [good example]
```

### 3. Quantified Impact

Include specific metrics from EXPLAIN ANALYZE output. Helps agents prioritize fixes.

**Good:** "3x write throughput", "2.4ms with merge streams", "0 heap fetches"
**Bad:** "Faster", "Better distributed", "More scalable"

### 4. Self-Contained Examples

Examples should be complete and runnable. Include CREATE TABLE if context is needed.

```sql
CREATE TABLE events (
  id serial PRIMARY KEY,
  "timestamp" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX ON events (
  (yb_hash_code("timestamp") % 3) ASC,
  "timestamp" ASC
) SPLIT AT VALUES ((1), (2));
```

### 5. Semantic Naming

Use meaningful table/column names. Names carry intent for LLMs.

**Good:** `events`, `timestamp`, `key_id`, `audit_log`
**Bad:** `te`, `col1`, `field`, `t1`

### 6. Include EXPLAIN Output

YugabyteDB-specific EXPLAIN features like `DIST`, `Merge Streams`, and `Storage Rows Scanned` are critical for demonstrating impact.

```sql
EXPLAIN (ANALYZE, COSTS OFF, TIMING ON, DIST)
SELECT ...
```

---

## Impact Level Guidelines

| Level | Improvement | Use When |
|-------|-------------|----------|
| **CRITICAL** | 3-10x throughput | Hot tablets, write concentration, single-node bottleneck |
| **HIGH** | 2-5x | Wrong index type, missing bucket prefix, no tablet pre-splitting |
| **MEDIUM-HIGH** | 1.5-3x | Suboptimal access patterns, missing covering columns |
| **MEDIUM** | 1.2-2x | Planner tuning, configuration optimization |
| **LOW-MEDIUM** | 1.1-1.5x | Edge cases, advanced patterns |

---

## Review Checklist

Before submitting a reference:

- [ ] Title is clear and action-oriented
- [ ] Impact level matches the scalability gain
- [ ] impactDescription includes quantification
- [ ] Explanation is concise (1-2 sentences)
- [ ] Has at least 1 **Incorrect** SQL example
- [ ] Has at least 1 **Correct** SQL example
- [ ] SQL uses semantic naming
- [ ] Comments explain _why_, not _what_
- [ ] EXPLAIN output included where applicable
- [ ] YugabyteDB version noted if feature-specific
- [ ] Reference links included
