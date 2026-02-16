---
title: Remote Development Workflow
impact: CRITICAL
impactDescription: Development workflow for interacting with hosted Supabase projects
tags: remote, hosted, workflow, deploy, link, mcp
---

## Remote Development Workflow

Use the **Supabase remote MCP server** to interact with the hosted project (queries, logs, advisors). Use the **CLI** for all deployment and management operations (migrations, functions, secrets, types).

**Incorrect:**

```bash
# Using execute_sql to change schema on remote
execute_sql({ project_id: "ref", query: "CREATE TABLE posts (...)" })
# Wrong — schema changes must go through migration workflow
```

**Correct:**

```bash
# Schema changes go through CLI migrations
npx supabase migration new create_posts
# Edit the migration file...
npx supabase db push --dry-run    # Preview
npx supabase db push              # Deploy (with user permission)

# Use execute_sql only for non-schema queries
execute_sql({ project_id: "ref", query: "SELECT * FROM posts LIMIT 10" })
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
| 1 | MCP | `execute_sql` | Query data, explore schema (non-schema-changing SQL only) |
| 2 | MCP | `get_advisors` | Check security and performance |
| 3 | CLI | `npx supabase migration new` | Create migration file for schema changes |
| 4 | CLI | `npx supabase db push --dry-run` | Preview migration deployment |
| 5 | CLI | `npx supabase db push` | Deploy migrations (with user permission) |
| 6 | CLI | `npx supabase gen types --linked` | Generate TypeScript types |
| 7 | CLI | `npx supabase functions deploy` | Deploy edge functions |

## Query with execute_sql (Non-Schema Only)

Use `execute_sql` for read queries, data exploration, and debugging — **not** for DDL (CREATE, ALTER, DROP).

```javascript
execute_sql({ project_id: "ref", query: "SELECT * FROM posts LIMIT 10" })
execute_sql({ project_id: "ref", query: "SELECT * FROM auth.users LIMIT 5" })
```

## Schema Changes: Migration Workflow

Schema changes on the remote project always go through the CLI migration workflow:

```bash
# Option A: Write migration manually
npx supabase migration new create_posts
# Edit supabase/migrations/<timestamp>_create_posts.sql

# Option B: If developing locally, capture changes with diff
npx supabase db diff -f "create_posts"

# Preview and deploy
npx supabase db push --dry-run
npx supabase db push              # Always ask user permission first!
```

## Sync Remote Changes Locally

When changes were made on the remote project outside of local migrations (e.g., via dashboard):

```bash
npx supabase db pull              # Pull schema as migration file
npx supabase gen types --lang typescript --linked > types.ts
```

## Check Advisors

```javascript
get_advisors({ project_id: "ref" })
```

Run after schema changes — catches missing RLS policies, unused indexes, security issues.

## Debug

```javascript
get_logs({ project_id: "ref", service: "postgres" })          // Query errors
get_logs({ project_id: "ref", service: "api" })               // PostgREST / RLS
get_logs({ project_id: "ref", service: "edge_functions" })    // Function errors
get_logs({ project_id: "ref", service: "auth" })              // Auth issues
```

## Deploy Functions

```bash
npx supabase functions deploy                    # Deploy all functions
npx supabase functions deploy hello-world        # Deploy specific function
```

## Deploy Migrations

**Always preferred:** `npx supabase db push` (ask user permission first!)

**Last resort only:** MCP `apply_migration` — only when `db push` fails due to migration mismatch and `migration repair` cannot fix it. Always ask the user for consent first. Always sync after with `npx supabase migration fetch --yes`.

## Related

- [dev-cli-reference.md](dev-cli-reference.md) — CLI command details
- [dev-mcp-tools.md](dev-mcp-tools.md) — MCP tool reference
- [dev-cli-vs-mcp.md](dev-cli-vs-mcp.md) — When to use CLI+psql vs MCP
- [dev-mcp-setup.md](dev-mcp-setup.md) — MCP server configuration
