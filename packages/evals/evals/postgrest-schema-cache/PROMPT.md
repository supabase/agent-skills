I'm building a product catalog with Supabase. We already have a `products` table (see the existing migration in `supabase/migrations/`), but we need to expand it.

Please create a new migration file in `supabase/migrations/` that:

1. Adds two new columns to the `products` table: `description` (text) and `published_at` (timestamp)
2. Creates a view called `public_products` that shows only products where `published_at` is not null
3. Adds a policy so any authenticated user can view published products

Make sure the migration is safe to run multiple times.
