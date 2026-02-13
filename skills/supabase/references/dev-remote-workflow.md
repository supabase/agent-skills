---
title: Remote Development Workflow
impact: CRITICAL
impactDescription: Development workflow for hosted Supabase projects
tags: remote, hosted, workflow, deploy, link
---

## Remote Development Workflow

For working directly against a hosted Supabase project — when Docker isn't available locally, or for hosted-only projects.

**Incorrect:**

```bash
# Making changes on remote without syncing locally
execute_sql({ project_id: "ref", query: "CREATE TABLE posts (...)" })
# Local is now out of sync — migrations, types, and db reset will be wrong
```

**Correct:**

```bash
# After remote changes, always sync
execute_sql({ project_id: "ref", query: "CREATE TABLE posts (...)" })
npx supabase migration fetch --yes    # Sync migrations locally
npx supabase gen types --linked > types.ts
```

## Prerequisites

1. CLI linked to project:

```bash
npx supabase login
npx supabase link --project-ref <project-id>
```

2. MCP configured (see [dev-mcp-setup.md](dev-mcp-setup.md))

**Find project ref:** Check `supabase/.temp/project-ref` or run `npx supabase projects list`.

## Complete Cycle

| Step | Tool | Command | Purpose |
| --- | --- | --- | --- |
| 1 | MCP | `execute_sql` | Iterate schema on remote |
| 2 | MCP | `get_advisors` | Check security and performance |
| 3 | CLI | `npx supabase migration fetch --yes` | Sync migrations locally |
| 4 | CLI | `npx supabase gen types --linked` | Generate TypeScript types |
| 5 | CLI | `npx supabase db push` | Deploy future migrations |

## Iterate with execute_sql

```javascript
execute_sql({ project_id: "ref", query: "CREATE TABLE posts (...)" })
execute_sql({ project_id: "ref", query: "ALTER TABLE posts ADD COLUMN content text" })
```

Or write migration files locally and deploy:

```bash
npx supabase migration new create_posts
# Edit the migration file
npx supabase db push --dry-run    # Preview
npx supabase db push              # Deploy
```

## Check Advisors

```javascript
get_advisors({ project_id: "ref" })
```

Run after schema changes — catches missing RLS policies, unused indexes, security issues.

## Sync Locally

After any remote changes (especially after `execute_sql` or `apply_migration`):

```bash
npx supabase migration fetch --yes
```

## Generate Types

```bash
npx supabase gen types --lang typescript --linked > types.ts
```

## Debug

```javascript
get_logs({ project_id: "ref", service: "postgres" })          // Query errors
get_logs({ project_id: "ref", service: "api" })               // PostgREST / RLS
get_logs({ project_id: "ref", service: "edge_functions" })    // Function errors
get_logs({ project_id: "ref", service: "auth" })              // Auth issues
```

## Deploy Migrations

**Preferred:** `npx supabase db push`

**Last resort only:** MCP `apply_migration` — only when `db push` fails due to migration mismatch and `migration repair` cannot fix it. Always ask the user for consent first. Always sync after with `npx supabase migration fetch --yes`.

## Related

- [dev-cli-reference.md](dev-cli-reference.md) — CLI command details
- [dev-mcp-tools.md](dev-mcp-tools.md) — MCP tool reference
- [dev-cli-vs-mcp.md](dev-cli-vs-mcp.md) — When to use which tool
