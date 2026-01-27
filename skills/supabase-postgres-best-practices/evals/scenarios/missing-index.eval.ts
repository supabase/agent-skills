import { describe, expect, it } from "vitest";
import { runEval } from "../runner.js";
import type { EvalScenario } from "../types.js";

const scenario: EvalScenario = {
	id: "missing-index-detection",
	name: "Missing Index Detection",
	description:
		"Agent should identify missing index on WHERE clause columns and recommend creating an appropriate index",
	category: "query-performance",
	difficulty: "basic",
	input: {
		schema: `
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL,
  status VARCHAR(50),
  total DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- No indexes besides primary key
-- Table has 5 million rows
`,
		userQuery:
			"This query is slow and takes 3 seconds: SELECT * FROM orders WHERE customer_id = 12345 AND status = 'pending'",
	},
	expectedOutput: {
		shouldRecommendRules: ["1.1"], // query-missing-indexes
		mustContain: ["index", "customer_id"],
	},
	expectedReasoning: [
		"Identify that the query filters on customer_id and status",
		"Recognize that without an index, this causes a sequential scan",
		"Recommend creating an index on the filtered columns",
	],
};

describe("Missing Index Detection", () => {
	it("should recommend creating an index on filtered columns", async () => {
		const result = await runEval(scenario);

		console.log("Response:", result.response);
		console.log("Criteria results:", result.criteriaResults);

		// Check that key criteria passed
		expect(
			result.criteriaResults.some(
				(c) => c.criterion.includes("index") && c.passed,
			),
		).toBe(true);

		// Response should mention creating an index
		expect(result.response.toLowerCase()).toContain("index");
		expect(result.response.toLowerCase()).toContain("customer_id");
	});
});
