export const expectedReferenceFiles = [
	"db-rls-views.md",
	"db-migrations-idempotent.md",
	"db-rls-mandatory.md",
	"db-rls-performance.md",
	"db-schema-timestamps.md",
];

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { EvalAssertion } from "../../src/eval-types.js";

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

export const assertions: EvalAssertion[] = [
	{
		name: "new migration file exists",
		check: () => findAgentMigrationFiles().length > 0,
	},
	{
		name: "ADD COLUMN IF NOT EXISTS for description",
		check: () =>
			/add\s+column\s+if\s+not\s+exists\s+description/.test(
				getAgentMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "ADD COLUMN IF NOT EXISTS for published_at",
		check: () =>
			/add\s+column\s+if\s+not\s+exists\s+published_at/.test(
				getAgentMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "published_at uses timestamptz not plain timestamp",
		check: () => {
			const sql = getAgentMigrationSQL().toLowerCase();
			return (
				/published_at\s+timestamptz|published_at\s+timestamp\s+with\s+time\s+zone/.test(
					sql,
				) &&
				!/published_at\s+timestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/.test(
					sql,
				)
			);
		},
	},
	{
		name: "view public_products is created",
		check: () =>
			/create\s+(or\s+replace\s+)?view\s+public_products/.test(
				getAgentMigrationSQL().toLowerCase(),
			),
	},
	{
		name: "view uses security_invoker = true",
		check: () =>
			/security_invoker\s*=\s*true/.test(getAgentMigrationSQL().toLowerCase()),
	},
	{
		name: "SELECT policy on products for authenticated role",
		check: () => {
			const sql = getAgentMigrationSQL().toLowerCase();
			const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
			return policyBlocks.some(
				(p) =>
					p.includes("select") &&
					p.includes("products") &&
					/to\s+authenticated/.test(p),
			);
		},
	},
	{
		name: "NOTIFY pgrst reload schema is present",
		check: () => /notify\s+pgrst/.test(getAgentMigrationSQL().toLowerCase()),
	},
	{
		name: "overall quality: demonstrates PostgREST and schema best practices",
		check: () => {
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
			return signals.filter(Boolean).length >= 5;
		},
	},
];
