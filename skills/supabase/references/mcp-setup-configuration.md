---
title: Configure MCP Server Connection
impact: CRITICAL
impactDescription: Correct endpoint configuration required for MCP connection
tags: mcp, configuration, local, hosted, self-hosted
---

## Configure MCP Server Connection

Configure the MCP server endpoint based on your environment. Local development uses `http://127.0.0.1:54321/mcp` after running `supabase start`. Hosted Supabase uses `https://mcp.supabase.com/mcp` with optional project scoping. Self-hosted requires SSH tunnel access.

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

Using hosted URL when targeting local database - MCP operations will fail or target wrong environment.

**Correct:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "http://127.0.0.1:54321/mcp"
    }
  }
}
```

Use local URL for local development. Requires `supabase start` to be running.

## Configuration by Environment

**Local MCP** (with `supabase start`):
```json
{ "url": "http://127.0.0.1:54321/mcp" }
```

**Hosted MCP** (with project scoping):
```json
{ "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF" }
```

**CI Environment** (with PAT):
```json
{
  "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}",
  "headers": { "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}" }
}
```

**Self-Hosted** (via SSH tunnel):
```bash
ssh -L 8080:localhost:8080 user@supabase-host
```
```json
{ "url": "http://localhost:8080/mcp" }
```

## Related

- [setup-security.md](setup-security.md) - Security settings
- [setup-feature-groups.md](setup-feature-groups.md) - Tool groups
- [Docs](https://supabase.com/docs/guides/getting-started/mcp) - Official guide
