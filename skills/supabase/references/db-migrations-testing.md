---
title: Test Migrations with supabase db reset
impact: MEDIUM-HIGH
impactDescription: Catch migration errors before production deployment
tags: migrations, testing, supabase-cli, local-development
---

## Test Migrations with supabase db reset

Always test migrations locally before deploying to production. Use
`supabase db reset` to verify migrations run cleanly from scratch.

**Incorrect:**

```bash
# Deploying directly without testing
supabase db push  # Migration fails in production!
```

**Correct:**

```bash
# Test migrations locally first
supabase db reset  # Runs all migrations from scratch

# Verify success, then deploy
supabase db push
```

## Testing Workflow

```bash
# Start local Supabase
supabase start

# Reset database and run all migrations
supabase db reset

# Verify tables and data
supabase inspect db table-sizes
```

## What db reset Does

1. Drops the local database
2. Creates a fresh database
3. Runs all migrations in order
4. Runs `supabase/seed.sql` if present

## Seed Data for Testing

Create `supabase/seed.sql` for test data:

```sql
-- supabase/seed.sql
-- Runs after migrations on db reset

-- Use ON CONFLICT for idempotency
insert into categories (name)
values ('Action'), ('Comedy'), ('Drama')
on conflict (name) do nothing;

-- Test users (only in local development!)
insert into profiles (id, username)
values ('00000000-0000-0000-0000-000000000001', 'testuser')
on conflict (id) do nothing;
```

## Test Specific Migration

```bash
# Apply all pending migrations
supabase migration up

# Check migration status
supabase migration list
```

## Repair Failed Migration

If a migration partially fails:

```bash
# Fix the migration file
# Then repair the migration history
supabase migration repair --status applied 20240315120000
```

## Inspect Database State

```bash
# View tables
supabase inspect db table-sizes

# View indexes
supabase inspect db index-usage

# View cache hit rate
supabase inspect db cache-hit
```

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Test migrations
  run: |
    supabase start
    supabase db reset
    supabase test db  # Run pgTAP tests
```

## Related

- [migrations-idempotent.md](migrations-idempotent.md)
- [Docs](https://supabase.com/docs/guides/local-development/overview)
