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
}

export interface TranscriptSummary {
	totalTurns: number;
	totalDurationMs: number;
	totalCostUsd: number | null;
	model: string | null;
	toolCalls: ToolCallSummary[];
	finalOutput: string;
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

/** Walk parsed events to build a transcript summary. */
export function buildTranscriptSummary(
	events: TranscriptEvent[],
): TranscriptSummary {
	const toolCalls: ToolCallSummary[] = [];
	let finalOutput = "";
	let totalDurationMs = 0;
	let totalCostUsd: number | null = null;
	let model: string | null = null;
	let totalTurns = 0;

	for (const event of events) {
		const e = event as Record<string, unknown>;

		// System init: extract model
		if (e.type === "system" && e.subtype === "init") {
			model = typeof e.model === "string" ? e.model : null;
		}

		// Assistant messages: extract tool_use blocks
		if (e.type === "assistant") {
			const msg = e.message as Record<string, unknown> | undefined;
			const content = msg?.content;
			if (Array.isArray(content)) {
				for (const block of content) {
					if (block.type === "tool_use") {
						toolCalls.push({
							tool: block.name ?? "unknown",
							toolUseId: block.id ?? "",
							input: block.input ?? {},
							outputPreview: "",
						});
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
						}
					}
				}
			}
		}

		// Result event: final output, cost, duration, turns
		if (e.type === "result") {
			finalOutput = typeof e.result === "string" ? e.result : "";
			totalDurationMs = typeof e.duration_ms === "number" ? e.duration_ms : 0;
			totalCostUsd =
				typeof e.total_cost_usd === "number" ? e.total_cost_usd : null;
			totalTurns = typeof e.num_turns === "number" ? e.num_turns : 0;
		}
	}

	return {
		totalTurns,
		totalDurationMs,
		totalCostUsd,
		model,
		toolCalls,
		finalOutput,
	};
}
