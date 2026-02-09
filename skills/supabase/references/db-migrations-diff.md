---
title: Use npx supabase db diff for Dashboard Changes
impact: HIGH
impactDescription: Captures manual changes into version-controlled migrations
tags: migrations, supabase-cli, db-diff, dashboard
---

## Use npx supabase db diff for Dashboard Changes

When making schema changes via Dashboard, use `npx supabase db diff` to generate
migration files for version control.

**Incorrect:**

```sql
-- Making changes in Dashboard without capturing them
-- Changes exist in remote but not in version control
-- Team members can't reproduce the database state
```

**Correct:**

```bash
# After making Dashboard changes, generate migration
npx supabase db diff -f add_profiles_table

# Review and test
npx supabase db reset

# Commit to version control
git add supabase/migrations/
git commit -m "Add profiles table migration"
```

## Workflow

1. Make changes in Supabase Dashboard (create tables, add columns, etc.)
2. Generate migration from diff:

```bash
npx supabase db diff -f add_profiles_table
```

3. Review generated migration in `supabase/migrations/`
4. Test locally:

```bash
npx supabase db reset
```

5. Commit migration to version control

## Diff Against Local Database

```bash
# Start local Supabase
npx supabase start

# Make changes via Dashboard or SQL
# Generate diff
npx supabase db diff -f my_changes
```

## Diff Against Remote Database

```bash
# Link to remote project
npx supabase link --project-ref your-project-ref

# Pull remote schema and generate diff
npx supabase db diff --linked -f sync_remote_changes
```

## What diff Captures

- Tables and columns
- Indexes
- Constraints
- Functions and triggers
- RLS policies
- Extensions

## What diff Does NOT Capture

- DML (INSERT, UPDATE, DELETE)
- View ownership changes
- Materialized views
- Partitions
- Comments

For these, write manual migrations.

## Related

- [migrations-idempotent.md](migrations-idempotent.md)
- [migrations-testing.md](migrations-testing.md)
- [Docs](https://supabase.com/docs/guides/deployment/database-migrations)
