---
title: Configure MCP Server Connection
impact: CRITICAL
impactDescription: Correct endpoint configuration required for MCP connection
tags: mcp, configuration, local, hosted, database, debugging
---

## Configure MCP Server Connection

MCP is configured for **database and debugging features only** (`features=database,debugging`). This provides `execute_sql`, `list_tables`, `list_extensions`, `list_migrations`, `apply_migration`, `get_logs`, and `get_advisors`. All other operations use CLI.

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

All features enabled, no project scoping. Exposes account management, deploy, and other tools that should use CLI instead.

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

Only database and debugging tools available. Authenticate via Dynamic Client Registration (browser OAuth on first connect).

## Configuration by Client

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?features=database,debugging"
    }
  }
}
```

**Claude Code** (`.mcp.json`):

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?features=database,debugging"
    }
  }
}
```

**Claude Desktop**: Add via Settings > MCP Servers with URL `https://mcp.supabase.com/mcp?features=database,debugging`.

## Configuration by Environment

**Local MCP** (with `supabase start`):

```json
{ "url": "http://127.0.0.1:54321/mcp" }
```

Local MCP has all database tools available without feature filtering.

**Hosted MCP** (with project scoping):

```json
{ "url": "https://mcp.supabase.com/mcp?features=database,debugging&project_ref=YOUR_PROJECT_REF" }
```

**CI Environment** (with PAT):

```json
{
  "url": "https://mcp.supabase.com/mcp?features=database,debugging&project_ref=${SUPABASE_PROJECT_REF}",
  "headers": { "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}" }
}
```

Stop and ask the user to create a Personal Access Token in the Supabase Dashboard under Account > Access Tokens.

## URL Parameters

| Parameter | Example | Purpose |
| --- | --- | --- |
| `features` | `features=database,debugging` | Restrict available tool groups |
| `project_ref` | `project_ref=abc123` | Scope to single project |
| `read_only` | `read_only=true` | Prevent all write operations |

## Authentication

| Method | When to Use |
| --- | --- |
| Dynamic Client Registration | Default. Browser OAuth on first connect. |
| Personal Access Token (PAT) | CI/CD, GitHub Actions. Pass via `Authorization: Bearer <token>` header. |

## Related

- [setup-security.md](setup-security.md) - Security settings
- [setup-feature-groups.md](setup-feature-groups.md) - Tool groups
- [Docs](https://supabase.com/docs/guides/getting-started/mcp) - Official guide
