# PostgreSQL Best Practices - Evaluation Scenarios

This directory contains evaluation scenarios to test that AI agents correctly apply the PostgreSQL best practices rules, including proper handling of version constraints and extension requirements.

## Overview

The evals use [Vitest](https://vitest.dev/) as the test framework and the [Vercel AI SDK](https://ai-sdk.dev/) to interact with Claude for generating responses. Each scenario tests a specific aspect of rule application.

## Running Evals

```bash
# Install dependencies
npm install

# Run all evals
npm run eval

# Run in watch mode
npm run eval:watch

# Run specific scenario
npm run eval -- -t "Missing Index"
```

## Environment Setup

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=your_api_key
```

## Evaluation Scenarios

### Category 1: Core Query Patterns

#### 1.1 Missing Index Detection

| Field | Value |
|-------|-------|
| **ID** | `missing-index-detection` |
| **File** | `scenarios/missing-index.eval.ts` |
| **Difficulty** | Basic |
| **Tests** | Agent identifies missing indexes on filtered columns |

**Description:**
Tests that the agent correctly identifies when a query would benefit from an index and recommends creating one.

**Input:**
- Schema: `orders` table with no indexes beyond PK
- Query: `SELECT * FROM orders WHERE customer_id = 12345 AND status = 'pending'`

**Expected Output:**
- Should recommend rule 1.1 (query-missing-indexes)
- Must mention "index" and "customer_id"

**Expected Reasoning:**
1. Identify that the query filters on customer_id and status
2. Recognize that without an index, this causes a sequential scan
3. Recommend creating an index on the filtered columns

---

#### 1.2 N+1 Query Detection

| Field | Value |
|-------|-------|
| **ID** | `n-plus-one-detection` |
| **File** | `scenarios/n-plus-one.eval.ts` |
| **Difficulty** | Intermediate |
| **Tests** | Agent identifies N+1 query pattern in code |

**Description:**
Tests that the agent recognizes N+1 query patterns in application code and recommends using JOINs.

**Input:**
- Schema: `users` and `posts` tables with relationship
- Code snippet showing loop that queries for each post's author

**Expected Output:**
- Should recommend rule 6.1 (data-n-plus-one)
- Must mention "JOIN" and "N+1"

**Expected Reasoning:**
1. Identify the N+1 query pattern (1 + N queries)
2. Recognize this as a common performance anti-pattern
3. Recommend using a JOIN to fetch all data in a single query

---

#### 1.3 Covering Index Suggestion

| Field | Value |
|-------|-------|
| **ID** | `covering-index-suggestion` |
| **File** | `scenarios/covering-index.eval.ts` |
| **Difficulty** | Intermediate |
| **Tests** | Agent suggests INCLUDE clause for covering index |

**Description:**
Tests that the agent recommends covering indexes when SELECT columns aren't in the index.

**Input:**
- Schema: `users` table with index on `email` only
- Query: `SELECT email, name, department FROM users WHERE email = ?`
- PostgreSQL version: 15.4

**Expected Output:**
- Should recommend rule 1.2 (query-covering-indexes)
- Must mention "INCLUDE" and "covering"

**Expected Reasoning:**
1. Identify that query selects columns not in the index
2. Recognize this causes heap fetches
3. Recommend using INCLUDE clause for index-only scans

---

### Category 2: Version Constraints

#### 2.1 PG10 - No Covering Index

| Field | Value |
|-------|-------|
| **ID** | `version-constraint-pg10-no-covering` |
| **File** | `scenarios/version-constraint.eval.ts` |
| **Difficulty** | Intermediate |
| **Tests** | Agent respects PG11+ requirement for INCLUDE |

**Description:**
Tests that the agent does NOT recommend INCLUDE clause when PostgreSQL version is 10 (INCLUDE requires PG11+).

**Input:**
- Same setup as covering index scenario
- PostgreSQL version: 10.0

**Expected Output:**
- Should NOT recommend rule 1.2
- Must NOT contain "INCLUDE"
- Should suggest alternative optimizations

**Expected Reasoning:**
1. Recognize PostgreSQL 10 is specified
2. Check that INCLUDE requires PG11+
3. Avoid recommending incompatible features
4. Suggest PG10-compatible alternatives

---

#### 2.2 PG9.3 - No UPSERT

| Field | Value |
|-------|-------|
| **ID** | `version-constraint-pg93-no-upsert` |
| **File** | `scenarios/version-constraint.eval.ts` |
| **Difficulty** | Intermediate |
| **Tests** | Agent respects PG9.5+ requirement for ON CONFLICT |

**Description:**
Tests that the agent does NOT recommend ON CONFLICT when PostgreSQL version is 9.3 (requires PG9.5+).

**Input:**
- Schema: `settings` table with composite primary key
- Query: Need insert-or-update functionality
- PostgreSQL version: 9.3

**Expected Output:**
- Should NOT recommend rule 6.3 (data-upsert)
- Must NOT contain "ON CONFLICT"
- Should suggest CTE-based or try/catch pattern

**Expected Reasoning:**
1. Recognize PostgreSQL 9.3 is specified
2. Check that ON CONFLICT requires PG9.5+
3. Avoid recommending UPSERT syntax
4. Suggest compatible alternatives

---

### Category 3: Extension Requirements

#### 3.1 Extension Available

| Field | Value |
|-------|-------|
| **ID** | `extension-available-pg-stat-statements` |
| **File** | `scenarios/extension-available.eval.ts` |
| **Difficulty** | Basic |
| **Tests** | Agent recommends extension when available |

**Description:**
Tests that the agent recommends pg_stat_statements when it's listed as available.

**Input:**
- General schema
- Query: How to identify slow queries
- Available extensions: pg_stat_statements, pgcrypto, uuid-ossp

**Expected Output:**
- Should recommend rule 7.1 (monitor-pg-stat-statements)
- Must mention "pg_stat_statements"

**Expected Reasoning:**
1. Recognize query monitoring problem
2. Check that pg_stat_statements is available
3. Recommend enabling and using the extension

---

#### 3.2 Extension Unavailable

| Field | Value |
|-------|-------|
| **ID** | `extension-unavailable-no-pg-stat-statements` |
| **File** | `scenarios/extension-unavailable.eval.ts` |
| **Difficulty** | Intermediate |
| **Tests** | Agent provides alternatives when extension unavailable |

**Description:**
Tests that the agent suggests alternatives when pg_stat_statements is not available.

**Input:**
- General schema
- Query: How to identify slow queries
- Available extensions: [] (none)
- Context: Managed database, can't install extensions

**Expected Output:**
- Should NOT recommend pg_stat_statements
- Must mention "EXPLAIN" and "ANALYZE"
- Should suggest built-in alternatives

**Expected Reasoning:**
1. Recognize no extensions are available
2. Avoid recommending pg_stat_statements
3. Suggest EXPLAIN ANALYZE, log_min_duration_statement, or pg_stat_activity

---

## Adding New Scenarios

1. Create a new file in `scenarios/` following the naming convention `{name}.eval.ts`

2. Define the scenario using the `EvalScenario` interface:

```typescript
import { describe, it, expect } from "vitest";
import { runEval } from "../runner.js";
import type { EvalScenario } from "../types.js";

const scenario: EvalScenario = {
  id: "unique-scenario-id",
  name: "Human Readable Name",
  description: "What this scenario tests",
  category: "query-performance" | "version-constraints" | "extension-requirements",
  difficulty: "basic" | "intermediate" | "advanced",
  input: {
    schema: "SQL schema definition",
    userQuery: "User's question or problem",
    postgresVersion: "15.4", // Optional
    availableExtensions: ["list"], // Optional
  },
  expectedOutput: {
    shouldRecommendRules: ["1.1"],
    shouldNotRecommendRules: ["2.3"], // Optional
    mustContain: ["keyword"],
    mustNotContain: ["avoid"], // Optional
  },
  expectedReasoning: [
    "Step 1 of expected reasoning",
    "Step 2 of expected reasoning",
  ],
};

describe("Scenario Name", () => {
  it("should do something specific", async () => {
    const result = await runEval(scenario);
    // Add assertions
  });
});

export { scenario };
```

3. Run the new scenario: `npm run eval -- -t "Scenario Name"`

## Evaluation Criteria

Each scenario is evaluated against:

1. **Rule References**: Does the response reference the expected rules?
2. **Must Contain**: Does the response include required keywords?
3. **Must Not Contain**: Does the response avoid prohibited content?
4. **Version Constraints**: Are version requirements respected?
5. **Extension Requirements**: Are extension dependencies checked?

## Troubleshooting

**Evals timing out:**
- Increase timeout in `vitest.config.ts` (default: 60s)
- Check API key is valid

**Flaky results:**
- Set `temperature: 0` in runner config
- Make assertions more flexible (check for concept presence, not exact wording)

**Missing AGENTS.md:**
- Run `npm run build` from repository root first
