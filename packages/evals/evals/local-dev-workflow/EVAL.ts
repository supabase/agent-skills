import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

import {
	anonSeesNoRows,
	findMigrationFiles,
	getMigrationSQL,
	getSupabaseDir,
	queryTable,
	tableExists,
} from "./eval-utils.ts";

test("supabase project initialized (config.toml exists)", () => {
	expect(existsSync(join(getSupabaseDir(), "config.toml"))).toBe(true);
});

test("migration file exists in supabase/migrations/", () => {
	expect(findMigrationFiles().length > 0).toBe(true);
});

test("creates posts table", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(/create\s+table/.test(sql) && /posts/.test(sql)).toBe(true);
});

test("enables RLS on posts table", () => {
	expect(
		/alter\s+table.*posts.*enable\s+row\s+level\s+security/.test(
			getMigrationSQL().toLowerCase(),
		),
	).toBe(true);
});

test("has foreign key to auth.users", () => {
	expect(/references\s+auth\.users/.test(getMigrationSQL().toLowerCase())).toBe(
		true,
	);
});

test("uses ON DELETE CASCADE for auth FK", () => {
	expect(/on\s+delete\s+cascade/.test(getMigrationSQL().toLowerCase())).toBe(
		true,
	);
});

test("uses (select auth.uid()) not bare auth.uid() in policies", () => {
	const sql = getMigrationSQL();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	for (const policy of policyBlocks) {
		if (
			policy.includes("auth.uid()") &&
			!/\(\s*select\s+auth\.uid\(\)\s*\)/i.test(policy)
		) {
			expect(false).toBe(true);
			return;
		}
	}
	expect(true).toBe(true);
});

test("policies use TO authenticated", () => {
	const sql = getMigrationSQL().toLowerCase();
	const policyBlocks = sql.match(/create\s+policy[\s\S]*?;/gi) ?? [];
	expect(
		policyBlocks.length > 0 &&
			policyBlocks.every((p) => /to\s+authenticated/.test(p)),
	).toBe(true);
});

test("uses timestamptz not plain timestamp for time columns", () => {
	const rawSql = getMigrationSQL().toLowerCase();
	const sql = rawSql.replace(/--[^\n]*/g, "");
	const hasPlainTimestamp = /\btimestamp\b(?!\s*tz)(?!\s+with\s+time\s+zone)/;
	if (
		sql.includes("created_at") ||
		sql.includes("updated_at") ||
		sql.includes("published_at")
	) {
		expect(hasPlainTimestamp.test(sql)).toBe(false);
	} else {
		expect(true).toBe(true);
	}
});

test("creates index on user_id column", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(/create\s+index/.test(sql) && /user_id/.test(sql)).toBe(true);
});

test("does not use SERIAL or BIGSERIAL for primary key", () => {
	const sql = getMigrationSQL().toLowerCase();
	expect(/\bserial\b/.test(sql)).toBe(false);
	expect(/\bbigserial\b/.test(sql)).toBe(false);
});

test("types file generated", () => {
	const cwd = process.cwd();
	const candidates = ["types.ts", "types.gen.ts", "database.types.ts"];
	const found = candidates.some((f) => existsSync(join(cwd, f)));
	expect(found).toBe(true);
});

test("posts table exists in the database after migration", async () => {
	expect(await tableExists("posts")).toBe(true);
}, 10_000);

test("posts table is queryable with service role", async () => {
	const { error } = await queryTable("posts", "service_role");
	expect(error === null).toBe(true);
}, 10_000);

test("posts table returns no rows for anon (RLS is active)", async () => {
	expect(await anonSeesNoRows("posts")).toBe(true);
}, 10_000);

test("overall quality: demonstrates Supabase best practices", () => {
	const sql = getMigrationSQL().toLowerCase();
	const signals = [
		/enable\s+row\s+level\s+security/,
		/\(select\s+auth\.uid\(\)\)/,
		/to\s+authenticated/,
		/on\s+delete\s+cascade/,
		/create\s+index/,
	];
	expect(signals.filter((r) => r.test(sql)).length >= 4).toBe(true);
});

// expectedReferenceFiles: files the agent should read during this eval
// dev-getting-started.md, dev-local-workflow.md, dev-cli-vs-mcp.md,
// db-rls-mandatory.md, db-migrations-idempotent.md
