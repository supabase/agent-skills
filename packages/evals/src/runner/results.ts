import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { EvalRunResult } from "../types.js";

/**
 * List files created or modified by the agent in the workspace.
 * Compares against the original eval directory to find new files.
 */
export function listModifiedFiles(
	workspacePath: string,
	originalEvalDir: string,
): string[] {
	const modified: string[] = [];

	function walk(dir: string, prefix: string) {
		const entries = readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			if (
				entry.name === "node_modules" ||
				entry.name === ".agents" ||
				entry.name === ".claude" ||
				entry.name === "EVAL.ts" ||
				entry.name === "EVAL.tsx"
			)
				continue;

			const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
			const fullPath = join(dir, entry.name);

			if (entry.isDirectory()) {
				walk(fullPath, relPath);
			} else {
				// Check if file is new (not in original eval dir)
				const originalPath = join(originalEvalDir, relPath);
				try {
					statSync(originalPath);
				} catch {
					// File doesn't exist in original — it was created by the agent
					modified.push(relPath);
				}
			}
		}
	}

	walk(workspacePath, "");
	return modified;
}

/** Print a summary table of eval results. */
export function printSummary(
	results: EvalRunResult[],
	resultsDir?: string,
): void {
	console.log("\n=== Eval Results ===\n");

	for (const r of results) {
		const icon = r.status === "passed" ? "PASS" : "FAIL";
		const skill = r.skillEnabled ? "with-skill" : "baseline";
		const pct =
			r.testsTotal > 0
				? ((r.testsPassed / r.testsTotal) * 100).toFixed(1)
				: "0.0";
		const thresholdInfo =
			r.passThreshold && r.testsTotal > 0
				? `, threshold: ${((r.passThreshold / r.testsTotal) * 100).toFixed(0)}%`
				: "";
		console.log(
			`[${icon}] ${r.scenario} | ${r.model} | ${skill} | ${(r.duration / 1000).toFixed(1)}s | ${pct}% (${r.testsPassed}/${r.testsTotal}${thresholdInfo})`,
		);
		if (r.filesModified.length > 0) {
			console.log(`       Files: ${r.filesModified.join(", ")}`);
		}
		if (r.status === "error" && r.error) {
			console.log(`       Error: ${r.error}`);
		}
	}

	const passed = results.filter((r) => r.status === "passed").length;
	console.log(`\nTotal: ${passed}/${results.length} passed`);

	if (resultsDir) {
		console.log(`\nResults saved to: ${resultsDir}`);
	}
}
