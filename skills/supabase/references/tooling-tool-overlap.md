---
title: MCP and CLI Overlapping Capabilities
impact: HIGH
impactDescription: Know where MCP and CLI overlap; prefer CLI except for the 3 key MCP tools
tags: mcp, cli, overlap
---

## MCP and CLI Overlapping Capabilities

Some operations are available in both MCP and CLI. **Default to CLI** for all operations. Use MCP only where it provides clear value: `execute_sql` for rapid iteration, `get_logs` for debugging, and `get_advisors` for recommendations.

**Incorrect:**

```typescript
// Using MCP for operations better done with CLI
list_projects() // Use: supabase projects list
deploy_edge_function({ ... }) // Use: supabase functions deploy
generate_typescript_types({ ... }) // Use: supabase gen types
```

**Correct:**

```bash
# CLI for project management, deploy, and type generation
npx supabase projects list
npx supabase functions deploy api-handler
npx supabase gen types --lang typescript --local > types.ts
```

```typescript
// MCP for SQL iteration and debugging (no CLI equivalent)
execute_sql({ project_id: "ref", query: "SELECT * FROM posts" })
get_logs({ project_id: "ref", service: "postgres" })
get_advisors({ project_id: "ref" })
```

## MCP-Preferred Operations

These MCP tools provide value beyond what CLI offers:

| MCP Tool | Why MCP | CLI Alternative |
| --- | --- | --- |
| `execute_sql` | Rapid SQL iteration without migration files | None (psql) |
| `get_logs` | Query logs across services | None |
| `get_advisors` | Security and performance recommendations | None |

## CLI-Preferred Operations

For these overlapping operations, use CLI:

| Operation | CLI Command | MCP Tool (not recommended) |
| --- | --- | --- |
| Deploy function | `functions deploy` | `deploy_edge_function` |
| Generate types | `gen types` | `generate_typescript_types` |
| List projects | `projects list` | `list_projects` |
| List migrations | `migration list` | `list_migrations` |
| Apply migration | `db push` | `apply_migration` |

## Why CLI First

1. **File-based workflows**: CLI works with local migration files and function code
2. **CI/CD integration**: CLI integrates naturally with pipelines
3. **Offline work**: CLI works without network for local operations
4. **Consistent tooling**: One tool for all operations rather than mixing MCP and CLI

## Related

- [tool-selection.md](tool-selection.md) - Decision guide
