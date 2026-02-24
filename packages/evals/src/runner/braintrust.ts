import assert from "node:assert";
import { init } from "braintrust";
import type { EvalRunResult } from "../types.js";
import type { TranscriptSummary } from "./transcript.js";

/** Convert a test name to a snake_case score key. */
function toScoreKey(name: string): string {
	return `test_${name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "")}`;
}

/**
 * Upload eval results to Braintrust as an experiment.
 *
 * Each EvalRunResult becomes a row in the experiment with:
 * - input: scenario ID, prompt content, skillEnabled flag
 * - output: status, agent output, files modified, test output
 * - expected: total tests, pass threshold
 * - scores: pass (0|1), test_pass_rate (0-1), per-test scores
 * - metadata: model, duration, cost, tool call count, files modified
 * - spans: one child span per agent tool call (when transcript available)
 */
export async function uploadToBraintrust(
	results: EvalRunResult[],
	opts: {
		model: string;
		skillEnabled: boolean;
		runTimestamp: string;
		transcripts: Map<string, TranscriptSummary>;
	},
): Promise<void> {
	assert(process.env.BRAINTRUST_API_KEY, "BRAINTRUST_API_KEY is not set");
	assert(process.env.BRAINTRUST_PROJECT_ID, "BRAINTRUST_PROJECT_ID is not set");

	const variant = opts.skillEnabled ? "skill" : "baseline";
	const experiment = await init({
		projectId: process.env.BRAINTRUST_PROJECT_ID,
		experiment: `${opts.model}-${variant}-${opts.runTimestamp}`,
		baseExperiment: process.env.BRAINTRUST_BASE_EXPERIMENT ?? undefined,
		metadata: {
			model: opts.model,
			skillEnabled: opts.skillEnabled,
			runTimestamp: opts.runTimestamp,
			scenarioCount: results.length,
		},
	});

	for (const r of results) {
		const transcript = opts.transcripts.get(r.scenario);

		// Build per-test scores
		const perTestScores: Record<string, number> = {};
		if (r.individualTests) {
			for (const [testName, didPass] of Object.entries(r.individualTests)) {
				perTestScores[toScoreKey(testName)] = didPass ? 1 : 0;
			}
		}

		const testPassRate = r.testsTotal > 0 ? r.testsPassed / r.testsTotal : 0;

		const scores: Record<string, number> = {
			pass: r.status === "passed" ? 1 : 0,
			test_pass_rate: testPassRate,
			...perTestScores,
		};

		const input = {
			scenario: r.scenario,
			prompt: r.prompt ?? "",
			skillEnabled: r.skillEnabled,
		};

		const output = {
			status: r.status,
			agentOutput: r.agentOutput,
			filesModified: r.filesModified,
			testOutput: r.testOutput,
		};

		const expected = {
			testsTotal: r.testsTotal,
			passThreshold: 1.0,
		};

		const metadata: Record<string, unknown> = {
			agent: r.agent,
			model: r.model,
			skillEnabled: r.skillEnabled,
			duration: r.duration,
			testsPassed: r.testsPassed,
			testsTotal: r.testsTotal,
			toolCallCount: r.toolCallCount ?? 0,
			filesModified: r.filesModified,
			...(r.costUsd != null ? { costUsd: r.costUsd } : {}),
			...(r.error ? { error: r.error } : {}),
		};

		if (transcript && transcript.toolCalls.length > 0) {
			// Use traced() to create a root span with child spans for tool calls
			experiment.traced(
				(span) => {
					span.log({ input, output, expected, scores, metadata });

					for (const tc of transcript.toolCalls) {
						span.traced(
							(childSpan) => {
								childSpan.log({
									input: { tool: tc.tool, args: tc.input },
									output: { preview: tc.outputPreview },
									metadata: { toolUseId: tc.toolUseId },
								});
							},
							{ name: `tool:${tc.tool}` },
						);
					}
				},
				{ name: r.scenario },
			);
		} else {
			experiment.log({ input, output, expected, scores, metadata });
		}
	}

	const summary = await experiment.summarize();
	console.log(`\nBraintrust experiment: ${summary.experimentUrl}`);
	await experiment.close();
}
