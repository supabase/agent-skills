---
title: Local Development Workflow
tags: local, development, workflow, iteration, docker, mcp, cli, sdk, execute_sql
---

## Local Development Workflow

> **IMPORTANT: The local Supabase stack must be running before you can use the MCP server.**
>
> The MCP server at `http://localhost:54321/mcp` is only available when the local stack is running. If it is not running, **start it first**:
>
> ```bash
> npx supabase start
> ```
>
> Wait for the command to complete — it will print the local URLs and credentials when ready. Only then will the MCP server be reachable and `execute_sql`, `get_advisors`, and other MCP tools work. Do not skip this step or fall back to writing migration files manually.

Use the **local MCP server** (`execute_sql`) to iterate on schema and debug. Use the **CLI** to commit schema changes to migration files, manage the local stack, and generate types. Use **supabase-js** in the application code for all client-side database interaction.

**Incorrect:**

```bash
# Iterating with execute_sql without committing to a migration
execute_sql({ query: "CREATE TABLE posts (...)" })
execute_sql({ query: "ALTER TABLE posts ADD COLUMN content text" })
# Problem: schema changes exist only in the local database, not in migration files
```

**Correct:**

```bash
# 1. Start local stack
npx supabase start

# 2. Iterate on schema with local MCP
execute_sql({ query: "CREATE TABLE posts (...)" })
execute_sql({ query: "ALTER TABLE posts ADD COLUMN content text" })

# 3. Inspect diff to inform migration name
npx supabase db diff --local

# 4. Commit schema to migration file
npx supabase db pull "create_posts" --local --yes

# 5. Generate types
npx supabase gen types --local > types.ts
```

## Local MCP Server

The local stack exposes an MCP server at `http://127.0.0.1:54321/mcp` with database and debugging tools. It starts automatically with `npx supabase start` — no extra configuration required.

- Supports a subset of the remote MCP tools (database, debugging, development tools)
- DDL via `execute_sql` is allowed locally (unlike remote, where DDL is restricted)
- Configure your AI client with this URL the same way as the remote MCP server

Verify the URL with `npx supabase status` (the port may differ if customized in `config.toml`).

## Tool Roles

| Tool | Role | Used For |
| --- | --- | --- |
| CLI (`npx supabase`) | Project management, schema commit, deployment | `start`, `db diff`, `db pull`, `gen types` |
| Local MCP (`execute_sql`) | Agent database access | Schema iteration, debugging, inspection, testing RLS |
| supabase-js SDK | Application database client | All database interaction in the user's app code |

**Key distinction:** Local MCP `execute_sql` is the agent's tool for iterating on schema and inspecting the local database. The user's application code connects through the **supabase-js SDK**. Schema changes are committed to migration files via the **CLI**.

## Complete Cycle

| Step | Tool | Command | Purpose |
| --- | --- | --- | --- |
| 1 | CLI | `npx supabase start` | Start local services |
| 2 | CLI | `npx supabase status` | Get credentials and local MCP URL |
| 3 | Local MCP | `execute_sql(...)` | Iterate on schema (DDL allowed locally) |
| 4 | Local MCP | `execute_sql(...)` / `list_tables(...)` | Inspect data, test RLS, debug |
| 5 | Local MCP | `get_advisors(...)` | Check security/performance |
| 6 | CLI | `npx supabase db diff --local` | Inspect changes to inform migration name |
| 7 | CLI | `npx supabase db pull "name" --local --yes` | Commit schema to migration file |
| 8 | CLI | `npx supabase gen types --local` | Generate TypeScript types |

## Committing Schema Changes

After iterating on schema with `execute_sql`, commit changes to a migration file:

1. Verify schema state via `execute_sql` or `list_tables`
2. Run `get_advisors` via local MCP to check security and performance
3. Inspect the diff: `npx supabase db diff --local` (use the output to inform a descriptive migration name)
4. Commit to migration: `npx supabase db pull "descriptive_name" --local --yes`
5. Verify sync: `npx supabase migration list --local`
6. Generate types: `npx supabase gen types --local > types.ts`
7. Remind the user to commit changes at the end of each schema-modifying turn

## Verify Migrations Replay (db reset)

`db reset` drops the local database and recreates it from committed migrations + `supabase/seed.sql`. Use it only when you need to verify that migrations replay cleanly (e.g., before pushing to CI or after major schema changes).

**This destroys all local data.** Always ask the user for consent before running it.

```bash
# 1. Back up local data to seed file (so reset restores it)
npx supabase db dump --data-only --local > supabase/seed.sql

# 2. Reset (ask user first!)
npx supabase db reset

# 3. Verify the schema is correct after reset
npx supabase migration list --local
```

If `supabase/seed.sql` exists, `db reset` automatically runs it after applying migrations — so backed-up data is restored. If the schema changed significantly, update or regenerate the seed file to match the new schema.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Error calling MCP tool: fetch failed` | Check if local stack is running: `npx supabase status` then `npx supabase start` |
| PostgREST endpoint failures or RLS issues | Review "api" logs via MCP `get_logs` |
| Slow queries, errors, or connection issues | Review "postgres" logs via MCP `get_logs` |
| Local MCP not responding | Verify URL with `npx supabase status`, restart with `npx supabase stop` then `npx supabase start` |

## Related

- [dev-cli-reference.md](dev-cli-reference.md) — CLI command details
- [dev-cli-vs-mcp.md](dev-cli-vs-mcp.md) — When to use CLI vs local MCP vs remote MCP
- [dev-mcp-setup.md](dev-mcp-setup.md) — MCP server configuration
