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
	/** Per-test pass/fail extracted from vitest verbose output */
	individualTests: Record<string, boolean>;
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
	passThreshold?: number;
}): Promise<TestResult> {
	// Copy the hidden test file into the workspace
	const evalFileName = opts.evalFilePath.endsWith(".tsx")
		? "EVAL.tsx"
		: "EVAL.ts";
	const destPath = join(opts.workspacePath, evalFileName);
	copyFileSync(opts.evalFilePath, destPath);

	// Copy shared eval-utils.ts if it exists alongside the eval scenarios
	const evalUtilsSrc = join(
		dirname(dirname(opts.evalFilePath)),
		"eval-utils.ts",
	);
	if (existsSync(evalUtilsSrc)) {
		copyFileSync(evalUtilsSrc, join(opts.workspacePath, "eval-utils.ts"));
	}

	// Write a minimal vitest config that overrides the default include pattern
	// so EVAL.ts (without .test. or .spec.) is picked up.
	const vitestConfigPath = join(opts.workspacePath, "vitest.config.mjs");
	if (!existsSync(vitestConfigPath)) {
		// Alias ../eval-utils.ts → ./eval-utils.ts so the import resolves in
		// the flat workspace (source tree has EVAL.ts one level deeper).
		const evalUtilsDest = join(opts.workspacePath, "eval-utils.ts");
		const aliasBlock = existsSync(evalUtilsDest)
			? `resolve: { alias: { "../eval-utils.ts": "./eval-utils.ts" } },`
			: "";
		writeFileSync(
			vitestConfigPath,
			`export default { ${aliasBlock} test: { include: ["EVAL.{ts,tsx}"] } };\n`,
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
		return parseTestOutput(output, opts.passThreshold);
	} catch (error) {
		const err = error as Error & { stdout?: string; stderr?: string };
		const output = `${err.stdout ?? ""}\n${err.stderr ?? ""}`;
		return parseTestOutput(output, opts.passThreshold);
	}
}

/**
 * Extract per-test pass/fail from vitest verbose output.
 *
 * Vitest verbose format:
 *   ✓ EVAL.ts > test name here 0ms          → passed
 *   × EVAL.ts > test name here 2ms          → failed
 */
function parseIndividualTests(output: string): Record<string, boolean> {
	const results: Record<string, boolean> = {};
	const re = /[✓×]\s+EVAL\.tsx?\s+>\s+(.+?)\s+\d+ms/g;
	for (const match of output.matchAll(re)) {
		const testName = match[1].trim();
		const didPass = output[match.index] === "✓";
		results[testName] = didPass;
	}
	return results;
}

function parseTestOutput(output: string, passThreshold?: number): TestResult {
	// Parse vitest output for pass/fail counts
	// Vitest formats:
	//   All passing:  "Tests  N passed (N)"
	//   Mixed:        "Tests  N failed | M passed (T)"
	//   All failing:  "Tests  N failed (N)"
	const mixedOrPassing = output.match(
		/Tests\s+(?:(\d+)\s+failed\s+\|\s+)?(\d+)\s+passed\s+\((\d+)\)/,
	);
	const allFailing = output.match(/Tests\s+(\d+)\s+failed\s+\((\d+)\)/);

	let passedCount = 0;
	let totalCount = 0;

	if (mixedOrPassing) {
		passedCount = Number.parseInt(mixedOrPassing[2], 10);
		totalCount = Number.parseInt(mixedOrPassing[3], 10);
	} else if (allFailing) {
		passedCount = 0;
		totalCount = Number.parseInt(allFailing[2], 10);
	}

	const passed = passThreshold
		? totalCount > 0 && passedCount >= passThreshold
		: totalCount > 0 && passedCount === totalCount;
	const individualTests = parseIndividualTests(output);

	return { passed, output, passedCount, totalCount, individualTests };
}
