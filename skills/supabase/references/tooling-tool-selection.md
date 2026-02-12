---
title: CLI vs MCP Tool Selection
impact: CRITICAL
impactDescription: CLI-first for all operations; MCP for database iteration and debugging only
tags: mcp, cli, decision
---

## CLI vs MCP Tool Selection

**Core principle: CLI first.** Default to CLI for all operations. Use MCP only for `execute_sql` (rapid SQL iteration), `get_logs` (debugging), and `get_advisors` (security/performance checks).

**Incorrect:**

```typescript
// Using MCP for operations that should use CLI
deploy_edge_function({ project_id: "ref", name: "api-handler", files: [...] })
generate_typescript_types({ project_id: "ref" })
list_projects()
```

**Correct:**

```bash
# CLI for deploy, types, and project management
npx supabase functions deploy api-handler
npx supabase gen types --lang typescript --local > types.ts
npx supabase projects list
```

```typescript
// MCP for rapid SQL iteration and debugging
execute_sql({ project_id: "ref", query: "SELECT 1" })
get_logs({ project_id: "ref", service: "api" })
get_advisors({ project_id: "ref" })
```

## Decision Guide

```text
SQL iteration or schema exploration?
└── Use MCP execute_sql

Debugging logs or performance advice?
└── Use MCP get_logs / get_advisors

Everything else?
└── Use CLI
```

## MCP Tools (database + debugging only)

| Tool | Purpose |
| --- | --- |
| `execute_sql` | Rapid SQL iteration without migration files |
| `list_tables` | Inspect schema |
| `list_extensions` | Check installed extensions |
| `list_migrations` | View applied migrations |
| `apply_migration` | Apply migration to remote |
| `get_logs` | Retrieve service logs |
| `get_advisors` | Security and performance recommendations |

## CLI for Everything Else

| Operation | CLI Command |
| --- | --- |
| Initialize project | `supabase init` |
| Start local stack | `supabase start` |
| Stop local stack | `supabase stop` |
| Link to remote | `supabase link` |
| Create migration file | `supabase migration new` |
| Generate diff | `supabase db diff` |
| Push migrations | `supabase db push` |
| Reset local database | `supabase db reset` |
| Fetch migrations | `supabase migration fetch` |
| Deploy functions | `supabase functions deploy` |
| Serve functions locally | `supabase functions serve` |
| Set secrets | `supabase secrets set` |
| Generate types | `supabase gen types` |

## Related

- [tool-overlap.md](tool-overlap.md) - Where MCP and CLI overlap
- [workflow-local-dev.md](workflow-local-dev.md) - Combined workflow
