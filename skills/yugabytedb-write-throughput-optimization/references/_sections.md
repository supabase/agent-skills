# Section Definitions

This file defines the rule categories for YugabyteDB write throughput optimization. Rules are automatically assigned to sections based on their filename prefix.

---

## 1. Write Distribution (write)
**Impact:** CRITICAL
**Description:** Hot tablet avoidance, bucket-based sharding, tablet pre-splitting. The most critical factor for write scalability in distributed SQL — monotonic inserts on range-sharded keys concentrate all writes into a single tablet.

## 2. Index Design (index)
**Impact:** HIGH
**Description:** Index type selection (HASH vs RANGE vs BUCKET+RANGE), covering indexes with bucket prefixes, and composite key design. Foundation for balancing write distribution with read performance.

## 3. Query Planning (query)
**Impact:** HIGH
**Description:** YugabyteDB planner optimizations for merge-stream execution, derived ScalarArrayOps, and cost-based optimizer settings that enable globally ordered results from bucket-sharded indexes without application changes.

## 4. Access Patterns (access)
**Impact:** MEDIUM-HIGH
**Description:** Keyset pagination, LIMIT queries, and range scans on bucket-sharded indexes. Patterns for efficiently retrieving ordered subsets from distributed data.
