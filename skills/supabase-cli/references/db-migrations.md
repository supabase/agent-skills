---
title: Database Migrations and Seeding
impact: CRITICAL
impactDescription: Essential migration lifecycle management for schema versioning
tags: cli, supabase, migrations, seed, schema-versioning
---

## Migration Commands

Manage database migration files for schema versioning, including creating, listing, squashing, and applying migrations.

### `supabase migration`

Parent command for managing database migrations.

**Subcommands:** `new`, `list`, `fetch`, `repair`, `squash`, `up`, `down`

---

### `supabase migration new`

Create a new empty migration file with a timestamped filename in the `supabase/migrations/` directory.

**Usage:**

```bash
supabase migration new <name> [flags]
```

---

### `supabase migration list`

List all migration files and their status (applied or pending) against the target database.

**Usage:**

```bash
supabase migration list [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | List against the specified database URL |
| `--linked` | Optional | List against the linked project |
| `--local` | Optional | List against the local database |
| `-p, --password <string>` | Optional | Password to your Supabase project |

---

### `supabase migration fetch`

Fetch migration files from the migration history table on the remote database. Useful for syncing migration files that were applied by other team members.

**Usage:**

```bash
supabase migration fetch [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | Fetch from the specified database URL (must be percent-encoded) |
| `--linked` | Optional | Fetch migration history from the linked project |
| `--local` | Optional | Fetch migration history from the local database |

---

### `supabase migration repair`

Repair the migration history table on the remote database. Use this to mark migrations as applied or reverted without actually running the SQL.

**Usage:**

```bash
supabase migration repair [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | Repair the specified database URL |
| `--linked` | Optional | Repair the linked project |
| `--local` | Optional | Repair the local database |
| `-p, --password <string>` | Optional | Password to your Supabase project |
| `--status <applied\|reverted>` | Required | Version status to update to |

---

### `supabase migration squash`

Squash multiple migration files into a single file. Useful for cleaning up migration history after many incremental changes.

**Usage:**

```bash
supabase migration squash [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | Squash against the specified database URL |
| `--linked` | Optional | Squash against the linked project |
| `--local` | Optional | Squash against the local database |
| `-p, --password <string>` | Optional | Password to your Supabase project |
| `--version <string>` | Optional | Squash up to and including this version |

---

### `supabase migration up`

Apply pending migration files to the database.

**Usage:**

```bash
supabase migration up [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | Apply to the specified database URL (must be percent-encoded) |
| `--include-all` | Optional | Include all migrations not found on remote history table |
| `--linked` | Optional | Apply pending migrations to the linked project |
| `--local` | Optional | Apply pending migrations to the local database |

---

### `supabase migration down`

Revert migrations back to a prior version. Rolls back applied migrations in reverse order.

**Usage:**

```bash
supabase migration down [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | Reset applied migrations on the specified database URL (must be percent-encoded) |
| `--last <uint>` | Optional | Reset up to the last N migration versions |
| `--linked` | Optional | Reset applied migrations on the linked project |
| `--local` | Optional | Reset applied migrations on the local database |

---

## Seed Commands

### `supabase seed`

Parent command for seeding a Supabase project.

**Subcommands:** `buckets`

---

### `supabase seed buckets`

Seed storage buckets from the project config file.

**Usage:**

```bash
supabase seed buckets [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--linked` | Optional | Seed the linked project |
| `--local` | Optional | Seed the local database |

Reference: [Supabase CLI - Migrations](https://supabase.com/docs/reference/cli/supabase-migration)
