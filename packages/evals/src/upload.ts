/**
 * Upload eval results from the results/ directory to Braintrust.
 *
 * Reads saved result.json, transcript.json, and outputs/eval.txt from each
 * run, parses the vitest output to extract pass/fail counts, then uploads to
 * Braintrust as an experiment.
 *
 * Usage:
 *   BRAINTRUST_API_KEY=... BRAINTRUST_PROJECT_ID=... tsx src/upload.ts
 *
 * Optional env vars:
 *   RESULTS_DIR   Override the results directory (default: results/)
 *   RUN_TIMESTAMP Only upload a specific run (e.g. 2026-02-27T13-01-22.316Z)
 */

import assert from "node:assert";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { init } from "braintrust";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Types matching the saved result files from @vercel/agent-eval
// ---------------------------------------------------------------------------

interface RunResult {
	status: "passed" | "failed" | "error";
	duration: number;
	model: string;
	o11y: {
		totalTurns: number;
		totalToolCalls: number;
		toolCalls: Record<string, number>;
		filesModified: string[];
		filesRead: string[];
		errors: string[];
		thinkingBlocks: number;
	};
}

interface TranscriptEvent {
	type: "tool_call" | "tool_result" | "message" | "thinking";
	tool?: {
		name: string;
		originalName: string;
		args?: Record<string, unknown>;
	};
}

interface Transcript {
	agent: string;
	model: string;
	events: TranscriptEvent[];
}

interface ParsedEvalOutput {
	passed: number;
	failed: number;
	total: number;
	tests: Array<{ name: string; passed: boolean }>;
}

// ---------------------------------------------------------------------------
// Parse vitest eval.txt output
// ---------------------------------------------------------------------------

function parseEvalOutput(text: string): ParsedEvalOutput {
	const tests: Array<{ name: string; passed: boolean }> = [];

	for (const line of text.split("\n")) {
		const passMatch = line.match(/^\s+✓\s+(.+)$/);
		const failMatch = line.match(/^\s+[✗×]\s+(.+)$/);
		if (passMatch) tests.push({ name: passMatch[1].trim(), passed: true });
		else if (failMatch)
			tests.push({ name: failMatch[1].trim(), passed: false });
	}

	if (tests.length > 0) {
		const passed = tests.filter((t) => t.passed).length;
		return {
			passed,
			failed: tests.length - passed,
			total: tests.length,
			tests,
		};
	}

	// Fallback: parse summary line
	const summaryMatch = text.match(
		/Tests\s+(\d+)\s+passed(?:\s*\|\s*(\d+)\s+failed)?\s+\((\d+)\)/,
	);
	if (summaryMatch) {
		const passed = parseInt(summaryMatch[1], 10);
		const failed = summaryMatch[2] ? parseInt(summaryMatch[2], 10) : 0;
		const total = parseInt(summaryMatch[3], 10);
		return { passed, failed, total, tests };
	}

	return { passed: 0, failed: 0, total: 0, tests };
}

// ---------------------------------------------------------------------------
// Extract reference file reads from transcript
// ---------------------------------------------------------------------------

function extractReferenceFilesRead(transcript: Transcript): string[] {
	const read: string[] = [];
	for (const event of transcript.events) {
		if (event.type !== "tool_call" || !event.tool?.args) continue;
		if (event.tool.name !== "file_read") continue;
		const filePath = String(
			event.tool.args._extractedPath ?? event.tool.args.file_path ?? "",
		);
		if (
			(filePath.includes("/.claude/skills/") ||
				filePath.includes("/.agents/skills/")) &&
			filePath.includes("/references/")
		) {
			const base = basename(filePath);
			if (!read.includes(base)) read.push(base);
		}
	}
	return read;
}

// ---------------------------------------------------------------------------
// Find all experiment run directories
// ---------------------------------------------------------------------------

interface RunEntry {
	runTimestamp: string;
	evalName: string;
	runIndex: number;
	runDir: string;
	result: RunResult;
	transcript: Transcript;
	evalOutput: string | null;
	prompt: string;
}

function findRuns(resultsDir: string, filterTimestamp?: string): RunEntry[] {
	const entries: RunEntry[] = [];
	const experimentDir = join(resultsDir, "experiment");
	if (!existsSync(experimentDir)) return entries;

	const timestamps = readdirSync(experimentDir).filter(
		(t) => !filterTimestamp || t === filterTimestamp,
	);

	for (const runTimestamp of timestamps) {
		const tsDir = join(experimentDir, runTimestamp);
		const evalNames = readdirSync(tsDir).filter((name) =>
			readdirSync(join(tsDir, name)).some((f) => f.startsWith("run-")),
		);

		for (const evalName of evalNames) {
			const evalDir = join(tsDir, evalName);
			const promptPath = resolve(ROOT, "evals", evalName, "PROMPT.md");
			const prompt = existsSync(promptPath)
				? readFileSync(promptPath, "utf-8").trim()
				: "";

			const runDirs = readdirSync(evalDir)
				.filter((d) => /^run-\d+$/.test(d))
				.sort();

			for (const runDir of runDirs) {
				const runIndex = parseInt(runDir.replace("run-", ""), 10);
				const runPath = join(evalDir, runDir);
				const resultPath = join(runPath, "result.json");
				const transcriptPath = join(runPath, "transcript.json");
				const evalOutputPath = join(runPath, "outputs", "eval.txt");

				if (!existsSync(resultPath) || !existsSync(transcriptPath)) continue;

				const result: RunResult = JSON.parse(readFileSync(resultPath, "utf-8"));
				const transcript: Transcript = JSON.parse(
					readFileSync(transcriptPath, "utf-8"),
				);
				const evalOutput = existsSync(evalOutputPath)
					? readFileSync(evalOutputPath, "utf-8")
					: null;

				entries.push({
					runTimestamp,
					evalName,
					runIndex,
					runDir: runPath,
					result,
					transcript,
					evalOutput,
					prompt,
				});
			}
		}
	}

	return entries;
}

// ---------------------------------------------------------------------------
// Main upload flow
// ---------------------------------------------------------------------------

async function main() {
	assert(process.env.BRAINTRUST_API_KEY, "BRAINTRUST_API_KEY is not set");
	assert(process.env.BRAINTRUST_PROJECT_ID, "BRAINTRUST_PROJECT_ID is not set");

	const resultsDir = resolve(ROOT, process.env.RESULTS_DIR ?? "results");
	const filterTimestamp = process.env.RUN_TIMESTAMP;

	const runs = findRuns(resultsDir, filterTimestamp);
	if (runs.length === 0) {
		console.error("No runs found in", resultsDir);
		process.exit(1);
	}

	console.log(
		`Found ${runs.length} run(s) across ${new Set(runs.map((r) => r.runTimestamp)).size} experiment(s)`,
	);

	const byTimestamp = new Map<string, RunEntry[]>();
	for (const r of runs) {
		const group = byTimestamp.get(r.runTimestamp) ?? [];
		group.push(r);
		byTimestamp.set(r.runTimestamp, group);
	}

	for (const [runTimestamp, timestampRuns] of byTimestamp) {
		const model = timestampRuns[0].result.model;
		const skillEnabled = process.env.EVAL_BASELINE !== "true";
		const variant = skillEnabled ? "skill" : "baseline";
		const experimentName = `${model}-${variant}-${runTimestamp}`;

		console.log(
			`\nUploading experiment: ${experimentName} (${timestampRuns.length} rows)`,
		);

		const experiment = init({
			projectId: process.env.BRAINTRUST_PROJECT_ID as string,
			experiment: experimentName,
			metadata: {
				model,
				runTimestamp,
				skillEnabled,
				evalCount: timestampRuns.length,
			},
		});

		for (const run of timestampRuns) {
			const evalParsed = run.evalOutput
				? parseEvalOutput(run.evalOutput)
				: { passed: 0, failed: 0, total: 0, tests: [] };

			console.log(
				`  [${run.evalName}] run-${run.runIndex} — tests: ${evalParsed.passed}/${evalParsed.total} passed`,
			);

			// Reference files scorer
			const metaPath = resolve(ROOT, "evals", run.evalName, "meta.ts");
			const metaMod = existsSync(metaPath)
				? ((await import(metaPath)) as {
						expectedReferenceFiles?: string[];
					})
				: {};
			const expectedRefs = metaMod.expectedReferenceFiles ?? [];
			const refsRead = extractReferenceFilesRead(run.transcript);
			const refHits = expectedRefs.filter((f) => refsRead.includes(f)).length;
			const referenceFilesUsage =
				expectedRefs.length > 0 ? refHits / expectedRefs.length : 1;

			console.log(
				`  reference files: ${refHits}/${expectedRefs.length} read (${refsRead.join(", ") || "none"})`,
			);

			const scores: Record<string, number> = {
				assertions_passed:
					evalParsed.total > 0 ? evalParsed.passed / evalParsed.total : 0,
				reference_files_usage: referenceFilesUsage,
				final_result: run.result.status === "passed" ? 1 : 0,
			};

			const metadata: Record<string, unknown> = {
				model: run.result.model,
				evalName: run.evalName,
				runIndex: run.runIndex,
				totalTurns: run.result.o11y.totalTurns,
				totalToolCalls: run.result.o11y.totalToolCalls,
				toolCalls: run.result.o11y.toolCalls,
				filesModified: run.result.o11y.filesModified,
				errors: run.result.o11y.errors,
				thinkingBlocks: run.result.o11y.thinkingBlocks,
				duration: run.result.duration,
				referenceFilesRead: refsRead,
				expectedReferenceFiles: expectedRefs,
			};

			experiment.traced(
				(span) => {
					span.log({
						input: { eval: run.evalName, prompt: run.prompt },
						output: {
							status: run.result.status,
							filesModified: run.result.o11y.filesModified,
							tests: evalParsed.tests,
							evalOutput: run.evalOutput,
						},
						expected: {
							testsTotal: evalParsed.total,
							expectedReferenceFiles: expectedRefs,
						},
						scores,
						metadata,
						datasetRecordId: run.evalName,
					});

					// Child spans for each tool call in the transcript
					for (const event of run.transcript.events) {
						if (event.type !== "tool_call" || !event.tool) continue;
						span.traced(
							(child) => {
								child.log({
									input: {
										tool: event.tool?.name,
										args: event.tool?.args ?? {},
									},
									output: {},
									metadata: { originalName: event.tool?.originalName },
								});
							},
							{ name: `tool:${event.tool.name}` },
						);
					}
				},
				{ name: `${run.evalName}/run-${run.runIndex}` },
			);
		}

		const summary = await experiment.summarize();
		console.log(`\nBraintrust experiment: ${summary.experimentUrl}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
