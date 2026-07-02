# Storage

Storage is an API in front of Postgres: object metadata lives in the `storage.objects` table, and access is governed by **RLS on that table**. So most "can't upload/list/delete" bugs are RLS or role-privilege bugs. Check the `storage_logs` source for API activity and `postgres_logs` for the underlying database error.

## Common issues

### Can't upload / list / delete in a **public** bucket
**Cause:** "Public" only makes the *download* URL public. Every other operation still needs a Storage **RLS policy** on `storage.objects`.
**Fix:** Add policies for the operations you need. A write needs more than `insert`:

> **Upsert requires `INSERT` + `SELECT` + `UPDATE`.** Granting only `INSERT` lets new uploads through but makes file *replacement* (upsert) fail silently. Grant all three.

Use the real object path in client calls, not a URL path containing `public`.

### `500` on authenticated upload; logs show `relation "objects" does not exist` (`42P01`)
**Cause:** The `authenticated` role's `search_path` doesn't include the `storage` schema, so `storage.objects` can't be resolved during the upload.
**Fix:**
```sql
alter role authenticated set search_path = public, storage;
```
This is usually a side effect of creating custom Postgres roles — prefer custom claims in `auth.users.raw_app_meta_data` over new roles.

### Upload rejected as too large
**Cause:** A global or per-bucket file-size limit; the global limit wins when both are set.
**Fix:** Raise the limit in **Storage → Settings** (global) or the bucket's **Edit** dialog (per-bucket). Note the method ceilings: standard uploads up to 5GB (slower past ~6MB), resumable/S3 uploads up to 50GB.

### Folder move/rename/delete is slow; hierarchical permissions are hard
**Cause:** Storage folders are just key prefixes — there are no native folder operations or inherited permissions.
**Fix:** For bulk operations, use the S3-compatible endpoint via the AWS CLI (`aws s3 mv/cp --recursive --endpoint-url https://<ref>.supabase.co/storage/v1/s3`). For hierarchical access control, model the hierarchy in your own table and join to it from the `storage.objects` RLS policies (a `security definer` helper keeps the policy cheap).

### `rclone`: `s3 protocol error: received listing v1 with IsTruncated set ...`
**Cause:** rclone defaults to the S3 List v1 API, which mishandles Supabase's paginated listings.
**Fix:** Force v2: `rclone lsf supabase:bucket --s3-list-version 2`.

### Need detailed bucket size/metrics
Studio shows only current objects. Use the S3 endpoint: create S3 access keys in Storage settings, then `aws s3 ls s3://<bucket>/ --recursive --human-readable --summarize --endpoint-url <storage-endpoint>`.
