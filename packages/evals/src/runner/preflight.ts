import { execFileSync } from "node:child_process";

/**
 * Verify the host environment has everything needed before spending
 * API credits on an eval run.
 *
 * Checks: Node >= 20, Docker running, claude CLI available.
 */
export function preflight(): void {
	const errors: string[] = [];

	// Node.js >= 20
	const [major] = process.versions.node.split(".").map(Number);
	if (major < 20) {
		errors.push(`Node.js >= 20 required (found ${process.versions.node})`);
	}

	// Docker daemon running
	try {
		execFileSync("docker", ["info"], { stdio: "ignore", timeout: 10_000 });
	} catch {
		errors.push("Docker is not running (required by supabase CLI)");
	}

	// Claude CLI available
	try {
		execFileSync("claude", ["--version"], {
			stdio: "ignore",
			timeout: 10_000,
		});
	} catch {
		errors.push("claude CLI not found on PATH");
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
