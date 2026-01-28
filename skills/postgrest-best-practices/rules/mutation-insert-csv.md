---
title: Bulk Insert from CSV Data
impact: MEDIUM
impactDescription: Import CSV data directly without JSON conversion
tags: csv, bulk, import, insert, mutation
---

## Bulk Insert from CSV Data

Use `Content-Type: text/csv` to insert data directly from CSV format. Useful for imports and data migrations.

**Incorrect (converting CSV to JSON first):**

```javascript
// Client converts CSV to JSON - extra processing
const csv = `name,price\nA,10\nB,20`
const json = csvToJson(csv)  // Unnecessary conversion
fetch('/products', { body: JSON.stringify(json), ... })
```

**Correct (POST CSV directly):**

```bash
# CSV with header row
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: text/csv" \
  -H "Prefer: return=representation" \
  -d 'name,price,category
Widget,10.99,electronics
Gadget,20.99,electronics
Tool,5.99,hardware'

# From file
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: text/csv" \
  -H "Prefer: return=representation" \
  --data-binary @products.csv
```

**supabase-js (requires raw fetch):**

```typescript
// supabase-js doesn't have built-in CSV support
// Use fetch directly
const csvData = `name,price,category
Widget,10.99,electronics
Gadget,20.99,electronics`

const response = await fetch(`${supabaseUrl}/rest/v1/products`, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/csv',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Prefer': 'return=representation'
  },
  body: csvData
})
```

**CSV format requirements:**
- First row must be column headers
- Headers must match table column names
- Values separated by commas
- Use quotes for values containing commas: `"Value, with comma"`

**Example CSV:**

```csv
id,name,email,active
1,John Doe,john@example.com,true
2,Jane Smith,jane@example.com,true
3,"Bob, Jr.",bob@example.com,false
```

**Specifying columns:**

```bash
# Only insert specific columns (others use defaults)
curl "http://localhost:3000/products?columns=name,price" \
  -X POST \
  -H "Content-Type: text/csv" \
  -d 'name,price
Widget,10.99
Gadget,20.99'
```

**Notes:**
- Headers must be valid column names
- Type conversion is automatic
- Use `\N` for NULL values
- Returns inserted rows as JSON (not CSV)

Reference: [PostgREST CSV Insert](https://postgrest.org/en/stable/references/api/tables_views.html#specifying-columns)
