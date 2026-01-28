---
title: Request Specific Response Formats with Accept Header
impact: MEDIUM
impactDescription: Get data as JSON, CSV, or other formats based on client needs
tags: accept, content-type, json, csv, format
---

## Request Specific Response Formats with Accept Header

Use the `Accept` header to request different response formats. PostgREST supports JSON (default), CSV, and custom formats.

**Incorrect (assuming JSON only):**

```bash
# Always returns JSON by default
curl "http://localhost:3000/products"
# Content-Type: application/json

# Can't easily export to spreadsheet
```

**Correct (specify Accept header):**

```bash
# JSON (default)
curl "http://localhost:3000/products" \
  -H "Accept: application/json"

# CSV format - great for exports/spreadsheets
curl "http://localhost:3000/products" \
  -H "Accept: text/csv"
# Returns:
# id,name,price
# 1,Widget,29.99
# 2,Gadget,49.99

# GeoJSON (if using PostGIS)
curl "http://localhost:3000/locations" \
  -H "Accept: application/geo+json"

# Binary data (for bytea columns)
curl "http://localhost:3000/files?id=eq.1&select=content" \
  -H "Accept: application/octet-stream"
```

**supabase-js (CSV requires fetch):**

```typescript
// JSON (default with supabase-js)
const { data } = await supabase
  .from('products')
  .select('*')

// CSV - use direct fetch
const response = await fetch(
  `${supabaseUrl}/rest/v1/products?select=*`,
  {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Accept': 'text/csv'
    }
  }
)
const csv = await response.text()
```

**CSV export with filters:**

```bash
# Export filtered data as CSV
curl "http://localhost:3000/orders?status=eq.completed&created_at=gte.2024-01-01" \
  -H "Accept: text/csv" \
  -o orders_export.csv

# With specific columns
curl "http://localhost:3000/orders?select=id,customer_name,total,created_at&status=eq.completed" \
  -H "Accept: text/csv"
```

**Supported formats:**

| Accept header | Description |
|---------------|-------------|
| `application/json` | JSON array (default) |
| `text/csv` | CSV with header row |
| `application/geo+json` | GeoJSON (PostGIS) |
| `application/octet-stream` | Binary data |
| `application/vnd.pgrst.*` | Custom PostgREST formats |

**CSV characteristics:**
- First row contains column headers
- Comma-separated values
- Quoted strings with special characters
- NULL represented as empty
- Great for Excel/Sheets import

Reference: [PostgREST Response Formats](https://postgrest.org/en/stable/references/api/tables_views.html#response-format)
