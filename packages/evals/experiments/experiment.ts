import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExperimentConfig } from "@vercel/agent-eval";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVALS_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(EVALS_ROOT, "..", "..");
const PROJECT_DIR = join(EVALS_ROOT, "project");

const SKILL_NAME = process.env.EVAL_SKILL ?? "supabase";
const SKILL_DIR = join(REPO_ROOT, "skills", SKILL_NAME);

const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const isBaseline = process.env.EVAL_BASELINE === "true";

// ---------------------------------------------------------------------------
// Skill file loader — reads all skill files to inject into the sandbox
// ---------------------------------------------------------------------------

function readSkillFiles(): Record<string, string> {
	const files: Record<string, string> = {};

	for (const name of ["SKILL.md", "AGENTS.md"]) {
		const src = join(SKILL_DIR, name);
		if (existsSync(src)) {
			const content = readFileSync(src, "utf-8");
			files[`.agents/skills/${SKILL_NAME}/${name}`] = content;
			files[`.claude/skills/${SKILL_NAME}/${name}`] = content;
		}
	}

	const refsDir = join(SKILL_DIR, "references");
	if (existsSync(refsDir)) {
		for (const f of readdirSync(refsDir)) {
			const content = readFileSync(join(refsDir, f), "utf-8");
			files[`.agents/skills/${SKILL_NAME}/references/${f}`] = content;
			files[`.claude/skills/${SKILL_NAME}/references/${f}`] = content;
		}
	}

	return files;
}

// ---------------------------------------------------------------------------
// DB reset — clears all user-created objects between scenarios
// ---------------------------------------------------------------------------

const RESET_SQL = `
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO postgres;
  GRANT ALL ON SCHEMA public TO anon;
  GRANT ALL ON SCHEMA public TO authenticated;
  GRANT ALL ON SCHEMA public TO service_role;
  DROP SCHEMA IF EXISTS supabase_migrations CASCADE;
  NOTIFY pgrst, 'reload schema';
`.trim();

function resetDB(): void {
	const dbUrl =
		process.env.SUPABASE_DB_URL ??
		"postgresql://postgres:postgres@127.0.0.1:54322/postgres";
	execFileSync("psql", [dbUrl, "--no-psqlrc", "-c", RESET_SQL], {
		stdio: "inherit",
		timeout: 30_000,
	});
}

// ---------------------------------------------------------------------------
// Experiment configuration
// ---------------------------------------------------------------------------

const config: ExperimentConfig = {
	agent: "claude-code",
	model: "claude-sonnet-4-6",
	runs: 1,
	earlyExit: true,
	timeout: 1800,
	sandbox: "docker",
	evals: process.env.EVAL_SCENARIO ?? "*",

	setup: async (sandbox) => {
		// 1. Reset DB for a clean slate
		resetDB();

		// 2. Seed supabase config so the agent can run `supabase db push`
		const configPath = join(PROJECT_DIR, "supabase", "config.toml");
		if (existsSync(configPath)) {
			await sandbox.writeFiles({
				"supabase/config.toml": readFileSync(configPath, "utf-8"),
			});
		}

		// 3. Write MCP config pointing to host Supabase instance
		await sandbox.writeFiles({
			".mcp.json": JSON.stringify(
				{
					mcpServers: {
						supabase: { type: "http", url: `${supabaseUrl}/mcp` },
					},
				},
				null,
				"\t",
			),
		});

		// 4. Write eval-utils.ts into the workspace so EVAL.ts can import it
		//    (agent-eval only copies the fixture's own directory into the sandbox)
		const evalUtilsPath = join(EVALS_ROOT, "evals", "eval-utils.ts");
		if (existsSync(evalUtilsPath)) {
			await sandbox.writeFiles({
				"eval-utils.ts": readFileSync(evalUtilsPath, "utf-8"),
			});
		}

		// 5. Install skill files (unless baseline mode)
		if (!isBaseline) {
			await sandbox.writeFiles(readSkillFiles());
		}
	},
};

export default config;
