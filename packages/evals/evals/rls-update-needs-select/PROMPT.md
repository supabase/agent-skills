I'm building an e-commerce app and need a migration for an `orders` table. Each order has a `status` (text), `total` (numeric), and `created_at` timestamp. Orders belong to users — each order should have a `user_id` that links to the authenticated user who placed it.

Users need to be able to:
- View their own orders
- Update the status of their own orders

Please create the migration in `supabase/migrations/`.
