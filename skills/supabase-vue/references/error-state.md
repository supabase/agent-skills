---
title: Preserve Supabase Errors in Vue State
impact: CRITICAL
impactDescription: Prevents failed database and mutation operations from appearing as successful or empty results
tags: errors, loading, vue, composable, supabase-js
---

## Treat `{ data, error }` as a required result contract

Supabase operations commonly resolve with `{ data, error }`; a request failure is not the same as a successful empty result. Every call must inspect `error`. Map a safe message into UI state or propagate the original error to a caller that handles it. Logging alone is not handling.

**Incorrect (silently discards a query failure):**

```ts
const { data } = await supabase.from('profiles').select('*')
profiles.value = data ?? [] // Renders an error as an empty list.
```

**Correct (separate empty and error states):**

```ts
const { data, error: queryError } = await supabase
  .from('profiles')
  .select('id, display_name')

if (queryError) {
  error.value = queryError // Preserve details for controlled diagnostics; do not render them directly.
  return
}
profiles.value = data // [] is a successful empty result.
```

Use explicit result checks for the SDK’s result object. Surround operations with `try/catch/finally` when the code may also throw (for example a helper intentionally throws, or a network/runtime exception must be normalized); `finally` must reset loading even after failure. Avoid catching and swallowing errors. Keep the original error available for diagnostics/propagation, but do not render SQL, stack traces, secrets, or internal details to users.

### Typed composable with cancellation-safe state

```ts
import { onScopeDispose, ref } from 'vue'
import type { Tables } from '@/types/database.types'
import { supabase } from '@/lib/supabase'

export function useProfiles() {
  const data = ref<Tables<'profiles'>[]>([])
  const loading = ref(false)
  const error = ref<unknown>(null)
  let requestId = 0

  async function fetch() {
    const currentRequest = ++requestId
    loading.value = true
    error.value = null
    data.value = []

    try {
      const { data: rows, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (queryError) throw queryError
      if (currentRequest === requestId) data.value = rows ?? []
    } catch (cause) {
      if (currentRequest === requestId) {
        error.value = cause
      }
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  }

  onScopeDispose(() => { requestId++ }) // Ignore late completion after owner disposal.
  return { data, loading, error, fetch }
}
```

Expose distinct UI branches for loading, error, empty (`data.length === 0` after a successful fetch), and populated states. Render a safe message such as “Unable to load profiles” when `error` is truthy; do not interpolate the raw Supabase error in the template. Preserve the error object for controlled diagnostics or propagate it to an error boundary. For mutations, disable duplicate submission as appropriate, reset mutation loading in `finally`, and do not show success until the Supabase result has no error and the intended result is confirmed. Update local state only after the operation is accepted; account for RLS filtering writes to zero rows.

Reference: [JavaScript error handling](https://supabase.com/docs/reference/javascript/introduction), [Vue composables and async state](https://vuejs.org/guide/reusability/composables).
