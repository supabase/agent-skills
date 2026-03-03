import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseClaudeCodeTranscript } from "./parse-transcript";

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

// Mount ~/.claude/projects to capture the built-in session transcript.
// Written to a fixed path so you can inspect it after the run (e.g. in VSCode).
const projectsDir = path.join(repoRoot, "evals", "output");
mkdirSync(projectsDir, { recursive: true });

const result = spawnSync(
	"docker",
	[
		"run",
		"--rm",
		"--workdir",
		"/eval",
		"--env",
		`ANTHROPIC_API_KEY=${apiKey}`,
		"--volume",
		`${skillPath}:/home/claude/.claude/skills/supabase-postgres-best-practices:ro`, // :ro = read-only snapshot
		"--volume",
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

// Container's working dir is /eval, which becomes `eval` in the projects path
const transcriptDir = path.join(projectsDir, "eval");
const [transcriptFile] = readdirSync(transcriptDir).filter((f) =>
	f.endsWith(".jsonl"),
);

const transcript = parseClaudeCodeTranscript(
	readFileSync(path.join(transcriptDir, transcriptFile), "utf-8"),
);

console.log(JSON.stringify(transcript, null, 2));
