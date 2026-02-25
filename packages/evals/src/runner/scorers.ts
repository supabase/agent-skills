import type { EvalRunResult } from "../types.js";
import type { TranscriptSummary } from "./transcript.js";

export interface ScoreResult {
	name: string;
	/** 0.0 – 1.0 */
	score: number;
	metadata?: Record<string, unknown>;
}

/**
 * skillUsageScorer — 1 if the target skill was in the agent's context, 0 otherwise.
 *
 * Detected via the `skills` array in the system init event of the NDJSON transcript.
 * Combined with `--setting-sources project,local` in agent.ts, this array is clean
 * (no host skill leakage), so its presence is a reliable signal.
 */
export function skillUsageScorer(
	transcript: TranscriptSummary,
	skillName: string,
): ScoreResult {
	const loaded = transcript.skills.includes(skillName);
	return {
		name: "skill_usage",
		score: loaded ? 1 : 0,
		metadata: {
			loadedSkills: transcript.skills,
			targetSkill: skillName,
		},
	};
}

/**
 * referenceFilesUsageScorer — fraction of expected reference files actually read.
 *
 * Detected via Read tool calls whose file_path matches "/.agents/skills/*\/references/".
 * The expectedReferenceFiles list is declared in each EVAL.ts and should match the
 * "Skill References Exercised" table in the corresponding scenarios/*.md file.
 */
export function referenceFilesUsageScorer(
	transcript: TranscriptSummary,
	expectedReferenceFiles: string[],
): ScoreResult {
	if (expectedReferenceFiles.length === 0) {
		return {
			name: "reference_files_usage",
			score: 1,
			metadata: { skipped: true },
		};
	}
	const read = transcript.referenceFilesRead;
	const hits = expectedReferenceFiles.filter((f) => read.includes(f)).length;
	return {
		name: "reference_files_usage",
		score: hits / expectedReferenceFiles.length,
		metadata: {
			expected: expectedReferenceFiles,
			read,
			hits,
			total: expectedReferenceFiles.length,
		},
	};
}

/**
 * assertionsPassedScorer — ratio of assertions passed vs total.
 */
export function assertionsPassedScorer(result: EvalRunResult): ScoreResult {
	const score =
		result.testsTotal > 0 ? result.testsPassed / result.testsTotal : 0;
	return {
		name: "assertions_passed",
		score,
		metadata: { passed: result.testsPassed, total: result.testsTotal },
	};
}

/**
 * finalResultScorer — 1 if the agent met the pass threshold, 0 otherwise.
 *
 * A result is "passed" when assertionsPassed >= passThreshold (set per scenario
 * in scenarios/*.md). This is the binary outcome used for Braintrust comparisons.
 */
export function finalResultScorer(result: EvalRunResult): ScoreResult {
	return {
		name: "final_result",
		score: result.status === "passed" ? 1 : 0,
		metadata: {
			testsPassed: result.testsPassed,
			testsTotal: result.testsTotal,
			passThreshold: result.passThreshold,
		},
	};
}
