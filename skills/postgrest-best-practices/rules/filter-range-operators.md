---
title: Filter Range Types with Range Operators
impact: MEDIUM
impactDescription: Query PostgreSQL range columns (daterange, int4range, etc.)
tags: range, daterange, numrange, overlap, adjacent, filtering
---

## Filter Range Types with Range Operators

Use specialized operators for PostgreSQL range types (int4range, numrange, tsrange, daterange, etc.): `ov` (overlap), `sl`/`sr` (strictly left/right), `nxl`/`nxr` (not extending), `adj` (adjacent).

**Incorrect (using comparison operators on ranges):**

```bash
# These won't work correctly on range types
curl "http://localhost:3000/events?date_range=eq.[2024-01-01,2024-01-31]"  # Wrong syntax
curl "http://localhost:3000/rooms?booking=gt.2024-01-15"                     # Not for ranges
```

**Correct (range-specific operators):**

```bash
# ov (overlap &&) - ranges overlap
curl "http://localhost:3000/events?date_range=ov.[2024-01-15,2024-01-20]"

# sl (strictly left <<) - range is completely before
curl "http://localhost:3000/events?date_range=sl.[2024-02-01,2024-02-28]"

# sr (strictly right >>) - range is completely after
curl "http://localhost:3000/events?date_range=sr.[2024-01-01,2024-01-10]"

# nxl (not extending left &<) - doesn't extend to left of
curl "http://localhost:3000/events?date_range=nxl.[2024-01-01,2024-01-31]"

# nxr (not extending right &>) - doesn't extend to right of
curl "http://localhost:3000/events?date_range=nxr.[2024-01-01,2024-01-31]"

# adj (adjacent -|-) - ranges are adjacent (touch but don't overlap)
curl "http://localhost:3000/events?date_range=adj.[2024-01-31,2024-02-28]"
```

**supabase-js:**

```typescript
// Overlaps - find events during a date range
const { data } = await supabase
  .from('events')
  .select('*')
  .overlaps('date_range', '[2024-01-15,2024-01-20]')

// Using filter for other range operators
const { data } = await supabase
  .from('events')
  .select('*')
  .filter('date_range', 'sl', '[2024-02-01,2024-02-28]')

// Adjacent ranges
const { data } = await supabase
  .from('events')
  .select('*')
  .filter('date_range', 'adj', '[2024-01-31,2024-02-28]')
```

**Range syntax:**

```bash
# Inclusive bounds [ ]
[2024-01-01,2024-01-31]   # Jan 1 to Jan 31 inclusive

# Exclusive upper bound [ )
[2024-01-01,2024-02-01)   # Jan 1 to Jan 31 (Feb 1 excluded)

# Numeric ranges
[1,100]                    # 1 to 100 inclusive
(0,100]                    # 1 to 100 (0 excluded)
```

**Common use cases:**

```bash
# Room availability - no overlapping bookings
curl "http://localhost:3000/bookings?room_id=eq.5&date_range=ov.[2024-03-01,2024-03-05]"

# Events before a date
curl "http://localhost:3000/events?date_range=sl.[2024-06-01,infinity]"

# Price ranges that include a value (use containment)
curl "http://localhost:3000/products?price_range=cs.50"
```

**Operator Reference:**

| Operator | SQL | Meaning |
|----------|-----|---------|
| `ov` | `&&` | Overlap |
| `sl` | `<<` | Strictly left of |
| `sr` | `>>` | Strictly right of |
| `nxl` | `&<` | Does not extend to left |
| `nxr` | `&>` | Does not extend to right |
| `adj` | `-\|-` | Adjacent to |

Reference: [PostgreSQL Range Types](https://www.postgresql.org/docs/current/rangetypes.html)
