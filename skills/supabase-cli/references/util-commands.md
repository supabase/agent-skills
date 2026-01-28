---
title: Utilities - Type Generation, Testing, Services, and Completion
impact: LOW
impactDescription: Supporting utilities for type generation, testing, service info, and shell autocompletion
tags: cli, supabase, types, testing, pgtap, completion, services, jwt
---

## Type Generation Commands

Generate type definitions and keys for your Supabase project.

### `supabase gen`

Parent command for code generation tools.

**Subcommands:** `signing-key`, `types`

---

### `supabase gen signing-key`

Securely generate a private JWT signing key.

**Usage:**

```bash
supabase gen signing-key
```

---

### `supabase gen types`

Generate type definitions from your Postgres database schema. Connects to your database (local or remote) and generates typed definitions matching your tables, views, and stored procedures.

**Usage:**

```bash
supabase gen types [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | Generate types from a database URL |
| `--lang <typescript\|go\|swift\|python>` | Optional | Output language of the generated types |
| `--linked` | Optional | Generate types from the linked project |
| `--local` | Optional | Generate types from the local dev database |
| `--postgrest-v9-compat` | Optional | Generate types compatible with PostgREST v9 and below |
| `--project-id <string>` | Optional | Generate types from a project ID |
| `--query-timeout <duration>` | Optional | Maximum timeout allowed for the database query |
| `-s, --schema <strings>` | Optional | Comma-separated list of schemas to include |
| `--swift-access-control <internal\|public>` | Optional | Access control for Swift generated types |

**Example:**

```bash
# Generate TypeScript types from local database
supabase gen types --local --lang typescript > src/types/database.ts

# Generate types for specific schemas
supabase gen types --linked --schema public,auth > src/types/database.ts
```

---

## Testing Commands

Run tests against your Supabase database using pgTAP, the Postgres testing framework.

### `supabase test`

Parent command for running tests.

**Subcommands:** `db`, `new`

---

### `supabase test db`

Execute pgTAP tests against the local or linked database. Requires the local development stack to be running when testing against the local database.

**Usage:**

```bash
supabase test db [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-url <string>` | Optional | Test against the specified database URL |
| `--linked` | Optional | Test against the linked project |
| `--local` | Optional | Test against the local database |

---

### `supabase test new`

Create a new test file from a template.

**Usage:**

```bash
supabase test new <name> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `-t, --template <pgtap>` | Optional | Template framework to generate |

---

## SQL Snippets Commands

Manage saved SQL snippets from the Supabase Dashboard.

### `supabase snippets`

Parent command for managing SQL snippets.

**Subcommands:** `list`, `download`

---

### `supabase snippets list`

List all SQL snippets saved in the Supabase Dashboard for the project.

**Usage:**

```bash
supabase snippets list [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase snippets download`

Download SQL snippet content from the Supabase Dashboard.

**Usage:**

```bash
supabase snippets download <snippet-id> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

## Services Command

### `supabase services`

Show versions of all running Supabase services.

**Usage:**

```bash
supabase services
```

---

## Autocompletion Commands

Generate shell autocompletion scripts for the Supabase CLI.

### `supabase completion`

Parent command for generating autocompletion scripts.

**Subcommands:** `zsh`, `powershell`, `fish`, `bash`

---

### `supabase completion zsh`

Generate the autocompletion script for zsh.

```bash
# Enable shell completion
echo "autoload -U compinit; compinit" >> ~/.zshrc

# Load for current session
source <(supabase completion zsh)

# Load for every session (Linux)
supabase completion zsh > "${fpath[1]}/_supabase"

# Load for every session (macOS via Homebrew)
supabase completion zsh > $(brew --prefix)/share/zsh/site-functions/_supabase
```

---

### `supabase completion powershell`

Generate the autocompletion script for PowerShell.

```powershell
supabase completion powershell | Out-String | Invoke-Expression
```

---

### `supabase completion fish`

Generate the autocompletion script for fish.

```fish
# Load for current session
supabase completion fish | source

# Load for every session
supabase completion fish > ~/.config/fish/completions/supabase.fish
```

---

### `supabase completion bash`

Generate the autocompletion script for bash. Requires `bash-completion` package.

```bash
# Load for current session
source <(supabase completion bash)

# Load for every session (Linux)
supabase completion bash > /etc/bash_completion.d/supabase

# Load for every session (macOS via Homebrew)
supabase completion bash > $(brew --prefix)/etc/bash_completion.d/supabase
```

Reference: [Supabase CLI - Utilities](https://supabase.com/docs/reference/cli/supabase-gen)
