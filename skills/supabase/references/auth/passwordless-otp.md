---
title: Implement Email and Phone OTP
impact: MEDIUM-HIGH
impactDescription: OTP codes avoid link prefetching issues and work better for mobile apps
tags: auth, passwordless, otp, email, phone, sms
---

## Implement Email and Phone OTP

One-time password authentication via email or SMS. Better than magic links when link prefetching is an issue or for mobile apps.

## Email OTP

### Step 1: Send OTP

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    shouldCreateUser: true, // or false to only allow existing users
  },
})

if (!error) {
  showMessage('Check your email for the verification code')
}
```

### Step 2: Verify OTP

```typescript
const { data, error } = await supabase.auth.verifyOtp({
  email: 'user@example.com',
  token: '123456', // 6-digit code from email
  type: 'email',
})

if (!error) {
  // User is now signed in
  console.log('Signed in:', data.user)
}
```

### Configure Email Template

Dashboard: Auth > Email Templates > Magic Link

Include `{{ .Token }}` to show the OTP code:

```html
<h2>Your verification code</h2>
<p>Enter this code to sign in:</p>
<p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">
  {{ .Token }}
</p>
<p>This code expires in 1 hour.</p>
```

## Phone OTP

### Step 1: Send OTP

```typescript
const { error } = await supabase.auth.signInWithOtp({
  phone: '+1234567890',
})

if (!error) {
  showMessage('Check your phone for the verification code')
}
```

### Step 2: Verify OTP

```typescript
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+1234567890',
  token: '123456',
  type: 'sms',
})
```

## OTP Types

| Type | Use Case |
|------|----------|
| `email` | Email OTP sign-in |
| `sms` | Phone OTP sign-in |
| `phone_change` | Verify new phone number |
| `email_change` | Verify new email address |
| `signup` | Verify email during sign-up |
| `recovery` | Password recovery |

## Common Mistakes

### 1. Using Wrong Type Parameter

**Incorrect:**

```typescript
// Phone OTP with wrong type
await supabase.auth.verifyOtp({
  phone: '+1234567890',
  token: '123456',
  type: 'email', // Wrong!
})
```

**Correct:**

```typescript
await supabase.auth.verifyOtp({
  phone: '+1234567890',
  token: '123456',
  type: 'sms', // Correct for phone
})
```

### 2. Not Handling Expiration

**Incorrect:**

```typescript
const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
if (error) {
  showError('Verification failed') // Not helpful
}
```

**Correct:**

```typescript
const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })

if (error) {
  if (error.message.includes('expired')) {
    showError('Code expired. Please request a new one.')
    showResendOption()
  } else if (error.message.includes('invalid')) {
    showError('Invalid code. Please check and try again.')
  } else {
    showError('Verification failed. Please try again.')
  }
}
```

### 3. Not Implementing Resend Logic

**Incorrect:**

```typescript
// No way to get new code
function OtpInput() {
  return <input placeholder="Enter code" />
}
```

**Correct:**

```typescript
function OtpInput({ email }) {
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    const timer = cooldown > 0 && setInterval(() => setCooldown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResend = async () => {
    await supabase.auth.signInWithOtp({ email })
    setCooldown(60) // 60 second cooldown
  }

  return (
    <>
      <input placeholder="Enter 6-digit code" />
      <button onClick={handleResend} disabled={cooldown > 0}>
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
      </button>
    </>
  )
}
```

### 4. Storing Email/Phone Inconsistently

**Incorrect:**

```typescript
// Send to one format
await supabase.auth.signInWithOtp({ email: 'User@Example.com' })

// Verify with different format
await supabase.auth.verifyOtp({
  email: 'user@example.com', // Different case
  token: '123456',
  type: 'email',
})
```

**Correct:**

```typescript
const email = userInput.toLowerCase().trim()

// Use consistently
await supabase.auth.signInWithOtp({ email })
await supabase.auth.verifyOtp({ email, token, type: 'email' })
```

## Phone Number Format

Always use E.164 format:

```typescript
// Correct formats
'+14155551234'
'+442071234567'

// Incorrect formats
'(415) 555-1234'
'415-555-1234'
'00447021234567'
```

Consider using a library like `libphonenumber`:

```typescript
import { parsePhoneNumber } from 'libphonenumber-js'

const phoneNumber = parsePhoneNumber(userInput, 'US')
const e164 = phoneNumber?.format('E.164') // '+14155551234'
```

## Rate Limits

| Limit | Default |
|-------|---------|
| Email OTP | 1 per 60 seconds |
| Phone OTP | 1 per 60 seconds |
| OTP expiry | Configurable (max 86400 seconds / 24 hours) |

## Related

- [passwordless-magic-links.md](passwordless-magic-links.md) - Magic link alternative
- [mfa-phone.md](mfa-phone.md) - Phone as second factor
- [Docs: Phone Auth](https://supabase.com/docs/guides/auth/phone-login)
