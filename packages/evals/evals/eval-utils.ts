import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Common paths
// ---------------------------------------------------------------------------

export const supabaseDir = join(process.cwd(), "supabase");
export const migrationsDir = join(supabaseDir, "migrations");
export const functionsDir = join(supabaseDir, "functions");

// ---------------------------------------------------------------------------
// Migration helpers
// ---------------------------------------------------------------------------

/** Find all .sql migration files (agent may create one or more). */
export function findMigrationFiles(): string[] {
	if (!existsSync(migrationsDir)) return [];
	return readdirSync(migrationsDir)
		.filter((f) => f.endsWith(".sql"))
		.map((f) => join(migrationsDir, f));
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
	const fnDir = join(functionsDir, functionName);
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
	if (!existsSync(functionsDir)) return null;
	const sharedDirs = readdirSync(functionsDir).filter(
		(d) => d.startsWith("_") && statSync(join(functionsDir, d)).isDirectory(),
	);
	for (const dir of sharedDirs) {
		const dirPath = join(functionsDir, dir);
		const files = readdirSync(dirPath).filter((f) => f.includes("cors"));
		if (files.length > 0) return join(dirPath, files[0]);
	}
	return null;
}

/** Read and concatenate all .ts/.tsx files from _-prefixed shared directories. */
export function getSharedCode(): string {
	if (!existsSync(functionsDir)) return "";
	const sharedDirs = readdirSync(functionsDir).filter(
		(d) => d.startsWith("_") && statSync(join(functionsDir, d)).isDirectory(),
	);
	const parts: string[] = [];
	for (const dir of sharedDirs) {
		const dirPath = join(functionsDir, dir);
		const files = readdirSync(dirPath).filter(
			(f) => f.endsWith(".ts") || f.endsWith(".tsx"),
		);
		for (const f of files) {
			parts.push(readFileSync(join(dirPath, f), "utf-8"));
		}
	}
	return parts.join("\n");
}
