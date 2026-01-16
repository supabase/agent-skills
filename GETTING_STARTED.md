# Getting Started - Postgres Team

Quick guide to start adding PostgreSQL best practice rules.

## Setup

```bash
cd packages/postgresql-best-practices-build
npm install
```

## Add a Rule

1. Copy template:
   ```bash
   cp skills/postgresql-best-practices/rules/_template.md \
      skills/postgresql-best-practices/rules/query-your-rule.md
   ```

2. Edit the file with your rule content

3. Validate & build:
   ```bash
   cd packages/postgresql-best-practices-build
   npm run validate
   npm run build
   ```

4. Check `skills/postgresql-best-practices/AGENTS.md` for output

## File Prefixes → Sections

| Prefix | Section |
|--------|---------|
| `query-` | 1. Query Performance (CRITICAL) |
| `conn-` | 2. Connection Management (CRITICAL) |
| `schema-` | 3. Schema Design (HIGH) |
| `lock-` | 4. Concurrency & Locking (MEDIUM-HIGH) |
| `security-` | 5. Security & RLS (MEDIUM-HIGH) |
| `data-` | 6. Data Access Patterns (MEDIUM) |
| `monitor-` | 7. Monitoring & Diagnostics (LOW-MEDIUM) |
| `advanced-` | 8. Advanced Features (LOW) |

## Rule Structure

```markdown
---
title: Action-Oriented Title
impact: CRITICAL|HIGH|MEDIUM-HIGH|MEDIUM|LOW-MEDIUM|LOW
impactDescription: 10x faster queries
tags: indexes, performance
---

## Title

Brief explanation.

**Incorrect (why it's bad):**
```sql
-- Bad pattern
```

**Correct (why it's better):**
```sql
-- Good pattern
```

**Supabase Note:** Optional platform guidance.

Reference: [Link](url)
```

## Key Files

| File | Purpose |
|------|---------|
| `rules/_template.md` | Copy this to create new rules |
| `rules/_contributing.md` | Writing guidelines |
| `rules/_sections.md` | Section definitions (editable) |
| `AGENTS.md` | Generated output (don't edit directly) |

## Questions?

- Writing guidelines: `rules/_contributing.md`
- Full contributor guide: `skills/postgresql-best-practices/README.md`
