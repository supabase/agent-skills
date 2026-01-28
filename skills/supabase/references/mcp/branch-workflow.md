---
title: MCP Branch Operations
impact: HIGH
impactDescription: Enables isolated development environments for safe testing
tags: mcp, branches, development, isolation
---

## MCP Branch Operations

Create isolated development environments with database branching (paid plans only). Each branch has its own database, API endpoints, and credentials. Branches apply all production migrations but do NOT copy production data for security. Use seed files or `execute_sql` to populate test data on branches.

**Incorrect:**

```sql
-- Expect production data in branch
-- Via execute_sql on branch
SELECT * FROM users;
-- Returns empty - branches don't copy production data

-- Use main project ref for branch operations
-- Via apply_migration with wrong project_id
apply_migration(project_id: "main-project-ref", ...)
-- Applies to production, not branch!
```

Expecting production data in branches or using wrong project ref for branch operations.

**Correct:**

```sql
-- Use branch's project_ref for all operations
-- Via execute_sql on branch
INSERT INTO users (email) VALUES ('test@example.com');
SELECT * FROM users;
-- Returns test data

-- Apply migration to branch using branch's project_ref
-- Via apply_migration
apply_migration(
  project_id: "branch-project-ref",  -- Use branch ref, not main
  name: "add_feature",
  query: "CREATE TABLE features (...)"
)
```

Use branch's `project_ref` for all operations. Seed test data manually.

## Branch Lifecycle

1. `get_cost(type: "branch")` - Check cost
2. `confirm_cost(...)` - Confirm billing
3. `create_branch(...)` - Create branch
4. Work using branch's `project_ref`
5. `merge_branch(...)` - Deploy to production
6. `delete_branch(...)` - Cleanup

## Related

- [branch-merge-strategy.md](branch-merge-strategy.md) - Merge, reset, rebase
- [project-cost-workflow.md](project-cost-workflow.md) - Cost confirmation
