# Self-hosting / Dashboard / Billing / Misc Triage

## Self-hosted: Kong doesn't start via default docker compose
**Symptom:** `docker compose up -d` on the self-hosting stack starts every container except `kong`.
**Fix:** No single universal cause reported — treat as an active bug pattern: check `docker compose logs kong` for the specific startup error, confirm no port conflicts (8000/8443) with other local services, and diff your `docker-compose.yml`/`.env` against the current self-hosting guide (config drift after copy-pasting old examples is a common culprit).
Source: https://github.com/orgs/supabase/discussions/45952

## Kong stops responding under heavy local load
**Symptom:** Local dev stack (via CLI) — Kong drops connections / logs "not enough available workers" under many parallel requests (e.g. bulk Storage operations).
**Cause:** The CLI starts Kong with a single nginx worker (`KONG_NGINX_WORKER_PROCESSES=1`) by default, to minimize memory footprint across the ~12-container local stack — this caps concurrent connection handling.
**Fix:** `KONG_NGINX_WORKER_PROCESSES=auto supabase start` (one worker per CPU core), or set a fixed number: `KONG_NGINX_WORKER_PROCESSES=2 supabase start`. Export it in your shell to persist across commands. Restart the stack (`supabase stop` then start again) for it to take effect. Trade-off: more workers = more memory usage.
Source: https://github.com/orgs/supabase/discussions/47239

## Feature parity: self-hosted vs. hosted Supabase
**Answer:** Self-hosted is close to hosted but may lag on the newest features. See the official feature matrix and self-hosting guide (linked from the source discussion) for the current gap.
Source: https://github.com/orgs/supabase/discussions/27299

## FDW Wrappers: 'component verification failed'
**Symptom:** `ERROR: HV000: guest fdw error: component verification failed` querying a foreign table via Wrappers.
**Cause:** The configured Wasm package metadata (URL/version/checksum) doesn't match the actual downloaded component — Wrappers blocks the mismatch as a security measure.
**Fix:**
```sql
ALTER SERVER example_server OPTIONS (
  SET fdw_package_url '[CORRECT_URL]', SET fdw_package_version '[CORRECT_VERSION]', SET fdw_package_checksum '[CORRECT_CHECKSUM]'
);
```
Get the correct values for your specific wrapper from https://fdw.dev/catalog/wasm/. Verify: `select srvname, unnest(srvoptions) from pg_foreign_server where srvname = 'example_server';`
Source: https://github.com/orgs/supabase/discussions/46813

## Manually created databases aren't visible in the Dashboard
**Symptom:** A second database created manually inside the project's Postgres cluster works fine via external tools but never shows up in Supabase Studio.
**Cause:** The Dashboard, PostgREST, and the rest of the Supabase stack are wired to one specific database within the Postgres cluster (the project's primary) — Supabase's tooling doesn't manage or expose arbitrary sibling databases in the same cluster.
**Fix:** Don't rely on additional databases in the same cluster for anything Dashboard/API-facing — use the primary database (with schemas for logical separation) or a separate Supabase project instead.
Source: https://github.com/orgs/supabase/discussions/42482

## Changing a project's region
**Answer:** Not possible in place — a project is bound to its region's hardware at provisioning time. Create a new project in the target region and migrate data over via the standard migration guide. Remember to also re-copy third-party OAuth client id/secret pairs and update API URL/anon/service keys in your app's env vars.
Source: https://github.com/orgs/supabase/discussions/16341

## Resetting the database password
**Answer:** Dashboard → Database → Settings.
Source: https://github.com/orgs/supabase/discussions/20929

## Pausing Pro projects
**Answer:** Pro projects can't be paused directly. Workaround: you get 2 free organizations, each supporting one active project — if the project is under 500MB, transfer it to a free org, then pause it there. Alternatively, download a daily DB backup, or a full manual `.sql` dump plus storage buckets (`npx supabase storage cp -r ss://bucket . --experimental`) for archiving without needing to pause at all.
Source: https://github.com/orgs/supabase/discussions/27399

## Restoring a project after a 90-day pause
**Symptom:** Project paused >90 days can no longer be restored via Studio.
**Fix:** Manual migration to a new project: (1) download the `.backup` file and Storage objects from Project Overview before deletion, (2) create a new project (database.new), (3) restore via `psql -d [SESSION_POOLER_CONNECTION_STRING] -f backup_file.backup` (ignore expected "object already exists" errors — the new project already has default Supabase schemas), (4) restore Storage with `supabase storage cp` after `supabase link --project-ref [NEW_REF]`.
Source: https://github.com/orgs/supabase/discussions/47244
