/**
 * Parser for Claude Code transcript format.
 * Claude Code stores transcripts as JSONL at ~/.claude/projects/{path}/{session}.jsonl
 *
 * Format reference (based on Claude Code CLI output):
 * - Messages have type: "user" | "assistant"
 * - Tool use appears in assistant messages with tool_use blocks
 * - Tool results appear as separate messages with type: "tool_result"
 *
 * Adapted from https://github.com/vercel-labs/agent-eval
 */

/** Canonical tool names. */
export type ToolName =
	| "file_read"
	| "file_write"
	| "file_edit"
	| "shell"
	| "web_fetch"
	| "web_search"
	| "glob"
	| "grep"
	| "list_dir"
	| "agent_task"
	| "skill"
	| "unknown";

/** A single event in the parsed transcript. */
export interface TranscriptEvent {
	/** ISO timestamp of the event */
	timestamp?: string;
	/** Event type */
	type: "message" | "tool_call" | "tool_result" | "thinking" | "error";
	/** For message events: the role */
	role?: "user" | "assistant" | "system";
	/** Text content (for messages, thinking, errors) */
	content?: string;
	/** For tool_call and tool_result events */
	tool?: {
		name: ToolName;
		originalName: string;
		args?: Record<string, unknown>;
		result?: unknown;
		durationMs?: number;
		success?: boolean;
	};
	/** Raw event data from the agent (for debugging) */
	raw?: unknown;
}

function normalizeToolName(name: string): ToolName {
	const toolMap: Record<string, ToolName> = {
		// File operations
		Read: "file_read",
		read_file: "file_read",
		ReadFile: "file_read",
		Write: "file_write",
		write_file: "file_write",
		WriteFile: "file_write",
		write_to_file: "file_write",
		Edit: "file_edit",
		edit_file: "file_edit",
		EditFile: "file_edit",
		str_replace_editor: "file_edit",
		StrReplace: "file_edit",
		// Shell
		Bash: "shell",
		bash: "shell",
		Shell: "shell",
		shell: "shell",
		execute_command: "shell",
		run_command: "shell",
		// Web
		WebFetch: "web_fetch",
		web_fetch: "web_fetch",
		fetch_url: "web_fetch",
		mcp__fetch__fetch: "web_fetch",
		WebSearch: "web_search",
		web_search: "web_search",
		// Search/navigation
		Glob: "glob",
		glob: "glob",
		list_files: "glob",
		Grep: "grep",
		grep: "grep",
		search_files: "grep",
		LS: "list_dir",
		list_dir: "list_dir",
		ListDir: "list_dir",
		// Agent/subagent tools
		Task: "agent_task",
		task: "agent_task",
		// Skills
		Skill: "skill",
		skill: "skill",
	};

	return toolMap[name] || "unknown";
}

function extractFilePath(args: Record<string, unknown>): string | undefined {
	return (args.path || args.file_path || args.filename || args.file) as
		| string
		| undefined;
}

function extractUrl(args: Record<string, unknown>): string | undefined {
	return (args.url || args.uri || args.href) as string | undefined;
}

function extractCommand(args: Record<string, unknown>): string | undefined {
	if (typeof args.command === "string") return args.command;
	if (Array.isArray(args.command)) return args.command.join(" ");
	if (typeof args.cmd === "string") return args.cmd;
	return undefined;
}

/**
 * Get the content array from data, handling nested message format.
 * Claude Code wraps messages: { type: "assistant", message: { content: [...] } }
 */
function getContentArray(data: Record<string, unknown>): unknown[] | undefined {
	if (Array.isArray(data.content)) return data.content;
	const message = data.message as Record<string, unknown> | undefined;
	if (message && Array.isArray(message.content)) return message.content;
	return undefined;
}

function getStringContent(data: Record<string, unknown>): string | undefined {
	if (typeof data.content === "string") return data.content;
	const message = data.message as Record<string, unknown> | undefined;
	if (message && typeof message.content === "string") return message.content;
	return undefined;
}

function extractContent(data: Record<string, unknown>): string | undefined {
	const stringContent = getStringContent(data);
	if (stringContent) return stringContent;

	const contentArray = getContentArray(data);
	if (contentArray) {
		const textBlocks = contentArray.filter(
			(block: unknown) =>
				(block as Record<string, unknown>).type === "text",
		);
		if (textBlocks.length > 0) {
			return textBlocks
				.map((b: unknown) => (b as Record<string, unknown>).text)
				.join("\n");
		}
	}

	if (typeof data.text === "string") return data.text;
	return undefined;
}

function extractToolUses(
	data: Record<string, unknown>,
): Array<{ name: string; input?: Record<string, unknown>; args?: Record<string, unknown> }> {
	const toolUses: Array<{
		name: string;
		input?: Record<string, unknown>;
		args?: Record<string, unknown>;
	}> = [];

	const contentArray = getContentArray(data);
	if (contentArray) {
		for (const block of contentArray) {
			const b = block as Record<string, unknown>;
			if (b.type === "tool_use") {
				toolUses.push({
					name: b.name as string,
					input: b.input as Record<string, unknown> | undefined,
				});
			}
		}
	}

	// Also handle OpenAI-style tool_calls array
	const toolCalls =
		data.tool_calls ||
		(data.message as Record<string, unknown>)?.tool_calls;
	if (Array.isArray(toolCalls)) {
		for (const call of toolCalls) {
			const c = call as Record<string, unknown>;
			const func = c.function as Record<string, unknown> | undefined;
			toolUses.push({
				name: (func?.name || c.name) as string,
				args: func?.arguments
					? JSON.parse(func.arguments as string)
					: ((c.arguments || c.input) as
							| Record<string, unknown>
							| undefined),
			});
		}
	}

	return toolUses;
}

function extractThinking(data: Record<string, unknown>): string | undefined {
	const contentArray = getContentArray(data);
	if (contentArray) {
		const thinkingBlocks = contentArray.filter(
			(block: unknown) =>
				(block as Record<string, unknown>).type === "thinking",
		);
		if (thinkingBlocks.length > 0) {
			return thinkingBlocks
				.map((b: unknown) => {
					const block = b as Record<string, unknown>;
					return block.thinking || block.text;
				})
				.join("\n");
		}
	}
	return undefined;
}

function parseClaudeCodeLine(line: string): TranscriptEvent[] {
	const events: TranscriptEvent[] = [];

	try {
		const data = JSON.parse(line);

		if (data.type === "user" || data.role === "user") {
			const contentArray = getContentArray(data);
			const toolResults = contentArray?.filter(
				(block: unknown) =>
					(block as Record<string, unknown>).type === "tool_result",
			);

			if (toolResults && toolResults.length > 0) {
				for (const result of toolResults) {
					const r = result as Record<string, unknown>;
					events.push({
						timestamp: data.timestamp,
						type: "tool_result",
						tool: {
							name: "unknown",
							originalName: (r.tool_use_id || "unknown") as string,
							result: r.content,
							success: !r.is_error && !r.error,
						},
						raw: r,
					});
				}
			} else {
				events.push({
					timestamp: data.timestamp,
					type: "message",
					role: "user",
					content: extractContent(data),
					raw: data,
				});
			}
		} else if (data.type === "assistant" || data.role === "assistant") {
			const content = extractContent(data);
			if (content) {
				events.push({
					timestamp: data.timestamp,
					type: "message",
					role: "assistant",
					content,
					raw: data,
				});
			}

			for (const toolUse of extractToolUses(data)) {
				events.push({
					timestamp: data.timestamp,
					type: "tool_call",
					tool: {
						name: normalizeToolName(toolUse.name),
						originalName: toolUse.name,
						args: toolUse.input || toolUse.args || {},
					},
					raw: toolUse,
				});
			}

			const thinking = extractThinking(data);
			if (thinking) {
				events.push({
					timestamp: data.timestamp,
					type: "thinking",
					content: thinking,
					raw: data,
				});
			}
		} else if (
			data.type === "tool_result" ||
			data.type === "tool_response"
		) {
			events.push({
				timestamp: data.timestamp,
				type: "tool_result",
				tool: {
					name: "unknown",
					originalName: data.tool_use_id || "unknown",
					result: data.content || data.output || data.result,
					success: !data.is_error && !data.error,
				},
				raw: data,
			});
		} else if (data.type === "system" || data.role === "system") {
			events.push({
				timestamp: data.timestamp,
				type: "message",
				role: "system",
				content: extractContent(data),
				raw: data,
			});
		} else if (data.type === "error" || data.error) {
			events.push({
				timestamp: data.timestamp,
				type: "error",
				content:
					data.error?.message ||
					data.message ||
					JSON.stringify(data.error),
				raw: data,
			});
		}
	} catch {
		// Skip unparseable lines
	}

	return events;
}

/** Parse a Claude Code JSONL transcript into a flat list of events. */
export function parseClaudeCodeTranscript(raw: string): {
	events: TranscriptEvent[];
	errors: string[];
} {
	const events: TranscriptEvent[] = [];
	const errors: string[] = [];

	for (const line of raw.split("\n").filter((l) => l.trim())) {
		try {
			events.push(...parseClaudeCodeLine(line));
		} catch (e) {
			errors.push(
				`Failed to parse line: ${e instanceof Error ? e.message : String(e)}`,
			);
		}
	}

	// Post-process: extract metadata from tool args
	for (const event of events) {
		if (event.type === "tool_call" && event.tool) {
			const args = event.tool.args || {};

			if (["file_read", "file_write", "file_edit"].includes(event.tool.name)) {
				const filePath = extractFilePath(args);
				if (filePath) event.tool.args = { ...args, _extractedPath: filePath };
			}

			if (event.tool.name === "web_fetch") {
				const url = extractUrl(args);
				if (url) event.tool.args = { ...args, _extractedUrl: url };
			}

			if (event.tool.name === "shell") {
				const command = extractCommand(args);
				if (command) event.tool.args = { ...args, _extractedCommand: command };
			}
		}
	}

	return { events, errors };
}
