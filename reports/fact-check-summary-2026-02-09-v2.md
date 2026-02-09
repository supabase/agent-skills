# Fact-Check Summary -- Supabase Skill

**Date:** 2026-02-09
**Scope:** 101 reference files across 10 sections
**Claims verified:** ~800+
**Overall accuracy:** ~94%
**All P0/P1 issues resolved.** Remaining 45 issues are P2 (8) and P3 (25), plus 3 partially fixed.

---

## Current State by Section

| # | Section | Files | Accuracy | Remaining Issues | Status |
|---|---------|-------|----------|-----------------|--------|
| 1 | Database | 18 | ~95% | 3 low | Clean -- 14 files with zero issues |
| 2 | Authentication | 14 | ~90% | 7 (4 medium, 3 low) | Needs `getClaims()`/`proxy.ts` update in SSR files |
| 3 | SDK | 13 | ~95% | 4 low | Clean -- 9 files with zero issues |
| 4 | Edge Functions | 15 | ~95% | 4 (3 medium, 1 low) | Needs `PUBLISHABLE_KEY` rename in 3 files |
| 5 | Storage | 7 | ~95% | 2 low | Effectively clean |
| 6 | CLI & MCP | 11 | ~93% | 6 low | Minor doc drift only |
| 7 | Realtime | 9 | ~95% | 2 low | Effectively clean |
| 8 | Vectors | 8 | ~91% | 5 low | Stylistic differences from official guide |
| 9 | Tooling | 6 | ~93% | 3 low | Minor terminology issues |

---

## What Was Fixed (33 total fixes across 2 rounds)

### Round 1 -- 28 fixes from initial fact-check

**P0 Critical (2):**
- `vectors-search-hybrid.md` -- 7 issues: wrong distance operator, missing schema prefix, missing parameters, wrong defaults
- `db-schema-extensions.md` -- `pg_cron` must use `schema pg_catalog`, not `schema extensions`

**P1 High (10):**
- `sdk-client-server.md` -- `getUser()` → `getClaims()`, `middleware.ts` → `proxy.ts`
- `sdk-framework-nextjs.md` -- Same `getClaims()`/`proxy.ts` updates + `PUBLISHABLE_KEY`
- `storage-ops-file-management.md` -- Move RLS permissions corrected
- `edge-dbg-limits.md` -- Error codes: 502 → 503 for boot errors, 546 is resource limit
- `auth-core-sessions.md` -- `signOut()` defaults to `global` scope, not current session
- `auth-core-signin.md` -- Same `signOut()` scope correction
- `db-security-service-role.md` -- Updated to 4 API key types (publishable/secret)
- `db-migrations-testing.md` -- `migration up` applies ALL pending migrations
- `vectors-perf-tuning.md` -- Nano = 0.5GB, Micro = ~15K vectors
- `vectors-rag-patterns.md` -- Added missing `match_document_chunks` SQL definition

**P2 Medium (12):**
- `mcp-setup-configuration.md` -- SSH tunnel port: 8000, not 8080
- `cli-gotchas-pitfalls.md` -- `storage cp` supports 5GB; 6MB is threshold
- `edge-dbg-testing.md` -- `SUPABASE_ANON_KEY` → `SUPABASE_PUBLISHABLE_KEY`
- `edge-pat-routing.md` -- Hono import: `jsr:@hono/hono`, not `npm:hono`
- `realtime-setup-auth.md` -- Added "disable Allow public access" caveat
- `realtime-patterns-cleanup.md` -- Added Pro (no spend cap) tier
- `realtime-broadcast-database.md` -- Trigger: `RETURN NULL`, not `coalesce(new, old)`
- `sdk-framework-nextjs.md` -- `SUPABASE_PUBLISHABLE_KEY` env var
- `tooling-tool-overlap.md` -- OAuth clarification (partially fixed; table still says "no login")
- `tooling-workflow-local-dev.md` -- Positional `typescript` syntax
- `tooling-workflow-migration-create.md` -- `migration fetch` → `db pull`
- `vectors-search-semantic.md` -- Removed baked-in defaults (partially fixed; simplified function inconsistent)

**P3 Low (4):**
- `realtime-patterns-debugging.md` -- `'debug'` → valid log level
- `db-rls-performance.md` -- Toned down extrapolated performance range (partially fixed)
- `db-schema-auth-fk.md` -- `execute procedure` → `execute function`
- `tooling-workflow-type-generation.md` -- Added `supabase db start` to CI example

### Round 2 -- 5 fixes from re-verification

| File | Issue | Fix |
|------|-------|-----|
| `storage-ops-file-management.md` | Round 1 introduced wrong RLS value (SELECT+INSERT) | Corrected to SELECT+UPDATE per SDK reference |
| `edge-adv-websockets.md` | Used outdated `getUser(token)` for WebSocket auth | Updated to `getClaims(token)` |
| `vectors-index-ivfflat.md` | IVFFlat list formulas were reversed | Corrected: `rows/1000` for up to 1M, `sqrt(rows)` for over 1M |
| `vectors-perf-tuning.md` | Code comment said "1GB RAM" for Free tier | Corrected to "0.5GB RAM" |
| `db-schema-auth-fk.md` | Round 1 fix missed -- still used `execute procedure` | Changed to `execute function` |

---

## Remaining Issues

### P2 -- Medium (8 issues)

Two themes account for 7 of 8 issues:

**Theme 1: `middleware.ts` → `proxy.ts` + `getClaims()` transition (4 issues)**

| File | Issue |
|------|-------|
| `auth-server-ssr.md` | Uses `getUser()` and `middleware.ts` -- docs now use `getClaims()` and `proxy.ts` |
| `auth-server-ssr.md` | Matcher pattern missing image file extensions (svg, png, jpg, etc.) |
| `auth-server-ssr.md` | Describes `getUser()` as preferred -- docs now prefer `getClaims()` |
| `auth-oauth-pkce.md` | Uses `middleware.ts` -- docs now use `proxy.ts` |

**Theme 2: `SUPABASE_ANON_KEY` → `SUPABASE_PUBLISHABLE_KEY` (3 issues)**

| File | Issue |
|------|-------|
| `edge-fun-quickstart.md` | Lists `SUPABASE_ANON_KEY` as auto-injected env var |
| `edge-auth-rls-integration.md` | Uses `SUPABASE_ANON_KEY` in code examples |
| `edge-db-supabase-client.md` | Uses `SUPABASE_ANON_KEY` in code examples |

**Other (1 issue)**

| File | Issue |
|------|-------|
| `tooling-tool-overlap.md` | MCP row still says "no login needed" (partially fixed -- section text improved, table not) |

### P3 -- Low (25 issues)

These are minor documentation drift, unverifiable claims, or stylistic differences. None affect correctness of generated code.

| Section | Count | Nature |
|---------|-------|--------|
| Auth | 4 | Pricing precision, OTP configurability, URI scheme, MFA caveat |
| SDK | 4 | ANON_KEY in browser file, JSON filter detail, proxy code style, dashboard nav |
| CLI | 4 | Diff limitations list, engine flags, experimental flag, lint exit behavior |
| MCP | 2 | Default feature state, alpha status label |
| DB | 2 | Connection pooling caveats, realtime update wording |
| Vectors | 5 | Table name differences, wording clarity, param counts |
| Edge | 1 | Regional deployment lists only 6 of 14 regions |
| Tooling | 2 | Command naming, link description |
| Realtime | 1 | Minor connection tier details |

### Partially Fixed (3 issues, all P3)

| File | Issue | What remains |
|------|-------|--------------|
| `tooling-tool-overlap.md` | OAuth clarification | Section text fixed; comparison table still says "no login" |
| `vectors-search-semantic.md` | Baked-in defaults | Complete function fixed; simplified function still inconsistent |
| `db-rls-performance.md` | Performance claims | Extreme range removed; still uses a range not a specific % |

---

## False Positives Identified (9 total)

These were flagged by fact-checkers but confirmed correct after manual verification:

| Claim | Verdict |
|-------|---------|
| `httpSend` doesn't exist | Valid -- documented method for REST-based broadcast (v2.37.0+) |
| Team plan = 500 connections (not 10,000) | Docs confirm Team = 10,000 concurrent connections |
| `log_level` in `params` is wrong syntax | Both `params: { log_level }` and `logLevel` appear in docs |
| DELETE events now filterable | Docs still state "You can't filter Delete events" |
| Phone MFA `channel` param undocumented | Documented in JS SDK reference |
| `getClaims(token)` takes no parameters | Accepts optional `jwt` parameter; Edge Functions guide shows `getClaims(token)` |
| Storage `info()` method unverifiable | Exists at `storage-from-info` in JS SDK reference |
| MCP tool names unverifiable | Now verifiable -- reclassified as INCOMPLETE (subset of actual tools) |
| Storage delete-objects URL broken | URL is valid and returns full documentation |

---

## Progress Over Time

| Metric | Initial (v1) | After v1 Fixes | After v2 Fixes |
|--------|-------------|----------------|----------------|
| Issues found | 72 | 52 | 45 remaining |
| Accuracy | ~91% | ~93.5% | ~94% |
| P0 Critical | 2 | 0 | 0 |
| P1 High | 10 | 3 | 0 |
| P2 Medium | 12 | 10 | 8 |
| P3 Low | 4 + 44 unfiled | 25 | 25 |
| Fixes applied | 0 | 28 | 33 |
| Clean files | -- | 75/101 | 79/101 |
