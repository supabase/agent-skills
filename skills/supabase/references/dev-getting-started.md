---
title: Getting Started with Supabase
impact: CRITICAL
impactDescription: Required setup for any new Supabase project — blocks all other development
tags: setup, init, start, install, docker, link
---

## Getting Started with Supabase

Set up a new Supabase project with the CLI, start the local stack, and optionally link to a hosted project.

**Incorrect:**

```bash
# Starting without initialization
npx supabase start  # Error: no config.toml found
```

**Correct:**

```bash
# Initialize first, then start
npx supabase init --yes
npx supabase start
```

## Prerequisites

- **Docker Desktop** installed and running (`docker version` to verify). Required for `supabase start`.
- **Node.js** installed.

## Install the CLI

Detect the package manager from the project's lockfile (or ask the user). Install `supabase` as a devDependency.

```bash
npm install supabase --save-dev
# or: pnpm add -D supabase
# or: yarn add -D supabase
# or: bun add -D supabase
```

**pnpm caveat:** Add `supabase` to `onlyBuiltDependencies` in `package.json` so the binary is compiled:

```json
{
  "pnpm": {
    "onlyBuiltDependencies": ["supabase"]
  }
}
```

All CLI commands use the `npx` prefix (e.g., `npx supabase start`).

## Initialize Project

```bash
npx supabase init --yes
```

Creates:

```text
supabase/
├── config.toml      # Project configuration
├── migrations/      # SQL migration files
├── functions/       # Edge Functions
└── seed.sql         # Database seed data
```

## Start Local Stack

```bash
npx supabase start
```

Requires Docker running with 7GB+ RAM. Outputs:

- API URL, DB URL, Studio URL
- `anon` key, `service_role` key

Exclude unused services to speed up startup:

```bash
npx supabase start -x gotrue,imgproxy
```

## Verify

```bash
npx supabase status            # Display status table
npx supabase status -o env     # Export as environment variables
```

## Environment Setup

Create `.env.local` with values from `supabase start` output:

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key from start output>
```

## Link to Hosted Project (Optional)

```bash
npx supabase login                          # Opens browser for OAuth
npx supabase link --project-ref <project-id>
```

Find the project ID from the Dashboard URL (`https://supabase.com/dashboard/project/<project-id>`) or:

```bash
npx supabase projects list
```

Verify the link:

```bash
npx supabase projects list
```

**CI/CD:** Set `SUPABASE_ACCESS_TOKEN` environment variable instead of `supabase login`.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Port conflicts on start | `npx supabase stop --all` then retry |
| Docker not running | Start Docker Desktop, verify with `docker version` |
| CLI not found after install | Use `npx supabase` or check `node_modules/.bin` |
| `link` fails | Ensure `supabase login` succeeded. `link` does not require Docker. |
| `pull`/`diff` fail after link | These commands need Docker — start Docker first |
