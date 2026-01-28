---
title: MCP Branch Merge Strategies
impact: HIGH
impactDescription: Correct merge strategy prevents migration conflicts in production
tags: mcp, branches, merge, reset, rebase
---

## MCP Branch Merge Strategies

Manage branch lifecycle with `merge_branch`, `reset_branch`, and `rebase_branch`. Merging deploys migrations and Edge Functions to production but NOT data or configuration. Always rebase before merging when production has newer migrations. Test migrations locally with `supabase db reset` before merging to production.

**Incorrect:**

```bash
# Branch has migrations, production has newer migrations
# Merge without rebasing
merge_branch(branch_id: "branch-id")
# Error: Migration conflicts with production
# Or: Migrations applied in wrong order
```

Merging without rebasing when production has new migrations causes conflicts.

**Correct:**

```bash
# Check if production has newer migrations
list_branches(project_id: "main-ref")  # Check branch status

# Rebase to get production changes
rebase_branch(branch_id: "branch-id")

# Test locally
supabase db reset  # Apply all migrations locally

# Run advisors
get_advisors(project_id: "branch-ref", type: "security")

# Now safe to merge
merge_branch(branch_id: "branch-id")

# Cleanup
delete_branch(branch_id: "branch-id")
```

Rebase before merge, test locally, run advisors, then merge.

## What Merges

| Included | Not Included |
|----------|--------------|
| Migrations | Seed data |
| Edge Functions | Configuration |
| - | Secrets |

## Branch Operations

| Operation | Purpose |
|-----------|---------|
| `merge_branch` | Deploy to production |
| `reset_branch` | Discard changes, match production |
| `rebase_branch` | Apply production changes to branch |

## Related

- [branch-workflow.md](branch-workflow.md) - Create and manage branches
- [workflow-hosted.md](workflow-hosted.md) - Hosted development workflow
