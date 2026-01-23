import { describe, expect, it } from "vitest";
import { runEval } from "../runner.js";
import type { EvalScenario } from "../types.js";

const scenario: EvalScenario = {
	id: "n-plus-one-detection",
	name: "N+1 Query Detection",
	description:
		"Agent should identify N+1 query pattern in application code and recommend using JOINs or batch queries",
	category: "query-performance",
	difficulty: "intermediate",
	input: {
		schema: `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255)
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  title VARCHAR(200),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`,
		userQuery: `My API endpoint is slow. Here's the code:

\`\`\`typescript
// Get all posts
const posts = await db.query('SELECT * FROM posts LIMIT 100');

// For each post, get the author
for (const post of posts) {
  const author = await db.query('SELECT * FROM users WHERE id = $1', [post.user_id]);
  post.author = author;
}
\`\`\`

This makes 101 database queries. How can I optimize it?`,
	},
	expectedOutput: {
		shouldRecommendRules: ["6.1"], // data-n-plus-one
		mustContain: ["join", "n+1"],
	},
	expectedReasoning: [
		"Identify the N+1 query pattern (1 query for posts + N queries for users)",
		"Recognize this as a common performance anti-pattern",
		"Recommend using a JOIN to fetch all data in a single query",
		"Optionally suggest using IN clause for batch fetching",
	],
};

describe("N+1 Query Detection", () => {
	it("should identify N+1 pattern and recommend JOIN", async () => {
		const result = await runEval(scenario);

		console.log("Response:", result.response);
		console.log("Criteria results:", result.criteriaResults);

		// Response should mention JOIN
		expect(result.response.toLowerCase()).toContain("join");

		// Response should explain the N+1 problem
		const responseLower = result.response.toLowerCase();
		expect(
			responseLower.includes("n+1") || responseLower.includes("n + 1"),
		).toBe(true);
	});
});
