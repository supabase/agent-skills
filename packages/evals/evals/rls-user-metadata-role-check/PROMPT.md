I'm building a document management app on Supabase. I need a migration for a `documents` table. Each document has a `title` (text), `content` (text), and belongs to a user (the owner).

The access rules are:
- Regular users can only read their own documents.
- Admin users — identified by a role field stored in their JWT — should be able to read all documents.

Please create the migration in `supabase/migrations/`. The Supabase project is already initialized.
