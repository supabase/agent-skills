import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";

/**
 * Transcript schemas
 */

const TextBlock = z.object({ type: z.literal("text"), text: z.string() });

const ThinkingBlock = z.object({
	type: z.literal("thinking"),
	thinking: z.string(),
});

const ToolUseBlock = z.object({
	type: z.literal("tool_use"),
	id: z.string(),
	name: z.string(),
	input: z.record(z.string(), z.unknown()),
});

const ToolResultBlock = z.object({
	type: z.literal("tool_result"),
	tool_use_id: z.string(),
	content: z.unknown(),
	is_error: z.boolean().optional(),
});

const ContentBlock = z.union([
	ToolUseBlock,
	ThinkingBlock,
	TextBlock,
	ToolResultBlock,
	z.looseObject({ type: z.string() }), // catch-all for unknown block types
]);

const AssistantEntry = z.object({
	type: z.literal("assistant"),
	sessionId: z.string(),
	timestamp: z.string(),
	uuid: z.string(),
	message: z.object({
		role: z.literal("assistant"),
		content: z.array(ContentBlock),
		stop_reason: z.string().nullable().optional(),
	}),
});

// Catch-all — user messages, queue-operations, etc.
const TranscriptLine = z.union([
	AssistantEntry,
	z.looseObject({ type: z.string() }),
]);

/**
 * Config
 */

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY required");

const repoRoot = path.resolve(__dirname, "..");
const skillPath = path.join(
	repoRoot,
	"skills",
	"supabase-postgres-best-practices",
);

const prompt = `Review this SQL query for a Supabase project and suggest optimizations:

SELECT * FROM orders WHERE user_id = 123 AND status = 'pending';

What indexes should I add and why?`;

/**
 * Run the eval
 */

// Mount ~/.claude/projects to capture the built-in session transcript
const projectsDir = mkdtempSync(path.join(os.tmpdir(), "eval-projects-"));

const result = spawnSync(
	"docker",
	[
		"run",
		"--rm",
		"-e",
		`ANTHROPIC_API_KEY=${apiKey}`,
		"-v",
		`${skillPath}:/home/claude/.claude/skills/supabase-postgres-best-practices:ro`, // :ro = read-only snapshot
		"-v",
		`${projectsDir}:/home/claude/.claude/projects`,
		"evals-claude",
		"claude",
		"--print",
		"--dangerously-skip-permissions",
		prompt,
	],
	{ encoding: "utf-8" },
);

if (result.status !== 0) {
	throw new Error(result.stderr || `Exit code ${result.status}`);
}

/**
 * Parse the transcript
 */

// Container's working dir is /, which becomes `-` in the projects path
const transcriptDir = path.join(projectsDir, "-");
const [transcriptFile] = readdirSync(transcriptDir).filter((f) =>
	f.endsWith(".jsonl"),
);

// Single typed array — all transcript entries parsed and validated
const transcript = readFileSync(
	path.join(transcriptDir, transcriptFile),
	"utf-8",
)
	.split("\n")
	.filter(Boolean)
	.flatMap((l) => {
		const parsed = TranscriptLine.safeParse(JSON.parse(l));
		return parsed.success ? [parsed.data] : [];
	});

console.log(JSON.stringify(transcript, null, 2));
