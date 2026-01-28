---
title: Filter JSONB Columns with Containment Operator
impact: HIGH
impactDescription: Query nested JSON data using PostgreSQL JSONB operators
tags: json, jsonb, cs, containment, filtering, nested
---

## Filter JSONB Columns with Containment Operator

Use `cs` (contains `@>`) to filter JSONB columns by checking if they contain specific key-value pairs. For simple value extraction, use arrow operators in the column path.

**Incorrect (string comparison on JSON):**

```bash
# These won't work as expected
curl "http://localhost:3000/products?metadata=eq.{\"color\":\"red\"}"   # String comparison
curl "http://localhost:3000/products?metadata=like.*red*"               # Text search on JSON
```

**Correct (JSONB containment with cs):**

```bash
# Contains key-value pair
curl 'http://localhost:3000/products?metadata=cs.{"color":"red"}'

# Contains nested object
curl 'http://localhost:3000/products?metadata=cs.{"dimensions":{"width":100}}'

# Contains multiple keys
curl 'http://localhost:3000/products?metadata=cs.{"color":"red","size":"large"}'

# Contains array element
curl 'http://localhost:3000/products?metadata=cs.{"tags":["featured"]}'
```

**Using arrow operators for simple value filtering:**

```bash
# Extract and compare text value (->>)
curl "http://localhost:3000/products?metadata->>color=eq.red"

# Extract nested value
curl "http://localhost:3000/products?metadata->dimensions->>width=eq.100"

# Numeric comparison (cast if needed)
curl "http://localhost:3000/products?metadata->dimensions->>width=gt.50"

# Combine with other operators
curl "http://localhost:3000/products?metadata->>color=in.(red,blue,green)"
```

**supabase-js:**

```typescript
// JSONB containment
const { data } = await supabase
  .from('products')
  .select('*')
  .contains('metadata', { color: 'red' })

// Nested containment
const { data } = await supabase
  .from('products')
  .select('*')
  .contains('metadata', { dimensions: { width: 100 } })

// Using arrow operator path
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('metadata->color', 'red')  // Note: returns JSON type

// Text extraction with ->>
const { data } = await supabase
  .from('products')
  .select('*')
  .filter('metadata->>color', 'eq', 'red')
```

**Key differences: `->` vs `->>`:**

| Operator | Returns | Use For |
|----------|---------|---------|
| `->` | JSON | Further JSON navigation, preserves type |
| `->>` | Text | Final value comparison, string output |

```bash
# -> returns JSON (for numeric comparison, need proper handling)
curl "http://localhost:3000/products?metadata->price=gt.100"      # Compares as JSON number

# ->> returns text (string comparison)
curl "http://localhost:3000/products?metadata->>color=eq.red"     # String comparison
```

Reference: [PostgREST JSON Filtering](https://postgrest.org/en/stable/references/api/tables_views.html#json-columns)
