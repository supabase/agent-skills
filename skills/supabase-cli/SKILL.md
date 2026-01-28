---
name: supabase-cli
description: Supabase CLI command reference and usage guide. Use this skill when running Supabase CLI commands, managing local development environments, deploying to Supabase projects, working with database migrations, edge functions, branches, secrets, storage, SSO, custom domains, network configuration, or any other Supabase CLI operation.
license: MIT
metadata:
  author: supabase
  version: "2.0.0"
  organization: Supabase
  date: January 2026
  abstract: Supabase CLI skill focused on workflows, decision guidance, and common pitfalls. Covers local development, database management, migrations, edge functions, secrets, storage, authentication, custom domains, network configuration, and project management.
---

# Supabase CLI Reference

Practical guide for using the Supabase CLI. Focuses on workflows, decision-making, and gotchas rather than exhaustive flag listings.

## Important: Use `--help` for Flag Details

For exact flag syntax on any command, run:

```bash
supabase <command> --help
```

The CLI's built-in help is always up to date. This skill focuses on what `--help` can't tell you: when to use which commands, common workflows, and pitfalls to avoid.

## Installation

```bash
# npm
npm install supabase --save-dev

# Homebrew
brew install supabase/tap/supabase

# Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Global Flags

Every command supports these flags:

| Flag | Description |
|------|-------------|
| `--debug` | Output debug logs to stderr |
| `--experimental` | Enable experimental features |
| `-h, --help` | Help for the command |
| `-o, --output <env\|pretty\|json\|toml\|yaml>` | Output format |
| `--workdir <string>` | Path to a Supabase project directory |

## Quick Reference

### Local Development

```bash
supabase init                  # Initialize a new project
supabase start                 # Start local containers
supabase status                # Check running services
supabase stop                  # Stop all containers
```

### Database & Migrations

```bash
supabase db diff -f <name>     # Generate migration from local changes
supabase migration new <name>  # Create empty migration file
supabase db reset              # Reset local database
supabase db push               # Push migrations to remote
supabase db pull               # Pull remote schema changes
```

### Edge Functions

```bash
supabase functions new <name>  # Create a new function
supabase functions serve       # Serve locally for testing
supabase functions deploy      # Deploy to remote project
```

### Project Setup

```bash
supabase login                 # Authenticate with Supabase
supabase link --project-ref <ref>  # Link to remote project
supabase projects list         # List all projects
```

## How to Use This Skill

Read the reference files for guidance beyond what `--help` provides:

- `references/workflows-common.md` — Multi-step workflows for common tasks
- `references/decision-guide.md` — When to use which command or flag
- `references/gotchas-pitfalls.md` — Common pitfalls and edge cases
- `references/commands-overview.md` — Light listing of all available commands

## References

- https://supabase.com/docs/reference/cli/introduction
- https://supabase.com/docs/guides/local-development
- https://supabase.com/docs/guides/cli/getting-started
