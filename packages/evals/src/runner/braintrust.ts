import assert from "node:assert";
import { init, initLogger, type Logger } from "braintrust";
import type { EvalRunResult } from "../types.js";
import type { TranscriptSummary } from "./transcript.js";

/**
 * Initialize a Braintrust project logger for real-time per-scenario logging.
 * Call this once at startup and pass the logger to logScenarioToLogger().
 */
export function initBraintrustLogger(): Logger<true> {
	assert(process.env.BRAINTRUST_API_KEY, "BRAINTRUST_API_KEY is not set");
	assert(process.env.BRAINTRUST_PROJECT_ID, "BRAINTRUST_PROJECT_ID is not set");
	return initLogger({
		projectId: process.env.BRAINTRUST_PROJECT_ID,
		asyncFlush: true,
	});
}

/**
 * Log a single scenario result to the Braintrust project logger in real-time.
 * This runs alongside the experiment upload, giving immediate visibility in
 * the project log as each scenario completes.
 */
export function logScenarioToLogger(
	logger: Logger<true>,
	r: EvalRunResult,
	transcript?: TranscriptSummary,
): void {
	const scores: Record<string, number> = {
		skill_usage: r.scores?.skillUsage ?? 0,
		reference_files_usage: r.scores?.referenceFilesUsage ?? 0,
		assertions_passed: r.scores?.assertionsPassed ?? 0,
		final_result: r.scores?.finalResult ?? 0,
	};

	const metadata: Record<string, unknown> = {
		agent: r.agent,
		model: r.model,
		skillEnabled: r.skillEnabled,
		testsPassed: r.testsPassed,
		testsTotal: r.testsTotal,
		toolCallCount: r.toolCallCount ?? 0,
		contextWindowUsed:
			(r.totalInputTokens ?? 0) +
			(r.totalCacheReadTokens ?? 0) +
			(r.totalCacheCreationTokens ?? 0),
		totalOutputTokens: r.totalOutputTokens,
		modelUsage: r.modelUsage,
		toolErrorCount: r.toolErrorCount,
		permissionDenialCount: r.permissionDenialCount,
		loadedSkills: r.loadedSkills,
		referenceFilesRead: r.referenceFilesRead,
		...(r.costUsd != null ? { costUsd: r.costUsd } : {}),
		...(r.error ? { error: r.error } : {}),
	};

	const spanOptions = r.startedAt
		? { name: r.scenario, startTime: r.startedAt / 1000 }
		: { name: r.scenario };

	if (transcript && transcript.toolCalls.length > 0) {
		logger.traced((span) => {
			span.log({
				input: {
					scenario: r.scenario,
					prompt: r.prompt ?? "",
					skillEnabled: r.skillEnabled,
				},
				output: {
					status: r.status,
					agentOutput: r.agentOutput,
					filesModified: r.filesModified,
					testOutput: r.testOutput,
				},
				expected: { testsTotal: r.testsTotal },
				scores,
				metadata,
			});

			for (const tc of transcript.toolCalls) {
				span.traced(
					(childSpan) => {
						childSpan.log({
							input: { tool: tc.tool, args: tc.input },
							output: {
								preview: tc.outputPreview,
								isError: tc.isError,
								...(tc.stderr ? { stderr: tc.stderr } : {}),
							},
							metadata: { toolUseId: tc.toolUseId },
						});
					},
					{ name: `tool:${tc.tool}` },
				);
			}
		}, spanOptions);
	} else {
		logger.traced((span) => {
			span.log({
				input: {
					scenario: r.scenario,
					prompt: r.prompt ?? "",
					skillEnabled: r.skillEnabled,
				},
				output: {
					status: r.status,
					agentOutput: r.agentOutput,
					filesModified: r.filesModified,
					testOutput: r.testOutput,
				},
				expected: { testsTotal: r.testsTotal },
				scores,
				metadata,
			});
		}, spanOptions);
	}
}

/**
 * Upload eval results to Braintrust as an experiment.
 *
 * Each EvalRunResult becomes a row in the experiment with:
 * - input: scenario ID, prompt content, skillEnabled flag
 * - output: status, agent output, files modified, test output
 * - expected: total tests, pass threshold
 * - scores: skill_usage, reference_files_usage, assertions_passed, final_result
 * - metadata: agent, model, skillEnabled, test counts, tool calls, context window, output tokens, model usage, errors, cost
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

		const scores: Record<string, number> = {
			skill_usage: r.scores?.skillUsage ?? 0,
			reference_files_usage: r.scores?.referenceFilesUsage ?? 0,
			assertions_passed: r.scores?.assertionsPassed ?? 0,
			final_result: r.scores?.finalResult ?? 0,
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
			testsPassed: r.testsPassed,
			testsTotal: r.testsTotal,
			toolCallCount: r.toolCallCount ?? 0,
			contextWindowUsed:
				(r.totalInputTokens ?? 0) +
				(r.totalCacheReadTokens ?? 0) +
				(r.totalCacheCreationTokens ?? 0),
			totalOutputTokens: r.totalOutputTokens,
			modelUsage: r.modelUsage,
			toolErrorCount: r.toolErrorCount,
			permissionDenialCount: r.permissionDenialCount,
			loadedSkills: r.loadedSkills,
			referenceFilesRead: r.referenceFilesRead,
			...(r.costUsd != null ? { costUsd: r.costUsd } : {}),
			...(r.error ? { error: r.error } : {}),
		};

		const spanOptions = r.startedAt
			? { name: r.scenario, startTime: r.startedAt / 1000 }
			: { name: r.scenario };

		if (transcript && transcript.toolCalls.length > 0) {
			experiment.traced((span) => {
				span.log({ input, output, expected, scores, metadata });

				for (const tc of transcript.toolCalls) {
					span.traced(
						(childSpan) => {
							childSpan.log({
								input: { tool: tc.tool, args: tc.input },
								output: {
									preview: tc.outputPreview,
									isError: tc.isError,
									...(tc.stderr ? { stderr: tc.stderr } : {}),
								},
								metadata: { toolUseId: tc.toolUseId },
							});
						},
						{ name: `tool:${tc.tool}` },
					);
				}
			}, spanOptions);
		} else {
			experiment.traced((span) => {
				span.log({ input, output, expected, scores, metadata });
			}, spanOptions);
		}
	}

	const summary = await experiment.summarize();
	console.log(`\nBraintrust experiment: ${summary.experimentUrl}`);
	await experiment.close();
}
