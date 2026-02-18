import assert from "node:assert";
import { generateText } from "ai";
import { Eval } from "braintrust";
import { dataset } from "./dataset.js";
import { getModel } from "./models.js";
import {
	buildCodeFixPrompt,
	buildCodeFixSystemPrompt,
} from "./prompts/code-fix.js";
import {
	bestPracticeScorer,
	completenessScorer,
	correctnessScorer,
} from "./scorer.js";

assert(process.env.ANTHROPIC_API_KEY, "ANTHROPIC_API_KEY is not set");

const modelId = process.env.EVAL_MODEL || "claude-sonnet-4-5-20250929";

Eval("CodeFix", {
	projectId: process.env.BRAINTRUST_PROJECT_ID,
	trialCount: process.env.CI ? 3 : 1,
	data: () => dataset(),
	task: async (input) => {
		const model = getModel(modelId);
		const response = await generateText({
			model,
			system: buildCodeFixSystemPrompt(),
			prompt: buildCodeFixPrompt(input.testCase),
			temperature: 0.2,
			maxRetries: 2,
		});
		return { llmOutput: response.text };
	},
	scores: [correctnessScorer, completenessScorer, bestPracticeScorer],
});
