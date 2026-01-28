---
title: MCP Project Management
impact: HIGH
impactDescription: Project lifecycle operations and health verification
tags: mcp, projects, create, pause, restore, organizations
---

## MCP Project Management

Manage Supabase projects via MCP tools including `list_projects`, `get_project`, `create_project`, `pause_project`, and `restore_project`. Always check project health status before operations. Creating projects requires cost confirmation workflow. Pro projects cannot be paused - only Free tier projects support pausing.

**Incorrect:**

```typescript
// Immediately run queries after project creation
const project = await mcp.create_project({ name: 'app', ... });
// Project still initializing
await mcp.execute_sql({ project_id: project.ref, query: 'SELECT 1' });
// Error: Project not ready
```

Not checking project health before operations - project may still be initializing.

**Correct:**

```typescript
// Create project with cost confirmation
const cost = await mcp.get_cost({ type: 'project', organization_id: 'org-id' });
const confirm = await mcp.confirm_cost({ type: 'project', amount: cost.amount, recurrence: 'monthly' });
const project = await mcp.create_project({ ..., confirm_cost_id: confirm.id });

// Poll for healthy status
let status;
do {
  status = await mcp.get_project({ id: project.ref });
  await sleep(5000);
} while (status !== 'ACTIVE_HEALTHY');

// Now safe to use
await mcp.execute_sql({ project_id: project.ref, query: 'SELECT 1' });
```

Check project health status before running operations.

## Project Lifecycle

| Operation | Tool | Notes |
|-----------|------|-------|
| List all | `list_projects()` | All projects across orgs |
| Get details | `get_project(id)` | Check status, config |
| Create | `create_project(...)` | Requires cost confirmation |
| Pause | `pause_project(id)` | Free tier only |
| Restore | `restore_project(id)` | 90-day window |

## Related

- [project-cost-workflow.md](project-cost-workflow.md) - Cost confirmation
- [branch-workflow.md](branch-workflow.md) - Development branches
