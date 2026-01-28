---
title: General Commands - Project Setup, Auth, and Local Development
impact: CRITICAL
impactDescription: Core workflow commands used in every Supabase project
tags: cli, supabase, init, login, link, start, stop, status, bootstrap
---

## General Commands

Core commands for initializing projects, authenticating, linking to remote projects, and managing the local development environment.

### `supabase bootstrap`

Launch a quick start template to bootstrap a new Supabase project.

**Usage:**

```bash
supabase bootstrap [template] [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `-p, --password <string>` | Optional | Password to your remote Postgres database |

---

### `supabase init`

Initialize configurations for Supabase local development. Creates a `supabase/config.toml` file in your current working directory. You may override the directory path with the `SUPABASE_WORKDIR` environment variable or `--workdir` flag.

**Usage:**

```bash
supabase init [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--force` | Optional | Overwrite existing `supabase/config.toml` |
| `-i, --interactive` | Optional | Enable interactive mode to configure IDE settings |
| `--use-orioledb` | Optional | Use OrioleDB storage engine for Postgres |

---

### `supabase login`

Connect the Supabase CLI to your Supabase account by logging in with your personal access token. The token is stored in native credentials storage. For CI environments, use the `SUPABASE_ACCESS_TOKEN` environment variable instead.

**Usage:**

```bash
supabase login [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--name <string>` | Optional | Name that will be used to store token in your settings |
| `--no-browser` | Optional | Do not open browser automatically |
| `--token <string>` | Optional | Use provided token instead of automatic login flow |

---

### `supabase link`

Link the local project to a remote Supabase project. Required before running commands that interact with the remote database (like `db push`, `db pull`).

**Usage:**

```bash
supabase link [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `-p, --password <string>` | Optional | Password to your Supabase project |
| `--project-ref <string>` | Required | Project ref of the Supabase project |

---

### `supabase start`

Start the Supabase local development stack. Requires `supabase/config.toml` to exist (run `supabase init` first). All service containers are started by default. Recommended at least 7GB of RAM to start all services.

**Usage:**

```bash
supabase start [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `-x, --exclude <strings>` | Optional | Names of containers to not start (e.g., `gotrue,imgproxy`) |
| `--ignore-health-check` | Optional | Ignore unhealthy services and exit 0 |

---

### `supabase stop`

Stop the Supabase local development stack. All Docker resources are maintained across restarts. Use `--no-backup` to reset your local development data between restarts.

**Usage:**

```bash
supabase stop [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--all` | Optional | Stop all local Supabase instances from all projects across the machine |
| `--no-backup` | Optional | Delete all data volumes after stopping |
| `--project-id <string>` | Optional | Local project ID to stop |

---

### `supabase status`

Show status of the Supabase local development stack. Use `-o env` to export connection parameters for initializing supabase-js locally.

**Usage:**

```bash
supabase status [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--override-name <strings>` | Optional | Override specific variable names |

Reference: [Supabase CLI - General](https://supabase.com/docs/reference/cli/introduction)
