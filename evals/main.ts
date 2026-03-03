import { execSync, spawnSync } from "node:child_process";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY required");

try {
	execSync("docker image inspect evals-claude", { stdio: "ignore" });
} catch {
	console.error("Docker image 'evals-claude' not found. Build it first with:\n  npm run evals:build");
	process.exit(1);
}

const result = spawnSync(
	"docker",
	[
		"run",
		"--rm",
		"-e",
		`ANTHROPIC_API_KEY=${apiKey}`,
		"evals-claude",
		"claude",
		"-p",
		"Hello",
	],
	{ encoding: "utf-8" },
);

if (result.status !== 0) {
	throw new Error(result.stderr || `Exit code ${result.status}`);
}
console.log(result.stdout);
