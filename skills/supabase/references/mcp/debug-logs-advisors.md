---
title: MCP Debugging Tools
impact: HIGH
impactDescription: Identify security issues and performance problems before deployment
tags: mcp, logs, advisors, debugging, security, performance
---

## MCP Debugging Tools

Use `get_logs` to retrieve service logs from the last 24 hours and `get_advisors` to check security and performance issues. Always run security advisor after schema changes to catch missing RLS policies. Run performance advisor when queries are slow to identify missing indexes.

**Incorrect:**

```sql
-- Create table without running advisors
-- Via apply_migration
CREATE TABLE posts (
  id uuid PRIMARY KEY,
  user_id uuid,
  title text
);
-- Deploy to production
-- Advisor would have caught: RLS not enabled, no index on user_id
```

Not running advisors after schema changes - security issues reach production.

**Correct:**

```sql
-- Create table
-- Via apply_migration
CREATE TABLE posts (
  id uuid PRIMARY KEY,
  user_id uuid,
  title text
);

-- Run advisors before deploy
get_advisors(project_id: "ref", type: "security")
-- Returns: "Table 'posts' has RLS disabled"

-- Fix and re-check
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
get_advisors(project_id: "ref", type: "security")
-- Returns: No issues
```

Always run advisors after schema changes, fix issues before deployment.

## Log Services

| Service | Use For |
|---------|---------|
| `api` | PostgREST errors, RLS issues |
| `postgres` | Query errors, connections |
| `auth` | Auth failures, OAuth |
| `edge-function` | Function errors |
| `storage` | Upload/download issues |
| `realtime` | WebSocket issues |

## Advisor Types

- `security` - Missing RLS, exposed columns, policy issues
- `performance` - Missing indexes, slow queries

## Related

- [workflow-hosted.md](workflow-hosted.md) - Include advisors in workflow
- [branch-merge-strategy.md](branch-merge-strategy.md) - Check before merge
