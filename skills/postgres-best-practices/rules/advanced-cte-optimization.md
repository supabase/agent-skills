---
title: Control CTE Materialization for Performance
impact: LOW-MEDIUM
impactDescription: 2-5x improvement by avoiding unnecessary materialization
tags: cte, materialization, with, optimization
---

## Control CTE Materialization for Performance

CTEs (WITH clauses) are materialized by default, which can prevent optimization
when the CTE is only used once.

**Incorrect (CTE forces materialization unnecessarily):**

```sql
-- CTE materializes the entire result set before filtering
with active_users as (
  select * from users where active = true
)
select * from active_users where id = 123;

-- Scans ALL active users, then filters for id=123
-- Index on users(id) is NOT used!
```

**Correct (use NOT MATERIALIZED to allow inlining):**

```sql
-- Prevent materialization to allow query optimizer to inline the CTE
with active_users as not materialized (
  select * from users where active = true
)
select * from active_users where id = 123;
-- Now uses index on users(id)

-- Or just use a subquery for single-use cases
select * from (
  select * from users where active = true
) as active_users
where id = 123;
```

When to use MATERIALIZED:

```sql
-- Force materialization when CTE is used multiple times
with expensive_calc as materialized (
  select user_id, sum(amount) as total from orders group by user_id
)
select * from expensive_calc where total > 1000
union all
select * from expensive_calc where total < 100;
-- Calculation runs once, not twice
```

Reference:
[WITH Queries](https://www.postgresql.org/docs/current/queries-with.html)
