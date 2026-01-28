---
title: Embed One-to-Many Relationships (Child Records)
impact: HIGH
impactDescription: Fetch child records as nested array via reverse foreign key
tags: one-to-many, o2m, embedding, children, has-many
---

## Embed One-to-Many Relationships (Child Records)

When other tables have foreign keys pointing to your table, you can embed those child records. The result is an array of related records.

**Incorrect (separate request for children):**

```bash
# Get author
curl "http://localhost:3000/authors?id=eq.1"

# Separate request for their books
curl "http://localhost:3000/books?author_id=eq.1"
```

**Correct (embed children via reverse FK):**

```bash
# Embed books in author (one-to-many: one author -> many books)
curl "http://localhost:3000/authors?select=id,name,books(id,title,published_date)&id=eq.1"

# All authors with their books
curl "http://localhost:3000/authors?select=*,books(title,isbn)"

# Multiple one-to-many relationships
curl "http://localhost:3000/users?select=*,posts(title),comments(text),orders(total)"
```

**supabase-js:**

```typescript
// Embed child records
const { data } = await supabase
  .from('authors')
  .select('id, name, books(id, title, published_date)')
  .eq('id', 1)
  .single()

// Result shape - books is an array
// { id: 1, name: "Jane Author", books: [{ id: 1, title: "Book 1" }, { id: 2, title: "Book 2" }] }
```

**Result structure (O2M returns array):**

```json
{
  "id": 1,
  "name": "Jane Author",
  "books": [
    { "id": 1, "title": "First Book", "published_date": "2023-01-15" },
    { "id": 2, "title": "Second Book", "published_date": "2023-06-20" },
    { "id": 3, "title": "Third Book", "published_date": "2024-02-01" }
  ]
}
```

**Schema pattern:**
```sql
-- books.author_id references authors.id (one-to-many from authors perspective)
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES authors(id),  -- FK on child table
  title TEXT
);
```

**Key behavior:**
- One-to-many embedding returns an **array** (empty array if no matches)
- The FK is on the "many" side (books has author_id)
- Array can be empty `[]` if no children exist
- Combine with ordering/limiting for child records

**Ordering and limiting children:**

```bash
# Latest 5 books per author
curl "http://localhost:3000/authors?select=*,books(title)&books.order=published_date.desc&books.limit=5"
```

Reference: [PostgREST Resource Embedding](https://postgrest.org/en/stable/references/api/resource_embedding.html)
