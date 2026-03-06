---
title: Getting Started with Supabase
tags: setup, init, start, install, docker, link, mcp, git, env
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
- **Node.js** >= v20 installed.

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

## Initialize Repository

If not already in a git repo, initialize one and set up `.gitignore`:

```bash
# If not already in a git repo
git init

# Generate .gitignore (ensure node_modules/, .env.local, supabase/.temp/ are present)
npx gitignore node
```

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

The local stack exposes an MCP server at `http://127.0.0.1:54321/mcp` with database and debugging tools. See [dev-local-workflow.md](dev-local-workflow.md).

Exclude unused services to speed up startup:

```bash
npx supabase start -x gotrue,imgproxy
```

## Verify

```bash
npx supabase status            # Display status table (includes MCP URL)
npx supabase status -o env     # Export credentials as environment variables
```

## Environment Setup

Create `.env.local` with values from `supabase start` output:

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key from start output>

# Framework-specific prefixes may be required:
# Next.js: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
# Vite/SvelteKit: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
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

Retrieve credentials via MCP tools:

```javascript
get_project_url({ project_id: "<project-ref>" })
get_publishable_keys({ project_id: "<project-ref>" })
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
| Local MCP connection fails | Verify stack is running with `npx supabase status`, restart with `npx supabase stop` then `npx supabase start` |
