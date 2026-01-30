---
title: CLI Migration Commands
impact: HIGH
impactDescription: Commands for creating, syncing, and managing migration files
tags: cli, migration, new, list, fetch, repair, squash
---

## CLI Migration Commands

Commands for managing migration files: creating, listing, syncing with remote, repairing history, and squashing.

**Incorrect:**

```bash
# After MCP apply_migration, continuing without fetch
apply_migration({ ... })  # Creates migration on remote
supabase db reset         # Local doesn't have the migration!
```

**Correct:**

```bash
# After MCP migration, sync locally
apply_migration({ ... })
supabase migration fetch --yes   # Sync to local
supabase db reset                # Now local has the migration
```

---

## supabase migration new

Create empty migration file for manual SQL.

```bash
supabase migration new create_posts
# Creates: supabase/migrations/<timestamp>_create_posts.sql
```

**File format:** `<YYYYMMDDHHmmss>_<name>.sql`

**vs db diff:**
| `migration new` | `db diff` |
|-----------------|-----------|
| Creates empty file | Generates from schema changes |
| For manual SQL, DML | For capturing UI changes |

---

## supabase migration list

Compare local migrations with remote history.

```bash
supabase migration list
```

**Output:**
```text
      LOCAL      |     REMOTE     |     TIME (UTC)
-----------------+----------------+----------------------
 20240315120000  | 20240315120000 | 2024-03-15 12:00:00
 20240316130000  |                | 2024-03-16 13:00:00
```

**Reading:** Both filled = synced, LOCAL only = not pushed, REMOTE only = need fetch

---

## supabase migration fetch

Fetch migration files from remote to local.

```bash
supabase migration fetch        # Interactive
supabase migration fetch --yes  # Auto-confirm
```

**Flags:** `--yes`

**When to use:**
- After MCP `apply_migration`
- Onboarding to existing project
- Syncing team changes

---

## supabase migration repair

Fix migration history when local and remote diverge.

```bash
supabase migration repair 20240315120000 --status applied   # Mark as run
supabase migration repair 20240315120000 --status reverted  # Mark as not run
```

**Flags:** `--status applied`, `--status reverted`

**Caution:** Only modifies history, not actual schema.

---

## supabase migration squash

Combine multiple migrations into single file.

```bash
supabase migration squash                    # Squash to latest
supabase migration squash --version 20240315 # Squash to version
```

**Flags:** `--version`

**Captures:** DDL (CREATE, ALTER, DROP)
**Loses:** DML (INSERT, UPDATE, DELETE) - re-add manually

**Caution:** Only squash un-deployed migrations.

## Related

- [database-commands.md](database-commands.md) - Push, pull, diff, reset
- [project-commands.md](project-commands.md) - Link to remote
