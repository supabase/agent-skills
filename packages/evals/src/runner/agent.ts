import { spawn } from "node:child_process";
import { resolveClaudeBin } from "./preflight.js";
import {
	extractFinalOutput,
	parseStreamJsonOutput,
	type TranscriptEvent,
} from "./transcript.js";

export interface AgentRunResult {
	/** Extracted final text output (backward-compatible). */
	output: string;
	duration: number;
	/** Raw NDJSON transcript string from stream-json. */
	rawTranscript: string;
	/** Parsed transcript events. */
	events: TranscriptEvent[];
}

/**
 * Invoke Claude Code in print mode as a subprocess.
 *
 * Uses --output-format stream-json to capture structured NDJSON events
 * including tool calls, results, and reasoning steps.
 *
 * The agent operates in the workspace directory and can read/write files.
 * When the skill is installed (symlinked into workspace), Claude Code
 * discovers it automatically and uses it for guidance.
 */
export async function runAgent(opts: {
	cwd: string;
	prompt: string;
	model: string;
	timeout: number;
	skillEnabled: boolean;
}): Promise<AgentRunResult> {
	const start = Date.now();

	const args = [
		"-p", // Print mode (non-interactive)
		"--verbose",
		"--output-format",
		"stream-json",
		"--model",
		opts.model,
		"--no-session-persistence",
		"--dangerously-skip-permissions",
		"--tools",
		"Edit,Write,Bash,Read,Glob,Grep",
		// Disable all MCP servers so the agent uses only local filesystem tools.
		// Without this, MCP tools from the parent env (e.g. Supabase, Neon)
		// leak in and the agent may apply migrations to a remote project
		// instead of creating local files.
		"--mcp-config",
		'{"mcpServers":{}}',
		"--strict-mcp-config",
	];

	// Disable skills for baseline runs so the agent relies on innate knowledge
	if (!opts.skillEnabled) {
		args.push("--disable-slash-commands");
	}

	const env = { ...process.env };
	// Remove all Claude-related env vars to avoid nested-session detection
	for (const key of Object.keys(env)) {
		if (key === "CLAUDECODE" || key.startsWith("CLAUDE_")) {
			delete env[key];
		}
	}

	const claudeBin = resolveClaudeBin();

	return new Promise<AgentRunResult>((resolve) => {
		const child = spawn(claudeBin, args, {
			cwd: opts.cwd,
			env,
			stdio: ["pipe", "pipe", "pipe"],
		});

		// Pipe prompt via stdin and close — this is the standard way to
		// pass multi-line prompts to `claude -p`.
		child.stdin.write(opts.prompt);
		child.stdin.end();

		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (d: Buffer) => {
			stdout += d.toString();
		});
		child.stderr.on("data", (d: Buffer) => {
			stderr += d.toString();
		});

		const timer = setTimeout(() => {
			child.kill();
		}, opts.timeout);

		child.on("close", () => {
			clearTimeout(timer);
			const rawTranscript = stdout || stderr;
			const events = parseStreamJsonOutput(rawTranscript);
			const output = extractFinalOutput(events) || rawTranscript;

			resolve({
				output,
				duration: Date.now() - start,
				rawTranscript,
				events,
			});
		});
	});
}
