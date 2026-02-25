import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { runAgent } from "./runner/agent.js";
import { uploadToBraintrust } from "./runner/braintrust.js";
import { createResultDir, saveRunArtifacts } from "./runner/persist.js";
import { preflight } from "./runner/preflight.js";
import { listModifiedFiles, printSummary } from "./runner/results.js";
import { createWorkspace } from "./runner/scaffold.js";
import {
	getKeys,
	resetDB,
	startSupabase,
	stopSupabase,
} from "./runner/supabase-setup.js";
import { runTests } from "./runner/test.js";
import {
	buildTranscriptSummary,
	type TranscriptSummary,
} from "./runner/transcript.js";
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
// Scenario threshold
// ---------------------------------------------------------------------------

function getPassThreshold(scenarioId: string): number | null {
	const scenariosDir = join(findEvalsDir(), "..", "scenarios");
	const scenarioFile = join(scenariosDir, `${scenarioId}.md`);
	if (!existsSync(scenarioFile)) return null;

	const content = readFileSync(scenarioFile, "utf-8");
	const match = content.match(/\*\*pass_threshold:\*\*\s*(\d+)/);
	return match ? Number.parseInt(match[1], 10) : null;
}

// ---------------------------------------------------------------------------
// Run a single eval
// ---------------------------------------------------------------------------

async function runEval(
	scenario: EvalScenario,
	skillEnabled: boolean,
): Promise<{ result: EvalRunResult; transcript?: TranscriptSummary }> {
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

		const passThreshold = getPassThreshold(scenario.id);

		console.log("  Running tests...");
		const testResult = await runTests({
			workspacePath,
			evalFilePath,
			passThreshold: passThreshold ?? undefined,
		});

		const pct =
			testResult.totalCount > 0
				? ((testResult.passedCount / testResult.totalCount) * 100).toFixed(1)
				: "0.0";
		const thresholdInfo = passThreshold
			? `, threshold: ${((passThreshold / testResult.totalCount) * 100).toFixed(0)}%`
			: "";
		console.log(
			`  Tests: ${testResult.passedCount}/${testResult.totalCount} passed (${pct}%${thresholdInfo})`,
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
			passThreshold: passThreshold ?? undefined,
			filesModified,
			toolCallCount: summary.toolCalls.length,
			costUsd: summary.totalCostUsd ?? undefined,
			prompt,
			individualTests: testResult.individualTests,
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

		return { result, transcript: summary };
	} catch (error) {
		const err = error as Error;
		return {
			result: {
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
			},
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

	// Start the shared Supabase instance once for all scenarios.
	startSupabase();
	const keys = getKeys();

	// Inject keys into process.env so EVAL.ts tests can connect to the real DB.
	process.env.SUPABASE_URL = keys.apiUrl;
	process.env.SUPABASE_ANON_KEY = keys.anonKey;
	process.env.SUPABASE_SERVICE_ROLE_KEY = keys.serviceRoleKey;
	process.env.SUPABASE_DB_URL = keys.dbUrl;

	const results: EvalRunResult[] = [];
	const transcripts = new Map<string, TranscriptSummary>();

	try {
		for (const scenario of scenarios) {
			// Reset the database before each scenario for a clean slate.
			console.log(`\n  Resetting DB for ${scenario.id}...`);
			resetDB(keys.dbUrl);

			const { result, transcript } = await runEval(scenario, skillEnabled);
			results.push(result);
			if (transcript) {
				transcripts.set(result.scenario, transcript);
			}
		}
	} finally {
		stopSupabase();
	}

	// Use the results dir from the first result (all share the same timestamp)
	const resultsDir = results.find((r) => r.resultsDir)?.resultsDir;
	printSummary(results, resultsDir);

	if (process.env.BRAINTRUST_UPLOAD === "true") {
		console.log("\nUploading to Braintrust...");
		await uploadToBraintrust(results, {
			model,
			skillEnabled,
			runTimestamp,
			transcripts,
		});
	}
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
