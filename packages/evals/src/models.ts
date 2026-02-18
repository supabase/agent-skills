import type { AnthropicProvider } from "@ai-sdk/anthropic";
import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/** Model ID accepted by the Anthropic provider (string literal union + string). */
export type AnthropicModelId = Parameters<AnthropicProvider["chat"]>[0];

/**
 * Braintrust AI proxy — routes to any provider (Anthropic, OpenAI, Google)
 * via a single OpenAI-compatible endpoint.
 *
 * Provider API keys are configured in the Braintrust dashboard at
 * project or org level. The x-bt-parent header scopes the request to
 * the project so project-level keys are resolved.
 */
const braintrustProxy = createOpenAI({
	baseURL: "https://api.braintrust.dev/v1/proxy",
	apiKey: process.env.BRAINTRUST_API_KEY ?? "",
	headers: process.env.BRAINTRUST_PROJECT_ID
		? { "x-bt-parent": `project_id:${process.env.BRAINTRUST_PROJECT_ID}` }
		: undefined,
});

/**
 * Get a model for the eval task. Claude models use the Anthropic SDK
 * directly (via ANTHROPIC_API_KEY). All other models route through the
 * Braintrust proxy (keys configured at the org level in Braintrust).
 */
export function getProxyModel(modelId: string): LanguageModel {
	if (modelId.startsWith("claude")) {
		return anthropic(modelId as AnthropicModelId);
	}
	return braintrustProxy(modelId);
}

/**
 * Get a model using direct provider SDKs. Used for the judge model which
 * is always Claude and uses ANTHROPIC_API_KEY directly (no proxy).
 */
export function getModel(modelId: string): LanguageModel {
	if (modelId.startsWith("claude")) {
		return anthropic(modelId as AnthropicModelId);
	}

	return getProxyModel(modelId);
}

export function getJudgeModel(): LanguageModel {
	const judgeModelId = process.env.EVAL_JUDGE_MODEL || "claude-opus-4-6";
	return getModel(judgeModelId);
}
