import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Runtime DB helpers (use only in async tests)
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";

/** Execute a raw SQL query via PostgREST's /rpc endpoint or via the REST API. */
async function pgRest(
	table: string,
	options: { select?: string; role?: "service_role" | "anon" } = {},
): Promise<{ data: Record<string, unknown>[]; error: string | null }> {
	const key = options.role === "anon" ? ANON_KEY : SERVICE_KEY;
	const select = options.select ?? "*";
	const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}`, {
		headers: {
			apikey: key,
			Authorization: `Bearer ${key}`,
			"Content-Type": "application/json",
		},
	});

	if (!res.ok) {
		const body = await res.text();
		return { data: [], error: `HTTP ${res.status}: ${body}` };
	}

	const data = (await res.json()) as Record<string, unknown>[];
	return { data, error: null };
}

/**
 * Check whether a table is visible through the PostgREST API.
 * Uses the service role key (bypasses RLS).
 */
export async function tableExists(tableName: string): Promise<boolean> {
	const { error } = await pgRest(tableName);
	// A 404 or PGRST116 means the table/view doesn't exist in the schema cache.
	return error === null || !error.includes("404");
}

/**
 * Query rows from a table.
 * @param tableName - table to query
 * @param role - "service_role" bypasses RLS; "anon" respects RLS policies
 */
export async function queryTable(
	tableName: string,
	role: "service_role" | "anon" = "service_role",
): Promise<{ data: Record<string, unknown>[]; error: string | null }> {
	return pgRest(tableName, { role });
}

/**
 * Return true if the table exists AND is empty when queried as anon
 * (i.e., RLS is blocking access as expected for an unauthenticated user).
 */
export async function anonSeeesNoRows(tableName: string): Promise<boolean> {
	const { data, error } = await pgRest(tableName, { role: "anon" });
	return error === null && data.length === 0;
}

// ---------------------------------------------------------------------------
// Common paths
//
// These are FUNCTIONS, not constants, so they re-evaluate process.cwd() on
// every call. The runner does `process.chdir(workspacePath)` before running
// assertions, so all path helpers resolve relative to the correct workspace.
// ---------------------------------------------------------------------------

/** Returns the supabase/ directory under the current working directory. */
export function getSupabaseDir(): string {
	return join(process.cwd(), "supabase");
}

/** Returns the supabase/migrations/ directory. */
export function getMigrationsDir(): string {
	return join(getSupabaseDir(), "migrations");
}

/** Returns the supabase/functions/ directory. */
export function getFunctionsDir(): string {
	return join(getSupabaseDir(), "functions");
}

// ---------------------------------------------------------------------------
// Migration helpers
// ---------------------------------------------------------------------------

/** Find all .sql migration files (agent may create one or more). */
export function findMigrationFiles(): string[] {
	const dir = getMigrationsDir();
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((f) => f.endsWith(".sql"))
		.map((f) => join(dir, f));
}

/** Read and concatenate all migration SQL files. */
export function getMigrationSQL(): string {
	const files = findMigrationFiles();
	if (files.length === 0)
		throw new Error("No migration file found in supabase/migrations/");
	return files.map((f) => readFileSync(f, "utf-8")).join("\n");
}

// ---------------------------------------------------------------------------
// Edge Function helpers
// ---------------------------------------------------------------------------

/**
 * Find the index.ts/tsx entry file for a named Edge Function.
 *
 * @param functionName - directory name under supabase/functions/ (e.g. "hello-world")
 */
export function findFunctionFile(functionName: string): string | null {
	const fnDir = join(getFunctionsDir(), functionName);
	if (!existsSync(fnDir)) return null;
	const files = readdirSync(fnDir).filter(
		(f) => f.startsWith("index.") && (f.endsWith(".ts") || f.endsWith(".tsx")),
	);
	return files.length > 0 ? join(fnDir, files[0]) : null;
}

/**
 * Read the source code of a named Edge Function.
 *
 * @param functionName - directory name under supabase/functions/ (e.g. "stripe-webhook")
 */
export function getFunctionCode(functionName: string): string {
	const file = findFunctionFile(functionName);
	if (!file)
		throw new Error(`No index.ts found in supabase/functions/${functionName}/`);
	return readFileSync(file, "utf-8");
}

/** Find a shared CORS module under supabase/functions/_shared/ (or similar _-prefixed dir). */
export function findSharedCorsFile(): string | null {
	const fnDir = getFunctionsDir();
	if (!existsSync(fnDir)) return null;
	const sharedDirs = readdirSync(fnDir).filter(
		(d) => d.startsWith("_") && statSync(join(fnDir, d)).isDirectory(),
	);
	for (const dir of sharedDirs) {
		const dirPath = join(fnDir, dir);
		const files = readdirSync(dirPath).filter((f) => f.includes("cors"));
		if (files.length > 0) return join(dirPath, files[0]);
	}
	return null;
}

/** Read and concatenate all .ts/.tsx files from _-prefixed shared directories. */
export function getSharedCode(): string {
	const fnDir = getFunctionsDir();
	if (!existsSync(fnDir)) return "";
	const sharedDirs = readdirSync(fnDir).filter(
		(d) => d.startsWith("_") && statSync(join(fnDir, d)).isDirectory(),
	);
	const parts: string[] = [];
	for (const dir of sharedDirs) {
		const dirPath = join(fnDir, dir);
		const files = readdirSync(dirPath).filter(
			(f) => f.endsWith(".ts") || f.endsWith(".tsx"),
		);
		for (const f of files) {
			parts.push(readFileSync(join(dirPath, f), "utf-8"));
		}
	}
	return parts.join("\n");
}
