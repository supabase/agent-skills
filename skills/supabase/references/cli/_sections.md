# Section Definitions

Reference files are grouped by command category. Each file covers multiple related
CLI commands.

---

## 1. Project Commands (project)

**Impact:** CRITICAL
**Description:** Commands for project initialization, local stack management, and remote connection: init, start, stop, status, link, login.

## 2. Database Commands (database)

**Impact:** CRITICAL
**Description:** Commands for syncing schema between local and remote: push, pull, diff, reset, dump.

## 3. Migration Commands (migration)

**Impact:** HIGH
**Description:** Commands for migration file management: new, list, fetch, repair, squash.

## 4. Functions Commands (functions)

**Impact:** HIGH
**Description:** Commands for Edge Function development: new, serve, deploy.

## 5. Secrets Commands (secrets)

**Impact:** MEDIUM
**Description:** Commands for production environment variables: set, list.

## 6. Generation Commands (generation)

**Impact:** HIGH
**Description:** Commands for code generation from schema: gen types.

## 7. Decision Guide (decision)

**Impact:** HIGH
**Description:** When to use which command or flag. Covers db pull vs diff, push vs migration up, targeting patterns, diff engines, and experimental flag requirements.

## 8. Gotchas and Pitfalls (gotchas)

**Impact:** HIGH
**Description:** Common pitfalls and edge cases: db reset destroys data, stop doesn't free disk, storage requires experimental, auth schemas excluded from pull, and more.
