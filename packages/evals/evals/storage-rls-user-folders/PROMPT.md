I need to set up file storage for my app. There are two use cases:

1. **Avatars** -- Users upload a profile picture. Anyone can view avatars but only the owning user can upload or replace their own. Only allow image files (JPEG, PNG, WebP). Max 2MB.

2. **Documents** -- Users upload private documents that only they can access. Max 50MB. No file type restriction.

The Supabase project is already initialized in the `supabase/` directory. Create a SQL migration that:
- Configures both storage buckets
- Adds RLS policies on `storage.objects` so each user can only access their own folder (folder name = user ID)
- Creates a `file_metadata` table to track uploaded files (file name, bucket, size, user reference) with appropriate security

Users are authenticated via Supabase Auth.
