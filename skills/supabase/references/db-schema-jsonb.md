---
title: Use Structured Columns Over JSONB When Possible
impact: MEDIUM
impactDescription: Improves query performance, type safety, and data integrity
tags: jsonb, json, schema-design, performance
---

## Use Structured Columns Over JSONB When Possible

JSONB is flexible but should not replace proper schema design. Use structured
columns for known fields, JSONB for truly dynamic data.

**Incorrect:**

```sql
-- Everything in JSONB - loses type safety and performance
create table users (
  id uuid primary key,
  data jsonb  -- contains email, name, role, etc.
);

-- Querying is verbose and slow without indexes
select data ->> 'email' from users
where data ->> 'role' = 'admin';
```

**Correct:**

```sql
-- Structured columns for known fields
create table users (
  id uuid primary key,
  email text not null,
  name text,
  role text check (role in ('admin', 'user', 'guest')),
  -- JSONB only for truly flexible data
  preferences jsonb default '{}'
);

-- Fast, type-safe queries
select email from users where role = 'admin';
```

## When JSONB is Appropriate

- Webhook payloads
- User-defined fields
- API responses to cache
- Rapid prototyping (migrate to columns later)

## Indexing JSONB

```sql
-- GIN index for containment queries
create index idx_users_preferences on users using gin(preferences);

-- Query using containment operator
select * from users
where preferences @> '{"theme": "dark"}';
```

## Validate JSONB with pg_jsonschema

```sql
create extension if not exists pg_jsonschema with schema extensions;

alter table users
add constraint check_preferences check (
  jsonb_matches_schema(
    '{
      "type": "object",
      "properties": {
        "theme": {"type": "string", "enum": ["light", "dark"]},
        "notifications": {"type": "boolean"}
      }
    }',
    preferences
  )
);
```

## Querying JSONB

```javascript
// supabase-js
const { data } = await supabase
  .from("users")
  .select("email, preferences->theme")
  .eq("preferences->>notifications", "true");

// containment queries
const { data: darkUsers } = await supabase
  .from("users")
  .select("*")
  .contains("preferences", { theme: "dark" });

// contained-by query
const { data: subset } = await supabase
  .from("users")
  .select("*")
  .containedBy("preferences", { theme: "dark", notifications: true });
```

## Related

- [perf-indexes.md](perf-indexes.md)
- [Docs](https://supabase.com/docs/guides/database/json)
