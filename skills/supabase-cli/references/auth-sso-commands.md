---
title: Authentication - SSO Identity Provider Management
impact: MEDIUM
impactDescription: Manage SSO identity providers for project authentication
tags: cli, supabase, sso, authentication, identity-provider, saml
---

## SSO Commands

Manage Single Sign-On (SSO) identity providers for your Supabase project. Supports SAML 2.0 identity providers.

### `supabase sso`

Parent command for managing SSO on your project.

**Subcommands:** `add`, `list`, `show`, `info`, `update`, `remove`

---

### `supabase sso add`

Add and configure a new connection to a SSO identity provider.

**Usage:**

```bash
supabase sso add [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--attribute-mapping-file <string>` | Optional | File containing a JSON mapping between SAML attributes to custom JWT claims |
| `--domains <strings>` | Optional | Comma-separated list of email domains to associate with the identity provider |
| `--metadata-file <string>` | Optional | File containing a SAML 2.0 Metadata XML document |
| `--metadata-url <string>` | Optional | URL pointing to a SAML 2.0 Metadata XML document |
| `--name-id-format <string>` | Optional | URI reference representing the classification of string-based identifier information |
| `--skip-url-validation` | Optional | Skip validation of the metadata URL |
| `--type <saml>` | Optional | Type of identity provider |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase sso list`

List all SSO identity providers configured for the project.

**Usage:**

```bash
supabase sso list [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase sso show`

Show detailed information for a specific SSO identity provider.

**Usage:**

```bash
supabase sso show <provider-id> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase sso info`

View your project's SSO configuration information.

**Usage:**

```bash
supabase sso info [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase sso update`

Update an existing SSO identity provider's configuration.

**Usage:**

```bash
supabase sso update <provider-id> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--attribute-mapping-file <string>` | Optional | File containing a JSON mapping between SAML attributes to custom JWT claims |
| `--domains <strings>` | Optional | Comma-separated list of email domains |
| `--metadata-file <string>` | Optional | File containing a SAML 2.0 Metadata XML document |
| `--metadata-url <string>` | Optional | URL pointing to a SAML 2.0 Metadata XML document |
| `--name-id-format <string>` | Optional | URI reference representing the classification of string-based identifier information |
| `--skip-url-validation` | Optional | Skip validation of the metadata URL |
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

---

### `supabase sso remove`

Remove an SSO identity provider from the project. Removing the provider will prevent existing users from logging in via SSO. Use with care.

**Usage:**

```bash
supabase sso remove <provider-id> [flags]
```

**Flags:**

| Flag | Required | Description |
|------|----------|-------------|
| `--project-ref <string>` | Optional | Project ref of the Supabase project |

Reference: [Supabase CLI - SSO](https://supabase.com/docs/reference/cli/supabase-sso)
