---
title: Use CHECK Constraints for Data Validation
impact: MEDIUM
impactDescription: Prevent invalid data at the database level, reduce application bugs
tags: check, constraints, validation, schema, data-integrity
---

## Use CHECK Constraints for Data Validation

Application-level validation can be bypassed. CHECK constraints enforce data integrity at the database level, catching bugs early and keeping data clean. Check constraints are optional and should complement, not replace, application validation.

**Incorrect (no database-level validation):**

```sql
create table products (
  id bigint primary key,
  name text,
  price numeric,
  quantity int,
  status text,
  discount_percent numeric
);

-- Invalid data can slip through
insert into products values (1, '', -10, -5, 'bogus', 150);
-- Empty name, negative price, negative quantity, invalid status, 150% discount
```

**Correct (CHECK constraints enforce rules):**

```sql
create table products (
  id bigint primary key,
  name text not null check (length(name) > 0),
  price numeric not null check (price >= 0),
  quantity int not null check (quantity >= 0),
  status text not null check (status in ('draft', 'active', 'archived')),
  discount_percent numeric check (discount_percent between 0 and 100)
);

-- Database rejects invalid data immediately
insert into products values (1, '', -10, -5, 'bogus', 150);
-- ERROR: new row violates check constraint
```

Named constraints for clearer error messages:

```sql
alter table orders
  add constraint orders_total_positive check (total >= 0),
  add constraint orders_valid_status check (status in ('pending', 'paid', 'shipped'));
```

Reference: [CHECK Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS)
