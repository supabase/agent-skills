import assert from "node:assert";
import { init } from "braintrust";
import type { EvalRunResult } from "../types.js";

/**
 * Upload eval results to Braintrust as an experiment.
 *
 * Each EvalRunResult becomes a row in the experiment with:
 * - input: scenario name + config
 * - output: agent output summary
 * - scores: pass (0 or 1)
 * - metadata: model, skill toggle, duration, files modified
 */
export async function uploadToBraintrust(
	results: EvalRunResult[],
): Promise<void> {
	assert(process.env.BRAINTRUST_API_KEY, "BRAINTRUST_API_KEY is not set");
	assert(process.env.BRAINTRUST_PROJECT_ID, "BRAINTRUST_PROJECT_ID is not set");

	const experiment = await init({
		projectId: process.env.BRAINTRUST_PROJECT_ID,
	});

	for (const r of results) {
		experiment.log({
			input: {
				scenario: r.scenario,
				skillEnabled: r.skillEnabled,
			},
			output: {
				status: r.status,
				filesModified: r.filesModified,
				testOutput: r.testOutput,
			},
			scores: {
				pass: r.status === "passed" ? 1 : 0,
			},
			metadata: {
				agent: r.agent,
				model: r.model,
				skillEnabled: r.skillEnabled,
				duration: r.duration,
				testsPassed: r.testsPassed,
				testsTotal: r.testsTotal,
				...(r.error ? { error: r.error } : {}),
			},
		});
	}

	const summary = await experiment.summarize();
	console.log(`\nBraintrust experiment: ${summary.experimentUrl}`);
	await experiment.close();
}
