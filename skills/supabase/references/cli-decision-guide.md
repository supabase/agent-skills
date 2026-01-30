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

**Incorrect:**

```bash
# Using migration up for standard remote deployment
supabase migration up --linked  # More granular, for specific DBs
```

**Correct:**

```bash
# db push is the standard deploy command
supabase db push
supabase db push --dry-run  # Preview first
```

| Command | Use When |
|---------|----------|
| `db push` | Standard deployment to linked remote project |
| `migration up` | Targeting specific database via `--db-url`, more granular control |

---

## migration down vs db reset

**Incorrect:**

```bash
# Using db reset to revert one migration
supabase db reset  # Destroys ALL local data
```

**Correct:**

```bash
# Revert specific migrations
supabase migration down --last 2
```

| Command | Scope | Data |
|---------|-------|------|
| `migration down` | Targeted rollback of specific migrations | Preserves unaffected data |
| `db reset` | Nuclear option, drops everything | All local data lost |

**db reset steps:**
1. Drops local database
2. Recreates fresh database
3. Applies all migrations
4. Runs seed files

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
supabase db diff -f my_change --use-pgadmin
supabase db diff -f my_change --use-pg-schema
```

**Known limitations across all engines:**
- Publications may not diff correctly
- Materialized view contents not captured
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
