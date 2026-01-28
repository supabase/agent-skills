# Section Definitions

Reference files are grouped by prefix. Claude loads specific files based on user
queries.

---

## 1. Setup (setup)

**Impact:** CRITICAL
**Description:** MCP server configuration for local, hosted, and self-hosted environments. Security settings, OAuth, feature groups, and project scoping.

## 2. Workflow (workflow)

**Impact:** CRITICAL
**Description:** Development workflows for local and hosted MCP usage. Migration sync patterns between environments.

## 3. Database Tools (db)

**Impact:** HIGH
**Description:** MCP database tools including execute_sql vs apply_migration decisions, schema inspection, and type generation.

## 4. Project Management (project)

**Impact:** HIGH
**Description:** Project lifecycle operations via MCP: create, pause, restore, health checks, and cost confirmation workflow.

## 5. Branching (branch)

**Impact:** HIGH
**Description:** Database branching operations via MCP for isolated development environments. Paid plans only.

## 6. Edge Functions (func)

**Impact:** MEDIUM
**Description:** Edge Function deployment via MCP including file structure, entrypoints, and JWT verification.

## 7. Debugging (debug)

**Impact:** HIGH
**Description:** MCP debugging tools: service logs and security/performance advisors.
