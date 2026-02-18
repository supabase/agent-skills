import type { CodeFixTestCase } from "../dataset/types.js";

export function buildCodeFixSystemPrompt(): string {
	return `You are a senior Supabase developer and database architect. You fix code to follow Supabase best practices including:
- Row Level Security (RLS) policies
- Proper authentication patterns
- Safe migration workflows
- Correct SDK usage patterns
- Edge Function best practices
- Connection pooling configuration
- Security-first defaults

When fixing code, ensure the fix is complete, production-ready, and follows the latest Supabase conventions. Return only the corrected code inside a single code block.`;
}

export function buildCodeFixPrompt(testCase: CodeFixTestCase): string {
	const langHint = testCase.badExample.language
		? ` (${testCase.badExample.language})`
		: "";

	return `The following code has a problem related to: ${testCase.title}

Context: ${testCase.explanation}

Here is the problematic code${langHint}:

\`\`\`${testCase.badExample.language || ""}
${testCase.badExample.code}
\`\`\`
${testCase.badExample.description ? `\nIssue hint: ${testCase.badExample.description}` : ""}

Fix this code to follow Supabase best practices. Return ONLY the corrected code inside a single code block. Do not include any explanation outside the code block.`;
}
