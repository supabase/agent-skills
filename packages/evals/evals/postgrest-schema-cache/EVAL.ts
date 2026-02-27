import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const STARTER_MIGRATION = "20240101000000_create_products.sql";

function findAgentMigrationFiles(): string[] {
	if (!existsSync(migrationsDir)) return [];
	return readdirSync(migrationsDir)
		.filter((f) => f.endsWith(".sql") && f !== STARTER_MIGRATION)
		.map((f) => join(migrationsDir, f));
}

function getAgentMigrationSQL(): string {
	const files = findAgentMigrationFiles();
	if (files.length === 0)
		throw new Error(
			"No agent-created migration file found in supabase/migrations/",
		);
	return files.map((f) => readFileSync(f, "utf-8")).join("\n");
}

test("new migration file exists", () => {
	expect(findAgentMigrationFiles().length > 0).toBe(true);
});

test("ADD COLUMN IF NOT EXISTS for description", () => {
	expect(
		/add\s+column\s+if\s+not\s+exists\s+description/.test(
			getAgentMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("ADD COLUMN IF NOT EXISTS for published_at", () => {
	expect(
		/add\s+column\s+if\s+not\s+exists\s+published_at/.test(
			getAgentMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("published_at uses timestamptz not plain timestamp", () => {
	const sql = getAgentMigrationSQL().toLowerCase();
	expect(
		/published_at\s+timestamptz|published_at\s+timestamp\s+with\s+time\s+zone/.test(
			sql,
		) &&
			!/published_at\s+timestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/.test(sql),
	).toBe(true);
});

test("view public_products is created", () => {
	expect(
		/create\s+(or\s+replace\s+)?view\s+public_products/.test(
			getAgentMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("view uses security_invoker = true", () => {
	expect(
		/security_invoker\s*=\s*true/.test(getAgentMigrationSQL().toLowerCase()),
	).toBe(true);
});

test("SELECT policy on products for authenticated role", () => {
	const sql = getAgentMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	expect(
		policyBlocks.some(
			(p) =>
				p.includes("select") &&
				p.includes("products") &&
				/to\s+authenticated/.test(p),
		),
	).toBe(true);
});

test("NOTIFY pgrst reload schema is present", () => {
	expect(/notify\s+pgrst/.test(getAgentMigrationSQL().toLowerCase())).toBe(
		true,
	);
});

test("overall quality: demonstrates PostgREST and schema best practices", () => {
	const sql = getAgentMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	const signals = [
		/add\s+column\s+if\s+not\s+exists/.test(sql),
		/published_at\s+timestamptz|published_at\s+timestamp\s+with\s+time\s+zone/.test(
			sql,
		),
		/create\s+(or\s+replace\s+)?view\s+public_products/.test(sql),
		/security_invoker\s*=\s*true/.test(sql),
		policyBlocks.some(
			(p) => p.includes("select") && /to\s+authenticated/.test(p),
		),
		/notify\s+pgrst/.test(sql),
	];
	expect(signals.filter(Boolean).length >= 5).toBe(true);
});
