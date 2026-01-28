---
title: Database Inspection and Diagnostics
impact: MEDIUM
impactDescription: Monitor and diagnose database performance issues
tags: cli, supabase, inspect, diagnostics, monitoring, performance
---

## Inspect Commands

Database inspection commands that provide statistics and diagnostics for monitoring performance, identifying issues, and optimizing database behavior. All inspect subcommands share the same three targeting flags.

### Common Flags

All `supabase inspect db *` commands accept:

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | Inspect the database at the specified connection string (must be percent-encoded) |
| `--linked` | Optional | Inspect the linked project |
| `--local` | Optional | Inspect the local database |

---

### `supabase inspect db`

Parent command for inspecting database statistics.

**Subcommands:** `bloat`, `blocking`, `calls`, `db-stats`, `index-stats`, `locks`, `long-running-queries`, `outliers`, `replication-slots`, `role-stats`, `table-stats`, `traffic-profile`, `vacuum-stats`

---

### `supabase inspect db bloat`

Display estimation of table "bloat" caused by Postgres MVCC. When data is updated or deleted, new rows are created and old rows become dead tuples. Bloat indicates wasted space that can be reclaimed by VACUUM.

**Usage:**

```bash
supabase inspect db bloat
```

---

### `supabase inspect db blocking`

Show queries that are currently holding locks and blocking other queries from executing. Useful for identifying deadlocks and long-held locks.

**Usage:**

```bash
supabase inspect db blocking
```

---

### `supabase inspect db calls`

Display statements ordered by the number of times they have been called (from `pg_stat_statements`). Useful for identifying frequently executed queries that may benefit from optimization.

**Usage:**

```bash
supabase inspect db calls
```

---

### `supabase inspect db db-stats`

Display general database statistics.

**Usage:**

```bash
supabase inspect db db-stats
```

---

### `supabase inspect db index-stats`

Display statistics about index usage, including index size, number of scans, and rows fetched. Useful for identifying unused or underperforming indexes.

**Usage:**

```bash
supabase inspect db index-stats
```

---

### `supabase inspect db locks`

Display queries that have taken out exclusive locks on relations. Exclusive locks prevent other operations and can cause queries to hang.

Use `SELECT pg_cancel_backend(PID)` to cancel a blocking query, or `SELECT pg_terminate_backend(PID)` to force-stop it.

**Usage:**

```bash
supabase inspect db locks
```

---

### `supabase inspect db long-running-queries`

Display queries running longer than 5 minutes, ordered by duration descending. Long-running queries can prevent DDL statements from completing and block vacuum from updating `relfrozenxid`.

**Usage:**

```bash
supabase inspect db long-running-queries
```

---

### `supabase inspect db outliers`

Display statements ordered by total execution time (from `pg_stat_statements`). Shows the statement, total execution time, proportion of total execution time, call count, and synchronous I/O time.

Queries with high total execution time but low call count should be investigated. Queries spending significant time on synchronous I/O should also be reviewed.

**Usage:**

```bash
supabase inspect db outliers
```

---

### `supabase inspect db replication-slots`

Display information about replication slots, including slot name, active status, and WAL lag.

**Usage:**

```bash
supabase inspect db replication-slots
```

---

### `supabase inspect db role-stats`

Display statistics per database role, including connections, queries, and resource usage.

**Usage:**

```bash
supabase inspect db role-stats
```

---

### `supabase inspect db table-stats`

Display statistics for database tables including size, row count, and sequential vs. index scans.

**Usage:**

```bash
supabase inspect db table-stats
```

---

### `supabase inspect db traffic-profile`

Display database traffic profile showing read vs. write operations distribution.

**Usage:**

```bash
supabase inspect db traffic-profile
```

---

### `supabase inspect db vacuum-stats`

Display vacuum statistics for database tables, including last vacuum time, dead tuples, and autovacuum status. Useful for monitoring vacuum performance and identifying tables that need manual vacuuming.

**Usage:**

```bash
supabase inspect db vacuum-stats
```

---

### `supabase inspect report`

Generate a comprehensive report of all database inspection statistics. Optionally save output as CSV files.

**Usage:**

```bash
supabase inspect report [flags]
```

**Additional Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--output-dir <string>` | Optional | Path to save CSV files in |

Reference: [Supabase CLI - Inspect](https://supabase.com/docs/reference/cli/supabase-inspect-db)
