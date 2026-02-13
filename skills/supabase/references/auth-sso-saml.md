---
title: Configure SAML 2.0 SSO
impact: MEDIUM
impactDescription: Enterprise SSO enables organizations to use their identity providers
tags: auth, sso, saml, enterprise, okta, azure-ad, identity-provider
---

## Configure SAML 2.0 SSO

Set up enterprise Single Sign-On with SAML 2.0 identity providers (Okta, Azure AD, Google Workspaces, etc.).

> **Prerequisite:** SAML 2.0 support is disabled by default. Stop and ask the user to enable it on the Auth Providers page in the Supabase Dashboard.

## Key SAML Information

Provide these values to your Identity Provider:

| Setting | Value |
|---------|-------|
| Entity ID | `https://<project-ref>.supabase.co/auth/v1/sso/saml/metadata` |
| ACS URL | `https://<project-ref>.supabase.co/auth/v1/sso/saml/acs` |
| Metadata URL | `https://<project-ref>.supabase.co/auth/v1/sso/saml/metadata` |
| NameID Format | `emailAddress` or `persistent` |

## Sign In with SSO

```typescript
// Sign in using domain
const { data, error } = await supabase.auth.signInWithSSO({
  domain: 'company.com',
})

if (data?.url) {
  window.location.href = data.url
}

// Or sign in using provider ID (if you have multiple IdPs for same domain)
const { data, error } = await supabase.auth.signInWithSSO({
  providerId: '21648a9d-8d5a-4555-a9d1-d6375dc14e92',
})
```

## CLI Setup

### Add SAML Provider

```bash
# From IdP metadata URL
supabase sso add \
  --type saml \
  --project-ref your-project-ref \
  --metadata-url 'https://idp.company.com/saml/metadata' \
  --domains company.com,subsidiary.com

# From metadata file
supabase sso add \
  --type saml \
  --project-ref your-project-ref \
  --metadata-file ./idp-metadata.xml \
  --domains company.com
```

### List Providers

```bash
supabase sso list --project-ref your-project-ref
```

### Update Provider

```bash
# Update domains
supabase sso update <provider-id> \
  --project-ref your-project-ref \
  --domains company.com,newdomain.com

# Update attribute mapping
supabase sso update <provider-id> \
  --project-ref your-project-ref \
  --attribute-mapping-file ./mapping.json
```

### Remove Provider

```bash
supabase sso remove <provider-id> --project-ref your-project-ref
```

## Attribute Mapping

Map IdP attributes to Supabase user fields:

```json
{
  "keys": {
    "email": {
      "name": "mail",
      "default": ""
    },
    "first_name": {
      "name": "givenName"
    },
    "last_name": {
      "name": "surname"
    },
    "department": {
      "name": "department",
      "default": "Unknown"
    }
  }
}
```

Apply mapping:

```bash
supabase sso update <provider-id> \
  --project-ref your-project-ref \
  --attribute-mapping-file ./mapping.json
```

## Common Mistakes

### 1. Wrong NameID Format

**Incorrect:**

```text
NameID Format: transient
// User gets new ID on each login - can't track users
```

**Correct:**

```text
NameID Format: emailAddress
// Or: persistent (stable identifier)
```

### 2. Not Linking SSO Users to Existing Accounts

**Issue:** SSO users are NOT automatically linked to existing accounts with the same email. They become separate users.

**Solution:** If you need to link accounts, implement a manual linking flow after SSO sign-in.

### 3. Missing Attribute Mapping

**Incorrect:**

```json
// No mapping - attributes not captured
{}
```

**Correct:**

```json
{
  "keys": {
    "email": { "name": "mail" },
    "first_name": { "name": "givenName" },
    "last_name": { "name": "sn" }
  }
}
```

### 4. Not Restricting Access by SSO Provider

**Incorrect:**

```sql
-- Any authenticated user can access
create policy "View settings" on org_settings
  using (auth.uid() is not null);
```

**Correct:**

```sql
-- Only users from specific SSO provider can access
create policy "SSO users view settings" on org_settings
  as restrictive
  using (
    (select auth.jwt() #>> '{amr,0,provider}') = 'sso-provider-id'
  );
```

> **MFA caveat:** If MFA is enabled with SSO, the `amr` array may have a different method at index `0`. Check all entries rather than only `amr[0]`.

## Provider-Specific Setup

### Okta

1. Create SAML 2.0 app in Okta Admin
2. Single Sign-On URL: `https://<ref>.supabase.co/auth/v1/sso/saml/acs`
3. Audience URI: `https://<ref>.supabase.co/auth/v1/sso/saml/metadata`
4. Download metadata and add via CLI

### Azure AD / Entra ID

1. Create Enterprise Application > Non-gallery application
2. Set up Single Sign-On > SAML
3. Basic SAML Configuration:
   - Identifier: `https://<ref>.supabase.co/auth/v1/sso/saml/metadata`
   - Reply URL: `https://<ref>.supabase.co/auth/v1/sso/saml/acs`
4. Download Federation Metadata XML

### Google Workspaces

1. Admin Console > Apps > Web and mobile apps > Add app > Add custom SAML app
2. ACS URL: `https://<ref>.supabase.co/auth/v1/sso/saml/acs`
3. Entity ID: `https://<ref>.supabase.co/auth/v1/sso/saml/metadata`
4. Download IdP metadata

## Pricing

Available on Pro plan and above. Pro and Team plans include 50 SSO MAUs before overage charges apply.

For pricing information regarding SSO MAU, fetch https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users-sso

## Related

- [oauth-providers.md](oauth-providers.md) - Social OAuth providers
- [hooks-custom-claims.md](hooks-custom-claims.md) - Add custom claims from SSO attributes
- [Docs: SAML SSO](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml)
