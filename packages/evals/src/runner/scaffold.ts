import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Resolve the `skills` binary from the evals package node_modules. */
function resolveSkillsBin(): string {
	// __dirname is packages/evals/src/runner/ (or compiled equivalent)
	// Walk up to packages/evals/ and into node_modules/.bin/skills
	const bin = resolve(__dirname, "..", "..", "node_modules", ".bin", "skills");
	if (existsSync(bin)) return bin;
	throw new Error(`skills binary not found at ${bin}. Run npm install.`);
}

/** Walk up from cwd to find the repository root (contains skills/ and packages/). */
function findRepoRoot(): string {
	let dir = process.cwd();
	for (let i = 0; i < 10; i++) {
		if (existsSync(join(dir, "skills")) && existsSync(join(dir, "packages"))) {
			return dir;
		}
		const parent = resolve(dir, "..");
		if (parent === dir) break;
		dir = parent;
	}
	throw new Error("Could not find repository root (skills/ + packages/)");
}

/**
 * Create an isolated workspace for an eval run.
 *
 * 1. Copy the eval directory to a temp folder (excluding EVAL.ts)
 * 2. Optionally install skills via the `skills` CLI so Claude Code can discover them
 *
 * Returns the path to the workspace and a cleanup function.
 */
export function createWorkspace(opts: {
	evalDir: string;
	skillEnabled: boolean;
}): { workspacePath: string; cleanup: () => void } {
	const repoRoot = findRepoRoot();
	const workspacePath = mkdtempSync(join(tmpdir(), "supabase-eval-"));

	// Copy eval directory, excluding EVAL.ts (hidden from agent)
	const entries = readdirSync(opts.evalDir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name === "EVAL.ts" || entry.name === "EVAL.tsx") continue;
		const src = join(opts.evalDir, entry.name);
		const dest = join(workspacePath, entry.name);
		cpSync(src, dest, { recursive: true });
	}

	// Install skills into the workspace via the `skills` CLI
	if (opts.skillEnabled) {
		const skillsDir = join(repoRoot, "skills");
		if (existsSync(skillsDir)) {
			const skillsBin = resolveSkillsBin();
			const args = ["add", skillsDir, "-a", "claude-code", "-y"];

			const skillFilter = process.env.EVAL_SKILL;
			if (skillFilter) {
				args.push("--skill", skillFilter);
			}

			execFileSync(skillsBin, args, {
				cwd: workspacePath,
				stdio: "pipe",
				timeout: 60_000,
			});
		}
	}

	return {
		workspacePath,
		cleanup: () => {
			rmSync(workspacePath, { recursive: true, force: true });
		},
	};
}
