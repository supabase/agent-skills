---
title: Own Realtime Channels Through Vue Lifecycles
impact: HIGH
impactDescription: Avoids duplicate connections and stale callbacks when components unmount or reactive channel inputs change
tags: realtime, channels, vue, cleanup, lifecycle
---

## Create, observe, and remove channels deliberately

Use Postgres Changes for database row events, Broadcast for low-latency messages, and Presence for small, slowly changing online/room state. Confirm Postgres Changes publication settings and database permissions. Private Broadcast/Presence topics need appropriate Realtime authorization. Events are never a replacement for RLS or permission checks.

```ts
import { onScopeDispose, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useTodoChanges(ownerId: MaybeRefOrGetter<string>) {
  const latestId = ref<number | null>(null)
  const subscriptionError = ref<unknown>(null)
  let channel: RealtimeChannel | undefined

  const stop = watch(() => toValue(ownerId), (id, _previousId, onCleanup) => {
    subscriptionError.value = null
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      subscriptionError.value = 'Invalid owner ID.'
      return
    }

    const currentChannel = supabase
      .channel(`todos:${id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'todos', filter: `owner_id=eq.${id}`,
      }, payload => {
        // Use the event as an invalidation/signal; refetch authorized state as needed.
        if (typeof payload.new === 'object' && payload.new !== null && 'id' in payload.new) {
          latestId.value = Number(payload.new.id)
        }
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          subscriptionError.value = err ?? new Error(`Realtime ${status.toLowerCase()}`)
        }
      })
    channel = currentChannel
    onCleanup(() => {
      if (channel === currentChannel) channel = undefined
      void supabase.removeChannel(currentChannel)
    })
  }, { immediate: true })

  onScopeDispose(stop)

  return { latestId, subscriptionError }
}
```

For production, validate values used in topic/filter construction and avoid embedding arbitrary input into raw filters. Keep status/error state available for diagnostics but render a safe generic message rather than the raw server error. Decide how to recover from timeout, channel error, or reconnect (often by refetching the authoritative query). Remove a previous channel before replacing it and remove it when its Vue owner is disposed. Avoid creating a subscription inside a frequently re-running effect without teardown.

Postgres Changes requires table replication configuration and access rights; delivery/visibility depends on project setup. For very high fan-out, evaluate Broadcast rather than assuming every change subscription scales identically. Presence should not be used for high-frequency cursor updates. Check current SDK APIs before using newly added helpers.

References: [Realtime overview](https://supabase.com/docs/guides/realtime), [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes), [Broadcast](https://supabase.com/docs/guides/realtime/broadcast), [Presence](https://supabase.com/docs/guides/realtime/presence), [JavaScript `removeChannel`](https://supabase.com/docs/reference/javascript/removechannel).
