---
title: Project Management - Orgs, Projects, Branches, and Config
impact: HIGH
impactDescription: Platform management commands for organizations, projects, and branches
tags: cli, supabase, organizations, projects, branches, config
---

## Organization Commands

### `supabase orgs`

Parent command for managing organizations.

**Subcommands:** `create`, `list`

---

### `supabase orgs create`

Create a new organization for the logged-in user.

**Usage:**

```bash
supabase orgs create
```

---

### `supabase orgs list`

List all organizations the logged-in user belongs to.

**Usage:**

```bash
supabase orgs list
```

---

## Project Commands

Manage Supabase projects including creation, listing, API key retrieval, and deletion.

### `supabase projects`

Parent command for managing projects.

**Subcommands:** `create`, `list`, `api-keys`, `delete`

---

### `supabase projects create`

Create a new Supabase project.

**Usage:**

```bash
supabase projects create [project name] [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-password <string>` | Optional | Database password of the project |
| `--org-id <string>` | Optional | Organization ID to create the project in |
| `--region <string>` | Optional | Select a region close to you for the best performance |
| `--size <string>` | Optional | Select a desired instance size for your project |

---

### `supabase projects list`

List all projects the logged-in user has access to.

**Usage:**

```bash
supabase projects list
```

---

### `supabase projects api-keys`

Show the API keys for a Supabase project.

**Usage:**

```bash
supabase projects api-keys [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase projects delete`

Delete a Supabase project. This action is irreversible.

**Usage:**

```bash
supabase projects delete <ref>
```

---

## Config Commands

### `supabase config`

Parent command for managing project configurations.

**Subcommands:** `push`

---

### `supabase config push`

Push configuration from the local `supabase/config.toml` file to the linked remote project.

**Usage:**

```bash
supabase config push [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

## Branch Commands

Manage preview branches for Supabase projects. Preview branches create isolated database environments for development and testing.

### `supabase branches`

Parent command for managing preview branches.

**Subcommands:** `create`, `list`, `get`, `update`, `pause`, `unpause`, `delete`

---

### `supabase branches create`

Create a preview branch for the linked project.

**Usage:**

```bash
supabase branches create [name] [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--notify-url <string>` | Optional | URL to notify when branch is active/healthy |
| `--persistent` | Optional | Create a persistent branch |
| `--region <string>` | Optional | Region to deploy the branch database |
| `--size <string>` | Optional | Instance size for the branch database |
| `--with-data` | Optional | Clone production data to the branch database |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase branches list`

List all preview branches of the linked project.

**Usage:**

```bash
supabase branches list [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase branches get`

Show connection details for a specific preview branch.

**Usage:**

```bash
supabase branches get <branch-id> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase branches update`

Update a preview branch by its name or ID.

**Usage:**

```bash
supabase branches update [name] [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--git-branch <string>` | Optional | Change the associated git branch |
| `--name <string>` | Optional | Rename the preview branch |
| `--notify-url <string>` | Optional | URL to notify when branch is active/healthy |
| `--persistent` | Optional | Switch between ephemeral and persistent branch |
| `--status <string>` | Optional | Override the current branch status |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase branches pause`

Pause a preview branch to save resources.

**Usage:**

```bash
supabase branches pause <branch-id> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase branches unpause`

Unpause a previously paused preview branch.

**Usage:**

```bash
supabase branches unpause <branch-id> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase branches delete`

Delete a preview branch.

**Usage:**

```bash
supabase branches delete <branch-id> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

Reference: [Supabase CLI - Projects](https://supabase.com/docs/reference/cli/supabase-projects)
