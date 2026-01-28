---
title: Commands Overview
impact: MEDIUM
impactDescription: Quick-scan listing of all available CLI commands by category
tags: cli, supabase, commands, overview, reference
---

## Commands Overview

Quick-scan reference for what commands are available. This is not a substitute for `--help` — always run `supabase <command> --help` for exact flag syntax.

**Incorrect (guessing flags from memory):**

```bash
# Don't guess flag names — they change between versions
supabase db push --force --remote
```

**Correct (checking help first):**

```bash
# Always check current flags
supabase db push --help
# Then run with the correct flags
supabase db push --dry-run
```

### General

`supabase init` — Initialize a new local project.
`supabase login` — Authenticate with Supabase.
`supabase link` — Link local project to a remote Supabase project.
`supabase start` — Start local development stack.
`supabase stop` — Stop local development stack.
`supabase status` — Show status of local services.
`supabase bootstrap` — Bootstrap a new project from a starter template.

### Database

`supabase db pull` — Pull remote schema changes into a new migration file.
`supabase db push` — Push local migrations to remote database.
`supabase db reset` — Reset database by re-applying all migrations.
`supabase db dump` — Dump schema or data as SQL.
`supabase db diff` — Diff local changes against migration files.
`supabase db lint` — Lint database for schema errors.
`supabase db start` — Start only the local Postgres container.

### Migrations

`supabase migration new` — Create a new empty migration file.
`supabase migration list` — List migrations and their status.
`supabase migration fetch` — Fetch migrations from remote history.
`supabase migration repair` — Fix migration history.
`supabase migration squash` — Squash multiple migrations into one.
`supabase migration up` — Apply pending migrations.
`supabase migration down` — Revert applied migrations.
`supabase seed buckets` — Seed storage buckets from project config.

### Edge Functions

`supabase functions new` — Create a new edge function.
`supabase functions serve` — Serve functions locally with hot reload.
`supabase functions deploy` — Deploy functions to remote project.
`supabase functions list` — List all deployed functions.
`supabase functions download` — Download function source from remote.
`supabase functions delete` — Delete a deployed function.

### Projects and Organizations

`supabase orgs list` — List organizations.
`supabase orgs create` — Create an organization.
`supabase projects list` — List projects.
`supabase projects create` — Create a project.
`supabase projects delete` — Delete a project.
`supabase projects api-keys` — Show project API keys.

### Branches

`supabase branches create` — Create a preview branch.
`supabase branches list` — List branches.
`supabase branches get` — Get branch details.
`supabase branches update` — Update branch configuration.
`supabase branches delete` — Delete a branch.
`supabase branches switch` — Switch to a branch.
`supabase branches disable` — Disable branching.

### Config

`supabase config get` — Show current project config.
`supabase config set` — Update project config.

### Secrets

`supabase secrets set` — Set secrets for edge functions.
`supabase secrets list` — List secret names (not values).
`supabase secrets unset` — Remove secrets.

### Storage (requires `--experimental`)

`supabase storage ls` — List objects in a bucket.
`supabase storage cp` — Upload or download files (max 6MB).
`supabase storage mv` — Move objects within a bucket.
`supabase storage rm` — Delete objects.

### SSO / Identity Providers

`supabase sso add` — Add an SSO identity provider.
`supabase sso list` — List identity providers.
`supabase sso show` — Show provider details.
`supabase sso update` — Update a provider.
`supabase sso remove` — Remove a provider.

### Domains

`supabase domains create` — Set up a custom domain.
`supabase domains get` — Get current domain config.
`supabase domains activate` — Activate after DNS verification.
`supabase domains reverify` — Re-verify DNS.
`supabase domains delete` — Remove custom domain.

### Vanity Subdomains (requires `--experimental`)

`supabase vanity-subdomains activate` — Activate a vanity subdomain.
`supabase vanity-subdomains get` — Get current subdomain.
`supabase vanity-subdomains check-availability` — Check availability.
`supabase vanity-subdomains delete` — Remove vanity subdomain.

### Network and Security (requires `--experimental`)

`supabase network-bans get` / `remove` — Manage IP bans.
`supabase network-restrictions get` / `update` — Manage access rules.
`supabase ssl-enforcement get` / `update` — Manage SSL enforcement.
`supabase postgres-config get` / `update` / `delete` — Manage Postgres config overrides.

### Utilities

`supabase gen types` — Generate typed definitions from database schema.
`supabase gen signing-key` — Generate a JWT signing key.
`supabase test db` — Run pgTAP tests.
`supabase test new` — Create a new test file.
`supabase snippets list` / `download` — Manage saved SQL snippets.
`supabase services` — Show versions of running services.
`supabase completion` — Generate shell autocompletion scripts.

### Inspect and Diagnostics

`supabase inspect db bloat` — Table bloat estimation.
`supabase inspect db blocking` — Queries holding locks.
`supabase inspect db calls` — Most frequently called statements.
`supabase inspect db db-stats` — General database statistics.
`supabase inspect db index-stats` — Index usage statistics.
`supabase inspect db locks` — Exclusive lock information.
`supabase inspect db long-running-queries` — Queries running over 5 minutes.
`supabase inspect db outliers` — Statements by total execution time.
`supabase inspect db replication-slots` — Replication slot status.
`supabase inspect db role-stats` — Per-role statistics.
`supabase inspect db table-stats` — Table size and scan statistics.
`supabase inspect db traffic-profile` — Read vs write distribution.
`supabase inspect db vacuum-stats` — Vacuum and dead tuple info.
`supabase inspect report` — Generate a full diagnostic report.
