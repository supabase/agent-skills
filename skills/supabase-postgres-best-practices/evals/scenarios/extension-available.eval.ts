import { describe, expect, it } from "vitest";
import { runEval } from "../runner.js";
import type { EvalScenario } from "../types.js";

const scenario: EvalScenario = {
	id: "extension-available-pg-stat-statements",
	name: "Extension Available - pg_stat_statements",
	description:
		"Agent should recommend pg_stat_statements for query monitoring when the extension is available",
	category: "extension-requirements",
	difficulty: "basic",
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
		availableExtensions: ["pg_stat_statements", "pgcrypto", "uuid-ossp"],
	},
	expectedOutput: {
		shouldRecommendRules: ["7.1"], // monitor-pg-stat-statements
		mustContain: ["pg_stat_statements"],
	},
	expectedReasoning: [
		"Recognize this is a query monitoring/performance diagnosis problem",
		"Check that pg_stat_statements is available in the extensions list",
		"Recommend enabling pg_stat_statements for query analysis",
		"Explain how to use it to find slow queries",
	],
};

describe("Extension Available - pg_stat_statements", () => {
	it("should recommend pg_stat_statements when available", async () => {
		const result = await runEval(scenario);

		console.log("Response:", result.response);
		console.log("Criteria results:", result.criteriaResults);

		// Response should mention pg_stat_statements
		expect(result.response.toLowerCase()).toContain("pg_stat_statements");

		// Should suggest enabling/using the extension
		const responseLower = result.response.toLowerCase();
		expect(
			responseLower.includes("create extension") ||
				responseLower.includes("enable") ||
				responseLower.includes("query"),
		).toBe(true);
	});
});
