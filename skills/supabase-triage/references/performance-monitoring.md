# Performance / Monitoring Triage

Reading order for a resource-health complaint: **Database Health** (Observability section, in-dashboard) first, then Supabase's open-source **Grafana** dashboard for finer-grained/real-time metrics (Dashboard averages hourly/daily). Setup: https://github.com/orgs/supabase/discussions — see "Supabase Grafana Installation Guide" linked from each article below.

## Interpreting Grafana Memory charts
**Chart legend:** yellow = active memory, red = SWAP (disk used as memory — slow), green = unclaimed (intentionally kept free), blue = cache/buffer (Postgres caching hot data for fast reads).
**Target:** ≥99% cache hit rate. Check: `npx supabase inspect db cache-hit --linked` (after `login`/`init`/`link`).
**If cache hit rate drops:** add indexes (less data pulled from disk), increase compute size, add read replicas, partition very large tables, remove bloat, or refactor overly wide tables.
Source: https://github.com/orgs/supabase/discussions/27021

## Interpreting Grafana CPU charts
**Chart legend:** yellow = kernel-space CPU (high → often means connections opening/closing too aggressively, or extension issues), blue = user-space CPU (regular query load), red = IO-wait idle cycles (any amount usually points to disk/memory problems, not CPU itself), green = truly idle.
**Fix:** optimize queries, add indexes, increase compute, add read replicas — as CPU nears 100%, queries/tasks start throttling.
Source: https://github.com/orgs/supabase/discussions/27022

## Interpreting Grafana IO charts
**Two key metrics:** disk throughput (MB/s) and IOPS (operations/sec) — each compute size has a baseline (sustained) and burst (max) limit; sub-XL sizes can burst briefly before reverting to baseline.
**Causes of excessive IO:** unnecessary sequential scans from missing indexes, insufficient cache (forces disk reads), poorly optimized RLS policies with heavy JOINs, bloat spreading data across more pages than needed, or a genuine bulk-upload spike (temporarily bump compute for the duration).
Source: https://github.com/orgs/supabase/discussions/27003

## High swap usage
**Cause:** Swap is disk used as overflow when RAM is exhausted — slow, last resort. Some swap with plenty of free RAM is often just Postgres "preemptively" swapping background processes and isn't concerning.
**Concerning when:** RAM usage is consistently >75% alongside rising swap → slower queries, degraded performance from RAM/disk thrashing, higher disk I/O.
**Fix:** Monitor `node_memory_SwapFree_bytes` and disk I/O metrics via Grafana; if swap is consistently high, the compute size is likely undersized for the workload — upgrade it.
Source: https://github.com/orgs/supabase/discussions/33289

## High RAM usage
**Cause:** Supabase runs many services beyond Postgres itself, so baseline usage can look high even under no load — ~50% base usage on the smallest (1GB) compute tier is normal. Swap usage above 70% is the strongest signal the compute tier genuinely doesn't fit the workload.
**Risk:** degraded performance once swapping starts, OOM-killed processes, in rare cases full unresponsiveness.
**Fix:** Check Database Health (Observability) for swap %; if high, upgrade compute. Use Grafana for cache-vs-RAM breakdown.
Source: https://github.com/orgs/supabase/discussions/33291

## High CPU usage
**Risk:** slower queries, disrupted daily backups, in rare cases unresponsiveness; also reduces headroom for future traffic spikes.
**Common causes:** slow/high-volume queries (>1s), missing indexes forcing large scans, or a compute tier genuinely undersized for the workload.
**Fix:** Check Database Health/Grafana for CPU; fix slow queries and missing indexes first before assuming you need more compute.
Source: https://github.com/orgs/supabase/discussions/33287

## High disk I/O
**Cause:** Each compute size has a baseline IOPS/throughput and a daily "Disk IO Budget" for short bursts above baseline; once the budget is exhausted, the instance reverts to (and is throttled at) baseline.
**Symptoms of exhausted budget:** rising response times, rising CPU due to IO-wait, disrupted backups, disrupted autovacuum, possible unresponsiveness.
**Fix:** Check Disk IO Budget under Database Health; investigate query patterns causing excess IO (see IO chart guide above) before assuming compute needs upgrading.
Source: https://github.com/orgs/supabase/discussions/33286

## High latency with the Supabase client vs. direct Postgres
**Symptom:** Querying via `supabase-js`/PostgREST is noticeably slower than the same query run directly against Postgres (e.g. via `psycopg`).
**Cause:** PostgREST adds HTTP request/response overhead, JSON serialization, and (if applicable) connection-pooler hops that a raw `psycopg` connection skips — this gap is expected, not necessarily a bug, though it's worth benchmarking your specific case.
**Fix:** For latency-critical hot paths, consider a direct/pooled Postgres connection instead of going through the REST layer; otherwise, ensure the query itself is well-indexed since REST overhead is usually small relative to a genuinely slow query.
Source: https://github.com/orgs/supabase/discussions/22100

## Project Status reports unhealthy services
**Symptom:** Dashboard shows one or more services as "unhealthy."
**Cause:** Most service health depends on the backend database — an overloaded/undersized/untuned database can cascade into other services reporting unhealthy. Recently restored projects can also take a couple minutes to stabilize.
**Fix:** Restart the database (Project Settings) as a first (possibly temporary) fix; increase Compute/Disk if it recurs; performance-tune the database. **Special case — only "Edge Functions Unhealthy":** this check is a platform-level health probe, not a check of your actual functions — invoke your function directly (e.g. via cURL) to confirm it's really fine; filter function logs for `~"health"` to see if only the health-check calls are failing (often a false positive, sometimes resolved by a database restart).
Source: https://github.com/orgs/supabase/discussions/40496
