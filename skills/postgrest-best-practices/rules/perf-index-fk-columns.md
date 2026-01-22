---
title: Index Foreign Keys for Faster Embedding
impact: LOW-MEDIUM
impactDescription: Speed up resource embedding with FK indexes
tags: index, foreign-key, embedding, joins, performance
---

## Index Foreign Keys for Faster Embedding

Create indexes on foreign key columns to speed up resource embedding. PostgREST performs JOINs for embeddings, and FK indexes make these fast.

**Incorrect (unindexed foreign keys):**

```sql
-- FK without index - embedding is slow
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id),  -- No index!
  title TEXT
);
```

```bash
# Embedding causes slow join
curl "http://localhost:3000/users?select=*,posts(*)"
# For each user, scans entire posts table to find matches
```

**Correct (index foreign keys):**

```sql
-- Always index foreign key columns
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id),
  title TEXT
);
CREATE INDEX posts_author_id_idx ON posts (author_id);

-- For existing tables
CREATE INDEX posts_author_id_idx ON posts (author_id);
CREATE INDEX orders_customer_id_idx ON orders (customer_id);
CREATE INDEX comments_post_id_idx ON comments (post_id);
```

```bash
# Now embedding is fast
curl "http://localhost:3000/users?select=*,posts(*)"
# Index scan on posts.author_id

curl "http://localhost:3000/posts?select=*,comments(*)"
# Index scan on comments.post_id
```

**supabase-js:**

```typescript
// These queries benefit from FK indexes
const { data } = await supabase
  .from('users')
  .select('*, posts(*)')
// Fast with posts_author_id_idx

const { data } = await supabase
  .from('orders')
  .select('*, items:order_items(*)')
// Fast with order_items_order_id_idx
```

**Junction tables (M2M):**

```sql
-- Index both FKs in junction tables
CREATE TABLE films_actors (
  film_id INTEGER REFERENCES films(id),
  actor_id INTEGER REFERENCES actors(id),
  PRIMARY KEY (film_id, actor_id)  -- This creates index on (film_id, actor_id)
);
-- Add index for queries starting from actors
CREATE INDEX films_actors_actor_id_idx ON films_actors (actor_id);
```

**Compound indexes for common embeddings:**

```sql
-- If you often filter embedded resources
-- curl ".../posts?select=*,comments(*)&comments.status=eq.approved"
CREATE INDEX comments_post_status_idx ON comments (post_id, status);
```

**Check embedding performance:**

```bash
# Look at join methods in explain plan
curl "http://localhost:3000/users?select=*,posts(*)&id=eq.123" \
  -H "Accept: application/vnd.pgrst.plan+json"
# Should see "Index Scan" or "Nested Loop" with indexes
```

**Best practices:**
- Index all foreign key columns
- Index in direction of common queries
- For junction tables, index both FK columns
- Consider compound indexes for filtered embeddings

Reference: [PostgreSQL Foreign Key Indexes](https://www.postgresql.org/docs/current/indexes.html)
