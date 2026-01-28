---
title: Secrets and Storage - Environment Variables and File Storage
impact: HIGH
impactDescription: Manage secrets for edge functions and storage objects
tags: cli, supabase, secrets, storage, environment-variables
---

## Secrets Commands

Manage environment variables and secrets for Supabase projects. Secrets are securely stored and made available to Edge Functions as environment variables.

### `supabase secrets`

Parent command for managing secrets.

**Subcommands:** `set`, `list`, `unset`

---

### `supabase secrets set`

Set one or more secrets on the linked Supabase project.

**Usage:**

```bash
supabase secrets set <NAME=VALUE> ... [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--env-file <string>` | Optional | Read secrets from a .env file |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase secrets list`

List all secrets for the linked Supabase project. Shows secret names but not values.

**Usage:**

```bash
supabase secrets list [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase secrets unset`

Remove one or more secrets from the linked Supabase project.

**Usage:**

```bash
supabase secrets unset <NAME> ... [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

## Storage Commands

Manage Supabase Storage objects. Standard uploads are used for file transfers (not suitable for files over 6MB).

### `supabase storage`

Parent command for managing Storage objects.

**Subcommands:** `ls`, `cp`, `mv`, `rm`

---

### `supabase storage ls`

List all storage objects in a bucket or path.

**Usage:**

```bash
supabase storage ls [path] [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `-r, --recursive` | Optional | Recursively list a directory |
| `--experimental` | Required | Enable experimental features |
| `--linked` | Optional | Connect to Storage API of the linked project |
| `--local` | Optional | Connect to Storage API of the local database |

---

### `supabase storage cp`

Upload or download files to/from Supabase Storage. Use `ss:///` prefix for storage paths. Not suitable for files over 6MB.

**Usage:**

```bash
supabase storage cp <src> <dst> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--cache-control <string>` | Optional | Custom Cache-Control header for HTTP upload |
| `--content-type <string>` | Optional | Custom Content-Type header for HTTP upload |
| `-j, --jobs <uint>` | Optional | Maximum number of parallel jobs |
| `-r, --recursive` | Optional | Copy objects recursively |
| `--experimental` | Required | Enable experimental features |
| `--linked` | Optional | Connect to Storage API of the linked project |
| `--local` | Optional | Connect to Storage API of the local database |

**Example:**

```bash
# Upload a file
supabase storage cp ./local-file.png ss:///bucket-name/path/file.png

# Download a file
supabase storage cp ss:///bucket-name/path/file.png ./local-file.png
```

---

### `supabase storage mv`

Move objects within a storage bucket.

**Usage:**

```bash
supabase storage mv <src> <dst> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `-r, --recursive` | Optional | Move objects recursively |
| `--experimental` | Required | Enable experimental features |
| `--linked` | Optional | Connect to Storage API of the linked project |
| `--local` | Optional | Connect to Storage API of the local database |

---

### `supabase storage rm`

Delete objects from Supabase Storage.

**Usage:**

```bash
supabase storage rm <path> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `-r, --recursive` | Optional | Delete objects recursively |
| `--experimental` | Required | Enable experimental features |
| `--linked` | Optional | Connect to Storage API of the linked project |
| `--local` | Optional | Connect to Storage API of the local database |

Reference: [Supabase CLI - Secrets](https://supabase.com/docs/reference/cli/supabase-secrets)
