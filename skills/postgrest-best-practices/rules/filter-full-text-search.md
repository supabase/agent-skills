---
title: Use Full-Text Search Operators for Text Queries
impact: HIGH
impactDescription: Efficient text search using PostgreSQL FTS instead of LIKE
tags: fts, full-text-search, plfts, phfts, wfts, tsvector, text-search
---

## Use Full-Text Search Operators for Text Queries

PostgREST supports PostgreSQL full-text search with `fts` (basic), `plfts` (plain), `phfts` (phrase), and `wfts` (websearch). These are faster and more powerful than `like` for text search.

**Incorrect (using LIKE for text search):**

```bash
# LIKE is slow on large tables and limited in functionality
curl "http://localhost:3000/articles?content=like.*database*"      # No ranking, slow
curl "http://localhost:3000/articles?title=ilike.*postgresql*"     # Case insensitive but slow
```

**Correct (use FTS operators):**

```bash
# fts - basic full-text search (requires tsvector column or to_tsvector)
curl "http://localhost:3000/articles?content=fts.database"

# fts with language - specify dictionary
curl "http://localhost:3000/articles?content=fts(english).database"

# plfts - plain text search (handles quotes, operators)
curl "http://localhost:3000/articles?content=plfts.database+optimization"

# phfts - phrase search (words must be adjacent)
curl "http://localhost:3000/articles?content=phfts(english).full+text+search"

# wfts - websearch syntax (Google-like)
curl 'http://localhost:3000/articles?content=wfts(english).postgres -mysql "full text"'
```

**FTS operators and queries:**

```bash
# For boolean operators in tsquery, use plfts or wfts instead of fts
# plfts automatically ANDs multiple words
curl "http://localhost:3000/articles?content=plfts.postgres%20database"

# wfts (websearch) supports intuitive syntax: quotes, minus, OR
curl 'http://localhost:3000/articles?content=wfts.postgres%20-mysql%20%22full%20text%22'
# Searches: postgres AND NOT mysql AND "full text" phrase

# Negation with not. prefix
curl "http://localhost:3000/articles?content=not.fts.deprecated"
```

**Note:** When using `fts` directly, tsquery boolean operators (`&`, `|`, `!`) must be URL-encoded
and passed within the search term. For complex queries, prefer `wfts` (websearch syntax) which
handles this more intuitively.

**supabase-js:**

```typescript
// Basic text search
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('content', 'database')

// With language config
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('content', 'database', { config: 'english' })

// Plain text search
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('content', 'database optimization', { type: 'plain' })

// Phrase search
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('content', 'full text search', { type: 'phrase' })

// Websearch syntax
const { data } = await supabase
  .from('articles')
  .select('*')
  .textSearch('content', 'postgres -mysql "full text"', { type: 'websearch' })
```

**FTS Operator Reference:**

| Operator | Type | Use Case |
|----------|------|----------|
| `fts` | to_tsquery | Boolean operators (&, \|, !) |
| `plfts` | plainto_tsquery | Simple words, auto-AND |
| `phfts` | phraseto_tsquery | Exact phrase matching |
| `wfts` | websearch_to_tsquery | Google-like syntax |

**Note:** For best performance, create a GIN index on a tsvector column:

```sql
ALTER TABLE articles ADD COLUMN content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX articles_content_fts ON articles USING GIN (content_tsv);
```

Reference: [PostgREST Full-Text Search](https://postgrest.org/en/stable/references/api/tables_views.html#full-text-search)
