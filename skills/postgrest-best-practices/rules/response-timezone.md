---
title: Set Response Timezone with Prefer Header
impact: MEDIUM
impactDescription: Return timestamps in specific timezone instead of UTC
tags: timezone, timestamp, prefer, datetime
---

## Set Response Timezone with Prefer Header

Use `Prefer: timezone=` to return timestamps converted to a specific timezone instead of UTC.

**Incorrect (manual timezone conversion):**

```javascript
// Fetching UTC and converting client-side
const { data } = await supabase.from('events').select('*')
// data[0].start_time = "2024-01-15T10:00:00+00:00" (UTC)

// Client must convert for display
const localTime = new Date(data[0].start_time).toLocaleString('en-US', {
  timeZone: 'America/New_York'
})
```

**Correct (request timezone in response):**

```bash
# Request timestamps in specific timezone
curl "http://localhost:3000/events" \
  -H "Prefer: timezone=America/New_York"
# Returns: {"start_time": "2024-01-15T05:00:00-05:00"}

# Different timezone
curl "http://localhost:3000/events" \
  -H "Prefer: timezone=Europe/London"

# Combined with other preferences
curl "http://localhost:3000/events" \
  -H "Prefer: timezone=Asia/Tokyo, return=representation"
```

**supabase-js (requires direct fetch or handling):**

```typescript
// supabase-js doesn't directly support timezone preference
// Use fetch for timezone conversion
const response = await fetch(
  `${supabaseUrl}/rest/v1/events`,
  {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'timezone=America/New_York'
    }
  }
)
const data = await response.json()
// Timestamps are now in Eastern time

// Or convert client-side (more common with supabase-js)
const { data } = await supabase.from('events').select('*')
// Use a library like date-fns-tz or moment-timezone
```

**Timezone format:**

```bash
# IANA timezone names
Prefer: timezone=America/New_York
Prefer: timezone=Europe/Paris
Prefer: timezone=Asia/Tokyo
Prefer: timezone=UTC

# Offset format (not recommended)
Prefer: timezone=+05:30
```

**Affected columns:**
- `timestamp with time zone` (timestamptz)
- `time with time zone` (timetz)

**Not affected:**
- `timestamp without time zone`
- `date`
- `time without time zone`

**Use cases:**

```bash
# User-specific timezone for events app
curl "http://localhost:3000/events?user_id=eq.123" \
  -H "Prefer: timezone=America/Los_Angeles"

# Report for specific region
curl "http://localhost:3000/transactions?created_at=gte.2024-01-01" \
  -H "Prefer: timezone=Europe/London"
```

**Per-function timezone:**

```sql
-- Alternatively, set timezone in function
CREATE FUNCTION get_local_events(tz TEXT)
RETURNS SETOF events AS $$
  SET LOCAL timezone TO tz;
  SELECT * FROM events;
$$ LANGUAGE SQL;
```

Reference: [PostgREST Timezone Preference](https://postgrest.org/en/stable/references/api/preferences.html#timezone)
