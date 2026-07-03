# Connections & pooler

Most connection bugs are really **wrong-connection-mode** bugs. Supabase exposes three ways to reach Postgres, and each causes a distinct, predictable class of error. Identify the mode first by the port and host in the connection string, then match the error.

## The three modes

| Mode | Port / host | Prepared statements | IPv6? | Use for |
| --- | --- | --- | --- | --- |
| **Direct** | `5432` on `db.<ref>.supabase.co` | ✅ supported | IPv6 (needs IPv4 add-on on v4-only nets) | Long-lived servers/VMs, long transactions, migrations |
| **Transaction pooler** (Supavisor) | `6543` on `...pooler.supabase.com` | ❌ **not supported** | via pooler | Serverless / edge / autoscaling — short, stateless queries |
| **Session pooler** (Supavisor) | `5432` on `...pooler.supabase.com` | ✅ supported | IPv4-compatible | IPv4-only networks; when you need prepared statements + pooling |

The transaction pooler multiplexes many clients over few backend connections, handing each client a backend only for the duration of one transaction. This lets it scale to huge client counts but prevents it from keeping prepared statements or session state.

(Projects on the older **dedicated** pooler reach transaction mode at `db.<ref>.supabase.co:6543` instead of the shared `...pooler.supabase.com` host; the behavior below stays the same.)

## Error → cause → fix

### `prepared statement "..." already exists`
**Cause:** Prepared statements over the **transaction pooler** (port 6543) — unsupported.
**Fix:** Either move to a **direct** or **session** connection (port 5432), or disable prepared statements in your driver/ORM:
- Prisma: add `?pgbouncer=true` to the connection string
- `postgres-js` / Drizzle: `{ prepare: false }`
- node-postgres: omit the query `name`
- asyncpg: `statement_cache_size=0`
- psycopg: `prepare_threshold=None`

### `cannot execute UPDATE in a read-only transaction` (intermittent, on 6543)
**Cause:** Usually a prior client left `default_transaction_read_only = on` (or `SET SESSION CHARACTERISTICS ... READ ONLY`) on a pooled backend, and it bled into your client — the database is *not* actually read-only. First, though, rule out a **genuine** read-only state: a read replica, or Postgres flipping to read-only because it hit its disk-space limit.
**Diagnose:** Over a direct connection, run `show default_transaction_read_only;` and `select pg_is_in_recovery();`, and check disk usage in the dashboard. All clear means pooled-backend contamination.
**Fix:** Remove all session-level read-only `SET`s from your code; if you need read-only safety, scope it to the transaction (`begin transaction read only;`), which doesn't persist. Scripts that must set session state should use a direct connection.

### `too many connections for database "postgres"`
**Cause:** `datconnlimit` was changed from its default of `-1`.
**Fix:** `alter database postgres connection limit default;` (verify with `select datconnlimit from pg_database where datname = 'postgres';`).

### `remaining connection slots are reserved for non-replication superuser connections`
**Cause:** You've hit `max_connections` for the compute size.
**Fix:** Route clients through the **transaction pooler** (6543) instead of opening direct connections; or upgrade compute for more slots. Check usage with the connections query below.

### `CONNECT_TIMEOUT` / queries hang in serverless functions
**Cause:** A persistent client (e.g. `postgres-js`) reused across invocations holds a socket that the platform froze between requests; the pooler/NAT dropped it, so the client now writes into a dead socket.
**Fix:** Prefer the stateless Data API (PostgREST) for reads from serverless; or preflight with a short-timeout `select 1` and recycle the client on failure; or use a runtime with a connection-lifecycle hook (e.g. Fluid Compute `attachDatabasePool` + `waitUntil`).

### `FATAL: Circuit breaker open` after a password rotation
**Cause:** Clients keep retrying with the **old** password; Supavisor blocks the origin IP for up to ~2 minutes. (Fail2ban raises the same message — see "Connection refused" below.)
**Fix:** **Stop the clients still using the old password first**, since their retries keep re-arming the lockout otherwise. Then update every connection string and env var to the new password and restart. The lockout clears within ~2 minutes.

### `Connection refused` / `ECONNREFUSED` when connecting
**Cause:** Fail2ban has banned your IP — it triggers after two consecutive wrong-password attempts. (`Circuit breaker open: Unable to establish connection to upstream database` has the same cause.)
**Fix:** Bans auto-clear after ~30 min. To lift one immediately, go to **Dashboard → Database → Settings → Banned IPs → Unban IP**, or use the CLI: `supabase network-bans get --project-ref <ref> --experimental`, then `supabase network-bans remove --db-unban-ip <ip> --project-ref <ref> --experimental`. Fix the wrong credentials that caused the failed attempts first.

### Can't reach the database from an IPv4-only network
**Cause:** Direct connections resolve to IPv6; an IPv4-only host can't route to them (usually a timeout or "no route to host", not "connection refused").
**Diagnose:** Run `curl -6 https://ifconfig.co/ip` on the host — failure means no IPv6.
**Fix:** Use the **session pooler** (IPv4-compatible), enable the **IPv4 add-on**, or use the Supabase client libraries, which are IPv4-compatible.

### `FATAL: no pg_hba.conf entry for host ..., SSL off`
**Cause:** Most often **SSL enforcement is enabled** on the project and the client connected without SSL. Also appears with bad or rotated credentials, or with internet background scanners probing default usernames.
**Fix:** Connect over SSL (`sslmode=require` or stricter) or disable SSL enforcement for the project. If the failing user is `root`/`test`/etc. from an unknown IP, it's a harmless probe — ignore it.

### CLI `failed SASL auth` / `invalid SCRAM server-final-message`
**Cause:** The pooler cached stale credentials for the CLI's internal role, or repeated failures got your IP temporarily banned.
**Fix:** In Database Settings, remove your IP from the banned list and retry; pass the password explicitly (`SUPABASE_DB_PASSWORD=... supabase db push`); or bypass the pooler with `supabase@beta ... --skip-pooler` (needs IPv6).

## Changing `max_connections`
Set it via CLI: `supabase --experimental --project-ref <ref> postgres-config update --config max_connections=<n>`. **Caveat:** this hard-codes the value, so it won't auto-resize when you change compute — you must update it manually. More connections cost memory (each direct connection reserves RAM that could be cache) and CPU (churn), so prefer the pooler over raising the ceiling.

## Monitor connection usage
```sql
select count(*), state, usename
from pg_stat_activity
group by state, usename
order by count desc;
```
Rule of thumb: keep pooler utilization under ~40% if you rely on the PostgREST Data API, and under ~80% otherwise.
