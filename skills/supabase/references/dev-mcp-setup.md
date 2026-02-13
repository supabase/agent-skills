---
title: MCP Server Setup
impact: CRITICAL
impactDescription: Required configuration for database interaction and debugging via MCP
tags: mcp, setup, configuration, oauth, security, local
---

## MCP Server Setup

Supabase exposes two MCP servers: the **remote MCP server** (`mcp.supabase.com`) for hosted projects and the **local MCP server** (`localhost:54321/mcp`) for the local development stack. **Only configure one at a time** — both servers expose tools with identical names and descriptions, which confuses agents when enabled simultaneously. Switch between them based on your current workflow.

**All features (MCP as primary interface):**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

All features enabled. Suitable when MCP is the primary way to interact with Supabase. Consider scoping with `project_ref` to avoid accidental cross-project access.

**Scoped features (recommended when using CLI alongside MCP):**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?features=database,debugging"
    }
  }
}
```

Only database and debugging tools available. Avoids overlap with CLI for deploy, type generation, and project management.

## Remote vs Local MCP Server

| | Remote MCP Server | Local MCP Server |
| --- | --- | --- |
| **URL** | `https://mcp.supabase.com/mcp` | `http://localhost:54321/mcp` |
| **Targets** | Hosted Supabase project | Local Supabase stack (`supabase start`) |
| **Auth** | OAuth or Personal Access Token | None (local only) |
| **Use when** | Working against a hosted project | Iterating locally with `supabase start` |
| **Requires** | Internet, linked project | Docker running, `supabase start` completed |

## What MCP Provides

Capabilities that CLI cannot do:

| Tool | Purpose |
| --- | --- |
| `execute_sql` | Run SQL against local or remote database |
| `get_logs` | Retrieve service logs (postgres, api, edge_functions, auth, storage, realtime) |
| `get_advisors` | Security and performance recommendations |
| `list_tables` | Inspect schema |
| `list_extensions` | Check installed extensions |
| `list_migrations` | View applied migrations |
| `apply_migration` | Apply migration (last resort — see [dev-mcp-tools.md](dev-mcp-tools.md)) |

## Recommended URLs

**Remote** (hosted projects):

```
https://mcp.supabase.com/mcp?features=database,debugging
```

**Local** (local development stack):

```
http://localhost:54321/mcp
```

Only `database` and `debugging` feature groups are needed for the remote server. CLI handles deploy, type generation, project management, and everything else. The local MCP server exposes all tools by default — no feature scoping is needed.

## Configuration by Client

### Remote MCP Server

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

**Claude Desktop**: Add via Settings > MCP Servers with the remote URL above.

**VS Code** (`.vscode/mcp.json`):

```json
{
  "servers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?features=database,debugging"
    }
  }
}
```

### Local MCP Server

Requires a running local stack (`npx supabase start`). No authentication needed. Use the same `supabase` key name — only one server should be active at a time.

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "supabase": {
      "url": "http://localhost:54321/mcp"
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
      "url": "http://localhost:54321/mcp"
    }
  }
}
```

**VS Code** (`.vscode/mcp.json`):

```json
{
  "servers": {
    "supabase": {
      "type": "http",
      "url": "http://localhost:54321/mcp"
    }
  }
}
```

### Do NOT Enable Both Servers Simultaneously

Both servers expose tools with identical names (`execute_sql`, `get_logs`, `get_advisors`, etc.). When both are configured, the agent sees duplicate tools and cannot reliably determine which server to call. Configure only the server that matches the current workflow:

- **Local development** → configure the local MCP server only
- **Remote / hosted project** → configure the remote MCP server only

When switching workflows, swap the MCP configuration accordingly.

## URL Parameters (Remote Server Only)

| Parameter | Example | Purpose |
| --- | --- | --- |
| `features` | `features=database,debugging` | Restrict available tool groups |
| `project_ref` | `project_ref=abc123` | Scope to single project |
| `read_only` | `read_only=true` | Prevent all write operations |

The local MCP server does not use URL parameters — it always targets the local stack.

## Authentication

**Remote server:**

| Method | When to Use |
| --- | --- |
| Dynamic Client Registration | Default. Browser OAuth on first connect. |
| Personal Access Token (PAT) | CI/CD, GitHub Actions. Pass via `Authorization: Bearer <token>` header. |

**Local server:** No authentication required. The server is only accessible on `localhost`.

**CI example (remote):**

```json
{
  "url": "https://mcp.supabase.com/mcp?features=database,debugging&project_ref=${SUPABASE_PROJECT_REF}",
  "headers": { "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}" }
}
```

Stop and ask the user to create a Personal Access Token in the Supabase Dashboard under Account > Access Tokens.

## Security Rules

**Remote server:**

1. **Never point at production.** Use development or staging projects only.
2. **Always scope with `project_ref`.** Without it, agents can access all projects in your account.
3. **Use `read_only=true` when only querying.** Prevents `execute_sql` from running writes.
4. **Keep manual tool approval enabled.** Review every MCP tool call before execution.
5. **Consider restricting features.** `features=database,debugging` limits available tools when using CLI alongside MCP.

**Local server:**

1. The local MCP server is only accessible on `localhost` — no external exposure risk.
2. No authentication or project scoping needed — it always targets the local stack.
3. Local data is ephemeral (reset with `npx supabase db reset`), so the blast radius is minimal.

## Prompt Injection Warning

Database records may contain malicious content that tricks LLMs into executing unintended tool calls. Supabase MCP wraps SQL results with instructions discouraging LLMs from following embedded commands, but this is not foolproof. Always review tool calls before approval.
