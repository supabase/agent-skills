import { generateText, Output } from "ai";
import type { EvalScorer } from "braintrust";
import { z } from "zod";
import type { CodeFixTestCase } from "./dataset/types.js";
import type { Expected, Input, Output as TaskOutput } from "./dataset.js";
import { getModel } from "./models.js";

const judgeModelId = process.env.EVAL_JUDGE_MODEL || "claude-opus-4-6";

const scoreSchema = z.object({
	score: z
		.number()
		.describe("Score from 0 to 1 (0 = bad, 0.5 = partial, 1 = good)"),
	reasoning: z.string().describe("Brief reasoning for the score"),
});

const SYSTEM_PROMPT =
	"You are a precise, consistent evaluator of Supabase code fixes. You assess whether LLM-generated code correctly addresses Supabase anti-patterns by comparing against reference solutions. You are fair: functionally equivalent solutions that differ in style or approach from the reference still receive high scores. You are strict: partial fixes, missing security measures, or incorrect patterns receive low scores. Always provide specific evidence for your scoring.";

function buildContext(tc: CodeFixTestCase, llmOutput: string): string {
	return `## Reference Information

**Topic:** ${tc.title}
**Explanation:** ${tc.explanation}

## Original Incorrect Code

\`\`\`${tc.badExample.language || ""}
${tc.badExample.code}
\`\`\`

## Reference Correct Code (ground truth)

\`\`\`${tc.goodExample.language || ""}
${tc.goodExample.code}
\`\`\`

## LLM's Attempted Fix

${llmOutput}`;
}

async function judge(
	prompt: string,
): Promise<{ score: number; reasoning: string }> {
	const model = getModel(judgeModelId);
	const { output } = await generateText({
		model,
		system: SYSTEM_PROMPT,
		prompt,
		output: Output.object({ schema: scoreSchema }),
		temperature: 0.1,
		maxRetries: 2,
	});
	if (!output) throw new Error("Judge returned no structured output");
	return output;
}

export const correctnessScorer: EvalScorer<
	Input,
	TaskOutput,
	Expected
> = async ({ input, output }) => {
	const context = buildContext(input.testCase, output.llmOutput);
	const result = await judge(`${context}

## Task

Evaluate **correctness**: Does the LLM's fix address the core issue identified in the incorrect code?

The fix does not need to be character-identical to the reference, but it must solve the same problem. Functionally equivalent or improved solutions should score well.

Score 1 if the fix fully addresses the core issue, 0.5 if it partially addresses it, 0 if it fails to address the core issue or introduces new problems.`);

	return {
		name: "Correctness",
		score: result.score,
		metadata: { reasoning: result.reasoning },
	};
};

export const completenessScorer: EvalScorer<
	Input,
	TaskOutput,
	Expected
> = async ({ input, output }) => {
	const context = buildContext(input.testCase, output.llmOutput);
	const result = await judge(`${context}

## Task

Evaluate **completeness**: Does the LLM's fix include ALL necessary changes shown in the reference?

Check for missing RLS enablement, missing policy clauses, missing columns, incomplete migrations, or any partial fixes. The fix should be production-ready.

Score 1 if all necessary changes are present, 0.5 if most changes are present but some are missing, 0 if significant changes are missing.`);

	return {
		name: "Completeness",
		score: result.score,
		metadata: { reasoning: result.reasoning },
	};
};

export const bestPracticeScorer: EvalScorer<
	Input,
	TaskOutput,
	Expected
> = async ({ input, output }) => {
	const context = buildContext(input.testCase, output.llmOutput);
	const result = await judge(`${context}

## Task

Evaluate **best practices**: Does the LLM's fix follow Supabase best practices as demonstrated in the reference?

Consider: RLS patterns, auth.users references, migration conventions, connection pooling, edge function patterns, SDK usage, and security-first defaults. Alternative correct approaches that achieve the same security/correctness goal are acceptable.

Score 1 if the fix follows best practices, 0.5 if it mostly follows best practices with minor deviations, 0 if it uses anti-patterns or ignores conventions.`);

	return {
		name: "Best Practice",
		score: result.score,
		metadata: { reasoning: result.reasoning },
	};
};
