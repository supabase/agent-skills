---
title: MCP vs CLI Tool Selection
impact: CRITICAL
impactDescription: Prefer MCP when available, CLI for local-only operations
tags: mcp, cli, decision
---

## MCP vs CLI Tool Selection

**Core principle: MCP first, CLI for local-only.** When MCP is connected, prefer MCP tools for remote operations. Use CLI for local stack management and file-based operations.

**Incorrect:**

```bash
# Using CLI when MCP is connected and faster
supabase projects list   # Requires login, slower
supabase functions list  # Requires link
```

**Correct:**

```typescript
// MCP connected - use directly
list_projects()                              // No setup needed
list_edge_functions({ project_id: "ref" })   // Direct access
execute_sql({ project_id: "ref", query: "SELECT 1" })

// CLI for local-only operations (no MCP equivalent)
supabase init       // Creates local files
supabase start      // Starts Docker containers
supabase db diff    // Generates migration files
```

## Decision Guide

```text
Remote operation? (query, deploy, execute SQL)
├── MCP connected? → Use MCP tool
└── Not connected? → Use CLI (requires login + link)

Local operation? (init, start, create files)
└── Use CLI (no MCP equivalent)
```

## Overlapping Capabilities

When both can do the job, prefer MCP:

| Operation | MCP (Preferred) | CLI (Fallback) |
|-----------|-----------------|----------------|
| List projects | `list_projects` | `projects list` |
| List migrations | `list_migrations` | `migration list` |
| List tables | `list_tables` | None |
| Deploy function | `deploy_edge_function` | `functions deploy` |
| Get logs | `get_logs` | `supabase logs` |
| Generate types | `generate_typescript_types` | `gen types` |
| Execute SQL | `execute_sql` | None (psql) |

## CLI-Only Operations

| Operation | CLI Command |
|-----------|-------------|
| Initialize project | `supabase init` |
| Start local stack | `supabase start` |
| Stop local stack | `supabase stop` |
| Link to remote | `supabase link` |
| Create migration file | `supabase migration new` |
| Generate diff | `supabase db diff` |
| Push migrations | `supabase db push` |
| Fetch migrations | `supabase migration fetch` |
| Serve functions locally | `supabase functions serve` |
| Set secrets | `supabase secrets set` |

## Related

- [tool-overlap.md](tool-overlap.md) - Detailed comparison
- [workflow-local-dev.md](workflow-local-dev.md) - Combined workflow
