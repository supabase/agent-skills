---
title: CLI Decision Guide
impact: HIGH
impactDescription: Guidance on choosing between similar CLI commands and flags
tags: cli, decision, pull-vs-diff, push-vs-up, targeting
---

## CLI Decision Guide

The Supabase CLI has several commands that seem similar but serve different purposes. For exact flag syntax, run `supabase <command> --help`.

**Incorrect:**

```bash
# Using db pull when you meant db diff
# You made local changes and want a migration file
supabase db pull  # Pulls from REMOTE, not local changes
```

**Correct:**

```bash
# db diff captures LOCAL changes against migration files
supabase db diff -f my_local_changes
```

---

## db pull vs db diff

| Command | Direction | Use When |
|---------|-----------|----------|
| `db pull` | Remote to local | Remote has changes made outside migrations (dashboard edits) |
| `db diff` | Local changes | You made changes via local dashboard/psql, need migration file |

**db pull behavior:**
- Empty migrations folder: Uses `pg_dump` to capture full schema
- Existing migrations: Diffs against remote, creates migration for differences

**db diff behavior:**
- Compares local database state against migration files
- Generates migration capturing the difference

---

## db push vs migration up

Both commands apply pending migrations. They differ only in defaults:

| Command | Default target | Notes |
|---------|---------------|-------|
| `db push` | Remote (linked project) | Standard deploy command |
| `migration up` | Local database | Same underlying behavior |

Both support `--linked`, `--local`, and `--db-url` to override the default target.

---

## migration down vs db reset

Both commands drop and recreate the database, then replay migrations. They differ only in how you specify the target version:

| Command | Flag | Example |
|---------|------|---------|
| `migration down` | `--last n` | `migration down --last 2` (revert last 2) |
| `db reset` | `--version m` | `db reset --version 20240315001122` (reset to specific) |

Both support `--linked`, `--local`, and `--db-url` to target different databases.

---

## Targeting Flags

Most database commands accept targeting flags:

```bash
# Local development (default)
supabase db diff --local

# Linked remote project
supabase db push --linked

# Arbitrary database (self-hosted, CI)
supabase db push --db-url "postgresql://user:pass@host:5432/db"
```

**Note:** Connection strings must be percent-encoded for special characters.

---

## Diff Engines

`supabase db diff` supports multiple diffing backends. If default misses something, try another:

```bash
supabase db diff -f my_change --use-migra
supabase db diff -f my_change --use-pg-delta
supabase db diff -f my_change --use-pg-schema
```

**Known limitations across all engines:**
- Cannot capture table renames
- Some extension-specific objects missed

Always review generated migration files before pushing.

---

## Experimental Flag Requirements

Several command groups require `--experimental`:

| Commands | Requires `--experimental` |
|----------|--------------------------|
| `storage ls/cp/mv/rm` | Yes |
| `vanity-subdomains *` | Yes |
| `network-bans *` | Yes |
| `network-restrictions *` | Yes |
| `ssl-enforcement *` | Yes |
| `postgres-config *` | Yes |

**Incorrect:**

```bash
supabase storage ls  # Fails
```

**Correct:**

```bash
supabase storage ls --experimental
```

## Related

- [database-commands.md](database-commands.md) - Database command details
- [migration-commands.md](migration-commands.md) - Migration command details
