---
title: Supabase Remote MCP Server Setup
impact: CRITICAL
impactDescription: Required configuration for remote database interaction, debugging, and advisors via MCP
tags: mcp, setup, configuration, oauth, security, remote
---

## Supabase Remote MCP Server Setup

The Supabase remote MCP server (`mcp.supabase.com`) provides authenticated access to hosted Supabase projects for database queries, logs, and advisors. It is only used for **remote project interaction** — local development uses CLI and `psql` instead.

**Incorrect:**

```text
# Enabling all features when using CLI alongside MCP
https://mcp.supabase.com/mcp
# Agents see overlapping tools for deploy, types, etc.
```

**Correct:**

```text
# Scope to database and debugging only — CLI handles everything else
https://mcp.supabase.com/mcp?features=database,debugging
```

Only database and debugging tools available. Avoids overlap with CLI for deploy, type generation, and project management. Use the full URL (`https://mcp.supabase.com/mcp`) only when MCP is the primary way to interact with Supabase.

## Self-Configuration for Agents

If no Supabase MCP tools are detected when a remote project interaction is needed:

1. Check if the Supabase MCP server is already configured for the current project
2. If not, fetch the client configuration from the [Supabase MCP client configuration docs](https://supabase.com/docs/guides/getting-started/mcp#step-2-configure-your-ai-tool) for the AI tool you are running in
3. Write the appropriate configuration file
4. Ask the user to authenticate — the browser OAuth flow will open automatically when the MCP server first connects

## What MCP Provides

Capabilities for remote project interaction:

| Tool | Purpose |
| --- | --- |
| `execute_sql` | Run non-schema-changing SQL against the remote database |
| `get_logs` | Retrieve service logs (postgres, api, edge_functions, auth, storage, realtime) |
| `get_advisors` | Security and performance recommendations |
| `list_tables` | Inspect schema |
| `list_extensions` | Check installed extensions |
| `list_migrations` | View applied migrations |
| `apply_migration` | Apply migration (last resort only — see [dev-mcp-tools.md](dev-mcp-tools.md)) |

## URL Parameters

| Parameter | Example | Purpose |
| --- | --- | --- |
| `features` | `features=database,debugging` | Restrict available tool groups |
| `project_ref` | `project_ref=abc123` | Scope to single project |
| `read_only` | `read_only=true` | Prevent all write operations |

Parameters can be combined: `https://mcp.supabase.com/mcp?features=database,debugging&project_ref=abc123`

## Authentication

| Method | When to Use |
| --- | --- |
| Dynamic Client Registration | Default. Browser OAuth on first connect. |
| Personal Access Token (PAT) | CI/CD, GitHub Actions. Pass via `Authorization: Bearer <token>` header. |

For PAT authentication, ask the user to create a Personal Access Token in the Supabase Dashboard under Account > Access Tokens.

## Security Rules

1. **Never point at production.** Use development or staging projects only.
2. **Always scope with `project_ref`.** Without it, agents can access all projects in your account.
3. **Use `read_only=true` when only querying.** Prevents `execute_sql` from running writes.
4. **Keep manual tool approval enabled.** Review every MCP tool call before execution.

## Prompt Injection Warning

Database records may contain malicious content that tricks LLMs into executing unintended tool calls. Supabase MCP wraps SQL results with instructions discouraging LLMs from following embedded commands, but this is not foolproof. Always review tool calls before approval.
