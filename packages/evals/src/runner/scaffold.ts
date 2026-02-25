import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EVAL_PROJECT_DIR } from "./supabase-setup.js";

/**
 * Create an isolated workspace for an eval run.
 *
 * 1. Copy the eval directory to a temp folder (excluding EVAL.ts/EVAL.tsx)
 * 2. Seed with the eval project's supabase/config.toml
 *
 * Skills are injected via the --agents flag in agent.ts (not installed into
 * the workspace here). Combined with --setting-sources project,local, this
 * prevents host ~/.agents/skills/ from leaking into the eval environment.
 *
 * Returns the path to the workspace and a cleanup function.
 */
export function createWorkspace(opts: {
	evalDir: string;
	skillEnabled: boolean;
}): { workspacePath: string; cleanup: () => void } {
	const workspacePath = mkdtempSync(join(tmpdir(), "supabase-eval-"));

	// Copy eval directory, excluding EVAL.ts/EVAL.tsx (hidden from agent)
	const entries = readdirSync(opts.evalDir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name === "EVAL.ts" || entry.name === "EVAL.tsx") continue;
		const src = join(opts.evalDir, entry.name);
		const dest = join(workspacePath, entry.name);
		cpSync(src, dest, { recursive: true });
	}

	// Add .mcp.json so the agent connects to the local Supabase MCP server
	writeFileSync(
		join(workspacePath, ".mcp.json"),
		JSON.stringify(
			{
				mcpServers: {
					"local-supabase": {
						type: "http",
						url: "http://localhost:54321/mcp",
					},
				},
			},
			null,
			"\t",
		),
	);

	// Seed the workspace with the eval project's supabase/config.toml so the
	// agent can run `supabase db push` against the shared local instance without
	// needing to run `supabase init` or `supabase start` first.
	const projectConfigSrc = join(EVAL_PROJECT_DIR, "supabase", "config.toml");
	if (existsSync(projectConfigSrc)) {
		const destSupabaseDir = join(workspacePath, "supabase");
		mkdirSync(join(destSupabaseDir, "migrations"), { recursive: true });
		cpSync(projectConfigSrc, join(destSupabaseDir, "config.toml"));
	}

	return {
		workspacePath,
		cleanup: () => {
			rmSync(workspacePath, { recursive: true, force: true });
		},
	};
}
