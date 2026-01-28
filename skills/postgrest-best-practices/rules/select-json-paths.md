---
title: Extract JSON Fields with Arrow Operators
impact: HIGH
impactDescription: Access nested JSON data directly in select without client-side processing
tags: json, jsonb, arrow, select, nested
---

## Extract JSON Fields with Arrow Operators

Use `->` and `->>` operators to extract fields from JSON/JSONB columns directly in your select. Use `->` for JSON type (further navigation), `->>` for text extraction.

**Incorrect (fetching entire JSON and parsing client-side):**

```bash
# Fetches entire metadata blob
curl "http://localhost:3000/products?select=id,metadata"
# Client must parse JSON to get specific fields
```

**Correct (extract specific JSON fields):**

```bash
# ->> extracts as text
curl "http://localhost:3000/products?select=id,name,metadata->>color,metadata->>size"
# Returns: { "id": 1, "name": "Widget", "color": "red", "size": "large" }

# -> extracts as JSON (preserves type)
curl "http://localhost:3000/products?select=id,metadata->dimensions"
# Returns: { "id": 1, "dimensions": { "width": 10, "height": 20 } }

# Nested extraction
curl "http://localhost:3000/products?select=id,metadata->dimensions->>width"
# Returns: { "id": 1, "width": "10" }

# Multiple levels
curl "http://localhost:3000/users?select=id,settings->notifications->>email"
```

**supabase-js:**

```typescript
// Extract as text
const { data } = await supabase
  .from('products')
  .select('id, name, metadata->>color, metadata->>size')

// Extract as JSON (for nested access)
const { data } = await supabase
  .from('products')
  .select('id, metadata->dimensions')

// Nested extraction
const { data } = await supabase
  .from('products')
  .select('id, metadata->dimensions->>width')
```

**With aliases for cleaner response:**

```bash
curl "http://localhost:3000/products?select=id,color:metadata->>color,width:metadata->dimensions->>width"
```

```typescript
const { data } = await supabase
  .from('products')
  .select('id, color:metadata->>color, width:metadata->dimensions->>width')
// Returns: { id: 1, color: "red", width: "10" }
```

**Array access:**

```bash
# Access array element by index
curl "http://localhost:3000/products?select=id,firstTag:metadata->tags->0"

# Last element with negative index
curl "http://localhost:3000/products?select=id,lastTag:metadata->tags->-1"
```

**Key differences: `->` vs `->>`:**

| Operator | Returns | Use for |
|----------|---------|---------|
| `->` | JSON/JSONB | Further navigation, preserve types |
| `->>` | Text | Final value extraction |

```bash
# -> keeps it as JSON (number stays number)
curl "http://localhost:3000/products?select=id,price:metadata->price"
# { "id": 1, "price": 29.99 }

# ->> converts to text
curl "http://localhost:3000/products?select=id,price:metadata->>price"
# { "id": 1, "price": "29.99" }
```

Reference: [PostgREST JSON Columns](https://postgrest.org/en/stable/references/api/tables_views.html#json-columns)
