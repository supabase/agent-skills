export interface EvalModelConfig {
	/** Model ID passed to the Braintrust proxy */
	id: string;
	/** Human-readable label for dashboards */
	label: string;
	/** Provider name for display/grouping */
	provider: string;
	/** Whether to include in CI runs by default */
	ci: boolean;
}

/**
 * Models to evaluate. Add/remove entries to change the eval matrix.
 * Set `ci: false` to exclude expensive models from automated CI runs.
 */
export const EVAL_MODELS: EvalModelConfig[] = [
	{
		id: "claude-sonnet-4-5-20250929",
		label: "Claude Sonnet 4.5",
		provider: "anthropic",
		ci: true,
	},
	{
		id: "gpt-5.3",
		label: "GPT 5.3",
		provider: "openai",
		ci: true,
	},
	{
		id: "gpt-5.2",
		label: "GPT 5.2",
		provider: "openai",
		ci: true,
	},
	{
		id: "gemini-3-pro",
		label: "Gemini 3.0 Pro",
		provider: "google",
		ci: true,
	},
	{
		id: "claude-opus-4-6",
		label: "Claude Opus 4.6",
		provider: "anthropic",
		ci: false,
	},
];
