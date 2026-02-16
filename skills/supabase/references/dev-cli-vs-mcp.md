---
title: CLI + psql vs MCP Decision Guide
tags: cli, psql, mcp, decision, tool-selection, local, remote, sdk
---

## CLI + psql vs MCP Decision Guide

**Local development uses CLI for schema changes and project management, `psql` for agent debugging and inspection, and supabase-js SDK for application code. Remote project interaction uses MCP for database queries, logs, and advisors — and CLI for everything else (migrations, deployments, type generation).**

**Incorrect:**

```bash
# Using psql to author schema changes
psql "$DB_URL" -c "CREATE TABLE posts (...)"   # Wrong — use CLI migrations

# Using MCP execute_sql for local database interaction
execute_sql({ query: "SELECT * FROM posts" })   # Wrong — use psql locally

# Using psql to connect to the remote hosted database
psql "postgresql://..." -c "SELECT * FROM posts" # Wrong — use MCP for remote

# Writing application code that shells out to psql
exec("psql ... -c 'SELECT * FROM posts'")        # Wrong — use supabase-js SDK
```

**Correct:**

```bash
# Schema changes: always through CLI migrations
npx supabase migration new create_posts
# Edit the migration file...
npx supabase db reset

# Local debugging: psql (agent tool)
psql "$DB_URL" -c "SELECT * FROM posts LIMIT 10"

# Remote debugging: MCP
execute_sql({ project_id: "ref", query: "SELECT * FROM posts LIMIT 10" })

# Application code: supabase-js SDK
# const { data } = await supabase.from('posts').select('*').limit(10)
```

## Three Distinct Tool Roles

| Tool | Role | Scope |
| --- | --- | --- |
| CLI (`npx supabase`) | Schema changes, project management, deployment | Both local and remote |
| `psql` | Agent database access (debugging, inspection) | Local only |
| MCP server | Agent database access (debugging, inspection) | Remote only |
| supabase-js SDK | Application database client | User's app code |

**`psql` and MCP are the agent's tools** for connecting to the database to debug, inspect, and troubleshoot. They are not for authoring schema changes or for use in the user's application code. The **SDK** is how the application connects to Supabase.

## Local Development: CLI + psql

| Operation | Tool | Command |
| --- | --- | --- |
| Initialize project | CLI | `npx supabase init` |
| Start local stack | CLI | `npx supabase start` |
| Stop local stack | CLI | `npx supabase stop` |
| Create migration | CLI | `npx supabase migration new "name"` |
| Capture schema drift | CLI | `npx supabase db diff -f "name"` |
| Apply and verify migrations | CLI | `npx supabase db reset` |
| Generate types | CLI | `npx supabase gen types --lang typescript --local > types.ts` |
| Serve functions locally | CLI | `npx supabase functions serve` |
| Debug queries, inspect data | psql | `psql "$DB_URL" -c "SELECT ..."` |
| Inspect schema | psql | `psql "$DB_URL" -c "\d table_name"` |
| Test RLS policies | psql | `psql "$DB_URL" -c "SET request.jwt.claims = '...'; SELECT ..."` |

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

Schema changes always go through the CLI migration workflow — never through `psql` DDL or MCP `execute_sql`:

1. Create migration with `npx supabase migration new` (or capture drift with `db diff`)
2. Edit the migration SQL file
3. Apply locally with `npx supabase db reset`
4. Preview with `npx supabase db push --dry-run`
5. Ask the user for permission
6. Deploy with `npx supabase db push`

Use `execute_sql` on the remote MCP server only for **non-schema-changing SQL** (SELECT queries, data exploration, debugging RLS policies).

## Why This Split

1. **CLI = schema authority** — All schema changes flow through migration files for auditability, repeatability, and CI/CD
2. **`psql` = agent's local debugger** — Fast, direct access for the agent to inspect data, test RLS, and troubleshoot
3. **MCP = agent's remote debugger** — Authenticated access to hosted project data that CLI cannot provide
4. **SDK = application client** — The user's app code connects through supabase-js, not psql or raw SQL
5. **Migrations always via CLI** — `db push` ensures local and remote migration history stay in sync
