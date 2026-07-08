# Realtime

Realtime issues are usually **client-side lifecycle** (channels not cleaned up, heartbeats throttled in background tabs) or **quota**. Turn on the client logger first; it surfaces the connection and subscription events that explain most failures.

```ts
const supabase = createClient(URL, KEY, {
  realtime: {
    logLevel: 'info',
    logger: (kind, msg, data) => console.log(`[${kind}] ${msg}`, data),
  },
})
supabase.channel('debug').subscribe((status, err) => console.log('subscribe', status, err))
```

Server-side, check the `realtime_logs` source for connection state and suspension events.

## Common issues

### `TIMED_OUT` on connect
**Cause:** A `realtime-js` / Node version mismatch — commonly a Node version older than v22.
**Fix:** Upgrade Node to a current LTS, or explicitly set the WebSocket transport in the client.

### `TooManyChannels` / `ChannelRateLimitReached`
**Cause:** Channels created without cleanup — the classic React `useEffect` leak, where each re-run of the effect opens a new channel.
**Diagnose:** `supabase.getChannels().length` climbing, or repeated topics:
```ts
console.log(supabase.getChannels().map((c) => c.topic))
```
**Fix:** Create the client once as a singleton (outside components); unsubscribe in the effect cleanup (`return () => { channel.unsubscribe() }`); use stable channel names (no random suffixes); `supabase.removeAllChannels()` on logout.

### Subscription silently stops receiving in a background tab
**Cause:** Browsers throttle timers in background tabs, so heartbeats stop and the socket dies without notice.
**Fix:** Run heartbeats off the main thread and reconnect on drop:
```ts
createClient(URL, KEY, {
  realtime: {
    worker: true,
    heartbeatCallback: (status) => { if (status === 'disconnected') supabase.realtime.connect() },
  },
})
```

### Missed database changes / heartbeat timeouts
**Fix:** Monitor heartbeat status (`sent`/`ok`/`error`/`timeout`/`disconnected`) via `heartbeatCallback` or `supabase.realtime.onHeartbeat(...)`, and reconnect when `!supabase.realtime.isConnected()`. Tune `heartbeatIntervalMs` (default 25000) if the network is flaky.

### `WARNING: WarnSendingBroadcastMessage` when broadcasting from the database
**Cause:** `realtime.send()` can't insert into the partitioned `realtime.messages` table — almost always because **no partition exists**, since no client has connected. (A partition is created on the first WebSocket connection, health check, or periodic janitor run.)
**Diagnose:** `postgres_logs` shows the underlying reason, typically `no partition of relation "messages" found for row`.
**Fix:** Ensure at least one subscriber connects before broadcasting from the database — that connection creates the partition.

### `RealtimeDisabledForTenant` — connections all fail
**Cause:** The project exceeded its concurrent-connection or message quota, and Realtime was suspended to protect shared infrastructure.
**Fix:** Review usage on the Realtime report, fix the root cause (channel cleanup, backoff, plan size), and contact support to lift the suspension. Each client subscribed to channels counts as one concurrent connection; self-hosted deployments set the limit via `max_concurrent_users` on the tenant.
