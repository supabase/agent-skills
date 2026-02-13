---
title: CLI Command Reference
impact: CRITICAL
impactDescription: Best practices and pitfalls for every CLI command group
tags: cli, commands, push, pull, diff, reset, migration, functions, secrets, types
---

## CLI Command Reference

Best practices, key flags, and pitfalls for each CLI command group. The CLI is the primary tool for local development (alongside `psql` for database interaction) and for all deployment operations to remote projects. For full flag lists, run `npx supabase <command> --help`.

**Incorrect:**

```bash
# Push migrations without previewing changes or asking user permission
npx supabase db push
```

**Correct:**

```bash
# Always preview first, then push (ask user permission before pushing!)
npx supabase db push --dry-run
npx supabase db push
```

## Project Commands

### init / start / stop / status

```bash
npx supabase init --yes                    # Non-interactive setup
npx supabase start                         # Start local stack (requires Docker, 7GB+ RAM)
npx supabase start -x gotrue,imgproxy      # Exclude services for faster startup
npx supabase stop                          # Stop, preserve data
npx supabase stop --no-backup              # Stop, delete all data
npx supabase stop --all                    # Stop all Supabase projects
npx supabase status -o env                 # Export credentials as env vars
```

**Pitfalls:**

- `start` before `init` → "no config.toml found"
- `stop` doesn't free disk space. Use `--no-backup` before CLI upgrades. For full cleanup: `docker system prune`
- `start` requires Docker running

### link / login

```bash
npx supabase login                                  # Browser OAuth
npx supabase link --project-ref <project-id>        # Link to remote
npx supabase projects list                          # Find project IDs
```

**Pitfalls:**

- `link` doesn't require Docker, but `pull`/`diff` do — start Docker before those commands
- CI/CD: set `SUPABASE_ACCESS_TOKEN` env var instead of `login`

---

## Database Commands

### db push

```bash
npx supabase db push --dry-run    # Preview changes (always do this first)
npx supabase db push              # Push all pending migrations to remote
```

**Best practice:** Always `--dry-run` before pushing.

### db pull

```bash
npx supabase db pull                  # Pull schema from remote as migration file
npx supabase db pull --schema auth    # Pull specific schema (after first pull)
```

**Behavior:**

- Empty migrations folder → uses `pg_dump` to capture full schema
- Existing migrations → diffs against remote, creates migration for differences

**Pitfall:** `db pull` creates files and may update remote migration history. To preview without side effects, use `db diff --linked` instead.

### db diff

```bash
npx supabase db diff                        # Diff local, output to stdout
npx supabase db diff -f my_changes          # Save to migration file
npx supabase db diff --linked               # Diff against remote
```

**Captures:** Tables, columns, indexes, constraints, functions, triggers, RLS policies, extensions.

**Does NOT capture:** DML (INSERT/UPDATE/DELETE), publications, materialized view contents, some extension objects. Always review generated files.

**Diff engines:** If default misses changes, try `--use-migra`, `--use-pg-delta`, or `--use-pg-schema`. None can capture table renames.

### db reset

```bash
npx supabase db reset                                   # Full reset with seed
npx supabase db reset --linked                          # Reset remote database
npx supabase db reset --version 20240315001122          # Reset to specific migration
```

**Pitfall:** Destroys ALL local data without confirmation. Backup first:

```bash
npx supabase db dump --data-only --local > supabase/seed.sql
```

### db dump

```bash
npx supabase db dump > schema.sql                # Schema only
npx supabase db dump --data-only > data.sql      # Data only
npx supabase db dump --role-only > roles.sql     # Roles only
```

### Targeting Flags

Most database commands accept:

| Flag | Target |
| --- | --- |
| `--local` | Local database (default for most) |
| `--linked` | Linked remote project |
| `--db-url` | Arbitrary database (self-hosted, CI) |

**Pitfall:** `--db-url` connection strings must be percent-encoded for special characters (`@` = `%40`, `#` = `%23`).

---

## Migration Commands

### migration new / list

```bash
npx supabase migration new create_posts          # Create empty migration file
npx supabase migration list                       # Compare local vs remote history
```

**Reading `migration list` output:** Both columns filled = synced, LOCAL only = not pushed, REMOTE only = need fetch.

### migration fetch

```bash
npx supabase migration fetch --yes               # Fetch from remote, auto-confirm
```

**When to use:** After MCP `apply_migration`, onboarding to existing project, syncing team changes.

### migration repair

```bash
npx supabase migration repair 20240315120000 --status applied    # Mark as run
npx supabase migration repair 20240315120000 --status reverted   # Mark as not run
```

**Caution:** Only modifies history, not actual schema.

### migration squash

```bash
npx supabase migration squash                        # Squash all to latest
npx supabase migration squash --version 20240315     # Squash to version
```

**Pitfalls:**

- Rewrites migration history — only squash un-deployed migrations
- Loses DML (INSERT/UPDATE/DELETE) — re-add manually
- Team members with un-pushed migrations need to reconcile

---

## Decision Guide

### db pull vs db diff

| Command | Direction | Use When |
| --- | --- | --- |
| `db pull` | Remote → local | Remote has changes from dashboard edits |
| `db diff` | Local changes | You made changes via `psql`, need migration file |

### db push vs migration up

Both apply pending migrations. Differ only in defaults:

| Command | Default Target |
| --- | --- |
| `db push` | Remote (linked project) |
| `migration up` | Local database |

Both support `--linked`, `--local`, `--db-url` overrides.

### migration down vs db reset

Both revert migrations. Differ in how you specify target:

| Command | Flag | Example |
| --- | --- | --- |
| `migration down` | `--last n` | `migration down --last 2` |
| `db reset` | `--version m` | `db reset --version 20240315001122` |

---

## Functions Commands

```bash
npx supabase functions new hello-world                # Scaffold new function
npx supabase functions serve                          # Serve all with hot reload
npx supabase functions serve --no-verify-jwt          # For webhooks
npx supabase functions serve --env-file .env.local    # Custom env file
npx supabase functions deploy                         # Deploy all to production
npx supabase functions deploy hello-world             # Deploy specific function
npx supabase functions deploy --no-verify-jwt         # For webhooks
```

**Pitfalls:**

- Webhooks need `--no-verify-jwt` (external services can't provide Supabase JWT)
- Functions work locally but fail deployed → missing secrets. Check `npx supabase secrets list`
- `serve` requires `supabase start` running

**Local secrets:** Create `supabase/functions/.env` (auto-loaded, gitignored).

---

## Secrets Commands

```bash
npx supabase secrets set STRIPE_KEY=sk_live_xxx       # Single secret
npx supabase secrets set --env-file .env.production   # From file
npx supabase secrets list                             # List names (not values)
```

**Built-in secrets** (auto-available in Edge Functions):
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`

| Environment | How to Set |
| --- | --- |
| Local | `supabase/functions/.env` file (gitignored) |
| Production | `npx supabase secrets set` |

**Pitfall:** Never commit secrets to version control.

---

## Type Generation

```bash
npx supabase gen types --lang typescript --local > types.ts     # From local
npx supabase gen types --lang typescript --linked > types.ts    # From remote
```

**Pitfalls:**

- Must specify `--local` or `--linked` — omitting both is an error
- Outputs to stdout — redirect with `>`

**CI verification:**

```yaml
- run: |
    npx supabase gen types --lang typescript --local > types.gen.ts
    if ! git diff --exit-code types.gen.ts; then
      echo "Types out of date!"
      exit 1
    fi
```

Generate types after every schema change.

---

## Experimental Flags

Several command groups require `--experimental`:

| Commands | Requires `--experimental` |
| --- | --- |
| `storage ls/cp/mv/rm` | Yes |
| `vanity-subdomains *` | Yes |
| `network-bans *` | Yes |
| `network-restrictions *` | Yes |
| `ssl-enforcement *` | Yes |
| `postgres-config *` | Yes |
