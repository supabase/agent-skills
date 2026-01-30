---
title: MCP Feature Groups
impact: HIGH
impactDescription: Controls which MCP tools are available to agents
tags: mcp, features, tools, configuration
---

## MCP Feature Groups

Control which MCP tools are available via the `features` query parameter. By default, most feature groups are enabled except storage. Local MCP has limited tools - no account management, and Edge Functions are managed via filesystem instead of MCP tools.

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

All features enabled including account management. Storage tools disabled by default even though you may need them.

**Correct:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?features=database,docs,storage"
    }
  }
}
```

Only specified features enabled. Explicitly includes storage which is disabled by default.

## Available Groups

| Group | Default | Tools |
|-------|---------|-------|
| `account` | Enabled | list_projects, create_project, list_organizations |
| `database` | Enabled | execute_sql, apply_migration, list_tables |
| `development` | Enabled | get_project_url, get_publishable_keys, generate_types |
| `debugging` | Enabled | get_logs, get_advisors |
| `docs` | Enabled | search_docs |
| `functions` | Enabled | list_edge_functions, deploy_edge_function |
| `branching` | Enabled | create_branch, merge_branch, reset_branch |
| `storage` | **Disabled** | list_storage_buckets, get_storage_config |

## Common Configurations

Database-only: `?features=database,docs`

Read and debug: `?features=database,debugging,docs&read_only=true`

## Related

- [setup-configuration.md](setup-configuration.md) - Server setup
- [setup-security.md](setup-security.md) - Security settings
