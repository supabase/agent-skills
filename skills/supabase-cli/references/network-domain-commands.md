---
title: Domain and Network Configuration
impact: MEDIUM
impactDescription: Custom domains, vanity subdomains, network bans, restrictions, SSL, and Postgres config
tags: cli, supabase, domains, vanity-subdomains, network-bans, network-restrictions, ssl, postgres-config
---

## Custom Domain Commands

Manage custom domain names for Supabase projects. Custom domains and vanity subdomains are mutually exclusive.

### `supabase domains`

Parent command for managing custom domains.

**Subcommands:** `activate`, `create`, `get`, `reverify`, `delete`

---

### `supabase domains activate`

Activate a custom hostname for the project. Run after DNS verification is complete.

**Usage:**

```bash
supabase domains activate [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--include-raw-output` | Optional | Include raw API output |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase domains create`

Create a custom hostname for the project. After creation, configure DNS records and verify.

**Usage:**

```bash
supabase domains create [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--custom-hostname <string>` | Optional | The custom hostname to use for your Supabase project |
| `--include-raw-output` | Optional | Include raw API output |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase domains get`

Retrieve the current custom hostname configuration for the project.

**Usage:**

```bash
supabase domains get [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--include-raw-output` | Optional | Include raw API output |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase domains reverify`

Re-verify the custom hostname DNS configuration.

**Usage:**

```bash
supabase domains reverify [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--include-raw-output` | Optional | Include raw API output |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase domains delete`

Delete the custom hostname configuration for the project.

**Usage:**

```bash
supabase domains delete [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--include-raw-output` | Optional | Include raw API output |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

## Vanity Subdomain Commands

Manage vanity subdomains (e.g., `your-name.supabase.co`) for Supabase projects. Mutually exclusive with custom domains.

### `supabase vanity-subdomains`

Parent command for managing vanity subdomains.

**Subcommands:** `activate`, `get`, `check-availability`, `delete`

---

### `supabase vanity-subdomains activate`

Activate a vanity subdomain for the project.

**Usage:**

```bash
supabase vanity-subdomains activate [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--desired-subdomain <string>` | Optional | The desired vanity subdomain to use for your Supabase project |
| `--experimental` | Required | Enable experimental features |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase vanity-subdomains get`

Retrieve the current vanity subdomain for the project.

**Usage:**

```bash
supabase vanity-subdomains get [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--experimental` | Required | Enable experimental features |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase vanity-subdomains check-availability`

Check if a vanity subdomain is available.

**Usage:**

```bash
supabase vanity-subdomains check-availability [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--desired-subdomain <string>` | Optional | The desired vanity subdomain to use for your Supabase project |
| `--experimental` | Required | Enable experimental features |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase vanity-subdomains delete`

Delete the vanity subdomain for the project.

**Usage:**

```bash
supabase vanity-subdomains delete [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--experimental` | Required | Enable experimental features |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

## Network Bans Commands

Manage IP-based network bans for database connections.

### `supabase network-bans`

Parent command for managing network bans.

**Subcommands:** `get`, `remove`

---

### `supabase network-bans get`

Retrieve current network bans for the project.

**Usage:**

```bash
supabase network-bans get [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--experimental` | Required | Enable experimental features |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase network-bans remove`

Remove a network ban to re-allow database connections from a specific IP.

**Usage:**

```bash
supabase network-bans remove [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--db-unban-ip <strings>` | Optional | IP address(es) to unban |
| `--experimental` | Required | Enable experimental features |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

## Network Restrictions Commands

Manage IP-based network restrictions for database access control.

### `supabase network-restrictions`

Parent command for managing network restrictions.

**Subcommands:** `get`, `update`

---

### `supabase network-restrictions get`

Retrieve current network restrictions for the project.

**Usage:**

```bash
supabase network-restrictions get [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--experimental` | Required | Enable experimental features |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase network-restrictions update`

Update network restrictions for the project.

**Usage:**

```bash
supabase network-restrictions update [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--append` | Optional | Append to existing restrictions instead of replacing them |
| `--bypass-cidr-checks` | Optional | Bypass some of the CIDR validation checks |
| `--db-allow-cidr <strings>` | Optional | CIDR to allow DB connections from |
| `--experimental` | Required | Enable experimental features |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

## SSL Enforcement Commands

Manage SSL enforcement for database connections.

### `supabase ssl-enforcement`

Parent command for managing SSL enforcement configurations.

**Subcommands:** `get`, `update`

---

### `supabase ssl-enforcement get`

Retrieve the current SSL enforcement configuration.

**Usage:**

```bash
supabase ssl-enforcement get [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--experimental` | Required | Enable experimental features |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase ssl-enforcement update`

Update SSL enforcement configuration for database connections.

**Usage:**

```bash
supabase ssl-enforcement update [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--disable-db-ssl-enforcement` | Optional | Disable SSL enforcement |
| `--enable-db-ssl-enforcement` | Optional | Enable SSL enforcement |
| `--experimental` | Required | Enable experimental features |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

## Postgres Config Commands

Manage Postgres configuration overrides. Overriding default config may result in unstable database behavior.

### `supabase postgres-config`

Parent command for managing Postgres configurations.

**Subcommands:** `get`, `update`, `delete`

---

### `supabase postgres-config get`

Retrieve the current Postgres config overrides.

**Usage:**

```bash
supabase postgres-config get [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--experimental` | Required | Enable experimental features |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase postgres-config update`

Update Postgres configuration overrides. Custom configuration overrides optimizations generated based on compute add-ons.

**Usage:**

```bash
supabase postgres-config update [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--config <strings>` | Optional | Config overrides as `key=value` pairs |
| `--no-restart` | Optional | Do not restart the database after updating |
| `--replace-existing-overrides` | Optional | Replace all existing overrides (default: merge) |
| `--experimental` | Required | Enable experimental features |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase postgres-config delete`

Delete specific Postgres config overrides, reverting them to default values.

**Usage:**

```bash
supabase postgres-config delete [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--config <strings>` | Optional | Config keys to delete |
| `--no-restart` | Optional | Do not restart the database after deleting |
| `--experimental` | Required | Enable experimental features |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

Reference: [Supabase CLI - Domains](https://supabase.com/docs/reference/cli/supabase-domains)
