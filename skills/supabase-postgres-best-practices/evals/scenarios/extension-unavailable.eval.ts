import { describe, expect, it } from "vitest";
import { runEval } from "../runner.js";
import type { EvalScenario } from "../types.js";

const scenario: EvalScenario = {
	id: "extension-unavailable-no-pg-stat-statements",
	name: "Extension Unavailable - No pg_stat_statements",
	description:
		"Agent should provide alternatives when pg_stat_statements is not available for query monitoring",
	category: "extension-requirements",
	difficulty: "intermediate",
	input: {
		schema: `
-- Production database with various tables
CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255));
CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INT, total DECIMAL);
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(200), price DECIMAL);
`,
		userQuery:
			"Our database is slow but we don't know which queries are causing the problem. How can we identify the slowest queries?",
		postgresVersion: "15.4",
		availableExtensions: [], // No extensions available
		context:
			"This is a managed database environment where we cannot install additional extensions.",
	},
	expectedOutput: {
		shouldRecommendRules: [], // Should not recommend pg_stat_statements rule
		shouldNotRecommendRules: ["7.1"], // monitor-pg-stat-statements
		mustContain: ["explain", "analyze"],
		mustNotContain: ["pg_stat_statements"],
	},
	expectedReasoning: [
		"Recognize that no extensions are available",
		"Check that pg_stat_statements cannot be used",
		"Avoid recommending pg_stat_statements",
		"Suggest alternative approaches like EXPLAIN ANALYZE, log_min_duration_statement, or pg_stat_activity",
	],
};

describe("Extension Unavailable - No pg_stat_statements", () => {
	it("should suggest alternatives when pg_stat_statements is unavailable", async () => {
		const result = await runEval(scenario);

		console.log("Response:", result.response);
		console.log("Criteria results:", result.criteriaResults);

		// Response should NOT primarily recommend pg_stat_statements
		// (it might mention it as unavailable, but shouldn't suggest installing it)
		const responseLower = result.response.toLowerCase();

		// Should suggest EXPLAIN ANALYZE as an alternative
		expect(
			responseLower.includes("explain") && responseLower.includes("analyze"),
		).toBe(true);
	});
});
