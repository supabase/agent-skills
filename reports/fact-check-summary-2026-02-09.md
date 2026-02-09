# Fact-Check Reports Summary

**Date:** 2026-02-09 (re-verified 2026-02-09)
**Total sections checked:** 11
**Total files checked:** 101
**Total claims verified:** ~750+
**Total issues found:** 72 (was 77 before re-verification; 8 false positives confirmed, 2 overturned)

---

## 1. Authentication -- 96.6% accuracy (5 issues across 14 files)

- **14 files checked** across sign-up, sign-in, sessions, MFA, OAuth, SSO, SSR, and admin API
- **Key finding:** `signOut()` defaults to `global` scope (all sessions), not current session -- appears in 2 files and could cause unintended sign-outs across devices
- **`getClaims()` context:** `getClaims()` is a faster alternative to `getUser()` that can verify JWTs locally with asymmetric keys. It is NOT a replacement for `getUser()` in middleware -- both are valid approaches. The reference file's presentation is reasonable but could clarify this nuance
- **Minor gap:** SSO RLS policy missing MFA caveat for `amr[0]` index
- ~~Phone MFA `channel` parameter underdocumented~~ **FALSE POSITIVE** -- `channel` is documented in JS SDK reference

## 2. Database -- 92.3% accuracy (14 issues across 18 files)

- **1 Critical:** `pg_cron` must be installed with `schema pg_catalog`, not `schema extensions` -- would cause installation failure
- **API keys outdated:** References only `anon`/`service_role` keys; docs now describe 4 key types with publishable/secret as the recommended approach
- **Migration command error:** `migration up` applies ALL pending migrations, not just one
- **Missing caveats:** RLS not applied to Realtime DELETE events, connection pooling docs incomplete (missing Dedicated Pooler), `db diff` limitations list incomplete (5 vs 13+ items)
- **Strongest sections:** Performance indexes and query optimization -- zero issues

## 3. Storage -- 94.5% accuracy (5 issues across 7 files)

- **High priority:** `move` RLS permissions are wrong -- should be SELECT + INSERT (not SELECT + UPDATE). Would silently deny move operations
- **RLS performance:** Owner-based access example missing the `(select ...)` wrapper recommended by docs
- **Minor:** `contain` resize mode letterboxing claim unsubstantiated
- ~~`info()` method unverifiable~~ **FALSE POSITIVE** -- method exists at `storage-from-info` in JS SDK reference
- **Strongest sections:** CDN caching, download URLs, standard uploads -- zero issues

## 4. Edge Functions -- ~91% accuracy (6 issues across 15 files)

- **Status code error:** 502 should be 503 for boot errors (syntax/import), and 546 is resource limit not generic runtime error
- ~~`getClaims(token)` is wrong -- JS SDK takes no parameters~~ **FALSE POSITIVE** -- JS SDK `getClaims()` accepts an optional `jwt` parameter; Edge Functions auth guide explicitly shows `getClaims(token)`
- **Outdated references:** Hono should import from `jsr:@hono/hono` (not `npm:hono`), test env var should be `SUPABASE_PUBLISHABLE_KEY` (not `SUPABASE_ANON_KEY`)
- **Strongest sections:** Quickstart, project structure, CORS, error handling, WebSockets, streaming -- all clean

## 5. CLI & MCP -- 92.7% accuracy (8 issues across 11 files)

- **SSH tunnel wrong port:** Remote port should be 8000 (Kong), not 8080 -- would fail to connect
- **Upload limit myth:** `storage cp` supports up to 5GB; the 6MB figure is only a threshold for recommending resumable uploads
- ~~`storage ls/cp/mv/rm` no longer requires `--experimental`~~ **FALSE POSITIVE** -- all 4 storage commands still list `--experimental` as Required in official CLI docs
- **MCP tools incomplete:** Tool names are now verifiable from official docs (previously claimed unverifiable). Reference file lists are subsets of actual tools, and `generate_types` should be `generate_typescript_types`
- **Strongest sections:** Database commands, migration commands, project commands, secrets commands -- all clean

## 6. SDK -- 93.6% accuracy (7 issues across 13 files)

- **getClaims() and proxy.ts (OUTDATED, HIGH):** Canonical SSR guide now uses `getClaims()` instead of `getUser()` in proxy; docs now use `proxy.ts` filename and "Proxy" terminology instead of `middleware.ts`
- **Remaining issue:** The "single thread" description for Postgres Changes limitation oversimplifies the actual constraint
- **All query/filter/join/RPC files are 100% correct** -- the core SDK usage patterns are solid
- **TypeScript generation and usage files also clean**

## 7. Realtime -- ~95% accuracy (6 issues across 9 files)

- ~~`httpSend` is not in the docs~~ **FALSE POSITIVE** -- `httpSend` is a documented method for REST-based broadcast (available since v2.37.0). See [JS SDK reference](https://supabase.com/docs/reference/javascript/broadcastmessage)
- ~~Team plan shows 10,000 connections but docs say 500~~ **FALSE POSITIVE** -- [Realtime limits docs](https://supabase.com/docs/guides/realtime/limits) confirm Team = 10,000 concurrent connections
- ~~Log level config syntax wrong (snake_case vs camelCase)~~ **FALSE POSITIVE** -- both `params: { log_level }` and `logLevel` patterns appear in official docs
- ~~DELETE events not filterable is OUTDATED~~ **FALSE POSITIVE** -- docs still explicitly state "You can't filter Delete events"
- **Missing setup step:** Reference omits that you must disable "Allow public access" in Realtime Settings to enforce private channels
- **Minor divergence:** Trigger should use `RETURN NULL` (not `coalesce(new, old)`) for AFTER triggers per docs convention
- **Strongest sections:** Presence tracking, channel setup, error handling -- all clean

## 8. Vectors -- ~78% accuracy (17 issues across 8 files, lowest score)

- **Hybrid search has the most issues (7):** Wrong distance operator (`<=>` vs `<#>`), missing `extensions.` schema prefix, missing parameters (`full_text_weight`, `semantic_weight`, `rrf_k`), wrong defaults, missing over-fetch cap (`least(match_count, 30)`)
- **Compute sizing errors:** Free plan (Nano) has 0.5 GB RAM not 1 GB; Micro (1 GB) supports ~15K vectors not ~20K; plan terminology should be "Compute Size" not "Plan"
- **RAG patterns:** Calls undefined function `match_document_chunks` -- SQL definition never provided, would cause runtime error
- **Semantic search:** Baked-in defaults (`0.78`, `10`) that don't exist in the official function signature
- **Strongest sections:** pgvector setup, embedding generation, HNSW indexes, IVFFlat indexes -- all clean

## 9. Tooling -- ~92% accuracy (4 issues across 6 files)

- **MCP OAuth:** "No login required" is misleading -- MCP requires OAuth 2.1 or PAT auth; should say "no separate CLI login step"
- **Type generation syntax:** `--lang typescript` is older form; current docs use positional syntax `supabase gen types typescript`
- **Migration fetch:** `supabase migration fetch` not in official docs; canonical command is `supabase db pull`
- **CI example:** Omits `supabase db start` step from official CI workflow
- **Strongest sections:** Tool selection guidance, function dev workflow -- zero issues

---

## Re-Verification: Disputed Claims

The previous summary identified 10 false positives. Re-verification overturned 2:

| # | Section | Original Claim | Previous Verdict | New Verdict |
|---|---------|---------------|-----------------|-------------|
| 1 | SDK | `getClaims()` replaces `getUser()` in proxy | FALSE POSITIVE | **OUTDATED (HIGH)** -- canonical SSR guide now uses `getClaims()` |
| 2 | SDK | `proxy.ts` replaces `middleware.ts` | FALSE POSITIVE | **OUTDATED (HIGH)** -- docs now use `proxy.ts` and "Proxy" terminology |
| 3 | Realtime | `httpSend` doesn't exist | FALSE POSITIVE | Confirmed FALSE POSITIVE |
| 4 | Realtime | Team plan = 500 connections | FALSE POSITIVE | Confirmed FALSE POSITIVE |
| 5 | Realtime | `log_level` in `params` is wrong | FALSE POSITIVE | Confirmed FALSE POSITIVE (but `'debug'` value is INCORRECT) |
| 6 | Realtime | DELETE events not filterable is OUTDATED | FALSE POSITIVE | Confirmed FALSE POSITIVE |
| 7 | Auth | Phone MFA `channel` undocumented | FALSE POSITIVE | Confirmed FALSE POSITIVE |
| 8 | Edge | `getClaims(token)` takes no parameters | FALSE POSITIVE | Confirmed FALSE POSITIVE |
| 9 | Storage | `info()` unverifiable | FALSE POSITIVE | Confirmed FALSE POSITIVE |
| 10 | CLI/MCP | MCP tool names unverifiable | FALSE POSITIVE | Confirmed FALSE POSITIVE (reclassified to INCOMPLETE) |

---

## Overall Priorities

### P0 -- Critical / Must Fix

| # | Section | File | Issue | Status |
|---|---------|------|-------|--------|
| 1 | Vectors | `vectors-search-hybrid.md` | 7 issues: wrong operator, missing params, wrong defaults | **FIXED** |
| 2 | DB | `db-schema-extensions.md` | `pg_cron` must use `schema pg_catalog` | **FIXED** |

### P1 -- High / Should Fix

| # | Section | File | Issue | Status |
|---|---------|------|-------|--------|
| 3 | SDK | `sdk-client-server.md` | `getUser()` → `getClaims()` in proxy; `middleware.ts` → `proxy.ts` | **FIXED** |
| 4 | SDK | `sdk-framework-nextjs.md` | Same `getClaims()` and `proxy.ts` updates; `PUBLISHABLE_KEY` | **FIXED** |
| 5 | Storage | `storage-ops-file-management.md` | `move` RLS: SELECT + INSERT, not SELECT + UPDATE | **FIXED** |
| 6 | Edge | `edge-dbg-limits.md` | 502 → 503 for boot errors; 546 is resource limit | **FIXED** |
| 7 | Auth | `auth-core-sessions.md` | `signOut()` defaults to `global` scope | **FIXED** |
| 8 | Auth | `auth-core-signin.md` | Same `signOut()` scope issue | **FIXED** |
| 9 | DB | `db-security-service-role.md` | API keys: update to 4 key types table | **FIXED** |
| 10 | DB | `db-migrations-testing.md` | `migration up` applies ALL pending migrations | **FIXED** |
| 11 | Vectors | `vectors-perf-tuning.md` | Nano = 0.5 GB, Micro = ~15K, Large = ~225K | **FIXED** |
| 12 | Vectors | `vectors-rag-patterns.md` | Add missing `match_document_chunks` SQL definition | **FIXED** |

### P2 -- Medium / Nice to Fix

| # | Section | File | Issue | Status |
|---|---------|------|-------|--------|
| 13 | CLI/MCP | `mcp-setup-configuration.md` | SSH tunnel remote port: 8000, not 8080 | **FIXED** |
| 14 | CLI | `cli-gotchas-pitfalls.md` | `storage cp` supports 5GB; 6MB is threshold | **FIXED** |
| 15 | Edge | `edge-dbg-testing.md` | `SUPABASE_ANON_KEY` → `SUPABASE_PUBLISHABLE_KEY` | **FIXED** |
| 16 | Edge | `edge-pat-routing.md` | Hono import: `jsr:@hono/hono`, not `npm:hono` | **FIXED** |
| 17 | Realtime | `realtime-setup-auth.md` | Missing "Allow public access" disable caveat | **FIXED** |
| 18 | Realtime | `realtime-patterns-cleanup.md` | Connection table missing "Pro (no spend cap)" tier | **FIXED** |
| 19 | Realtime | `realtime-broadcast-database.md` | Trigger: `RETURN NULL`, not `coalesce(new, old)` | **FIXED** |
| 20 | SDK | `sdk-framework-nextjs.md` | Env var: `SUPABASE_PUBLISHABLE_KEY` not `SUPABASE_ANON_KEY` | **FIXED** |
| 21 | Tooling | `tooling-tool-overlap.md` | "No login required" misleading re: OAuth | **FIXED** |
| 22 | Tooling | `tooling-workflow-local-dev.md` | `--lang typescript` → positional syntax | **FIXED** |
| 23 | Tooling | `tooling-workflow-migration-create.md` | `migration fetch` → `db pull` | **FIXED** |
| 24 | Vectors | `vectors-search-semantic.md` | Default `0.78` baked in; wrong WHERE pattern | **FIXED** |

### P3 -- Low / Optional

| # | Section | File | Issue | Status |
|---|---------|------|-------|--------|
| 25 | Realtime | `realtime-patterns-debugging.md` | `'debug'` not a valid log_level | **FIXED** |
| 26 | DB | `db-rls-performance.md` | "100x-99,000x" is extrapolated | **FIXED** |
| 27 | DB | `db-schema-auth-fk.md` | `execute function` vs `execute procedure` | **FIXED** |
| 28 | Tooling | `tooling-workflow-type-generation.md` | CI example omits `supabase db start` | **FIXED** |
