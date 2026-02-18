import type { EvalCase } from "braintrust";
import { extractCodeFixDataset } from "./dataset/extract.js";
import type { CodeFixTestCase } from "./dataset/types.js";

export type Input = { testCase: CodeFixTestCase };

export type Expected = {
	correctCode: string;
	correctLanguage?: string;
};

export type Metadata = {
	name: string;
	skillName: string;
	section: string;
	referenceFile: string;
	tags: string[];
};

export type Output = { llmOutput: string };

/**
 * Extract the feature category from a reference filename.
 * e.g. "db-migrations-idempotent.md" → "db"
 *      "auth-core-sessions.md" → "auth"
 */
function featureCategory(filename: string): string {
	return filename.replace(/\.md$/, "").split("-")[0];
}

export function dataset(): EvalCase<Input, Expected, Metadata>[] {
	return extractCodeFixDataset().map((tc) => ({
		id: tc.id,
		input: { testCase: tc },
		tags: [
			featureCategory(tc.referenceFilename),
			tc.referenceFilename.replace(/\.md$/, ""),
		],
		expected: {
			correctCode: tc.goodExample.code,
			correctLanguage: tc.goodExample.language,
		},
		metadata: {
			name: tc.title,
			skillName: tc.skillName,
			section: tc.section,
			referenceFile: tc.referenceFilename,
			tags: tc.tags,
		},
	}));
}
