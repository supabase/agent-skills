---
title: MCP Security Best Practices
impact: CRITICAL
impactDescription: Prevents unauthorized data access and prompt injection attacks
tags: mcp, security, read-only, project-scoping, prompt-injection
---

## MCP Security Best Practices

MCP operates with developer permissions. Restrict to `features=database,debugging` and follow these rules.

**Incorrect:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?features=database,debugging"
    }
  }
}
```

No project scoping. Agents can access ALL projects in your account.

**Correct:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?features=database,debugging&project_ref=DEV_PROJECT_REF&read_only=true"
    }
  }
}
```

Scoped to development project with read-only access.

## Security Rules

1. **Never use with production data.** Point MCP at development or staging projects only.
2. **Always scope with `project_ref`.** Without it, agents can access all projects in your account.
3. **Use `read_only=true` when only querying.** Prevents `execute_sql` from running writes.
4. **Keep manual tool approval enabled.** Review every MCP tool call before execution in your client.
5. **Restrict features.** Use `features=database,debugging` to limit available tools.

## Prompt Injection Warning

Database records may contain malicious content that tricks LLMs into executing unintended tool calls. Supabase MCP wraps SQL results with instructions discouraging LLMs from following embedded commands, but this is not foolproof. Always review tool calls before approval.

## Security URL Parameters

| Option | Purpose |
| --- | --- |
| `project_ref=ID` | Limit access to single project |
| `read_only=true` | Prevent all write operations |
| `features=database,debugging` | Restrict to database and debugging tools only |

## Related

- [setup-configuration.md](setup-configuration.md) - Connection setup
- [setup-feature-groups.md](setup-feature-groups.md) - Restrict tools
- [Docs](https://supabase.com/docs/guides/getting-started/mcp) - Security guidance
