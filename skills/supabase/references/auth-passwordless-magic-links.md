---
title: Implement Magic Link Authentication
impact: MEDIUM-HIGH
impactDescription: Passwordless login improves UX and security - magic links are the most common approach
tags: auth, passwordless, magic-link, email, otp
---

## Implement Magic Link Authentication

Email-based passwordless authentication where users click a link to sign in.

## Quick Start

```typescript
// Send magic link
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://yourapp.com/auth/callback',
  },
})

if (!error) {
  showMessage('Check your email for the login link')
}
```

## PKCE Flow (Recommended)

For server-side apps, use PKCE with code exchange:

### Email Template (Dashboard: Auth > Email Templates > Magic Link)

```html
<h2>Login to {{ .SiteURL }}</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
```

### Server Callback Route

```typescript
// app/auth/confirm/route.ts (Next.js)
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = createServerClient(/* ... */)

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL('/auth/error', request.url))
}
```

## Prevent Auto-Signup

Only allow existing users to sign in:

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    shouldCreateUser: false, // Don't create new users
  },
})

if (error?.message.includes('Signups not allowed')) {
  showError('No account found with this email')
}
```

## Common Mistakes

### 1. Email Client Prefetching Consuming Links

**Problem:** Email security scanners and preview features click links, consuming them before users do.

**Incorrect:**

```html
<!-- Direct link in email - may be consumed by scanner -->
<a href="{{ .ConfirmationURL }}">Log In</a>
```

**Correct - Option 1: Use confirmation page**

```html
<!-- Link to confirmation page that requires user action -->
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Log In
</a>
```

Then on `/auth/confirm`, show a button that triggers verification:

```typescript
function ConfirmPage() {
  const handleConfirm = async () => {
    const params = new URLSearchParams(window.location.search)
    await supabase.auth.verifyOtp({
      token_hash: params.get('token_hash')!,
      type: 'email',
    })
  }

  return <button onClick={handleConfirm}>Confirm Login</button>
}
```

**Correct - Option 2: Use OTP codes instead**

```typescript
// Send 6-digit code instead of link
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    shouldCreateUser: false,
  },
})
```

Modify email template to show code:

```html
<p>Your login code is: <strong>{{ .Token }}</strong></p>
```

### 2. Missing Redirect URL Configuration

**Incorrect:**

```typescript
await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://myapp.com/dashboard',
  },
})
// Redirect URL not in allowlist - defaults to site URL
```

**Correct:**

1. Add URL to Dashboard: Auth > URL Configuration > Redirect URLs
2. Then use in code:

```typescript
await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://myapp.com/dashboard', // Must be in allowlist
  },
})
```

### 3. Not Handling Token Expiration

**Incorrect:**

```typescript
// User clicks old link
const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'email' })
// Error handling missing
```

**Correct:**

```typescript
const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'email' })

if (error) {
  if (error.message.includes('expired')) {
    showError('This link has expired. Please request a new one.')
    showResendButton()
  } else {
    showError('Unable to verify. Please try again.')
  }
}
```

### 4. Implicit Flow in SSR Apps

**Incorrect:**

```typescript
// Server-side - implicit flow puts tokens in URL hash
// Server can't read hash fragments
await supabase.auth.signInWithOtp({ email })
```

**Correct:**

```typescript
// Use PKCE flow with token_hash in query params
// See "PKCE Flow" section above
```

## Rate Limits

| Limit | Default |
|-------|---------|
| Per email | 1 per 60 seconds |
| Link expiry | Configurable in Dashboard |

## Customizing Email Template

Dashboard: Auth > Email Templates > Magic Link

Variables available:
- `{{ .Token }}` - 6-digit OTP code
- `{{ .TokenHash }}` - Hashed token for PKCE
- `{{ .SiteURL }}` - Your app's URL
- `{{ .ConfirmationURL }}` - Full magic link URL

## Related

- [passwordless-otp.md](passwordless-otp.md) - Email/Phone OTP codes
- [core-sessions.md](core-sessions.md) - Session management after login
- [Docs: Magic Links](https://supabase.com/docs/guides/auth/auth-email-passwordless)
