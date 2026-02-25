import { execFileSync } from "node:child_process";
import { accessSync, constants, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Detect if we're running inside the eval Docker container. */
export function isRunningInDocker(): boolean {
	if (process.env.IN_DOCKER === "true") return true;
	try {
		accessSync("/.dockerenv", constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Resolve the `claude` binary path.
 *
 * Looks in the following order:
 * 1. Local node_modules/.bin/claude (installed via @anthropic-ai/claude-code)
 * 2. Global `claude` on PATH
 *
 * Throws with an actionable message when neither is found.
 */
export function resolveClaudeBin(): string {
	// packages/evals/node_modules/.bin/claude
	const localBin = join(
		__dirname,
		"..",
		"..",
		"node_modules",
		".bin",
		"claude",
	);
	if (existsSync(localBin)) {
		return localBin;
	}

	// Fall back to PATH
	try {
		execFileSync("claude", ["--version"], {
			stdio: "ignore",
			timeout: 10_000,
		});
		return "claude";
	} catch {
		throw new Error(
			[
				"claude CLI not found.",
				"",
				"Install it in one of these ways:",
				"  npm install          (uses @anthropic-ai/claude-code from package.json)",
				"  npm i -g @anthropic-ai/claude-code",
				"",
				"Ensure ANTHROPIC_API_KEY is set in the environment.",
			].join("\n"),
		);
	}
}

/**
 * Verify the host environment has everything needed before spending
 * API credits on an eval run.
 *
 * Checks: Node >= 20, Docker running, supabase CLI available, claude CLI available, API key set.
 */
export function preflight(): void {
	const errors: string[] = [];

	// Node.js >= 20
	const [major] = process.versions.node.split(".").map(Number);
	if (major < 20) {
		errors.push(`Node.js >= 20 required (found ${process.versions.node})`);
	}

	// Docker daemon must be running — needed by the supabase CLI to manage containers.
	// Required whether running locally or inside the eval container (socket-mounted).
	try {
		execFileSync("docker", ["info"], { stdio: "ignore", timeout: 10_000 });
	} catch {
		errors.push(
			isRunningInDocker()
				? "Docker daemon not reachable inside container. Mount the socket: -v /var/run/docker.sock:/var/run/docker.sock"
				: "Docker is not running (required by supabase CLI)",
		);
	}

	// Supabase CLI available
	try {
		execFileSync("supabase", ["--version"], {
			stdio: "ignore",
			timeout: 10_000,
		});
	} catch {
		errors.push(
			"supabase CLI not found. Install it: https://supabase.com/docs/guides/cli/getting-started",
		);
	}

	// Claude CLI available
	try {
		resolveClaudeBin();
	} catch (err) {
		errors.push((err as Error).message);
	}

	// API key
	if (!process.env.ANTHROPIC_API_KEY) {
		errors.push(
			"ANTHROPIC_API_KEY is not set. Claude Code requires this for authentication.",
		);
	}

	if (errors.length > 0) {
		console.error("Preflight checks failed:\n");
		for (const e of errors) {
			console.error(`  - ${e}`);
		}
		console.error("");
		process.exit(1);
	}
}
