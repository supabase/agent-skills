import { basename } from "node:path";

export interface TranscriptEvent {
	type: string;
	[key: string]: unknown;
}

export interface ToolCallSummary {
	tool: string;
	toolUseId: string;
	input: Record<string, unknown>;
	/** First ~200 chars of output for quick scanning */
	outputPreview: string;
	/** Whether the tool call returned an error */
	isError: boolean;
	/** stderr output for Bash tool calls */
	stderr: string;
}

export interface ModelUsage {
	inputTokens: number;
	outputTokens: number;
	cacheReadInputTokens: number;
	cacheCreationInputTokens: number;
	costUSD: number;
}

export interface TranscriptSummary {
	totalTurns: number;
	totalDurationMs: number;
	/** API-only latency (excludes local processing overhead) */
	totalDurationApiMs: number;
	totalCostUsd: number | null;
	model: string | null;
	toolCalls: ToolCallSummary[];
	finalOutput: string;
	/** Skills listed in the system init event (loaded into agent context) */
	skills: string[];
	/** Basenames of reference files the agent read via the Read tool */
	referenceFilesRead: string[];
	/** Per-model token usage and cost breakdown */
	modelUsage: Record<string, ModelUsage>;
	totalInputTokens: number;
	totalOutputTokens: number;
	totalCacheReadTokens: number;
	totalCacheCreationTokens: number;
	/** Count of tool calls that returned is_error === true */
	toolErrorCount: number;
	/** Whether the overall session ended in an error */
	isError: boolean;
	/** Count of permission_denials in the result event */
	permissionDenialCount: number;
}

/** Parse a single NDJSON line. Returns null on empty or invalid input. */
export function parseStreamJsonLine(line: string): TranscriptEvent | null {
	const trimmed = line.trim();
	if (!trimmed) return null;
	try {
		return JSON.parse(trimmed) as TranscriptEvent;
	} catch {
		return null;
	}
}

/** Parse raw NDJSON stdout into an array of events. */
export function parseStreamJsonOutput(raw: string): TranscriptEvent[] {
	const events: TranscriptEvent[] = [];
	for (const line of raw.split("\n")) {
		const event = parseStreamJsonLine(line);
		if (event) events.push(event);
	}
	return events;
}

/** Extract the final text output from parsed events (for backward compat). */
export function extractFinalOutput(events: TranscriptEvent[]): string {
	// Prefer the result event
	for (const event of events) {
		if (event.type === "result") {
			const result = (event as Record<string, unknown>).result;
			if (typeof result === "string") return result;
		}
	}

	// Fallback: concatenate text blocks from the last assistant message
	for (let i = events.length - 1; i >= 0; i--) {
		const event = events[i];
		if (event.type === "assistant") {
			const msg = (event as Record<string, unknown>).message as
				| Record<string, unknown>
				| undefined;
			const content = msg?.content;
			if (Array.isArray(content)) {
				const texts = content
					.filter(
						(b: Record<string, unknown>) =>
							b.type === "text" && typeof b.text === "string",
					)
					.map((b: Record<string, unknown>) => b.text as string);
				if (texts.length > 0) return texts.join("\n");
			}
		}
	}

	return "";
}

/** Return true if a file path points to a skill reference file. */
function isReferenceFilePath(filePath: string): boolean {
	return (
		filePath.includes("/.agents/skills/") && filePath.includes("/references/")
	);
}

/** Walk parsed events to build a transcript summary. */
export function buildTranscriptSummary(
	events: TranscriptEvent[],
): TranscriptSummary {
	const toolCalls: ToolCallSummary[] = [];
	let finalOutput = "";
	let totalDurationMs = 0;
	let totalDurationApiMs = 0;
	let totalCostUsd: number | null = null;
	let model: string | null = null;
	let totalTurns = 0;
	let skills: string[] = [];
	const referenceFilesRead: string[] = [];
	let modelUsage: Record<string, ModelUsage> = {};
	let totalInputTokens = 0;
	let totalOutputTokens = 0;
	let totalCacheReadTokens = 0;
	let totalCacheCreationTokens = 0;
	let toolErrorCount = 0;
	let isError = false;
	let permissionDenialCount = 0;

	for (const event of events) {
		const e = event as Record<string, unknown>;

		// System init: extract model and loaded skills
		if (e.type === "system" && e.subtype === "init") {
			model = typeof e.model === "string" ? e.model : null;
			if (Array.isArray(e.skills)) {
				skills = e.skills.filter((s): s is string => typeof s === "string");
			}
		}

		// Assistant messages: extract tool_use blocks
		if (e.type === "assistant") {
			const msg = e.message as Record<string, unknown> | undefined;
			const content = msg?.content;
			if (Array.isArray(content)) {
				for (const block of content) {
					if (block.type === "tool_use") {
						const toolCall: ToolCallSummary = {
							tool: block.name ?? "unknown",
							toolUseId: block.id ?? "",
							input: block.input ?? {},
							outputPreview: "",
							isError: false,
							stderr: "",
						};
						toolCalls.push(toolCall);

						// Track reference file reads
						if (
							block.name === "Read" &&
							typeof block.input?.file_path === "string" &&
							isReferenceFilePath(block.input.file_path)
						) {
							const base = basename(block.input.file_path);
							if (!referenceFilesRead.includes(base)) {
								referenceFilesRead.push(base);
							}
						}
					}
				}
			}
		}

		// User messages: extract tool_result blocks and match to tool calls
		if (e.type === "user") {
			const msg = e.message as Record<string, unknown> | undefined;
			const content = msg?.content;
			if (Array.isArray(content)) {
				for (const block of content) {
					if (block.type === "tool_result") {
						const matching = toolCalls.find(
							(tc) => tc.toolUseId === block.tool_use_id,
						);
						if (matching) {
							const text =
								typeof block.content === "string"
									? block.content
									: JSON.stringify(block.content);
							matching.outputPreview = text.slice(0, 200);

							// Capture error state from tool result
							if (block.is_error === true) {
								matching.isError = true;
								toolErrorCount++;
							}
						}
					}
				}
			}

			// Capture stderr from tool_use_result (Bash tool emits this at the user event level)
			const toolUseResult = e.tool_use_result as
				| Record<string, unknown>
				| undefined;
			if (toolUseResult && typeof toolUseResult.stderr === "string") {
				// Match to the most recent Bash tool call without stderr set
				const lastBash = [...toolCalls]
					.reverse()
					.find((tc) => tc.tool === "Bash" && !tc.stderr);
				if (lastBash) {
					lastBash.stderr = toolUseResult.stderr;
				}
			}
		}

		// Result event: final output, cost, duration, turns, token usage
		if (e.type === "result") {
			finalOutput = typeof e.result === "string" ? e.result : "";
			totalDurationMs = typeof e.duration_ms === "number" ? e.duration_ms : 0;
			totalDurationApiMs =
				typeof e.duration_api_ms === "number" ? e.duration_api_ms : 0;
			totalCostUsd =
				typeof e.total_cost_usd === "number" ? e.total_cost_usd : null;
			totalTurns = typeof e.num_turns === "number" ? e.num_turns : 0;
			isError = e.is_error === true;
			permissionDenialCount = Array.isArray(e.permission_denials)
				? e.permission_denials.length
				: 0;

			// Aggregate token usage from the result event's usage field
			const usage = e.usage as Record<string, unknown> | undefined;
			if (usage) {
				totalInputTokens =
					typeof usage.input_tokens === "number" ? usage.input_tokens : 0;
				totalOutputTokens =
					typeof usage.output_tokens === "number" ? usage.output_tokens : 0;
				totalCacheReadTokens =
					typeof usage.cache_read_input_tokens === "number"
						? usage.cache_read_input_tokens
						: 0;
				totalCacheCreationTokens =
					typeof usage.cache_creation_input_tokens === "number"
						? usage.cache_creation_input_tokens
						: 0;
			}

			// Per-model usage breakdown (modelUsage keyed by model name)
			const rawModelUsage = e.modelUsage as
				| Record<string, Record<string, unknown>>
				| undefined;
			if (rawModelUsage) {
				modelUsage = {};
				for (const [modelName, mu] of Object.entries(rawModelUsage)) {
					modelUsage[modelName] = {
						inputTokens:
							typeof mu.inputTokens === "number" ? mu.inputTokens : 0,
						outputTokens:
							typeof mu.outputTokens === "number" ? mu.outputTokens : 0,
						cacheReadInputTokens:
							typeof mu.cacheReadInputTokens === "number"
								? mu.cacheReadInputTokens
								: 0,
						cacheCreationInputTokens:
							typeof mu.cacheCreationInputTokens === "number"
								? mu.cacheCreationInputTokens
								: 0,
						costUSD: typeof mu.costUSD === "number" ? mu.costUSD : 0,
					};
				}
			}
		}
	}

	return {
		totalTurns,
		totalDurationMs,
		totalDurationApiMs,
		totalCostUsd,
		model,
		toolCalls,
		finalOutput,
		skills,
		referenceFilesRead,
		modelUsage,
		totalInputTokens,
		totalOutputTokens,
		totalCacheReadTokens,
		totalCacheCreationTokens,
		toolErrorCount,
		isError,
		permissionDenialCount,
	};
}
