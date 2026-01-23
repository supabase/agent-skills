import { describe, expect, it } from "vitest";
import { runEval } from "../runner.js";
import type { EvalScenario } from "../types.js";

/**
 * Scenario 1: PG10 - Should NOT recommend covering indexes (requires PG11+)
 */
const scenarioPg10NoCoveringIndex: EvalScenario = {
	id: "version-constraint-pg10-no-covering",
	name: "Version Constraint - PG10 No Covering Index",
	description:
		"Agent should NOT recommend INCLUDE clause on PostgreSQL 10 since it requires PG11+",
	category: "version-constraints",
	difficulty: "intermediate",
	input: {
		schema: `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX users_email_idx ON users (email);
`,
		userQuery:
			"How can I optimize this query to avoid heap fetches? SELECT email, name FROM users WHERE email = 'test@example.com'",
		postgresVersion: "10.0",
	},
	expectedOutput: {
		shouldRecommendRules: [],
		shouldNotRecommendRules: ["1.2"], // query-covering-indexes requires PG11
		mustContain: ["index"],
		mustNotContain: ["include"],
	},
	expectedReasoning: [
		"Recognize that PostgreSQL 10 is specified",
		"Check that covering indexes (INCLUDE clause) require PG11+",
		"Avoid recommending INCLUDE clause",
		"Suggest alternative optimization strategies appropriate for PG10",
	],
};

/**
 * Scenario 2: PG9.3 - Should NOT recommend UPSERT (requires PG9.5+)
 */
const scenarioPg93NoUpsert: EvalScenario = {
	id: "version-constraint-pg93-no-upsert",
	name: "Version Constraint - PG9.3 No UPSERT",
	description:
		"Agent should NOT recommend ON CONFLICT on PostgreSQL 9.3 since it requires PG9.5+",
	category: "version-constraints",
	difficulty: "intermediate",
	input: {
		schema: `
CREATE TABLE settings (
  user_id INT NOT NULL,
  key VARCHAR(50) NOT NULL,
  value TEXT,
  PRIMARY KEY (user_id, key)
);
`,
		userQuery:
			"I need to insert a setting if it doesn't exist, or update it if it does. How should I do this?",
		postgresVersion: "9.3",
	},
	expectedOutput: {
		shouldRecommendRules: [],
		shouldNotRecommendRules: ["6.3"], // data-upsert requires PG9.5
		mustContain: ["insert", "update"],
		mustNotContain: ["on conflict"],
	},
	expectedReasoning: [
		"Recognize that PostgreSQL 9.3 is specified",
		"Check that ON CONFLICT (UPSERT) requires PG9.5+",
		"Avoid recommending ON CONFLICT syntax",
		"Suggest alternative pattern (e.g., CTE with INSERT/UPDATE, or try/catch approach)",
	],
};

describe("Version Constraint Tests", () => {
	describe("PG10 - No Covering Index", () => {
		it("should NOT recommend INCLUDE clause for PG10", async () => {
			const result = await runEval(scenarioPg10NoCoveringIndex);

			console.log("Response:", result.response);
			console.log("Criteria results:", result.criteriaResults);

			// Response should NOT contain INCLUDE recommendation
			expect(result.response.toLowerCase()).not.toContain("include (");
			expect(result.response.toLowerCase()).not.toContain("include(");
		});
	});

	describe("PG9.3 - No UPSERT", () => {
		it("should NOT recommend ON CONFLICT for PG9.3", async () => {
			const result = await runEval(scenarioPg93NoUpsert);

			console.log("Response:", result.response);
			console.log("Criteria results:", result.criteriaResults);

			// Response should NOT recommend ON CONFLICT
			expect(result.response.toLowerCase()).not.toContain("on conflict");
		});
	});
});
