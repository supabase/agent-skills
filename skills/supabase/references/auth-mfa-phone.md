---
title: Implement Phone-Based MFA
impact: MEDIUM-HIGH
impactDescription: Phone MFA provides alternative second factor for users without authenticator apps
tags: auth, mfa, phone, sms, whatsapp, 2fa
---

## Implement Phone-Based MFA

Add phone-based second factor authentication via SMS or WhatsApp.

## Prerequisites

1. Enable "Advanced MFA Phone" in Dashboard: Auth > Multi Factor
2. Configure a phone provider (Twilio, MessageBird, Vonage)

## Pricing

- Feature cost: $0.10/hour ($75/month) for first project, $0.01/hour ($10/month) additional
- SMS/WhatsApp costs from provider apply separately

## Enrollment Flow

### Step 1: Enroll Phone Factor

```typescript
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'phone',
  phone: '+1234567890',
})

if (error) throw error

const factorId = data.id
// SMS/WhatsApp message sent automatically
```

### Step 2: Verify Phone

```typescript
// Create challenge (triggers SMS)
const { data: challenge, error } = await supabase.auth.mfa.challenge({
  factorId,
  channel: 'sms', // or 'whatsapp'
})

// Verify with code from SMS
const { error: verifyError } = await supabase.auth.mfa.verify({
  factorId,
  challengeId: challenge.id,
  code: '123456',
})

if (!verifyError) {
  // Phone MFA enrolled successfully
}
```

## Sign-In with Phone MFA

```typescript
// After password sign-in, check for MFA
const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

if (aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
  // Get enrolled factors
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const phoneFactor = factors.phone?.[0]

  if (phoneFactor) {
    // Trigger SMS/WhatsApp verification
    const { data: challenge } = await supabase.auth.mfa.challenge({
      factorId: phoneFactor.id,
      channel: 'sms',
    })

    // User enters code from SMS
    const { error } = await supabase.auth.mfa.verify({
      factorId: phoneFactor.id,
      challengeId: challenge.id,
      code: userEnteredCode,
    })
  }
}
```

## Common Mistakes

### 1. Not Handling SMS Delivery Failures

**Incorrect:**

```typescript
await supabase.auth.mfa.challenge({ factorId, channel: 'sms' })
// Assume SMS was delivered
showMessage('Enter the code we sent')
```

**Correct:**

```typescript
const { data, error } = await supabase.auth.mfa.challenge({
  factorId,
  channel: 'sms',
})

if (error) {
  showError('Failed to send verification code. Please try again.')
  return
}

showMessage('Enter the code we sent')

// Provide resend option
const handleResend = async () => {
  await supabase.auth.mfa.challenge({ factorId, channel: 'sms' })
}
```

### 2. Ignoring Rate Limits

**Incorrect:**

```typescript
// User spams "resend code" button
const handleResend = () => {
  supabase.auth.mfa.challenge({ factorId, channel: 'sms' })
}
```

**Correct:**

```typescript
const [lastSent, setLastSent] = useState(0)
const COOLDOWN = 60000 // 60 seconds

const handleResend = async () => {
  if (Date.now() - lastSent < COOLDOWN) {
    showError('Please wait before requesting another code')
    return
  }

  await supabase.auth.mfa.challenge({ factorId, channel: 'sms' })
  setLastSent(Date.now())
}
```

### 3. Not Offering Channel Options

**Incorrect:**

```typescript
// Only SMS, no fallback
await supabase.auth.mfa.challenge({ factorId, channel: 'sms' })
```

**Correct:**

```typescript
// Let user choose channel
const channels = ['sms', 'whatsapp'] as const

function MfaVerification({ factorId }) {
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms')

  const sendCode = () => {
    supabase.auth.mfa.challenge({ factorId, channel })
  }

  return (
    <>
      <select onChange={(e) => setChannel(e.target.value)}>
        <option value="sms">SMS</option>
        <option value="whatsapp">WhatsApp</option>
      </select>
      <button onClick={sendCode}>Send Code</button>
    </>
  )
}
```

### 4. Phone Number Security Risks

**Issue:** Phone numbers can be recycled by carriers, leading to potential account takeover.

**Mitigation:**

```typescript
// Require additional verification for sensitive actions
// even with phone MFA

// Option 1: Also require email confirmation
await supabase.auth.reauthenticate()

// Option 2: Recommend TOTP as primary, phone as backup
const { data: factors } = await supabase.auth.mfa.listFactors()
if (factors.totp.length === 0) {
  showRecommendation('Consider adding an authenticator app for better security')
}
```

## Provider Configuration

### Twilio

Dashboard: Auth > Providers > Phone

```
Account SID: AC...
Auth Token: ...
Message Service SID: MG...
```

### Twilio Verify

Better deliverability, built-in rate limiting:

```
Account SID: AC...
Auth Token: ...
Verify Service SID: VA...
```

## Update Phone Number

```typescript
// User wants to change their MFA phone
// Step 1: Unenroll old factor
await supabase.auth.mfa.unenroll({ factorId: oldFactorId })

// Step 2: Enroll new phone
const { data } = await supabase.auth.mfa.enroll({
  factorType: 'phone',
  phone: '+1987654321',
})

// Step 3: Verify new phone
const { data: challenge } = await supabase.auth.mfa.challenge({
  factorId: data.id,
  channel: 'sms',
})

await supabase.auth.mfa.verify({
  factorId: data.id,
  challengeId: challenge.id,
  code: verificationCode,
})
```

## Related

- [mfa-totp.md](mfa-totp.md) - TOTP authenticator MFA (recommended as primary)
- [Docs: Phone MFA](https://supabase.com/docs/guides/auth/auth-mfa/phone)
