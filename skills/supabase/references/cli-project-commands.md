---
title: CLI Project Commands
impact: CRITICAL
impactDescription: Essential commands for project setup, local development, and remote connection
tags: cli, project, init, start, stop, link, login
---

## CLI Project Commands

Commands for initializing projects, managing local development stack, and connecting to remote projects.

**Incorrect:**

```bash
# Starting without initialization
supabase start  # Error: no config.toml found
```

**Correct:**

```bash
supabase init      # Initialize project first
supabase start     # Then start local stack
```

---

## supabase init

Initialize Supabase configuration in current directory.

```bash
supabase init           # Interactive setup
supabase init --yes     # Non-interactive, use defaults
```

**Flags:** `--workdir` (override folder path), `--yes` (skip prompts)

**Creates:**
```text
supabase/
├── config.toml      # Project configuration
├── migrations/      # SQL migration files
├── functions/       # Edge Functions
└── seed.sql         # Database seed data
```

---

## supabase start

Start local Supabase stack using Docker.

```bash
supabase start                      # Start all services
supabase start -x gotrue,imgproxy   # Exclude specific services
```

**Flags:** `-x, --exclude` (exclude services), `--ignore-health-check`, `--network-id`

**Output:** API URL, DB URL, Studio URL, anon key, service_role key

**Prerequisites:** Docker running, 7GB+ RAM, `supabase init` completed

---

## supabase stop

Stop local Supabase stack.

```bash
supabase stop               # Stop, preserve data
supabase stop --no-backup   # Stop, delete all data
supabase stop --all         # Stop all Supabase projects
```

**Flags:** `--no-backup` (delete data), `--all` (stop all projects)

**Use `--no-backup`:** Before CLI upgrades to avoid stale container issues.

---

## supabase status

Show status of local services and connection credentials.

```bash
supabase status          # Display status table
supabase status -o env   # Export as environment variables
```

**Flags:** `-o env` (output as env vars)

---

## supabase link

Link local project to hosted Supabase project. Required for remote operations.

```bash
supabase link --project-ref <project-id>
```

**Flags:** `--project-ref` (required), `--skip-pooler`

**Required for:** `db push`, `db pull`, `migration fetch`, `gen types --linked`

**Find project ID:** Dashboard URL or `supabase projects list`

---

## supabase login

Authenticate CLI with Supabase account.

```bash
supabase login  # Opens browser for OAuth
```

**CI/CD:** Set `SUPABASE_ACCESS_TOKEN` environment variable instead.

```bash
export SUPABASE_ACCESS_TOKEN=sbp_xxx
# No login needed
```

## Related

- [database-commands.md](database-commands.md) - Database operations
- [migration-commands.md](migration-commands.md) - Migration management
