---
name: supabase-cli
description: Supabase CLI command reference and usage guide. Use this skill when running Supabase CLI commands, managing local development environments, deploying to Supabase projects, working with database migrations, edge functions, branches, secrets, storage, SSO, custom domains, network configuration, or any other Supabase CLI operation.
license: MIT
metadata:
  author: supabase
  version: "1.0.0"
  organization: Supabase
  date: January 2026
  abstract: Complete Supabase CLI reference covering all commands across 20+ categories including local development, database management, migrations, edge functions, secrets, storage, authentication, custom domains, network configuration, and project management. Each command includes usage syntax, flags, descriptions, and examples to guide automated CLI operations and code generation.
---

# Supabase CLI Reference

Complete command reference for the Supabase CLI, which provides tools to develop your project locally and deploy to the Supabase Platform.

## When to Apply

Reference these commands when:
- Setting up or managing a local Supabase development environment
- Running database migrations or schema changes
- Deploying edge functions or managing secrets
- Managing Supabase projects, organizations, or branches
- Working with storage objects or authentication (SSO)
- Configuring custom domains, network restrictions, or SSL enforcement
- Generating TypeScript/Go/Swift types from database schemas
- Running database inspections or diagnostics
- Seeding databases or managing test data

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
| `--create-ticket` | Create a support ticket for any CLI error |
| `--debug` | Output debug logs to stderr |
| `--dns-resolver <native\|https>` | Lookup domain names using the specified resolver |
| `--experimental` | Enable experimental features |
| `-h, --help` | Help for supabase |
| `--network-id <string>` | Use the specified docker network instead of a generated one |
| `-o, --output <env\|pretty\|json\|toml\|yaml>` | Output format of status variables |
| `--profile <string>` | Use a specific profile for connecting to Supabase API |
| `--workdir <string>` | Path to a Supabase project directory |
| `--yes` | Answer yes to all prompts |

## Command Categories by Priority

| Priority | Category | Use Case | Prefix |
|----------|----------|----------|--------|
| 1 | General | Project setup, auth, local dev | `general-` |
| 2 | Database | Schema management, migrations | `db-` |
| 3 | Edge Functions | Serverless function management | `functions-` |
| 4 | Project Management | Orgs, projects, branches, config | `project-` |
| 5 | Secrets & Storage | Environment vars, file storage | `secrets-` |
| 6 | Authentication | SSO identity providers | `auth-` |
| 7 | Domain & Network | Custom domains, network config | `network-` |
| 8 | Inspect & Diagnostics | Database statistics, monitoring | `inspect-` |
| 9 | Utilities | Type generation, testing, completion | `util-` |

## Quick Reference

### Local Development Workflow

```bash
supabase init                  # Initialize a new project
supabase start                 # Start local containers
supabase status                # Check running services
supabase stop                  # Stop all containers
```

### Database Workflow

```bash
supabase db diff               # Diff local schema changes
supabase migration new <name>  # Create a new migration
supabase db reset              # Reset local database
supabase db push               # Push migrations to remote
supabase db pull               # Pull remote schema changes
```

### Edge Functions Workflow

```bash
supabase functions new <name>  # Create a new function
supabase functions serve       # Serve locally for testing
supabase functions deploy      # Deploy to remote project
```

### Project Management Workflow

```bash
supabase login                 # Authenticate with Supabase
supabase link --project-ref <ref>  # Link to remote project
supabase projects list         # List all projects
```

## How to Use

Read individual reference files for detailed command syntax and flags:

```
references/general-commands.md
references/db-commands.md
references/db-migrations.md
references/functions-commands.md
references/project-management.md
references/secrets-commands.md
references/auth-sso-commands.md
references/network-domain-commands.md
references/inspect-commands.md
references/util-commands.md
references/_sections.md
```

Each reference file contains:
- Full command syntax with all flags
- Flag types and descriptions (required vs optional)
- Usage examples where available
- Subcommand listings for command groups

## References

- https://supabase.com/docs/reference/cli/introduction
- https://supabase.com/docs/guides/local-development
- https://supabase.com/docs/guides/cli/getting-started
