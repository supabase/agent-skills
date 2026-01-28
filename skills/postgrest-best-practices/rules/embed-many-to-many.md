---
title: Embed Many-to-Many Relationships Through Junction Tables
impact: HIGH
impactDescription: Join through junction tables automatically via foreign keys
tags: many-to-many, m2m, junction, pivot, embedding
---

## Embed Many-to-Many Relationships Through Junction Tables

PostgREST can traverse junction (pivot) tables automatically when both foreign keys are part of a composite primary key or unique constraint.

**Incorrect (manual junction table traversal):**

```bash
# Get actor
curl "http://localhost:3000/actors?id=eq.1"

# Get their film_ids from junction table
curl "http://localhost:3000/films_actors?actor_id=eq.1"

# Get each film separately
curl "http://localhost:3000/films?id=in.(1,2,3)"
```

**Correct (automatic M2M embedding):**

```bash
# Embed films through junction table (actors <-> films_actors <-> films)
curl "http://localhost:3000/actors?select=name,films(title,year)&id=eq.1"

# Reverse direction works too
curl "http://localhost:3000/films?select=title,actors(name)"

# With additional filters
curl "http://localhost:3000/actors?select=name,films(title,year)&films.year=gt.2020"
```

**supabase-js:**

```typescript
// Actor with their films
const { data } = await supabase
  .from('actors')
  .select('name, films(title, year)')
  .eq('id', 1)
  .single()

// Film with its actors
const { data } = await supabase
  .from('films')
  .select('title, actors(name)')
  .eq('id', 1)
  .single()
```

**Result structure:**

```json
{
  "name": "Tom Hanks",
  "films": [
    { "title": "Forrest Gump", "year": 1994 },
    { "title": "Cast Away", "year": 2000 },
    { "title": "Toy Story", "year": 1995 }
  ]
}
```

**Schema pattern:**
```sql
-- Junction table with composite primary key
CREATE TABLE films_actors (
  film_id INTEGER REFERENCES films(id),
  actor_id INTEGER REFERENCES actors(id),
  PRIMARY KEY (film_id, actor_id)  -- Both FKs in PK enables M2M detection
);

-- Or with unique constraint
CREATE TABLE films_actors (
  id SERIAL PRIMARY KEY,
  film_id INTEGER REFERENCES films(id),
  actor_id INTEGER REFERENCES actors(id),
  UNIQUE (film_id, actor_id)  -- Unique constraint also works
);
```

**Accessing junction table data:**

```bash
# If junction table has extra columns (e.g., role, billing)
curl "http://localhost:3000/actors?select=name,films_actors(role,films(title))"
```

```typescript
// Include junction table columns
const { data } = await supabase
  .from('actors')
  .select('name, films_actors(role, films(title))')
```

**Requirements for automatic M2M:**
1. Junction table has FKs to both tables
2. FKs are either part of PRIMARY KEY or have UNIQUE constraint
3. All three tables exposed in same schema

Reference: [PostgREST Many-to-Many](https://postgrest.org/en/stable/references/api/resource_embedding.html#many-to-many-relationships)
