# Database (Postgres)

A five-character `SQLSTATE` names the problem exactly — find it in the `postgres_logs` source (see the SQLSTATE query in [logs-and-evidence.md](logs-and-evidence.md)). This file covers query, schema, and resource failures. **Connection and pooler errors** ("too many connections", `prepared statement already exists`, `CONNECT_TIMEOUT`) are in [connections.md](connections.md). **Query optimization** (indexes, plan tuning) belongs to the **supabase-postgres-best-practices** skill — this file *diagnoses the failure*; it doesn't tune the design.

## Statements & timeouts

### `canceling statement due to statement timeout`
**Cause:** The statement exceeded the role's `statement_timeout`. The dashboard SQL editor also enforces its own hard ~60s cap.
**Fix:** For genuinely long DDL (index build, type change), run it from an external client (`psql`, not the dashboard) over the **session pooler / direct** connection and lift the cap for that session: `set statement_timeout = '0';`. For application queries hitting the timeout, the query itself is too slow — diagnose with `explain analyze` and optimize (postgres-best-practices skill) instead of raising the limit.

### Slow `ALTER TABLE ... TYPE` on a large table
**Cause:** Changing a column type rewrites the whole table under a single-transaction lock.
**Fix:** Avoid the long lock by working in steps: add a new column, backfill it, drop the old, rename — with `set statement_timeout = '0';`.

### Queries hang / appear blocked
**Cause:** Lock contention — one statement waits on a lock another holds.
**Diagnose:** Find the blocker and the blocked query:
```sql
select blocked.pid as blocked_pid, blocked.query as blocked_query,
       blocking.pid as blocking_pid, blocking.query as blocking_query
from pg_stat_activity blocked
join pg_stat_activity blocking on blocking.pid = any(pg_blocking_pids(blocked.pid))
where cardinality(pg_blocking_pids(blocked.pid)) > 0;
```
**Fix:** Let the blocker finish, or, if safe, `select pg_cancel_backend(<blocking_pid>);` (gentle) / `pg_terminate_backend(<blocking_pid>)` (forceful).

## Constraints & sequences

### `23505 duplicate key value violates unique constraint` on a serial/identity column
**Cause:** The sequence fell behind the table's real max id — common after a bulk import or restore that inserted explicit ids.
**Diagnose:** Compare `select max(id) from t;` with `select nextval(pg_get_serial_sequence('public.t','id'));`.
**Fix:** Resync the sequence:
```sql
select setval(pg_get_serial_sequence('public.t','id'), (select max(id) from t));
```

### Gaps in an id sequence
**Not a bug.** Sequences guarantee uniqueness, not contiguity — rollbacks, deletes, and upserts consume values. Avoid building "gapless" sequences; they serialize writes and wreck throughput.

### `NEW` is null inside a trigger function
**Cause:** The trigger is `FOR EACH STATEMENT`; `NEW`/`OLD` exist only for `FOR EACH ROW`.
**Fix:** Recreate the trigger as `FOR EACH ROW`.

### `index row size exceeds btree version 4 maximum ... for index`
**Cause:** A B-tree tuple is too large — a multi-column index or a long text/JSON value.
**Fix:** Split multi-column indexes into single-column ones; for long values, index a hash instead (`create index on t (md5(col));` and query `where md5(col) = md5('...')`) or use GIN/GiST for containment.

## Resources: disk, memory, autovacuum

### Disk didn't shrink after deleting data
**Cause:** Postgres reuses freed space internally but doesn't return it to the OS, and the underlying volume can't shrink in place.
**Fix:** Only a Postgres version upgrade (Dashboard → Database → Settings) reduces the allocation, since it migrates the data to a fresh, smaller disk. Meanwhile new writes reuse the free space.

### Autovacuum stalled / bloat and memory keep climbing
**Cause:** An **inactive replication slot** holds back the xmin horizon, so dead tuples can't be cleaned.
**Diagnose:** `select slot_name, slot_type, active from pg_replication_slots where not active;` and `supabase inspect db vacuum-stats`.
**Fix:** Drop each dead slot: `select pg_drop_replication_slot('<slot_name>');`. Autovacuum resumes afterward.

### High swap / high IO
High swap alone isn't a problem; sustained high active RAM is. It usually traces to missing indexes (sequential scans), too little cache, heavy RLS joins, or bloat. See the metrics section of [logs-and-evidence.md](logs-and-evidence.md) and the postgres-best-practices skill.

## Diagnostics & roles

### `insufficient privilege` on `pg_stat_statements`
**Fix:** `grant pg_read_all_stats to postgres;`

### `EXPLAIN ANALYZE` on a function shows only a `Function Scan`
**Fix:** Use `auto_explain` in a rolled-back transaction to see nested plans — see the EXPLAIN section of [logs-and-evidence.md](logs-and-evidence.md).

### `a role cannot be removed while it is still referenced`
**Fix:** Give `postgres` the role's grants, reassign what it owns, drop what remains, then drop the role:
```sql
grant <role> to postgres;
reassign owned by <role> to postgres;
drop owned by <role>;
drop role <role>;
```

### Reset the database password
Dashboard → Database → Settings.
