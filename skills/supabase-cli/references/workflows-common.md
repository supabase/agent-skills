---
title: Common Workflows
impact: CRITICAL
impactDescription: Multi-step workflows for the most common Supabase CLI tasks
tags: cli, supabase, workflows, local-dev, migrations, functions, deploy
---

## Common Workflows

Follow these workflows for common Supabase CLI tasks. For exact flag syntax on any command, run `supabase <command> --help`. These workflows show the correct order of operations and decision points that `--help` doesn't cover.

**Incorrect (skipping link before pull):**

```bash
# This fails — you must link before pulling
supabase init
supabase db pull
```

**Correct (local development setup):**

```bash
# 1. Initialize project (creates supabase/ directory)
supabase init

# 2. Link to your remote project
supabase link --project-ref <your-project-ref>

# 3. Pull current remote schema as your first migration
supabase db pull

# 4. Start local stack (Postgres, Auth, Storage, etc.)
supabase start

# 5. Check service URLs and credentials
supabase status
```

After `start`, the local dashboard is at `http://localhost:54323`. The local API URL and anon key are printed by `status`. To stop: `supabase stop`. Add `--all` to also remove Docker images and free disk space.

### Making schema changes

There are two paths depending on where you make changes.

**Correct (Path A — SQL migration files, recommended):**

```bash
# 1. Create a new migration
supabase migration new add_profiles_table

# 2. Edit the generated file in supabase/migrations/

# 3. Apply it locally (re-runs all migrations from scratch)
supabase db reset

# 4. Push to remote when ready
supabase db push
```

**Correct (Path B — changes via local dashboard or psql):**

```bash
# 1. Make changes in local dashboard or via psql

# 2. Generate a migration from the diff
supabase db diff -f add_profiles_table

# 3. Verify by resetting
supabase db reset

# 4. Push to remote
supabase db push
```

**Correct (pulling remote changes made outside migrations):**

```bash
# Pull creates a new migration file from remote schema diff
supabase db pull

# Verify locally
supabase db reset
```

### Migration lifecycle

**Correct (full migration lifecycle):**

```bash
# Create migration
supabase migration new <name>

# List migrations and their applied/pending status
supabase migration list

# Apply pending migrations
supabase migration up

# Revert last N migrations
supabase migration down --last <N>

# Squash multiple migrations into one
supabase migration squash --version <target>

# Fix out-of-sync history (mark as applied/reverted without running SQL)
supabase migration repair <version> --status applied
supabase migration repair <version> --status reverted
```

### Edge functions

**Incorrect (deploying without setting secrets):**

```bash
supabase functions new my-function
# Edit function to use Deno.env.get("MY_KEY")
supabase functions deploy my-function
# Function fails at runtime — MY_KEY is not set on remote
```

**Correct (edge functions workflow):**

```bash
# 1. Create a new function
supabase functions new my-function

# 2. Develop locally with hot reload
supabase functions serve

# 3. Set secrets before deploying
supabase secrets set MY_KEY=value
# Or from .env file:
supabase secrets set --env-file .env

# 4. Deploy to remote project
supabase functions deploy my-function

# Deploy all functions at once
supabase functions deploy
```

### Type generation

**Correct (generating types from database):**

```bash
# From local database
supabase gen types --local --lang typescript > src/types/database.ts

# From linked remote project
supabase gen types --linked --lang typescript > src/types/database.ts

# Specific schemas only
supabase gen types --local --schema public,auth --lang typescript > src/types/database.ts
```

Supported languages: `typescript`, `go`, `swift`, `python`.

### CI/CD integration

**Correct (CI/CD pipeline):**

```bash
# Link project (use SUPABASE_ACCESS_TOKEN env var for non-interactive auth)
supabase link --project-ref <ref>

# Push migrations
supabase db push

# Deploy all functions
supabase functions deploy

# Lint database for errors (use --fail-on for CI exit codes)
supabase db lint --fail-on warning
```
