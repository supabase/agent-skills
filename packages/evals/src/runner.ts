import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { runAgent } from "./runner/agent.js";
import { uploadToBraintrust } from "./runner/braintrust.js";
import { createResultDir, saveRunArtifacts } from "./runner/persist.js";
import { preflight } from "./runner/preflight.js";
import { listModifiedFiles, printSummary } from "./runner/results.js";
import { createWorkspace } from "./runner/scaffold.js";
import { runTests } from "./runner/test.js";
import { buildTranscriptSummary } from "./runner/transcript.js";
import type { EvalRunResult, EvalScenario } from "./types.js";

// ---------------------------------------------------------------------------
// Configuration from environment
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const AGENT_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const model = process.env.EVAL_MODEL ?? DEFAULT_MODEL;
const scenarioFilter = process.env.EVAL_SCENARIO;
const isBaseline = process.env.EVAL_BASELINE === "true";
const skillEnabled = !isBaseline;

// Run-level timestamp shared across all scenarios in a single invocation
const runTimestamp = new Date()
	.toISOString()
	.replace(/[:.]/g, "-")
	.replace("Z", "");

// ---------------------------------------------------------------------------
// Discover scenarios
// ---------------------------------------------------------------------------

function findEvalsDir(): string {
	let dir = process.cwd();
	for (let i = 0; i < 10; i++) {
		const candidate = join(dir, "packages", "evals", "evals");
		if (existsSync(candidate)) return candidate;
		const parent = resolve(dir, "..");
		if (parent === dir) break;
		dir = parent;
	}
	throw new Error("Could not find packages/evals/evals/ directory");
}

function discoverScenarios(): EvalScenario[] {
	const evalsDir = findEvalsDir();
	const dirs = readdirSync(evalsDir, { withFileTypes: true }).filter(
		(d) => d.isDirectory() && existsSync(join(evalsDir, d.name, "PROMPT.md")),
	);

	return dirs.map((d) => ({
		id: d.name,
		name: d.name,
		tags: [],
	}));
}

// ---------------------------------------------------------------------------
// Run a single eval
// ---------------------------------------------------------------------------

async function runEval(
	scenario: EvalScenario,
	skillEnabled: boolean,
): Promise<EvalRunResult> {
	const evalsDir = findEvalsDir();
	const evalDir = join(evalsDir, scenario.id);
	const variant = skillEnabled ? "with-skill" : "baseline";

	console.log(`\n--- ${scenario.id} (${variant}) ---`);

	// 1. Create isolated workspace
	const { workspacePath, cleanup } = createWorkspace({
		evalDir,
		skillEnabled,
	});
	console.log(`  Workspace: ${workspacePath}`);

	try {
		// 2. Read the prompt
		const prompt = readFileSync(join(evalDir, "PROMPT.md"), "utf-8").trim();

		// 3. Run the agent
		console.log(`  Running agent (${model})...`);
		const agentResult = await runAgent({
			cwd: workspacePath,
			prompt,
			model,
			timeout: AGENT_TIMEOUT,
			skillEnabled,
		});
		console.log(
			`  Agent finished in ${(agentResult.duration / 1000).toFixed(1)}s`,
		);

		// 4. Run the hidden tests
		const evalFilePath = existsSync(join(evalDir, "EVAL.tsx"))
			? join(evalDir, "EVAL.tsx")
			: join(evalDir, "EVAL.ts");

		console.log("  Running tests...");
		const testResult = await runTests({
			workspacePath,
			evalFilePath,
		});
		console.log(
			`  Tests: ${testResult.passedCount}/${testResult.totalCount} passed`,
		);

		// 5. Collect modified files
		const filesModified = listModifiedFiles(workspacePath, evalDir);

		// 6. Build transcript summary
		const summary = buildTranscriptSummary(agentResult.events);

		const result: EvalRunResult = {
			scenario: scenario.id,
			agent: "claude-code",
			model,
			skillEnabled,
			status: testResult.passed ? "passed" : "failed",
			duration: agentResult.duration,
			testOutput: testResult.output,
			agentOutput: agentResult.output,
			testsPassed: testResult.passedCount,
			testsTotal: testResult.totalCount,
			filesModified,
			toolCallCount: summary.toolCalls.length,
			costUsd: summary.totalCostUsd ?? undefined,
		};

		// 7. Persist results
		const resultDir = createResultDir(runTimestamp, scenario.id, variant);
		result.resultsDir = resultDir;
		saveRunArtifacts({
			resultDir,
			rawTranscript: agentResult.rawTranscript,
			testOutput: testResult.output,
			result,
			transcriptSummary: summary,
		});

		return result;
	} catch (error) {
		const err = error as Error;
		return {
			scenario: scenario.id,
			agent: "claude-code",
			model,
			skillEnabled,
			status: "error",
			duration: 0,
			testOutput: "",
			agentOutput: "",
			testsPassed: 0,
			testsTotal: 0,
			filesModified: [],
			error: err.message,
		};
	} finally {
		cleanup();
	}
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	preflight();

	console.log("Supabase Skills Evals");
	console.log(`Model: ${model}`);
	console.log(`Mode: ${isBaseline ? "baseline (no skills)" : "with skills"}`);

	let scenarios = discoverScenarios();

	if (scenarioFilter) {
		scenarios = scenarios.filter((s) => s.id === scenarioFilter);
		if (scenarios.length === 0) {
			console.error(`Scenario not found: ${scenarioFilter}`);
			process.exit(1);
		}
	}

	console.log(`Scenarios: ${scenarios.map((s) => s.id).join(", ")}`);

	const results: EvalRunResult[] = [];

	for (const scenario of scenarios) {
		const result = await runEval(scenario, skillEnabled);
		results.push(result);
	}

	// Use the results dir from the first result (all share the same timestamp)
	const resultsDir = results.find((r) => r.resultsDir)?.resultsDir;
	printSummary(results, resultsDir);

	if (process.env.BRAINTRUST_UPLOAD === "true") {
		console.log("\nUploading to Braintrust...");
		await uploadToBraintrust(results);
	}
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
