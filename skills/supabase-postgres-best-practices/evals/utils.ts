import type { EvalResult, EvalScenario } from "./types.js";

/**
 * Format eval results as a summary table
 */
export function formatResultsSummary(results: EvalResult[]): string {
	const lines: string[] = [];

	lines.push("## Eval Results Summary\n");

	const passed = results.filter((r) => r.passed).length;
	const total = results.length;
	const passRate = ((passed / total) * 100).toFixed(1);

	lines.push(`**Pass Rate:** ${passed}/${total} (${passRate}%)\n`);

	lines.push("| Scenario | Status | Latency | Rules Referenced |");
	lines.push("|----------|--------|---------|------------------|");

	for (const result of results) {
		const status = result.passed ? "PASS" : "FAIL";
		const latency = `${result.latencyMs}ms`;
		const rules = result.rulesReferenced.join(", ") || "none";
		lines.push(`| ${result.scenarioId} | ${status} | ${latency} | ${rules} |`);
	}

	return lines.join("\n");
}

/**
 * Format detailed results for a single scenario
 */
export function formatDetailedResult(result: EvalResult): string {
	const lines: string[] = [];

	lines.push(`## ${result.scenarioId}\n`);
	lines.push(`**Status:** ${result.passed ? "PASS" : "FAIL"}`);
	lines.push(`**Latency:** ${result.latencyMs}ms`);
	lines.push(
		`**Rules Referenced:** ${result.rulesReferenced.join(", ") || "none"}\n`,
	);

	if (result.error) {
		lines.push(`**Error:** ${result.error}\n`);
	}

	lines.push("### Criteria Results\n");
	for (const criterion of result.criteriaResults) {
		const icon = criterion.passed ? "+" : "-";
		lines.push(`${icon} ${criterion.criterion}`);
		if (criterion.evidence) {
			lines.push(`  Evidence: ${criterion.evidence}`);
		}
	}

	lines.push("\n### Response\n");
	lines.push("```");
	lines.push(result.response);
	lines.push("```");

	return lines.join("\n");
}

/**
 * Create a scenario builder for cleaner test definitions
 */
export function createScenario(
	partial: Omit<EvalScenario, "id"> & { id?: string },
): EvalScenario {
	return {
		id: partial.id || partial.name.toLowerCase().replace(/\s+/g, "-"),
		...partial,
	} as EvalScenario;
}
