import type { AnthropicProvider } from "@ai-sdk/anthropic";
import { anthropic } from "@ai-sdk/anthropic";
import type { OpenAIProvider } from "@ai-sdk/openai";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/** Model ID accepted by the Anthropic provider (string literal union + string). */
export type AnthropicModelId = Parameters<AnthropicProvider["chat"]>[0];

/** Model ID accepted by the OpenAI provider (string literal union + string). */
export type OpenAIModelId = Parameters<OpenAIProvider["chat"]>[0];

/** Any model ID accepted by the eval harness. */
export type SupportedModelId = AnthropicModelId | OpenAIModelId;

const MODEL_MAP: Record<string, () => LanguageModel> = {
	"claude-opus-4-6": () => anthropic("claude-opus-4-6"),
	"claude-sonnet-4-5-20250929": () => anthropic("claude-sonnet-4-5-20250929"),
	"claude-haiku-4-5-20251001": () => anthropic("claude-haiku-4-5-20251001"),
	"claude-opus-4-5-20251101": () => anthropic("claude-opus-4-5-20251101"),
	"claude-sonnet-4-20250514": () => anthropic("claude-sonnet-4-20250514"),
	"gpt-4o": () => openai("gpt-4o"),
	"gpt-4o-mini": () => openai("gpt-4o-mini"),
	"o3-mini": () => openai("o3-mini"),
};

export function getModel(modelId: SupportedModelId): LanguageModel {
	const factory = MODEL_MAP[modelId];
	if (factory) return factory();

	// Fall back to provider detection from model ID prefix
	if (modelId.startsWith("claude")) {
		return anthropic(modelId as AnthropicModelId);
	}
	if (
		modelId.startsWith("gpt") ||
		modelId.startsWith("o1") ||
		modelId.startsWith("o3")
	) {
		return openai(modelId as OpenAIModelId);
	}

	throw new Error(
		`Unknown model: ${modelId}. Available: ${Object.keys(MODEL_MAP).join(", ")}`,
	);
}

export function getJudgeModel(): LanguageModel {
	const judgeModelId = process.env.EVAL_JUDGE_MODEL || "claude-opus-4-6";
	return getModel(judgeModelId);
}
