---
title: Gotchas and Common Pitfalls
impact: HIGH
impactDescription: Things that catch people off guard when using the Supabase CLI
tags: cli, supabase, gotchas, pitfalls, troubleshooting, edge-cases
---

## Gotchas and Common Pitfalls

Common mistakes and edge cases when using the Supabase CLI. These are things that `--help` won't warn you about.

**Incorrect (running db reset without understanding the consequences):**

```bash
# This destroys ALL local data with no confirmation prompt
supabase db reset
```

**Correct (backing up data before reset):**

```bash
# Dump data first if you need it
supabase db dump --data-only -f backup.sql --local

# Then reset
supabase db reset
```

### `supabase stop` doesn't free disk space

`supabase stop` stops containers but keeps Docker images cached. Over time this uses significant disk space.

**Incorrect (expecting stop to clean up):**

```bash
supabase stop
# Docker images still consuming gigabytes of disk
```

**Correct (freeing disk space):**

```bash
supabase stop --all
```

### `db pull` creates a migration file, not just a diff

`supabase db pull` doesn't just show what changed — it creates a new migration file in `supabase/migrations/` and optionally updates the remote migration history table. If you just want to see the diff without creating files, use `db diff`.

**Incorrect (using db pull to preview changes):**

```bash
# This creates a file and may update remote history
supabase db pull
```

**Correct (previewing changes without side effects):**

```bash
# Just see the diff, no files created
supabase db diff --linked
```

### `db diff` has known blind spots

The diff engines can't capture everything. Known limitations: changes to publications, materialized view contents, some extension-specific objects, and RLS policies may sometimes diff incorrectly.

**Correct (reviewing diffs before pushing):**

```bash
# Generate migration
supabase db diff -f my_change

# ALWAYS review the generated file
cat supabase/migrations/*_my_change.sql

# If the diff seems incomplete, try a different engine
supabase db diff -f my_change --use-migra
```

### Storage commands require `--experimental`

**Incorrect (storage without experimental):**

```bash
# This errors
supabase storage ls
```

**Correct (storage with experimental):**

```bash
supabase storage ls --experimental
```

### `storage cp` has a 6MB upload limit

Standard uploads via `supabase storage cp` are not suitable for files over 6MB. For larger files, use the Supabase client library's resumable upload API instead.

### `--db-url` must be percent-encoded

**Incorrect (special characters in connection string):**

```bash
# The @ and # in the password break parsing
supabase db push --db-url "postgresql://user:p@ss#word@host:5432/db"
```

**Correct (percent-encoded connection string):**

```bash
supabase db push --db-url "postgresql://user:p%40ss%23word@host:5432/db"
```

### `migration squash` rewrites history

Squashing combines multiple migration files into one and rewrites the migration history on the target database. If team members have un-pushed migrations based on the old history, they'll need to reconcile. Coordinate squashes with your team.

### `db lint` defaults to exit 0 even on warnings

**Incorrect (expecting lint to fail CI on warnings):**

```bash
# Always exits 0, even with warnings
supabase db lint
```

**Correct (failing CI on warnings):**

```bash
supabase db lint --fail-on warning
# Or fail only on errors:
supabase db lint --fail-on error
```

### Auth and storage schemas are excluded from `db pull`

**Incorrect (expecting db pull to capture auth schema changes):**

```bash
# This only pulls public schema changes
supabase db pull
```

**Correct (explicitly pulling auth/storage schemas):**

```bash
supabase db pull --schema auth,storage
```

### `supabase link` doesn't require Docker, but `db pull` and `db diff` do

While `supabase link` itself doesn't need Docker, subsequent operations like `db pull` and `db diff` start local Postgres containers for schema comparison. Make sure Docker is running before pulling or diffing.

### Functions work locally but fail after deploy

Locally served functions have access to all environment variables. Deployed functions only see secrets set via `supabase secrets set`. If a function works locally but fails after deploy, check that all required secrets are set.

**Correct (verifying secrets before deploy):**

```bash
# List current secrets (names only, not values)
supabase secrets list

# Set any missing secrets
supabase secrets set MY_KEY=value ANOTHER_KEY=value2
```
