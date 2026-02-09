# Supabase Skill Fact-Check Report: All Sections

**Date:** 2026-02-09
**Sections checked:** 11 (db, auth, storage, edge, cli, mcp, sdk, realtime, vectors, tooling)
**Files checked:** 96
**Total claims verified:** ~750+
**Total confirmed issues:** 73

---

## Executive Summary

| Section | Files | Issues | Critical | High | Medium | Low | Accuracy |
|---------|-------|--------|----------|------|--------|-----|----------|
| Database | 18 | 14 | 1 | 3 | 6 | 4 | 92.3% |
| Authentication | 14 | 5 | 0 | 2 | 1 | 2 | 96.6% |
| Storage | 7 | 5 | 0 | 1 | 1 | 3 | 94.5% |
| Edge Functions | 15 | 6 | 0 | 2 | 4 | 2 | ~91% |
| CLI & MCP | 11 | 8 | 0 | 2 | 4 | 5 | 92.7% |
| SDK | 13 | 7 | 0 | 3 | 2 | 2 | 93.6% |
| Realtime | 9 | 6 | 0 | 0 | 3 | 3 | ~95% |
| Vectors | 8 | 17 | 0 | 3 | 8 | 6 | ~78% |
| Tooling | 6 | 4 | 0 | 0 | 3 | 1 | ~92% |
| **Total** | **101** | **72** | **1** | **16** | **32** | **28** | **~91%** |

---

## Re-Verification Results: Disputed Claims

The previous report identified 10 false positives. This re-verification overturns 2 of those determinations:

| # | Section | Claim | Previous Verdict | New Verdict | Action |
|---|---------|-------|-----------------|-------------|--------|
| 1 | SDK | `getClaims()` replaces `getUser()` in proxy | FALSE POSITIVE | **OUTDATED (HIGH)** | Canonical SSR guide now uses `getClaims()` |
| 2 | SDK | `proxy.ts` replaces `middleware.ts` | FALSE POSITIVE | **OUTDATED (HIGH)** | Docs now use `proxy.ts` filename and "Proxy" terminology |
| 3 | SDK | `getClaims(token)` takes no parameters | FALSE POSITIVE | Confirmed FALSE POSITIVE | JS SDK accepts optional `jwt` parameter |
| 4 | Realtime | `httpSend` doesn't exist | FALSE POSITIVE | Confirmed FALSE POSITIVE | Documented in JS SDK reference (v2.37.0+) |
| 5 | Realtime | Team plan = 500 connections | FALSE POSITIVE | Confirmed FALSE POSITIVE | Team = 10,000 (but table is INCOMPLETE) |
| 6 | Realtime | DELETE events not filterable is OUTDATED | FALSE POSITIVE | Confirmed FALSE POSITIVE | Docs still state this limitation |
| 7 | Realtime | `log_level` in `params` is wrong | FALSE POSITIVE | Confirmed FALSE POSITIVE | Both forms exist; `'debug'` value is INCORRECT |
| 8 | Auth | Phone MFA `channel` undocumented | FALSE POSITIVE | Confirmed FALSE POSITIVE | JS SDK documents `channel` parameter |
| 9 | Storage | `info()` unverifiable | FALSE POSITIVE | Confirmed FALSE POSITIVE | Method exists at `storage-from-info` |
| 10 | CLI/MCP | MCP tool names unverifiable | FALSE POSITIVE | Confirmed FALSE POSITIVE | Reclassified to INCOMPLETE |

**Net effect:** 2 false positives reversed (SDK getClaims/proxy.ts are real issues), 8 confirmed.

---

## Updated Priorities

### P0 -- Critical / Must Fix

| # | Section | File | Issue |
|---|---------|------|-------|
| 1 | Vectors | `vectors-search-hybrid.md` | **7 issues in one file**: wrong distance operator (`<=>` vs `<#>`), missing `extensions.` schema prefix, missing 3 parameters, wrong defaults, missing over-fetch cap |
| 2 | DB | `db-schema-extensions.md` | `pg_cron` must use `schema pg_catalog`, not `schema extensions` -- installation would fail |

### P1 -- High / Should Fix

| # | Section | File | Issue |
|---|---------|------|-------|
| 3 | SDK | `sdk-client-server.md` | `getUser()` should be `getClaims()` in proxy; file should be `proxy.ts` not `middleware.ts` |
| 4 | SDK | `sdk-framework-nextjs.md` | Same `getClaims()` and `proxy.ts` updates needed |
| 5 | Storage | `storage-ops-file-management.md` | `move` RLS permissions wrong: should be SELECT + INSERT, not SELECT + UPDATE |
| 6 | Edge | `edge-dbg-limits.md` | Status code 502 should be 503 for boot errors; 546 is resource limit, not generic runtime error |
| 7 | Auth | `auth-core-sessions.md` | `signOut()` defaults to `global` scope, not current session |
| 8 | Auth | `auth-core-signin.md` | Same `signOut()` scope issue |
| 9 | DB | `db-security-service-role.md` | API keys outdated -- docs now describe 4 key types with publishable/secret |
| 10 | DB | `db-migrations-testing.md` | `migration up` applies ALL pending migrations, not just one |
| 11 | Vectors | `vectors-perf-tuning.md` | Free plan (Nano) = 0.5 GB RAM, not 1 GB; Micro (1 GB) = ~15K vectors, not ~20K |
| 12 | Vectors | `vectors-rag-patterns.md` | Calls undefined `match_document_chunks` -- SQL definition never provided |

### P2 -- Medium / Nice to Fix

| # | Section | File | Issue |
|---|---------|------|-------|
| 13 | CLI/MCP | `mcp-setup-configuration.md` | SSH tunnel remote port should be 8000, not 8080 |
| 14 | CLI | `cli-gotchas-pitfalls.md` | `storage cp` supports up to 5GB; 6MB is threshold, not hard limit |
| 15 | Edge | `edge-dbg-testing.md` | `SUPABASE_ANON_KEY` should be `SUPABASE_PUBLISHABLE_KEY` |
| 16 | Edge | `edge-pat-routing.md` | Hono import should be `jsr:@hono/hono`, not `npm:hono` |
| 17 | Realtime | `realtime-setup-auth.md` | Missing "Allow public access" disable caveat |
| 18 | Realtime | `realtime-patterns-cleanup.md` | Connection table missing "Pro (no spend cap)" tier |
| 19 | Realtime | `realtime-broadcast-database.md` | Trigger should use `RETURN NULL`, not `coalesce(new, old)` |
| 20 | SDK | `sdk-framework-nextjs.md` | Env var should be `SUPABASE_PUBLISHABLE_KEY` not `SUPABASE_ANON_KEY` |
| 21 | Tooling | `tooling-tool-overlap.md` | "No login required" is misleading -- MCP still requires OAuth auth |
| 22 | Tooling | `tooling-workflow-local-dev.md` | `--lang typescript` is older syntax; positional form is current |
| 23 | Tooling | `tooling-workflow-migration-create.md` | `migration fetch` not in official docs; canonical is `db pull` |
| 24 | Vectors | `vectors-search-semantic.md` | Default `0.78` baked in, doesn't exist in official function; wrong WHERE clause pattern |

### P3 -- Low / Optional

| # | Section | File | Issue |
|---|---------|------|-------|
| 25 | Realtime | `realtime-patterns-debugging.md` | `'debug'` listed as valid log_level but docs only show `'info' | 'warn' | 'error'` |
| 26 | DB | `db-rls-performance.md` | "100x-99,000x" improvement range is extrapolated |
| 27 | DB | `db-schema-auth-fk.md` | Trigger uses `execute function` instead of docs' `execute procedure` |
| 28 | Tooling | `tooling-workflow-type-generation.md` | CI example omits `supabase db start` step |

---

## New Section: Tooling Fact-Check Report

### [tooling-tool-overlap.md](../skills/supabase/references/tooling-tool-overlap.md)

**Claims checked:** 13
**Issues found:** 1 (Medium)

| # | Claim | Classification | Details |
|---|-------|---------------|---------|
| 1-12 | MCP tool names and capabilities | CORRECT | All verified against GitHub repo |
| 13 | "No login required: MCP uses existing OAuth connection" | **INCOMPLETE** | MCP requires OAuth 2.1 or PAT auth. Should say "no separate CLI login step" |

Sources:
- [Model context protocol (MCP)](https://supabase.com/docs/guides/getting-started/mcp)
- [supabase-community/supabase-mcp](https://github.com/supabase-community/supabase-mcp)

---

### [tooling-tool-selection.md](../skills/supabase/references/tooling-tool-selection.md)

**Claims checked:** 10
**Issues found:** 0

All claims verified correct. "MCP first, CLI for local-only" guidance is sound.

Sources:
- [Supabase CLI Getting Started](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Local development overview](https://supabase.com/docs/guides/local-development/overview)

---

### [tooling-workflow-function-dev.md](../skills/supabase/references/tooling-workflow-function-dev.md)

**Claims checked:** 7
**Issues found:** 0

All claims verified correct.

Sources:
- [Edge Functions Deploy](https://supabase.com/docs/guides/functions/deploy)
- [Edge Functions CLI](https://supabase.com/docs/reference/cli/supabase-functions)

---

### [tooling-workflow-local-dev.md](../skills/supabase/references/tooling-workflow-local-dev.md)

**Claims checked:** 7
**Issues found:** 1 (Medium)

| # | Claim | Classification | Details |
|---|-------|---------------|---------|
| 1-3, 5-7 | Local dev workflow steps | CORRECT | All verified |
| 4 | `supabase gen types --lang typescript --local` | **INCOMPLETE** | Current docs use positional syntax: `supabase gen types typescript --local`. `--lang` form still works but is older |

Sources:
- [Generating TypeScript Types](https://supabase.com/docs/guides/api/rest/generating-types)

---

### [tooling-workflow-migration-create.md](../skills/supabase/references/tooling-workflow-migration-create.md)

**Claims checked:** 7
**Issues found:** 1 (Medium)

| # | Claim | Classification | Details |
|---|-------|---------------|---------|
| 1, 3-5 | Migration workflow steps | CORRECT | All verified |
| 2 | `supabase migration fetch --yes` | **INCOMPLETE** | Command not in official docs. Canonical command is `supabase db pull` |
| 6 | `db diff --linked` as "drift check" | CORRECT | Slightly simplified but accurate |

Sources:
- [Local development overview](https://supabase.com/docs/guides/local-development/overview)

---

### [tooling-workflow-type-generation.md](../skills/supabase/references/tooling-workflow-type-generation.md)

**Claims checked:** 6
**Issues found:** 1 (Low)

| # | Claim | Classification | Details |
|---|-------|---------------|---------|
| 1-5 | Type generation commands | CORRECT | All verified |
| 6 | CI example completeness | **INCOMPLETE** | Omits `supabase db start` step that official CI example includes |

Sources:
- [Generating TypeScript Types](https://supabase.com/docs/guides/api/rest/generating-types)
- [Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)

---

## Strongest Sections (Zero Issues)

These files had zero issues across all checks:
- `db-rls-mandatory.md`, `db-rls-policy-types.md`, `db-schema-jsonb.md`, `db-schema-timestamps.md`
- `db-perf-indexes.md`, `db-perf-query-optimization.md`, `db-security-functions.md`
- `db-migrations-idempotent.md`
- `auth-core-signup.md`, `auth-hooks-custom-claims.md`, `auth-hooks-send-email.md`
- `auth-mfa-totp.md`, `auth-oauth-pkce.md`, `auth-oauth-providers.md`
- `auth-passwordless-magic-links.md`, `auth-passwordless-otp.md`, `auth-server-ssr.md`
- `storage-cdn-caching.md`, `storage-download-urls.md`, `storage-upload-standard.md`
- `edge-fun-quickstart.md`, `edge-fun-project-structure.md`, `edge-pat-cors.md`
- `edge-pat-error-handling.md`, `edge-adv-streaming.md`, `edge-adv-websockets.md`, `edge-adv-regional.md`
- `edge-auth-rls-integration.md`, `edge-db-direct-postgres.md`, `edge-db-supabase-client.md`
- `cli-database-commands.md`, `cli-migration-commands.md`, `cli-project-commands.md`, `cli-secrets-commands.md`
- `sdk-client-browser.md`, `sdk-client-config.md`, `sdk-error-handling.md`
- `sdk-query-crud.md`, `sdk-query-filters.md`, `sdk-query-joins.md`, `sdk-query-rpc.md`
- `sdk-ts-generation.md`, `sdk-ts-usage.md`, `sdk-perf-queries.md`
- `realtime-presence-tracking.md`, `realtime-setup-channels.md`, `realtime-patterns-errors.md`
- `vectors-embed-generation.md`, `vectors-index-hnsw.md`, `vectors-index-ivfflat.md`, `vectors-setup-pgvector.md`
- `tooling-tool-selection.md`, `tooling-workflow-function-dev.md`
