---
title: Decision Guide - When to Use What
impact: HIGH
impactDescription: Guidance on choosing between similar commands and flags
tags: cli, supabase, decision-guide, pull-vs-diff, targeting, migrations
---

## Decision Guide

The Supabase CLI has several commands that seem similar but serve different purposes. This guide helps you pick the right one. For exact flag syntax, run `supabase <command> --help`.

**Incorrect (using db pull when you meant db diff):**

```bash
# You made local changes via the dashboard and want a migration file.
# db pull pulls from REMOTE — it won't capture your local changes.
supabase db pull
```

**Correct (using db diff for local changes):**

```bash
# db diff compares your local database against migration files
supabase db diff -f my_local_changes
```

### `db pull` vs `db diff`

- **`db pull`** — Remote-to-local. Use when the remote database has changes made outside of migrations (e.g., someone edited the schema in the dashboard). Creates a migration file from the remote schema.
- **`db diff`** — Captures local changes. Use when you've made changes via the local dashboard or psql and need to capture them as a migration file.

### `db push` vs `migration up`

**Incorrect (using migration up to deploy to remote):**

```bash
# migration up is for applying to a specific database
# For standard remote deploys, use db push
supabase migration up --linked
```

**Correct (deploying migrations to remote):**

```bash
# db push is the standard deploy command
supabase db push
```

- **`db push`** — Standard deploy command. Pushes local migration files to the remote project.
- **`migration up`** — More granular. Works with `--db-url` for arbitrary databases. Use when targeting a specific database outside the standard linked project.

### `migration down` vs `db reset`

**Incorrect (using db reset to revert one migration):**

```bash
# db reset drops EVERYTHING and re-applies from scratch
# All local data is lost
supabase db reset
```

**Correct (reverting specific migrations):**

```bash
# Revert just the last 2 migrations
supabase migration down --last 2
```

- **`migration down`** — Targeted rollback. Reverts specific migrations in reverse order.
- **`db reset`** — Nuclear option. Drops everything and re-applies all migrations. Destroys all local data.

### Targeting: `--linked` vs `--local` vs `--db-url`

Most database commands accept three targeting flags:

**Correct (choosing the right target):**

```bash
# Day-to-day development
supabase db diff --local

# Deploying to your project
supabase db push --linked

# Self-hosted or CI database (connection string must be percent-encoded)
supabase db push --db-url "postgresql://user:pass@host:5432/db"
```

### Diff engines

`supabase db diff` supports multiple diffing backends. If the default misses something, try another engine.

**Correct (switching diff engines):**

```bash
supabase db diff -f my_change --use-migra
supabase db diff -f my_change --use-pgadmin
supabase db diff -f my_change --use-pg-schema
supabase db diff -f my_change --use-pg-delta
```

Known limitations across all engines: some can't capture changes to publications, materialized view contents, or certain extension-specific objects. Always review generated migration files before pushing.

### Custom domains vs vanity subdomains

These are **mutually exclusive** — you can use one or the other, not both.

**Correct (custom domain setup):**

```bash
supabase domains create --custom-hostname api.yourdomain.com
# Configure DNS, then:
supabase domains reverify
supabase domains activate
```

**Correct (vanity subdomain setup):**

```bash
supabase vanity-subdomains check-availability --desired-subdomain my-app --experimental
supabase vanity-subdomains activate --desired-subdomain my-app --experimental
```

### When `--experimental` is required

Several command groups require the `--experimental` flag: all `storage`, `vanity-subdomains`, `network-bans`, `network-restrictions`, `ssl-enforcement`, and `postgres-config` subcommands.

**Incorrect (missing experimental flag):**

```bash
# This fails
supabase storage ls
```

**Correct (with experimental flag):**

```bash
supabase storage ls --experimental
```
