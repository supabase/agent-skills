---
title: Database Commands - Schema Management
impact: CRITICAL
impactDescription: Essential commands for managing database schemas locally and remotely
tags: cli, supabase, database, pull, push, reset, dump, diff, lint
---

## Database Commands

Manage local and remote databases including pulling/pushing schema changes, resetting, dumping, diffing, and linting.

### `supabase db`

Parent command for managing local databases.

**Subcommands:** `pull`, `push`, `reset`, `dump`, `diff`, `lint`, `start`

---

### `supabase db pull`

Pull schema changes from the remote (linked) database to create a new local migration file. Useful for syncing remote changes made outside of migrations.

**Usage:**

```bash
supabase db pull [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | Pull from the specified database URL (must be percent-encoded) |
| `--linked` | Optional | Pull from the linked project |
| `--local` | Optional | Pull from the local database |
| `-p, --password <string>` | Optional | Password to your Supabase project |
| `-s, --schema <strings>` | Optional | Comma separated list of schemas to include |

---

### `supabase db push`

Push all local migration files to the remote (linked) database. Applies any unapplied migrations in order.

**Usage:**

```bash
supabase db push [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | Push to the specified database URL (must be percent-encoded) |
| `--dry-run` | Optional | Print the migrations that would be applied without executing them |
| `--include-all` | Optional | Include all migrations, not just pending ones |
| `--include-roles` | Optional | Include custom roles from `supabase/roles.sql` |
| `--include-seed` | Optional | Include seed data after pushing migrations |
| `--linked` | Optional | Push to the linked project |
| `--local` | Optional | Push to the local database |
| `-p, --password <string>` | Optional | Password to your Supabase project |

---

### `supabase db reset`

Reset the local database to a clean state by re-applying all migrations from scratch. Destroys all local data.

**Usage:**

```bash
supabase db reset [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | Reset the specified database URL (must be percent-encoded) |
| `--last <uint>` | Optional | Reset up to the last N migration versions |
| `--linked` | Optional | Reset the linked project with local migrations |
| `--local` | Optional | Reset the local database with local migrations |
| `--no-seed` | Optional | Skip running the seed script after reset |
| `-p, --password <string>` | Optional | Password to your remote Postgres database |
| `--version <string>` | Optional | Reset up to the specified version |

---

### `supabase db dump`

Dump the schema from the remote database as a SQL file. Useful for taking schema snapshots or seeding initial migrations.

**Usage:**

```bash
supabase db dump [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--data-only` | Optional | Dump only data records |
| `--db-url <string>` | Optional | Dump from the specified database URL (must be percent-encoded) |
| `--dry-run` | Optional | Print the pg_dump script that would be executed |
| `-x, --exclude <strings>` | Optional | List of schema.tables to exclude from data-only dump |
| `-f, --file <string>` | Optional | File path to save the dumped contents |
| `--keep-comments` | Optional | Keep commented lines from pg_dump output |
| `--linked` | Optional | Dump from the linked project |
| `--local` | Optional | Dump from the local database |
| `-p, --password <string>` | Optional | Password to your remote Postgres database |
| `--role-only` | Optional | Dump only cluster roles |
| `-s, --schema <strings>` | Optional | Comma separated list of schemas to include |
| `--use-copy` | Optional | Use copy statements in place of inserts |

---

### `supabase db diff`

Diff the local database schema against a target (migration files or linked project). Shows what SQL would be needed to bring them in sync. Useful for generating migration files from manual schema changes.

**Usage:**

```bash
supabase db diff [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | Diff against the specified database URL (must be percent-encoded) |
| `-f, --file <string>` | Optional | Save schema diff to a new migration file |
| `--linked` | Optional | Diff local migration files against the linked project |
| `--local` | Optional | Diff local migration files against the local database |
| `-s, --schema <strings>` | Optional | Comma separated list of schemas to include |
| `--use-migra` | Optional | Use migra to generate schema diff |
| `--use-pg-delta` | Optional | Use pg-delta to generate schema diff |
| `--use-pg-schema` | Optional | Use pg-schema-diff to generate schema diff |
| `--use-pgadmin` | Optional | Use pgAdmin to generate schema diff |

---

### `supabase db lint`

Lint the local database for schema errors using the `plpgsql_check` extension.

Runs checks on all schemas by default. The `--fail-on` flag controls exit codes for CI/CD:
- `none` (default): Always exit 0
- `warning`: Exit non-zero on warnings or errors
- `error`: Exit non-zero only on errors

**Usage:**

```bash
supabase db lint [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | Lint the specified database URL |
| `--fail-on <none\|warning\|error>` | Optional | Control when to exit with non-zero status |
| `--level <warning\|error>` | Optional | Minimum lint level to report |
| `--linked` | Optional | Lint the linked project |
| `--local` | Optional | Lint the local database |
| `-s, --schema <strings>` | Optional | Schemas to lint |

---

### `supabase db start`

Start only the local Postgres database container without other Supabase services.

**Usage:**

```bash
supabase db start
```

Reference: [Supabase CLI - Database](https://supabase.com/docs/reference/cli/supabase-db)
