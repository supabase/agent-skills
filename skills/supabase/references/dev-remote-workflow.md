---
title: Remote Development Workflow
tags: remote, hosted, workflow, deploy, link, mcp, apply_migration
---

## Remote Development Workflow

Use the **Supabase remote MCP server** to apply schema changes via MCP tool `apply_migration` and interact with the hosted project (queries, logs, advisors). Use the **CLI** to sync migrations locally, generate types, and deploy edge functions.

**Incorrect:**

```bash
# Using execute_sql for DDL on remote — no migration trail
execute_sql({ project_id: "ref", query: "CREATE TABLE posts (...)" })
# Wrong — DDL via execute_sql leaves no migration record
```

**Correct:**

```javascript
// Schema changes via MCP tool apply_migration (creates a recorded migration)
apply_migration({
  project_id: "ref",
  name: "create_posts",
  query: "CREATE TABLE posts (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, title text NOT NULL, created_at timestamptz DEFAULT now())"
})

// Then sync migrations locally
// npx supabase migration fetch --yes
```

## Prerequisites

1. CLI linked to project:

```bash
npx supabase login
npx supabase link --project-ref <project-id>
```

2. Supabase remote MCP server configured (see [dev-mcp-setup.md](dev-mcp-setup.md))

**Find project ref:** Check `supabase/.temp/project-ref` or run `npx supabase projects list`.

## MCP Server Self-Configuration

If no Supabase MCP tools are available when interacting with a remote project:

1. Check if the Supabase MCP server is configured for the project
2. If not configured, fetch the client configuration from [Supabase MCP client configuration](https://supabase.com/docs/guides/getting-started/mcp#step-2-configure-your-ai-tool) for the current AI tool
3. Configure the MCP server automatically
4. Ask the user to authenticate via the browser OAuth flow that opens when the MCP server first connects

## Complete Cycle

| Step | Tool | Command | Purpose |
| --- | --- | --- | --- |
| 1 | MCP | `list_tables` | Explore current schema |
| 2 | MCP | `apply_migration` | Apply schema changes as a recorded migration |
| 3 | MCP | `get_advisors` | Check security/performance |
| 4 | CLI | `npx supabase migration fetch --yes` | Sync remote migrations locally |
| 5 | CLI | `npx supabase gen types --linked` | Generate TypeScript types |
| 6 | CLI | `npx supabase functions deploy` | Deploy edge functions |

## Schema Changes: apply_migration Workflow

`apply_migration` is the primary method for schema changes on remote projects. It creates a recorded migration on the remote database.

```javascript
// 1. Inspect current schema
list_tables({ project_id: "ref", verbose: true })

// 2. Apply schema changes
apply_migration({
  project_id: "ref",
  name: "create_posts",
  query: "CREATE TABLE posts (...); ALTER TABLE posts ENABLE ROW LEVEL SECURITY;"
})

// 3. Check advisors
get_advisors({ project_id: "ref", type: "security" })
get_advisors({ project_id: "ref", type: "performance" })
```

Then sync locally and generate types:

```bash
npx supabase migration fetch --yes
npx supabase gen types --linked > types.ts
```

## Query with execute_sql (Non-Schema Only)

Use `execute_sql` for read queries, data exploration, and debugging — **not** for DDL (CREATE, ALTER, DROP). Use `apply_migration` for all DDL.

```javascript
execute_sql({ project_id: "ref", query: "SELECT * FROM posts LIMIT 10" })
execute_sql({ project_id: "ref", query: "SELECT * FROM auth.users LIMIT 5" })
```

## Sync Remote Changes Locally

After applying migrations via MCP, sync them to the local filesystem:

```bash
npx supabase migration fetch --yes
npx supabase gen types --linked > types.ts
```

## Check Advisors

```javascript
get_advisors({ project_id: "ref", type: "security" })
get_advisors({ project_id: "ref", type: "performance" })
```

Run after schema changes — catches missing RLS policies, unused indexes, security issues.

## Debug

```javascript
get_logs({ project_id: "ref", service: "postgres" })          // Query errors
get_logs({ project_id: "ref", service: "api" })               // PostgREST / RLS
get_logs({ project_id: "ref", service: "edge-function" })     // Function errors
get_logs({ project_id: "ref", service: "auth" })              // Auth issues
```

## Deploy Functions

```bash
npx supabase functions deploy                    # Deploy all functions
npx supabase functions deploy hello-world        # Deploy specific function
```

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Could not find the '<column>' column of '<table>' in the schema cache` | Update types and implementation to match current schema |
| No project ref | Run `npx supabase link` to link workspace to a hosted project, or check `supabase/.temp/project-ref` |
| Schema drift (data not appearing in app) | Run `npx supabase db diff --linked` to check. If drift exists, run `npx supabase db pull "name" --yes` to store changes locally and repair history. Then update types. |

## Related

- [dev-cli-reference.md](dev-cli-reference.md) — CLI command details
- [dev-mcp-tools.md](dev-mcp-tools.md) — MCP tool reference
- [dev-cli-vs-mcp.md](dev-cli-vs-mcp.md) — When to use CLI vs MCP
- [dev-mcp-setup.md](dev-mcp-setup.md) — MCP server configuration
