---
title: Edge Functions - Serverless Function Management
impact: HIGH
impactDescription: Full lifecycle management for Supabase edge functions
tags: cli, supabase, edge-functions, deno, deploy, serve
---

## Edge Functions Commands

Manage Supabase Edge Functions (TypeScript functions running on Deno-compatible edge runtime). Edge Functions allow custom server-side code without deploying or scaling a traditional server.

### `supabase functions`

Parent command for managing edge functions.

**Subcommands:** `new`, `list`, `download`, `serve`, `deploy`, `delete`

---

### `supabase functions new`

Create a new Edge Function with boilerplate code in the `supabase/functions/` directory.

**Usage:**

```bash
supabase functions new <function-name>
```

---

### `supabase functions list`

List all edge functions deployed to the linked Supabase project.

**Usage:**

```bash
supabase functions list [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase functions download`

Download the source code of an edge function from the linked project.

**Usage:**

```bash
supabase functions download <function-name> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase functions serve`

Serve all edge functions locally. Supports debugging via the V8 inspector protocol (Chrome DevTools, VS Code, IntelliJ IDEA).

**Usage:**

```bash
supabase functions serve [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--env-file <string>` | Optional | Path to an env file to be populated to the Function environment |
| `--import-map <string>` | Optional | Path to import map file |
| `--inspect` | Optional | Alias of `--inspect-mode brk` |
| `--inspect-main` | Optional | Allow inspecting the main worker |
| `--inspect-mode <run\|brk\|wait>` | Optional | Activate inspector. `run`: connect without pausing; `brk`: pause at first line; `wait`: pause until inspector connects |
| `--no-verify-jwt` | Optional | Disable JWT verification for the Function |

---

### `supabase functions deploy`

Deploy a Function to the linked Supabase project. Deploys the specified function, or all functions if no name is given.

**Usage:**

```bash
supabase functions deploy [function-name] [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--import-map <string>` | Optional | Path to import map file |
| `-j, --jobs <uint>` | Optional | Maximum number of parallel jobs |
| `--no-verify-jwt` | Optional | Disable JWT verification for the Function |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |
| `--prune` | Optional | Delete Functions that exist in Supabase project but not locally |
| `--use-api` | Optional | Bundle functions server-side without using Docker |

---

### `supabase functions delete`

Delete an edge function from the linked Supabase project.

**Usage:**

```bash
supabase functions delete <function-name> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

Reference: [Supabase CLI - Edge Functions](https://supabase.com/docs/reference/cli/supabase-functions)
