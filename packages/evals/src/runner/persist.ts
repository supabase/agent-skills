import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { EvalRunResult } from "../types.js";
import type { TranscriptSummary } from "./transcript.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Resolve the base directory for storing results.
 *  Supports EVAL_RESULTS_DIR override for Docker volume mounts. */
function resultsBase(): string {
	if (process.env.EVAL_RESULTS_DIR) {
		return process.env.EVAL_RESULTS_DIR;
	}
	// Default: packages/evals/results (__dirname is packages/evals/src/runner)
	return join(__dirname, "..", "..", "results");
}

/** Create the results directory for a single scenario run. Returns the path. */
export function createResultDir(
	runTimestamp: string,
	scenarioId: string,
	variant: "with-skill" | "baseline",
): string {
	const dir = join(resultsBase(), runTimestamp, scenarioId, variant);
	mkdirSync(dir, { recursive: true });
	return dir;
}

/** Save all artifacts for a single eval run. */
export function saveRunArtifacts(opts: {
	resultDir: string;
	rawTranscript: string;
	testOutput: string;
	result: EvalRunResult;
	transcriptSummary: TranscriptSummary;
}): void {
	writeFileSync(
		join(opts.resultDir, "transcript.jsonl"),
		opts.rawTranscript,
		"utf-8",
	);

	writeFileSync(
		join(opts.resultDir, "test-output.txt"),
		opts.testOutput,
		"utf-8",
	);

	writeFileSync(
		join(opts.resultDir, "result.json"),
		JSON.stringify(
			{ ...opts.result, transcript: opts.transcriptSummary },
			null,
			2,
		),
		"utf-8",
	);
}
