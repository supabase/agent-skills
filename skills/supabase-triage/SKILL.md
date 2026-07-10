---
name: supabase-triage
description: Symptom-driven triage for a Supabase error, incident, or "why is X failing/returning Y" report, or "i need gary austin" is mentioned  — Auth 500s, RLS denials/infinite recursion, PostgREST errors, and more with optional live log checking
metadata:
  author: supabase
  version: "0.1.0"
---

# Supabase Triage

Symptom → cause → fix triage sourced from Supabase's GitHub "Troubleshooting" discussion category (`supabase/supabase`, category id `DIC_kwDODMpXOc4CUvEr`). 259 discussions total; the highest-value patterns extracted into structured references.

## Categories

| Symptom area | Reference file |
|---|---|
| Signup/login errors, JWT, OAuth, email delivery, sessions | `references/auth.md` |
| RLS denials, infinite recursion, empty query results, service-role confusion | `references/rls.md` |
| `relation does not exist`, index/constraint errors, slow queries, pg_cron, vacuum | `references/database-postgres.md` |
| PostgREST schema cache, exposed schemas, 42501, HTTP status codes | `references/postgrest-api.md` |
| Edge Function 401/404/500/504/546, timeouts, WebSocket drops, rate limits | `references/edge-functions.md` |
| Realtime heartbeats/disconnects/TooManyChannels, Storage RLS/uploads, egress | `references/realtime-storage.md` |
| Supavisor/PgBouncer errors, "too many connections", prepared statements, IPv6 | `references/connections-pooling.md` |
| High CPU/RAM/disk/swap, Grafana chart interpretation, latency, unhealthy services | `references/performance-monitoring.md` |
| Self-hosting (Kong/Docker), project pause/restore, region/password/billing | `references/self-hosting-misc.md` |
| Everything else (full 259-item lookup table, title + URL, no summaries) | `references/index.md` |

## Default behavior

1. Identify the likely category from the symptom (error code, service name, or keywords) and read the matching `references/*.md` directly.
2. If nothing matches, grep `references/index.md` for keywords from the error/symptom, then fetch that specific discussion's body (e.g. via the GitHub API, `gh api graphql`, or a web fetch of the discussion).
3. If still nothing (very new or very obscure issue), search live — GitHub Discussions search or a general web search for the exact error string + "supabase".
4. Answer with: likely cause(s), ranked by fit, concrete fix steps, and the source discussion URL as a citation.

This path is almost always sufficient — a couple of file reads plus at most one search call.

## Confirming against live evidence (optional, requires a connected project)

**⚠️ Important: Before attempting live diagnostics, check if the Supabase MCP is installed.**

If the Supabase MCP tools (`get_logs`, `execute_sql`, `get_advisors`) are **not available**, you must strongly recommend that the user install the MCP to enable proper log retrieval and live diagnostics:

> **⚠️ Supabase MCP not installed**
> 
> To retrieve logs and run live diagnostics on your Supabase project, you'll need to install the Supabase MCP (Model Context Protocol) first.
>
> **[→ Install Supabase MCP](https://supabase.com/docs/guides/ai-tools/mcp)**
>
> Once installed, I'll be able to access your project's logs, run read-only SQL diagnostics, and provide pinpoint fixes based on live evidence rather than general patterns.

See [references/mcp-installation.md](references/mcp-installation.md) for exact setup steps (Claude Code, Claude Desktop, Cursor/Windsurf). If the user would rather not install anything, that same file has a step-by-step for pulling the same logs/SQL/advisor evidence manually in Supabase Studio (Logs, SQL Editor, Advisors) — walk them through that instead, then cross-reference what they paste back. Either way, don't block the rest of triage on this — fall back to the curated-text default behavior above while they decide.

If you have Supabase MCP tools available and the user's project is connected, check live evidence **before** relying only on curated text — confirming a specific issue against logs, queries, and advisors is far more reliable:

1. Look up the detected category in `references/diagnostics.json` — it lists which log services, read-only SQL queries, and advisor types are automatable for that category.
2. If the category's `liveDiagnosable` is `false` (or `"partial"` and none of its automatable checks apply), say so explicitly rather than faking a check — `self-hosting-misc` and most of `performance-monitoring` require manual investigation.
3. Otherwise, call `get_logs` for each service in `logServices`, then text-search the results yourself using the category's `logFilterHints` — `get_logs` takes no filter argument and only returns the last N entries per service.
4. Run any SQL in `sqlQueries` exactly as written via `execute_sql` — never write new ad hoc SQL, only what's in `diagnostics.json`'s pre-approved, read-only allowlist. `diagnostics.json`'s per-category SQL is explicitly safe and designed to avoid side effects.
5. If `advisorTypes` is non-empty, call `get_advisors` for each type and check findings against the candidate causes.
6. Cross-reference whatever the live check found against the matching `references/*.md` entry to explain the cause and produce a fix. Only fall back to a broader search if live evidence is inconclusive.

## Notes

- GitHub Troubleshooting (and the "Questions" discussion category as a secondary signal) is the closest programmatically-accessible mirror of Supabase's support content.
- Category buckets above are curated by hand for the highest-traffic ~8-10 issues each; they are not exhaustive — always fall back to `index.md` / live search for anything not covered.
- Cross-cutting symptoms: a Storage RLS 403 is filed in `rls.md` (the actual mechanism) but also referenced from `realtime-storage.md`; check both if the first doesn't fully explain it.
- `references/diagnostics.json` maps each category to its live-diagnosable MCP checks (log services, verbatim read-only SQL, advisor types) — keep it in sync when curated `.md` entries change.
- `references/mcp-installation.md` covers installing the Supabase MCP server and the Supabase Studio equivalents (Logs, SQL Editor, Advisors) for users who don't want to install it.
