# Connections / Pooling Triage

## Supavisor & connection terminology
Quick glossary: **direct/database connection** — a raw connection straight to Postgres on port 5432 (`db.[ref].supabase.co:5432`). **Pooler connection** — a connection to Supavisor, which itself holds a smaller pool of direct connections and multiplexes clients onto them. **max_connections** — Postgres's own hard cap on direct connections (`SHOW max_connections;`). **Pool size** — how many direct connections Supavisor itself is allowed to hold per db/role/mode. **Transaction mode** (port 6543) — Supavisor shares a direct connection across multiple clients, handing it back after each transaction — this is what makes pooling scale for serverless/edge clients.
Source: https://github.com/orgs/supabase/discussions/27388

## Changing max database connections
**Fix:** `npx supabase --experimental --project-ref <ref> postgres-config update --config max_connections=<n>`, verify with `SHOW max_connections;` in the SQL editor. Pooler (Supavisor) connection limits are hard-coded per compute size and can't be raised independently — only by upgrading compute.
**Warning:** this hardcodes the value — if you later resize compute, it will NOT auto-adjust; you must update it again manually. Raising direct connections too high can overload Postgres's process schedulers and reduce overall query throughput even though more connections are "available."
Source: https://github.com/orgs/supabase/discussions/27197

## Disabling prepared statements (needed for Supavisor transaction mode)
**Symptom:** ORM/driver errors when using the pooler on port 6543.
**Cause:** Direct connections and Supavisor session mode support prepared statements; **transaction mode does not** — a prepared statement created on one underlying connection may not exist when the pooler hands you a different one for the next query.
**Fix per library:** Prisma — append `?pgbouncer=true` to the connection string. Drizzle — `postgres(connectionString, { prepare: false })`. node-postgres — omit the `name` field from query definitions. Psycopg — set `prepare_threshold` to `None`. asyncpg — pass `statement_cache_size=0` to `connect()`/`create_pool()`.
Source: https://github.com/orgs/supabase/discussions/28239

## Supavisor FAQ — why poolers exist
**Cause:** Postgres spawns a new OS process (not thread) per direct connection — expensive to start and memory-heavy, which caps how many connections are sustainable. Transient/serverless clients (like Edge Functions) that open-and-close connections aggressively strain this. A pooler holds a smaller set of hot connections and hands them to clients only while they're actively querying (transaction mode).
**Note:** application-side poolers (built into Prisma, SQLAlchemy, postgres.js etc.) exist too, but don't replace the need for Supavisor when you have many separate client instances/processes (e.g. serverless).
Source: https://github.com/orgs/supabase/discussions/21566

## Session artifacts interfering with Supavisor/PgBouncer
**Symptom:** `prepared_statement "x" does not exist` / `already exists`, or `cursor/portal "x" does not exist` / `already exists`.
**Cause:** Poolers reassign the same underlying Postgres connection between different clients. Prepared statements (cached by Prisma/Drizzle etc. to avoid re-parsing) and cursors/portals (used for paginated fetches, common in Django) only live within the connection they were created on — when the pooler shuffles connections, a client can hit a statement/cursor that "belongs" to a different session.
**Fix:** Disable prepared statements per the guide above. Cursors/portals are fundamentally incompatible with transaction-mode pooling — avoid them or use session mode/a direct connection for code paths that need them.
Source: https://github.com/orgs/supabase/discussions/40593

## "too many connections for database postgres"
**Symptom:** Connections are refused even though usage doesn't look excessive.
**Cause:** `datconnlimit` on the `postgres` database has been modified away from its default (`-1` = unlimited, subject to `max_connections`).
**Fix:** `select datconnlimit from pg_database where datname='postgres';` — if it's `0` or anything other than `-1`, run `ALTER DATABASE postgres CONNECTION LIMIT DEFAULT;`.
Source: https://github.com/orgs/supabase/discussions/45579

## Supavisor 'Circuit breaker open' after password rotation
**Symptom:** `FATAL: Circuit breaker open` with messages like "too many authentication failures, new connections are temporarily blocked".
**Cause:** Clients kept connecting with the old (now-rotated) password; Supavisor blocks the origin IP for up to 2 minutes to protect the database from repeated auth failures — and re-triggers (extending the lockout) if bad attempts continue during the block window.
**Fix:** Stop the offending clients/services first, update all connection strings/env vars to the new password, then restart. **Prevention:** always stop application instances *before* rotating the database password, and only restart once the new credentials are deployed everywhere.
Source: https://github.com/orgs/supabase/discussions/45688

## "remaining connection slots reserved for non-replication superuser connections"
**Symptom:** This exact Postgres error when the DB is at its connection ceiling.
**Cause:** Database hit `max_connections` for the current compute add-on.
**Fix:** Optimize/reduce connection usage in the app first; route through the connection pooler if not already; if still maxed out while pooled, upgrade the compute add-on for a higher connection ceiling.
Source: https://github.com/orgs/supabase/discussions/13995

## Connection errors possibly caused by IPv6
**Symptom:** `no route to host`, `Network is unreachable`, `could not translate host name`, `ENETUNREACH`, or Prisma `P1001` connecting to `db.<ref>.supabase.co:5432`.
**Cause:** Supabase's direct database connections resolve to IPv6 by default; the client's network doesn't support IPv6 (common after project migrations).
**Fix:** Either configure the network for IPv6, connect via Supavisor instead (resolves to IPv4), purchase the IPv4 add-on, or switch to the client libraries/PostgREST (which don't need a direct DB connection).
Source: https://github.com/orgs/supabase/discussions/20951
