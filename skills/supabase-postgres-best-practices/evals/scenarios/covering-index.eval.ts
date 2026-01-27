import { describe, expect, it } from "vitest";
import { runEval } from "../runner.js";
import type { EvalScenario } from "../types.js";

const scenario: EvalScenario = {
	id: "covering-index-suggestion",
	name: "Covering Index Suggestion",
	description:
		"Agent should suggest using INCLUDE clause for columns in SELECT that aren't in WHERE clause",
	category: "query-performance",
	difficulty: "intermediate",
	input: {
		schema: `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  department VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX users_email_idx ON users (email);
-- Table has 2 million rows
`,
		userQuery: `This query still does heap fetches even though we have an index on email:

SELECT email, name, department FROM users WHERE email = 'user@example.com'

EXPLAIN shows "Index Scan" but not "Index Only Scan". How can I avoid the table lookup?`,
		postgresVersion: "15.4",
	},
	expectedOutput: {
		shouldRecommendRules: ["1.2"], // query-covering-indexes
		mustContain: ["include", "covering"],
	},
	expectedReasoning: [
		"Identify that the query selects columns (name, department) not in the index",
		"Recognize this causes additional heap fetches after the index scan",
		"Recommend using INCLUDE clause to create a covering index",
		"Explain that this enables index-only scans",
	],
};

describe("Covering Index Suggestion", () => {
	it("should recommend INCLUDE clause for covering index", async () => {
		const result = await runEval(scenario);

		console.log("Response:", result.response);
		console.log("Criteria results:", result.criteriaResults);

		// Response should mention INCLUDE keyword
		expect(result.response.toLowerCase()).toContain("include");

		// Response should mention covering index concept
		const responseLower = result.response.toLowerCase();
		expect(
			responseLower.includes("covering") ||
				responseLower.includes("index-only"),
		).toBe(true);
	});
});
