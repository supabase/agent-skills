---
title: CLI Gotchas and Pitfalls
impact: HIGH
impactDescription: Common mistakes and edge cases when using the Supabase CLI
tags: cli, gotchas, pitfalls, troubleshooting
---

## CLI Gotchas and Pitfalls

Common mistakes and edge cases that `--help` won't warn you about.

**Incorrect:**

```bash
# Running db reset without understanding consequences
supabase db reset  # Destroys ALL local data, no confirmation
```

**Correct:**

```bash
# Backup data first if needed
supabase db dump --data-only --local > supabase/seed.sql
supabase db reset
```

---

## supabase stop doesn't free disk space

`supabase stop` stops containers but keeps Docker volumes cached.

**Incorrect:**

```bash
supabase stop
# Docker images still consuming gigabytes
```

**Correct:**

```bash
# Stop and remove backup volumes
supabase stop --no-backup

# Stop all Supabase projects on machine
supabase stop --all
```

For full disk cleanup, also run `docker system prune` separately.

---

## db pull creates files, not just a diff

`supabase db pull` creates a new migration file in `supabase/migrations/` and may update remote migration history.

**Incorrect:**

```bash
# Just want to preview changes
supabase db pull  # Creates file, may update history
```

**Correct:**

```bash
# Preview without side effects
supabase db diff --linked
```

---

## db diff has blind spots

The diff engines can't capture everything.

**Known limitations:**
- Changes to publications
- Materialized view contents
- Some extension-specific objects
- RLS policies may sometimes diff incorrectly

**Correct:**

```bash
# Generate migration
supabase db diff -f my_change

# ALWAYS review the generated file
cat supabase/migrations/*_my_change.sql

# Try different engine if diff seems incomplete
supabase db diff -f my_change
```

---

## storage cp has 6MB upload limit

Standard uploads via `supabase storage cp` max out at 6MB. For larger files, use the Supabase client library's resumable upload API.

---

## --db-url must be percent-encoded

**Incorrect:**

```bash
# Special characters break parsing
supabase db push --db-url "postgresql://user:p@ss#word@host:5432/db"
```

**Correct:**

```bash
# Percent-encode special characters (@ = %40, # = %23)
supabase db push --db-url "postgresql://user:p%40ss%23word@host:5432/db"
```

---

## migration squash rewrites history

Squashing combines migrations and rewrites the migration history table. Team members with un-pushed migrations based on old history need to reconcile.

**Best practice:** Only squash un-deployed migrations. Coordinate with team.

---

## db lint defaults to exit 0

**Incorrect:**

```bash
# Expecting lint to fail CI on warnings
supabase db lint  # Always exits 0
```

**Correct:**

```bash
# Fail CI on warnings
supabase db lint --fail-on warning

# Fail only on errors
supabase db lint --fail-on error
```

---

## Functions work locally but fail after deploy

Locally served functions have access to all environment variables. Deployed functions only see secrets set via `supabase secrets set`.

**Correct:**

```bash
# List current secrets (names only)
supabase secrets list

# Set missing secrets before deploy
supabase secrets set MY_KEY=value
supabase secrets set --env-file .env.production
```

---

## link doesn't require Docker, but pull/diff do

`supabase link` itself doesn't need Docker. But `db pull` and `db diff` start local Postgres containers for schema comparison.

**Ensure Docker is running before:**
- `supabase db pull`
- `supabase db diff`
- `supabase start`

---

## Custom domains and vanity subdomains are mutually exclusive

You can use one or the other, not both.

**Custom domain:**
```bash
supabase domains create --custom-hostname api.yourdomain.com
supabase domains reverify
supabase domains activate
```

**Vanity subdomain:**
```bash
supabase vanity-subdomains check-availability --desired-subdomain my-app --experimental
supabase vanity-subdomains activate --desired-subdomain my-app --experimental
```

## Related

- [decision-guide.md](decision-guide.md) - When to use which command
- [project-commands.md](project-commands.md) - Project management commands
- [secrets-commands.md](secrets-commands.md) - Secrets management
