---
title: MCP and CLI Overlapping Capabilities
impact: HIGH
impactDescription: Know when MCP and CLI can both do the job, and which to prefer
tags: mcp, cli, overlap
---

## MCP and CLI Overlapping Capabilities

Some operations are available in both MCP and CLI. When both can do the job, prefer MCP - it's faster (no local setup, direct API access).

**Incorrect:**

```bash
# Using CLI when MCP is connected
supabase link --project-ref abc123
supabase migration list  # Slow: requires link + login
```

**Correct:**

```typescript
// MCP connected - use directly
list_migrations({ project_id: "abc123" })  // Immediate, no setup
```

## Comparison Table

| Capability | MCP Tool | CLI Command | Notes |
|------------|----------|-------------|-------|
| List projects | `list_projects` | `projects list` | MCP: no login needed |
| Get project | `get_project` | None | MCP only |
| List migrations | `list_migrations` | `migration list` | MCP: no link needed |
| List tables | `list_tables` | None | MCP only |
| List extensions | `list_extensions` | None | MCP only |
| Execute SQL | `execute_sql` | None (psql) | MCP only |
| Apply migration | `apply_migration` | `db push` | Different: MCP creates, CLI pushes existing |
| Generate types | `generate_typescript_types` | `gen types` | CLI supports local |
| Deploy function | `deploy_edge_function` | `functions deploy` | MCP: no Docker needed |
| List functions | `list_edge_functions` | `functions list` | MCP: no link needed |
| Get function code | `get_edge_function` | None | MCP only |
| Get logs | `get_logs` | `supabase logs` | MCP: more services |
| Get advisors | `get_advisors` | None | MCP only |

## Why Prefer MCP

1. **No login required**: MCP uses existing OAuth connection
2. **No link required**: Pass `project_id` directly
3. **No Docker required**: For remote operations
4. **More capabilities**: Some operations MCP-only

## When CLI is Better

- **Local schema**: `gen types --local` uses local DB
- **CI/CD pipelines**: CLI integrates with scripts
- **File-based workflows**: Migration files, function files
- **Offline work**: CLI works without network

## Related

- [tool-selection.md](tool-selection.md) - Decision guide
