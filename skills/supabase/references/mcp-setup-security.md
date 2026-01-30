---
title: MCP Security Best Practices
impact: CRITICAL
impactDescription: Prevents unauthorized data access and prompt injection attacks
tags: mcp, security, read-only, project-scoping, prompt-injection
---

## MCP Security Best Practices

MCP operates with developer permissions, making security critical. Never use MCP with production data. Always scope to specific projects when possible and enable read-only mode when only querying. Keep manual tool approval enabled in your MCP client to review operations before execution.

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

Without project scoping, agents can access ALL projects in your account. Without read-only mode, agents can modify data.

**Correct:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=DEV_PROJECT_REF&read_only=true"
    }
  }
}
```

Scoped to development project with read-only access. Production data is protected.

## Security Options

| Option | Purpose |
|--------|---------|
| `project_ref=ID` | Limit access to single project |
| `read_only=true` | Prevent all write operations |
| `features=database,docs` | Restrict available tools |

## Prompt Injection Warning

Database records may contain malicious content that tricks LLMs. Supabase MCP wraps SQL results with instructions discouraging LLMs from following embedded commands, but this is not foolproof. Always review tool calls before approval.

## Related

- [setup-configuration.md](setup-configuration.md) - Connection setup
- [setup-feature-groups.md](setup-feature-groups.md) - Restrict tools
- [Docs](https://supabase.com/docs/guides/getting-started/mcp) - Security guidance
