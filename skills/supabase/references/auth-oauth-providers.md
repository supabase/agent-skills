---
title: Configure OAuth Social Providers
impact: HIGH
impactDescription: Social login increases conversion - misconfiguration breaks authentication
tags: auth, oauth, social-login, google, github, apple, azure
---

## Configure OAuth Social Providers

Set up social authentication with Google, GitHub, Apple, and other providers.

## Quick Start

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://yourapp.com/auth/callback',
  },
})

// Redirects to Google, then back to your callback URL
```

## Supported Providers

| Provider | Key Notes |
|----------|-----------|
| Google | Most common, requires OAuth consent screen |
| GitHub | Great for developer apps |
| Apple | Required for iOS apps with social login |
| Azure/Microsoft | Enterprise, supports Entra ID |
| Discord | Gaming/community apps |
| Slack | Workspace apps |
| Twitter/X | Social apps |
| LinkedIn | Professional apps |
| Facebook | Social apps |
| Spotify | Music apps |
| Twitch | Streaming apps |

## Setup Steps (All Providers)

1. **Enable provider** in Dashboard: Auth > Providers
2. **Create OAuth app** at provider's developer console
3. **Set callback URL** on provider: `https://<project-ref>.supabase.co/auth/v1/callback`
4. **Add Client ID and Secret** to Supabase Dashboard

## Provider-Specific Configuration

### Google

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'email profile',
    queryParams: {
      access_type: 'offline',        // Get refresh token
      prompt: 'consent',             // Force consent screen
    },
  },
})
```

**Google Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URI: `https://<ref>.supabase.co/auth/v1/callback`
4. Configure OAuth consent screen

### GitHub

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    scopes: 'read:user user:email',
  },
})
```

**GitHub Setup:**
1. Go to GitHub Settings > Developer Settings > OAuth Apps
2. Create new OAuth App
3. Set callback URL: `https://<ref>.supabase.co/auth/v1/callback`

### Apple

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'apple',
  options: {
    scopes: 'name email',
  },
})
```

**Apple Setup:**
1. Requires Apple Developer Program membership
2. Create App ID with "Sign in with Apple" capability
3. Create Service ID for web authentication
4. Generate private key for token signing

**Important:** Apple only returns user's name on first sign-in. Store it immediately.

### Azure/Microsoft

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'azure',
  options: {
    scopes: 'email profile openid',
  },
})
```

## Common Mistakes

### 1. Wrong Callback URL

**Incorrect:**

```text
// In provider settings
https://yourapp.com/auth/callback
```

**Correct:**

```text
// Provider callback must be Supabase's callback endpoint
https://<project-ref>.supabase.co/auth/v1/callback
```

```typescript
// Your app's callback is set in redirectTo option
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://yourapp.com/auth/callback', // Your app
  },
})
```

### 2. Missing Redirect URL in Allowlist

**Incorrect:**

```typescript
// redirectTo not in Supabase allowlist - fails silently
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://localhost:3000/auth/callback',
  },
})
```

**Correct:**

1. Add `http://localhost:3000/auth/callback` to Dashboard: Auth > URL Configuration > Redirect URLs
2. Then use in code

### 3. Not Handling OAuth Callback

**Incorrect:**

```typescript
// /auth/callback page - no code handling
function CallbackPage() {
  return <div>Loading...</div>
}
```

**Correct:**

```typescript
// /auth/callback page
import { useEffect } from 'react'
import { useRouter } from 'next/router'

function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Supabase client auto-handles the hash fragment
    // Just wait for session to be established
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard')
      }
    })
  }, [])

  return <div>Completing sign in...</div>
}
```

### 4. Not Requesting Email Scope

**Incorrect:**

```typescript
// GitHub doesn't return email by default
await supabase.auth.signInWithOAuth({ provider: 'github' })
// user.email may be null
```

**Correct:**

```typescript
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    scopes: 'read:user user:email', // Explicitly request email
  },
})
```

## Access Provider Tokens

```typescript
// After OAuth sign-in, get the provider's access token
const { data, error } = await supabase.auth.getSession()

const providerToken = data.session?.provider_token     // Access token
const providerRefreshToken = data.session?.provider_refresh_token
```

## Link Multiple Providers

```typescript
// User already signed in with email/password
// Link their Google account
const { data, error } = await supabase.auth.linkIdentity({
  provider: 'google',
})
```

## Related

- [oauth-pkce.md](oauth-pkce.md) - PKCE flow for SPAs
- [Docs: Social Login](https://supabase.com/docs/guides/auth/social-login)
- [Docs: Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
