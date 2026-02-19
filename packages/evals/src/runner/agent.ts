import { spawn } from "node:child_process";

export interface AgentRunResult {
	output: string;
	duration: number;
}

/**
 * Invoke Claude Code in print mode as a subprocess.
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
		"--output-format",
		"text",
		"--model",
		opts.model,
		"--no-session-persistence",
		"--dangerously-skip-permissions",
		"--tools",
		"Edit,Write,Bash,Read,Glob,Grep",
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

	return new Promise<AgentRunResult>((resolve) => {
		const child = spawn("claude", args, {
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
			resolve({
				output: stdout || stderr,
				duration: Date.now() - start,
			});
		});
	});
}
