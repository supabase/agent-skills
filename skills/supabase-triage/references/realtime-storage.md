# Realtime / Storage Triage

## Realtime heartbeats
**Symptom:** Client appears connected but stops receiving messages, or reconnects unexpectedly.
**Cause:** The client sends a `heartbeat` message every 25s and expects a `phx_reply`; this is what detects silent network failures and proxy-timeout-closed connections that don't trigger a WebSocket `close` event. Without it your app can look connected while unable to send/receive.
**Fix:** Monitor with `supabase.realtime.onHeartbeat((status) => ...)`. Heartbeat timeouts trigger automatic client reconnect — if you see repeated timeouts, suspect an intermediary proxy/load balancer closing idle connections.
Source: https://github.com/orgs/supabase/discussions/41239

## Realtime project suspended for exceeding quotas
**Symptom:** Realtime connections fail to establish; logs show `RealtimeDisabledForTenant`.
**Cause:** Manual suspension after sustained, significant overage of plan limits — usually a reconnection loop (client retries rapidly after failed auth/subscribe, spawning thousands of short-lived connections) or uncontrolled channel creation (channels never cleaned up).
**Fix:** Contact support to understand the specific trigger and get reinstated; fix the reconnect-loop or channel-leak root cause before requesting restoration (see "TooManyChannels" below for the common React cause).
Source: https://github.com/orgs/supabase/discussions/42931

## Postgres error 'relation "objects" does not exist' during Storage uploads
**Symptom:** 500 on file upload; Postgres logs show `relation "objects" does not exist`.
**Cause:** The `authenticated` role's `search_path` doesn't include the `storage` schema, so Postgres can't resolve the (schema-unqualified) `objects` table used internally by Storage during upload.
**Fix:** `ALTER ROLE authenticated SET search_path = public, storage;`. Best practice: avoid creating custom Postgres roles for app users — use `auth.users.raw_app_meta_data` custom claims instead, which preserves the default search path/permissions.
Source: https://github.com/orgs/supabase/discussions/46844

## Debugging Realtime with logger and log levels
**Symptom:** Need visibility into what the Realtime client is actually sending/receiving.
**Fix:** Logging is off by default — enable it:
```ts
const supabase = createClient(URL, KEY, {
  realtime: { logLevel: 'info', logger: (kind, msg, data) => console.log(`[${kind}] ${msg}`, data) },
})
```
Log kinds: `push` (client→server, e.g. heartbeat/phx_join), `receive` (server→client, e.g. phx_reply/broadcast), `transport` (connection lifecycle — connect/heartbeat-timeout/reconnect attempts).
Source: https://github.com/orgs/supabase/discussions/41238

## TooManyChannels / ChannelRateLimitReached
**Symptom:** `ChannelRateLimitReached` — too many Realtime channels created.
**Cause:** Almost always a React cleanup bug: a channel is created in `useEffect` without an unsubscribe on unmount, and/or the effect re-runs (missing/incorrect deps, React 18 StrictMode double-invoke in dev) — each run creates a new channel that's never removed.
**Fix:** Always return a cleanup function that unsubscribes:
```ts
useEffect(() => {
  const channel = supabase.channel('chat').on('broadcast', {event:'message'}, cb).subscribe()
  return () => { supabase.removeChannel(channel) }
}, [])
```
Also avoid creating the `supabase` client itself inside the component body (causes a new client — and thus new deps identity — every render).
Source: https://github.com/orgs/supabase/discussions/41240

## Understanding egress / bandwidth usage
**Symptom:** Unexpectedly high egress billing/quota usage.
**Cause:** Egress = all data leaving the platform to a client — from PostgREST, Storage, Realtime, Auth, Edge Functions, the database, and Supavisor combined.
**Fix:** Check the Billing Dashboard for project/org-level egress, use Custom Reports → Database API → API Egress, and cross-reference "Top Paths" in the Log Explorer plus the Query Performance report's average-rows-returned to spot queries returning unexpectedly large result sets. Supavisor egress can't be tied to a single query directly — use the "frequent queries with large row counts" signal as a proxy.
Source: https://github.com/orgs/supabase/discussions/26605

## Getting detailed Storage metrics via the AWS CLI
**Symptom:** Need bucket-level size/object breakdowns beyond what Studio shows.
**Fix:** Supabase Storage is S3-compatible — generate an Access Key pair + find the Storage endpoint/region in Storage Configuration, then use the AWS CLI: `aws s3api list-buckets --endpoint-url <endpoint>` and `aws s3 ls s3://<bucket>/ --endpoint-url <endpoint> --recursive --human-readable --summarize`.
Source: https://github.com/orgs/supabase/discussions/42483

## Hierarchical folders and RLS in Storage
**Symptom:** Need folder-level permissions or efficient move/rename/delete of many objects at once; Storage doesn't support this natively.
**Cause:** Storage buckets treat "folders" as pure key prefixes — there's no real filesystem hierarchy or inherited permissions.
**Fix:** Model the hierarchy in a custom Postgres table (folder id, parent id, path, permissions) referencing `storage.objects.id`; enforce access via RLS policies on `storage.objects` that JOIN into that metadata table; handle batch move/rename by updating the metadata table (note: doesn't rewrite actual Storage paths). Index the metadata table and consider `SECURITY DEFINER` functions to keep the RLS JOIN performant. For genuine bulk operations, the S3 protocol interface is an alternative to the JS client.
Source: https://github.com/orgs/supabase/discussions/42487
