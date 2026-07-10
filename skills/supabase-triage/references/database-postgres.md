# Database / Postgres Triage

## 42P01: relation does not exist
**Symptom:** `42P01: relation "<table>" does not exist` from SQL or PostgREST.
**Cause 1 — search path:** Table lives outside `public` and wasn't schema-qualified. **Cause 2 — case sensitivity:** table was created with quoted mixed-case name (`CREATE TABLE "Hello"`), so it must be referenced with matching case/quotes. **Cause 3:** the table/function genuinely doesn't exist (never created or was dropped).
**Fix:** For cross-schema access: `supabase.schema('myschema').from('mytable').select()` (and expose that schema to the API — note `vault`/`auth` schemas can never be exposed, only reached via `SECURITY DEFINER` functions). For case issues: `alter table "Table_Name" rename to table_name;`. To verify existence: `select * from information_schema.tables where table_name ilike 'example_table';`.
Source: https://github.com/orgs/supabase/discussions/29577

## Index row size exceeds btree v4 maximum
**Symptom:** `index row size exceeds btree version 4 maximum 2704 for index "idx_name"`.
**Cause:** A single B-tree tuple (index row) can't exceed ~2704 bytes on an 8KB page — usually from a multi-column composite index, or a single index on a long `text`/`json` column.
**Fix:** For composite indexes: split into separate single-attribute indexes unless queries specifically filter on the leading columns together, then drop the oversized composite index (mandatory once this error hits). For long-text indexes: index a hash or prefix of the value instead of the raw column.
Source: https://github.com/orgs/supabase/discussions/14898

## Duplicate key violates unique constraint on a serial/sequence table
**Symptom:** `ERROR: duplicate key violates unique constraint` on an auto-incrementing table, often after a bulk import or restore.
**Cause:** The table's sequence fell out of sync with the actual max id — common after restoring from a dump.
**Fix:** Check drift: `SELECT MAX(<col>) FROM <table>;` vs `SELECT nextval(pg_get_serial_sequence('public.<table>', '<col>'));`. Resync: `SELECT SETVAL('public.<table>_<col>_seq', (SELECT MAX(<col>) FROM <table>)+1);`. Back up first (restart-triggered backup in General Settings).
Source: https://github.com/orgs/supabase/discussions/21134

## Improving query performance with indexes
**Symptom:** Slow queries; want a systematic tuning approach.
**Fix:** Check cache hit rate — target ~99%:
```sql
select 'index hit rate' as name, sum(idx_blks_hit)/nullif(sum(idx_blks_hit+idx_blks_read),0) as ratio from pg_statio_user_indexes
union all
select 'table hit rate' as name, sum(heap_blks_hit)/nullif(sum(heap_blks_hit)+sum(heap_blks_read),0) as ratio from pg_statio_user_tables;
```
Low hit rate → consider more memory/compute. Also use the Dashboard's Index Advisor / Performance Advisor, and Supabase Grafana for real-time (not hourly-averaged) metrics while testing index changes.
Source: https://github.com/orgs/supabase/discussions/22449

## Understanding EXPLAIN output
**Symptom:** Need to read a query plan to find the bottleneck.
**Fix:** Run `EXPLAIN SELECT ...` in the SQL editor, or `.explain({ analyze: true, verbose: true })` in supabase-js (requires enabling the explain endpoint via the Performance Debugging Guide first). Key plan nodes: `Seq Scan` (full table scan, usually means a missing/unused index), `Index Scan` (index used directly), `Bitmap Heap Scan` (index used to build a bitmap then fetch rows — good for moderate row counts).
Source: https://github.com/orgs/supabase/discussions/22839

## High CPU / slow queries with "must be a superuser to terminate superuser process"
**Symptom:** Sustained high CPU, slow queries, and this specific error when trying to cancel a backend.
**Cause:** A long-running, non-terminable autovacuum is active — usually because dead tuples (old MVCC row versions from updates/deletes) have crossed the autovacuum threshold, or the database is approaching transaction ID (XID) wraparound and Postgres is forcing an aggressive vacuum that can't be killed.
**Fix:** Let the autovacuum complete (killing it isn't possible for anti-wraparound vacuums by design) — check `pg_stat_activity` / `pg_stat_progress_vacuum` for progress. Prevent recurrence by tuning autovacuum thresholds for high-churn tables and avoiding long-idle transactions that block cleanup.
Source: https://github.com/orgs/supabase/discussions/40148

## pg_cron debugging guide
**Symptom:** Cron jobs won't create/edit/delete, or scheduled jobs stop running.
**Fix:** Always use `cron.schedule` / `cron.alter_job` / `cron.unschedule` — direct table edits aren't supported. If jobs stop running, check the scheduler is alive: `SELECT * FROM pg_stat_activity WHERE application_name ILIKE 'pg_cron scheduler';` — if no row, a fast reboot (General Settings) revives it. Then inspect failures: `SELECT * FROM cron.job_run_details WHERE status NOT IN ('succeeded','running') AND start_time > NOW() - INTERVAL '5 days' ORDER BY start_time DESC;`. Postgres < v15.6.1.122 lacks pg_cron's auto-revive — upgrade if this recurs.
Source: https://github.com/orgs/supabase/discussions/30168

## Canceling statement due to "statement timeout"
**Symptom:** Queries killed with a statement-timeout error, or 504s in the Dashboard.
**Fix:** Check current role timeouts: `SELECT rolname, rolconfig FROM pg_roles;`. Raise `statement_timeout` for the affected role (may need a quick project reboot to take effect). Diagnose the slow query itself via the Query Performance advisor (`/project/_/advisors/query-performance`) and `explain analyze <query>` (or `.explain()` from supabase-js/PostgREST).
Source: https://github.com/orgs/supabase/discussions/14256

## "insufficient privilege" on pg_stat_statements
**Symptom:** "insufficient privilege" reading `pg_stat_statements` or the Query Performance Report.
**Fix:** `grant pg_read_all_stats to postgres;`
Source: https://github.com/orgs/supabase/discussions/20126

## Speeding up pgvector lookups with an HNSW index
**Symptom:** Vector similarity queries are slow.
**Fix:** `CREATE INDEX <name> ON <table> USING hnsw (<vector_col> <search_type>);` where search type is `vector_l2_ops` (`<->`, Euclidean), `vector_ip_ops` (`<#>`, negative inner product), or `vector_cosine_ops` (`<=>`, cosine — most common default). Building without `CONCURRENTLY` locks the table but builds faster. Use pgvector ≥0.6 (faster HNSW builds) and run the build through an external connection, not the Dashboard SQL editor (~2 min internal query time limit).
Source: https://github.com/orgs/supabase/discussions/21379
