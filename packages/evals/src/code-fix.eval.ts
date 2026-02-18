import assert from "node:assert";
import { generateText } from "ai";
import { Eval } from "braintrust";
import { dataset } from "./dataset.js";
import type { EvalModelConfig } from "./models.config.js";
import { EVAL_MODELS } from "./models.config.js";
import { getProxyModel } from "./models.js";
import {
	buildCodeFixPrompt,
	buildCodeFixSystemPrompt,
} from "./prompts/code-fix.js";
import {
	bestPracticeScorer,
	completenessScorer,
	correctnessScorer,
	minimalityScorer,
	regressionSafetyScorer,
} from "./scorer.js";

assert(process.env.BRAINTRUST_API_KEY, "BRAINTRUST_API_KEY is not set");
assert(process.env.ANTHROPIC_API_KEY, "ANTHROPIC_API_KEY is not set");

/**
 * Resolve which models to run based on environment:
 * - EVAL_MODEL set → single model only (local dev / cost control)
 * - CI without EVAL_ALL_MODELS → ci:true models only
 * - Otherwise → all models
 */
function getModelsToRun(): EvalModelConfig[] {
	const singleModel = process.env.EVAL_MODEL;
	if (singleModel) {
		const found = EVAL_MODELS.find((m) => m.id === singleModel);
		return [
			found ?? {
				id: singleModel,
				label: singleModel,
				provider: "unknown",
				ci: false,
			},
		];
	}

	if (process.env.CI && !process.env.EVAL_ALL_MODELS) {
		return EVAL_MODELS.filter((m) => m.ci);
	}

	return EVAL_MODELS;
}

const models = getModelsToRun();

for (const modelConfig of models) {
	Eval("CodeFix", {
		experimentName: modelConfig.id,
		projectId: process.env.BRAINTRUST_PROJECT_ID,
		trialCount: process.env.CI ? 3 : 1,
		metadata: {
			model: modelConfig.id,
			label: modelConfig.label,
			provider: modelConfig.provider,
		},
		data: () => dataset(),
		task: async (input) => {
			const model = getProxyModel(modelConfig.id);
			const response = await generateText({
				model,
				system: buildCodeFixSystemPrompt(),
				prompt: buildCodeFixPrompt(input.testCase),
				temperature: 0.2,
				maxRetries: 2,
			});
			return { llmOutput: response.text };
		},
		scores: [
			correctnessScorer,
			completenessScorer,
			bestPracticeScorer,
			regressionSafetyScorer,
			minimalityScorer,
		],
	});
}
