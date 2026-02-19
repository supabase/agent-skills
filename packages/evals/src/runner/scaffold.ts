import {
	cpSync,
	existsSync,
	mkdtempSync,
	readdirSync,
	rmSync,
	symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

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
 * 2. Optionally symlink the supabase skill so Claude Code can discover it
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

	// Make the skill available to the agent by symlinking the skills dir
	if (opts.skillEnabled) {
		const skillsDir = join(repoRoot, "skills");
		if (existsSync(skillsDir)) {
			const destSkills = join(workspacePath, "skills");
			symlinkSync(skillsDir, destSkills);
		}
	}

	return {
		workspacePath,
		cleanup: () => {
			rmSync(workspacePath, { recursive: true, force: true });
		},
	};
}
