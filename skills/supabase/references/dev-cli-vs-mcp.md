---
title: CLI vs MCP Decision Guide
impact: CRITICAL
impactDescription: Prevents agents from using wrong tool for each operation
tags: cli, mcp, decision, tool-selection
---

## CLI vs MCP Decision Guide

**Recommended approach: CLI is the default for project management, migrations, deployment, and code generation.** MCP is preferred for running SQL (`execute_sql`), debugging (`get_logs`), and advisory (`get_advisors`). Users who prefer MCP as their primary interface can use it for all operations.

**Recommended (CLI + MCP):**

```bash
# CLI for deploy and type generation
npx supabase functions deploy api-handler
npx supabase gen types --lang typescript --local > types.ts

# MCP for SQL iteration and debugging (no CLI equivalent)
execute_sql({ project_id: "ref", query: "SELECT 1" })
get_logs({ project_id: "ref", service: "api" })
get_advisors({ project_id: "ref" })
```

## MCP-Only Capabilities (No CLI Equivalent)

Available via the remote MCP server (`mcp.supabase.com`) for hosted projects and the local MCP server (`localhost:54321/mcp`) for the local stack.

| MCP Tool | Use For |
| --- | --- |
| `execute_sql` | Run SQL against local or remote database. CLI cannot execute SQL. |
| `get_logs` | Retrieve service logs (postgres, api, edge_functions, auth, storage, realtime) |
| `get_advisors` | Security and performance recommendations |

## CLI-Recommended Operations

| Operation | CLI Command |
| --- | --- |
| Initialize project | `npx supabase init` |
| Start local stack | `npx supabase start` |
| Stop local stack | `npx supabase stop` |
| Link to remote | `npx supabase link` |
| Create migration file | `npx supabase migration new` |
| Generate diff | `npx supabase db diff` |
| Push migrations | `npx supabase db push` |
| Pull schema | `npx supabase db pull` |
| Reset database | `npx supabase db reset` |
| Fetch migrations | `npx supabase migration fetch` |
| List migration status | `npx supabase migration list` |
| Deploy functions | `npx supabase functions deploy` |
| Serve functions locally | `npx supabase functions serve` |
| Set secrets | `npx supabase secrets set` |
| Generate types | `npx supabase gen types` |

## Migration Deployment Decision Tree

```text
Deploy migrations to remote?
└── npx supabase db push (always preferred)

db push fails due to migration mismatch?
├── Try: npx supabase migration repair --status applied <version>
└── Still broken?
    └── Stop and ask user for consent
        └── MCP apply_migration
            └── npx supabase migration fetch --yes (sync locally)
```

## The apply_migration Rule

`apply_migration` is a **last resort** for fixing mismatches between local and remote migration history that CLI cannot resolve. Rules:

1. **Always try CLI first** (`db push`, then `migration repair`)
2. **Always ask the user** before using `apply_migration` on remote
3. **Always sync after** with `npx supabase migration fetch --yes`

## Why We Recommend CLI for These Operations

1. **File-based workflows** — CLI works with local migration files and function code
2. **CI/CD integration** — CLI integrates naturally with pipelines
3. **Offline work** — CLI works without network for local operations
4. **Consistent tooling** — one tool for all operations rather than mixing MCP and CLI
