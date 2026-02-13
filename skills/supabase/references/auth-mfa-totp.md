---
title: Implement TOTP Multi-Factor Authentication
impact: HIGH
impactDescription: MFA significantly reduces account compromise risk
tags: auth, mfa, totp, 2fa, security, authenticator
---

## Implement TOTP Multi-Factor Authentication

Add Time-based One-Time Password (TOTP) authentication using apps like Google Authenticator, Authy, or 1Password.

## Authenticator Assurance Levels (AAL)

| Level | Meaning |
|-------|---------|
| `aal1` | Verified via conventional method (password, magic link, OAuth) |
| `aal2` | Additionally verified via second factor (TOTP, phone) |

## Enrollment Flow

### Step 1: Enroll Factor

```typescript
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'My Authenticator App',
})

if (error) throw error

const {
  id: factorId,           // Store this to complete verification
  totp: {
    qr_code,              // Data URL for QR code image
    secret,               // Manual entry secret
    uri,                  // otpauth:// URI
  },
} = data

// Display QR code to user
// <img src={qr_code} alt="Scan with authenticator app" />
```

### Step 2: Verify Enrollment

```typescript
// Create a challenge
const { data: challenge, error } = await supabase.auth.mfa.challenge({
  factorId,
})

if (error) throw error

// Verify with code from authenticator app
const { data, error: verifyError } = await supabase.auth.mfa.verify({
  factorId,
  challengeId: challenge.id,
  code: '123456', // 6-digit code from app
})

if (!verifyError) {
  // MFA enrolled successfully
  // User now has aal2
}
```

## Sign-In with MFA

### Check if MFA Required

```typescript
const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

const { currentLevel, nextLevel, currentAuthenticationMethods } = data

if (nextLevel === 'aal2' && currentLevel !== 'aal2') {
  // User has MFA enrolled but hasn't verified this session
  showMfaPrompt()
}
```

### Complete MFA Challenge

```typescript
// Get enrolled factors
const { data: { totp } } = await supabase.auth.mfa.listFactors()
const factor = totp[0]

// Create challenge
const { data: challenge } = await supabase.auth.mfa.challenge({
  factorId: factor.id,
})

// Verify with user's code
const { error } = await supabase.auth.mfa.verify({
  factorId: factor.id,
  challengeId: challenge.id,
  code: userInputCode,
})

if (!error) {
  // User now has aal2 - redirect to app
  router.push('/dashboard')
}
```

## Complete Example: Login Flow with MFA

```typescript
async function signIn(email: string, password: string, mfaCode?: string) {
  // Step 1: Sign in with password
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Step 2: Check if MFA is required
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  if (aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
    if (!mfaCode) {
      return { requiresMfa: true }
    }

    // Step 3: Complete MFA
    const { data: { totp } } = await supabase.auth.mfa.listFactors()
    const { data: challenge } = await supabase.auth.mfa.challenge({
      factorId: totp[0].id,
    })

    const { error: mfaError } = await supabase.auth.mfa.verify({
      factorId: totp[0].id,
      challengeId: challenge.id,
      code: mfaCode,
    })

    if (mfaError) throw mfaError
  }

  return { requiresMfa: false, user: data.user }
}
```

## Enforce MFA in RLS Policies

```sql
-- Require aal2 for all operations on sensitive data
create policy "Require MFA"
  on sensitive_data
  as restrictive
  to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2');

-- Require MFA only for users who have enrolled
create policy "MFA for enrolled users"
  on sensitive_data
  as restrictive
  to authenticated
  using (
    array[(select auth.jwt() ->> 'aal')] <@ (
      select
        case when count(id) > 0 then array['aal2']
        else array['aal1', 'aal2']
        end
      from auth.mfa_factors
      where ((select auth.uid()) = user_id) and status = 'verified'
    )
  );
```

## Unenroll Factor

```typescript
const { error } = await supabase.auth.mfa.unenroll({
  factorId: 'd30fd651-184e-4748-a928-0a4b9be1d429',
})
```

## Common Mistakes

### 1. Not Checking AAL After Sign-In

**Incorrect:**

```typescript
const { data } = await supabase.auth.signInWithPassword({ email, password })
// Assumes user is fully authenticated
router.push('/dashboard')
```

**Correct:**

```typescript
const { data } = await supabase.auth.signInWithPassword({ email, password })

const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
if (aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
  router.push('/mfa-verify')
} else {
  router.push('/dashboard')
}
```

### 2. Missing RESTRICTIVE Keyword in RLS

**Incorrect:**

```sql
-- Other permissive policies can still grant access
create policy "Require MFA" on sensitive_data
  using ((select auth.jwt() ->> 'aal') = 'aal2');
```

**Correct:**

```sql
-- RESTRICTIVE ensures this policy MUST pass
create policy "Require MFA" on sensitive_data
  as restrictive
  to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2');
```

### 3. Not Storing Factor ID During Enrollment

**Incorrect:**

```typescript
const { data } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
// Show QR code but don't save factorId
showQRCode(data.totp.qr_code)

// Later: Can't verify - don't know the factorId
```

**Correct:**

```typescript
const { data } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
const factorId = data.id  // Save this
setFactorId(factorId)
showQRCode(data.totp.qr_code)

// Later: Use saved factorId
await supabase.auth.mfa.challenge({ factorId })
```

### 4. Not Handling Invalid Codes

**Incorrect:**

```typescript
await supabase.auth.mfa.verify({ factorId, challengeId, code })
// No error handling - user stuck if code wrong
```

**Correct:**

```typescript
const { error } = await supabase.auth.mfa.verify({
  factorId,
  challengeId,
  code,
})

if (error) {
  if (error.message.includes('invalid')) {
    showError('Invalid code. Please try again.')
    // Create new challenge for retry
    const { data: newChallenge } = await supabase.auth.mfa.challenge({ factorId })
    setChallengeId(newChallenge.id)
  }
}
```

## Related

- [mfa-phone.md](mfa-phone.md) - Phone-based MFA
- [core-sessions.md](core-sessions.md) - Session management
- [Docs: MFA](https://supabase.com/docs/guides/auth/auth-mfa)
