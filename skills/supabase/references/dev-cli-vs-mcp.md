---
title: CLI + psql vs MCP Decision Guide
impact: CRITICAL
impactDescription: Prevents agents from using wrong tool for each operation and environment
tags: cli, psql, mcp, decision, tool-selection, local, remote
---

## CLI + psql vs MCP Decision Guide

**Local development uses CLI and `psql`. Remote project interaction uses the Supabase MCP server for database queries, logs, and advisors — and CLI for everything else (migrations, deployments, type generation).**

**Incorrect:**

```bash
# Using MCP execute_sql for local database interaction
execute_sql({ query: "SELECT * FROM posts" })  # Wrong — use psql locally

# Using psql to connect to the remote hosted database
psql "postgresql://..." -c "SELECT * FROM posts"  # Wrong — use MCP for remote
```

**Correct:**

```bash
# Local: use psql for database interaction
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT * FROM posts"

# Remote: use MCP execute_sql for database interaction
execute_sql({ project_id: "ref", query: "SELECT * FROM posts" })
```

## Local Development: CLI + psql

| Operation | Tool | Command |
| --- | --- | --- |
| Initialize project | CLI | `npx supabase init` |
| Start local stack | CLI | `npx supabase start` |
| Stop local stack | CLI | `npx supabase stop` |
| Run SQL queries | psql | `psql "$DB_URL" -c "SELECT ..."` |
| Iterate on schema | psql | `psql "$DB_URL" -c "CREATE TABLE ..."` |
| Capture schema changes | CLI | `npx supabase db diff -f "name"` |
| Create empty migration | CLI | `npx supabase migration new` |
| Verify migrations replay | CLI | `npx supabase db reset` |
| Generate types | CLI | `npx supabase gen types --lang typescript --local > types.ts` |
| Serve functions locally | CLI | `npx supabase functions serve` |

Get the local database URL from `npx supabase status`. The default is `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.

## Remote Project: MCP + CLI

Use the **Supabase remote MCP server** for database queries, logs, and advisors. Use **CLI** for all deployment, migration, and management operations.

### MCP (database interaction and debugging)

| Operation | Tool | Command |
| --- | --- | --- |
| Run SQL queries (non-schema) | MCP | `execute_sql({ project_id, query })` |
| View service logs | MCP | `get_logs({ project_id, service })` |
| Security/performance check | MCP | `get_advisors({ project_id })` |
| Inspect tables | MCP | `list_tables({ project_id })` |
| List migrations | MCP | `list_migrations({ project_id })` |

### CLI (deployment and management)

| Operation | Tool | Command |
| --- | --- | --- |
| Push migrations to remote | CLI | `npx supabase db push` |
| Pull schema from remote | CLI | `npx supabase db pull` |
| Deploy functions | CLI | `npx supabase functions deploy` |
| Set secrets | CLI | `npx supabase secrets set` |
| Generate types from remote | CLI | `npx supabase gen types --lang typescript --linked > types.ts` |

## Migration Deployment Decision Tree

```text
Deploy migrations to remote?
└── npx supabase db push (always preferred — ask user permission first!)

db push fails due to migration mismatch?
├── Try: npx supabase migration repair --status applied <version>
└── Still broken?
    └── Stop and ask user for consent
        └── MCP apply_migration (last resort only)
            └── npx supabase migration fetch --yes (sync locally)
```

## The apply_migration Rule

`apply_migration` is a **last resort** for fixing mismatches between local and remote migration history that CLI cannot resolve. Rules:

1. **Always try CLI first** (`db push`, then `migration repair`)
2. **Always ask the user** before using `apply_migration` on remote
3. **Always sync after** with `npx supabase migration fetch --yes`

## Schema Changes: Always Through Migrations

Use `execute_sql` on the remote MCP server only for **non-schema-changing SQL** (SELECT queries, data exploration, debugging RLS policies). Schema changes on the remote project must go through the migration workflow:

1. Write or capture migrations locally (via `psql` + `db diff`, or `migration new`)
2. Preview with `npx supabase db push --dry-run`
3. Ask the user for permission
4. Deploy with `npx supabase db push`

## Why This Split

1. **Local = CLI + psql** — Fast iteration, no network dependency, file-based migration workflow, CI/CD friendly
2. **Remote = MCP for queries/logs/advisors** — Authenticated access to hosted project data that CLI cannot provide
3. **Remote = CLI for deployments** — `db push`, `functions deploy`, `secrets set`, and `gen types` all use CLI for consistent file-based workflows
4. **Migrations always via CLI** — `db push` ensures local and remote migration history stay in sync
