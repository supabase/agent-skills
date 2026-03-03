import { execSync, spawnSync } from "node:child_process";
import path from "node:path";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY required");

try {
	execSync("docker image inspect evals-claude", { stdio: "ignore" });
} catch {
	console.error(
		"Docker image 'evals-claude' not found. Build it first with:\n  npm run evals:build",
	);
	process.exit(1);
}

const repoRoot = path.resolve(__dirname, "..");
const skillPath = path.join(
	repoRoot,
	"skills",
	"supabase-postgres-best-practices",
);

const prompt = `Review this SQL query for a Supabase project and suggest optimizations:

SELECT * FROM orders WHERE user_id = 123 AND status = 'pending';

What indexes should I add and why?`;

const result = spawnSync(
	"docker",
	[
		"run",
		"--rm",
		"-e",
		`ANTHROPIC_API_KEY=${apiKey}`,
		"-v",
		`${skillPath}:/root/.claude/skills/supabase-postgres-best-practices:ro`, // :ro = read-only snapshot
		"evals-claude",
		"claude",
		"-p",
		prompt,
	],
	{ encoding: "utf-8" },
);

if (result.status !== 0) {
	throw new Error(result.stderr || `Exit code ${result.status}`);
}
console.log(result.stdout);
