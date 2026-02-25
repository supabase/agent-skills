import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Directory that contains the eval Supabase project (supabase/config.toml).
 * The runner starts the shared Supabase instance from here.
 * Agent workspaces get a copy of supabase/config.toml so they can
 * connect to the same running instance via `supabase db push`.
 */
export const EVAL_PROJECT_DIR = resolve(__dirname, "..", "..", "project");

export interface SupabaseKeys {
	apiUrl: string;
	dbUrl: string;
	anonKey: string;
	serviceRoleKey: string;
}

/**
 * Start the local Supabase stack for the eval project.
 * Idempotent: if already running, the CLI prints a message and exits 0.
 */
export function startSupabase(): void {
	console.log("  Starting Supabase...");
	execFileSync("supabase", ["start", "--exclude", "studio,imgproxy,mailpit"], {
		cwd: EVAL_PROJECT_DIR,
		stdio: "inherit",
		timeout: 5 * 60 * 1000, // 5 min for first image pull
	});
}

// SQL that clears all user-created objects and migration history between scenarios.
// Avoids `supabase db reset` which restarts containers and triggers flaky health checks.
const RESET_SQL = `
  -- Drop and recreate public schema (removes all user tables/views/functions)
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO postgres;
  GRANT ALL ON SCHEMA public TO anon;
  GRANT ALL ON SCHEMA public TO authenticated;
  GRANT ALL ON SCHEMA public TO service_role;

  -- Clear migration history so the next agent's db push starts from a clean slate
  DROP SCHEMA IF EXISTS supabase_migrations CASCADE;

  -- Notify PostgREST to reload its schema cache
  NOTIFY pgrst, 'reload schema';
`.trim();

/**
 * Reset the database to a clean state between scenarios.
 *
 * Uses direct SQL via psql instead of `supabase db reset` to avoid the
 * container-restart cycle and its flaky health checks. This drops the
 * public schema (all user tables) and clears the migration history so
 * `supabase db push` in agent workspaces always starts fresh.
 */
export function resetDB(dbUrl: string): void {
	execFileSync("psql", [dbUrl, "--no-psqlrc", "-c", RESET_SQL], {
		stdio: "inherit",
		timeout: 30 * 1000,
	});
}

/**
 * Stop all Supabase containers for the eval project.
 * Called once after all scenarios complete.
 */
export function stopSupabase(): void {
	console.log("  Stopping Supabase...");
	execFileSync("supabase", ["stop", "--no-backup"], {
		cwd: EVAL_PROJECT_DIR,
		stdio: "inherit",
		timeout: 60 * 1000,
	});
}

/**
 * Read the running instance's API URL and JWT keys.
 * Returns values that the runner injects into process.env so EVAL.ts
 * tests can connect to the real database.
 */
export function getKeys(): SupabaseKeys {
	const raw = execFileSync("supabase", ["status", "--output", "json"], {
		cwd: EVAL_PROJECT_DIR,
		timeout: 30 * 1000,
	}).toString();

	const status = JSON.parse(raw) as Record<string, string>;

	const apiUrl = status.API_URL ?? "http://127.0.0.1:54321";
	const dbUrl =
		status.DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
	const anonKey = status.ANON_KEY ?? "";
	const serviceRoleKey = status.SERVICE_ROLE_KEY ?? "";

	if (!anonKey || !serviceRoleKey) {
		throw new Error(
			`supabase status returned missing keys. Raw output:\n${raw}`,
		);
	}

	return { apiUrl, dbUrl, anonKey, serviceRoleKey };
}
