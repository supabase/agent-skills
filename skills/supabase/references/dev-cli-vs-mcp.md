---
title: CLI vs MCP Decision Guide
tags: cli, mcp, decision, tool-selection, local, remote, sdk, execute_sql, apply_migration
---

## CLI vs MCP Decision Guide

**Local development uses CLI for schema commit and project management, local MCP for agent database access (iteration, debugging), and supabase-js SDK for application code. Remote development uses MCP for schema changes via `apply_migration` and `execute_sql` for database queries — and CLI for syncing migrations, generating types, and deploying functions.**

**Incorrect:**

```bash
# Using execute_sql on local without committing to migration
execute_sql({ query: "CREATE TABLE posts (...)" })
# Schema exists only in DB — not in migration files

# Using execute_sql for DDL on remote — no migration trail
execute_sql({ project_id: "ref", query: "CREATE TABLE posts (...)" })
# Wrong — use apply_migration for remote schema changes

# Writing application code with raw SQL
exec("execute_sql({ query: 'SELECT * FROM posts' })")
# Wrong — use supabase-js SDK in app code
```

**Correct:**

```bash
# Local iteration: execute_sql via local MCP, then commit
execute_sql({ query: "CREATE TABLE posts (...)" })
# ... iterate ...
npx supabase db pull "create_posts" --local --yes

# Remote schema changes: apply_migration via remote MCP
apply_migration({ project_id: "ref", name: "create_posts", query: "CREATE TABLE posts (...)" })
npx supabase migration fetch --yes

# Application code: supabase-js SDK
# const { data } = await supabase.from('posts').select('*').limit(10)
```

## Four Distinct Tool Roles

| Tool | Role | Scope |
| --- | --- | --- |
| CLI (`npx supabase`) | Schema commit, project management, deployment | Both local and remote |
| Local MCP (`127.0.0.1:54321/mcp`) | Agent database access (iteration, debugging) | Local only |
| Remote MCP (`mcp.supabase.com`) | Agent database access, schema changes via `apply_migration` | Remote only |
| supabase-js SDK | Application database client | User's app code |

**IMPORTANT: Local MCP and Remote MCP are your tools** for interacting with the database. The **SDK** is how the user's application connects to Supabase.

## Local Development: CLI + Local MCP

| Operation | Tool | Command |
| --- | --- | --- |
| Initialize project | CLI | `npx supabase init` |
| Start local stack | CLI | `npx supabase start` |
| Stop local stack | CLI | `npx supabase stop` |
| Iterate on schema (DDL) | Local MCP | `execute_sql({ query: "CREATE TABLE ..." })` |
| Inspect data, debug queries | Local MCP | `execute_sql({ query: "SELECT ..." })` |
| Inspect tables | Local MCP | `list_tables(...)` |
| Test RLS policies | Local MCP | `execute_sql({ query: "SET request.jwt.claims = '...'; SELECT ..." })` |
| Check security/performance | Local MCP | `get_advisors(...)` |
| Inspect schema diff | CLI | `npx supabase db diff --local` |
| Commit schema to migration | CLI | `npx supabase db pull "name" --local --yes` |
| Generate types | CLI | `npx supabase gen types --local > types.ts` |
| Serve functions locally | CLI | `npx supabase functions serve` |

## Remote Project: Remote MCP + CLI

Use the **Supabase remote MCP server** for schema changes, database queries, logs, and advisors. Use **CLI** for syncing migrations, generating types, and deploying.

### MCP (schema changes and database interaction)

| Operation | Tool | Command |
| --- | --- | --- |
| Apply schema changes | MCP | `apply_migration({ project_id, name, query })` |
| Run SQL queries (non-schema) | MCP | `execute_sql({ project_id, query })` |
| View service logs | MCP | `get_logs({ project_id, service })` |
| Security/performance check | MCP | `get_advisors({ project_id })` |
| Inspect tables | MCP | `list_tables({ project_id })` |
| List migrations | MCP | `list_migrations({ project_id })` |

### CLI (sync, types, and deployment)

| Operation | Tool | Command |
| --- | --- | --- |
| Sync remote migrations locally | CLI | `npx supabase migration fetch --yes` |
| Deploy functions | CLI | `npx supabase functions deploy` |
| Set secrets | CLI | `npx supabase secrets set` |
| Generate types from remote | CLI | `npx supabase gen types --linked > types.ts` |

## Migration Workflow Decision Tree

```text
Local development?
└── Iterate with execute_sql via local MCP
    └── Commit: npx supabase db pull "name" --local --yes
        └── Types: npx supabase gen types --local

Remote development?
└── apply_migration via remote MCP (creates recorded migration)
    └── Sync: npx supabase migration fetch --yes
        └── Types: npx supabase gen types --linked
```

## Schema Changes: Always Recorded

Schema changes always result in a migration file — never untracked DDL:

- **Local:** Iterate freely with `execute_sql`, then commit via `npx supabase db pull "name" --local --yes`
- **Remote:** Use `apply_migration` which creates a recorded migration, then sync with `npx supabase migration fetch --yes`

Use `execute_sql` on the remote MCP server only for **non-schema-changing SQL** (SELECT queries, data exploration, debugging RLS policies).

## Why This Split

1. **CLI = schema commit authority** — Migration files go through CLI for auditability, repeatability, and CI/CD
2. **Local MCP = agent's local workspace** — Fast iteration with `execute_sql`, commit when ready via CLI
3. **Remote MCP = agent's remote workspace** — `apply_migration` creates recorded migrations; `execute_sql` for read-only queries
4. **SDK = application client** — The user's app code connects through supabase-js, not raw SQL
