I'm deploying my Supabase app on Vercel using Prisma. I keep getting "prepared statement already exists" errors in production. My current `DATABASE_URL` in `prisma/schema.prisma` uses the direct connection string on port 5432 with no pooler settings.

Fix the Prisma configuration so it works correctly with Supabase's connection pooler for serverless deployments. Make any changes needed to `prisma/schema.prisma` and update the `.env.example` file with the correct connection string format.
