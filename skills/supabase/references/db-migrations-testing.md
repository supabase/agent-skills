---
title: Test Migrations with supabase db reset
impact: MEDIUM-HIGH
impactDescription: Catch migration errors before production deployment
tags: migrations, testing, supabase-cli, local-development
---

## Test Migrations with supabase db reset

Always test migrations locally before deploying to production. Use
`npx supabase db reset` to verify migrations run cleanly from scratch.

**Incorrect:**

```bash
# Deploying directly without testing
npx supabase db push  # Migration fails in production!
```

**Correct:**

```bash
# Test migrations locally first
npx supabase db reset  # Runs all migrations from scratch

# Verify success, then deploy
npx supabase db push
```

## Testing Workflow

```bash
# Start local Supabase
npx supabase start

# Reset database and run all migrations
npx supabase db reset

# Verify tables and data
npx supabase inspect db table-sizes
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
npx supabase migration up

# Check migration status (requires supabase link for remote)
npx supabase migration list
```

## Repair Failed Migration

If local and remote migration histories diverge, use `migration repair` to
manually update the remote history table without re-executing migrations:

```bash
# Mark a migration as applied (inserts record without running it)
npx supabase migration repair --status applied 20240315120000

# Mark a migration as reverted (removes record from history)
npx supabase migration repair --status reverted 20240315120000
```

## Inspect Database State

```bash
# View tables
npx supabase inspect db table-sizes

# View indexes
npx supabase inspect db index-usage

# View cache hit rate
npx supabase inspect db cache-hit
```

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Test migrations
  run: |
    npx supabase start
    npx supabase db reset
    npx supabase test db  # Run pgTAP tests
```

## Related

- [migrations-idempotent.md](migrations-idempotent.md)
- [Docs](https://supabase.com/docs/guides/local-development/overview)
