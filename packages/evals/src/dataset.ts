import type { EvalCase } from "braintrust";
import { extractCodeFixDataset } from "./dataset/extract.js";
import type { CodeFixTestCase } from "./dataset/types.js";

export type Input = { testCase: CodeFixTestCase };

export type Expected = {
	correctCode: string;
	correctLanguage?: string;
};

export type Metadata = {
	skillName: string;
	section: string;
	tags: string[];
};

export type Output = { llmOutput: string };

export function dataset(): EvalCase<Input, Expected, Metadata>[] {
	return extractCodeFixDataset().map((tc) => ({
		input: { testCase: tc },
		expected: {
			correctCode: tc.goodExample.code,
			correctLanguage: tc.goodExample.language,
		},
		metadata: {
			skillName: tc.skillName,
			section: tc.section,
			tags: tc.tags,
		},
	}));
}
