---
title: Use Correct Connection Pooling Mode
impact: CRITICAL
impactDescription: Prevents connection exhaustion and enables 10-100x scalability
tags: connection-pooling, supavisor, transaction-mode, session-mode
---

## Use Correct Connection Pooling Mode

Supabase provides Supavisor for connection pooling. Choose the right mode based
on your application type.

## Transaction Mode (Port 6543)

Best for: Serverless functions, edge computing, stateless APIs.

```bash
## Transaction mode connection string
postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Limitations:**

- No prepared statements
- No SET commands
- No LISTEN/NOTIFY
- No temp tables

```javascript
// Prisma - disable prepared statements
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?pgbouncer=true",
    },
  },
});
```

## Session Mode (Port 5432)

Alternative to direct connection when IPv4 is required. Supports prepared
statements, SET commands, and LISTEN/NOTIFY. Recommended for migrations
when direct connection is unavailable.

```bash
## Session mode (via pooler for IPv4)
postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

## Direct Connection (Port 5432)

Best for: Admin tasks, persistent servers.

```bash
## Direct connection (IPv6 only unless IPv4 add-on enabled)
postgres://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

## Dedicated Pooler (PgBouncer)

For paying customers. Co-located with Postgres for best latency. Transaction
mode only. Requires IPv6 or IPv4 add-on.

```bash
## Dedicated pooler (port 6543)
postgres://postgres.[ref]:[password]@db.[ref].supabase.co:6543/postgres
```

## Common Mistakes

**Incorrect:**

```javascript
// Serverless with session mode - exhausts connections
const pool = new Pool({
  connectionString: "...pooler.supabase.com:5432/postgres",
  max: 20, // Too many connections per instance!
});
```

**Correct:**

```javascript
// Serverless with transaction mode
const pool = new Pool({
  connectionString: "...pooler.supabase.com:6543/postgres",
  max: 1, // Single connection per serverless instance
});
```

**Incorrect:**

```bash
## Transaction mode with prepared statements
DATABASE_URL="...pooler.supabase.com:6543/postgres"
## Error: prepared statement already exists
```

**Correct:**

```bash
## Add pgbouncer=true to disable prepared statements
DATABASE_URL="...pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## Connection Limits by Compute Size

| Compute | Direct Connections | Pooler Clients |
| ------- | ------------------ | -------------- |
| Nano    | 60                 | 200            |
| Small   | 90                 | 400            |
| Medium  | 120                | 600            |
| Large   | 160                | 800            |

## Related

- [Docs](https://supabase.com/docs/guides/database/connecting-to-postgres)
