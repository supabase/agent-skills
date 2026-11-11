---
title: Encapsulate Supabase Operations in Focused Composables
impact: HIGH
impactDescription: Makes reactive query state reusable and gives request/subscription side effects a clear Vue lifecycle owner
tags: composables, vue, composition-api, reactivity, supabase
---

## Keep reusable data behavior with its owner

Extract stateful Supabase operations into focused `use...` functions when logic or state is reused. Return a plain object containing refs so callers can destructure without losing reactivity. Keep simple one-off behavior local; avoid building generic data/repository abstractions without a real use case.

```ts
import { onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { Tables } from '@/types/database.types'
import { supabase } from '@/lib/supabase'

export function useProfile(profileId: MaybeRefOrGetter<string | null>) {
  const data = ref<Tables<'profiles'> | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let requestId = 0

  async function fetch(id: string | null) {
    const currentRequest = ++requestId
    data.value = null
    error.value = null
    if (!id) { loading.value = false; return }
    loading.value = true

    try {
      const { data: row, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (queryError) throw queryError
      if (currentRequest === requestId) data.value = row
    } catch (cause) {
      if (currentRequest === requestId) {
        error.value = cause instanceof Error ? cause.message : 'Unable to load profile.'
      }
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  }

  const stop = watch(() => toValue(profileId), id => { void fetch(id) }, { immediate: true })
  onScopeDispose(() => { stop(); requestId++ })

  return { data, loading, error, refresh: () => fetch(toValue(profileId)) }
}
```

Normalize reactive inputs with `toValue()` inside a `watch()` source or `watchEffect()` so dependencies are tracked. Invalidate previous requests when parameters change to prevent stale responses from overwriting newer state. Reset data/error/loading intentionally. Register component-scoped watchers and cleanup synchronously during setup so Vue can stop them when the owner is disposed.

Do not invoke a composable outside component setup or an explicitly managed effect scope if it uses lifecycle hooks. For app-wide Auth state, prefer a single application owner/store; ordinary composable calls create per-owner state unless intentionally shared. Use Pinia only where shared app state warrants it, not just to call Supabase.

Reference: [Vue composables](https://vuejs.org/guide/reusability/composables), [Vue state management](https://vuejs.org/guide/scaling-up/state-management.html), [Vue TypeScript](https://vuejs.org/guide/typescript/overview.html).
