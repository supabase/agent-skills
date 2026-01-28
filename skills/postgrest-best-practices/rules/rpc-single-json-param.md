---
title: Use Single JSON Parameter for Flexible Input
impact: MEDIUM
impactDescription: Accept any JSON structure as function input
tags: rpc, json, jsonb, flexible, single-param
---

## Use Single JSON Parameter for Flexible Input

Create functions with a single unnamed `json` or `jsonb` parameter to accept the entire request body. Useful for flexible APIs where input structure varies.

**Incorrect (many individual parameters):**

```sql
-- Hard to extend, version, or make optional
CREATE FUNCTION process_order(
  customer_id INT,
  product_ids INT[],
  quantities INT[],
  shipping_address TEXT,
  billing_address TEXT,
  coupon_code TEXT,
  notes TEXT,
  -- Adding new params requires API changes
  gift_wrap BOOLEAN,
  ...
)
```

**Correct (single JSONB parameter):**

```sql
-- Flexible, extensible input
CREATE FUNCTION process_order(body JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Extract what you need
  INSERT INTO orders (customer_id, shipping_address)
  VALUES (
    (body->>'customer_id')::INT,
    body->>'shipping_address'
  )
  RETURNING to_jsonb(orders.*) INTO result;

  -- Handle items
  INSERT INTO order_items (order_id, product_id, quantity)
  SELECT
    (result->>'id')::INT,
    (item->>'product_id')::INT,
    (item->>'quantity')::INT
  FROM jsonb_array_elements(body->'items') AS item;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

**Calling with raw body:**

```bash
# Entire body becomes the parameter
curl "http://localhost:3000/rpc/process_order" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 123,
    "shipping_address": "123 Main St",
    "items": [
      {"product_id": 1, "quantity": 2},
      {"product_id": 2, "quantity": 1}
    ],
    "coupon_code": "SAVE10",
    "metadata": {"source": "web", "campaign": "summer"}
  }'
```

**supabase-js:**

```typescript
// Body is passed directly to the function
const { data, error } = await supabase.rpc('process_order', {
  customer_id: 123,
  shipping_address: '123 Main St',
  items: [
    { product_id: 1, quantity: 2 },
    { product_id: 2, quantity: 1 }
  ],
  coupon_code: 'SAVE10',
  metadata: { source: 'web', campaign: 'summer' }
})
```

**How it works:**
- Function has single parameter of type `json` or `jsonb`
- PostgREST automatically detects this and passes the entire body
- Enables schema evolution without API changes

**Important:** If PostgREST doesn't auto-detect the single-param pattern, use `Prefer: params=single-object`:

```bash
curl "http://localhost:3000/rpc/process_order" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Prefer: params=single-object" \
  -d '{"customer_id": 123, "items": [...]}'
```

**Validation inside function:**

```sql
CREATE FUNCTION process_order(body JSONB)
RETURNS JSONB AS $$
BEGIN
  -- Validate required fields
  IF body->>'customer_id' IS NULL THEN
    RAISE EXCEPTION 'customer_id is required';
  END IF;

  IF NOT jsonb_typeof(body->'items') = 'array' THEN
    RAISE EXCEPTION 'items must be an array';
  END IF;

  -- Process...
END;
$$ LANGUAGE plpgsql;
```

**Benefits:**
- Add optional fields without API changes
- Version your API contract in the function
- Accept varying structures
- Simpler function signature

Reference: [PostgREST Single JSON Parameter](https://postgrest.org/en/stable/references/api/functions.html#single-json-object-parameter)
