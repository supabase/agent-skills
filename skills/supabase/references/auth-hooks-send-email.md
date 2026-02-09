---
title: Customize Auth Emails with Send Hooks
impact: MEDIUM
impactDescription: Custom email hooks enable branded templates and third-party email providers
tags: auth, hooks, email, templates, sendgrid, resend, smtp
---

## Customize Auth Emails with Send Hooks

Use Send Email Hook to replace Supabase's default auth emails with your own templates and email provider.

## When to Use

- **Custom email design**: Full control over HTML templates
- **Third-party providers**: SendGrid, Resend, Mailgun, Postmark
- **Localization**: Multi-language email support
- **Audit logging**: Track email sends in your system

## Setup

### Step 1: Create Edge Function

```typescript
// supabase/functions/send-email/index.ts
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET')!

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  // Verify webhook signature
  const wh = new Webhook(HOOK_SECRET)
  let data: {
    user: { email: string; user_metadata: Record<string, any> }
    email_data: {
      token: string
      token_hash: string
      redirect_to: string
      email_action_type: string
      site_url: string
      token_new: string
      token_hash_new: string
    }
  }

  try {
    data = wh.verify(payload, headers)
  } catch (err) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { user, email_data } = data

  // Send email based on action type
  switch (email_data.email_action_type) {
    case 'signup':
      await sendSignupEmail(user.email, email_data)
      break
    case 'recovery':
      await sendPasswordResetEmail(user.email, email_data)
      break
    case 'magic_link':
      await sendMagicLinkEmail(user.email, email_data)
      break
    case 'email_change':
      await sendEmailChangeEmail(user.email, email_data)
      break
    default:
      console.log('Unknown email type:', email_data.email_action_type)
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

async function sendSignupEmail(email: string, data: any) {
  const confirmUrl = `${data.site_url}/auth/confirm?token_hash=${data.token_hash}&type=signup`

  // Using Resend as example
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Your App <noreply@yourapp.com>',
      to: email,
      subject: 'Confirm your email',
      html: `
        <h1>Welcome!</h1>
        <p>Click the link below to confirm your email:</p>
        <a href="${confirmUrl}">Confirm Email</a>
      `,
    }),
  })
}

async function sendPasswordResetEmail(email: string, data: any) {
  const resetUrl = `${data.redirect_to}?token_hash=${data.token_hash}&type=recovery`
  // Similar implementation...
}

async function sendMagicLinkEmail(email: string, data: any) {
  const loginUrl = `${data.redirect_to}?token_hash=${data.token_hash}&type=magiclink`
  // Similar implementation...
}

async function sendEmailChangeEmail(email: string, data: any) {
  // For email change, both old and new email get notifications
  // Similar implementation...
}
```

### Step 2: Deploy Function

```bash
supabase functions deploy send-email --no-verify-jwt
```

### Step 3: Set Up Hook Secret

```bash
# Generate a secret
openssl rand -base64 32

# Add to function secrets
supabase secrets set SEND_EMAIL_HOOK_SECRET=your-generated-secret
supabase secrets set RESEND_API_KEY=re_xxxxx
```

### Step 4: Enable Hook

Dashboard: Auth > Hooks > Send Email

- Enabled: Yes
- URI: `https://<project-ref>.supabase.co/functions/v1/send-email`
- HTTP Headers: Add `Authorization: Bearer <service_role_key>` if needed

CLI config (`config.toml`):

```toml
[auth.hook.send_email]
enabled = true
uri = "pg-functions://<project-ref>/functions/v1/send-email"
secrets = "v1,whsec_xxxxx"
```

## Email Action Types

| Type | Trigger |
|------|---------|
| `signup` | New user signs up with email |
| `recovery` | Password reset requested |
| `magic_link` | Magic link sign-in |
| `email_change` | User changes email address |
| `invite` | User invited to project |
| `reauthentication` | Reauthentication required |

## Common Mistakes

### 1. Not Verifying Webhook Signature

**Incorrect:**

```typescript
Deno.serve(async (req) => {
  const data = await req.json()
  // Directly using unverified data - DANGEROUS
  await sendEmail(data.user.email, data.email_data)
})
```

**Correct:**

```typescript
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

Deno.serve(async (req) => {
  const payload = await req.text()
  const wh = new Webhook(HOOK_SECRET)

  try {
    const data = wh.verify(payload, Object.fromEntries(req.headers))
    await sendEmail(data.user.email, data.email_data)
  } catch {
    return new Response('Unauthorized', { status: 401 })
  }
})
```

### 2. Not Handling Hook Failures Gracefully

**Incorrect:**

```typescript
// Function throws error - user sees generic failure
async function sendSignupEmail(email, data) {
  await fetch('https://api.resend.com/emails', { ... })
  // No error handling
}
```

**Correct:**

```typescript
async function sendSignupEmail(email: string, data: any) {
  try {
    const res = await fetch('https://api.resend.com/emails', { ... })

    if (!res.ok) {
      console.error('Email send failed:', await res.text())
      // Still return 200 to avoid blocking auth
      // Log for debugging, notify your team
      await notifyTeam('Email send failed', { email, error: await res.text() })
    }
  } catch (err) {
    console.error('Email provider error:', err)
    // Don't throw - return 200 and handle async
  }
}
```

### 3. Hardcoding URLs

**Incorrect:**

```typescript
const confirmUrl = `https://myapp.com/auth/confirm?token_hash=${data.token_hash}`
// Breaks in staging/development
```

**Correct:**

```typescript
// Use site_url from the hook data
const confirmUrl = `${data.site_url}/auth/confirm?token_hash=${data.token_hash}&type=signup`

// Or use redirect_to if provided
const resetUrl = `${data.redirect_to || data.site_url}/reset-password?token_hash=${data.token_hash}`
```

### 4. Missing Email Types

**Incorrect:**

```typescript
// Only handles signup
if (email_data.email_action_type === 'signup') {
  await sendSignupEmail(user.email, email_data)
}
// All other email types silently fail
```

**Correct:**

```typescript
switch (email_data.email_action_type) {
  case 'signup':
    await sendSignupEmail(user.email, email_data)
    break
  case 'recovery':
    await sendPasswordResetEmail(user.email, email_data)
    break
  case 'magic_link':
    await sendMagicLinkEmail(user.email, email_data)
    break
  case 'email_change':
    await sendEmailChangeEmail(user.email, email_data)
    break
  default:
    // Log unknown types for debugging
    console.warn('Unhandled email type:', email_data.email_action_type)
    // Consider falling back to a generic template
}
```

## Using Different Email Providers

### SendGrid

```typescript
await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email }] }],
    from: { email: 'noreply@yourapp.com' },
    subject: 'Subject',
    content: [{ type: 'text/html', value: htmlContent }],
  }),
})
```

### Mailgun

```typescript
const form = new FormData()
form.append('from', 'Your App <noreply@yourapp.com>')
form.append('to', email)
form.append('subject', 'Subject')
form.append('html', htmlContent)

await fetch(`https://api.mailgun.net/v3/${DOMAIN}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
  },
  body: form,
})
```

## Related

- [hooks-custom-claims.md](hooks-custom-claims.md) - Custom JWT claims hook
- [core-signup.md](core-signup.md) - Sign-up flow
- [Docs: Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
