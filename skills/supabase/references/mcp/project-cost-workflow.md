---
title: MCP Cost Confirmation Workflow
impact: CRITICAL
impactDescription: Prevents accidental billing charges when creating resources
tags: mcp, cost, billing, projects, branches
---

## MCP Cost Confirmation Workflow

Creating projects and branches via MCP requires explicit cost confirmation to prevent accidental billing. Always call `get_cost` first, then `confirm_cost` to get a confirmation ID, then pass that ID to `create_project` or `create_branch`. Costs vary by organization plan - never assume costs are the same across organizations.

**Incorrect:**

```typescript
// Skip cost confirmation
await mcp.create_project({
  name: 'my-app',
  organization_id: 'org-id',
  region: 'us-east-1'
});
// Error: Missing confirm_cost_id
// Or worse: unexpected billing charges
```

Skipping cost confirmation - operation fails or causes unexpected charges.

**Correct:**

```typescript
// Complete cost confirmation workflow
const cost = await mcp.get_cost({
  type: 'project',
  organization_id: 'org-id'  // Always specify - costs vary by org
});

// Inform user: "This will cost $25/month"
const confirmation = await mcp.confirm_cost({
  type: 'project',
  amount: cost.amount,
  recurrence: 'monthly'
});

// Now create with confirmation
await mcp.create_project({
  name: 'my-app',
  organization_id: 'org-id',
  region: 'us-east-1',
  confirm_cost_id: confirmation.id
});
```

Complete workflow: get_cost → confirm_cost → create with confirmation ID.

## Cost by Plan

| Resource | Free | Pro |
|----------|------|-----|
| Project | $0/month | $25/month + compute |
| Branch | N/A | ~$0.01/hour |

## Related

- [project-management.md](project-management.md) - Project operations
- [branch-workflow.md](branch-workflow.md) - Branch operations
