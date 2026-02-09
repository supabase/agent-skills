# Supabase Skill Reference Files — Accuracy Report

**Date:** 2026-02-09
**Branch:** `feature/supabase-skill`
**Files reviewed:** 101 reference files across 10 categories
**Method:** Each file was verified against official Supabase documentation via `mcp__supabase__search_docs`

---

## Executive Summary

| Category | Files | Accurate | Mostly Accurate | Needs Correction | P0 | P1 | P2 |
|----------|------:|:--------:|:---------------:|:----------------:|:--:|:--:|:--:|
| Database | 18 | 13 | 3 | 2 | 0 | 4 | 17 |
| CLI | 8 | 4 | 3 | 1 | 1 | 1 | 7 |
| MCP | 3 | 1 | 2 | 0 | 0 | 1 | 1 |
| Tooling | 6 | 5 | 1 | 0 | 0 | 0 | 2 |
| Auth | 14 | 10 | 2 | 2 | 0 | 3 | 5 |
| Edge Functions | 15 | 5 | 7 | 2 | 1 | 5 | 12 |
| SDK | 13 | 11 | 2 | 0 | 0 | 0 | 2 |
| Storage | 7 | 6 | 1 | 0 | 0 | 0 | 1 |
| Realtime | 9 | 7 | 2 | 0 | 0 | 1 | 1 |
| Vectors | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| **Totals** | **101** | **70 (69%)** | **23 (23%)** | **6 (6%)** | **2** | **15** | **48** |

**Overall accuracy is high:** 93% of files are Accurate or Mostly Accurate. Only 6 files need correction. There are 2 P0 critical issues that should be fixed immediately.

---

## P0 Critical Issues (2)

These issues contain factually incorrect information that will cause runtime errors or broken behavior.

### 1. `edge-auth-jwt-verification.md` — Wrong `getClaims()` API signature

The file shows `supabase.auth.getClaims(token)` returning `data.claims.sub`. The official API is `getClaims()` (no token argument) returning `{ data: { user }, error }`, not `{ data: { claims }, error }`. Users following this reference will get runtime errors.

### 2. `cli-decision-guide.md` — Fabricated diff engine flags

The file lists `--use-pg-delta` and `--use-pg-schema` as diff engine flags. These do **not exist** in the official Supabase CLI documentation. Only `--use-migra` is documented as an experimental alternative. These flags appear to be hallucinated.

---

## P1 Important Issues (15)

### Database (4 issues)

| File | Issue |
|------|-------|
| `db-conn-pooling.md` | Transaction mode connection string format is wrong — uses `pooler.supabase.com:6543` but should be `db.[ref].supabase.co:6543` |
| `db-conn-pooling.md` | Transaction mode limitations list is incomplete/inaccurate for Supavisor vs PgBouncer. Missing Dedicated Pooler (PgBouncer) option entirely |
| `db-schema-extensions.md` | pgvector index example recommends IVFFlat but HNSW is now the recommended default |
| `db-security-service-role.md` | API key types table doesn't mention that publishable/secret keys are platform-only (not available in CLI/self-hosting) |

### CLI/MCP/Tooling (2 issues)

| File | Issue |
|------|-------|
| `cli-decision-guide.md` | "migration down vs db reset" section incorrectly claims both commands "drop and recreate the database." `migration down` is a rollback mechanism, not a drop-and-recreate |
| `cli-gotchas-pitfalls.md` | `supabase db dump --data-only --local` — the `--local` flag is not documented for `db dump`, which targets remote databases |

### MCP (1 issue)

| File | Issue |
|------|-------|
| `mcp-setup-configuration.md` | Local MCP URL `http://127.0.0.1:54321/mcp` needs verification — self-hosting docs show a different port/path pattern |

### Auth (3 issues)

| File | Issue |
|------|-------|
| `auth-server-ssr.md` | Middleware example uses `getUser()` but official SSR guide now recommends `getClaims()` in the proxy layer. Also uses `middleware.ts` naming while docs have moved to `proxy.ts` |
| `auth-oauth-pkce.md` | Missing `await` on `cookies()` call — since Next.js 15, `cookies()` is async. Without `await`, returns a Promise instead of the cookie store |
| `auth-hooks-send-email.md` | `config.toml` example uses `pg-functions://` URI scheme which is for PostgreSQL hooks, not Edge Function HTTPS hooks |

### Edge Functions (5 issues)

| File | Issue |
|------|-------|
| `edge-pat-background-tasks.md` | Uses `addEventListener("beforeunload", ...)` but official docs show `addEventListener('unload', ...)` |
| `edge-dbg-limits.md` | `--debug` flag for `supabase functions serve` is not documented in official docs |
| `edge-dbg-limits.md` | CPU time listed as "2s" but troubleshooting docs say "200 milliseconds" — discrepancy in official docs themselves |
| `edge-dbg-testing.md` | Uses `SUPABASE_ANON_KEY` but official testing docs now use `SUPABASE_PUBLISHABLE_KEY` |
| `edge-adv-websockets.md` | Uses `supabase.auth.getUser(token)` but official WebSocket docs now show `supabase.auth.getClaims()` as the recommended lighter-weight approach |

### Realtime (1 issue)

| File | Issue |
|------|-------|
| `realtime-broadcast-basics.md` | References `channel.httpSend('event', payload)` method which is not in the official JS SDK docs. The correct API is `channel.send({ type: 'broadcast', event, payload })` |

---

## P2 Minor Issues (48)

Minor issues include: incomplete flag lists, slight syntax preferences (JSR vs npm imports), outdated environment variable names (`SUPABASE_ANON_KEY` → `SUPABASE_PUBLISHABLE_KEY`), missing compute tiers in tables, and editorial choices that differ from current docs but are not incorrect.

### Distribution by category:
- Database: 17 (connection pooling table gaps, migration command ordering, schema realtime caveats)
- CLI: 7 (incomplete flag lists, experimental flags table potentially outdated)
- MCP: 1 (feature group name verification)
- Tooling: 2 (get_logs service parameter name, tool overlap clarification)
- Auth: 5 (getClaims limitation note, env var naming transition, missing email types in example)
- Edge Functions: 12 (Hono JSR imports, env var naming, region list incomplete, template differences)
- SDK: 2 (JSON filter arrow operator nuance, categorization)
- Storage: 1 (self-hosted availability nuance for image transforms)
- Realtime: 1 (logger callback signature details)
- Vectors: 0

---

## Category Deep Dives

### Database (18 files) — 0 P0, 4 P1, 17 P2

| File | Rating |
|------|--------|
| `db-conn-pooling.md` | NEEDS CORRECTION |
| `db-migrations-diff.md` | MOSTLY ACCURATE |
| `db-migrations-idempotent.md` | ACCURATE |
| `db-migrations-testing.md` | ACCURATE |
| `db-perf-indexes.md` | ACCURATE |
| `db-perf-query-optimization.md` | ACCURATE |
| `db-rls-common-mistakes.md` | ACCURATE |
| `db-rls-mandatory.md` | ACCURATE |
| `db-rls-performance.md` | ACCURATE |
| `db-rls-policy-types.md` | ACCURATE |
| `db-rls-views.md` | ACCURATE |
| `db-schema-auth-fk.md` | ACCURATE |
| `db-schema-extensions.md` | MOSTLY ACCURATE |
| `db-schema-jsonb.md` | ACCURATE |
| `db-schema-realtime.md` | MOSTLY ACCURATE |
| `db-schema-timestamps.md` | ACCURATE |
| `db-security-functions.md` | ACCURATE |
| `db-security-service-role.md` | NEEDS CORRECTION |

### CLI (8 files) — 1 P0, 1 P1, 7 P2

| File | Rating |
|------|--------|
| `cli-database-commands.md` | MOSTLY ACCURATE |
| `cli-decision-guide.md` | NEEDS CORRECTION |
| `cli-functions-commands.md` | MOSTLY ACCURATE |
| `cli-generation-commands.md` | ACCURATE |
| `cli-gotchas-pitfalls.md` | MOSTLY ACCURATE |
| `cli-migration-commands.md` | ACCURATE |
| `cli-project-commands.md` | ACCURATE |
| `cli-secrets-commands.md` | ACCURATE |

### MCP (3 files) — 0 P0, 1 P1, 1 P2

| File | Rating |
|------|--------|
| `mcp-setup-configuration.md` | MOSTLY ACCURATE |
| `mcp-setup-feature-groups.md` | MOSTLY ACCURATE |
| `mcp-setup-security.md` | ACCURATE |

### Tooling (6 files) — 0 P0, 0 P1, 2 P2

| File | Rating |
|------|--------|
| `tooling-tool-overlap.md` | MOSTLY ACCURATE |
| `tooling-tool-selection.md` | ACCURATE |
| `tooling-workflow-function-dev.md` | ACCURATE |
| `tooling-workflow-local-dev.md` | ACCURATE |
| `tooling-workflow-migration-create.md` | ACCURATE |
| `tooling-workflow-type-generation.md` | ACCURATE |

### Auth (14 files) — 0 P0, 3 P1, 5 P2

| File | Rating |
|------|--------|
| `auth-core-sessions.md` | MOSTLY ACCURATE |
| `auth-core-signin.md` | ACCURATE |
| `auth-core-signup.md` | ACCURATE |
| `auth-hooks-custom-claims.md` | ACCURATE |
| `auth-hooks-send-email.md` | MOSTLY ACCURATE |
| `auth-mfa-phone.md` | ACCURATE |
| `auth-mfa-totp.md` | ACCURATE |
| `auth-oauth-pkce.md` | NEEDS CORRECTION |
| `auth-oauth-providers.md` | ACCURATE |
| `auth-passwordless-magic-links.md` | ACCURATE |
| `auth-passwordless-otp.md` | ACCURATE |
| `auth-server-admin-api.md` | ACCURATE |
| `auth-server-ssr.md` | NEEDS CORRECTION |
| `auth-sso-saml.md` | ACCURATE |

### Edge Functions (15 files) — 1 P0, 5 P1, 12 P2

| File | Rating |
|------|--------|
| `edge-fun-quickstart.md` | MOSTLY ACCURATE |
| `edge-fun-project-structure.md` | ACCURATE |
| `edge-pat-cors.md` | ACCURATE |
| `edge-pat-error-handling.md` | ACCURATE |
| `edge-pat-routing.md` | MOSTLY ACCURATE |
| `edge-pat-background-tasks.md` | MOSTLY ACCURATE |
| `edge-auth-jwt-verification.md` | NEEDS CORRECTION |
| `edge-auth-rls-integration.md` | ACCURATE |
| `edge-db-direct-postgres.md` | MOSTLY ACCURATE |
| `edge-db-supabase-client.md` | ACCURATE |
| `edge-dbg-limits.md` | NEEDS CORRECTION |
| `edge-dbg-testing.md` | MOSTLY ACCURATE |
| `edge-adv-regional.md` | MOSTLY ACCURATE |
| `edge-adv-streaming.md` | ACCURATE |
| `edge-adv-websockets.md` | MOSTLY ACCURATE |

### SDK (13 files) — 0 P0, 0 P1, 2 P2

| File | Rating |
|------|--------|
| `sdk-client-browser.md` | ACCURATE |
| `sdk-client-config.md` | ACCURATE |
| `sdk-client-server.md` | ACCURATE |
| `sdk-error-handling.md` | ACCURATE |
| `sdk-framework-nextjs.md` | ACCURATE |
| `sdk-perf-queries.md` | ACCURATE |
| `sdk-perf-realtime.md` | MOSTLY ACCURATE |
| `sdk-query-crud.md` | ACCURATE |
| `sdk-query-filters.md` | MOSTLY ACCURATE |
| `sdk-query-joins.md` | ACCURATE |
| `sdk-query-rpc.md` | ACCURATE |
| `sdk-ts-generation.md` | ACCURATE |
| `sdk-ts-usage.md` | ACCURATE |

### Storage (7 files) — 0 P0, 0 P1, 1 P2

| File | Rating |
|------|--------|
| `storage-access-control.md` | ACCURATE |
| `storage-cdn-caching.md` | ACCURATE |
| `storage-download-urls.md` | ACCURATE |
| `storage-ops-file-management.md` | ACCURATE |
| `storage-transform-images.md` | MOSTLY ACCURATE |
| `storage-upload-resumable.md` | ACCURATE |
| `storage-upload-standard.md` | ACCURATE |

### Realtime (9 files) — 0 P0, 1 P1, 1 P2

| File | Rating |
|------|--------|
| `realtime-broadcast-basics.md` | MOSTLY ACCURATE |
| `realtime-broadcast-database.md` | ACCURATE |
| `realtime-patterns-cleanup.md` | ACCURATE |
| `realtime-patterns-debugging.md` | MOSTLY ACCURATE |
| `realtime-patterns-errors.md` | ACCURATE |
| `realtime-postgres-changes.md` | ACCURATE |
| `realtime-presence-tracking.md` | ACCURATE |
| `realtime-setup-auth.md` | ACCURATE |
| `realtime-setup-channels.md` | ACCURATE |

### Vectors (8 files) — 0 P0, 0 P1, 0 P2

| File | Rating |
|------|--------|
| `vectors-embed-generation.md` | ACCURATE |
| `vectors-index-hnsw.md` | ACCURATE |
| `vectors-index-ivfflat.md` | ACCURATE |
| `vectors-perf-tuning.md` | ACCURATE |
| `vectors-rag-patterns.md` | ACCURATE |
| `vectors-search-hybrid.md` | ACCURATE |
| `vectors-search-semantic.md` | ACCURATE |
| `vectors-setup-pgvector.md` | ACCURATE |

---

## Recommended Fix Priority

1. **Immediate** (P0): Fix `edge-auth-jwt-verification.md` getClaims API and `cli-decision-guide.md` fabricated flags
2. **Soon** (P1): Fix the 15 important issues listed above — connection pooling strings, missing `await`, wrong event names, outdated API recommendations
3. **When convenient** (P2): Update env var names, expand tables, fix import style preferences
