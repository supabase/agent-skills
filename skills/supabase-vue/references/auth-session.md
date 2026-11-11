---
title: Track Supabase Auth State Safely
impact: CRITICAL
impactDescription: Keeps Vue UI in sync with session changes while preventing leaked listeners and misleading authorization checks
tags: auth, session, vue, composable, lifecycle
---

## Use Supabase Auth APIs and Vue-owned state

Use SDK APIs such as `signUp`, `signInWithPassword`, `signInWithOAuth`, `signInWithOtp`, `verifyOtp`, `resetPasswordForEmail`, `updateUser`, and `signOut`. Check each response’s `error`; handle email-confirmation and OAuth redirect settings from the project. Allow the browser SDK to persist/refresh sessions. Do not build a parallel token refresh loop or assume a session lasts forever.

**Incorrect (async Auth work in a listener and no teardown):**

```ts
supabase.auth.onAuthStateChange(async () => {
  const { data } = await supabase.auth.getSession()
  user.value = data.session?.user ?? null
})
```

**Correct (short synchronous callback, explicit unsubscribe):**

```ts
import { onMounted, onUnmounted, ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const user = ref<User | null>(null)
const authReady = ref(false)
let unsubscribe: (() => void) | undefined

onMounted(() => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    // Keep this callback synchronous and limited to reactive UI state.
    user.value = session?.user ?? null
    if (event === 'INITIAL_SESSION') authReady.value = true
  })
  unsubscribe = () => data.subscription.unsubscribe()
})

onUnmounted(() => unsubscribe?.())
```

Each listener receives an initial-session notification and subsequent events such as sign-in, sign-out, token refresh, and user update. Install one shared listener at an application/auth-state owner rather than creating duplicate app-wide listeners in every component. Current Supabase docs and source allow async callbacks and include an initialization-notification queue to avoid a specific initialization deadlock. Still keep app callbacks synchronous and limited to reactive UI state, then schedule other work outside and handle its error separately; this conservative pattern avoids blocking later events and coupling to version-specific lock behavior.

Check errors from each explicit Auth operation and reflect them in form state. Email confirmation may create a user without a session; OAuth/magic-link redirects must be included in the project's allowed redirect URLs. Use the `PASSWORD_RECOVERY` event to show the recovery UI, then call `updateUser({ password })` from the user's action handler and check its error.

```ts
async function signIn(email: string, password: string) {
  authError.value = null
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) authError.value = 'Sign-in failed. Check your details and try again.'
}

async function signUp(email: string, password: string) {
  authError.value = null
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) {
    authError.value = 'Unable to create the account.'
    return
  }
  if (!data.session) confirmationNotice.value = 'Check your email to confirm your account.'
}

async function signInWithProvider() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) authError.value = 'Unable to start sign-in.'
}

async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/recover`,
  })
  if (error) authError.value = 'Unable to send password recovery instructions.'
}
```

For magic link/email OTP, use `signInWithOtp({ email, options: { emailRedirectTo } })`; for code entry, use `verifyOtp` with the correct email/phone and flow-specific `type`. Decide explicitly whether `shouldCreateUser` is allowed. Handle confirmation and recovery redirects according to the current client-only or server-rendered app architecture; do not paste SSR callback routes into a Vite SPA.

Auth state controls UI only. RLS and trusted server/database checks determine authorization. Never infer permission from a hidden button, route guard, cached role, or user-editable `user_metadata`. Store profile data in an application table with appropriate policies. For a usual single-browser sign-out, consider `signOut({ scope: 'local' })`; the SDK’s default scope can sign out all sessions. Handle a returned error and communicate only a safe result.

Reference current event behavior before version-sensitive changes: [Auth `onAuthStateChange`](https://supabase.com/docs/reference/javascript/auth-onauthstatechange), [sessions](https://supabase.com/docs/guides/auth/sessions), [password auth](https://supabase.com/docs/guides/auth/passwords), [passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless), [OAuth](https://supabase.com/docs/guides/auth/social-login).
