---
title: Test Mutations with Transaction Rollback
impact: MEDIUM
impactDescription: Validate mutations without persisting changes
tags: transaction, rollback, testing, prefer, dry-run
---

## Test Mutations with Transaction Rollback

Use `Prefer: tx=rollback` to execute a mutation and see the result without persisting the changes. Perfect for validation and testing.

**Incorrect (mutating data to test):**

```bash
# Test mutation by actually doing it (risky!)
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "price": 99.99}'
# Actually creates the record - must delete after

# Or using a separate test database
```

**Correct (rollback transaction):**

```bash
# Mutation is executed but rolled back
curl "http://localhost:3000/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: tx=rollback, return=representation" \
  -d '{"name": "Test Product", "price": 99.99}'
# Returns: [{"id": 123, "name": "Test Product", "price": 99.99}]
# But the row is NOT actually created!

# Test update
curl "http://localhost:3000/products?id=eq.1" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -H "Prefer: tx=rollback, return=representation" \
  -d '{"price": 149.99}'
# Shows what would happen, but doesn't persist

# Test delete
curl "http://localhost:3000/products?category=eq.discontinued" \
  -X DELETE \
  -H "Prefer: tx=rollback, return=representation"
# Shows what would be deleted, nothing actually deleted
```

**supabase-js (requires direct fetch):**

```typescript
// supabase-js doesn't directly support tx=rollback
// Use fetch for dry-run testing
const response = await fetch(
  `${supabaseUrl}/rest/v1/products`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'tx=rollback, return=representation'
    },
    body: JSON.stringify({ name: 'Test', price: 99.99 })
  }
)
const data = await response.json()
// See the result without persisting
```

**Use cases:**

1. **Validate data before committing:**
```bash
# Check if insert would succeed
curl "http://localhost:3000/users" \
  -X POST \
  -H "Prefer: tx=rollback, return=representation" \
  -d '{"email": "test@example.com", "name": "Test"}'
# Validates constraints, triggers, etc.
```

2. **Preview delete impact:**
```bash
# How many rows would be deleted?
curl "http://localhost:3000/old_logs?created_at=lt.2023-01-01" \
  -X DELETE \
  -H "Prefer: tx=rollback, return=representation, count=exact"
# Content-Range: */5000 - would delete 5000 rows
```

3. **Test complex updates:**
```bash
# Preview bulk update
curl "http://localhost:3000/products?category=eq.electronics" \
  -X PATCH \
  -H "Prefer: tx=rollback, return=representation" \
  -d '{"discount": 0.10}'
# See all affected rows without applying discount
```

**Configuration:**
- Requires `db-tx-end` to allow rollback (may be disabled)
- Check PostgREST configuration for availability

Reference: [PostgREST Transaction Preferences](https://postgrest.org/en/stable/references/api/preferences.html#transaction-end)
