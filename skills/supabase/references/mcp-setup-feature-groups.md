---
title: MCP Feature Groups
impact: HIGH
impactDescription: Controls which MCP tools are available to agents
tags: mcp, features, tools, configuration
---

## MCP Feature Groups

Restrict MCP to **database and debugging** feature groups only. Use CLI for everything else (deploy, type generation, account management, etc.).

**Incorrect:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

All features enabled. Agents can deploy functions, manage projects, and access tools that should use CLI.

**Correct:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?features=database,debugging"
    }
  }
}
```

Only database and debugging tools available.

## Available Tools

### database

| Tool | Purpose |
| --- | --- |
| `execute_sql` | Run SQL queries against the database |
| `list_tables` | List tables in a schema |
| `list_extensions` | List installed Postgres extensions |
| `list_migrations` | List applied migrations |
| `apply_migration` | Create and apply a new migration |

### debugging

| Tool | Purpose |
| --- | --- |
| `get_logs` | Retrieve logs from API, Postgres, Edge Functions, Auth, Storage, Realtime |
| `get_advisors` | Get security and performance recommendations |

## Why Only These Two Groups

- `execute_sql` enables rapid schema iteration without creating migration files
- `get_logs` and `get_advisors` provide debugging and optimization that CLI cannot do
- Everything else (deploy, type gen, project management, branching, storage) is handled by CLI, which provides better control and CI/CD integration

## Related

- [setup-configuration.md](setup-configuration.md) - Server setup
- [setup-security.md](setup-security.md) - Security settings
