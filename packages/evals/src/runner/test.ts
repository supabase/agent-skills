import { execFile } from "node:child_process";
import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const exec = promisify(execFile);

export interface TestResult {
	passed: boolean;
	output: string;
	/** Number of tests that passed */
	passedCount: number;
	/** Total number of tests */
	totalCount: number;
}

/**
 * Run the hidden EVAL.ts tests against the agent's workspace.
 *
 * 1. Copy EVAL.ts into the workspace (agent is done, safe to expose)
 * 2. Run vitest against it
 * 3. Parse the output for pass/fail
 */
export async function runTests(opts: {
	workspacePath: string;
	evalFilePath: string;
}): Promise<TestResult> {
	// Copy the hidden test file into the workspace
	const evalFileName = opts.evalFilePath.endsWith(".tsx")
		? "EVAL.tsx"
		: "EVAL.ts";
	const destPath = join(opts.workspacePath, evalFileName);
	copyFileSync(opts.evalFilePath, destPath);

	// Write a minimal vitest config that overrides the default include pattern
	// so EVAL.ts (without .test. or .spec.) is picked up.
	const vitestConfigPath = join(opts.workspacePath, "vitest.config.mjs");
	if (!existsSync(vitestConfigPath)) {
		writeFileSync(
			vitestConfigPath,
			`export default { test: { include: ["EVAL.{ts,tsx}"] } };\n`,
		);
	}

	// Use the vitest binary from the evals package (always available)
	const evalsVitest = join(
		__dirname,
		"..",
		"..",
		"node_modules",
		".bin",
		"vitest",
	);
	const vitestBin = join(opts.workspacePath, "node_modules", ".bin", "vitest");
	const cmd = existsSync(vitestBin) ? vitestBin : evalsVitest;
	const args = ["run", evalFileName, "--reporter=verbose", "--no-color"];

	try {
		const { stdout, stderr } = await exec(cmd, args, {
			cwd: opts.workspacePath,
			timeout: 60_000,
			env: { ...process.env },
			maxBuffer: 5 * 1024 * 1024,
		});

		const output = `${stdout}\n${stderr}`;
		return parseTestOutput(output);
	} catch (error) {
		const err = error as Error & { stdout?: string; stderr?: string };
		const output = `${err.stdout ?? ""}\n${err.stderr ?? ""}`;
		return parseTestOutput(output);
	}
}

function parseTestOutput(output: string): TestResult {
	// Parse vitest output for pass/fail counts
	// Format: "Tests  N passed (M)" or "Tests  N failed | M passed (T)"
	const testsLine = output.match(
		/Tests\s+(?:(\d+)\s+failed\s+\|\s+)?(\d+)\s+passed\s+\((\d+)\)/,
	);

	let passedCount = 0;
	let totalCount = 0;

	if (testsLine) {
		passedCount = Number.parseInt(testsLine[2], 10);
		totalCount = Number.parseInt(testsLine[3], 10);
	}

	const passed = totalCount > 0 && passedCount === totalCount;

	return { passed, output, passedCount, totalCount };
}
