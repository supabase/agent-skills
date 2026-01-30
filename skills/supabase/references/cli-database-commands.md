---
title: CLI Database Commands
impact: CRITICAL
impactDescription: Commands for syncing schema between local and remote databases
tags: cli, db, push, pull, diff, reset, dump
---

## CLI Database Commands

Commands for pushing, pulling, diffing, and resetting database schemas between local and remote environments.

**Incorrect:**

```bash
# Push without previewing changes
supabase db push  # May push unexpected migrations
```

**Correct:**

```bash
supabase db push --dry-run    # Preview first
supabase db push              # Then push
```

---

## supabase db push

Push local migration files to remote database.

```bash
supabase db push              # Push all pending migrations
supabase db push --dry-run    # Preview changes
supabase db push --include-seed  # Include seed data
```

**Flags:** `--dry-run`, `--include-seed`, `--db-url`

**Prerequisites:** `supabase link` completed

**vs MCP apply_migration:**
| `db push` | MCP `apply_migration` |
|-----------|----------------------|
| Pushes existing local files | Creates new migration from SQL |
| Batch operation | Single migration |
| Use for deployment | Use for remote-first development |

---

## supabase db pull

Pull schema from remote database as new migration file.

```bash
supabase db pull              # Pull entire schema
supabase db pull --schema auth  # Pull specific schema (after first pull)
```

**Flags:** `--schema`, `--yes`

**Behavior:**
- Empty migrations folder: Uses `pg_dump` to capture full schema
- Existing migrations: Diffs against remote, creates migration for differences

---

## supabase db diff

Generate migration file from schema changes. Captures changes made via Studio, Dashboard, or MCP `execute_sql`.

```bash
supabase db diff                    # Output to stdout
supabase db diff -f my_changes      # Save to migration file
supabase db diff --linked           # Diff against remote
```

**Flags:** `-f <name>`, `--schema`, `--linked`, `--use-migra`

**Captures:** Tables, columns, indexes, constraints, functions, triggers, RLS policies, extensions

**Does NOT capture:** DML (INSERT/UPDATE/DELETE), view ownership, materialized views, partitions

---

## supabase db reset

Reset local database. Drops and recreates, applies all migrations, runs seed.

```bash
supabase db reset                     # Full reset with seed
supabase db reset --version 20240315  # Reset to specific migration
```

**Flags:** `--version`

**Local only:** Does not affect remote. For remote, use PITR or recreate preview branch.

**What happens:**
1. Drops local database
2. Recreates fresh database
3. Applies all migrations
4. Runs seed files

---

## supabase db dump

Export database schema or data to SQL file.

```bash
supabase db dump --db-url "$DB_URL" -f schema.sql           # Schema only
supabase db dump --db-url "$DB_URL" --data-only -f data.sql # Data only
supabase db dump --db-url "$DB_URL" --role-only -f roles.sql # Roles only
```

**Flags:** `--db-url` (required), `-f`, `--data-only`, `--role-only`, `--schema`, `--use-copy`

## Related

- [migration-commands.md](migration-commands.md) - Migration file management
- [project-commands.md](project-commands.md) - Link to remote project
