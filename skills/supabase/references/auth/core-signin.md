---
title: Implement Sign-In and Password Reset
impact: CRITICAL
impactDescription: Core authentication flows - mistakes lead to security issues or locked-out users
tags: auth, signin, login, password-reset, email
---

## Implement Sign-In and Password Reset

Email/password authentication and secure password recovery flows.

## Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})

if (error) {
  console.error('Sign in failed:', error.message)
} else {
  console.log('Signed in:', data.user.email)
  // data.session contains access_token and refresh_token
}
```

## Password Reset Flow

### Step 1: Request Reset Email

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://yourapp.com/update-password',
})

if (!error) {
  showMessage('Check your email for password reset link')
}
```

### Step 2: Handle Reset Link and Update Password

```typescript
// On your /update-password page
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    const newPassword = await promptForNewPassword()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (!error) {
      showMessage('Password updated successfully')
      router.push('/dashboard')
    }
  }
})
```

## Common Mistakes

### 1. Exposing Whether Email Exists

**Incorrect:**

```typescript
const { error } = await supabase.auth.signInWithPassword({ email, password })
if (error?.message === 'Invalid login credentials') {
  // Don't differentiate between wrong email vs wrong password
  showError('Email not found')
}
```

**Correct:**

```typescript
const { error } = await supabase.auth.signInWithPassword({ email, password })
if (error) {
  // Generic message prevents email enumeration attacks
  showError('Invalid email or password')
}
```

### 2. Not Handling Rate Limiting

**Incorrect:**

```typescript
// No retry logic or user feedback for rate limits
const { error } = await supabase.auth.signInWithPassword({ email, password })
```

**Correct:**

```typescript
const { error } = await supabase.auth.signInWithPassword({ email, password })

if (error) {
  if (error.message.includes('rate limit')) {
    showError('Too many attempts. Please wait a moment and try again.')
  } else {
    showError('Invalid email or password')
  }
}
```

### 3. Missing Redirect URL in Password Reset

**Incorrect:**

```typescript
// User lands on Supabase default page instead of your app
await supabase.auth.resetPasswordForEmail(email)
```

**Correct:**

```typescript
// Add redirect URL to allowlist in Dashboard first
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://yourapp.com/update-password',
})
```

### 4. Not Listening for PASSWORD_RECOVERY Event

**Incorrect:**

```typescript
// On /update-password page - tries to update immediately
const { error } = await supabase.auth.updateUser({ password: newPassword })
// Error: No session - user hasn't been authenticated yet
```

**Correct:**

```typescript
// Listen for the recovery event which establishes the session
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    // Now there's a valid session
    const { error } = await supabase.auth.updateUser({ password: newPassword })
  }
})
```

## Sign Out

```typescript
// Sign out all sessions on all devices (default scope: 'global')
const { error } = await supabase.auth.signOut()

// Explicitly pass scope: 'global' (same as default)
const { error } = await supabase.auth.signOut({ scope: 'global' })

// Sign out other sessions only (keep current)
const { error } = await supabase.auth.signOut({ scope: 'others' })
```

## Update User Email

```typescript
const { error } = await supabase.auth.updateUser({
  email: 'newemail@example.com',
})

// By default, confirmation emails sent to BOTH old and new email
// User must confirm on both to complete the change
```

## Related

- [core-sessions.md](core-sessions.md) - Managing sessions after sign-in
- [mfa-totp.md](mfa-totp.md) - Adding MFA to sign-in
- [Docs: Sign In](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Docs: Password Reset](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
